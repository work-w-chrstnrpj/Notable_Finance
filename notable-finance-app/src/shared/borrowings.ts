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

// ── Loan terms (ADR-0007) ────────────────────────────────────────────────────
// Derived values are computed here, never stored (ADR-0004).

type LoanRecord = Pick<
  IncomeRecordDto,
  'id' | 'grossIncome' | 'deleted' | 'interest' | 'paymentFrequency' | 'periodCount'
>
type RepaymentRecord = Pick<IncomeRecordDto, 'grossIncome' | 'deleted' | 'linkedBorrowingId'>

export interface LoanSummary {
  principal: number
  interest: number
  /** Principal plus Interest. */
  totalOwed: number
  /** Total owed / Period count; null unless Period count is a positive whole number. A guide, never enforced. */
  suggestedPayment: number | null
  /** Sum of linked, non-deleted repayments. */
  paidAmount: number
  /** Count of linked, non-deleted repayments. */
  paymentsMade: number
  /** max(0, total owed − paid amount). */
  remainingBalance: number
}

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100

/** A Borrowed row carries Loan terms when any of Interest, Payment Frequency or Period count is set. */
export function hasLoanTerms(loan: Pick<IncomeRecordDto, 'interest' | 'paymentFrequency' | 'periodCount'>): boolean {
  return loan.interest != null || loan.paymentFrequency != null || loan.periodCount != null
}

/** Total owed, Suggested payment, Paid amount, Payments made and Remaining balance for one loan. */
export function computeLoanSummary(loan: LoanRecord, repayments: readonly RepaymentRecord[]): LoanSummary {
  const principal = Math.abs(loan.grossIncome)
  const interest = loan.interest ?? 0
  const totalOwed = round2(principal + interest)
  const linked = repayments.filter((r) => !r.deleted && r.linkedBorrowingId === loan.id)
  const paidAmount = round2(linked.reduce((sum, r) => sum + Math.abs(r.grossIncome), 0))
  const periods = loan.periodCount
  const suggestedPayment =
    hasLoanTerms(loan) && periods != null && Number.isInteger(periods) && periods > 0
      ? round2(totalOwed / periods)
      : null
  return {
    principal,
    interest,
    totalOwed,
    suggestedPayment,
    paidAmount,
    paymentsMade: linked.length,
    remainingBalance: Math.max(0, round2(totalOwed - paidAmount))
  }
}

/**
 * What is still owed on one Borrow account: the Remaining balance of each loan with terms,
 * plus the existing balance-based amount for borrowings without terms.
 *
 * `balanceOwed` is the account's current balance-based amount (the negative of its balance). It still
 * counts every loan's principal and every repayment, so the part that belongs to loans with terms is
 * taken out (principal added back, linked repayments removed) and replaced by their Remaining balance.
 * Unlinked repayments are never attributed to a loan, so they stay in the balance-based amount.
 */
export function stillOwedForBorrowAccount(
  accountId: string,
  balanceOwed: number,
  records: ReadonlyArray<LoanRecord & RepaymentRecord & Pick<IncomeRecordDto, 'accountId'>>
): number {
  const loans = records.filter((r) => !r.deleted && r.accountId === accountId && hasLoanTerms(r))
  let balanceBased = balanceOwed
  let remaining = 0
  for (const loan of loans) {
    const summary = computeLoanSummary(loan, records)
    balanceBased += summary.paidAmount - summary.principal
    remaining += summary.remainingBalance
  }
  return round2(balanceBased + remaining)
}
