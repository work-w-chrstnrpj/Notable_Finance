import type {
  Account,
  AccountType,
  ExpenseCategory,
  ExpenseRecord,
  ExpenseViewMode,
  FinanceSectionId,
  IncomeCategory,
  IncomeRecord,
  PasabuyStatus,
  PaymentFrequency,
  PaymentStatus,
  WorkflowSectionId,
} from "@/types/finance";

export const normalIncomeFields = [
  "Name",
  "Date",
  "Gross Income",
  "Capital Expenditure",
  "Accounts",
  "Categories",
] as const;

export const incomeTransactionOnlyFields = [
  "Transacted Account",
  "CC Payment Covered",
] as const;

export const auxiliaryIncomeCategoryLabels = [
  "IOU",
  "Transfer",
  "Old Income Logger",
  "Credit Card Payment",
  "Debt Payment",
] as const;

export const paymentStatusLabels: PaymentStatus[] = [
  "Paid",
  "Unpaid",
  "Installment",
  "Cancelled",
];

export const paymentFrequencyLabels: PaymentFrequency[] = [
  "Daily",
  "Weekly",
  "Monthly",
  "Quarterly",
  "Annually",
];

export const pasabuyerLabels = ["Shared", "Maimai", "Claire", "22-H"] as const;

export const pasabuyStatusLabels: PasabuyStatus[] = [
  "Payment not yet receive",
  "Payment partially received",
  "Payment partially received (installment)",
  "Payment fully received",
];

export const transactionWorkflowCategories: Partial<Record<WorkflowSectionId, string>> = {
  transfer: "Transfer",
  "credit-card-payment": "Credit Card Payment",
  alkansya: "Savings",
};

export function isCreditLikeAccountType(type: AccountType) {
  return type === "Credit Account" || type === "e-Credit" || type === "BNPL";
}

export function calculateTotalCashFlow(accounts: Account[]) {
  return roundMoney(
    accounts
      .filter((account) => !account.inactive && !isCreditLikeAccountType(account.type))
      .reduce((sum, account) => sum + account.currentBalance, 0),
  );
}

export function isAuxiliaryIncomeCategory(label: string) {
  return auxiliaryIncomeCategoryLabels.some(
    (category) => category.toLowerCase() === label.toLowerCase(),
  );
}

export function getNormalIncomeCategories(categories: IncomeCategory[]) {
  return categories.filter((category) => !isAuxiliaryIncomeCategory(category.source));
}

export function shouldShowCreditExpenseFields(accountType: AccountType) {
  return isCreditLikeAccountType(accountType);
}

export function shouldShowPasabuyFields(viewMode: ExpenseViewMode, categoryName: string) {
  return viewMode === "Unpaid Pasabuy" || isPasabuyCategoryName(categoryName);
}

export function getExpenseConditionalSections(options: {
  accountType: AccountType;
  viewMode: ExpenseViewMode;
  categoryName: string;
}) {
  return {
    creditCard: shouldShowCreditExpenseFields(options.accountType),
    pasabuy: shouldShowPasabuyFields(options.viewMode, options.categoryName),
  };
}

export function getWorkflowFixedCategory(section: FinanceSectionId) {
  return transactionWorkflowCategories[section as WorkflowSectionId];
}

export function isMonthlyMonitoringEditable(section: FinanceSectionId) {
  return section !== "monthly-monitoring";
}

export function calculateNetIncome(grossIncome: number, capitalExpenditure: number) {
  return roundMoney(grossIncome - capitalExpenditure);
}

export function calculateCategoryTotalOverview(categorySpending: number, totalSpending: number) {
  if (totalSpending <= 0) {
    return 0;
  }

  return roundMoney((categorySpending / totalSpending) * 100);
}

export function calculateGrossPrice(expenseAmount: number, interest: number) {
  return roundMoney(expenseAmount + interest);
}

export function calculateInstallmentAmount(options: {
  grossPrice: number;
  paymentStatus: PaymentStatus | "";
  periodCount: number | null;
}) {
  if (options.paymentStatus !== "Installment" || !options.periodCount || options.periodCount <= 0) {
    return null;
  }

  return roundMoney(options.grossPrice / options.periodCount);
}

export function calculatePaidAmount(options: {
  grossPrice: number;
  paymentStatus: PaymentStatus | "";
  installmentAmount: number | null;
  paidPeriod: number | null;
}) {
  if (options.paymentStatus === "Paid") {
    return roundMoney(options.grossPrice);
  }

  if (options.paymentStatus === "Installment" && options.installmentAmount && options.paidPeriod) {
    return roundMoney(options.installmentAmount * options.paidPeriod);
  }

  return 0;
}

export function calculateRemainingBalance(grossPrice: number, paidAmount: number) {
  return roundMoney(Math.max(grossPrice - paidAmount, 0));
}

export function calculatePasabuyReceivedAmount(options: {
  grossPrice: number;
  pasabuyStatus: PasabuyStatus | "";
  installmentAmount: number | null;
  pasabuyPaidPeriod: number | null;
  periodCount: number | null;
}) {
  if (options.pasabuyStatus === "Payment fully received") {
    return roundMoney(options.grossPrice);
  }

  if (
    options.pasabuyStatus === "Payment partially received (installment)" &&
    options.installmentAmount &&
    options.pasabuyPaidPeriod
  ) {
    return roundMoney(options.installmentAmount * options.pasabuyPaidPeriod);
  }

  if (
    options.pasabuyStatus === "Payment partially received" &&
    options.periodCount &&
    options.periodCount > 0 &&
    options.pasabuyPaidPeriod
  ) {
    return roundMoney((options.grossPrice / options.periodCount) * options.pasabuyPaidPeriod);
  }

  return 0;
}

