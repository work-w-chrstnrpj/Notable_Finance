// Discard / undo an unsynced local change from History.
//
// - Never-synced create  → delete the local row (cancel creation)
// - Dirty update / soft-delete / conflict → restore writable fields from base_snapshot,
//   clear deleted + conflict + mutation_queue, mark clean
// - Pending hard-delete  → drop the trash intent and re-insert the local row from the
//   snapshot stored in the queue payload (Notion page is left alone)
import { getSqlite } from '../db'
import { ValidationError } from '../domain/validation'
import {
  expenseWritableFromRow,
  incomeWritableFromRow,
  writeExpenseWritable,
  writeIncomeWritable
} from '../sync/writable'
import type { FieldMap } from '../sync/merge'
import type { SyncedResource } from '../../shared/finance.types'

type Table = SyncedResource

export type HardDeletePayload = {
  notionPageId: string
  title: string
  /** Writable fields to restore (prefer last synced base). */
  snapshot: FieldMap
  baseSnapshot: string | null
  notionLastEditedAt: string | null
  extras?: {
    notes?: string | null
    isTransaction?: number
    isPasabuy?: number
  }
}

function clearBookkeeping(resource: SyncedResource, recordId: string): void {
  const db = getSqlite()
  db.prepare('DELETE FROM mutation_queue WHERE resource = ? AND record_id = ?').run(
    resource,
    recordId
  )
  db.prepare('DELETE FROM conflicts WHERE record_table = ? AND record_id = ?').run(
    resource,
    recordId
  )
}

function restoreFromBaseSnapshot(table: Table, id: string): void {
  const db = getSqlite()
  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | undefined
  if (!row) throw new ValidationError(`${table} ${id} not found`)

  clearBookkeeping(table, id)

  // Never pushed → cancel creation by removing the row.
  if (!row.notion_page_id) {
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)
    return
  }

  let base: FieldMap = {}
  try {
    base = JSON.parse(String(row.base_snapshot ?? '{}')) as FieldMap
  } catch {
    base = {}
  }

  // No usable ancestor: fall back to current writable values and just clear dirty/conflict.
  if (!base || Object.keys(base).length === 0) {
    base =
      table === 'incomes' ? incomeWritableFromRow(row) : expenseWritableFromRow(row)
  }

  const opts = {
    base,
    syncState: 'clean' as const,
    deleted: 0,
    notionLastEditedAt:
      row.notion_last_edited_at === undefined
        ? undefined
        : ((row.notion_last_edited_at as string | null) ?? null)
  }

  if (table === 'incomes') writeIncomeWritable(id, base, opts)
  else writeExpenseWritable(id, base, opts)

  db.prepare(`UPDATE ${table} SET local_updated_at = ? WHERE id = ?`).run(Date.now(), id)
}

