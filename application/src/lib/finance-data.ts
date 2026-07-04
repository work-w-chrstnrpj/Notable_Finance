import type {
  Account,
  ExpenseCategory,
  ExpenseRecord,
  FinanceSection,
  FinanceSectionId,
  IncomeCategory,
  IncomeRecord,
  SyncLogEntry,
} from "@/types/finance";

export const financeSections: FinanceSection[] = [
  { id: "dashboard", label: "Dashboard", group: "primary" },
  { id: "accounts", label: "Accounts", group: "primary" },
  { id: "income", label: "Income", group: "primary" },
  { id: "expense", label: "Expense", group: "primary" },
  { id: "monthly-monitoring", label: "Monthly Monitoring", shortLabel: "Monitoring", group: "primary" },
  { id: "transfer", label: "Transfer", group: "workflow" },
  { id: "credit-card-payment", label: "Credit Card Payment", shortLabel: "CC Payment", group: "workflow" },
  { id: "alkansya", label: "Alkansya", group: "workflow" },
  { id: "receivables", label: "Receivables", group: "workflow" },
  { id: "sync", label: "Sync Center", shortLabel: "Sync", group: "system" },
  { id: "settings", label: "Settings", group: "system" },
];

export function getSectionById(section: string) {
  return financeSections.find((item) => item.id === section);
}

export const months = [
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
];

export const accounts: Account[] = [
  {
    id: "acct-bdo-checking",
    name: "BDO Checking",
    type: "Cash",
    information: "Daily operating account",
    startingBalance: 25000,
    currentBalance: 45230.5,
    creditLimit: null,
    availableLimit: null,
    creditPoints: null,
    annualFee: null,
    billingDay: null,
    dueDay: null,
    inactive: false,
  },
  {
    id: "acct-bpi-savings",
    name: "BPI Savings",
    type: "Savings Account",
    information: "Emergency and savings",
    startingBalance: 80000,
    currentBalance: 123450,
    creditLimit: null,
    availableLimit: null,
    creditPoints: null,
    annualFee: null,
    billingDay: null,
    dueDay: null,
    inactive: false,
  },
  {
    id: "acct-metrobank-card",
    name: "Metrobank Credit Card",
    type: "Credit Account",
    information: "Primary card",
    startingBalance: 0,
    currentBalance: -45800,
    creditLimit: 150000,
    availableLimit: 104200,
    creditPoints: 1820,
    annualFee: 4500,
    billingDay: 15,
    dueDay: 10,
    inactive: false,
  },
  {
    id: "acct-gcash",
    name: "GCash Wallet",
    type: "e-Wallet",
    information: "Small payments",
    startingBalance: 5000,
    currentBalance: 8750.25,
    creditLimit: null,
    availableLimit: null,
    creditPoints: null,
    annualFee: null,
    billingDay: null,
    dueDay: null,
    inactive: false,
  },
  {
    id: "acct-bypl",
    name: "ShopNow BYPL",
    type: "BYPL",
    information: "Installment purchases",
    startingBalance: 0,
    currentBalance: -12800,
    creditLimit: 40000,
    availableLimit: 27200,
    creditPoints: null,
    annualFee: 0,
    billingDay: 3,
    dueDay: 18,
    inactive: false,
  },
  {
    id: "acct-old-wallet",
    name: "Old Wallet",
    type: "Auxiliary",
    information: "Legacy account",
    startingBalance: 0,
    currentBalance: 0,
    creditLimit: null,
    availableLimit: null,
    creditPoints: null,
    annualFee: null,
    billingDay: null,
    dueDay: null,
    inactive: true,
  },
];

export const incomeCategories: IncomeCategory[] = [
  { id: "inc-employment", source: "Employment", monthlyEarnings: 85000, monthlyExpenditure: 5000, monthlyGross: 80000, earningPercentage: 74.4 },
  { id: "inc-freelance", source: "Freelance", monthlyEarnings: 25000, monthlyExpenditure: 2500, monthlyGross: 22500, earningPercentage: 20.9 },
  { id: "inc-dividends", source: "Dividends", monthlyEarnings: 5000, monthlyExpenditure: 0, monthlyGross: 5000, earningPercentage: 4.7 },
  { id: "inc-savings", source: "Savings", monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0 },
  { id: "inc-transfer", source: "Transfer", monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0 },
  { id: "inc-cc-payment", source: "Credit Card Payment", monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0 },
  { id: "inc-iou", source: "IOU", monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0 },
];

export const incomeRecords: IncomeRecord[] = [
  {
    id: "income-july-salary",
    name: "July Salary",
    date: "2026-07-15",
    grossIncome: 85000,
    capitalExpenditure: 5000,
    accountId: "acct-bdo-checking",
    categoryId: "inc-employment",
  },
  {
    id: "income-project-retainer",
    name: "Project Retainer",
    date: "2026-07-05",
    grossIncome: 25000,
    capitalExpenditure: 2500,
    accountId: "acct-bpi-savings",
    categoryId: "inc-freelance",
  },
  {
    id: "income-dividend",
    name: "Dividend Payout",
    date: "2026-07-20",
    grossIncome: 5000,
    capitalExpenditure: 0,
    accountId: "acct-bpi-savings",
    categoryId: "inc-dividends",
  },
];

