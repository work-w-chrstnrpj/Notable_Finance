// Pure row→DTO mappers (snake_case SQLite rows → camelCase DTOs). Kept free of DB
// handles so they are unit-testable (test/mappers.test.ts).
import type {
  AccountDto,
  AccountType,
  ExpenseCategoryOption,
  ExpenseRecordDto,
  IncomeCategoryOption,
  IncomeRecordDto,
  PasabuyStatus,
  PaymentFrequency,
  PaymentStatus,
  SchedulerRecordDto
} from '../../shared/finance.types'

// Row shapes as returned by better-sqlite3 (snake_case column names).

/** Parse cc_payment_covered_id which may be a plain ID (legacy) or JSON array. */
function parseCcPaymentCoveredIds(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : [value]
  } catch {
    // Legacy format: plain ID string
    return value ? [value] : []
  }
}

export interface AccountRow {
  id: string
  account_name: string
  account_type: string
  starting_balance: number
  credit_limit: number | null
  inactive: number
  billing_day: number | null
  due_day: number | null
  annual_fee: number | null
  credit_points: number | null
  qr_code?: string | null
  icon?: string | null
  notion_page_id?: string | null
}

export interface IncomeRow {
  id: string
  title: string
  date: string | null
  gross_income: number
  capital_expenditure: number
  account_id: string | null
  category_id: string | null
  notes: string | null
  is_transaction: number
  transacted_account_id: string | null
  cc_payment_covered_id: string | null
  deleted: number
  sync_state?: string
}

export interface ExpenseRow {
  id: string
  title: string
  purchase_date: string | null
  date_paid: string | null
  amount: number
  interest: number
  account_id: string | null
  category_id: string | null
  payment_status: string | null
  payment_frequency: string | null
  period_count: number | null
  paid_period: number | null
  is_pasabuy: number
  pasabuyer: string | null
  pasabuy_status: string | null
  pasabuy_date_of_payment: string | null
  pasabuy_paid_period: number | null
  pasabuy_account_receiver_id: string | null
  cc_link_payment_receipt_id: string | null
  deleted: number
  sync_state?: string
}

export interface SchedulerRow {
  id: string
  title: string
  amount: number
  account_id: string | null
  category_id: string | null
  frequency: string | null
  next_run_date: string | null
  active: number
  deleted: number
}

export interface IncomeCategoryRow {
  id: string
  source: string
  auxiliary: number
  icon?: string | null
}

export interface ExpenseCategoryRow {
  id: string
  name: string
  monthly_budget: number
  auxiliary: number
  icon?: string | null
}

/**
 * Account row → DTO. Balance fields are the caller's job (computed via
 * domain/derivations.ts); this mapper fills the stored inputs and identity fields.
 * icon/information/qrCode are Notion-populated (Phase 3 pull); null/empty until then.
 */
export function mapAccount(
  row: AccountRow,
  balance: {
    currentBalance: number
    availableLimit: number | null
    totalIncomes: number | null
    totalExpenses: number | null
    totalPasabuy: number | null
    totalCcDebtTransfer: number | null
  }
): AccountDto {
  return {
    id: row.id,
    name: row.account_name,
    type: row.account_type as AccountType,
    icon: row.icon ?? null,
    information: '',
    startingBalance: row.starting_balance,
    currentBalance: balance.currentBalance,
    creditLimit: row.credit_limit,
    availableLimit: balance.availableLimit,
    creditPoints: row.credit_points,
    annualFee: row.annual_fee,
    billingDay: row.billing_day,
    dueDay: row.due_day,
    // Total Cash Inflow / Outflow (labelled "Payment Made" / "Purchase Made" for credit).
    totalIncomes: balance.totalIncomes,
    totalExpenses: balance.totalExpenses,
    totalPasabuy: balance.totalPasabuy,
    totalCcDebtTransfer: balance.totalCcDebtTransfer,
    qrCode: row.qr_code ?? null,
    inactive: row.inactive === 1,
    // Notion is the source of truth for accounts; a row without a Notion page is
    // local seed/test data and must be hidden from user pickers.
    notionSynced: typeof row.notion_page_id === 'string' && row.notion_page_id.trim().length > 0
  }
}

export function mapIncome(row: IncomeRow): IncomeRecordDto {
  return {
    id: row.id,
    name: row.title,
    date: row.date ?? '',
    grossIncome: row.gross_income,
    capitalExpenditure: row.capital_expenditure,
    accountId: row.account_id,
    categoryId: row.category_id ?? '',
    transactedAccountId: row.transacted_account_id,
    ccPaymentCoveredIds: parseCcPaymentCoveredIds(row.cc_payment_covered_id),
    deleted: row.deleted === 1,
    syncState: row.sync_state as IncomeRecordDto['syncState']
  }
}

export function mapExpense(row: ExpenseRow): ExpenseRecordDto {
  return {
    id: row.id,
    description: row.title,
    purchaseDate: row.purchase_date ?? '',
    datePaid: row.date_paid,
    amount: row.amount,
    interest: row.interest,
    accountId: row.account_id ?? '',
    categoryId: row.category_id ?? '',
    paymentStatus: (row.payment_status ?? 'Unpaid') as PaymentStatus,
    paymentFrequency: (row.payment_frequency as PaymentFrequency | null) ?? null,
    periodCount: row.period_count,
    paidPeriod: row.paid_period,
    ccLinkPaymentReceiptId: row.cc_link_payment_receipt_id,
    pasabuyer: row.pasabuyer,
    pasabuyStatus: (row.pasabuy_status as PasabuyStatus | null) ?? null,
    pasabuyDateOfPayment: row.pasabuy_date_of_payment,
    pasabuyPaidPeriod: row.pasabuy_paid_period,
    pasabuyAccountReceiverId: row.pasabuy_account_receiver_id,
    // Local mirror of Notion's "Pasabuyer Balance" formula is a Phase 2+ concern; 0 until then.
    pasabuyBalance: 0,
    deleted: row.deleted === 1,
    syncState: row.sync_state as ExpenseRecordDto['syncState']
  }
}

export function mapScheduler(row: SchedulerRow): SchedulerRecordDto {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    accountId: row.account_id,
    categoryId: row.category_id,
    frequency: (row.frequency as PaymentFrequency | null) ?? null,
    nextRunDate: row.next_run_date,
    active: row.active === 1,
    deleted: row.deleted === 1
  }
}

export function mapIncomeCategory(row: IncomeCategoryRow): IncomeCategoryOption {
  return { id: row.id, source: row.source, auxiliary: row.auxiliary === 1, icon: row.icon ?? null }
}

export function mapExpenseCategory(row: ExpenseCategoryRow): ExpenseCategoryOption {
  return {
    id: row.id,
    name: row.name,
    monthlyBudget: row.monthly_budget,
    icon: row.icon ?? null,
    auxiliary: row.auxiliary === 1
  }
}
