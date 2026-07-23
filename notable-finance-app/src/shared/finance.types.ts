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
  /** Derived: Total Pasabuy (Pasabuy Received via Pasabuy Account Receiver). */
  totalPasabuy: number | null
  /** Derived: Total CC, Debt & Transfer (Transaction Amount via Transacted Account). */
  totalCcDebtTransfer: number | null
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
  /** Local sync state for record-level badges (desktop only; web omits it). */
  syncState?: 'clean' | 'dirty' | 'conflict'
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
  /** Local sync state for record-level badges (desktop only; web omits it). */
  syncState?: 'clean' | 'dirty' | 'conflict'
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

// ── Phase 1: local CRUD contract ────────────────────────────────────────────

/**
 * Income-backed views, mirroring the web app's query semantics
 * (notion-query.service.ts filterIncomeBacked):
 *  - incomes:            excludes auxiliary-category records
 *  - transfers:          fixed income category "Transfer"
 *  - creditCardPayments: fixed income category "Credit Card Payment"
 *  - alkansya:           fixed income category "Savings"
 *  - receivables:        records with no receiving account
 */
export type IncomeView =
  | 'incomes'
  | 'transfers'
  | 'creditCardPayments'
  | 'alkansya'
  | 'receivables'

/** The web fixed-category names per income view (source field of income_categories). */
export const INCOME_VIEW_FIXED_CATEGORY: Partial<Record<IncomeView, string>> = {
  transfers: 'Transfer',
  creditCardPayments: 'Credit Card Payment',
  alkansya: 'Savings'
}

export interface ListRecordsParams {
  /** YYYY-MM month scope; omitted = all time. */
  month?: string
  /** Explicit inclusive ISO-date range (Daily/Weekly/Annual views); wins over month. */
  rangeStart?: string
  rangeEnd?: string
  accountId?: string
  categoryId?: string
  includeDeleted?: boolean
}

export interface IncomeListParams extends ListRecordsParams {
  view?: IncomeView
}

/** Expense list filters — mirrors the web ExpensesListParams / ListQuery semantics. */
export interface ExpenseListParams extends ListRecordsParams {
  paymentStatus?: string
  /** Daily/Weekly/Monthly/Annually or a workflow view (Unpaid Pasabuy, To pay, …). */
  expenseViewMode?: string
  pasabuyer?: string
}

export interface CreateIncomeInput {
  name: string
  date: string
  grossIncome: number
  capitalExpenditure?: number
  accountId?: string | null
  categoryId: string
  notes?: string | null
  isTransaction?: boolean
  transactedAccountId?: string | null
  ccPaymentCoveredId?: string | null
}

export type UpdateIncomeInput = Partial<CreateIncomeInput>

export interface CreateExpenseInput {
  description: string
  purchaseDate: string
  datePaid?: string | null
  amount: number
  interest?: number
  accountId: string
  categoryId: string
  paymentStatus?: PaymentStatus
  paymentFrequency?: PaymentFrequency | null
  periodCount?: number | null
  paidPeriod?: number | null
  isPasabuy?: boolean
  pasabuyer?: string | null
  pasabuyStatus?: PasabuyStatus | null
  pasabuyDateOfPayment?: string | null
  pasabuyPaidPeriod?: number | null
  pasabuyAccountReceiverId?: string | null
  ccLinkPaymentReceiptId?: string | null
}

export type UpdateExpenseInput = Partial<CreateExpenseInput>

export interface SchedulerRecordDto {
  id: string
  title: string
  amount: number
  accountId: string | null
  categoryId: string | null
  frequency: PaymentFrequency | null
  nextRunDate: string | null
  active: boolean
  deleted?: boolean
}

export interface CreateSchedulerInput {
  title: string
  amount: number
  accountId?: string | null
  categoryId?: string | null
  frequency?: PaymentFrequency | null
  nextRunDate?: string | null
  active?: boolean
}

export type UpdateSchedulerInput = Partial<CreateSchedulerInput>

/** Lightweight category DTOs for selectors (reference cache; full stats come later). */
export interface IncomeCategoryOption {
  id: string
  source: string
  auxiliary: boolean
}

export interface ExpenseCategoryOption {
  id: string
  name: string
  monthlyBudget: number
  auxiliary: boolean
}

// ── Phase 2: Notion connect + sync contract ─────────────────────────────────

/** Resources that map to a Notion database during onboarding. */
export type MappableResource =
  | 'accounts'
  | 'incomeCategories'
  | 'expenseCategories'
  | 'incomes'
  | 'expenses'

