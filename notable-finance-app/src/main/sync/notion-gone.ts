// Notion archive/trash handling — when a page is gone from Notion (archived or not
// found), treat that as remote delete: soft-delete locally and mark sync_state clean
// so push never sticks forever on "Can't edit block that is archived."
import { getSqlite } from '../db'
import { NotionApiError } from '../notion/client'
import { isDeletedTitle } from '../notion/page-extractors'
import { recordActivity } from '../services/history'
import type { ActivityDirection, SyncedResource } from '../../shared/finance.types'

export type GoneTable = 'incomes' | 'expenses'

const now = (): number => Date.now()

/**
 * True when Notion refused an edit because the page is archived/trashed, or the
 * object no longer exists. Message-based checks cover the archived validation
 * error we hit in production; status/code cover 404 object_not_found.
 */
export function isNotionGoneError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  if (message.includes('archived')) return true
  if (message.includes('object_not_found')) return true
  if (message.includes('could not find')) return true

  if (error instanceof NotionApiError) {
    if (error.status === 404) return true
    if (error.code === 'object_not_found') return true
  }
  return false
}

/** Live local rows whose Notion page id is absent from the remote (non-archived) set. */
export function localsMissingFromNotion<
  T extends { notion_page_id: string | null; deleted: number }
>(locals: T[], remoteIds: Set<string>): T[] {
  return locals.filter(
    (row) =>
      row.deleted === 0 && row.notion_page_id != null && !remoteIds.has(row.notion_page_id)
  )
}

/**
 * Soft-delete + clean a local income/expense because its Notion page is gone.
 * Keeps notion_page_id so a later unarchive can still match the row.
 *
 * @param direction `pull` when discovered via presence reconcile / remote absence;
 *   `push` when resolving a failed push against an already-archived page (typically
 *   after a local soft-delete).
 */
export function acceptNotionGone(
  table: GoneTable,
  row: {
    id: string
    title?: string | null
    notion_page_id?: string | null
    deleted?: number | null
  },
  direction: ActivityDirection
): void {
  const db = getSqlite()
  const t = now()
  const alreadyDeleted = Number(row.deleted) === 1
  const currentTitle = String(row.title ?? '')
  const title =
    alreadyDeleted || isDeletedTitle(currentTitle)
      ? currentTitle || '[Deleted:]'
      : `[Deleted: ${currentTitle}]`

  if (table === 'incomes') {
    db.prepare(
      `UPDATE incomes SET title = ?, gross_income = 0, capital_expenditure = 0,
         deleted = 1, sync_state = 'clean', local_updated_at = ? WHERE id = ?`
    ).run(title, t, row.id)
  } else {
    db.prepare(
      `UPDATE expenses SET title = ?, amount = 0, interest = 0,
         deleted = 1, sync_state = 'clean', local_updated_at = ? WHERE id = ?`
    ).run(title, t, row.id)
  }

  const resource: SyncedResource = table
  db.prepare('DELETE FROM mutation_queue WHERE resource = ? AND record_id = ?').run(
    resource,
    row.id
  )

  const updated = db.prepare(`SELECT title FROM ${table} WHERE id = ?`).get(row.id) as
    | { title: string }
    | undefined

  recordActivity({
    resource,
    recordId: row.id,
    notionPageId: row.notion_page_id ?? null,
    title: updated?.title ?? title,
    action: 'delete',
    direction
  })
}
