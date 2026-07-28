export type FinanceSectionId =
  | "dashboard"
  | "accounts"
  | "income"
  | "expense"
  | "monthly-monitoring"
  | "transfer"
  | "credit-card-payment"
  | "alkansya"
  | "receivables"
  | "history"
  | "sync"
  | "chat"
  | "dev-logs"
  | "settings";

export type AccountType =
  | "Cash"
  | "Savings"
  | "e-Wallet"
  | "Digital Bank"
  | "Credit Account"
  | "e-Credit"
  | "BNPL"
  | "Auxiliary";

export type IncomeViewMode = "Daily" | "Weekly" | "Monthly" | "Annually";

export type MonitoringViewMode = "Monthly" | "Quarterly" | "Semi-Annually" | "Annually";

export type ExpenseViewMode =
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Annually"
  | "Unpaid Pasabuy"
  | "To pay"
  | "To buy"
  | "Installments"
  | "Unpaid CC";

export type PaymentStatus = "Paid" | "Unpaid" | "Installment" | "Cancelled";

export type PaymentFrequency = "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Annually";

export type PasabuyStatus =
  | "Payment not yet receive"
  | "Payment partially received"
  | "Payment partially received (installment)"
  | "Payment fully received";

export type SyncState = "idle" | "syncing" | "fresh" | "error";

export type SchemaHealth = "verified" | "warning" | "notChecked";

/** Time-range presets for the pull-only sync action. */
export type PullRange = "1h" | "24h" | "2d" | "1w" | "1m" | "1y" | "all";

export type FinanceSection = {
  id: FinanceSectionId;
  label: string;
  shortLabel?: string;
  group: "primary" | "workflow" | "system";
};

export type Account = {
  id: string;
  name: string;
  type: AccountType;
  icon: string | null;
  information: string;
  startingBalance: number;
  currentBalance: number;
  creditLimit: number | null;
  availableLimit: number | null;
  creditPoints: number | null;
  annualFee: number | null;
  billingDay: number | null;
  dueDay: number | null;
  totalIncomes: number | null;
  totalExpenses: number | null;
  totalPasabuy: number | null;
  totalCcDebtTransfer: number | null;
  qrCode: string | null;
  inactive: boolean;
  notionSynced: boolean;
};

export type IncomeCategory = {
  id: string;
  source: string;
  auxiliary: boolean;
  icon?: string | null;
  monthlyEarnings: number;
  monthlyExpenditure: number;
  monthlyGross: number;
  earningPercentage: number;
};

export type IncomeRecord = {
  id: string;
  name: string;
  date: string;
  grossIncome: number;
  capitalExpenditure: number;
  accountId: string | null;
  categoryId: string;
  /** Transaction-only fields returned from backend, not editable in normal income forms */
  transactedAccountId?: string | null;
  ccPaymentCoveredIds?: string[];
  deleted?: boolean;
};

export type ExpenseCategory = {
  id: string;
  name: string;
  monthlyBudget: number;
  upcomingBudget: number;
  auxiliary: "Yes" | "No";
  icon?: string | null;
  spending: number;
  remaining: number;
  overview: string;
  totalOverview: number;
};

export type ExpenseRecord = {
  id: string;
  description: string;
  purchaseDate: string;
  datePaid: string | null;
  amount: number;
  interest: number;
  accountId: string;
  categoryId: string;
  paymentStatus: PaymentStatus;
  paymentFrequency: PaymentFrequency | null;
  periodCount: number | null;
  paidPeriod: number | null;
  pasabuyer: string | null;
  pasabuyStatus: PasabuyStatus | null;
  pasabuyDateOfPayment: string | null;
  pasabuyPaidPeriod: number | null;
  pasabuyAccountReceiverId: string | null;
  pasabuyBalance: number;
  ccLinkPaymentReceiptId: string | null;
};

// ── History section ───────────────────────────────────────────────────
export type SyncedResource = "incomes" | "expenses";
export type MutationAction = "create" | "update" | "delete";
/** pull = Notion DB → App; push = App → Notion DB. */
export type ActivityDirection = "pull" | "push";

export type ActivityEntry = {
  id: string;
  resource: SyncedResource;
  recordId: string;
  notionPageId: string | null;
  title: string | null;
  action: MutationAction;
  direction: ActivityDirection;
  at: number;
  payload?: Record<string, unknown> | null;
};

export type UnsyncedItem = {
  resource: SyncedResource;
  recordId: string;
  title: string | null;
  action: MutationAction;
  syncState: "dirty" | "conflict";
  deleted: boolean;
  notionPageId: string | null;
  localUpdatedAt: number;
  pendingHardDelete?: boolean;
  payload?: Record<string, unknown> | null;
};

export type HistoryData = {
  unsynced: UnsyncedItem[];
  recent: ActivityEntry[];
  lastPullAt: number | null;
  lastPushAt: number | null;
};

export type WorkflowSectionId =
  | "transfer"
  | "credit-card-payment"
  | "alkansya"
  | "receivables";

// ── API types from the backend ────────────────────────────────────────

export type DashboardSummary = {
  month: string;
  totalCashFlow: number;
  netIncome: number;
  grossIncome: number;
  expenses: number;
  availableCredit: number;
  creditLimit: number;
  creditBalanceTotal: number;
  pasabuyBalance: number;
  pendingOperations: number;
  lastSync: string;
  trendMonths: string[];
  incomeTrend: number[];
  expenseTrend: number[];
  spendingBreakdown: Array<{
    name: string;
    value: number;
  }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    title: string;
    meta: string;
    value: number;
    type: "income" | "expense";
  }>;
};

export type ExpenseSchedulerRecord = {
  id: string;
  description: string;
  amount: number;
  nextDueDate: string;
  frequency: string;
  category: string;
  account: string;
  status: "active" | "completed" | "paused";
};

export type SyncStatus = {
  lastSyncAt: string | null;
  state: SyncState;
  pendingOperations: number;
  failedOperations: number;
};
