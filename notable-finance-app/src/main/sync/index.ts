// Public sync surface used by the IPC layer.
import { pushAll } from './push'
import { pullAll } from './pull'
import type { SyncNowResult } from '../../shared/finance.types'

export { pushAll } from './push'
export { pullAll } from './pull'
export { syncStatus } from './status'
export { getSyncSettings, setSyncSettings } from './settings'
export { listConflicts, resolveConflict } from './conflicts'

/**
 * A full manual pass. PULL first so the three-way merge can detect conflicts and
 * auto-merge remote changes BEFORE push — otherwise a locally-dirty + remotely-changed
 * record would be pushed (clobbering the remote edit) and no conflict would be seen.
 * Push then sends clean dirty records (conflicted records are held until resolved).
 */
export async function syncNow(): Promise<SyncNowResult> {
  const pull = await pullAll(false)
  const push = await pushAll()
  return { push, pull }
}
