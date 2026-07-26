// Push engine (Phase 2.3) — the PUSH phase of the reconcile design
// (wiki/desktop/sync-and-conflict-design.md):
//   for each local record where sync_state = 'dirty':
//     no notion_page_id → create page (writable fields only) → store returned id
//     else               → update page (writable fields only)
//     on success         → base_snapshot = writable fields; sync_state = 'clean'
//     on 429/failure     → keep 'dirty'; backoff and retry next pass
// Soft deletes travel as ordinary field changes (title already rewritten locally).
// Rate-limit safety: sequential sends spaced ~340ms (≈3 req/s) with exponential
// backoff honoring Retry-After on 429. Idempotent: a record with a notion_page_id
// updates rather than re-creates, so a retried push cannot duplicate.
import { getSqlite } from '../db'
import { client } from '../notion/service'
import { getMapping } from '../notion/mapping-store'
import { NotionApiError } from '../notion/client'
import { expenseDtoToProperties, incomeDtoToProperties } from '../notion/property-mapper'
import { iconForExpense, iconForIncome } from '../notion/page-icons'
import { metaSet, META_KEYS } from './meta'
import { emitStatus, isRunning, setRunning, syncStatus } from './status'
import { expenseWritableFromRow, incomeWritableFromRow } from './writable'
import { recordActivity } from '../services/history'
import { withSyncRun } from './run'
import { acceptNotionGone, isNotionGoneError } from './notion-gone'
import type { PushResult } from '../../shared/finance.types'

const THROTTLE_MS = 340
const MAX_RETRIES = 3

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

// ── relation translation: local UUID → Notion page id ───────────────────────

function notionIdLookup(table: string): Map<string, string> {
  const rows = getSqlite()
    .prepare(`SELECT id, notion_page_id FROM ${table} WHERE notion_page_id IS NOT NULL`)
    .all() as Array<{ id: string; notion_page_id: string }>
  return new Map(rows.map((r) => [r.id, r.notion_page_id]))
}

/** Local category id → display name (income `source` / expense `name`). */
function categoryNameLookup(table: 'income_categories' | 'expense_categories'): Map<string, string> {
  const column = table === 'income_categories' ? 'source' : 'name'
  const rows = getSqlite()
    .prepare(`SELECT id, ${column} AS name FROM ${table}`)
    .all() as Array<{ id: string; name: string }>
  return new Map(rows.map((r) => [r.id, r.name]))
}

interface RelationMaps {
  accounts: Map<string, string>
  incomeCategories: Map<string, string>
  expenseCategories: Map<string, string>
  incomes: Map<string, string>
  expenses: Map<string, string>
}

class UnmappedRelationError extends Error {
  constructor(field: string) {
    super(`relation ${field} references a record with no Notion page id yet`)
  }
}

/** null stays null; a local id must translate or the record is skipped this pass. */
function translate(map: Map<string, string>, localId: string | null, field: string): string | null {
  if (!localId) return null
  const notionId = map.get(localId)
  if (!notionId) throw new UnmappedRelationError(field)
  return notionId
}

// ── writable snapshots ──────────────────────────────────────────────────────

interface DirtyRow {
  [key: string]: unknown
  id: string
  notion_page_id: string | null
}

// Writable-field views are shared with pull + merge (base_snapshot is this shape).
const incomeWritable = incomeWritableFromRow
const expenseWritable = expenseWritableFromRow

/**
 * A record soft-deleted before it was ever pushed has no Notion page to mirror, so
 * pushing it would create a junk "[Deleted: …]" page. Such rows are resolved locally
 * (marked clean) instead of sent.
 */
export function isPhantomDelete(row: { notion_page_id: string | null; deleted: number }): boolean {
  return !row.notion_page_id && row.deleted === 1
}

type HardDeleteQueueRow = {
  id: string
  resource: string
  record_id: string
  payload: string
}

