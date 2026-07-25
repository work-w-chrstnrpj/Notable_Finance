// Pull + reconcile engine (Phase 3 pull, upgraded with the Phase 4 three-way merge).
// Order: reference caches first (so record relations translate to local ids), then records.
//
//   not found locally        → INSERT (fresh local id, notion_page_id, base_snapshot, clean)
//   found → threeWayMerge(base_snapshot, local writable, remote writable):
//     noop      → nothing
//     pull      → apply remote (clean)
//     push      → leave dirty (local-only change; push phase sends it)
//     automerge → apply disjoint remote fields onto local (dirty; local change still pushes)
//     conflict  → auto-merge disjoint, keep local on overlap, log conflict, sync_state='conflict'
//
// Incremental: last_edited_time on_or_after last_pull_cursor. Idempotent (keyed by
// notion_page_id), so the minute-rounded overlap is harmless.
import { randomUUID } from 'node:crypto'
import { getSqlite } from '../db'
import { client } from '../notion/service'
import { getMapping } from '../notion/mapping-store'
import {
  isDeletedTitle,
  extractPageIcon,
  pageLastEditedTime,
  pageToAccountFields,
  pageToExpenseCategoryFields,
  pageToExpenseFields,
  pageToIncomeCategoryFields,
  pageToIncomeFields
} from '../notion/page-extractors'
import { downloadImageAsDataUri, isCachedDataUri } from '../notion/files'
import { metaGet, metaSet, META_KEYS } from './meta'
import { emitStatus, isRunning, setRunning, syncStatus } from './status'
import { threeWayMerge, type FieldMap } from './merge'
import { recordConflicts } from './conflicts'
import {
  expenseWritableFromRow,
  incomeWritableFromRow,
  writeExpenseWritable,
  writeIncomeWritable
} from './writable'
import { broadcast } from '../windows'
import { recordActivity } from '../services/history'
import { withSyncRun } from './run'
import { acceptNotionGone, localsMissingFromNotion } from './notion-gone'
import type { PullResult } from '../../shared/finance.types'

const now = (): number => Date.now()
const pageId = (page: Record<string, unknown>): string => page.id as string

function notionToLocal(table: string): Map<string, string> {
  const rows = getSqlite()
    .prepare(`SELECT id, notion_page_id FROM ${table} WHERE notion_page_id IS NOT NULL`)
    .all() as Array<{ id: string; notion_page_id: string }>
  return new Map(rows.map((r) => [r.notion_page_id, r.id]))
}

const localRelation = (map: Map<string, string>, notionId: string | null): string | null =>
  notionId ? (map.get(notionId) ?? null) : null

// ── reference upserts (read-only caches) ────────────────────────────────────

