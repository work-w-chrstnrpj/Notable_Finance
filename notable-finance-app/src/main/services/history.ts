// History service — powers the desktop History section.
//
// Two data sources:
//  1. Unsynced items: incomes/expenses rows whose sync_state is 'dirty' or 'conflict'
//     (local changes not yet on Notion, soft deletes included), PLUS pending hard-delete
//     intents in mutation_queue (local row already removed; Notion trash still outstanding).
//     Each item includes the full record payload so the renderer can show a form-like modal.
//  2. Activity feed: the `activity_log` table, a durable record of completed sync events
//     (what was pulled from Notion vs pushed to Notion, with create/update/delete status).
//     Written by the pull/push engines via recordActivity(); persists across syncs, unlike
//     mutation_queue which is cleared on push. The `payload` column stores the full writable
//     fields at event time so the History page can render read-only form modals.
import { randomUUID } from 'node:crypto'
import { getSqlite } from '../db'
import { metaGet, META_KEYS } from '../sync/meta'
import { currentRunId } from '../sync/run'
import {
  incomeWritableFromRow,
  expenseWritableFromRow
} from '../sync/writable'
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
 * @param payload - Full writable fields of the record at event time (JSON-serializable).
 */
export function recordActivity(entry: {
  resource: SyncedResource
  recordId: string
  notionPageId?: string | null
  title: string | null
  action: MutationAction
  direction: ActivityDirection
  payload?: Record<string, unknown> | null
}): void {
  try {
    const db = getSqlite()
    db.prepare(
      `INSERT INTO activity_log (id, run_id, resource, record_id, notion_page_id, title, payload, action, direction, at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      randomUUID(),
      currentRunId(),
      entry.resource,
      entry.recordId,
      entry.notionPageId ?? null,
      entry.title,
      entry.payload ? JSON.stringify(entry.payload) : null,
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

/** Read the full writable payload for a record directly from the finance table.
 *  Also reads `base_snapshot` and computes a `_previous` map of field values
 *  that differ from the current writable, so the renderer can show red/green diffs. */
function readRecordPayload(
  resource: SyncedResource,
  recordId: string
): Record<string, unknown> | null {
  try {
    const db = getSqlite()
    const table = resource === 'incomes' ? 'incomes' : 'expenses'
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(recordId) as
      | Record<string, unknown>
      | undefined
    if (!row) return null
    const writable: Record<string, unknown> =
      resource === 'incomes'
        ? (incomeWritableFromRow(row) as Record<string, unknown>)
        : (expenseWritableFromRow(row) as Record<string, unknown>)

    // Compare against base_snapshot to produce a diff for updates
    let base: Record<string, unknown> | null = null
    const raw = row.base_snapshot
    if (typeof raw === 'string') {
      try { base = JSON.parse(raw) as Record<string, unknown> } catch { /* skip */ }
    }
    if (base) {
      const changed: Record<string, unknown> = {}
      for (const key of Object.keys(writable)) {
        if (key === '_previous') continue
        const cur = writable[key]
        const prev = base[key]
        if (JSON.stringify(cur) !== JSON.stringify(prev)) {
          changed[key] = prev
        }
      }
      if (Object.keys(changed).length > 0) {
        writable._previous = changed
      }
    }

    return writable
  } catch {
    return null
  }
}

/** Local changes not yet synced to Notion (dirty/conflict + pending hard-deletes). */
export function listUnsynced(): UnsyncedItem[] {
  const db = getSqlite()
  const rows = db
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

  const fromRows: UnsyncedItem[] = rows.map((r) => ({
    resource: r.resource,
    recordId: r.record_id,
    title: r.title,
    action: r.deleted ? 'delete' : r.notion_page_id ? 'update' : 'create',
    syncState: r.sync_state,
    deleted: Boolean(r.deleted),
    notionPageId: r.notion_page_id,
    localUpdatedAt: r.local_updated_at,
    payload: readRecordPayload(r.resource, r.record_id)
  }))

  // Hard deletes remove the finance row immediately and only leave a mutation_queue
  // trash intent — include those so History "Unsynced Items" stays accurate.
  const hardRows = db
    .prepare(
      `SELECT resource, record_id, payload, created_at
         FROM mutation_queue
        WHERE action = 'hardDelete'
        ORDER BY created_at DESC`
    )
    .all() as Array<{
    resource: string
    record_id: string
    payload: string | null
    created_at: number
  }>

  const fromHard: UnsyncedItem[] = []
  for (const row of hardRows) {
    if (row.resource !== 'incomes' && row.resource !== 'expenses') continue
    let title: string | null = null
    let notionPageId: string | null = null
    let payload: Record<string, unknown> | null = null
    try {
      const parsed = JSON.parse(row.payload ?? '{}') as Record<string, unknown>
      title = (parsed.title as string) ?? null
      notionPageId = (parsed.notionPageId as string) ?? null
      // For hard-deletes, store what we have from the mutation queue payload
      payload = parsed as Record<string, unknown>
    } catch {
      /* keep nulls */
    }
    fromHard.push({
      resource: row.resource as SyncedResource,
      recordId: row.record_id,
      title,
      action: 'delete',
      syncState: 'dirty',
      deleted: true,
      notionPageId,
      localUpdatedAt: row.created_at,
      pendingHardDelete: true,
      payload
    })
  }

  return [...fromRows, ...fromHard].sort((a, b) => b.localUpdatedAt - a.localUpdatedAt)
}

interface ActivityRow {
  id: string
  resource: SyncedResource
  record_id: string
  notion_page_id: string | null
  title: string | null
  payload: string | null
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
    payload: r.payload ? tryParsePayload(r.payload) : null,
    action: r.action,
    direction: r.direction,
    at: r.at
  }))
}

function tryParsePayload(json: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(json)
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}

/**
 * Get the full record payload for a history item.
 * For unsynced items, reads directly from the finance table.
 * For activity items, returns the stored payload.
 */
export function getItemDetail(
  resource: SyncedResource,
  recordId: string
): Record<string, unknown> | null {
  return readRecordPayload(resource, recordId)
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
