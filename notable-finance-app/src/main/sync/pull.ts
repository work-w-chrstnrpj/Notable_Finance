// Pull engine (Phase 3) — the PULL phase of the reconcile design
// (wiki/desktop/sync-and-conflict-design.md), without the three-way merge (that is
// Phase 4). Order matters: reference caches first so record relations (Notion page ids)
// can be translated to local ids.
//
//   for each Notion page changed since cursor:
//     reference (accounts/categories): upsert the read-only cache by notion_page_id
//     records (incomes/expenses):
//       not found locally            → INSERT (fresh local id, notion_page_id, base_snapshot, clean)
//       found & clean                → UPDATE writable fields from remote (remote wins)
//       found & dirty/conflict       → SKIP (Phase 4 reconcile owns these)
//
// Incremental: last_edited_time on_or_after last_pull_cursor. The minute-rounded overlap
// is harmless because every upsert is idempotent (keyed by notion_page_id).
import { randomUUID } from 'node:crypto'
import { getSqlite } from '../db'
import { client } from '../notion/service'
import { getMapping } from '../notion/mapping-store'
import {
  isDeletedTitle,
  pageLastEditedTime,
  pageToAccountFields,
  pageToExpenseCategoryFields,
  pageToExpenseFields,
  pageToIncomeCategoryFields,
  pageToIncomeFields,
  type ExpenseFields,
  type IncomeFields
} from '../notion/page-extractors'
import { metaGet, metaSet, META_KEYS } from './meta'
import { emitStatus, isRunning, setRunning, syncStatus } from './status'
import { broadcast } from '../windows'
import type { PullResult } from '../../shared/finance.types'

const now = (): number => Date.now()

function pageId(page: Record<string, unknown>): string {
  return page.id as string
}

/** notion_page_id → local id for a reference table (built after that table is pulled). */
function notionToLocal(table: string): Map<string, string> {
  const rows = getSqlite()
    .prepare(`SELECT id, notion_page_id FROM ${table} WHERE notion_page_id IS NOT NULL`)
    .all() as Array<{ id: string; notion_page_id: string }>
  return new Map(rows.map((r) => [r.notion_page_id, r.id]))
}

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
  const pages = await client().queryDatabase(dbId, { since })
  let count = 0
  for (const page of pages) {
    const f = pageToAccountFields(page)
    count += upsertReference(
      'accounts',
      ['account_name', 'account_type', 'starting_balance', 'credit_limit', 'inactive', 'billing_day', 'due_day', 'annual_fee', 'credit_points'],
      [f.account_name, f.account_type, f.starting_balance, f.credit_limit, f.inactive, f.billing_day, f.due_day, f.annual_fee, f.credit_points],
      pageId(page),
      pageLastEditedTime(page)
    )
  }
  return count
}

async function pullIncomeCategories(dbId: string, since?: string): Promise<number> {
  const pages = await client().queryDatabase(dbId, { since })
  let count = 0
  for (const page of pages) {
    const f = pageToIncomeCategoryFields(page)
    count += upsertReference('income_categories', ['source', 'auxiliary'], [f.source, f.auxiliary], pageId(page), pageLastEditedTime(page))
  }
  return count
}

async function pullExpenseCategories(dbId: string, since?: string): Promise<number> {
  const pages = await client().queryDatabase(dbId, { since })
  let count = 0
  for (const page of pages) {
    const f = pageToExpenseCategoryFields(page)
    count += upsertReference('expense_categories', ['name', 'monthly_budget', 'auxiliary'], [f.name, f.monthly_budget, f.auxiliary], pageId(page), pageLastEditedTime(page))
  }
  return count
}

// ── record upserts (writable; respect local dirty state) ────────────────────

interface RecordUpsertOutcome {
  inserted: number
  updated: number
  skippedDirty: number
}

function localRelation(map: Map<string, string>, notionId: string | null): string | null {
  return notionId ? (map.get(notionId) ?? null) : null
}

