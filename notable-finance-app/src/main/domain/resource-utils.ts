// Pure, stateless helpers — COPIED from
// notable-finance-web/service/src/notion/notion-resource-utils.ts
// (trimmed to what the desktop derivations need). No cache/client state.
import type { ResourceName } from '../../shared/finance.types'

/** Resources whose records live in the Incomes database. */
export function isIncomeBacked(resource: ResourceName): boolean {
  return [
    'incomes',
    'transactions',
    'transfers',
    'creditCardPayments',
    'alkansya',
    'receivables'
  ].includes(resource)
}

/** Resources whose records live in the Expenses database. */
export function isExpenseBacked(resource: ResourceName): boolean {
  return resource === 'expenses' || resource === 'expenseScheduler'
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export function isCreditLike(type: string): boolean {
  return type === 'Credit Account' || type === 'e-Credit' || type === 'BNPL'
}

/** Filter records whose ISO date field falls in the given YYYY-MM month. */
export function filterByMonth<T>(records: T[], field: keyof T, month: string): T[] {
  return records.filter((record) => String(record[field]).startsWith(month))
}

/**
 * Inclusive date-range filter on an ISO date string field. Records with an empty
 * date value are excluded. Bounds compare lexicographically (correct for YYYY-MM-DD).
 */
export function filterByRange<T>(
  records: T[],
  field: keyof T,
  start?: string,
  end?: string
): T[] {
  return records.filter((record) => {
    const value = record[field] ? String(record[field]).slice(0, 10) : ''
    if (!value) return false
    if (start && value < start) return false
    if (end && value > end) return false
    return true
  })
}