function upsertReference(
  table: string,
  columns: string[],
  values: unknown[],
  notionPageId: string,
  lastEdited: string | null
): number {
  const db = getSqlite()
  const existing = db
    .prepare(`SELECT id FROM ${table} WHERE notion_page_id = ?`)
    .get(notionPageId) as { id: string } | undefined
  if (existing) {
    const sets = columns.map((c) => `${c} = ?`).join(', ')
    db.prepare(`UPDATE ${table} SET ${sets}, notion_last_edited_at = ? WHERE id = ?`).run(
      ...values,
      lastEdited,
      existing.id
    )
  } else {
    const cols = ['id', 'notion_page_id', ...columns, 'notion_last_edited_at', 'created_at']
    const placeholders = cols.map(() => '?').join(', ')
    db.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`).run(
      randomUUID(),
      notionPageId,
      ...values,
      lastEdited,
      now()
    )
  }
  return 1
}

async function pullAccounts(dbId: string, since?: string): Promise<number> {
  const db = getSqlite()
  const pages = await client().queryDatabase(dbId, { since })
  let n = 0
  for (const page of pages) {
    const f = pageToAccountFields(page)
    const npid = pageId(page)

    // QR code: cache the image bytes as a data: URI so it works offline forever. Notion's
    // file URL is a temporary signed link; storing it would break after ~1h and offline.
    const existing = db
      .prepare('SELECT qr_code FROM accounts WHERE notion_page_id = ?')
      .get(npid) as { qr_code: string | null } | undefined
    let qrCode = existing?.qr_code ?? null
    if (f.qr_code && !isCachedDataUri(qrCode)) {
      const cached = await downloadImageAsDataUri(f.qr_code)
      if (cached) qrCode = cached // only overwrite on a successful download (offline-safe)
    }

    const iconExisting = db
      .prepare('SELECT icon FROM accounts WHERE notion_page_id = ?')
      .get(npid) as { icon: string | null } | undefined
    const icon = await resolveIcon(page, iconExisting?.icon ?? null)

    n += upsertReference(
      'accounts',
      ['account_name', 'account_type', 'starting_balance', 'credit_limit', 'inactive', 'billing_day', 'due_day', 'annual_fee', 'credit_points', 'qr_code', 'icon'],
      [f.account_name, f.account_type, f.starting_balance, f.credit_limit, f.inactive, f.billing_day, f.due_day, f.annual_fee, f.credit_points, qrCode, icon],
      npid,
      pageLastEditedTime(page)
    )
  }
  return n
}

/**
 * Resolve a page icon to a storable string: emoji chars and stable external
 * URLs pass through; Notion-uploaded files (expiring URLs) are cached as data
 * URIs so they survive past the ~1h signed-link window and work offline.
 */
async function resolveIcon(
  page: Record<string, unknown>,
  existing: string | null
): Promise<string | null> {
  const { value, isFile } = extractPageIcon(page)
  if (!value) return existing // keep prior icon if Notion returned none this pass
  if (!isFile) return value
  if (isCachedDataUri(existing)) return existing
  const cached = await downloadImageAsDataUri(value)
  return cached ?? existing
}

async function pullIncomeCategories(dbId: string, since?: string): Promise<number> {
  const db = getSqlite()
  const pages = await client().queryDatabase(dbId, { since })
  let n = 0
  for (const page of pages) {
    const f = pageToIncomeCategoryFields(page)
    const npid = pageId(page)
    const existing = db.prepare('SELECT icon FROM income_categories WHERE notion_page_id = ?').get(npid) as { icon: string | null } | undefined
    const icon = await resolveIcon(page, existing?.icon ?? null)
    n += upsertReference('income_categories', ['source', 'auxiliary', 'icon'], [f.source, f.auxiliary, icon], npid, pageLastEditedTime(page))
  }
  return n
}

async function pullExpenseCategories(dbId: string, since?: string): Promise<number> {
  const db = getSqlite()
  const pages = await client().queryDatabase(dbId, { since })
  let n = 0
  for (const page of pages) {
    const f = pageToExpenseCategoryFields(page)
    const npid = pageId(page)
    const existing = db.prepare('SELECT icon FROM expense_categories WHERE notion_page_id = ?').get(npid) as { icon: string | null } | undefined
    const icon = await resolveIcon(page, existing?.icon ?? null)
    n += upsertReference('expense_categories', ['name', 'monthly_budget', 'auxiliary', 'icon'], [f.name, f.monthly_budget, f.auxiliary, icon], npid, pageLastEditedTime(page))
  }
  return n
}

// ── record reconcile ────────────────────────────────────────────────────────

interface RecordOutcome {
  inserted: number
  updated: number
  autoMerged: number
  conflicts: number
  pushPending: number
}
const emptyOutcome = (): RecordOutcome => ({ inserted: 0, updated: 0, autoMerged: 0, conflicts: 0, pushPending: 0 })

/** Apply a merge result to an existing record. Returns which counter to bump. */
function applyMerge(
  table: 'incomes' | 'expenses',
  id: string,
  notionPageId: string,
  base: FieldMap,
  local: FieldMap,
  remote: FieldMap,
  titleKey: 'name' | 'description',
  lastEdited: string | null,
  outcome: RecordOutcome
): void {
  const result = threeWayMerge(base, local, remote)
  const write = table === 'incomes' ? writeIncomeWritable : writeExpenseWritable
  const deletedOf = (w: FieldMap): number => (isDeletedTitle(String(w[titleKey] ?? '')) ? 1 : 0)
  // Notion DB → App event; the applied Notion data may itself be a soft delete.
  const logPull = (merged: FieldMap): void =>
    recordActivity({
      resource: table,
      recordId: id,
      notionPageId,
      title: (merged[titleKey] as string | null) ?? null,
      action: deletedOf(merged) ? 'delete' : 'update',
      direction: 'pull'
    })

  switch (result.outcome) {
    case 'noop':
      break
    case 'push':
      outcome.pushPending++ // local-only change; the push phase will send it
      break
    case 'pull':
      write(id, result.merged, { base: result.base, syncState: 'clean', notionLastEditedAt: lastEdited, deleted: deletedOf(result.merged) })
      logPull(result.merged)
      outcome.updated++
      break
    case 'automerge':
      write(id, result.merged, { base: result.base, syncState: 'dirty', notionLastEditedAt: lastEdited, deleted: deletedOf(result.merged) })
      logPull(result.merged)
      outcome.autoMerged++
      break
    case 'conflict':
      write(id, result.merged, { base: result.base, syncState: 'conflict', notionLastEditedAt: lastEdited, deleted: deletedOf(result.merged) })
      recordConflicts(table, id, result.conflicts)
      logPull(result.merged)
      outcome.conflicts++
      break
  }
}

async function pullIncomes(
  dbId: string,
  since: string | undefined,
  accountMap: Map<string, string>,
  categoryMap: Map<string, string>
): Promise<RecordOutcome> {
  const db = getSqlite()
  const pages = await client().queryDatabase(dbId, { since })
  const outcome = emptyOutcome()

  for (const page of pages) {
    const f = pageToIncomeFields(page)
    const remote: FieldMap = {
      name: f.title,
      date: f.date,
      grossIncome: f.gross_income,
      capitalExpenditure: f.capital_expenditure,
      accountId: localRelation(accountMap, f.account_id),
      categoryId: localRelation(categoryMap, f.category_id),
      transactedAccountId: localRelation(accountMap, f.transacted_account_id),
      ccPaymentCoveredId: null // income→income link resolved in a later pass
    }
    const lastEdited = pageLastEditedTime(page)
    const npid = pageId(page)
    const existing = db.prepare('SELECT * FROM incomes WHERE notion_page_id = ?').get(npid) as
      | Record<string, unknown>
      | undefined

    if (!existing) {
      const newId = randomUUID()
      db.prepare(
        `INSERT INTO incomes (id, notion_page_id, base_snapshot, sync_state, local_updated_at,
           notion_last_edited_at, deleted, created_at, title, gross_income, capital_expenditure,
           account_id, category_id, date, is_transaction, transacted_account_id, cc_payment_covered_id)
         VALUES (?, ?, ?, 'clean', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        newId, npid, JSON.stringify(remote), now(), lastEdited, isDeletedTitle(f.title) ? 1 : 0, now(),
        remote.name, remote.grossIncome, remote.capitalExpenditure, remote.accountId, remote.categoryId,
        remote.date, f.is_transaction, remote.transactedAccountId, remote.ccPaymentCoveredId
      )
      recordActivity({
        resource: 'incomes',
        recordId: newId,
        notionPageId: npid,
        title: (remote.name as string | null) ?? null,
        action: isDeletedTitle(f.title) ? 'delete' : 'create',
        direction: 'pull'
      })
      outcome.inserted++
      continue
    }
    const base = JSON.parse((existing.base_snapshot as string | null) ?? '{}') as FieldMap
    const local = incomeWritableFromRow(existing)
    applyMerge('incomes', existing.id as string, npid, base, local, remote, 'name', lastEdited, outcome)
  }
  return outcome
}