export function calculatePasabuyerBalance(grossPrice: number, receivedAmount: number) {
  return calculateRemainingBalance(grossPrice, receivedAmount);
}

export function calculateExpectedPaymentDate(options: {
  purchaseDate: string;
  billingDay: number | null;
  dueDay: number | null;
}) {
  if (!options.purchaseDate || !options.billingDay || !options.dueDay) {
    return null;
  }

  const purchaseDate = parseIsoDate(options.purchaseDate);

  if (!purchaseDate) {
    return null;
  }

  const billingMonthOffset = purchaseDate.day <= options.billingDay ? 0 : 1;
  const billingMonthIndex = purchaseDate.monthIndex + billingMonthOffset;
  const dueMonthOffset = options.dueDay > options.billingDay ? 0 : 1;
  const dueDate = createClampedDate(
    purchaseDate.year,
    billingMonthIndex + dueMonthOffset,
    options.dueDay,
  );

  return formatIsoDate(dueDate);
}

export function getMoneyValueTone(value: number) {
  if (value > 0) {
    return "green";
  }

  if (value < 0) {
    return "rose";
  }

  return "ink";
}

export function isPasabuyCategoryName(categoryName: string) {
  return categoryName.toLowerCase() === "pasabuy";
}

export function isPasabuyCategory(category: ExpenseCategory) {
  return category.auxiliary === "Yes" && isPasabuyCategoryName(category.name);
}

export function isOutstandingExpense(record: ExpenseRecord) {
  return record.datePaid === null || record.paymentStatus !== "Paid";
}

export function shouldShowGlobalMonthSelector(options: {
  section: FinanceSectionId;
  incomeViewMode: "Daily" | "Weekly" | "Monthly" | "Annually";
  expenseViewMode: ExpenseViewMode;
}) {
  if (options.section === "accounts" || options.section === "sync" || options.section === "settings") {
    return false;
  }

  if (options.section === "income") {
    return options.incomeViewMode === "Monthly";
  }

  if (options.section === "expense") {
    return options.expenseViewMode === "Monthly";
  }

  return true;
}

export function getMonthKeyFromIsoDate(value: string) {
  return value.slice(0, 7);
}

export function isIncomeRecordInViewScope(
  record: IncomeRecord,
  viewMode: "Daily" | "Weekly" | "Monthly" | "Annually",
  selectedMonth: string,
  referenceDate = new Date(),
) {
  return isIsoDateInViewScope(record.date, viewMode, selectedMonth, referenceDate);
}

export function isExpenseRecordInViewScope(
  record: ExpenseRecord,
  viewMode: ExpenseViewMode,
  selectedMonth: string,
  referenceDate = new Date(),
) {
  if (viewMode === "Daily" || viewMode === "Weekly" || viewMode === "Monthly") {
    return isIsoDateInViewScope(record.purchaseDate, viewMode, selectedMonth, referenceDate);
  }

  return true;
}

export function getExpenseStatusFromDatePaid(datePaid: string | null) {
  return datePaid ? "paid" : "unpaid";
}

export function isUnpaidPasabuyExpense(record: ExpenseRecord, categoryName: string) {
  if (!isPasabuyCategoryName(categoryName)) return false;
  if (record.paymentStatus !== "Installment") return false;
  return (
    (record.pasabuyBalance ?? 0) > 0.1 ||
    record.pasabuyStatus === "Payment not yet receive" ||
    record.pasabuyStatus === "Payment partially received" ||
    (record.pasabuyPaidPeriod ?? 0) !== 1
  );
}

export function isCreditAccountExpense(record: ExpenseRecord, accounts: Account[]) {
  const account = accounts.find((item) => item.id === record.accountId);

  return account ? isCreditLikeAccountType(account.type) : false;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    monthIndex: Number(match[2]) - 1,
    day: Number(match[3]),
  };
}

function createClampedDate(year: number, monthIndex: number, day: number) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  return new Date(year, monthIndex, Math.min(day, lastDay));
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isIsoDateInViewScope(
  value: string,
  viewMode: "Daily" | "Weekly" | "Monthly" | "Annually",
  selectedMonth: string,
  referenceDate: Date,
) {
  if (viewMode === "Monthly") {
    return getMonthKeyFromIsoDate(value) === selectedMonth;
  }

  if (viewMode === "Annually") {
    return value.slice(0, 4) === `${referenceDate.getFullYear()}`;
  }

  const date = parseDateObject(value);

  if (!date) {
    return false;
  }

  if (viewMode === "Daily") {
    return formatIsoDate(date) === formatIsoDate(referenceDate);
  }

  const startOfWeek = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const mondayOffset = (startOfWeek.getDay() + 6) % 7;
  startOfWeek.setDate(startOfWeek.getDate() - mondayOffset);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return date >= startOfWeek && date <= endOfWeek;
}

function parseDateObject(value: string) {
  const parts = parseIsoDate(value);

  if (!parts) {
    return null;
  }

  return new Date(parts.year, parts.monthIndex, parts.day);
}