/** Archive Notion pages queued by local hard-delete. */
async function pushPendingHardDeletes(
  c: ReturnType<typeof client>,
  result: PushResult
): Promise<void> {
  const db = getSqlite()
  const rows = db
    .prepare(`SELECT id, resource, record_id, payload FROM mutation_queue WHERE action = 'hardDelete' ORDER BY created_at`)
    .all() as HardDeleteQueueRow[]

  for (const row of rows) {
    let notionPageId: string | null = null
    let title: string | null = null
    try {
      const payload = JSON.parse(row.payload) as { notionPageId?: string; title?: string }
      notionPageId = payload.notionPageId ?? null
      title = payload.title ?? null
    } catch {
      db.prepare('DELETE FROM mutation_queue WHERE id = ?').run(row.id)
      result.skipped++
      continue
    }

    if (!notionPageId) {
      db.prepare('DELETE FROM mutation_queue WHERE id = ?').run(row.id)
      result.skipped++
      continue
    }

    try {
      await sendWithBackoff(() => c.archivePage(notionPageId as string))
      db.prepare('DELETE FROM mutation_queue WHERE id = ?').run(row.id)
      if (row.resource === 'incomes' || row.resource === 'expenses') {
        recordActivity({
          resource: row.resource,
          recordId: row.record_id,
          notionPageId,
          title,
          action: 'delete',
          direction: 'push'
        })
      }
      result.pushed++
      result.updated++
    } catch (error) {
      if (isNotionGoneError(error)) {
        // Already trashed/gone — treat as success.
        db.prepare('DELETE FROM mutation_queue WHERE id = ?').run(row.id)
        if (row.resource === 'incomes' || row.resource === 'expenses') {
          recordActivity({
            resource: row.resource,
            recordId: row.record_id,
            notionPageId,
            title,
            action: 'delete',
            direction: 'push'
          })
        }
        result.skipped++
      } else {
        result.failed++
        const message = error instanceof Error ? error.message : String(error)
        result.errors.push(`hardDelete/${row.resource}/${row.record_id}: ${message}`)
      }
    }

    emitStatus()
    await sleep(THROTTLE_MS)
  }
}

// ── the push pass ───────────────────────────────────────────────────────────

async function sendWithBackoff(
  send: () => Promise<{ id: string }>
): Promise<{ id: string }> {
  let attempt = 0
  for (;;) {
    try {
      return await send()
    } catch (error) {
      attempt++
      if (error instanceof NotionApiError && error.status === 429 && attempt <= MAX_RETRIES) {
        const wait = error.retryAfterSeconds
          ? error.retryAfterSeconds * 1000
          : Math.min(2 ** attempt * 500, 8000)
        await sleep(wait)
        continue
      }
      throw error
    }
  }
}

export async function pushAll(): Promise<PushResult> {
  // Standalone push gets its own run; nested under syncNow it reuses the outer run id.
  return withSyncRun(() => pushAllInner())
}

