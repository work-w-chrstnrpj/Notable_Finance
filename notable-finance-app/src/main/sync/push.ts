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
import { metaSet, META_KEYS } from './meta'
import { emitStatus, isRunning, setRunning, syncStatus } from './status'
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

interface RelationMaps {
  accounts: Map<string, string>
  incomeCategories: Map<string, string>
  expenseCategories: Map<string, string>
  incomes: Map<string, string>
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

function incomeWritable(row: DirtyRow): Record<string, unknown> {
  return {
    name: row.title,
    date: row.date,
    grossIncome: row.gross_income,
    capitalExpenditure: row.capital_expenditure,
    accountId: row.account_id,
    categoryId: row.category_id,
    transactedAccountId: row.transacted_account_id,
    ccPaymentCoveredId: row.cc_payment_covered_id
  }
}

function expenseWritable(row: DirtyRow): Record<string, unknown> {
  return {
    description: row.title,
    purchaseDate: row.purchase_date,
    datePaid: row.date_paid,
    amount: row.amount,
    interest: row.interest,
    accountId: row.account_id,
    categoryId: row.category_id,
    paymentStatus: row.payment_status,
    paymentFrequency: row.payment_frequency,
    periodCount: row.period_count,
    paidPeriod: row.paid_period,
    pasabuyer: row.pasabuyer,
    pasabuyStatus: row.pasabuy_status,
    pasabuyDateOfPayment: row.pasabuy_date_of_payment,
    pasabuyPaidPeriod: row.pasabuy_paid_period,
    pasabuyAccountReceiverId: row.pasabuy_account_receiver_id,
    ccLinkPaymentReceiptId: row.cc_link_payment_receipt_id
  }
}

/**
 * A record soft-deleted before it was ever pushed has no Notion page to mirror, so
 * pushing it would create a junk "[Deleted: …]" page. Such rows are resolved locally
 * (marked clean) instead of sent.
 */
export function isPhantomDelete(row: { notion_page_id: string | null; deleted: number }): boolean {
  return !row.notion_page_id && row.deleted === 1
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
    incomes: notionIdLookup('incomes')
  }

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
        ccPaymentCoveredId: translate(relations.incomes, dto.ccPaymentCoveredId as string | null, 'ccPaymentCoveredId')
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
          let pageId = row.notion_page_id
          if (pageId) {
            await sendWithBackoff(() => c.updatePage(pageId as string, properties))
            result.updated++
          } else {
            const page = await sendWithBackoff(() => c.createPage(t.databaseId, properties))
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
          result.pushed++
        } catch (error) {
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
