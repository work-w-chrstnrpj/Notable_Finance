import { ResourceName } from '../common/finance.types';

// Pure, stateless helpers extracted from NotionService (P4-3) so the service is
// smaller and these are unit-testable in isolation. No cache or client state.

/** Resources whose records live in the Incomes database. */
export function isIncomeBacked(resource: ResourceName): boolean {
  return [
    'incomes',
    'transactions',
    'transfers',
    'creditCardPayments',
    'alkansya',
    'receivables',
  ].includes(resource);
}

/** Resources whose records live in the Expenses database. */
export function isExpenseBacked(resource: ResourceName): boolean {
  return resource === 'expenses' || resource === 'expenseScheduler';
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function isCreditLike(type: string): boolean {
  return type === 'Credit Account' || type === 'e-Credit' || type === 'BNPL';
}

export function filterByMonth<T>(records: T[], field: keyof T, month: string): T[] {
  return records.filter((record) => String(record[field]).startsWith(month));
}

/**
 * Inclusive date-range filter on an ISO date string field. Records with an
 * empty date value are excluded. Bounds are compared lexicographically, which
 * is correct for zero-padded YYYY-MM-DD strings.
 */
export function filterByRange<T>(
  records: T[],
  field: keyof T,
  start?: string,
  end?: string,
): T[] {
  return records.filter((record) => {
    const value = record[field] ? String(record[field]).slice(0, 10) : '';
    if (!value) return false;
    if (start && value < start) return false;
    if (end && value > end) return false;
    return true;
  });
}
