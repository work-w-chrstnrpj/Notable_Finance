// @vitest-environment jsdom
// filter-options/02 and /03: combined status options in the Expense filter row.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { ExpensePage } from "./expense";
import type { ExpenseViewMode } from "@/types/finance";

const account = { id: "acc1", name: "Main Wallet", type: "Cash" as const, icon: null, information: "", startingBalance: 0, currentBalance: 0, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, paymentNetwork: null, cardNumbers: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true };
const category = { id: "cat1", name: "Groceries", monthlyBudget: 0, auxiliary: false, icon: null };
const pasabuyCategory = { id: "cat-pasabuy", name: "Pasabuy", monthlyBudget: 0, auxiliary: false, icon: null };
const record = {
  id: "exp1", description: "Grocery Run", purchaseDate: "2026-07-10", datePaid: null, amount: 3000, interest: 0,
  accountId: "acc1", categoryId: "cat1", paymentStatus: "Unpaid" as const, paymentFrequency: null, periodCount: null,
  bnplAdjustment: null, paidPeriod: null, pasabuyer: null, pasabuyStatus: null, pasabuyDateOfPayment: null,
  pasabuyPaidPeriod: null, pasabuyAccountReceiverId: null, pasabuyBalance: 0, ccLinkPaymentReceiptId: null,
};

function renderExpense(viewMode: ExpenseViewMode, categories = [category, pasabuyCategory]) {
  const list = vi.fn(async () => ok([record]));
  renderPage(<ExpensePage viewMode={viewMode} onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => ok([account])) },
      categories: { income: vi.fn(async () => ok([])), expense: vi.fn(async () => ok(categories)) },
      expenses: { list },
    },
  });
  return list;
}

const openFilters = async () => {
  expect(await screen.findByText("Grocery Run")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Filters" }));
};

describe("filter-options/02 All non-paid statuses", () => {
  it("filter-options/02#AC1 is the first option under the placeholder", async () => {
    renderExpense("Monthly");
    await openFilters();
    const select = screen.getByText("All payment statuses").closest("select")!;
    const labels = within(select).getAllByRole("option").map((o) => o.textContent);
    expect(labels.slice(0, 2)).toEqual(["All payment statuses", "All non-paid statuses"]);
  });

  it("filter-options/02#AC2 picking it asks the list for the combined status", async () => {
    const list = renderExpense("Monthly");
    await openFilters();
    fireEvent.change(screen.getByText("All payment statuses").closest("select")!, { target: { value: "__non-paid__" } });
    await waitFor(() => expect(list).toHaveBeenCalledWith(expect.objectContaining({ paymentStatus: "__non-paid__" })));
  });

  it.each(["To pay", "Installments"] as ExpenseViewMode[])("filter-options/02#AC3 is absent in %s", async (mode) => {
    renderExpense(mode);
    await openFilters();
    expect(screen.queryByText("All non-paid statuses")).not.toBeInTheDocument();
  });

  it("filter-options/02#AC4 stays available in Unpaid Pasabuy, where the payment status filter already shows", async () => {
    // Without a Pasabuy category the view does not redirect, so the filter row is the existing one.
    renderExpense("Unpaid Pasabuy", [category]);
    await openFilters();
    expect(screen.getByText("All non-paid statuses")).toBeInTheDocument();
  });

  it("filter-options/02#AC5 clear-filters resets it", async () => {
    const list = renderExpense("Monthly");
    await openFilters();
    fireEvent.change(screen.getByText("All payment statuses").closest("select")!, { target: { value: "__non-paid__" } });
    await waitFor(() => expect(list).toHaveBeenCalledWith(expect.objectContaining({ paymentStatus: "__non-paid__" })));
    fireEvent.click(screen.getByRole("button", { name: "Close filters" }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ paymentStatus: undefined })));
  });
});

describe("filter-options/03 All non-payment fully received", () => {
  it("filter-options/03#AC1 is the first option in the Pasabuy view", async () => {
    renderExpense("Pasabuy");
    await openFilters();
    const select = screen.getByText("All Pasabuy payment statuses").closest("select")!;
    const labels = within(select).getAllByRole("option").map((o) => o.textContent);
    expect(labels.slice(0, 2)).toEqual(["All Pasabuy payment statuses", "All non-payment fully received"]);
  });

  it("filter-options/03#AC2 picking it asks the list for the combined status", async () => {
    const list = renderExpense("Pasabuy");
    await openFilters();
    fireEvent.change(screen.getByText("All Pasabuy payment statuses").closest("select")!, { target: { value: "__non-fully-received__" } });
    await waitFor(() => expect(list).toHaveBeenCalledWith(expect.objectContaining({ pasabuyStatus: "__non-fully-received__" })));
  });

  it("filter-options/03#AC3 is absent when no Pasabuy view or category is chosen", async () => {
    renderExpense("Monthly");
    await openFilters();
    expect(screen.queryByText("All non-payment fully received")).not.toBeInTheDocument();
  });

  it("filter-options/03#AC3 is absent in Unpaid Pasabuy, where the Pasabuy status filter does not show", async () => {
    renderExpense("Unpaid Pasabuy", [category]);
    await openFilters();
    expect(screen.queryByText("All non-payment fully received")).not.toBeInTheDocument();
  });
});
