// Reset local database and re-pull everything from Notion.
// This is a destructive operation: all local finance data, conflicts, mutations,
// activity logs, and sync cursors are wiped. Notion mapping and app settings are preserved.
import { getSqlite } from '../db'
import { pullAll } from './pull'
import { isRunning, setRunning, emitStatus } from './status'
import { stopScheduler, reschedule } from './scheduler'
import { broadcast } from '../windows'
import { logDevOperation } from '../dev-logs/store'
import type { PullResult } from '../../shared/finance.types'

/** Tables to wipe: finance data + bookkeeping. Chat tables are untouched. */
const TABLES_TO_CLEAR = [
  // Writable finance records
  'incomes',
  'expenses',
  'expense_scheduler',
  // Reference caches (will be re-pulled)
  'accounts',
  'income_categories',
  'expense_categories',
  // Bookkeeping
  'conflicts',
  'mutation_queue',
  'activity_log',
  // Sync cursors
  'sync_meta',
]

/**
 * Delete all local finance data, then do a full pull from Notion.
 * Notion mapping (app_settings) and chat data are preserved.
 */
export async function resetDatabase(): Promise<PullResult> {
  if (isRunning()) {
    throw new Error('A sync operation is already in progress. Please wait for it to finish before resetting.')
  }

  setRunning(true)
  emitStatus()
  stopScheduler()

  const sqlite = getSqlite()

  try {
    // Wrap the wipe in a single transaction for atomicity
    const wipe = sqlite.transaction(() => {
      for (const table of TABLES_TO_CLEAR) {
        sqlite.prepare(`DELETE FROM ${table}`).run()
      }
    })
    wipe()

    logDevOperation('sync:reset', 'Local database wiped', { tables: TABLES_TO_CLEAR })
    broadcast('records:changed', { resource: 'incomes', ids: [] })
    broadcast('records:changed', { resource: 'expenses', ids: [] })
    broadcast('derived:updated', {})
    emitStatus()

    // Full re-pull from Notion (no cursor — fetches everything)
    const result = await pullAll(true)

    logDevOperation('sync:reset', `Reset complete: pulled ${result.inserted} records`, {})
    reschedule()

    return result
  } catch (err) {
    reschedule()
    throw err
  } finally {
    setRunning(false)
    emitStatus()
  }
}
