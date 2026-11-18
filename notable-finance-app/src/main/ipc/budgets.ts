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
    result(() => saveBudgetsFromNotion(month, replace === true))
  )
  handle(IPC_CHANNELS.budgetsSaveSet, (_e, month: string, rows: SavedBudgetInput[]) =>
    result(() => replaceBudgetSet(month, rows))
  )
  handle(IPC_CHANNELS.budgetsDeleteSet, (_e, month: string) => result(() => deleteBudgetSet(month)))
  handle(IPC_CHANNELS.budgetsExportCsv, (event, req: BudgetExportRequest) =>
    result(() => exportBudgetsCsv(req, BrowserWindow.fromWebContents(event.sender)))
  )
  handle(
    IPC_CHANNELS.budgetsImportPreview,
    (event, opts: { previewId?: string; policy: BudgetImportPolicy }) =>
      result(() => previewBudgetImport(opts, BrowserWindow.fromWebContents(event.sender)))
  )
  handle(IPC_CHANNELS.budgetsImportCommit, (_e, opts: { previewId: string; policy: BudgetImportPolicy }) =>
    result(() => commitBudgetImport(opts))
  )
}
