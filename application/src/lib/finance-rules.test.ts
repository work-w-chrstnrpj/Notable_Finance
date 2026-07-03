import { describe, expect, it } from "vitest";
import {
  auxiliaryIncomeCategoryLabels,
  getAccountFormFields,
  getExpenseConditionalSections,
  getNormalIncomeCategories,
  getWorkflowFixedCategory,
  incomeTransactionOnlyFields,
  isMonthlyMonitoringEditable,
  normalIncomeFields,
} from "./finance-rules";
import { incomeCategories } from "./finance-data";

describe("finance frontend rules", () => {
  it("keeps normal income forms focused on income fields", () => {
    expect(normalIncomeFields).toEqual([
      "Name",
      "Date",
      "Gross Income",
      "Capital Expenditure",
      "Accounts",
      "Categories",
    ]);
    expect(normalIncomeFields).not.toContain(incomeTransactionOnlyFields[0]);
    expect(normalIncomeFields).not.toContain(incomeTransactionOnlyFields[1]);
  });

  it("excludes auxiliary income categories from normal income choices", () => {
    const normalCategories = getNormalIncomeCategories(incomeCategories).map(
      (category) => category.source,
    );

    for (const category of auxiliaryIncomeCategoryLabels) {
      expect(normalCategories).not.toContain(category);
    }
  });

  it("shows credit account fields only for credit-like account types", () => {
    expect(getAccountFormFields("Cash")).not.toContain("Credit Limit");
    expect(getAccountFormFields("Savings Account")).not.toContain("Due Day");
    expect(getAccountFormFields("Credit Account")).toContain("Credit Limit");
    expect(getAccountFormFields("BYPL")).toContain("Due Day");
  });

  it("removes starting balance from credit-like account forms", () => {
    expect(getAccountFormFields("Cash")).toContain("Starting Balance");
    expect(getAccountFormFields("Credit Account")).not.toContain("Starting Balance");
    expect(getAccountFormFields("BYPL")).not.toContain("Starting Balance");
  });

  it("keeps account forms free of derived Notion label fields", () => {
    expect(getAccountFormFields("Cash")).not.toEqual(
      expect.arrayContaining(["Income Label", "Expense Label", "Balance Label"]),
    );
    expect(getAccountFormFields("Credit Account")).not.toEqual(
      expect.arrayContaining(["Income Label", "Expense Label", "Balance Label"]),
    );
  });

  it("switches expense conditional sections from account, view, and category context", () => {
    expect(
      getExpenseConditionalSections({
        accountType: "Credit Account",
        viewMode: "Monthly",
        categoryName: "Food & Dining",
      }),
    ).toEqual({ creditCard: true, pasabuy: false });

    expect(
      getExpenseConditionalSections({
        accountType: "Cash",
        viewMode: "Pasabuy",
        categoryName: "Food & Dining",
      }),
    ).toEqual({ creditCard: false, pasabuy: true });
  });

  it("locks transaction workflow categories where product rules require it", () => {
    expect(getWorkflowFixedCategory("transfer")).toBe("Transfer");
    expect(getWorkflowFixedCategory("credit-card-payment")).toBe("Credit Card Payment");
    expect(getWorkflowFixedCategory("alkansya")).toBeUndefined();
  });

  it("treats monthly monitoring as read-only in normal app flows", () => {
    expect(isMonthlyMonitoringEditable("monthly-monitoring")).toBe(false);
    expect(isMonthlyMonitoringEditable("income")).toBe(true);
  });
});
