import { ipcMain } from 'electron'
import type { ApiResult, HealthData } from '../../shared/finance.types'
import { getDbPath, listTables } from '../db'

// Phase 0.4 IPC skeleton. Every handler returns the discriminated ApiResult envelope
// (see wiki/desktop/ipc-contract.md). The real namespaces (expenses.*, sync.*, …) are
// added in Phase 1+; this proves the renderer↔main boundary end to end.

async function result<T>(fn: () => T | Promise<T>): Promise<ApiResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'E_IPC_HANDLER',
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

export function registerIpc(): void {
  // no-op liveness channel
  ipcMain.handle('app:ping', () => result(() => 'pong' as const))
  // proves the SQLite store (Phase 0.2) is wired through IPC
  ipcMain.handle('db:health', () => result<HealthData>(() => ({
    dbPath: getDbPath(),
    tables: listTables()
  })))
}
