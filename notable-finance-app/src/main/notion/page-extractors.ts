// Notion page → local-row extractors (Phase 3 pull). The low-level extract helpers are
// COPIED from notable-finance-web/service/src/notion/notion-property-mapper.ts; the pageTo*
// functions produce the snake_case-ish field bags the pull upserts store. Relation fields
// are returned as NOTION page ids — the pull engine translates them to local ids.
import { NOTION_PROPERTY_NAMES } from './property-mapper'

type Props = Record<string, unknown>

function prop(props: Props, name: string): Record<string, unknown> | undefined {
  return props[name] as Record<string, unknown> | undefined
}

export function extractTitle(props: Props, name: string): string {
  const title = prop(props, name)?.title as Array<{ plain_text?: string }> | undefined
  return title?.[0]?.plain_text ?? ''
}

export function extractRichText(props: Props, name: string): string {
  const rt = prop(props, name)?.rich_text as Array<{ plain_text?: string }> | undefined
  return rt?.[0]?.plain_text ?? ''
}

export function extractNumber(props: Props, name: string): number | null {
  const p = prop(props, name)
  return (p?.number as number | null | undefined) ?? null
}

export function extractSelect(props: Props, name: string): string | null {
  const select = prop(props, name)?.select as { name?: string } | null | undefined
  return select?.name ?? null
}

export function extractCheckbox(props: Props, name: string): boolean {
  return (prop(props, name)?.checkbox as boolean | undefined) ?? false
}

export function extractDate(props: Props, name: string): string | null {
  const date = prop(props, name)?.date as { start?: string } | null | undefined
  return date?.start ?? null
}

export function extractRelationFirst(props: Props, name: string): string | null {
  const rel = prop(props, name)?.relation as Array<{ id?: string }> | undefined
  return rel?.[0]?.id ?? null
}

/** First file URL from a "files" property (Notion-hosted or external). */
export function extractFileUrl(props: Props, name: string): string | null {
  const files = prop(props, name)?.files as
    | Array<{ type?: string; file?: { url?: string }; external?: { url?: string } }>
    | undefined
  const first = files?.[0]
  if (!first) return null
  return first.file?.url ?? first.external?.url ?? null
}

/** Number that may be stored directly, or produced by a formula/rollup. */
export function extractNumberOrFormula(props: Props, name: string): number | null {
  const p = prop(props, name)
  if (!p) return null
  if (p.type === 'number') return (p.number as number | null) ?? null
  if (p.type === 'formula') {
    const f = p.formula as { type?: string; number?: number } | undefined
    if (f?.type === 'number') return f.number ?? null
  }
  if (p.type === 'rollup') {
    const r = p.rollup as { type?: string; number?: number } | undefined
    if (r?.type === 'number') return r.number ?? null
  }
  return null
}

// Income categories tied to a workflow are always auxiliary even if the Notion checkbox
// is unchecked (COPIED rule from the web mapper).
const WORKFLOW_INCOME_CATEGORIES = new Set(['savings', 'transfer', 'credit card payment'])

// ── row shapes returned to the pull engine ──────────────────────────────────

export interface AccountFields {
  account_name: string
  account_type: string
  starting_balance: number
  credit_limit: number | null
  inactive: number
  billing_day: number | null
  due_day: number | null
  annual_fee: number | null
  credit_points: number | null
  qr_code: string | null
}

export interface IncomeCategoryFields {
  source: string
  auxiliary: number
}

export interface ExpenseCategoryFields {
  name: string
  monthly_budget: number
  auxiliary: number
}

export interface IncomeFields {
  title: string
  date: string | null
  gross_income: number
  capital_expenditure: number
  account_id: string | null // NOTION id
  category_id: string | null // NOTION id
  transacted_account_id: string | null // NOTION id
  cc_payment_covered_id: string | null // NOTION id
  is_transaction: number
}

export interface ExpenseFields {
  title: string
  purchase_date: string | null
  date_paid: string | null
  amount: number
  interest: number
  account_id: string | null // NOTION id
  category_id: string | null // NOTION id
  payment_status: string | null
  payment_frequency: string | null
  period_count: number | null
  paid_period: number | null
  pasabuyer: string | null
  pasabuy_status: string | null
  pasabuy_date_of_payment: string | null
  pasabuy_paid_period: number | null
  pasabuy_account_receiver_id: string | null // NOTION id
  cc_link_payment_receipt_id: string | null // NOTION id
}

