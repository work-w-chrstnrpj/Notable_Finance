// Shared writable-field views (camelCase) for incomes/expenses. This is the single space
// in which base_snapshot is stored and push, pull, and three-way merge all operate, so a
// stored base is a true common ancestor. Row helpers read from snake_case SQLite rows;
// write helpers persist a merged writable map back with its base_snapshot and sync_state.
import { getSqlite } from '../db'
import type { FieldMap } from './merge'

export type SyncState = 'clean' | 'dirty' | 'conflict'

type Row = Record<string, unknown>

export const INCOME_WRITABLE_COLS: Record<string, string> = {
  name: 'title',
  date: 'date',
  grossIncome: 'gross_income',
  capitalExpenditure: 'capital_expenditure',
  accountId: 'account_id',
  categoryId: 'category_id',
  transactedAccountId: 'transacted_account_id',
  ccPaymentCoveredIds: 'cc_payment_covered_id'
}

export const EXPENSE_WRITABLE_COLS: Record<string, string> = {
  description: 'title',
  purchaseDate: 'purchase_date',
  datePaid: 'date_paid',
  amount: 'amount',
  interest: 'interest',
  accountId: 'account_id',
  categoryId: 'category_id',
  paymentStatus: 'payment_status',
  paymentFrequency: 'payment_frequency',
  periodCount: 'period_count',
  paidPeriod: 'paid_period',
  pasabuyer: 'pasabuyer',
  pasabuyStatus: 'pasabuy_status',
  pasabuyDateOfPayment: 'pasabuy_date_of_payment',
  pasabuyPaidPeriod: 'pasabuy_paid_period',
  pasabuyAccountReceiverId: 'pasabuy_account_receiver_id',
  ccLinkPaymentReceiptId: 'cc_link_payment_receipt_id'
}

function rowToWritable(row: Row, cols: Record<string, string>): FieldMap {
  const out: FieldMap = {}
  for (const [key, col] of Object.entries(cols)) {
    let value = row[col] ?? null
    // ccPaymentCoveredIds is stored as a JSON array in a text column
    if (key === 'ccPaymentCoveredIds' && typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        value = Array.isArray(parsed) ? parsed : value ? [value] : []
      } catch {
        value = value ? [value] : []
      }
    }
    out[key] = value
  }
  return out
}

export const incomeWritableFromRow = (row: Row): FieldMap => rowToWritable(row, INCOME_WRITABLE_COLS)
export const expenseWritableFromRow = (row: Row): FieldMap => rowToWritable(row, EXPENSE_WRITABLE_COLS)

export interface WriteOpts {
  base: FieldMap
  syncState: SyncState
  notionLastEditedAt?: string | null
  deleted?: number
}

function writeWritable(
  table: string,
  cols: Record<string, string>,
  id: string,
  writable: FieldMap,
  opts: WriteOpts
): void {
  const sets: string[] = []
  const values: unknown[] = []
  for (const [key, col] of Object.entries(cols)) {
    sets.push(`${col} = ?`)
    let value = writable[key] ?? null
    // ccPaymentCoveredIds is an array that must be serialized to JSON for storage
    if (key === 'ccPaymentCoveredIds' && Array.isArray(value)) {
      value = value.length > 0 ? JSON.stringify(value) : null
    }
    values.push(value)
  }
  sets.push('base_snapshot = ?', 'sync_state = ?')
  values.push(JSON.stringify(opts.base), opts.syncState)
  if (opts.notionLastEditedAt !== undefined) {
    sets.push('notion_last_edited_at = ?')
    values.push(opts.notionLastEditedAt)
  }
  if (opts.deleted !== undefined) {
    sets.push('deleted = ?')
    values.push(opts.deleted)
  }
  values.push(id)
  getSqlite().prepare(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`).run(...values)
}

export const writeIncomeWritable = (id: string, w: FieldMap, opts: WriteOpts): void =>
  writeWritable('incomes', INCOME_WRITABLE_COLS, id, w, opts)

export const writeExpenseWritable = (id: string, w: FieldMap, opts: WriteOpts): void =>
  writeWritable('expenses', EXPENSE_WRITABLE_COLS, id, w, opts)
