// Shared sync status + the single "running" flag guarding concurrent passes.
import { getSqlite } from '../db'
import { isConnected } from '../notion/service'
import { isMapped } from '../notion/mapping-store'
import { broadcast } from '../windows'
import { metaGet, META_KEYS } from './meta'
import type { SyncStatus } from '../../shared/finance.types'

let running = false
export const isRunning = (): boolean => running
export const setRunning = (value: boolean): void => {
  running = value
}

export function syncStatus(): SyncStatus {
  const db = getSqlite()
  const dirty = (table: string): number =>
    (db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE sync_state = 'dirty'`).get() as {
      n: number
    }).n
  const conflict = (table: string): number =>
    (db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE sync_state = 'conflict'`).get() as {
      n: number
    }).n
  const lastPushAt = metaGet(META_KEYS.lastPushAt)
  const lastPullAt = metaGet(META_KEYS.lastPullAt)
  return {
    connected: isConnected(),
    mapped: isMapped(),
    running,
    dirtyCount: dirty('incomes') + dirty('expenses'),
    conflictCount: conflict('incomes') + conflict('expenses'),
    lastPushAt: lastPushAt ? Number(lastPushAt) : null,
    lastPullAt: lastPullAt ? Number(lastPullAt) : null,
    lastError: metaGet(META_KEYS.lastPushError)
  }
}

export function emitStatus(): void {
  broadcast('sync:status', syncStatus())
}