async function pullIncomes(
  dbId: string,
  since: string | undefined,
  accountMap: Map<string, string>,
  categoryMap: Map<string, string>
): Promise<RecordUpsertOutcome> {
  const db = getSqlite()
  const pages = await client().queryDatabase(dbId, { since })
  const outcome: RecordUpsertOutcome = { inserted: 0, updated: 0, skippedDirty: 0 }

  for (const page of pages) {
    const f = pageToIncomeFields(page)
    const writable = {
      title: f.title,
      date: f.date,
      gross_income: f.gross_income,
      capital_expenditure: f.capital_expenditure,
      account_id: localRelation(accountMap, f.account_id),
      category_id: localRelation(categoryMap, f.category_id),
      transacted_account_id: localRelation(accountMap, f.transacted_account_id),
      cc_payment_covered_id: null as string | null, // income→income link resolved in a later pass
      is_transaction: f.is_transaction
    }
    const deleted = isDeletedTitle(f.title) ? 1 : 0
    const base = JSON.stringify(incomeBaseSnapshot(f, writable))
    const lastEdited = pageLastEditedTime(page)
    const npid = pageId(page)

    const existing = db
      .prepare("SELECT id, sync_state FROM incomes WHERE notion_page_id = ?")
      .get(npid) as { id: string; sync_state: string } | undefined

    if (!existing) {
      db.prepare(
        `INSERT INTO incomes (id, notion_page_id, base_snapshot, sync_state, local_updated_at,
           notion_last_edited_at, deleted, created_at, title, gross_income, capital_expenditure,
           account_id, category_id, date, is_transaction, transacted_account_id, cc_payment_covered_id)
         VALUES (?, ?, ?, 'clean', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        randomUUID(), npid, base, now(), lastEdited, deleted, now(),
        writable.title, writable.gross_income, writable.capital_expenditure,
        writable.account_id, writable.category_id, writable.date, writable.is_transaction,
        writable.transacted_account_id, writable.cc_payment_covered_id
      )
      outcome.inserted++
    } else if (existing.sync_state === 'dirty' || existing.sync_state === 'conflict') {
      outcome.skippedDirty++
    } else {
      db.prepare(
        `UPDATE incomes SET title = ?, gross_income = ?, capital_expenditure = ?, account_id = ?,
           category_id = ?, date = ?, is_transaction = ?, transacted_account_id = ?,
           deleted = ?, base_snapshot = ?, notion_last_edited_at = ?, sync_state = 'clean' WHERE id = ?`
      ).run(
        writable.title, writable.gross_income, writable.capital_expenditure, writable.account_id,
        writable.category_id, writable.date, writable.is_transaction, writable.transacted_account_id,
        deleted, base, lastEdited, existing.id
      )
      outcome.updated++
    }
  }
  return outcome
}

async function pullExpenses(
  dbId: string,
  since: string | undefined,
  accountMap: Map<string, string>,
  categoryMap: Map<string, string>
): Promise<RecordUpsertOutcome> {
  const db = getSqlite()
  const pages = await client().queryDatabase(dbId, { since })
  const outcome: RecordUpsertOutcome = { inserted: 0, updated: 0, skippedDirty: 0 }

  for (const page of pages) {
    const f = pageToExpenseFields(page)
    const writable = {
      title: f.title,
      amount: f.amount,
      interest: f.interest,
      account_id: localRelation(accountMap, f.account_id),
      category_id: localRelation(categoryMap, f.category_id),
      purchase_date: f.purchase_date,
      date_paid: f.date_paid,
      payment_status: f.payment_status,
      payment_frequency: f.payment_frequency,
      period_count: f.period_count,
      paid_period: f.paid_period,
      pasabuyer: f.pasabuyer,
      pasabuy_status: f.pasabuy_status,
      pasabuy_date_of_payment: f.pasabuy_date_of_payment,
      pasabuy_paid_period: f.pasabuy_paid_period,
      pasabuy_account_receiver_id: localRelation(accountMap, f.pasabuy_account_receiver_id),
      cc_link_payment_receipt_id: null as string | null
    }
    const deleted = isDeletedTitle(f.title) ? 1 : 0
    const base = JSON.stringify(expenseBaseSnapshot(f, writable))
    const lastEdited = pageLastEditedTime(page)
    const npid = pageId(page)

    const existing = db
      .prepare("SELECT id, sync_state FROM expenses WHERE notion_page_id = ?")
      .get(npid) as { id: string; sync_state: string } | undefined

    if (!existing) {
      db.prepare(
        `INSERT INTO expenses (id, notion_page_id, base_snapshot, sync_state, local_updated_at,
           notion_last_edited_at, deleted, created_at, title, amount, interest, account_id,
           category_id, purchase_date, date_paid, payment_status, payment_frequency, period_count,
           paid_period, is_pasabuy, pasabuyer, pasabuy_status, pasabuy_date_of_payment,
           pasabuy_paid_period, pasabuy_account_receiver_id, cc_link_payment_receipt_id)
         VALUES (?, ?, ?, 'clean', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        randomUUID(), npid, base, now(), lastEdited, deleted, now(),
        writable.title, writable.amount, writable.interest, writable.account_id, writable.category_id,
        writable.purchase_date, writable.date_paid, writable.payment_status, writable.payment_frequency,
        writable.period_count, writable.paid_period, writable.pasabuyer ? 1 : 0, writable.pasabuyer,
        writable.pasabuy_status, writable.pasabuy_date_of_payment, writable.pasabuy_paid_period,
        writable.pasabuy_account_receiver_id, writable.cc_link_payment_receipt_id
      )
      outcome.inserted++
    } else if (existing.sync_state === 'dirty' || existing.sync_state === 'conflict') {
      outcome.skippedDirty++
    } else {
      db.prepare(
        `UPDATE expenses SET title = ?, amount = ?, interest = ?, account_id = ?, category_id = ?,
           purchase_date = ?, date_paid = ?, payment_status = ?, payment_frequency = ?,
           period_count = ?, paid_period = ?, is_pasabuy = ?, pasabuyer = ?, pasabuy_status = ?,
           pasabuy_date_of_payment = ?, pasabuy_paid_period = ?, pasabuy_account_receiver_id = ?,
           deleted = ?, base_snapshot = ?, notion_last_edited_at = ?, sync_state = 'clean' WHERE id = ?`
      ).run(
        writable.title, writable.amount, writable.interest, writable.account_id, writable.category_id,
        writable.purchase_date, writable.date_paid, writable.payment_status, writable.payment_frequency,
        writable.period_count, writable.paid_period, writable.pasabuyer ? 1 : 0, writable.pasabuyer,
        writable.pasabuy_status, writable.pasabuy_date_of_payment, writable.pasabuy_paid_period,
        writable.pasabuy_account_receiver_id, deleted, base, lastEdited, existing.id
      )
      outcome.updated++
    }
  }
  return outcome
}

// base_snapshot mirrors the writable fields the push engine sends (local-id space) so the
// Phase 4 three-way merge has a consistent ancestor on both sides.
function incomeBaseSnapshot(f: IncomeFields, w: Record<string, unknown>): Record<string, unknown> {
  return {
    name: w.title,
    date: w.date,
    grossIncome: f.gross_income,
    capitalExpenditure: f.capital_expenditure,
    accountId: w.account_id,
    categoryId: w.category_id,
    transactedAccountId: w.transacted_account_id,
    ccPaymentCoveredId: w.cc_payment_covered_id
  }
}

function expenseBaseSnapshot(f: ExpenseFields, w: Record<string, unknown>): Record<string, unknown> {
  return {
    description: w.title,
    purchaseDate: w.purchase_date,
    datePaid: w.date_paid,
    amount: f.amount,
    interest: f.interest,
    accountId: w.account_id,
    categoryId: w.category_id,
    paymentStatus: w.payment_status,
    paymentFrequency: w.payment_frequency,
    periodCount: w.period_count,
    paidPeriod: w.paid_period,
    pasabuyer: w.pasabuyer,
    pasabuyStatus: w.pasabuy_status,
    pasabuyDateOfPayment: w.pasabuy_date_of_payment,
    pasabuyPaidPeriod: w.pasabuy_paid_period,
    pasabuyAccountReceiverId: w.pasabuy_account_receiver_id,
    ccLinkPaymentReceiptId: w.cc_link_payment_receipt_id
  }
}

// ── the pull pass ───────────────────────────────────────────────────────────

export async function pullAll(full = false): Promise<PullResult> {
  const status = syncStatus()
  if (!status.connected) throw new Error('Notion is not connected')
  if (!status.mapped) throw new Error('Databases are not mapped yet')
  if (isRunning()) {
    return { referenceUpserted: 0, inserted: 0, updated: 0, skippedDirty: 0, errors: ['sync already running'], cursor: metaGet(META_KEYS.lastPullCursor) }
  }

  setRunning(true)
  emitStatus()
  const result: PullResult = { referenceUpserted: 0, inserted: 0, updated: 0, skippedDirty: 0, errors: [], cursor: null }
  const mapping = getMapping()
  const since = full ? undefined : (metaGet(META_KEYS.lastPullCursor) ?? undefined)
  // Capture the pass start BEFORE fetching, so edits during the pull are caught next time.
  const passStart = new Date().toISOString()

  try {
    // 1) reference caches first (relations depend on them)
    if (mapping.accounts) result.referenceUpserted += await pullAccounts(mapping.accounts, since)
    if (mapping.incomeCategories) result.referenceUpserted += await pullIncomeCategories(mapping.incomeCategories, since)
    if (mapping.expenseCategories) result.referenceUpserted += await pullExpenseCategories(mapping.expenseCategories, since)

    const accountMap = notionToLocal('accounts')
    const incomeCatMap = notionToLocal('income_categories')
    const expenseCatMap = notionToLocal('expense_categories')

    // 2) records
    if (mapping.incomes) {
      const o = await pullIncomes(mapping.incomes, since, accountMap, incomeCatMap)
      result.inserted += o.inserted
      result.updated += o.updated
      result.skippedDirty += o.skippedDirty
    }
    if (mapping.expenses) {
      const o = await pullExpenses(mapping.expenses, since, accountMap, expenseCatMap)
      result.inserted += o.inserted
      result.updated += o.updated
      result.skippedDirty += o.skippedDirty
    }

    metaSet(META_KEYS.lastPullCursor, passStart)
    metaSet(META_KEYS.lastPullAt, String(Date.now()))
    result.cursor = passStart

    // Refresh every window: records changed, derived values recompute.
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
