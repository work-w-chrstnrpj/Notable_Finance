// Notion property names + DTO→properties builders — COPIED from
// notable-finance-web/service/src/notion/notion-property-mapper.ts (builders section).
// Page→DTO extractors join in Phase 3 (pull). Only WRITABLE fields have builders:
// computed fields (formulas/rollups) are never written (wiki/shared/notion-field-mapping.md).

export const NOTION_PROPERTY_NAMES = {
  accounts: {
    name: 'Account Name',
    type: 'Account Type',
    information: 'Account Information',
    startingBalance: 'Starting Balance',
    currentBalance: 'Current Balance',
    creditLimit: 'Credit Limit',
    availableLimit: 'Available Limit',
    creditPoints: 'Credit Points',
    annualFee: 'Annual Fee',
    billingDay: 'Billing Day',
    dueDay: 'Due Day',
    inactive: 'Inactive',
    totalIncomes: 'Total Incomes',
    totalExpenses: 'Total Expenses',
    // Notion property is spelled "Qr Code" (case matters); the old 'QR Code' never matched.
    qrCode: 'Qr Code'
  },
  incomeCategories: {
    source: 'Source of Income',
    auxiliary: 'Auxiliary',
    monthlyEarnings: 'Monthly Earnings',
    monthlyExpenditure: 'Monthly Expenditure',
    monthlyGross: 'Monthly Gross Earnings',
    earningPercentage: 'Earning Percentage'
  },
  incomes: {
    name: 'Name',
    date: 'Date',
    grossIncome: 'Gross Income',
    capitalExpenditure: 'Capital Expenditure',
    accountId: 'Accounts',
    categoryId: 'Categories',
    transactedAccountId: 'Transacted Account',
    ccPaymentCoveredId: 'CC Payment Covered'
  },
  expenseCategories: {
    name: 'Categories',
    monthlyBudget: 'Monthly Budget',
    upcomingBudget: 'Upcoming Budget',
    auxiliary: 'Auxiliary',
    spending: 'Spending',
    remaining: 'Remaining',
    overview: 'Overview',
    totalOverview: 'Total Overview'
  },
  expenses: {
    description: 'Purchase description',
    purchaseDate: 'Purchase Date',
    datePaid: 'Date Paid',
    customEndRange: 'Custom end range',
    amount: 'Expense Amount',
    interest: 'Interest',
    accountId: 'Accounts',
    categoryId: 'Categories',
    paymentStatus: 'Payment Status',
    paymentFrequency: 'Payment Frequency',
    periodCount: 'Period count',
    paidPeriod: 'Paid period',
    ccLinkPaymentReceiptId: 'CC Link Payment Receipt',
    pasabuyer: 'Pasabuyer',
    pasabuyStatus: 'Pasabuy Status',
    pasabuyDateOfPayment: 'Pasabuy Date of Payment',
    pasabuyPaidPeriod: 'Pasabuy paid period',
    pasabuyAccountReceiverId: 'Pasabuy Account Receiver',
    pasabuyBalance: 'Pasabuyer Balance'
  }
} as const

// ── property value builders ─────────────────────────────────────────────────

function buildTitle(value: string) {
  return { title: [{ text: { content: value } }] }
}

function buildNumber(value: number | null) {
  return { number: value }
}

function buildSelect(value: string | null) {
  if (value === null || value === undefined) return { select: null }
  return { select: { name: value } }
}

function buildDate(value: string | null) {
  if (value === null || value === undefined) return { date: null }
  return { date: { start: value } }
}

function buildRelation(value: string | null) {
  if (!value) return { relation: [] }
  return { relation: [{ id: value }] }
}

/**
 * Build Notion properties for an Income record. Emits only fields present in `dto`
 * so PATCH payloads don't clobber untouched properties. Relation values must already
 * be NOTION page ids (translated by the push engine, not local UUIDs).
 */
