// Exact ports of the Notion database formulas (decoded from the workspace schema export).
// These are the single source of truth for the desktop's local computation, so offline
// numbers match Notion's formula engine field-for-field.
//
//   Income  · Transaction Amount = (transactedAccount set & category∈{Transfer,
//             Credit Card Payment, Debit Payment}) ? −GrossIncome : —
//   Expense · Gross Price        = Amount + Interest
//   Expense · Installment Amount = periodCount ? GrossPrice / periodCount : —
//   Expense · Paid Amount        = (periodCount & status) ? InstallmentAmount × paidPeriod : —
//   Expense · Remaining Balance  = (periodCount & status) ? GrossPrice − PaidAmount : —
//   Expense · Pasabuy Received   = (pasabuy category & receiver) ? InstallmentAmount × pasabuyPaidPeriod : 0
//   Expense · Pasabuyer Balance  = (pasabuy category & status) ? (status="fully received" ? 0
//                                    : Amount − InstallmentAmount × pasabuyPaidPeriod) : —
//
// ROUNDING MODEL (matches Notion): Notion formulas compute at full floating-point
// precision and a 2-decimal "number format" is DISPLAY-ONLY — it never rounds the stored
// value, and rollup Sums aggregate the full-precision numbers. So these ports keep
// intermediate results (Installment Amount, Pasabuy Received) UNROUNDED and round only at
// the final consumer: each displayed scalar rounds once, and the Total Pasabuy rollup is
// summed then rounded once in computeAccountBalance. Rounding an intermediate before a
// later multiply double-rounds and drifts the balance by ±0.01 (e.g. 25000/6 → 4166.6667,
// which must not collapse to 4166.67 before ×2).
import type { ExpenseRecordDto, IncomeRecordDto } from '../../shared/finance.types'

export const round2 = (v: number): number => Math.round((v + Number.EPSILON) * 100) / 100

// ── Income · Transaction Amount ─────────────────────────────────────────────
const TRANSACTION_CATEGORY_TOKENS = ['transfer', 'credit card payment', 'debit payment']

export function isTransactionCategory(categoryName: string | undefined): boolean {
  const n = (categoryName ?? '').toLowerCase()
  return TRANSACTION_CATEGORY_TOKENS.some((t) => n.includes(t))
}

/** Notion "Transaction Amount": negative gross for transacted Transfer/CC-Payment/Debit rows. */
export function transactionAmount(
  income: Pick<IncomeRecordDto, 'grossIncome' | 'transactedAccountId'>,
  categoryName: string | undefined
): number {
  if (!income.transactedAccountId) return 0
  return isTransactionCategory(categoryName) ? -income.grossIncome : 0
}

// ── Expense formulas ────────────────────────────────────────────────────────
type ExpenseCalc = Pick<
  ExpenseRecordDto,
  'amount' | 'interest' | 'periodCount' | 'paidPeriod' | 'paymentStatus'
> & { pasabuyStatus?: ExpenseRecordDto['pasabuyStatus']; pasabuyPaidPeriod?: number | null }

export const grossPrice = (e: Pick<ExpenseRecordDto, 'amount' | 'interest'>): number =>
  round2(e.amount + e.interest)

export function installmentAmount(e: ExpenseCalc): number | null {
  if (!e.periodCount || e.periodCount <= 0) return null
  // FULL PRECISION (unrounded) — Notion's Installment Amount is unrounded; the 2-decimal
  // display is formatting-only. Consumers below round at the end so a value like
  // 25000/6 = 4166.6667 isn't prematurely collapsed to 4166.67 and then multiplied.
  return grossPrice(e) / e.periodCount // periodCount === 1 → GrossPrice
}

export function paidAmount(e: ExpenseCalc): number | null {
  if (!e.periodCount || !e.paymentStatus) return null
  // Single round from the full-precision installment (displayed scalar).
  return round2((installmentAmount(e) ?? 0) * (e.paidPeriod ?? 0))
}

export function remainingBalance(e: ExpenseCalc): number | null {
  if (!e.periodCount || !e.paymentStatus) return null
  // Subtract the full-precision paid amount, then round once (not gross − roundedPaid).
  return round2(grossPrice(e) - (installmentAmount(e) ?? 0) * (e.paidPeriod ?? 0))
}

export function isPasabuyCategoryName(categoryName: string | undefined): boolean {
  return (categoryName ?? '').toLowerCase().includes('pasabuy')
}

export function pasabuyReceivedAmount(
  e: ExpenseCalc & { pasabuyAccountReceiverId?: string | null },
  categoryName: string | undefined
): number {
  if (!e.pasabuyAccountReceiverId || !isPasabuyCategoryName(categoryName)) return 0
  // FULL PRECISION — feeds the Total Pasabuy rollup, which computeAccountBalance sums and
  // rounds ONCE (mirrors Notion summing full-precision rollups). Rounding here would
  // double-round and drift Current Balance by a centavo on non-even installments.
  return (installmentAmount(e) ?? 0) * (e.pasabuyPaidPeriod ?? 0)
}

/** Notion "Pasabuyer Balance": Amount − (InstallmentAmount × pasabuyPaidPeriod); 0 if fully received. */
export function pasabuyerBalance(
  e: ExpenseCalc,
  categoryName: string | undefined
): number | null {
  if (!isPasabuyCategoryName(categoryName) || !e.pasabuyStatus) return null
  if (e.pasabuyStatus === 'Payment fully received') return 0
  // Received at full precision; round the displayed balance once (not amount − roundedReceived).
  const received = (installmentAmount(e) ?? 0) * (e.pasabuyPaidPeriod ?? 0)
  return round2(e.amount - received)
}
