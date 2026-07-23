// Sync-run grouping. Every activity_log event recorded during one logical sync pass
// shares a run id, so the History view can show "the current sync and the one before it".
//
// A logical run = one syncNow() (pull + push together) OR one standalone pullAll/pushAll
// (e.g. the onboarding Initial Pull). withSyncRun is nesting-safe: the OUTER caller owns
// the run id, so the pull and push inside syncNow share a single run rather than two.
import { randomUUID } from 'node:crypto'

let activeRun: string | null = null

function newRunId(): string {
  return `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`
}

/** Run `fn` inside a sync run. Only the outermost call creates and clears the run id. */
export async function withSyncRun<T>(fn: () => Promise<T>): Promise<T> {
  const outer = activeRun
  if (!outer) activeRun = newRunId()
  try {
    return await fn()
  } finally {
    if (!outer) activeRun = null
  }
}

/** The current run id (falls back to a fresh one if called outside withSyncRun). */
export function currentRunId(): string {
  if (!activeRun) activeRun = newRunId()
  return activeRun
}
