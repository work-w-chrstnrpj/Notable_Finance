// sync_meta key/value access shared by push and pull (cursors, timestamps).
import { getSqlite } from '../db'

export function metaGet(key: string): string | null {
  const row = getSqlite().prepare('SELECT value FROM sync_meta WHERE key = ?').get(key) as
    | { value: string | null }
    | undefined
  return row?.value ?? null
}

export function metaSet(key: string, value: string | null): void {
  getSqlite()
    .prepare(
      `INSERT INTO sync_meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(key, value)
}

export const META_KEYS = {
  lastPushAt: 'last_push_at',
  lastPushError: 'last_push_error',
  lastPullAt: 'last_pull_at',
  lastPullCursor: 'last_pull_cursor'
} as const
