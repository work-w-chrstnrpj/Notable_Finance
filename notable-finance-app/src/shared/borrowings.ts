import type { AccountDto, IncomeRecordDto } from './finance.types'

/**
 * Borrowed money is stored like a Transfer: one Income row in the auxiliary
 * "Borrowed Money" category, negative on `accountId`, credited to
 * `transactedAccountId`. The placeholder ("Borrow") account is any Auxiliary-type
 * account whose name says borrow/debt/loan, so its balance is the negative of what is still owed.
 *
 *   Borrowed:  accountId = placeholder, transactedAccountId = where cash landed
 *   Repayment: accountId = paying account, transactedAccountId = placeholder
 */
export const BORROWED_MONEY_CATEGORY = 'Borrowed Money'
export const isBorrowedMoneyCategory = (source: string | undefined): boolean =>
  source?.trim().toLowerCase() === BORROWED_MONEY_CATEGORY.toLowerCase()

export type BorrowingKind = 'borrowed' | 'repayment'

/** A Borrow account is an Auxiliary-type account whose name contains borrow, debt, loan, utang or hiram (e.g. "Borrowed Money", "Debt/Loan"). */
export const isPlaceholderAccount = (account: Pick<AccountDto, 'type' | 'name'> | undefined): boolean =>
  account?.type === 'Auxiliary' && /borrow|debt|loan|utang|hiram/i.test(account.name ?? '')

/** Borrowed when the debit side is the placeholder; otherwise a repayment into it. */
export function borrowingKind(
  record: Pick<IncomeRecordDto, 'accountId'>,
  placeholderIds: ReadonlySet<string>
): BorrowingKind {
  return record.accountId && placeholderIds.has(record.accountId) ? 'borrowed' : 'repayment'
}

/** Positive amount of money borrowed (+) or repaid (−) for a record, from the debt's point of view. */
export function outstandingDelta(
  record: Pick<IncomeRecordDto, 'accountId' | 'grossIncome' | 'deleted'>,
  placeholderIds: ReadonlySet<string>
): number {
  if (record.deleted) return 0
  const amount = Math.abs(record.grossIncome)
  return borrowingKind(record, placeholderIds) === 'borrowed' ? amount : -amount
}

export function totalOutstanding(
  records: Array<Pick<IncomeRecordDto, 'accountId' | 'grossIncome' | 'deleted'>>,
  placeholderIds: ReadonlySet<string>
): number {
  const total = records.reduce((sum, r) => sum + outstandingDelta(r, placeholderIds), 0)
  return Math.round((total + Number.EPSILON) * 100) / 100
}