function discardHardDelete(resource: SyncedResource, recordId: string): void {
  const db = getSqlite()
  const queue = db
    .prepare(
      `SELECT id, payload FROM mutation_queue
        WHERE resource = ? AND record_id = ? AND action = 'hardDelete'
        LIMIT 1`
    )
    .get(resource, recordId) as { id: string; payload: string | null } | undefined

  if (!queue) throw new ValidationError(`No pending hard-delete for ${resource}/${recordId}`)

  let payload: HardDeletePayload | null = null
  try {
    payload = JSON.parse(queue.payload ?? 'null') as HardDeletePayload | null
  } catch {
    payload = null
  }

  db.prepare('DELETE FROM mutation_queue WHERE id = ?').run(queue.id)

  // Old queue rows may lack a snapshot — cancel Notion trash only; pull can restore later.
  if (!payload?.snapshot || !payload.notionPageId) return

  const existing = db.prepare(`SELECT id FROM ${resource} WHERE id = ?`).get(recordId)
  if (existing) {
    // Row somehow still present — just ensure clean + not deleted.
    const opts = {
      base: payload.snapshot,
      syncState: 'clean' as const,
      deleted: 0,
      notionLastEditedAt: payload.notionLastEditedAt
    }
    if (resource === 'incomes') writeIncomeWritable(recordId, payload.snapshot, opts)
    else writeExpenseWritable(recordId, payload.snapshot, opts)
    db.prepare(
      `UPDATE ${resource} SET notion_page_id = ?, base_snapshot = ?, local_updated_at = ? WHERE id = ?`
    ).run(
      payload.notionPageId,
      payload.baseSnapshot ?? JSON.stringify(payload.snapshot),
      Date.now(),
      recordId
    )
    return
  }

  const t = Date.now()
  const s = payload.snapshot
  const baseJson = payload.baseSnapshot ?? JSON.stringify(payload.snapshot)

  if (resource === 'incomes') {
    db.prepare(
      `INSERT INTO incomes (id, notion_page_id, base_snapshot, sync_state, local_updated_at,
         notion_last_edited_at, deleted, created_at, title, gross_income, capital_expenditure,
         account_id, category_id, date, notes, is_transaction, transacted_account_id, cc_payment_covered_id)
       VALUES (?, ?, ?, 'clean', ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      recordId,
      payload.notionPageId,
      baseJson,
      t,
      payload.notionLastEditedAt,
      t,
      String(s.name ?? payload.title ?? 'Restored'),
      Number(s.grossIncome ?? 0),
      Number(s.capitalExpenditure ?? 0),
      (s.accountId as string | null) ?? null,
      (s.categoryId as string | null) ?? null,
      (s.date as string | null) ?? null,
      payload.extras?.notes ?? null,
      payload.extras?.isTransaction ?? 0,
      (s.transactedAccountId as string | null) ?? null,
      (s.ccPaymentCoveredId as string | null) ?? null
    )
  } else {
    db.prepare(
      `INSERT INTO expenses (id, notion_page_id, base_snapshot, sync_state, local_updated_at,
         notion_last_edited_at, deleted, created_at, title, amount, interest, account_id,
         category_id, purchase_date, date_paid, payment_status, payment_frequency, period_count,
         paid_period, is_pasabuy, pasabuyer, pasabuy_status, pasabuy_date_of_payment,
         pasabuy_paid_period, pasabuy_account_receiver_id, cc_link_payment_receipt_id)
       VALUES (?, ?, ?, 'clean', ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      recordId,
      payload.notionPageId,
      baseJson,
      t,
      payload.notionLastEditedAt,
      t,
      String(s.description ?? payload.title ?? 'Restored'),
      Number(s.amount ?? 0),
      Number(s.interest ?? 0),
      (s.accountId as string | null) ?? null,
      (s.categoryId as string | null) ?? null,
      (s.purchaseDate as string | null) ?? null,
      (s.datePaid as string | null) ?? null,
      (s.paymentStatus as string | null) ?? 'Unpaid',
      (s.paymentFrequency as string | null) ?? null,
      s.periodCount == null ? null : Number(s.periodCount),
      s.paidPeriod == null ? null : Number(s.paidPeriod),
      payload.extras?.isPasabuy ?? 0,
      (s.pasabuyer as string | null) ?? null,
      (s.pasabuyStatus as string | null) ?? null,
      (s.pasabuyDateOfPayment as string | null) ?? null,
      s.pasabuyPaidPeriod == null ? null : Number(s.pasabuyPaidPeriod),
      (s.pasabuyAccountReceiverId as string | null) ?? null,
      (s.ccLinkPaymentReceiptId as string | null) ?? null
    )
  }
}

/**
 * Discard one unsynced History item: cancel a local create, or restore the last
 * synced state (including undoing soft/hard deletes that have not reached Notion).
 */
export function discardUnsynced(resource: SyncedResource, recordId: string): void {
  const db = getSqlite()
  const hard = db
    .prepare(
      `SELECT 1 AS n FROM mutation_queue
        WHERE resource = ? AND record_id = ? AND action = 'hardDelete' LIMIT 1`
    )
    .get(resource, recordId) as { n: number } | undefined

  if (hard) {
    discardHardDelete(resource, recordId)
    return
  }

  restoreFromBaseSnapshot(resource, recordId)
}

/** Build the hard-delete queue payload (snapshot for later discard/restore). */
export function buildHardDeletePayload(table: Table, row: Record<string, unknown>): HardDeletePayload {
  const baseRaw = row.base_snapshot as string | null
  let snapshot: FieldMap = {}
  try {
    snapshot = JSON.parse(baseRaw ?? '{}') as FieldMap
  } catch {
    snapshot = {}
  }
  if (!snapshot || Object.keys(snapshot).length === 0) {
    snapshot = table === 'incomes' ? incomeWritableFromRow(row) : expenseWritableFromRow(row)
  }

  return {
    notionPageId: String(row.notion_page_id),
    title: String(row.title ?? ''),
    snapshot,
    baseSnapshot: baseRaw,
    notionLastEditedAt: (row.notion_last_edited_at as string | null) ?? null,
    extras: {
      notes: (row.notes as string | null) ?? null,
      isTransaction: Number(row.is_transaction ?? 0),
      isPasabuy: Number(row.is_pasabuy ?? 0)
    }
  }
}
