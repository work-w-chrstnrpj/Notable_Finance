// History service — powers the desktop History section.
//
// Two data sources:
//  1. Unsynced items: incomes/expenses rows whose sync_state is 'dirty' or 'conflict'
//     (local changes not yet on Notion, soft deletes included). Derived live from the
//     finance tables — no separate store needed.
//  2. Activity feed: the `activity_log` table, a durable record of completed sync events
//     (what was pulled from Notion vs pushed to Notion, with create/update/delete status).
//     Written by the pull/push engines via recordActivity(); persists across syncs, unlike
//     mutation_queue which is cleared on push.
import { randomUUID } from 'node:crypto'
import { getSqlite } from '../db'
import { metaGet, META_KEYS } from '../sync/meta'
import { currentRunId } from '../sync/run'
import type {
  ActivityDirection,
  ActivityEntry,
  HistoryData,
  MutationAction,
  SyncedResource,
  UnsyncedItem
} from '../../shared/finance.types'

// Keep the feed bounded (personal-scale). Newest rows are retained.
const ACTIVITY_RETENTION = 1000

/**
 * Append a completed sync event to the activity feed. Best-effort: never throws, so a
 * logging hiccup can't abort a sync pass.
 */
export function recordActivity(entry: {
  resource: SyncedResource
  recordId: string
  notionPageId?: string | null
  title: string | null
  action: MutationAction
  direction: ActivityDirection
}): void {
  try {
    const db = getSqlite()
    db.prepare(
      `INSERT INTO activity_log (id, run_id, resource, record_id, notion_page_id, title, action, direction, at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      randomUUID(),
      currentRunId(),
      entry.resource,
      entry.recordId,
      entry.notionPageId ?? null,
      entry.title,
      entry.action,
      entry.direction,
      Date.now()
    )
    // Prune anything beyond the newest N rows.
    db.prepare(
      `DELETE FROM activity_log WHERE id NOT IN (
         SELECT id FROM activity_log ORDER BY at DESC, rowid DESC LIMIT ?
       )`
    ).run(ACTIVITY_RETENTION)
  } catch {
    /* history logging is non-critical; ignore */
  }
}

interface UnsyncedRow {
  resource: SyncedResource
  record_id: string
  title: string | null
  deleted: number
  sync_state: 'dirty' | 'conflict'
  notion_page_id: string | null
  local_updated_at: number
}

/** Local changes not yet synced to Notion (dirty/conflict), soft deletes included. */
export function listUnsynced(): UnsyncedItem[] {
  const rows = getSqlite()
    .prepare(
      `SELECT 'incomes' AS resource, id AS record_id, title, deleted, sync_state,
              notion_page_id, local_updated_at
         FROM incomes  WHERE sync_state IN ('dirty', 'conflict')
       UNION ALL
       SELECT 'expenses' AS resource, id AS record_id, title, deleted, sync_state,
              notion_page_id, local_updated_at
         FROM expenses WHERE sync_state IN ('dirty', 'conflict')
       ORDER BY local_updated_at DESC`
    )
    .all() as UnsyncedRow[]

  return rows.map((r) => ({
    resource: r.resource,
    recordId: r.record_id,
    title: r.title,
    action: r.deleted ? 'delete' : r.notion_page_id ? 'update' : 'create',
    syncState: r.sync_state,
    deleted: Boolean(r.deleted),
    notionPageId: r.notion_page_id,
    localUpdatedAt: r.local_updated_at
  }))
}

interface ActivityRow {
  id: string
  resource: SyncedResource
  record_id: string
  notion_page_id: string | null
  title: string | null
  action: MutationAction
  direction: ActivityDirection
  at: number
}

/**
 * Events from the most recent sync runs (newest first). Defaults to the last TWO runs —
 * the current sync plus the one before it — so History reflects just the latest activity,
 * not the entire journal.
 */
export function listActivity(runs = 2): ActivityEntry[] {
  const rows = getSqlite()
    .prepare(
      `SELECT a.* FROM activity_log a
        WHERE a.run_id IN (
          SELECT run_id FROM activity_log
           WHERE run_id IS NOT NULL
           GROUP BY run_id
           ORDER BY MAX(at) DESC
           LIMIT ?
        )
        ORDER BY a.at DESC, a.rowid DESC`
    )
    .all(runs) as ActivityRow[]

  return rows.map((r) => ({
    id: r.id,
    resource: r.resource,
    recordId: r.record_id,
    notionPageId: r.notion_page_id,
    title: r.title,
    action: r.action,
    direction: r.direction,
    at: r.at
  }))
}

export function getHistory(runs = 2): HistoryData {
  const lastPullAt = metaGet(META_KEYS.lastPullAt)
  const lastPushAt = metaGet(META_KEYS.lastPushAt)
  return {
    unsynced: listUnsynced(),
    recent: listActivity(runs),
    lastPullAt: lastPullAt ? Number(lastPullAt) : null,
    lastPushAt: lastPushAt ? Number(lastPushAt) : null
  }
}
