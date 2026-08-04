// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { screen, waitForElementToBeRemoved, within } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { IncomePage } from "./income";
import type { IncomeViewMode } from "@/types/finance";

const account = { id: "acc1", name: "Main Wallet", type: "Cash" as const, icon: null, information: "", startingBalance: 0, currentBalance: 0, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true };
const category = { id: "cat1", source: "Salary", auxiliary: false, icon: null, monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0 };
const incomeRecord = { id: "inc1", name: "July Salary", date: "2026-07-15", grossIncome: 50000, capitalExpenditure: 0, accountId: "acc1", categoryId: "cat1" };

function renderIncome(viewMode: IncomeViewMode) {
  return renderPage(
    <IncomePage viewMode={viewMode} onViewModeChange={vi.fn()} selectedDate="2026-07-15" />,
    {
      apiOverrides: {
        accounts: { list: vi.fn(async () => (ok([account]))) },
        categories: {
          income: vi.fn(async () => (ok([category]))),
          expense: vi.fn(async () => (ok([])))
        },
        incomes: { list: vi.fn(async () => (ok([incomeRecord]))) }
      }
    }
  );
}

describe("IncomePage", () => {
  const viewModes: IncomeViewMode[] = ["Daily", "Weekly", "Monthly", "Annually"];

  it.each(viewModes)("renders the %s view with headers and the seeded record", async (viewMode) => {
    renderIncome(viewMode);

    expect(await screen.findByText("July Salary")).toBeInTheDocument();

    if (viewMode === "Annually") {
      // Annual view defaults to the table sub-view; same DataTable headers apply.
      expect(screen.getByText("Table")).toBeInTheDocument();
    }

    const table = screen.getByRole("table");
    for (const header of ["Name", "Date", "Account", "Category", "Gross", "Expenditure", "Net"]) {
      expect(within(table).getByText(header)).toBeInTheDocument();
    }
  });

  it("shows the empty state when no income records are returned", async () => {
    renderPage(
      <IncomePage viewMode="Monthly" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />,
      {
        apiOverrides: {
          accounts: { list: vi.fn(async () => (ok([account]))) },
          categories: {
            income: vi.fn(async () => (ok([category]))),
            expense: vi.fn(async () => (ok([])))
          },
          incomes: { list: vi.fn(async () => (ok([]))) }
        }
      }
    );

    // DataTable renders unconditionally (even mid-load, with zero rows), so `findByRole`
    // can resolve against that loading-phase node right as the real (empty) data arrives
    // and React swaps it for a new one — a stale-reference race, not a real bug. Wait for
    // the settled signal (loading indicator gone) first, then query fresh.
    await waitForElementToBeRemoved(() => screen.queryByText("Querying Notion…"));
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByText("July Salary")).not.toBeInTheDocument();
  });
});
