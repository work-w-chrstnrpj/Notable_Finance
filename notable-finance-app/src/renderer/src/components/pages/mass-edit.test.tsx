// @vitest-environment jsdom
// Covers mass-edit patch application and the partial-failure message path
// (refactor_development_plan.md Phase 1). Exercised against ExpensePage.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitForElementToBeRemoved } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok, err } from "../../../../../test/mock-window-api";
import { ExpensePage } from "./expense";
import type { UpdateExpenseInput } from "@shared/finance.types";

const account = { id: "acc1", name: "Main Wallet", type: "Cash" as const, icon: null, information: "", startingBalance: 0, currentBalance: 0, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true };
const category = { id: "cat1", name: "Groceries", monthlyBudget: 0, auxiliary: false, icon: null };

function makeExpense(id: string, description: string) {
  return {
    id,
    description,
    purchaseDate: "2026-07-10",
    datePaid: null,
    amount: 1000,
    interest: 0,
    accountId: "acc1",
    categoryId: "cat1",
    paymentStatus: "Unpaid" as const,
    paymentFrequency: null,
    periodCount: null,
    paidPeriod: null,
    pasabuyer: null,
    pasabuyStatus: null,
    pasabuyDateOfPayment: null,
    pasabuyPaidPeriod: null,
    pasabuyAccountReceiverId: null,
    pasabuyBalance: 0,
    ccLinkPaymentReceiptId: null
  };
}

describe("Expense mass edit", () => {
  it("applies a patch to the selected record and shows a success notice", async () => {
    const record = makeExpense("exp1", "Grocery Run");
    const update = vi.fn(async (_id: string, patch: UpdateExpenseInput) => ok({ ...record, ...patch }));

    renderPage(<ExpensePage viewMode="Monthly" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, {
      apiOverrides: {
        accounts: { list: vi.fn(async () => (ok([account]))) },
        categories: {
          income: vi.fn(async () => (ok([]))),
          expense: vi.fn(async () => (ok([category])))
        },
        expenses: { list: vi.fn(async () => (ok([record]))), update },
        incomes: { list: vi.fn(async () => (ok([]))) }
      }
    });

    await waitForElementToBeRemoved(() => screen.queryByText("Querying Notion…"));
    fireEvent.click(screen.getByRole("button", { name: "Select row" }));
    await screen.findByText("1 selected");
    fireEvent.click(screen.getByRole("button", { name: /^Edit$/ }));
    await screen.findByText("Bulk edit 1 expense");

    // Default row starts on "Purchase Date" (the first massEditFields entry) — set a new date.
    const dateInput = screen.getByLabelText("New value") as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-08-01" } });
    fireEvent.click(screen.getByRole("button", { name: /Apply to selected/i }));

    await waitForElementToBeRemoved(() => screen.queryByText("Bulk edit 1 expense"));
    expect(update).toHaveBeenCalledWith("exp1", { purchaseDate: "2026-08-01" });
    expect(await screen.findByText("Updated 1 expense.")).toBeInTheDocument();
  });

  it("reports a partial failure when some records fail to update", async () => {
    const recordA = makeExpense("exp1", "Grocery Run");
    const recordB = makeExpense("exp2", "Hardware Store");
    const update = vi.fn(async (id: string, patch: UpdateExpenseInput) =>
      id === "exp1" ? ok({ ...recordA, ...patch }) : err("E_TEST", "boom")
    );

    renderPage(<ExpensePage viewMode="Monthly" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, {
      apiOverrides: {
        accounts: { list: vi.fn(async () => (ok([account]))) },
        categories: {
          income: vi.fn(async () => (ok([]))),
          expense: vi.fn(async () => (ok([category])))
        },
        expenses: { list: vi.fn(async () => (ok([recordA, recordB]))), update },
        incomes: { list: vi.fn(async () => (ok([]))) }
      }
    });

    await waitForElementToBeRemoved(() => screen.queryByText("Querying Notion…"));
    const checkboxes = screen.getAllByRole("button", { name: "Select row" });
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    await screen.findByText("2 selected");
    fireEvent.click(screen.getByRole("button", { name: /^Edit$/ }));
    await screen.findByText("Bulk edit 2 expenses");

    const dateInput = screen.getByLabelText("New value") as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-08-01" } });
    fireEvent.click(screen.getByRole("button", { name: /Apply to selected/i }));

    await waitForElementToBeRemoved(() => screen.queryByText("Bulk edit 2 expenses"));
    expect(await screen.findByText("1 of 2 items failed to update.")).toBeInTheDocument();
  });
});
