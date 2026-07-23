import { isCreditLike } from '../domain/resource-utils'

export type ExpenseProfileFlags = {
  creditCard: boolean
  pasabuy: boolean
}

/** Pure profile resolver for expense forms / propose tools (Phase 6.6). */
export function resolveExpenseProfile(input: {
  accountType?: string | null
  categoryName?: string | null
  viewMode?: string | null
  forcePasabuy?: boolean
  forceCc?: boolean
}): ExpenseProfileFlags {
  const creditCard =
    input.forceCc === true ||
    (input.accountType ? isCreditLike(input.accountType) : false)
  const pasabuy =
    input.forcePasabuy === true ||
    (input.categoryName ? /pasabuy/i.test(input.categoryName) : false) ||
    input.viewMode === 'Unpaid Pasabuy'
  return { creditCard, pasabuy }
}

export function expenseProfileMissingFields(input: {
  creditCard: boolean
  pasabuy: boolean
  hasDescription: boolean
  hasPurchaseDate: boolean
  hasAmount: boolean
  hasAccount: boolean
  hasCategory: boolean
  paymentStatus?: string | null
  paymentFrequency?: string | null
  periodCount?: number | null
  pasabuyer?: string | null
  pasabuyStatus?: string | null
}): string[] {
  const missing: string[] = []
  if (!input.hasDescription) missing.push('Purchase description')
  if (!input.hasPurchaseDate) missing.push('Purchase Date')
  if (!input.hasAmount) missing.push('Expense Amount')
  if (!input.hasAccount) missing.push('Account')
  if (!input.hasCategory) missing.push('Category')
  if (input.creditCard && !input.paymentStatus) missing.push('Payment Status')
  if (input.creditCard && input.paymentStatus === 'Installment') {
    if (!input.paymentFrequency) missing.push('Payment Frequency')
    if (!input.periodCount) missing.push('Period count')
  }
  if (input.pasabuy && !input.pasabuyer) missing.push('Pasabuyer')
  if (input.pasabuy && !input.pasabuyStatus) missing.push('Pasabuy Status')
  return missing
}

/** Locked income category sources for workflow propose tools. */
export const WORKFLOW_LOCKED_CATEGORIES = {
  transfer: 'Transfer',
  ccPayment: 'Credit Card Payment',
  alkansyaDefault: 'Savings'
} as const