export function incomeDtoToProperties(dto: Record<string, unknown>): Record<string, unknown> {
  const names = NOTION_PROPERTY_NAMES.incomes
  const properties: Record<string, unknown> = {}
  if (dto.name !== undefined) properties[names.name] = buildTitle(String(dto.name ?? ''))
  if (dto.date !== undefined)
    properties[names.date] = buildDate(dto.date === null ? null : String(dto.date))
  if (dto.grossIncome !== undefined)
    properties[names.grossIncome] = buildNumber(Number(dto.grossIncome ?? 0))
  if (dto.capitalExpenditure !== undefined)
    properties[names.capitalExpenditure] = buildNumber(Number(dto.capitalExpenditure ?? 0))
  if (dto.accountId !== undefined)
    properties[names.accountId] = buildRelation((dto.accountId as string | null) ?? null)
  if (dto.categoryId !== undefined)
    properties[names.categoryId] = buildRelation((dto.categoryId as string | null) ?? null)
  if (dto.transactedAccountId !== undefined)
    properties[names.transactedAccountId] = buildRelation(
      (dto.transactedAccountId as string) ?? null
    )
  if (dto.ccPaymentCoveredId !== undefined)
    properties[names.ccPaymentCoveredId] = buildRelation(
      (dto.ccPaymentCoveredId as string) ?? null
    )
  return properties
}

/** Build Notion properties for an Expense record. Same emit-only-present contract. */
export function expenseDtoToProperties(dto: Record<string, unknown>): Record<string, unknown> {
  const names = NOTION_PROPERTY_NAMES.expenses
  const properties: Record<string, unknown> = {}
  if (dto.description !== undefined)
    properties[names.description] = buildTitle(String(dto.description ?? ''))
  if (dto.purchaseDate !== undefined)
    properties[names.purchaseDate] = buildDate(
      dto.purchaseDate === null ? null : String(dto.purchaseDate)
    )
  if (dto.amount !== undefined) properties[names.amount] = buildNumber(Number(dto.amount ?? 0))
  if (dto.interest !== undefined)
    properties[names.interest] = buildNumber(Number(dto.interest ?? 0))
  if (dto.accountId !== undefined)
    properties[names.accountId] = buildRelation((dto.accountId as string | null) ?? null)
  if (dto.categoryId !== undefined)
    properties[names.categoryId] = buildRelation((dto.categoryId as string | null) ?? null)
  if (dto.paymentStatus !== undefined)
    properties[names.paymentStatus] = buildSelect((dto.paymentStatus as string) ?? null)
  if (dto.datePaid !== undefined)
    properties[names.datePaid] = buildDate(dto.datePaid === null ? null : String(dto.datePaid))
  if (dto.paymentFrequency !== undefined)
    properties[names.paymentFrequency] = buildSelect((dto.paymentFrequency as string) ?? null)
  if (dto.periodCount !== undefined)
    properties[names.periodCount] = buildNumber(
      dto.periodCount === null ? null : Number(dto.periodCount)
    )
  if (dto.paidPeriod !== undefined)
    properties[names.paidPeriod] = buildNumber(
      dto.paidPeriod === null ? null : Number(dto.paidPeriod)
    )
  if (dto.ccLinkPaymentReceiptId !== undefined)
    properties[names.ccLinkPaymentReceiptId] = buildRelation(
      (dto.ccLinkPaymentReceiptId as string) ?? null
    )
  if (dto.pasabuyer !== undefined)
    properties[names.pasabuyer] = buildSelect((dto.pasabuyer as string) ?? null)
  if (dto.pasabuyStatus !== undefined)
    properties[names.pasabuyStatus] = buildSelect((dto.pasabuyStatus as string) ?? null)
  if (dto.pasabuyDateOfPayment !== undefined)
    properties[names.pasabuyDateOfPayment] = buildDate(
      dto.pasabuyDateOfPayment === null ? null : String(dto.pasabuyDateOfPayment)
    )
  if (dto.pasabuyPaidPeriod !== undefined)
    properties[names.pasabuyPaidPeriod] = buildNumber(
      dto.pasabuyPaidPeriod === null ? null : Number(dto.pasabuyPaidPeriod)
    )
  if (dto.pasabuyAccountReceiverId !== undefined)
    properties[names.pasabuyAccountReceiverId] = buildRelation(
      (dto.pasabuyAccountReceiverId as string) ?? null
    )
  return properties
}
