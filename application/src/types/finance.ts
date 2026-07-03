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
  | "Annually"
  | "Pasabuy"
  | "To pay"
  | "To buy"
  | "Installments"
  | "CC Transactions";

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
  accountId: string;
  categoryId: string;
  netIncome: number;
  transactionAmount: number;
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
  paymentStatus: "Paid" | "Unpaid" | "Partial" | "Installment" | "Overdue";
  paymentFrequency: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Annually" | "One-time";
  periodCount: number | null;
  paidPeriod: number | null;
  pasabuyer: string | null;
  installmentAmount: number | null;
  paidAmount: number;
  remainingBalance: number;
};

export type MonthlyMonitoring = {
  id: string;
  month: string;
  monthlyIncome: number;
  monthlyExpense: number;
  grossMargin: number;
  forNeeds: number;
  forWants: number;
  forSavings: number;
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
