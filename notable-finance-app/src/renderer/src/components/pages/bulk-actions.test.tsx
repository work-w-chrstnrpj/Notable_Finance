// @vitest-environment jsdom
// Pins the current shape of handleBulkAction — 3 near-identical ~170-line implementations
// across income.tsx/expense.tsx/workflow.tsx (refactor_development_plan.md F2) — including
// the deliberate per-page drift: "cover" is expense-only, "edit" is hidden on workflow. Phase 3's
// use-bulk-actions extraction must gate capabilities rather than unify this away.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { ExpensePage } from "./expense";
import { WorkflowPage } from "./workflow";
import dataTableStyles from "@/components/ui/data-table.module.css";

const account = { id: "acc1", name: "Main Wallet", type: "Cash" as const, icon: null, information: "", startingBalance: 0, currentBalance: 0, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true };
const ccAccount = { ...account, id: "acc-cc", name: "Credit Card", type: "Credit Account" as const };
const category = { id: "cat1", name: "Groceries", monthlyBudget: 0, auxiliary: false, icon: null };
const expenseRecord = {
  id: "exp1",
  description: "Grocery Run",
  purchaseDate: "2026-07-10",
  datePaid: null,
  amount: 3000,
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

async function renderExpenseAndSelectRow(viewMode: "Monthly" | "Unpaid CC" = "Monthly") {
  renderPage(<ExpensePage viewMode={viewMode} onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => (ok([account, ccAccount]))) },
      categories: {
        income: vi.fn(async () => (ok([]))),
        expense: vi.fn(async () => (ok([category])))
      },
      expenses: {
        list: vi.fn(async () => (ok([expenseRecord]))),
        create: vi.fn(async () => (ok({ ...expenseRecord, id: "exp-copy" })))
      },
      incomes: { list: vi.fn(async () => (ok([]))) }
    }
  });
  await waitForElementToBeRemoved(() => screen.queryByText("Querying Notion…"));
  fireEvent.click(screen.getByRole("button", { name: "Select row" }));
  await screen.findByText(`1 selected`);
}

describe("Expense bulk actions", () => {
  it("disable then enable toggles the row and the toolbar label", async () => {
    await renderExpenseAndSelectRow();

    fireEvent.click(screen.getByRole("button", { name: /^Disable$/ }));
    await waitFor(() => {
      const cell = screen.getByText("Grocery Run");
      expect(cell.closest("tr")).toHaveClass(dataTableStyles["record-disabled"]);
    });

    // enable/disable clears the selection afterward (handleBulkAction's own behaviour) —
    // re-select before toggling back.
    fireEvent.click(screen.getByRole("button", { name: "Select row" }));
    await screen.findByText("1 selected");
    fireEvent.click(screen.getByRole("button", { name: /^Enable$/ }));
    await waitFor(() => {
      const cell = screen.getByText("Grocery Run");
      expect(cell.closest("tr")).not.toHaveClass(dataTableStyles["record-disabled"]);
    });
  });

  it("duplicate creates a new optimistic row with a (Copy) suffix", async () => {
    await renderExpenseAndSelectRow();

    fireEvent.click(screen.getByRole("button", { name: /^Duplicate$/ }));
    // The optimistic row is replaced by the real one almost immediately (the mocked create
    // resolves fast) — findByText already asserts presence by throwing if never found, so
    // don't chain a second .toBeInTheDocument() off what may be a since-replaced node.
    await screen.findByText("Grocery Run (Copy)");
  });

  it("delete opens a confirmation instead of deleting immediately", async () => {
    await renderExpenseAndSelectRow();

    fireEvent.click(screen.getByRole("button", { name: /Delete/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    // The record is still in the table — delete has not actually happened yet.
    expect(screen.getByText("Grocery Run")).toBeInTheDocument();
  });

  it("edit opens the mass-edit modal", async () => {
    await renderExpenseAndSelectRow();

    fireEvent.click(screen.getByRole("button", { name: /^Edit$/ }));
    expect(await screen.findByText("Bulk edit 1 expense")).toBeInTheDocument();
  });

  it("print opens the receipt modal", async () => {
    await renderExpenseAndSelectRow();

    fireEvent.click(screen.getByRole("button", { name: /Print Receipt/i }));
    expect(await screen.findByText("Print Receipt")).toBeInTheDocument();
  });

  it("cover is only available on the Unpaid CC view", async () => {
    await renderExpenseAndSelectRow("Unpaid CC");

    fireEvent.click(screen.getByRole("button", { name: /Cover the expense/i }));
    expect(await screen.findByText("Cover 1 Expense")).toBeInTheDocument();
  });

  it("cover is not offered on the Monthly view", async () => {
    await renderExpenseAndSelectRow("Monthly");
    expect(screen.queryByRole("button", { name: /Cover the expense/i })).not.toBeInTheDocument();
  });
});

describe("Workflow bulk actions (drift from Expense)", () => {
  it("supports enable/disable/duplicate/delete but not edit", async () => {
    const workflowRecord = {
      id: "wf1",
      name: "Weekly Transfer",
      date: "2026-07-10",
      grossIncome: 1000,
      capitalExpenditure: 0,
      accountId: "acc1",
      categoryId: "cat1",
      transactedAccountId: "acc-cc"
    };
    renderPage(<WorkflowPage section="transfer" selectedMonth="2026-07" />, {
      apiOverrides: {
        accounts: { list: vi.fn(async () => (ok([account, ccAccount]))) },
        categories: {
          income: vi.fn(async () => (ok([]))),
          expense: vi.fn(async () => (ok([])))
        },
        incomes: { list: vi.fn(async () => (ok([workflowRecord]))) },
        expenses: { listForCCCoverage: vi.fn(async () => (ok([]))) }
      }
    });

    fireEvent.click(await screen.findByRole("button", { name: "Select row" }));
    await screen.findByText("1 selected");

    expect(screen.getByRole("button", { name: /^Disable$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Duplicate$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument();
    // workflow.tsx passes showBulkEdit={false} — no bulk "Edit" entry point, unlike Income/Expense.
    expect(screen.queryByRole("button", { name: /^Edit$/ })).not.toBeInTheDocument();
  });
});
