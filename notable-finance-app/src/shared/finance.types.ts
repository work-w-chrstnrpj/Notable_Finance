// Finance DTOs — COPIED from the web app to keep the two apps contract-compatible.
// Sources: notable-finance-web/service/src/common/finance.types.ts
//          notable-finance-web/application/src/types/finance.ts
// Per wiki/desktop/shared-core-and-monorepo.md the web app is left untouched; this is a
// controlled snapshot. Extracting a shared package is a future step.

export type ResourceName =
  | 'accounts'
  | 'incomeCategories'
  | 'incomes'
  | 'transactions'
  | 'transfers'
  | 'creditCardPayments'
  | 'alkansya'
  | 'receivables'
  | 'expenseCategories'
  | 'expenses'
  | 'expenseScheduler'
  | 'monthlyMonitoring'

export type MutationAction = 'create' | 'update' | 'delete'

export type AccountType =
  | 'Cash'
  | 'Savings'
  | 'e-Wallet'
  | 'Digital Bank'
  | 'Credit Account'
  | 'e-Credit'
  | 'BNPL'
  | 'Auxiliary'

export type PaymentStatus = 'Paid' | 'Unpaid' | 'Installment' | 'Cancelled'
export type PaymentFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually'
export type PasabuyStatus =
  | 'Payment not yet receive'
  | 'Payment partially received'
  | 'Payment partially received (installment)'
  | 'Payment fully received'

export interface AccountDto {
  id: string
  name: string
  type: AccountType
  icon: string | null
  information: string
  startingBalance: number
  /** Derived locally on the desktop (see domain/derivations.ts); a mirror of Notion's formula. */
  currentBalance: number
  creditLimit: number | null
  /** Derived locally for credit-like accounts. */
  availableLimit: number | null
  creditPoints: number | null
  annualFee: number | null
  billingDay: number | null
  dueDay: number | null
  totalIncomes: number | null
  totalExpenses: number | null
  qrCode: string | null
  inactive: boolean
}

export interface IncomeCategoryDto {
  id: string
  source: string
  auxiliary: boolean
  monthlyEarnings: number
  monthlyExpenditure: number
  monthlyGross: number
  earningPercentage: number
}

export interface IncomeRecordDto {
  id: string
  name: string
  date: string
  grossIncome: number
  capitalExpenditure: number
  accountId: string | null
  categoryId: string
  transactedAccountId?: string | null
  ccPaymentCoveredId?: string | null
  deleted?: boolean
}

export interface ExpenseCategoryDto {
  id: string
  name: string
  monthlyBudget: number
  upcomingBudget: number
  auxiliary: 'Yes' | 'No'
  spending: number
  remaining: number
  overview: string
  totalOverview: number
}

export interface ExpenseRecordDto {
  id: string
  description: string
  purchaseDate: string
  datePaid: string | null
  amount: number
  interest: number
  accountId: string
  categoryId: string
  paymentStatus: PaymentStatus
  paymentFrequency: PaymentFrequency | null
  periodCount: number | null
  paidPeriod: number | null
  ccLinkPaymentReceiptId?: string | null
  pasabuyer: string | null
  pasabuyStatus: PasabuyStatus | null
  pasabuyDateOfPayment: string | null
  pasabuyPaidPeriod: number | null
  pasabuyAccountReceiverId: string | null
  pasabuyBalance: number
  deleted?: boolean
}

/** Dashboard summary — computed locally in main (see ipc-contract.md `reports.dashboard`). */
export interface DashboardSummary {
  month: string
  totalIncome: number
  totalExpense: number
  grossMargin: number
  totalCashFlow: number
  activeAccountCount: number
  pendingExpenseCount: number
}

/** Monthly Monitoring DTO — mirrors the web NotionService.MonthlyMonitoringDto. */
export interface MonthlyMonitoringDto {
  id: string
  month: string
  monthlyIncome: number
  monthlyGrossIncome: number
  monthlyExpense: number
  grossMargin: number
  forNeeds: number
  forWants: number
  forSavings: number
  incomeCategories: Array<{ id: string; source: string; total: number }>
  expenseCategories: Array<{
    id: string
    name: string
    budget: number
    spending: number
    remaining: number
    totalOverview: number
  }>
}

/**
 * Discriminated IPC result envelope — mirrors the web `ApiResult` (see ipc-contract.md).
 * Every window.api.* call resolves to one of these.
 */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } }

/** Payload of the `db:health` IPC channel (Phase 0.4 skeleton). */
export interface HealthData {
  dbPath: string
  tables: string[]
}
