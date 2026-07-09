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
  | "sync"
  | "settings";

export type AccountType =
  | "Cash"
  | "Credit Account"
  | "Debit"
  | "Savings Account"
  | "e-Wallet"
  | "Digital Bank"
  | "BYPL"
  | "Auxiliary";

export type IncomeViewMode = "Daily" | "Weekly" | "Monthly" | "Annually";

export type ExpenseViewMode =
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Unpaid Pasabuy"
  | "To pay"
  | "To buy"
  | "Installments"
  | "CC Transactions";

export type PaymentStatus = "Paid" | "Unpaid" | "Installment" | "Cancelled";

export type PaymentFrequency = "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Annually";

export type PasabuyStatus =
  | "Payment not yet receive"
  | "Payment partially received"
  | "Payment partially received (installment)"
  | "Payment fully received";

export type SyncState = "idle" | "syncing" | "fresh" | "error";

export type SchemaHealth = "verified" | "warning" | "notChecked";

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
  inactive: boolean;
};

export type IncomeCategory = {
  id: string;
  source: string;
  auxiliary: boolean;
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
  ccPaymentCoveredId?: string | null;
  deleted?: boolean;
};

export type ExpenseCategory = {
  id: string;
  name: string;
  monthlyBudget: number;
  upcomingBudget: number;
  auxiliary: "Yes" | "No";
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
};

export type SyncLogEntry = {
  id: string;
  type: "pull" | "create" | "update" | "delete" | "conflict" | "error";
  resource: string;
  description: string;
  timestamp: string;
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
