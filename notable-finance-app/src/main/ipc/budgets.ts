import { BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import type {
  BudgetExportRequest,
  BudgetImportPolicy,
  SavedBudgetInput
} from '../../shared/finance.types'
import {
  deleteBudgetSet,
  listSavedBudgets,
  replaceBudgetSet,
  saveBudgetsFromNotion
} from '../db/budgets'
import { commitBudgetImport, exportBudgetsCsv, previewBudgetImport } from '../services/budget-files'
import { logDevOperation } from '../dev-logs/store'
import { handle } from './handle'
import { result } from './shared'

/**
 * Saved budgets (ADR-0006): local only. No handler here calls Notion, and none touches the sync
 * tables. File dialogs and paths stay in main; the renderer only gets a preview id back.
 */
export function registerBudgetsIpc(): void {
  handle(IPC_CHANNELS.budgetsList, (_e, range?: { fromMonth?: string; toMonth?: string }) =>
    result(() => listSavedBudgets(range?.fromMonth, range?.toMonth))
  )
  handle(IPC_CHANNELS.budgetsSaveFromNotion, (_e, month: string, replace?: boolean) =>
    result(() => {
      const out = saveBudgetsFromNotion(month, replace === true)
      logDevOperation('budgets:save', 'Saved budgets for a month from Notion', { month, saved: out.saved })
      return out
    })
  )
  handle(IPC_CHANNELS.budgetsSaveSet, (_e, month: string, rows: SavedBudgetInput[]) =>
    result(() => {
      const out = replaceBudgetSet(month, rows)
      logDevOperation('budgets:save', 'Saved budgets for a month', { month, saved: out.saved })
      return out
    })
  )
  handle(IPC_CHANNELS.budgetsDeleteSet, (_e, month: string) =>
    result(() => {
      const out = deleteBudgetSet(month)
      logDevOperation('budgets:delete', 'Deleted saved budgets for a month', { month, deleted: out.deleted })
      return out
    })
  )
  handle(IPC_CHANNELS.budgetsExportCsv, (event, req: BudgetExportRequest) =>
    result(() => exportBudgetsCsv(req, BrowserWindow.fromWebContents(event.sender)))
  )
  handle(
    IPC_CHANNELS.budgetsImportPreview,
    (event, opts: { previewId?: string; policy: BudgetImportPolicy }) =>
      result(() => previewBudgetImport(opts, BrowserWindow.fromWebContents(event.sender)))
  )
  handle(IPC_CHANNELS.budgetsImportCommit, (_e, opts: { previewId: string; policy: BudgetImportPolicy }) =>
    result(async () => {
      const out = await commitBudgetImport(opts)
      logDevOperation('budgets:import', 'Imported saved budgets from CSV', {
        written: out.written,
        months: out.months
      })
      return out
    })
  )
}