export function pageToAccountFields(page: Record<string, unknown>): AccountFields {
  const props = (page.properties as Props) ?? {}
  const n = NOTION_PROPERTY_NAMES.accounts
  return {
    account_name: extractTitle(props, n.name),
    account_type: extractSelect(props, n.type) ?? 'Cash',
    starting_balance: extractNumber(props, n.startingBalance) ?? 0,
    credit_limit: extractNumber(props, n.creditLimit),
    inactive: extractCheckbox(props, n.inactive) ? 1 : 0,
    billing_day: extractNumber(props, n.billingDay),
    due_day: extractNumber(props, n.dueDay),
    annual_fee: extractNumber(props, n.annualFee),
    credit_points: extractNumber(props, n.creditPoints),
    qr_code: extractFileUrl(props, n.qrCode)
  }
}

export function pageToIncomeCategoryFields(page: Record<string, unknown>): IncomeCategoryFields {
  const props = (page.properties as Props) ?? {}
  const n = NOTION_PROPERTY_NAMES.incomeCategories
  const source = extractTitle(props, n.source)
  const auxiliary =
    extractCheckbox(props, n.auxiliary) ||
    WORKFLOW_INCOME_CATEGORIES.has(source.trim().toLowerCase())
  return { source, auxiliary: auxiliary ? 1 : 0 }
}

export function pageToExpenseCategoryFields(page: Record<string, unknown>): ExpenseCategoryFields {
  const props = (page.properties as Props) ?? {}
  const n = NOTION_PROPERTY_NAMES.expenseCategories
  return {
    name: extractTitle(props, n.name),
    monthly_budget: extractNumber(props, n.monthlyBudget) ?? 0,
    auxiliary: extractSelect(props, n.auxiliary) === 'Yes' ? 1 : 0
  }
}

export function pageToIncomeFields(page: Record<string, unknown>): IncomeFields {
  const props = (page.properties as Props) ?? {}
  const n = NOTION_PROPERTY_NAMES.incomes
  const transacted = extractRelationFirst(props, n.transactedAccountId)
  const ccCovered = extractRelationFirst(props, n.ccPaymentCoveredId)
  return {
    title: extractTitle(props, n.name),
    date: extractDate(props, n.date),
    gross_income: extractNumber(props, n.grossIncome) ?? 0,
    capital_expenditure: extractNumber(props, n.capitalExpenditure) ?? 0,
    account_id: extractRelationFirst(props, n.accountId),
    category_id: extractRelationFirst(props, n.categoryId),
    transacted_account_id: transacted,
    cc_payment_covered_id: ccCovered,
    is_transaction: transacted || ccCovered ? 1 : 0
  }
}

export function pageToExpenseFields(page: Record<string, unknown>): ExpenseFields {
  const props = (page.properties as Props) ?? {}
  const n = NOTION_PROPERTY_NAMES.expenses
  return {
    title: extractTitle(props, n.description),
    purchase_date: extractDate(props, n.purchaseDate),
    date_paid: extractDate(props, n.datePaid),
    amount: extractNumber(props, n.amount) ?? 0,
    interest: extractNumber(props, n.interest) ?? 0,
    account_id: extractRelationFirst(props, n.accountId),
    category_id: extractRelationFirst(props, n.categoryId),
    payment_status: extractSelect(props, n.paymentStatus),
    payment_frequency: extractSelect(props, n.paymentFrequency),
    period_count: extractNumber(props, n.periodCount),
    paid_period: extractNumber(props, n.paidPeriod),
    pasabuyer: extractSelect(props, n.pasabuyer),
    pasabuy_status: extractSelect(props, n.pasabuyStatus),
    pasabuy_date_of_payment: extractDate(props, n.pasabuyDateOfPayment),
    pasabuy_paid_period: extractNumber(props, n.pasabuyPaidPeriod),
    pasabuy_account_receiver_id: extractRelationFirst(props, n.pasabuyAccountReceiverId),
    cc_link_payment_receipt_id: extractRelationFirst(props, n.ccLinkPaymentReceiptId)
  }
}

export function pageLastEditedTime(page: Record<string, unknown>): string | null {
  return (page.last_edited_time as string | undefined) ?? null
}

/** The soft-delete convention is a title rewrite; detect it on pull. */
export function isDeletedTitle(title: string): boolean {
  return title.startsWith('[Deleted:')
}