async function pushAllInner(): Promise<PushResult> {
  if (isRunning()) return { pushed: 0, created: 0, updated: 0, failed: 0, skipped: 0, errors: ['sync already running'] }
  const status = syncStatus()
  if (!status.connected) throw new Error('Notion is not connected')
  if (!status.mapped) throw new Error('Databases are not mapped yet')

  setRunning(true)
  emitStatus()
  const result: PushResult = { pushed: 0, created: 0, updated: 0, failed: 0, skipped: 0, errors: [] }
  const db = getSqlite()
  const c = client()
  const mapping = getMapping()

  const relations: RelationMaps = {
    accounts: notionIdLookup('accounts'),
    incomeCategories: notionIdLookup('income_categories'),
    expenseCategories: notionIdLookup('expense_categories'),
    incomes: notionIdLookup('incomes'),
    expenses: notionIdLookup('expenses')
  }
  const incomeCategoryNames = categoryNameLookup('income_categories')
  const expenseCategoryNames = categoryNameLookup('expense_categories')

  const tables: Array<{
    table: 'incomes' | 'expenses'
    databaseId: string
    writable: (row: DirtyRow) => Record<string, unknown>
    toProperties: (dto: Record<string, unknown>) => Record<string, unknown>
    translateRelations: (dto: Record<string, unknown>) => Record<string, unknown>
  }> = [
    {
      table: 'incomes',
      databaseId: mapping.incomes as string,
      writable: incomeWritable,
      toProperties: incomeDtoToProperties,
      translateRelations: (dto) => ({
        ...dto,
        accountId: translate(relations.accounts, dto.accountId as string | null, 'accountId'),
        categoryId: translate(relations.incomeCategories, dto.categoryId as string | null, 'categoryId'),
        transactedAccountId: translate(relations.accounts, dto.transactedAccountId as string | null, 'transactedAccountId'),
        ccPaymentCoveredIds: (dto.ccPaymentCoveredIds as string[] | null | undefined)
          ?.map((id) => translate(relations.expenses, id, 'ccPaymentCoveredIds'))
          ?? []
      })
    },
    {
      table: 'expenses',
      databaseId: mapping.expenses as string,
      writable: expenseWritable,
      toProperties: expenseDtoToProperties,
      translateRelations: (dto) => ({
        ...dto,
        accountId: translate(relations.accounts, dto.accountId as string | null, 'accountId'),
        categoryId: translate(relations.expenseCategories, dto.categoryId as string | null, 'categoryId'),
        pasabuyAccountReceiverId: translate(relations.accounts, dto.pasabuyAccountReceiverId as string | null, 'pasabuyAccountReceiverId'),
        ccLinkPaymentReceiptId: translate(relations.incomes, dto.ccLinkPaymentReceiptId as string | null, 'ccLinkPaymentReceiptId')
      })
    }
  ]

  try {
    // Pending Notion trash archives from hard-delete (local rows already gone).
    await pushPendingHardDeletes(c, result)

    for (const t of tables) {
      const dirtyRows = db
        .prepare(`SELECT * FROM ${t.table} WHERE sync_state = 'dirty' ORDER BY local_updated_at`)
        .all() as DirtyRow[]

      const resourceName = t.table === 'incomes' ? 'incomes' : 'expenses'

      for (const row of dirtyRows) {
        // Soft-deleted before it ever reached Notion → nothing to mirror; resolve locally.
        if (isPhantomDelete({ notion_page_id: row.notion_page_id, deleted: Number(row.deleted) })) {
          db.prepare(`UPDATE ${t.table} SET sync_state = 'clean' WHERE id = ?`).run(row.id)
          db.prepare('DELETE FROM mutation_queue WHERE resource = ? AND record_id = ?').run(
            resourceName,
            row.id
          )
          recordActivity({
            resource: resourceName,
            recordId: row.id,
            notionPageId: null,
            title: (row.title as string | null) ?? null,
            action: 'delete',
            direction: 'push'
          })
          result.skipped++
          continue
        }

        const localDto = t.writable(row)
        let translated: Record<string, unknown>
        try {
          translated = t.translateRelations(localDto)
        } catch (error) {
          // Relation target not pushed/pulled yet — leave dirty for a later pass.
          result.skipped++
          result.errors.push(`${t.table}/${row.id}: ${(error as Error).message}`)
          continue
        }

        try {
          const properties = t.toProperties(translated)
          const icon =
            t.table === 'incomes'
              ? iconForIncome({
                  categorySource: incomeCategoryNames.get(String(row.category_id ?? '')) ?? null,
                  accountId: (row.account_id as string | null) ?? null
                })
              : iconForExpense({
                  categoryName: expenseCategoryNames.get(String(row.category_id ?? '')) ?? null,
                  isPasabuy: Number(row.is_pasabuy) === 1
                })
          let pageId = row.notion_page_id
          const wasCreate = !pageId
          // A bad/unknown native icon name must never block the record from
          // reaching Notion: if Notion rejects the icon, retry the same write
          // without it so the data still syncs (the row just gets no icon).
          const isIconError = (err: unknown): boolean =>
            err instanceof NotionApiError && /icon/i.test(err.message)
          if (pageId) {
            try {
              await sendWithBackoff(() => c.updatePage(pageId as string, properties, { icon }))
            } catch (iconErr) {
              if (!isIconError(iconErr)) throw iconErr
              await sendWithBackoff(() => c.updatePage(pageId as string, properties))
            }
            result.updated++
          } else {
            let page: { id: string }
            try {
              page = await sendWithBackoff(() => c.createPage(t.databaseId, properties, { icon }))
            } catch (iconErr) {
              if (!isIconError(iconErr)) throw iconErr
              page = await sendWithBackoff(() => c.createPage(t.databaseId, properties))
            }
            pageId = page.id
            result.created++
            // New income pages become translatable targets for cc_payment_covered links.
            if (t.table === 'incomes') relations.incomes.set(row.id, pageId)
          }
          // Base snapshot stores the LOCAL view of the writable fields — the three-way
          // merge ancestor (sync-and-conflict-design.md).
          db.prepare(
            `UPDATE ${t.table} SET notion_page_id = ?, base_snapshot = ?, sync_state = 'clean' WHERE id = ?`
          ).run(pageId, JSON.stringify(localDto), row.id)
          db.prepare('DELETE FROM mutation_queue WHERE resource = ? AND record_id = ?').run(
            resourceName,
            row.id
          )
          // App → Notion event. A soft-deleted row that reached Notion is a 'delete';
          // otherwise it is the create/update we just performed.
          recordActivity({
            resource: resourceName,
            recordId: row.id,
            notionPageId: pageId,
            title: (row.title as string | null) ?? null,
            action: Number(row.deleted) === 1 ? 'delete' : wasCreate ? 'create' : 'update',
            direction: 'push'
          })
          result.pushed++
        } catch (error) {
          // Notion archive/trash: cannot update the page — accept as remote delete
          // instead of leaving the row dirty forever.
          if (isNotionGoneError(error)) {
            const wasLocalDelete = Number(row.deleted) === 1
            acceptNotionGone(t.table, row, wasLocalDelete ? 'push' : 'pull')
            result.skipped++
            continue
          }
          result.failed++
          const message = error instanceof Error ? error.message : String(error)
          result.errors.push(`${t.table}/${row.id}: ${message}`)
        }

        emitStatus()
        await sleep(THROTTLE_MS)
      }
    }

    metaSet(META_KEYS.lastPushAt, String(Date.now()))
    metaSet(META_KEYS.lastPushError, result.errors.length ? result.errors.join(' | ') : null)
    return result
  } finally {
    setRunning(false)
    emitStatus()
  }
}
