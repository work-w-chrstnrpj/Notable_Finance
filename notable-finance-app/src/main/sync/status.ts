// Shared sync status + the single "running" flag guarding concurrent passes.
import { net } from 'electron'
import { getSqlite } from '../db'
import { isConnected } from '../notion/service'
import { isMapped } from '../notion/mapping-store'
import { broadcast } from '../windows'
import { metaGet, META_KEYS } from './meta'
import { getSyncSettings } from './settings'
import type { SyncStatus } from '../../shared/finance.types'

let running = false
export const isRunning = (): boolean => running
export const setRunning = (value: boolean): void => {
  running = value
}

export function isOnline(): boolean {
  // Electron's net module reports OS-level connectivity without a probe request.
  return net.isOnline()
}

export function syncStatus(): SyncStatus {
  const db = getSqlite()
  const count = (table: string, state: string): number =>
    (db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE sync_state = ?`).get(state) as {
      n: number
    }).n
  const settings = getSyncSettings()
  const lastPushAt = metaGet(META_KEYS.lastPushAt)
  const lastPullAt = metaGet(META_KEYS.lastPullAt)
  const pendingHardDeletes = (
    db.prepare(`SELECT COUNT(*) AS n FROM mutation_queue WHERE action = 'hardDelete'`).get() as {
      n: number
    }
  ).n
  return {
    connected: isConnected(),
    mapped: isMapped(),
    online: isOnline(),
    running,
    mode: settings.mode,
    intervalSeconds: settings.intervalSeconds,
    dirtyCount: count('incomes', 'dirty') + count('expenses', 'dirty') + pendingHardDeletes,
    conflictCount: count('incomes', 'conflict') + count('expenses', 'conflict'),
    lastPushAt: lastPushAt ? Number(lastPushAt) : null,
    lastPullAt: lastPullAt ? Number(lastPullAt) : null,
    lastError: metaGet(META_KEYS.lastPushError)
  }
}

export function emitStatus(): void {
  broadcast('sync:status', syncStatus())
}
