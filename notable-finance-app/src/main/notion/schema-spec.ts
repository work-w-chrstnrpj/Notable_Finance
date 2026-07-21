// Expected Notion schema per resource (Phase 2.2) — the canonical field taxonomy from
// wiki/shared/notion-field-mapping.md expressed as property name → expected Notion type.
// `writable` drift is an ERROR (blocks push); `computed` drift is a WARNING (informational:
// those fields are never written, and the desktop derives its own copies locally).
import { NOTION_PROPERTY_NAMES } from './property-mapper'
import type { MappableResource } from '../../shared/finance.types'

export interface ExpectedProperty {
  property: string
  type: string
  kind: 'writable' | 'computed'
}

const A = NOTION_PROPERTY_NAMES.accounts
const IC = NOTION_PROPERTY_NAMES.incomeCategories
const I = NOTION_PROPERTY_NAMES.incomes
const EC = NOTION_PROPERTY_NAMES.expenseCategories
const E = NOTION_PROPERTY_NAMES.expenses

export const EXPECTED_SCHEMA: Record<MappableResource, ExpectedProperty[]> = {
  accounts: [
    { property: A.name, type: 'title', kind: 'writable' },
    { property: A.type, type: 'select', kind: 'writable' },
    { property: A.startingBalance, type: 'number', kind: 'writable' },
    { property: A.creditLimit, type: 'number', kind: 'writable' },
    { property: A.annualFee, type: 'number', kind: 'writable' },
    { property: A.billingDay, type: 'number', kind: 'writable' },
    { property: A.dueDay, type: 'number', kind: 'writable' },
    { property: A.creditPoints, type: 'number', kind: 'writable' },
    { property: A.inactive, type: 'checkbox', kind: 'writable' },
    { property: A.currentBalance, type: 'formula', kind: 'computed' },
    { property: A.availableLimit, type: 'formula', kind: 'computed' },
    { property: A.totalIncomes, type: 'rollup', kind: 'computed' },
    { property: A.totalExpenses, type: 'rollup', kind: 'computed' }
  ],
  incomeCategories: [
    { property: IC.source, type: 'title', kind: 'writable' },
    { property: IC.auxiliary, type: 'checkbox', kind: 'writable' },
    { property: IC.monthlyEarnings, type: 'rollup', kind: 'computed' },
    { property: IC.monthlyGross, type: 'rollup', kind: 'computed' },
    { property: IC.earningPercentage, type: 'formula', kind: 'computed' }
  ],
  incomes: [
    { property: I.name, type: 'title', kind: 'writable' },
    { property: I.date, type: 'date', kind: 'writable' },
    { property: I.grossIncome, type: 'number', kind: 'writable' },
    { property: I.capitalExpenditure, type: 'number', kind: 'writable' },
    { property: I.accountId, type: 'relation', kind: 'writable' },
    { property: I.categoryId, type: 'relation', kind: 'writable' },
    { property: I.transactedAccountId, type: 'relation', kind: 'writable' },
    { property: I.ccPaymentCoveredId, type: 'relation', kind: 'writable' }
  ],
  expenseCategories: [
    { property: EC.name, type: 'title', kind: 'writable' },
    { property: EC.monthlyBudget, type: 'number', kind: 'writable' },
    { property: EC.upcomingBudget, type: 'number', kind: 'writable' },
    { property: EC.auxiliary, type: 'select', kind: 'writable' },
    { property: EC.spending, type: 'formula', kind: 'computed' },
    { property: EC.remaining, type: 'formula', kind: 'computed' },
    { property: EC.totalOverview, type: 'formula', kind: 'computed' }
  ],
  expenses: [
    { property: E.description, type: 'title', kind: 'writable' },
    { property: E.purchaseDate, type: 'date', kind: 'writable' },
    { property: E.datePaid, type: 'date', kind: 'writable' },
    { property: E.amount, type: 'number', kind: 'writable' },
    { property: E.interest, type: 'number', kind: 'writable' },
    { property: E.accountId, type: 'relation', kind: 'writable' },
    { property: E.categoryId, type: 'relation', kind: 'writable' },
    { property: E.paymentStatus, type: 'select', kind: 'writable' },
    { property: E.paymentFrequency, type: 'select', kind: 'writable' },
    { property: E.periodCount, type: 'number', kind: 'writable' },
    { property: E.paidPeriod, type: 'number', kind: 'writable' },
    { property: E.pasabuyer, type: 'select', kind: 'writable' },
    { property: E.pasabuyStatus, type: 'select', kind: 'writable' },
    { property: E.pasabuyDateOfPayment, type: 'date', kind: 'writable' },
    { property: E.pasabuyPaidPeriod, type: 'number', kind: 'writable' },
    { property: E.pasabuyAccountReceiverId, type: 'relation', kind: 'writable' },
    { property: E.pasabuyBalance, type: 'formula', kind: 'computed' }
  ]
}

/**
 * Pure comparator: expected spec vs a database's actual property map
 * (name → { type }). Returns error/warning lists per the writable/computed rule.
 */
export function compareSchema(
  expected: ExpectedProperty[],
  actualProperties: Record<string, { type: string }>
): {
  errors: Array<{ property: string; expectedType: string; actualType: string | null }>
  warnings: Array<{ property: string; expectedType: string; actualType: string | null }>
} {
  const errors: Array<{ property: string; expectedType: string; actualType: string | null }> = []
  const warnings: Array<{ property: string; expectedType: string; actualType: string | null }> = []
  for (const spec of expected) {
    const actual = actualProperties[spec.property]
    const issue = !actual
      ? { property: spec.property, expectedType: spec.type, actualType: null }
      : actual.type !== spec.type
        ? { property: spec.property, expectedType: spec.type, actualType: actual.type }
        : null
    if (!issue) continue
    if (spec.kind === 'writable') errors.push(issue)
    else warnings.push(issue)
  }
  return { errors, warnings }
}
