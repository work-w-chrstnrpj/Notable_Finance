// Public sync surface used by the IPC layer.
import { pushAll } from './push'
import { pullAll } from './pull'
import { withSyncRun } from './run'
import type { SyncNowResult } from '../../shared/finance.types'

export { pushAll } from './push'
export { pullAll } from './pull'
export { syncStatus } from './status'
export { getSyncSettings, setSyncSettings } from './settings'
export { listConflicts, resolveConflict, resolveAllConflicts } from './conflicts'
export { resetDatabase } from './reset'

/**
 * A full manual pass. PULL first so the three-way merge can detect conflicts and
 * auto-merge remote changes BEFORE push — otherwise a locally-dirty + remotely-changed
 * record would be pushed (clobbering the remote edit) and no conflict would be seen.
 * Push then sends clean dirty records (conflicted records are held until resolved).
 */
export async function syncNow(sinceOverride?: string): Promise<SyncNowResult> {
  // One run id for the whole pass so pull + push events group together in History.
  return withSyncRun(async () => {
    const pull = await pullAll(false, sinceOverride)
    // A failed pull did not establish the current remote state. Do not push a
    // stale local snapshot over Notion changes that have not been reconciled.
    if (pull.errors.length > 0) {
      return { pull, push: { pushed: 0, created: 0, updated: 0, failed: 0, skipped: 0, errors: ['Push paused because the pull did not complete. Retry sync after resolving the pull error.'] } }
    }
    const push = await pushAll()
    return { push, pull }
  })
}