export type NotionMapping = Partial<Record<MappableResource, string>>

export interface DiscoveredDb {
  id: string
  title: string
  /** Property names present on the database (for mapping hints). */
  propertyCount: number
}

export interface ConnectResult {
  connected: boolean
  workspaceUser: string | null
}

export interface SchemaFieldIssue {
  property: string
  expectedType: string
  actualType: string | null // null = missing
}

export interface SchemaResourceReport {
  resource: MappableResource
  databaseId: string | null // null = not mapped
  ok: boolean
  /** Missing/mismatched writable properties — block push. */
  errors: SchemaFieldIssue[]
  /** Missing/mismatched computed properties — informational. */
  warnings: SchemaFieldIssue[]
}

export interface SchemaReport {
  ok: boolean
  resources: SchemaResourceReport[]
}

export type SyncMode = 'manual' | 'auto'

export interface SyncSettings {
  mode: SyncMode
  intervalSeconds: number
}

export interface SyncStatus {
  connected: boolean
  mapped: boolean
  online: boolean
  running: boolean
  mode: SyncMode
  intervalSeconds: number
  dirtyCount: number
  conflictCount: number
  lastPushAt: number | null
  lastPullAt: number | null
  lastError: string | null
}

export interface ConflictField {
  field: string
  base: unknown
  local: unknown
  remote: unknown
}

export interface ConflictGroup {
  recordTable: 'incomes' | 'expenses'
  recordId: string
  title: string
  fields: ConflictField[]
  detectedAt: number
}

export type ConflictResolution =
  | { all: 'local' | 'remote' }
  | { perField: Record<string, 'local' | 'remote'> }

export interface PushResult {
  pushed: number
  created: number
  updated: number
  failed: number
  skipped: number
  errors: string[]
}

export interface PullResult {
  /** Reference rows (accounts/categories) inserted or updated. */
  referenceUpserted: number
  /** New income/expense records inserted from Notion. */
  inserted: number
  /** Existing clean records updated from Notion (remote applied). */
  updated: number
  /** Records auto-merged (both sides changed, disjoint fields). */
  autoMerged: number
  /** Records flagged as same-field conflicts needing resolution. */
  conflicts: number
  /** Records left dirty for the push phase (local-only changes). */
  pushPending: number
  errors: string[]
  /** The last_edited_time cursor after this pass (ISO). */
  cursor: string | null
}

export interface SyncNowResult {
  push: PushResult
  pull: PullResult
}

// ── History / activity feed ─────────────────────────────────────────────────

/** Which resources take part in Notion sync (and therefore appear in history). */
export type SyncedResource = 'incomes' | 'expenses'

/**
 * Direction of a completed sync event:
 *  - 'pull' → the data came FROM Notion into the app (Notion DB → App)
 *  - 'push' → the app's change was uploaded TO Notion (App → Notion DB)
 */
export type ActivityDirection = 'pull' | 'push'

/** One completed sync event, newest-first in the History feed. */
export interface ActivityEntry {
  id: string
  resource: SyncedResource
  recordId: string
  notionPageId: string | null
  title: string | null
  action: MutationAction // create | update | delete
  direction: ActivityDirection
  at: number // ms timestamp
}

/**
 * A local change made in this app that has not yet been synced to Notion — i.e. a
 * record whose sync_state is 'dirty' or 'conflict'. Soft-deleted records are included
 * (they surface with action 'delete').
 */
export interface UnsyncedItem {
  resource: SyncedResource
  recordId: string
  title: string | null
  /** delete when soft-deleted; create when never pushed (no Notion page); else update. */
  action: MutationAction
  syncState: 'dirty' | 'conflict'
  deleted: boolean
  notionPageId: string | null
  localUpdatedAt: number
}

export interface HistoryData {
  /** Local changes still waiting to reach Notion (includes soft deletes). */
  unsynced: UnsyncedItem[]
  /** Most recent completed sync events (newest first). */
  recent: ActivityEntry[]
  lastPullAt: number | null
  lastPushAt: number | null
}

// ── Events (main → renderer), per ipc-contract.md ───────────────────────────

export interface RecordsChangedEvent {
  resource: 'incomes' | 'expenses' | 'expenseScheduler' | 'accounts' | 'categories'
  ids: string[]
}

export type EventChannel = 'records:changed' | 'derived:updated' | 'sync:status'
