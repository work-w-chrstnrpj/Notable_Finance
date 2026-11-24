import { BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import type { BudgetExportRequest } from '../../shared/finance.types'
import { listPeriodBudgets, listSavedBudgets } from '../db/budgets'
import { exportBudgetsCsv } from '../services/budget-files'
import {
  addMissingColumns,
  checkSavedBudgetsDatabase,
  getMirrorStatus,
  refreshMirrorColumns,
  syncCustomBudgets
} from '../notion/saved-budgets-mirror'
import { handle } from './handle'
import { result } from './shared'

/**
 * Custom monthly budgets (ADR-0010): Notion is the source of truth; the local table is a read-only cache. Only the `mirror*`
 * handlers call Notion, and none touches the record sync tables. File dialogs and paths stay in main. There is no handler that edits budgets in the app.
 */
export function registerBudgetsIpc(): void {
  handle(IPC_CHANNELS.budgetsList, (_e, range?: { fromMonth?: string; toMonth?: string }) =>
    result(() => listSavedBudgets(range?.fromMonth, range?.toMonth))
  )
  handle(IPC_CHANNELS.budgetsListPeriods, () => result(() => listPeriodBudgets()))
  handle(IPC_CHANNELS.budgetsExportCsv, (event, req: BudgetExportRequest) =>
    result(() => exportBudgetsCsv(req, BrowserWindow.fromWebContents(event.sender)))
  )

  handle(IPC_CHANNELS.budgetsMirrorStatus, () => result(() => getMirrorStatus()))
  handle(IPC_CHANNELS.budgetsMirrorRefresh, () => result(() => refreshMirrorColumns()))
  handle(IPC_CHANNELS.budgetsMirrorCheckDatabase, (_e, databaseId: string) =>
    result(() => checkSavedBudgetsDatabase(String(databaseId ?? '').trim()))
  )
  handle(IPC_CHANNELS.budgetsMirrorAddColumns, () => result(() => addMissingColumns()))
  handle(IPC_CHANNELS.budgetsMirrorRun, () => result(() => syncCustomBudgets()))
}
