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
  isUnpaidPasabuyExpense,
  isMonthlyMonitoringEditable,
  normalIncomeFields,
  pasabuyStatusLabels,
  paymentStatusLabels,
  shouldShowGlobalMonthSelector,
} from "./finance-rules";
import type { Account, ExpenseRecord, IncomeCategory, IncomeRecord } from "@/types/finance";

const testIncomeCategories: IncomeCategory[] = [
  { id: "inc-employment", source: "Employment", auxiliary: false, monthlyEarnings: 85000, monthlyExpenditure: 5000, monthlyGross: 80000, earningPercentage: 74.4 },
  { id: "inc-freelance", source: "Freelance", auxiliary: false, monthlyEarnings: 25000, monthlyExpenditure: 2500, monthlyGross: 22500, earningPercentage: 20.9 },
  { id: "inc-dividends", source: "Dividends", auxiliary: false, monthlyEarnings: 5000, monthlyExpenditure: 0, monthlyGross: 5000, earningPercentage: 4.7 },
  { id: "inc-savings", source: "Savings", auxiliary: false, monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0 },
  { id: "inc-transfer", source: "Transfer", auxiliary: true, monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0 },
  { id: "inc-cc-payment", source: "Credit Card Payment", auxiliary: true, monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0 },
  { id: "inc-iou", source: "IOU", auxiliary: true, monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0 },
];

const testAccounts: Account[] = [
  { id: "acct-bdo-checking", name: "BDO Checking", type: "Cash", icon: null, information: "Daily operating account", startingBalance: 25000, currentBalance: 45230.5, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true },
  { id: "acct-bpi-savings", name: "BPI Savings", type: "Savings", icon: "https://img.icons8.com/color/48/bank-building.png", information: "Emergency and savings", startingBalance: 80000, currentBalance: 123450, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true },
  { id: "acct-metrobank-card", name: "Metrobank Credit Card", type: "Credit Account", icon: "https://img.icons8.com/color/48/credit-card.png", information: "Primary card", startingBalance: 0, currentBalance: -45800, creditLimit: 150000, availableLimit: 104200, creditPoints: 1820, annualFee: 4500, billingDay: 15, dueDay: 10, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true },
  { id: "acct-gcash", name: "GCash Wallet", type: "e-Wallet", icon: "https://img.icons8.com/color/48/wallet.png", information: "Small payments", startingBalance: 5000, currentBalance: 8750.25, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true },
  { id: "acct-bnpl", name: "ShopNow BNPL", type: "BNPL", icon: null, information: "Installment purchases", startingBalance: 0, currentBalance: -12800, creditLimit: 40000, availableLimit: 27200, creditPoints: null, annualFee: 0, billingDay: 3, dueDay: 18, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true },
];

const testIncomeRecords: IncomeRecord[] = [
  { id: "income-july-salary", name: "July Salary", date: "2026-07-15", grossIncome: 85000, capitalExpenditure: 5000, accountId: "acct-bdo-checking", categoryId: "inc-employment" },
  { id: "income-project-retainer", name: "Project Retainer", date: "2026-07-05", grossIncome: 25000, capitalExpenditure: 2500, accountId: "acct-bpi-savings", categoryId: "inc-freelance" },
  { id: "income-dividend", name: "Dividend Payout", date: "2026-07-20", grossIncome: 5000, capitalExpenditure: 0, accountId: "acct-bpi-savings", categoryId: "inc-dividends" },
];

