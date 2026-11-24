// @vitest-environment jsdom
// view-titles/01: the page title follows the selected period, like Monitoring.
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { periodPageTitle } from "@/lib/view-title";
import { IncomePage } from "./income";
import { ExpensePage } from "./expense";
import { WorkflowPage } from "./workflow";
import type { ExpenseViewMode, IncomeViewMode, WorkflowSectionId } from "@/types/finance";

describe("view-titles/01 periodPageTitle", () => {
  it.each([
    ["Daily", "Daily Income"],
    ["Weekly", "Weekly Income"],
    ["Monthly", "Monthly Income"],
    ["Quarterly", "Quarterly Income"],
  ] as const)("view-titles/01#AC1 %s reads %s", (mode, title) => {
    expect(periodPageTitle("Income", mode)).toBe(title);
  });

  it("view-titles/01#AC2 Semi-Annually and Annually use the Monitoring words", () => {
    expect(periodPageTitle("Expense", "Semi-Annually")).toBe("Semi-Annual Expense");
    expect(periodPageTitle("Transfer", "Annually")).toBe("Annual Transfer");
  });

  it("view-titles/01#AC3 All Records reads All <Page> Records", () => {
    expect(periodPageTitle("Income", "All Records")).toBe("All Income Records");
    expect(periodPageTitle("Credit Card Payment", "All Records")).toBe("All Credit Card Payment Records");
  });

  it.each([
    ["To pay", "To Pay"], ["To buy", "To Buy"], ["Installments", "Installments"],
    ["CC Transaction", "Credit Card Expenses"], ["Pasabuy", "Pasabuy Expenses"],
    ["Unpaid Pasabuy", "Expense"],
  ] as [ExpenseViewMode, string][])(
    "expense-views/01#AC1 %s is titled %s", (mode, title) => {
      expect(periodPageTitle("Expense", mode)).toBe(title);
    },
  );
});

const heading = () => screen.getByRole("heading", { level: 2 }).textContent;
const baseApi = {
  accounts: { list: vi.fn(async () => ok([])) },
  categories: { income: vi.fn(async () => ok([])), expense: vi.fn(async () => ok([])) },
  incomes: { list: vi.fn(async () => ok([])) },
  expenses: { list: vi.fn(async () => ok([])), listForCCCoverage: vi.fn(async () => ok([])) },
};

describe("view-titles/01 pages show the period in the title", () => {
  it.each(["Daily", "All Records"] as IncomeViewMode[])("view-titles/01#AC1 Income in %s", async (mode) => {
    renderPage(<IncomePage viewMode={mode} onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, { apiOverrides: baseApi });
    await screen.findByRole("heading", { level: 2 });
    expect(heading()).toBe(mode === "All Records" ? "All Income Records" : "Daily Income");
  });

  it("view-titles/01#AC2 Expense on Annually reads Annual Expense", async () => {
    renderPage(<ExpensePage viewMode="Annually" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, { apiOverrides: baseApi });
    await screen.findByRole("heading", { level: 2 });
    expect(heading()).toBe("Annual Expense");
  });

  it("expense-views/01#AC1 Expense To pay is titled To Pay", async () => {
    renderPage(<ExpensePage viewMode="To pay" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, { apiOverrides: baseApi });
    await screen.findByRole("heading", { level: 2 });
    expect(heading()).toBe("To Pay");
  });

  it.each([
    ["transfer", "Weekly Transfer"],
    ["credit-card-payment", "Weekly Credit Card Payment"],
    ["alkansya", "Weekly Alkansya"],
    ["borrowings", "Weekly Borrowings"],
    ["receivables", "Weekly Receivables"],
  ] as Array<[WorkflowSectionId, string]>)("view-titles/01#AC1 %s page reads %s", async (section, title) => {
    renderPage(
      <WorkflowPage section={section} selectedMonth="2026-07" selectedDate="2026-07-11" viewMode="Weekly" onViewModeChange={vi.fn()} />,
      { apiOverrides: baseApi },
    );
    await screen.findByRole("heading", { level: 2, name: title });
  });
});
