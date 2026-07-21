// Expense/income list filtering — COPIED from the web service's
// notion-query.service.ts (filterExpenseBacked + range fallback + normalizeExpenseViewMode)
// so desktop list outputs match the web app view-for-view. Pure: reference lookups
// (credit accounts, Pasabuy categories) are passed in.
import type { ExpenseRecordDto, IncomeRecordDto } from '../../shared/finance.types'
import { filterByMonth, filterByRange } from './resource-utils'

export interface RangeQuery {
  month?: string
  rangeStart?: string
  rangeEnd?: string
}

export interface ExpenseQuery extends RangeQuery {
  accountId?: string
  categoryId?: string
  pasabuyer?: string
  paymentStatus?: string
  expenseViewMode?: string
}

export interface ExpenseFilterContext {
  creditAccountIds: Set<string>
  pasabuyCategoryIds: Set<string>
  /** Exact "Pasabuy" category id (for the withoutPasabuy filter). */
  pasabuyCategoryId: string | undefined
}

export function normalizeExpenseViewMode(mode?: string): string {
  switch ((mode ?? '').toLowerCase().replace(/\s+/g, '')) {
    case 'unpaidpasabuy':
      return 'unpaidPasabuy'
    case 'topay':
      return 'toPay'
    case 'tobuy':
      return 'toBuy'
    case 'installments':
    case 'installment':
      return 'installments'
    case 'unpaidcc':
    case 'cctransactions':
    case 'cctransaction':
      return 'ccTransactions'
    case 'daily':
      return 'daily'
    case 'weekly':
      return 'weekly'
    case 'monthly':
      return 'monthly'
    case 'annually':
      return 'annually'
    default:
      return 'monthly'
  }
}

/** Date scoping for income-backed lists: explicit range wins, else month prefix. */
export function filterIncomeByQuery(records: IncomeRecordDto[], query: RangeQuery): IncomeRecordDto[] {
  if (query.rangeStart || query.rangeEnd) {
    return filterByRange(records, 'date', query.rangeStart, query.rangeEnd)
  }
  if (query.month) return filterByMonth(records, 'date', query.month)
  return records
}

export function filterExpensesByQuery(
  records: ExpenseRecordDto[],
  query: ExpenseQuery,
  ctx: ExpenseFilterContext
): ExpenseRecordDto[] {
  let filtered = records
  const mode = normalizeExpenseViewMode(query.expenseViewMode)

  switch (mode) {
    case 'unpaidPasabuy':
      filtered = filtered.filter(
        (r) =>
          ctx.pasabuyCategoryIds.has(r.categoryId) &&
          r.paymentStatus !== 'Installment' &&
          ((r.pasabuyBalance ?? 0) > 0.1 ||
            r.pasabuyStatus === 'Payment not yet receive' ||
            r.pasabuyStatus === 'Payment partially received' ||
            (r.pasabuyPaidPeriod ?? 0) !== 1)
      )
      break
    case 'toPay':
      filtered = filtered.filter(
        (r) => !r.datePaid && r.paymentStatus !== 'Installment' && !r.description.includes('Buy: ')
      )
      break
    case 'toBuy':
      filtered = filtered.filter((r) => r.description.includes('Buy: '))
      break
    case 'installments':
      filtered = filtered.filter(
        (r) => r.paymentStatus === 'Installment' && ctx.creditAccountIds.has(r.accountId)
      )
      break
    case 'ccTransactions':
      filtered = filtered.filter((r) => {
        if (r.paymentStatus === 'Installment') return false
        if (!ctx.creditAccountIds.has(r.accountId)) return false
        const grossPrice = r.amount + r.interest
        const paidFraction =
          r.periodCount && r.periodCount > 0 && r.paidPeriod != null
            ? r.paidPeriod / r.periodCount
            : r.datePaid
              ? 1
              : 0
        const remainingBalance = grossPrice * (1 - paidFraction)
        return !r.datePaid || r.paymentStatus === 'Unpaid' || r.paidPeriod == null || remainingBalance > 0.1
      })
      break
    default:
      if (query.rangeStart || query.rangeEnd) {
        filtered = filterByRange(filtered, 'purchaseDate', query.rangeStart, query.rangeEnd)
      } else if (query.month) {
        filtered = filterByMonth(filtered, 'purchaseDate', query.month)
      }
      break
  }

  if (query.accountId) filtered = filtered.filter((r) => r.accountId === query.accountId)
  if (query.categoryId && query.categoryId !== 'all') {
    if (query.categoryId === 'withoutPasabuy' || query.categoryId === '__without-pasabuy') {
      filtered = filtered.filter((r) => r.categoryId !== ctx.pasabuyCategoryId)
    } else {
      filtered = filtered.filter((r) => r.categoryId === query.categoryId)
    }
  }
  if (query.pasabuyer) filtered = filtered.filter((r) => r.pasabuyer === query.pasabuyer)
  if (query.paymentStatus) filtered = filtered.filter((r) => r.paymentStatus === query.paymentStatus)
  return filtered
}
