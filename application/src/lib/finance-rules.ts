import type {
  AccountType,
  ExpenseViewMode,
  FinanceSectionId,
  IncomeCategory,
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

export const transactionWorkflowCategories: Partial<Record<WorkflowSectionId, string>> = {
  transfer: "Transfer",
  "credit-card-payment": "Credit Card Payment",
};

export function isCreditLikeAccountType(type: AccountType) {
  return type === "Credit Account" || type === "BYPL";
}

export function isAuxiliaryIncomeCategory(label: string) {
  return auxiliaryIncomeCategoryLabels.some(
    (category) => category.toLowerCase() === label.toLowerCase(),
  );
}

export function getNormalIncomeCategories(categories: IncomeCategory[]) {
  return categories.filter((category) => !isAuxiliaryIncomeCategory(category.source));
}

export function getAccountFormFields(type: AccountType) {
  const baseFields = [
    "Account Name",
    "Account Information",
  ];

  if (!isCreditLikeAccountType(type)) {
    return [...baseFields, "Starting Balance"];
  }

  return [
    ...baseFields,
    "Credit Limit",
    "Credit Points",
    "Annual Fee",
    "Billing Day",
    "Due Day",
  ];
}

export function shouldShowCreditExpenseFields(accountType: AccountType) {
  return isCreditLikeAccountType(accountType);
}

export function shouldShowPasabuyFields(viewMode: ExpenseViewMode, categoryName: string) {
  return viewMode === "Pasabuy" || categoryName.toLowerCase() === "pasabuy";
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
  if (section === "transfer" || section === "credit-card-payment") {
    return transactionWorkflowCategories[section];
  }

  return undefined;
}

export function isMonthlyMonitoringEditable(section: FinanceSectionId) {
  return section !== "monthly-monitoring";
}
