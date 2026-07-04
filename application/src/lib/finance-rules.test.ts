import { describe, expect, it } from "vitest";
import {
  auxiliaryIncomeCategoryLabels,
  calculateCategoryTotalOverview,
  calculateExpectedPaymentDate,
  calculateGrossPrice,
  calculateInstallmentAmount,
  calculateNetIncome,
  calculatePaidAmount,
  calculatePasabuyerBalance,
  calculatePasabuyReceivedAmount,
  calculateRemainingBalance,
  calculateTotalCashFlow,
  getExpenseConditionalSections,
  getExpenseStatusFromDatePaid,
  getMoneyValueTone,
  getNormalIncomeCategories,
  getWorkflowFixedCategory,
  incomeTransactionOnlyFields,
  isExpenseRecordInViewScope,
  isIncomeRecordInViewScope,
  isOutstandingExpense,
  isUnpaidPasabuyExpense,
  isMonthlyMonitoringEditable,
  normalIncomeFields,
  pasabuyStatusLabels,
  paymentStatusLabels,
  shouldShowGlobalMonthSelector,
} from "./finance-rules";
import { accounts, expenseRecords, incomeCategories, incomeRecords } from "./finance-data";

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

  it("calculates dashboard total cash flow from active non-credit accounts", () => {
    expect(calculateTotalCashFlow(accounts)).toBe(177430.75);
  });

  it("derives expense table status from date paid only", () => {
    expect(getExpenseStatusFromDatePaid(null)).toBe("unpaid");
    expect(getExpenseStatusFromDatePaid("2026-07-03")).toBe("paid");
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
        viewMode: "Unpaid Pasabuy",
        categoryName: "Food & Dining",
      }),
    ).toEqual({ creditCard: false, pasabuy: true });
  });

  it("locks transaction workflow categories where product rules require it", () => {
    expect(getWorkflowFixedCategory("transfer")).toBe("Transfer");
    expect(getWorkflowFixedCategory("credit-card-payment")).toBe("Credit Card Payment");
    expect(getWorkflowFixedCategory("alkansya")).toBe("Savings");
  });

  it("treats monthly monitoring as read-only in normal app flows", () => {
    expect(isMonthlyMonitoringEditable("monthly-monitoring")).toBe(false);
    expect(isMonthlyMonitoringEditable("income")).toBe(true);
  });

  it("shows the global month selector only where it affects query scope", () => {
    expect(
      shouldShowGlobalMonthSelector({
        section: "dashboard",
        incomeViewMode: "Monthly",
        expenseViewMode: "Monthly",
      }),
    ).toBe(true);
    expect(
      shouldShowGlobalMonthSelector({
        section: "accounts",
        incomeViewMode: "Monthly",
        expenseViewMode: "Monthly",
      }),
    ).toBe(false);
    expect(
      shouldShowGlobalMonthSelector({
        section: "income",
        incomeViewMode: "Weekly",
        expenseViewMode: "Monthly",
      }),
    ).toBe(false);
    expect(
      shouldShowGlobalMonthSelector({
        section: "income",
        incomeViewMode: "Monthly",
        expenseViewMode: "Monthly",
      }),
    ).toBe(true);
    expect(
      shouldShowGlobalMonthSelector({
        section: "expense",
        incomeViewMode: "Monthly",
        expenseViewMode: "To pay",
      }),
    ).toBe(false);
  });

  it("scopes income and expense records by selected month only for monthly views", () => {
    const referenceDate = new Date(2026, 6, 4);
    const julyIncome = incomeRecords.find((record) => record.id === "income-project-retainer");
    const juneExpense = expenseRecords.find((record) => record.id === "expense-phone");

    expect(julyIncome).toBeDefined();
    expect(juneExpense).toBeDefined();
    expect(isIncomeRecordInViewScope(julyIncome!, "Monthly", "2026-07", referenceDate)).toBe(true);
    expect(isIncomeRecordInViewScope(julyIncome!, "Daily", "2026-07", referenceDate)).toBe(false);
    expect(isIncomeRecordInViewScope(julyIncome!, "Weekly", "2026-07", referenceDate)).toBe(true);
    expect(isExpenseRecordInViewScope(juneExpense!, "Monthly", "2026-07", referenceDate)).toBe(false);
    expect(isExpenseRecordInViewScope(juneExpense!, "Installments", "2026-07", referenceDate)).toBe(true);
  });

  it("calculates income net values locally from writable inputs", () => {
    expect(calculateNetIncome(85000, 5000)).toBe(80000);
    expect(calculateNetIncome(5000, 7000)).toBe(-2000);
    expect(getMoneyValueTone(80000)).toBe("green");
    expect(getMoneyValueTone(-2000)).toBe("rose");
    expect(getMoneyValueTone(0)).toBe("ink");
  });

  it("calculates expense category total overview as share of total spending", () => {
    expect(calculateCategoryTotalOverview(12500, 23700)).toBe(52.74);
    expect(calculateCategoryTotalOverview(12500, 0)).toBe(0);
  });

  it("preserves live expense select labels from Notion", () => {
    expect(paymentStatusLabels).toEqual(["Paid", "Unpaid", "Installment", "Cancelled"]);
    expect(pasabuyStatusLabels).toEqual([
      "Payment not yet receive",
      "Payment partially received",
      "Payment partially received (installment)",
      "Payment fully received",
    ]);
  });

  it("calculates credit expense values locally from writable inputs", () => {
    const grossPrice = calculateGrossPrice(45000, 1200);
    const installmentAmount = calculateInstallmentAmount({
      grossPrice,
      paymentStatus: "Installment",
      periodCount: 12,
    });
    const paidAmount = calculatePaidAmount({
      grossPrice,
      paymentStatus: "Installment",
      installmentAmount,
      paidPeriod: 3,
    });

    expect(grossPrice).toBe(46200);
    expect(installmentAmount).toBe(3850);
    expect(paidAmount).toBe(11550);
    expect(calculateRemainingBalance(grossPrice, paidAmount)).toBe(34650);
    expect(
      calculateExpectedPaymentDate({
        purchaseDate: "2026-06-20",
        billingDay: 15,
        dueDay: 10,
      }),
    ).toBe("2026-08-10");
  });

  it("calculates pasabuy received amount and balance locally", () => {
    const received = calculatePasabuyReceivedAmount({
      grossPrice: 8000,
      pasabuyStatus: "Payment partially received (installment)",
      installmentAmount: 4000,
      pasabuyPaidPeriod: 1,
      periodCount: 2,
    });

    expect(received).toBe(4000);
    expect(calculatePasabuyerBalance(8000, received)).toBe(4000);
  });

  it("treats unpaid pasabuy records as not fully received", () => {
    const pasabuyRecord = expenseRecords.find((record) => record.id === "expense-pasabuy");

    expect(pasabuyRecord).toBeDefined();
    expect(isOutstandingExpense(pasabuyRecord!)).toBe(true);
    expect(isUnpaidPasabuyExpense(pasabuyRecord!, "Pasabuy")).toBe(true);
  });
});
