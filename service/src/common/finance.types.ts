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
  | 'monthlyMonitoring';

export type MutationAction = 'create' | 'update' | 'delete';

export type AccountType =
  | 'Cash'
  | 'Savings'
  | 'e-Wallet'
  | 'Digital Bank'
  | 'Credit Account'
  | 'e-Credit'
  | 'BNPL'
  | 'Auxiliary';

export type PaymentStatus = 'Paid' | 'Unpaid' | 'Installment' | 'Cancelled';
export type PaymentFrequency =
  | 'Daily'
  | 'Weekly'
  | 'Monthly'
  | 'Quarterly'
  | 'Annually';
export type PasabuyStatus =
  | 'Payment not yet receive'
  | 'Payment partially received'
  | 'Payment partially received (installment)'
  | 'Payment fully received';

export interface AccountDto {
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
}

export interface IncomeCategoryDto {
  id: string;
  source: string;
  auxiliary: boolean;
  monthlyEarnings: number;
  monthlyExpenditure: number;
  monthlyGross: number;
  earningPercentage: number;
}

export interface IncomeRecordDto {
  id: string;
  name: string;
  date: string;
  grossIncome: number;
  capitalExpenditure: number;
  accountId: string | null;
  categoryId: string;
  transactedAccountId?: string | null;
  ccPaymentCoveredId?: string | null;
  deleted?: boolean;
}

export interface ExpenseCategoryDto {
  id: string;
  name: string;
  monthlyBudget: number;
  upcomingBudget: number;
  auxiliary: 'Yes' | 'No';
  spending: number;
  remaining: number;
  overview: string;
  totalOverview: number;
}

export interface ExpenseRecordDto {
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
  ccLinkPaymentReceiptId?: string | null;
  pasabuyer: string | null;
  pasabuyStatus: PasabuyStatus | null;
  pasabuyDateOfPayment: string | null;
  pasabuyPaidPeriod: number | null;
  pasabuyAccountReceiverId: string | null;
  /** Notion "Pasabuyer Balance" formula — how much is still owed by the pasabuyer. */
  pasabuyBalance: number;
  deleted?: boolean;
}

export interface ListQuery {
  viewMode?: string;
  expenseViewMode?: string;
  month?: string;
  /** ISO date (YYYY-MM-DD) anchoring day/week ranges. */
  date?: string;
  /** Four-digit year anchoring the annual range. */
  year?: string;
  /** Explicit inclusive range bounds (YYYY-MM-DD), used by day/week/year views. */
  rangeStart?: string;
  rangeEnd?: string;
  accountId?: string;
  categoryId?: string;
  pasabuyer?: string;
  paymentStatus?: string;
  includeAuxiliary?: string;
  normalOnly?: string;
  cursor?: string;
  limit?: number | string;
}

export interface PullScope {
  resource?: ResourceName;
  viewMode?: string;
  month?: string;
}

export interface SyncOperation {
  clientOperationId: string;
  resource: ResourceName;
  action: MutationAction;
  id?: string;
  data?: Record<string, unknown>;
}

export interface SyncCommitRequest {
  operations: SyncOperation[];
  returnFreshSnapshot?: boolean;
  snapshotMonth?: string;
}
