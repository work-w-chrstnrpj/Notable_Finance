// Public sync surface used by the IPC layer.
import { pushAll } from './push'
import { pullAll } from './pull'
import type { SyncNowResult } from '../../shared/finance.types'

export { pushAll } from './push'
export { pullAll } from './pull'
export { syncStatus } from './status'

/** A full manual pass: push local changes, then pull remote (incremental). */
export async function syncNow(): Promise<SyncNowResult> {
  const push = await pushAll()
  const pull = await pullAll(false)
  return { push, pull }
}