async function pullExpenses(
  dbId: string,
  since: string | undefined,
  accountMap: Map<string, string>,
  categoryMap: Map<string, string>
): Promise<RecordOutcome> {
  const db = getSqlite()
  const pages = await client().queryDatabase(dbId, { since })
  const outcome = emptyOutcome()

  for (const page of pages) {
    const f = pageToExpenseFields(page)
    const remote: FieldMap = {
      description: f.title,
      purchaseDate: f.purchase_date,
      datePaid: f.date_paid,
      amount: f.amount,
      interest: f.interest,
      accountId: localRelation(accountMap, f.account_id),
      categoryId: localRelation(categoryMap, f.category_id),
      paymentStatus: f.payment_status,
      paymentFrequency: f.payment_frequency,
      periodCount: f.period_count,
      paidPeriod: f.paid_period,
      pasabuyer: f.pasabuyer,
      pasabuyStatus: f.pasabuy_status,
      pasabuyDateOfPayment: f.pasabuy_date_of_payment,
      pasabuyPaidPeriod: f.pasabuy_paid_period,
      pasabuyAccountReceiverId: localRelation(accountMap, f.pasabuy_account_receiver_id),
      ccLinkPaymentReceiptId: null
    }
    const lastEdited = pageLastEditedTime(page)
    const npid = pageId(page)
    const existing = db.prepare('SELECT * FROM expenses WHERE notion_page_id = ?').get(npid) as
      | Record<string, unknown>
      | undefined

    if (!existing) {
      const newId = randomUUID()
      db.prepare(
        `INSERT INTO expenses (id, notion_page_id, base_snapshot, sync_state, local_updated_at,
           notion_last_edited_at, deleted, created_at, title, amount, interest, account_id,
           category_id, purchase_date, date_paid, payment_status, payment_frequency, period_count,
           paid_period, is_pasabuy, pasabuyer, pasabuy_status, pasabuy_date_of_payment,
           pasabuy_paid_period, pasabuy_account_receiver_id, cc_link_payment_receipt_id)
         VALUES (?, ?, ?, 'clean', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        newId, npid, JSON.stringify(remote), now(), lastEdited, isDeletedTitle(f.title) ? 1 : 0, now(),
        remote.description, remote.amount, remote.interest, remote.accountId, remote.categoryId,
        remote.purchaseDate, remote.datePaid, remote.paymentStatus, remote.paymentFrequency,
        remote.periodCount, remote.paidPeriod, remote.pasabuyer ? 1 : 0, remote.pasabuyer,
        remote.pasabuyStatus, remote.pasabuyDateOfPayment, remote.pasabuyPaidPeriod,
        remote.pasabuyAccountReceiverId, remote.ccLinkPaymentReceiptId
      )
      recordActivity({
        resource: 'expenses',
        recordId: newId,
        notionPageId: npid,
        title: (remote.description as string | null) ?? null,
        action: isDeletedTitle(f.title) ? 'delete' : 'create',
        direction: 'pull'
      })
      outcome.inserted++
      continue
    }
    const base = JSON.parse((existing.base_snapshot as string | null) ?? '{}') as FieldMap
    const local = expenseWritableFromRow(existing)
    applyMerge('expenses', existing.id as string, npid, base, local, remote, 'description', lastEdited, outcome)
  }
  return outcome
}

/**
 * Full DB query (no since) → local live incomes/expenses whose Notion page is gone
 * (archived/trashed) soft-delete cleanly. Incremental pull cannot see archived pages.
 */
async function reconcileMissingFromNotion(
  table: 'incomes' | 'expenses',
  databaseId: string
): Promise<number> {
  const pages = await client().queryDatabase(databaseId)
  const remoteIds = new Set(pages.map((p) => pageId(p)))
  const locals = getSqlite()
    .prepare(
      `SELECT id, title, notion_page_id, deleted FROM ${table}
       WHERE notion_page_id IS NOT NULL AND deleted = 0`
    )
    .all() as Array<{
    id: string
    title: string
    notion_page_id: string
    deleted: number
  }>

  let n = 0
  for (const row of localsMissingFromNotion(locals, remoteIds)) {
    acceptNotionGone(table, row, 'pull')
    n++
  }
  return n
}

// ── the pull pass ───────────────────────────────────────────────────────────

export async function pullAll(full = false, sinceOverride?: string): Promise<PullResult> {
  // Standalone pull (e.g. onboarding Initial Pull) gets its own run; when called from
  // syncNow the outer run already owns the id, so this nests without a new one.
  return withSyncRun(() => pullAllInner(full, sinceOverride))
}

async function pullAllInner(full: boolean, sinceOverride?: string): Promise<PullResult> {
  const status = syncStatus()
  if (!status.connected) throw new Error('Notion is not connected')
  if (!status.mapped) throw new Error('Databases are not mapped yet')
  if (isRunning()) {
    return { referenceUpserted: 0, inserted: 0, updated: 0, autoMerged: 0, conflicts: 0, pushPending: 0, errors: ['sync already running'], cursor: metaGet(META_KEYS.lastPullCursor) }
  }

  setRunning(true)
  emitStatus()
  const result: PullResult = { referenceUpserted: 0, inserted: 0, updated: 0, autoMerged: 0, conflicts: 0, pushPending: 0, errors: [], cursor: null }
  const mapping = getMapping()
  // sinceOverride: explicit time-range pull from the UI dropdown.
  // full=true: initial pull / pull-all (no filter).
  // Otherwise: incremental pull using the stored cursor.
  const since = full ? undefined : (sinceOverride ?? (metaGet(META_KEYS.lastPullCursor) ?? undefined))
  const passStart = new Date().toISOString() // captured before fetch, so in-flight edits are caught next time

  try {
    // Reference caches (accounts + categories) are small and read-only, so ALWAYS full-refresh
    // them (ignore the incremental cursor). This keeps QR codes, names, budgets, and credit
    // limits current on every sync and backfills them without a heavy full record re-pull.
    // Only the large income/expense tables use the cursor (below).
    if (mapping.accounts) result.referenceUpserted += await pullAccounts(mapping.accounts)
    if (mapping.incomeCategories) result.referenceUpserted += await pullIncomeCategories(mapping.incomeCategories)
    if (mapping.expenseCategories) result.referenceUpserted += await pullExpenseCategories(mapping.expenseCategories)

    const accountMap = notionToLocal('accounts')
    const incomeCatMap = notionToLocal('income_categories')
    const expenseCatMap = notionToLocal('expense_categories')

    const merge = (o: RecordOutcome): void => {
      result.inserted += o.inserted
      result.updated += o.updated
      result.autoMerged += o.autoMerged
      result.conflicts += o.conflicts
      result.pushPending += o.pushPending
    }
    if (mapping.incomes) merge(await pullIncomes(mapping.incomes, since, accountMap, incomeCatMap))
    if (mapping.expenses) merge(await pullExpenses(mapping.expenses, since, accountMap, expenseCatMap))

    // Presence pass: Notion trash/archive removes pages from query results, so
    // incremental last_edited filters never surface them — reconcile by full id set.
    // Failures here must not block cursor advance (incremental pull already applied).
    try {
      if (mapping.incomes) {
        result.updated += await reconcileMissingFromNotion('incomes', mapping.incomes)
      }
      if (mapping.expenses) {
        result.updated += await reconcileMissingFromNotion('expenses', mapping.expenses)
      }
    } catch (error) {
      result.errors.push(
        `presence reconcile: ${error instanceof Error ? error.message : String(error)}`
      )
    }

    metaSet(META_KEYS.lastPullCursor, passStart)
    metaSet(META_KEYS.lastPullAt, String(Date.now()))
    result.cursor = passStart

    broadcast('records:changed', { resource: 'accounts', ids: [] })
    broadcast('derived:updated', {})
    return result
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error))
    return result
  } finally {
    setRunning(false)
    emitStatus()
  }
}
