import type { IncomeRecordDto } from './finance.types'

export const MONEY_LENT_CATEGORY = 'Money Lent'
export const isMoneyLentCategory = (source: string | undefined): boolean =>
  source?.trim().toLowerCase() === MONEY_LENT_CATEGORY.toLowerCase()

/** A loan affects its source account once; only its receivable presentation is positive. */
export function isOutstandingMoneyLent(record: IncomeRecordDto, source: string | undefined): boolean {
  return isMoneyLentCategory(source) && !record.deleted && record.grossIncome < 0 && Boolean(record.accountId)
}

export function receivableAmount(record: IncomeRecordDto, source: string | undefined): number {
  return isOutstandingMoneyLent(record, source) ? -record.grossIncome : record.grossIncome
}

export interface RepayMoneyLentInput {
  receivingAccountId: string
  date: string
  /** Reject stale previews, including edits made in another window. */
  expectedAmount: number
  expectedSourceAccountId: string
}
