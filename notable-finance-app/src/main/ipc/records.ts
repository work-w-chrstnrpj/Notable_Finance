import type {
  CreateExpenseInput,
  CreateIncomeInput,
  CreateSchedulerInput,
  DevLogKind,
  HealthData,
  IncomeListParams,
  ExpenseListParams,
  PageContentResource,
  UpdateExpenseInput,
  UpdateIncomeInput,
  UpdateSchedulerInput
} from '../../shared/finance.types'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { getDbPath, listTables } from '../db'
import * as repo from '../db/repositories'
import * as reports from '../services/reports'
import * as pageContent from '../services/page-content'
import { getHistory, getItemDetail } from '../services/history'
import { discardUnsynced } from '../services/discard-unsynced'
import { fetchMonitoringSplit } from '../notion/monitoring-split'
import { createWindow } from '../windows'
import { appendDevLog, clearDevLogs, listDevLogs, summarizeForDevLog } from '../dev-logs/store'
import { handle } from './handle'
import { changed, result } from './shared'

/**
 * Core finance records: dev logs, health, accounts, categories, incomes, expenses,
 * scheduler, history, reports, windows, page content. refactor_development_plan.md
 * Phase 7.1 — pure move out of ipc/index.ts, unchanged.
 */
export function registerRecordsIpc(): void {
  // Dev Mode logs (in-memory only; gated by settings.devModeEnabled inside store).
  handle(IPC_CHANNELS.devLogsList, (_e, limit?: number) =>
    result(() => listDevLogs(typeof limit === 'number' ? limit : undefined))
  )
  handle(IPC_CHANNELS.devLogsClear, () => result(() => clearDevLogs()))
  handle(
    IPC_CHANNELS.devLogsAppend,
    (
      _e,
      input: {
        kind: DevLogKind
        action: string
        message: string
        detail?: Record<string, unknown> | null
        ok?: boolean | null
      }
    ) =>
      result(() => {
        const entry = appendDevLog({
          kind: input.kind,
          source: 'renderer',
          action: input.action,
          message: input.message,
          detail: input.detail
            ? (summarizeForDevLog(input.detail) as Record<string, unknown>)
            : null,
          ok: input.ok ?? null
        })
        return entry
      })
  )

  // liveness + local store health (Phase 0.4)
  handle(IPC_CHANNELS.appPing, () => result(() => 'pong' as const))
  handle(IPC_CHANNELS.dbHealth, () =>
    result<HealthData>(() => ({ dbPath: getDbPath(), tables: listTables() }))
  )

  // accounts (read-only reference; balances computed in main)
  handle(IPC_CHANNELS.accountsList, (_e, params?: { includeInactive?: boolean }) =>
    result(() => repo.listAccounts(params?.includeInactive ?? false))
  )

  // categories (read-only selectors)
  handle(IPC_CHANNELS.categoriesIncome, () => result(() => repo.listIncomeCategories()))
  handle(IPC_CHANNELS.categoriesExpense, () => result(() => repo.listExpenseCategories()))

  // incomes + income-backed views
  handle(IPC_CHANNELS.incomesList, (_e, params?: IncomeListParams) =>
    result(() => repo.listIncomes(params))
  )
  handle(IPC_CHANNELS.incomesGet, (_e, id: string) =>
    result(() => repo.getIncome(id))
  )
  handle(IPC_CHANNELS.incomesCreate, (_e, input: CreateIncomeInput) =>
    result(() => {
      const record = repo.createIncome(input)
      changed('incomes', [record.id])
      return record
    })
  )
  handle(IPC_CHANNELS.incomesUpdate, (_e, id: string, patch: UpdateIncomeInput) =>
    result(() => {
      const record = repo.updateIncome(id, patch)
      changed('incomes', [id])
      return record
    })
  )
  handle(IPC_CHANNELS.incomesSoftDelete, (_e, id: string) =>
    result(() => {
      const record = repo.softDeleteIncome(id)
      changed('incomes', [id])
      return record
    })
  )
  handle(IPC_CHANNELS.incomesHardDelete, (_e, id: string) =>
    result(() => {
      repo.hardDeleteIncome(id)
      changed('incomes', [id])
      return true
    })
  )

  // expenses
  handle(IPC_CHANNELS.expensesList, (_e, params?: ExpenseListParams) =>
    result(() => repo.listExpenses(params))
  )
  handle(IPC_CHANNELS.expensesListForCCCoverage, () =>
    result(() => repo.listExpensesForCCCoverage())
  )
  handle(IPC_CHANNELS.expensesCreate, (_e, input: CreateExpenseInput) =>
    result(() => {
      const record = repo.createExpense(input)
      changed('expenses', [record.id])
      return record
    })
  )
  handle(IPC_CHANNELS.expensesUpdate, (_e, id: string, patch: UpdateExpenseInput) =>
    result(() => {
      const record = repo.updateExpense(id, patch)
      changed('expenses', [id])
      return record
    })
  )
  handle(IPC_CHANNELS.expensesSoftDelete, (_e, id: string) =>
    result(() => {
      const record = repo.softDeleteExpense(id)
      changed('expenses', [id])
      return record
    })
  )
  handle(IPC_CHANNELS.expensesHardDelete, (_e, id: string) =>
    result(() => {
      repo.hardDeleteExpense(id)
      changed('expenses', [id])
      return true
    })
  )

  // expense scheduler
  handle(IPC_CHANNELS.schedulerList, () => result(() => repo.listScheduler()))
  handle(IPC_CHANNELS.schedulerCreate, (_e, input: CreateSchedulerInput) =>
    result(() => {
      const record = repo.createScheduler(input)
      changed('expenseScheduler', [record.id])
      return record
    })
  )
  handle(IPC_CHANNELS.schedulerUpdate, (_e, id: string, patch: UpdateSchedulerInput) =>
    result(() => {
      const record = repo.updateScheduler(id, patch)
      changed('expenseScheduler', [id])
      return record
    })
  )
  handle(IPC_CHANNELS.schedulerSoftDelete, (_e, id: string) =>
    result(() => {
      const record = repo.softDeleteScheduler(id)
      changed('expenseScheduler', [id])
      return record
    })
  )
  handle(IPC_CHANNELS.schedulerHardDelete, (_e, id: string) =>
    result(() => {
      repo.hardDeleteScheduler(id)
      changed('expenseScheduler', [id])
      return true
    })
  )
  handle(IPC_CHANNELS.schedulerGenerate, (_e, id: string) =>
    result(() => {
      const expense = repo.generateFromScheduler(id)
      changed('expenses', [expense.id])
      changed('expenseScheduler', [id])
      return expense
    })
  )

  // history (unsynced items + completed sync activity feed)
  handle(IPC_CHANNELS.historyGet, (_e, runs?: number) => result(() => getHistory(runs)))
  handle(
    IPC_CHANNELS.historyDiscardUnsynced,
    (_e, resource: 'incomes' | 'expenses', recordId: string) =>
      result(() => {
        discardUnsynced(resource, recordId)
        changed(resource, [recordId])
        return true
      })
  )
  handle(IPC_CHANNELS.historyGetItemDetail, (_e, resource: 'incomes' | 'expenses', recordId: string) =>
    result(() => getItemDetail(resource, recordId))
  )

  // reports (computed locally, Phase 1.3)
  handle(IPC_CHANNELS.reportsDashboard, (_e, month: string) =>
    result(() => reports.dashboard(month))
  )
  handle(IPC_CHANNELS.reportsMonthlyMonitoring, (_e, month: string) =>
    result(() => reports.monitoring(month))
  )
  handle(IPC_CHANNELS.reportsMonitoringSplit, (_e, opts?: { forceRefresh?: boolean }) =>
    result(() => fetchMonitoringSplit(opts))
  )

  // windows (Phase 1.5)
  handle(IPC_CHANNELS.windowsNew, () =>
    result(() => {
      createWindow()
      return true as const
    })
  )

  // Page Content — Notion page body (block children) edited local-first as Markdown.
  handle(IPC_CHANNELS.pageContentGet, (_e, resource: PageContentResource, id: string) =>
    result(() => pageContent.getPageContent(resource, id))
  )
  handle(IPC_CHANNELS.pageContentSave, (_e, resource: PageContentResource, id: string, markdown: string) =>
    result(() => pageContent.savePageContent(resource, id, markdown))
  )
  handle(IPC_CHANNELS.pageContentClear, (_e, resource: PageContentResource, id: string) =>
    result(() => pageContent.clearPageContent(resource, id))
  )
}
