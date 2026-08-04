import type { ConflictResolution, SyncSettings } from '../../shared/finance.types'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import {
  getSyncSettings,
  listConflicts,
  pullAll,
  pushAll,
  resetDatabase,
  resolveAllConflicts,
  resolveConflict,
  setSyncSettings,
  syncNow,
  syncStatus
} from '../sync'
import { reschedule } from '../sync/scheduler'
import { exportBackup, importBackup, inspectBackup } from '../services/backup'
import { broadcast } from '../windows'
import { logDevOperation } from '../dev-logs/store'
import { handle } from './handle'
import { result } from './shared'

/**
 * Notion sync (push/pull/reconcile), conflict resolution, and local database backup/restore.
 * refactor_development_plan.md Phase 7.1 — pure move out of ipc/index.ts, unchanged.
 */
export function registerSyncIpc(): void {
  // sync (Phase 2.3 push + Phase 3 pull + Phase 4 reconcile)
  handle(IPC_CHANNELS.syncStatus, () => result(() => syncStatus()))
  handle(IPC_CHANNELS.syncNow, (_e, since?: string) => result(() => syncNow(since))) // reconcile (pull) then push
  handle(IPC_CHANNELS.syncPull, (_e, since?: string) => result(() => pullAll(false, since))) // Notion → App only
  handle(IPC_CHANNELS.syncPush, () => result(() => pushAll())) // App → Notion only

  // Local database backup / restore (Phase 7.2) — import swaps the live file,
  // so the renderer reloads its window after a successful import.
  handle(IPC_CHANNELS.backupExport, (_e, opts?: { path?: string }) =>
    result(() => exportBackup(opts?.path))
  )
  handle(IPC_CHANNELS.backupInspect, (_e, opts?: { path?: string }) =>
    result(() => inspectBackup(opts?.path))
  )
  handle(IPC_CHANNELS.backupImport, (_e, path: string) =>
    result(async () => {
      const out = await importBackup(path)
      if (out.valid) {
        // Fresh data everywhere: records, derived values, sync status.
        broadcast('records:changed', { resource: 'incomes', ids: [] })
        broadcast('records:changed', { resource: 'expenses', ids: [] })
        broadcast('derived:updated', {})
        broadcast('sync:status', syncStatus())
        logDevOperation('backup:import', 'Imported local database backup', {
          path,
          appVersion: out.meta?.appVersion ?? null
        })
      }
      return out
    })
  )

  handle(IPC_CHANNELS.syncInitialPull, () => result(() => pullAll(true))) // full pull (onboarding)
  handle(IPC_CHANNELS.syncReset, () => result(() => resetDatabase())) // wipe local + re-pull
  handle(IPC_CHANNELS.syncGetSettings, () => result(() => getSyncSettings()))
  handle(IPC_CHANNELS.syncSetMode, (_e, patch: Partial<SyncSettings>) =>
    result(() => {
      const settings = setSyncSettings(patch)
      reschedule() // re-arm the auto-sync timer
      broadcast('sync:status', syncStatus())
      return settings
    })
  )

  // conflicts (Phase 4.2)
  handle(IPC_CHANNELS.syncListConflicts, () => result(() => listConflicts()))
  handle(IPC_CHANNELS.syncResolveAllConflicts, (_e, resolution: 'local' | 'remote') =>
    result(() => {
      const remaining = resolveAllConflicts(resolution)
      broadcast('records:changed', { resource: 'incomes', ids: [] })
      broadcast('records:changed', { resource: 'expenses', ids: [] })
      broadcast('derived:updated', {})
      broadcast('sync:status', syncStatus())
      return remaining
    }))

  handle(IPC_CHANNELS.syncResolveConflict, (_e, table: 'incomes' | 'expenses', id: string, resolution: ConflictResolution) =>
    result(() => {
      resolveConflict(table, id, resolution)
      broadcast('records:changed', { resource: table, ids: [id] })
      broadcast('derived:updated', {})
      broadcast('sync:status', syncStatus())
      return listConflicts()
    })
  )
}