export const expenseCategories: ExpenseCategory[] = [
  {
    id: "exp-housing",
    name: "Housing",
    monthlyBudget: 15000,
    upcomingBudget: 15000,
    auxiliary: "No",
    spending: 12500,
    remaining: 2500,
    overview: "83% used",
    totalOverview: 2500,
  },
  {
    id: "exp-food",
    name: "Food & Dining",
    monthlyBudget: 9000,
    upcomingBudget: 9500,
    auxiliary: "No",
    spending: 5200,
    remaining: 3800,
    overview: "58% used",
    totalOverview: 3800,
  },
  {
    id: "exp-transport",
    name: "Transportation",
    monthlyBudget: 3500,
    upcomingBudget: 3500,
    auxiliary: "No",
    spending: 2200,
    remaining: 1300,
    overview: "63% used",
    totalOverview: 1300,
  },
  {
    id: "exp-gadgets",
    name: "Gadgets",
    monthlyBudget: 5000,
    upcomingBudget: 5000,
    auxiliary: "No",
    spending: 3866,
    remaining: 1134,
    overview: "77% used",
    totalOverview: 1134,
  },
  {
    id: "exp-pasabuy",
    name: "Pasabuy",
    monthlyBudget: 6000,
    upcomingBudget: 6000,
    auxiliary: "Yes",
    spending: 3500,
    remaining: 2500,
    overview: "58% used",
    totalOverview: 2500,
  },
  {
    id: "exp-utilities",
    name: "Utilities",
    monthlyBudget: 4500,
    upcomingBudget: 4500,
    auxiliary: "No",
    spending: 1800,
    remaining: 2700,
    overview: "40% used",
    totalOverview: 2700,
  },
];

export const expenseRecords: ExpenseRecord[] = [
  {
    id: "expense-rent",
    description: "Monthly Rent",
    purchaseDate: "2026-07-01",
    datePaid: "2026-07-01",
    amount: 12500,
    interest: 0,
    accountId: "acct-bdo-checking",
    categoryId: "exp-housing",
    paymentStatus: "Paid",
    paymentFrequency: "Monthly",
    periodCount: null,
    paidPeriod: null,
    pasabuyer: null,
    pasabuyStatus: null,
    pasabuyDateOfPayment: null,
    pasabuyPaidPeriod: null,
    pasabuyAccountReceiverId: null,
  },
  {
    id: "expense-groceries",
    description: "Groceries",
    purchaseDate: "2026-07-03",
    datePaid: null,
    amount: 3500,
    interest: 0,
    accountId: "acct-gcash",
    categoryId: "exp-food",
    paymentStatus: "Unpaid",
    paymentFrequency: null,
    periodCount: null,
    paidPeriod: null,
    pasabuyer: null,
    pasabuyStatus: null,
    pasabuyDateOfPayment: null,
    pasabuyPaidPeriod: null,
    pasabuyAccountReceiverId: null,
  },
  {
    id: "expense-phone",
    description: "Phone Installment",
    purchaseDate: "2026-06-20",
    datePaid: null,
    amount: 45000,
    interest: 1200,
    accountId: "acct-metrobank-card",
    categoryId: "exp-gadgets",
    paymentStatus: "Installment",
    paymentFrequency: "Monthly",
    periodCount: 12,
    paidPeriod: 3,
    pasabuyer: null,
    pasabuyStatus: null,
    pasabuyDateOfPayment: null,
    pasabuyPaidPeriod: null,
    pasabuyAccountReceiverId: null,
  },
  {
    id: "expense-pasabuy",
    description: "Pasabuy Purchase",
    purchaseDate: "2026-07-05",
    datePaid: null,
    amount: 8000,
    interest: 0,
    accountId: "acct-bypl",
    categoryId: "exp-pasabuy",
    paymentStatus: "Installment",
    paymentFrequency: "Monthly",
    periodCount: 2,
    paidPeriod: 1,
    pasabuyer: "Maimai",
    pasabuyStatus: "Payment partially received (installment)",
    pasabuyDateOfPayment: "2026-07-12",
    pasabuyPaidPeriod: 1,
    pasabuyAccountReceiverId: "acct-bdo-checking",
  },
];

export const syncLog: SyncLogEntry[] = [
  { id: "sync-1", type: "pull", resource: "All resources", description: "Pulled latest workspace snapshot", timestamp: "2026-07-03 09:30" },
  { id: "sync-2", type: "create", resource: "Income", description: "Created July Salary", timestamp: "2026-07-03 09:26" },
  { id: "sync-3", type: "update", resource: "Accounts", description: "Refreshed computed balances", timestamp: "2026-07-03 09:25" },
  { id: "sync-4", type: "conflict", resource: "Expense", description: "Detected a changed Phone Installment record", timestamp: "2026-07-02 19:05" },
  { id: "sync-5", type: "error", resource: "Schema", description: "Payment Status option mismatch requires review", timestamp: "2026-07-02 18:48" },
];

export function getAccountName(id: string) {
  return accounts.find((account) => account.id === id)?.name ?? "Unknown account";
}

export function getAccountType(id: string) {
  return accounts.find((account) => account.id === id)?.type ?? "Cash";
}

export function getIncomeCategoryName(id: string) {
  return incomeCategories.find((category) => category.id === id)?.source ?? "Unmapped";
}

export function getExpenseCategoryName(id: string) {
  return expenseCategories.find((category) => category.id === id)?.name ?? "Unmapped";
}

export function getActiveSectionLabel(id: FinanceSectionId) {
  return financeSections.find((section) => section.id === id)?.label ?? "Dashboard";
}
