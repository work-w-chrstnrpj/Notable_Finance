// @vitest-environment jsdom
// Pins the search toggle contract after Phase 3.3 deliberately unified it: closing search —
// via the button OR the Mod+F shortcut — clears the query, so reopening never silently
// re-applies a stale filter. The two entry points used to diverge (the shortcut left the
// query intact); this test exists so that divergence can't come back unnoticed.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitForElementToBeRemoved } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { IncomePage } from "./income";

const account = { id: "acc1", name: "Main Wallet", type: "Cash" as const, icon: null, information: "", startingBalance: 0, currentBalance: 0, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true };
const category = { id: "cat1", source: "Salary", auxiliary: false, icon: null };
const records = [
  { id: "inc1", name: "July Salary", date: "2026-07-15", grossIncome: 50000, capitalExpenditure: 0, accountId: "acc1", categoryId: "cat1" },
  { id: "inc2", name: "Consulting Fee", date: "2026-07-18", grossIncome: 12000, capitalExpenditure: 0, accountId: "acc1", categoryId: "cat1" },
];

async function renderIncome() {
  renderPage(<IncomePage viewMode="Monthly" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => ok([account])) },
      categories: {
        income: vi.fn(async () => ok([category])),
        expense: vi.fn(async () => ok([])),
      },
      incomes: { list: vi.fn(async () => ok(records)) },
    },
  });
  await waitForElementToBeRemoved(() => screen.queryByText("Querying Notion…"));
}

const openSearch = () => fireEvent.click(screen.getByRole("button", { name: "Search" }));
const closeSearchViaButton = () => fireEvent.click(screen.getByRole("button", { name: "Close search" }));
const pressModF = () =>
  fireEvent.keyDown(window, { key: "f", code: "KeyF", metaKey: true, ctrlKey: true });

describe("Income search toggle", () => {
  it("filters records by the typed query", async () => {
    await renderIncome();
    openSearch();

    fireEvent.change(screen.getByPlaceholderText("Search income..."), {
      target: { value: "Consulting" },
    });

    expect(screen.getByText("Consulting Fee")).toBeInTheDocument();
    expect(screen.queryByText("July Salary")).not.toBeInTheDocument();
  });

  it("clears the query when search is closed with the button", async () => {
    await renderIncome();
    openSearch();
    fireEvent.change(screen.getByPlaceholderText("Search income..."), {
      target: { value: "Consulting" },
    });
    expect(screen.queryByText("July Salary")).not.toBeInTheDocument();

    closeSearchViaButton();
    // Filter is dropped immediately on close.
    expect(screen.getByText("July Salary")).toBeInTheDocument();

    // Reopening starts empty, not with the previous query silently re-applied.
    openSearch();
    expect(screen.getByPlaceholderText("Search income...")).toHaveValue("");
    expect(screen.getByText("July Salary")).toBeInTheDocument();
  });

  it("clears the query when search is closed with the Mod+F shortcut", async () => {
    await renderIncome();
    openSearch();
    fireEvent.change(screen.getByPlaceholderText("Search income..."), {
      target: { value: "Consulting" },
    });
    expect(screen.queryByText("July Salary")).not.toBeInTheDocument();

    // Same contract as the button — this is the behaviour that used to differ.
    pressModF();
    expect(screen.getByText("July Salary")).toBeInTheDocument();

    pressModF();
    expect(screen.getByPlaceholderText("Search income...")).toHaveValue("");
    expect(screen.getByText("July Salary")).toBeInTheDocument();
  });
});
