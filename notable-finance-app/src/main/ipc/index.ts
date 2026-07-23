import { ipcMain } from 'electron'
import type {
  ApiResult,
  CreateExpenseInput,
  CreateIncomeInput,
  CreateSchedulerInput,
  HealthData,
  IncomeListParams,
  ExpenseListParams,
  UpdateExpenseInput,
  UpdateIncomeInput,
  UpdateSchedulerInput
} from '../../shared/finance.types'
import { getDbPath, listTables } from '../db'
import * as repo from '../db/repositories'
import * as reports from '../services/reports'
import { getHistory } from '../services/history'
import * as notion from '../notion/service'
import { getMapping, saveMapping } from '../notion/mapping-store'
import {
  getSyncSettings,
  listConflicts,
  pullAll,
  resolveConflict,
  setSyncSettings,
  syncNow,
  syncStatus
} from '../sync'
import { reschedule } from '../sync/scheduler'
import { broadcast, createWindow } from '../windows'
import { ValidationError } from '../domain/validation'
import type {
  ConflictResolution,
  NotionMapping,
  SyncSettings
} from '../../shared/finance.types'

// IPC surface per wiki/desktop/ipc-contract.md. Every response is the discriminated
// ApiResult envelope; all validation happens here in main (renderer is untrusted).
// Writes broadcast records:changed + derived:updated to ALL windows (Phase 1.5).

