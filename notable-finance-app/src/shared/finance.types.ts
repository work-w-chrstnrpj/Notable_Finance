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
  /** True when backed by a Notion page. Local seed/test accounts (no Notion
   *  page) are false and are excluded from user pickers. */
  notionSynced: boolean
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
  ccPaymentCoveredIds?: string[]
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

/**
 * Needs/Wants/Savings allocation split, sourced from the "Total Monthly
 * Monitoring" row in the Notion monitoring database (percentages as fractions,
 * e.g. 0.5 = 50%). Falls back to the classic 50/30/20 when unavailable.
 */
export interface MonitoringSplitDto {
  needsPct: number
  wantsPct: number
  savingsPct: number
  source: 'notion' | 'default'
  rowFound: boolean
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
  /** May be omitted for workflow views (transfers/creditCardPayments/alkansya);
   *  the server resolves the locked category from `view`. */
  categoryId?: string
  notes?: string | null
  isTransaction?: boolean
  transactedAccountId?: string | null
  ccPaymentCoveredIds?: string[]
  /** Workflow origin so the server can lock the fixed income category. */
  view?: IncomeView
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
  /** Notion page icon: emoji char or image URL/data URI. */
  icon?: string | null
}

export interface ExpenseCategoryOption {
  id: string
  name: string
  monthlyBudget: number
  auxiliary: boolean
  /** Notion page icon: emoji char or image URL/data URI. */
  icon?: string | null
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

/** Time-range presets for the pull-only sync action. */
export type PullRange = '1h' | '24h' | '2d' | '1w' | '1m' | '1y' | 'all'

/** App UI preferences persisted in `app_settings` (not Notion). */
export interface UiThemeSettings {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
  secondaryColor: string
}

export interface UiFontSettings {
  /** Body/UI font family name. */
  bodyFont: string
  /** Monospace/numbers font family name. */
  monoFont: string
  /** Brand/display font family name (receipts, insight shots, headings). */
  brandFont: string
  /** Receipt-specific font family name. Falls back to brandFont if not set. */
  receiptFont: string
}

export interface UiProfileSettings {
  displayName: string
  /** JPEG/PNG/WebP data URL, or null for initials-only avatar. */
  avatarDataUrl: string | null
}

export interface UiWorkspaceSettings {
  /** ISO date anchor for period selectors; null means “today” on next launch. */
  selectedDate: string | null
  incomeViewMode: 'Daily' | 'Weekly' | 'Monthly' | 'Annually'
  expenseViewMode:
    | 'Daily'
    | 'Weekly'
    | 'Monthly'
    | 'Annually'
    | 'To pay'
    | 'To buy'
    | 'Installments'
    | 'Unpaid CC'
    | 'Unpaid Pasabuy'
  sidebarCollapsed: boolean
  showFab: boolean
  /** Auto-hide delay (ms) for the floating Push Sync button after a change.
   *  Default 180000 (3 minutes). */
  pushFabAutoHideMs: number
  /** Last active section hash (without leading #/). */
  lastSection: string
}

export interface UiIncomeFilters {
  accountId: string
  categoryId: string
  filterActive: boolean
  annualView: 'table' | 'chart'
  groupBy: 'month' | 'account' | 'category'
}

export interface UiExpenseFilters {
  accountFilterId: string
  expenseCategoryFilter: string
  pasabuyerFilter: string
  filterActive: boolean
  annualView: 'table' | 'chart'
  groupBy: 'month' | 'account' | 'category'
}

export interface UiAccountsFilters {
  viewMode: 'cards' | 'table'
  accountScope: 'standard' | 'credit' | 'all'
  hideZeroBalance: boolean
  cardTypeFilter: string
}

export interface UiMonitoringFilters {
  incomeCategoryView: string
  expenseCategoryView: string
  hideZeroIncomeCategories: boolean
  zeroFilter: 'all' | 'hide-both' | 'hide-spending' | 'hide-budget'
}

export interface UiSettings {
  /** When true, delete actions permanently remove local rows and archive Notion pages to trash. */
  hardDeleteEnabled: boolean
  /** When true, Chat appears in Main UI and Chat mode can open. Default false. */
  chatEnabled: boolean
  /** macOS: prefer Apple Intelligence for read-only Q&A when adapter exists (6.5). */
  chatPreferAppleReadOnly: boolean
  /** Default model id for new chat threads. */
  chatDefaultModel: string
  /**
   * When true, Dev Logs section appears and runtime debug logging is active.
   * Logs are in-memory only and cleared when the app process exits.
   */
  devModeEnabled: boolean
  profile: UiProfileSettings
  theme: UiThemeSettings
  fonts: UiFontSettings
  workspace: UiWorkspaceSettings
  incomeFilters: UiIncomeFilters
  expenseFilters: UiExpenseFilters
  accountsFilters: UiAccountsFilters
  monitoringFilters: UiMonitoringFilters
}

/** Dev Mode log kinds (in-memory ring buffer; never persisted). */
export type DevLogKind = 'api' | 'operation' | 'system'

export interface DevLogEntry {
  id: string
  at: number
  kind: DevLogKind
  source: 'main' | 'renderer'
  /** Short stable label, e.g. incomes:create or click:button */
  action: string
  message: string
  /** Redacted JSON-safe detail (args summary, duration, ok/error). */
  detail?: Record<string, unknown> | null
  durationMs?: number | null
  ok?: boolean | null
}

/** Saved API credential metadata (raw key never sent to renderer). */
export interface ChatCredentialDto {
  id: string
  name: string
  keyFingerprint: string
  isDefault: boolean
  createdAt: number
  /**
   * OpenAI-compatible API base URL for this key.
   * null/empty → default OpenAI.
   */
  baseUrl: string | null
  /** Catalog id: gemini | groq | cerebras | openrouter | opencode | mistral | claude | openai | custom */
  providerId: string | null
}

export interface ChatProviderCatalogDto {
  id: string
  label: string
  keyPlaceholder: string
  hint: string
  docsUrl?: string
  defaultModelId: string
  /** null → OpenAI default; custom uses empty until user fills URL. */
  needsCustomBaseUrl: boolean
  models: Array<{ id: string; label: string; free?: boolean }>
}

export interface ChatThreadDto {
  id: string
  title: string
  credentialId: string | null
  modelId: string | null
  overlay: string
  createdAt: number
  updatedAt: number
}

export type ChatMessageRole = 'user' | 'assistant' | 'system'

export interface ChatMessageDto {
  id: string
  threadId: string
  role: ChatMessageRole
  content: string
  payloadJson: string | null
  createdAt: number
}

/** Draft mutation awaiting Approve / Cancel (Phase 6.3). Never includes delete. */
export type ChatDraftResource = 'incomes' | 'expenses'
export type ChatDraftAction = 'create' | 'update'
export type ChatDraftStatus = 'needs_input' | 'ready' | 'applied' | 'cancelled'

/** Resolved, human-readable values for the confirm card (names, not ids). */
export interface ChatDraftDisplay {
  title: string
  amount?: number | null
  currency?: string
  date?: string | null
  /** Source side — account for expenses, source account for transfers. */
  from?: string | null
  fromLabel?: string
  /** Destination side — category for expenses, destination account for transfers. */
  to?: string | null
  toLabel?: string
  /** Extra line (interest / installment / pasabuyer). */
  note?: string | null
}

export interface ChatDraftDto {
  id: string
  threadId: string
  resource: ChatDraftResource
  action: ChatDraftAction
  /** Skill / propose tool that created the draft. */
  kind: string
  status: ChatDraftStatus
  summary: string
  missingRequired: string[]
  warnings: string[]
  /** Validated (or partial) payload for create/update. */
  payload: Record<string, unknown>
  /** For mass update — target ids (cap 50). */
  targetIds?: string[]
  computedPreview?: Record<string, unknown> | null
  /** Presentation-only mirror of payload for the confirm card. */
  display?: ChatDraftDisplay | null
  createdAt: number
}

export interface ChatSendResult {
  userMessage: ChatMessageDto
  assistantMessage: ChatMessageDto
  thread: ChatThreadDto
  /** Pending drafts created during this send (confirm cards). */
  drafts?: ChatDraftDto[]
}

export interface ChatConfirmResult {
  draft: ChatDraftDto
  record: unknown
  /** Persona quip after Approve (Phase 6.4 overlays). */
  quip?: string | null
  /** Persisted assistant acknowledgement, when the thread exists. */
  assistantMessage?: ChatMessageDto | null
}

/** Slash / persona overlay ids (Phase 6.4). */
export type ChatOverlayId = 'default' | 'roast' | 'cheer' | 'strict' | 'quiet'

export interface ChatStatusDto {
  chatEnabled: boolean
  preferAppleReadOnly: boolean
  defaultModel: string
  credentialCount: number
  hasDefaultCredential: boolean
  appleAvailable: boolean
  /** Real Foundation Models probe (or force/unavailable). */
  appleStatus: 'available' | 'unavailable' | 'unsupported'
  appleStatusLabel: string
  appleDetail: string
  /** apple-local-llm / Foundation Models reason when unavailable (e.g. AI_DISABLED). */
  appleReasonCode: string | null
  /** True when a BYOK credential exists (writes/Q&A via API). */
  canUseByok: boolean
  /** preferApple + appleAvailable — ask/summarize without BYOK. */
  canUseAppleReadOnly: boolean
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
  payload?: Record<string, unknown> | null
  action: MutationAction // create | update | delete
  direction: ActivityDirection
  at: number // ms timestamp
}

/**
 * A local change made in this app that has not yet been synced to Notion — i.e. a
 * record whose sync_state is 'dirty' or 'conflict', or a pending hard-delete in
 * `mutation_queue` (local row already removed; Notion trash still outstanding).
 * Soft-deleted and hard-deleted records surface with action 'delete'.
 */
export interface UnsyncedItem {
  resource: SyncedResource
  recordId: string
  title: string | null
  payload?: Record<string, unknown> | null
  /** delete when soft/hard-deleted; create when never pushed (no Notion page); else update. */
  action: MutationAction
  syncState: 'dirty' | 'conflict'
  deleted: boolean
  notionPageId: string | null
  localUpdatedAt: number
  /** True when the local row was hard-deleted and only a Notion-trash intent remains. */
  pendingHardDelete?: boolean
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

export type EventChannel =
  | 'records:changed'
  | 'derived:updated'
  | 'sync:status'
  /** Focused-window only: File menu / accelerators for in-window tabs. */
  | 'tabs:command'
  /** Dev Mode live log stream (payload: DevLogEntry). */
  | 'devLogs:entry'
  /** Edit-menu keys the OS menu owns, routed to the renderer (undo/redo/select all). */
  | 'shortcut:menu'
  /** Auto-updater download progress and completion. */
  | 'updater:progress'

export type TabsCommand = 'new' | 'close' | 'next' | 'prev'

export interface TabsCommandEvent {
  action: TabsCommand
}

export type UpdaterProgressStage = 'downloading' | 'downloaded' | 'error'

export interface UpdaterProgressEvent {
  stage: UpdaterProgressStage
  percent?: number
  bytesPerSecond?: number
  transferred?: number
  total?: number
  version?: string
  error?: string
}

// ── Auto-updater (Phase 5.1) ─────────────────────────────────────────
export interface UpdaterCheckResult {
  updateAvailable: boolean
  version?: string
  error?: string
}