const testExpenseRecords: ExpenseRecord[] = [
  { id: "expense-rent", description: "Monthly Rent", purchaseDate: "2026-07-01", datePaid: "2026-07-01", amount: 12500, interest: 0, accountId: "acct-bdo-checking", categoryId: "exp-housing", paymentStatus: "Paid", paymentFrequency: "Monthly", periodCount: null, paidPeriod: null, ccLinkPaymentReceiptId: null, pasabuyer: null, pasabuyStatus: null, pasabuyDateOfPayment: null, pasabuyPaidPeriod: null, pasabuyAccountReceiverId: null, pasabuyBalance: 0 },
  { id: "expense-phone", description: "Phone Installment", purchaseDate: "2026-06-20", datePaid: null, amount: 45000, interest: 1200, accountId: "acct-metrobank-card", categoryId: "exp-gadgets", paymentStatus: "Installment", paymentFrequency: "Monthly", periodCount: 12, paidPeriod: 3, ccLinkPaymentReceiptId: null, pasabuyer: null, pasabuyStatus: null, pasabuyDateOfPayment: null, pasabuyPaidPeriod: null, pasabuyAccountReceiverId: null, pasabuyBalance: 0 },
  { id: "expense-pasabuy", description: "Pasabuy Purchase", purchaseDate: "2026-07-05", datePaid: null, amount: 8000, interest: 0, accountId: "acct-bnpl", categoryId: "exp-pasabuy", paymentStatus: "Installment", paymentFrequency: "Monthly", periodCount: 2, paidPeriod: 1, ccLinkPaymentReceiptId: null, pasabuyer: "Maimai", pasabuyStatus: "Payment partially received (installment)", pasabuyDateOfPayment: "2026-07-12", pasabuyPaidPeriod: 1, pasabuyAccountReceiverId: "acct-bdo-checking", pasabuyBalance: 4000 },
];

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
    const normalCategories = getNormalIncomeCategories(testIncomeCategories).map(
      (category) => category.source,
    );

    for (const category of auxiliaryIncomeCategoryLabels) {
      expect(normalCategories).not.toContain(category);
    }
  });

  it("calculates dashboard total cash flow from active non-credit accounts", () => {
    expect(calculateTotalCashFlow(testAccounts)).toBe(177430.75);
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
    const julyIncome = testIncomeRecords.find((record) => record.id === "income-project-retainer");
    const juneExpense = testExpenseRecords.find((record) => record.id === "expense-phone");

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

  it("calculates expected payment date with billingDay === dueDay (no extra month)", () => {
    expect(
      calculateExpectedPaymentDate({
        purchaseDate: "2026-07-19",
        billingDay: 5,
        dueDay: 5,
      }),
    ).toBe("2026-08-05");
  });

  it("calculates expected payment date with periodCount > 1", () => {
    expect(
      calculateExpectedPaymentDate({
        purchaseDate: "2026-07-01",
        billingDay: 15,
        dueDay: 10,
        periodCount: 3,
      }),
    ).toBe("2026-10-10");
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
    const pasabuyRecord = testExpenseRecords.find((record) => record.id === "expense-pasabuy");

    // Pasabuy category + non-Installment + balance > 0.1 = unpaid pasabuy
    expect(isUnpaidPasabuyExpense({ ...pasabuyRecord!, paymentStatus: "Paid", pasabuyBalance: 50 }, "Pasabuy")).toBe(true);

    // Pasabuy + non-Installment + "Payment not yet receive" status = unpaid pasabuy
    expect(isUnpaidPasabuyExpense({ ...pasabuyRecord!, paymentStatus: "Paid", pasabuyBalance: 0, pasabuyStatus: "Payment not yet receive" }, "Pasabuy")).toBe(true);

    // Pasabuy + non-Installment + "Payment partially received" status = unpaid pasabuy
    expect(isUnpaidPasabuyExpense({ ...pasabuyRecord!, paymentStatus: "Paid", pasabuyBalance: 0, pasabuyStatus: "Payment partially received" }, "Pasabuy")).toBe(true);

    // Pasabuy + non-Installment + paidPeriod != 1 = unpaid pasabuy
    expect(isUnpaidPasabuyExpense({ ...pasabuyRecord!, paymentStatus: "Paid", pasabuyBalance: 0, pasabuyPaidPeriod: 0 }, "Pasabuy")).toBe(true);

    // Installment = NOT unpaid pasabuy
    expect(isUnpaidPasabuyExpense({ ...pasabuyRecord!, paymentStatus: "Installment", pasabuyBalance: 50 }, "Pasabuy")).toBe(false);

    // balance 0, no status match, paidPeriod=1 = NOT unpaid pasabuy
    expect(isUnpaidPasabuyExpense({ ...pasabuyRecord!, paymentStatus: "Paid", pasabuyBalance: 0, pasabuyPaidPeriod: 1 }, "Pasabuy")).toBe(false);

    // Wrong category = NOT unpaid pasabuy
    expect(isUnpaidPasabuyExpense({ ...pasabuyRecord!, paymentStatus: "Paid", pasabuyBalance: 50 }, "Food & Dining")).toBe(false);
  });
});