async function result<T>(fn: () => T | Promise<T>): Promise<ApiResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (error) {
    return {
      ok: false,
      error: {
        code: error instanceof ValidationError ? error.code : 'E_IPC_HANDLER',
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

function changed(resource: 'incomes' | 'expenses' | 'expenseScheduler', ids: string[]): void {
  broadcast('records:changed', { resource, ids })
  broadcast('derived:updated', {})
}

export function registerIpc(): void {
  // liveness + local store health (Phase 0.4)
  ipcMain.handle('app:ping', () => result(() => 'pong' as const))
  ipcMain.handle('db:health', () =>
    result<HealthData>(() => ({ dbPath: getDbPath(), tables: listTables() }))
  )

  // accounts (read-only reference; balances computed in main)
  ipcMain.handle('accounts:list', (_e, params?: { includeInactive?: boolean }) =>
    result(() => repo.listAccounts(params?.includeInactive ?? false))
  )

  // categories (read-only selectors)
  ipcMain.handle('categories:income', () => result(() => repo.listIncomeCategories()))
  ipcMain.handle('categories:expense', () => result(() => repo.listExpenseCategories()))

  // incomes + income-backed views
  ipcMain.handle('incomes:list', (_e, params?: IncomeListParams) =>
    result(() => repo.listIncomes(params))
  )
  ipcMain.handle('incomes:create', (_e, input: CreateIncomeInput) =>
    result(() => {
      const record = repo.createIncome(input)
      changed('incomes', [record.id])
      return record
    })
  )
  ipcMain.handle('incomes:update', (_e, id: string, patch: UpdateIncomeInput) =>
    result(() => {
      const record = repo.updateIncome(id, patch)
      changed('incomes', [id])
      return record
    })
  )
  ipcMain.handle('incomes:softDelete', (_e, id: string) =>
    result(() => {
      const record = repo.softDeleteIncome(id)
      changed('incomes', [id])
      return record
    })
  )

  // expenses
  ipcMain.handle('expenses:list', (_e, params?: ExpenseListParams) =>
    result(() => repo.listExpenses(params))
  )
  ipcMain.handle('expenses:create', (_e, input: CreateExpenseInput) =>
    result(() => {
      const record = repo.createExpense(input)
      changed('expenses', [record.id])
      return record
    })
  )
  ipcMain.handle('expenses:update', (_e, id: string, patch: UpdateExpenseInput) =>
    result(() => {
      const record = repo.updateExpense(id, patch)
      changed('expenses', [id])
      return record
    })
  )
  ipcMain.handle('expenses:softDelete', (_e, id: string) =>
    result(() => {
      const record = repo.softDeleteExpense(id)
      changed('expenses', [id])
      return record
    })
  )

  // expense scheduler
  ipcMain.handle('scheduler:list', () => result(() => repo.listScheduler()))
  ipcMain.handle('scheduler:create', (_e, input: CreateSchedulerInput) =>
    result(() => {
      const record = repo.createScheduler(input)
      changed('expenseScheduler', [record.id])
      return record
    })
  )
  ipcMain.handle('scheduler:update', (_e, id: string, patch: UpdateSchedulerInput) =>
    result(() => {
      const record = repo.updateScheduler(id, patch)
      changed('expenseScheduler', [id])
      return record
    })
  )
  ipcMain.handle('scheduler:softDelete', (_e, id: string) =>
    result(() => {
      const record = repo.softDeleteScheduler(id)
      changed('expenseScheduler', [id])
      return record
    })
  )
  ipcMain.handle('scheduler:generate', (_e, id: string) =>
    result(() => {
      const expense = repo.generateFromScheduler(id)
      changed('expenses', [expense.id])
      changed('expenseScheduler', [id])
      return expense
    })
  )

  // history (unsynced items + completed sync activity feed)
  ipcMain.handle('history:get', (_e, runs?: number) => result(() => getHistory(runs)))

  // reports (computed locally, Phase 1.3)
  ipcMain.handle('reports:dashboard', (_e, month: string) =>
    result(() => reports.dashboard(month))
  )
  ipcMain.handle('reports:monthlyMonitoring', (_e, month: string) =>
    result(() => reports.monitoring(month))
  )

  // windows (Phase 1.5)
  ipcMain.handle('windows:new', () =>
    result(() => {
      createWindow()
      return true as const
    })
  )

  // notion onboarding (Phase 2.1/2.2) — the token goes IN once; nothing returns it.
  ipcMain.handle('notion:connect', (_e, token: string) => result(() => notion.connect(token)))
  ipcMain.handle('notion:isConnected', () => result(() => notion.isConnected()))
  ipcMain.handle('notion:disconnect', () =>
    result(() => {
      notion.disconnect()
      return true as const
    })
  )
  ipcMain.handle('notion:discoverDatabases', () => result(() => notion.discoverDatabases()))
  ipcMain.handle('notion:getMapping', () => result(() => getMapping()))
  ipcMain.handle('notion:saveMapping', (_e, mapping: NotionMapping) =>
    result(() => {
      saveMapping(mapping)
      return true as const
    })
  )
  ipcMain.handle('notion:verifySchema', () => result(() => notion.verifySchema()))

  // sync (Phase 2.3 push + Phase 3 pull + Phase 4 reconcile)
  ipcMain.handle('sync:status', () => result(() => syncStatus()))
  ipcMain.handle('sync:now', () => result(() => syncNow())) // reconcile (pull) then push
  ipcMain.handle('sync:initialPull', () => result(() => pullAll(true))) // full pull (onboarding)
  ipcMain.handle('sync:getSettings', () => result(() => getSyncSettings()))
  ipcMain.handle('sync:setMode', (_e, patch: Partial<SyncSettings>) =>
    result(() => {
      const settings = setSyncSettings(patch)
      reschedule() // re-arm the auto-sync timer
      broadcast('sync:status', syncStatus())
      return settings
    })
  )

  // conflicts (Phase 4.2)
  ipcMain.handle('sync:listConflicts', () => result(() => listConflicts()))
  ipcMain.handle('sync:resolveConflict', (_e, table: 'incomes' | 'expenses', id: string, resolution: ConflictResolution) =>
    result(() => {
      resolveConflict(table, id, resolution)
      broadcast('records:changed', { resource: table, ids: [id] })
      broadcast('derived:updated', {})
      broadcast('sync:status', syncStatus())
      return listConflicts()
    })
  )
}
