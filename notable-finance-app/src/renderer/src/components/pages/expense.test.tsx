// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, waitForElementToBeRemoved, within } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { ExpensePage } from "./expense";
import type { ExpenseViewMode } from "@/types/finance";

const account = { id: "acc1", name: "Main Wallet", type: "Cash" as const, icon: null, information: "", startingBalance: 0, currentBalance: 0, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true };
const category = { id: "cat1", name: "Groceries", monthlyBudget: 0, auxiliary: false, icon: null };
const pasabuyCategory = { id: "cat-pasabuy", name: "Pasabuy", monthlyBudget: 0, auxiliary: false, icon: null };
// One record with every optional field populated so it renders sensibly under every view mode
// (Installments/Unpaid CC/Unpaid Pasabuy each read a different subset of these).
const expenseRecord = {
  id: "exp1",
  description: "Grocery Run",
  purchaseDate: "2026-07-10",
  datePaid: null,
  amount: 3000,
  interest: 0,
  accountId: "acc1",
  categoryId: "cat1",
  paymentStatus: "Installment" as const,
  paymentFrequency: "Monthly" as const,
  periodCount: 3,
  paidPeriod: 1,
  pasabuyer: null,
  pasabuyStatus: null,
  pasabuyDateOfPayment: null,
  pasabuyPaidPeriod: null,
  pasabuyAccountReceiverId: null,
  pasabuyBalance: 0,
  ccLinkPaymentReceiptId: null
};

function renderExpense(viewMode: ExpenseViewMode) {
  return renderPage(
    <ExpensePage viewMode={viewMode} onViewModeChange={vi.fn()} selectedDate="2026-07-15" />,
    {
      apiOverrides: {
        accounts: { list: vi.fn(async () => (ok([account]))) },
        categories: {
          income: vi.fn(async () => (ok([]))),
          expense: vi.fn(async () => (ok([category])))
        },
        expenses: { list: vi.fn(async () => (ok([expenseRecord]))) }
      }
    }
  );
}

const DEFAULT_HEADERS = ["Date", "Description", "Amount", "Account", "Category", "Date Paid"];
const CC_HEADERS = ["Date", "Description", "Account", "Amount", "Category", "Interest", "Gross Amount", "Remaining Balance", "Payment Status", "Expected payment date", "Date Paid"];
const INSTALLMENT_HEADERS = ["Date", "Description", "Account", "Amount", "Category", "Interest", "Gross Amount", "Period Count", "Installment Amount", "Paid Period", "Paid Amount", "Remaining Balance", "Payment Status", "Expected payment date", "Date Paid"];
const PASABUY_HEADERS = ["Date", "Name", "Account", "Pasabuyer Balance", "Pasabuyer", "Status", "DOP", "Account Receiver"];

describe("ExpensePage", () => {
  const headersByMode: Record<ExpenseViewMode, string[]> = {
    Daily: DEFAULT_HEADERS,
    Weekly: DEFAULT_HEADERS,
    Monthly: DEFAULT_HEADERS,
    Annually: DEFAULT_HEADERS,
    "To pay": DEFAULT_HEADERS,
    "To buy": DEFAULT_HEADERS,
    Installments: INSTALLMENT_HEADERS,
    "Unpaid CC": CC_HEADERS,
    "Unpaid Pasabuy": PASABUY_HEADERS
  };

  for (const [mode, headers] of Object.entries(headersByMode) as Array<[ExpenseViewMode, string[]]>) {
    it(`renders the ${mode} view with its own headers and the seeded record`, async () => {
      renderExpense(mode);

      expect(await screen.findByText("Grocery Run")).toBeInTheDocument();

      const table = screen.getByRole("table");
      for (const header of headers) {
        expect(within(table).getByText(header)).toBeInTheDocument();
      }
    });
  }

  it("shows an empty table when no expenses are returned", async () => {
    renderPage(
      <ExpensePage viewMode="Monthly" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />,
      {
        apiOverrides: {
          accounts: { list: vi.fn(async () => (ok([account]))) },
          categories: {
            income: vi.fn(async () => (ok([]))),
            expense: vi.fn(async () => (ok([category])))
          },
          expenses: { list: vi.fn(async () => (ok([]))) }
        }
      }
    );

    await waitForElementToBeRemoved(() => screen.queryByText("Querying Notion…"));
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.queryByText("Grocery Run")).not.toBeInTheDocument();
  });

  it("shows Payment Status in regular and Unpaid Pasabuy views", async () => {
    const list = vi.fn(async () => ok([expenseRecord]));
    renderPage(
      <ExpensePage viewMode="Monthly" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />,
      {
        apiOverrides: {
          accounts: { list: vi.fn(async () => ok([account])) },
          categories: {
            income: vi.fn(async () => ok([])),
            expense: vi.fn(async () => ok([category])),
          },
          expenses: { list },
        },
      },
    );

    expect(await screen.findByText("Grocery Run")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));

    const paymentStatus = screen.getByRole("combobox");
    expect(within(paymentStatus).getByText("All payment statuses")).toBeInTheDocument();
    expect(within(paymentStatus).getByText("Paid")).toBeInTheDocument();
    expect(within(paymentStatus).getByText("Unpaid")).toBeInTheDocument();
    expect(within(paymentStatus).getByText("Installment")).toBeInTheDocument();
    expect(within(paymentStatus).getByText("Cancelled")).toBeInTheDocument();

    fireEvent.change(paymentStatus, { target: { value: "Unpaid" } });
    await waitFor(() => {
      expect(list).toHaveBeenCalledWith(expect.objectContaining({ paymentStatus: "Unpaid" }));
    });
  });

  for (const mode of ["To pay", "Installments"] as ExpenseViewMode[]) {
    it(`hides Payment Status in the ${mode} filters`, async () => {
      renderExpense(mode);
      expect(await screen.findByText("Grocery Run")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Filters" }));
      expect(screen.queryByText("All payment statuses")).not.toBeInTheDocument();
    });
  }

  it("shows Pasabuy Status instead of Payment Status in Unpaid CC after selecting Pasabuy", async () => {
    const list = vi.fn(async () => ok([expenseRecord]));
    renderPage(
      <ExpensePage viewMode="Unpaid CC" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />,
      {
        apiOverrides: {
          accounts: { list: vi.fn(async () => ok([account])) },
          categories: {
            income: vi.fn(async () => ok([])),
            expense: vi.fn(async () => ok([category, pasabuyCategory])),
          },
          expenses: { list },
        },
      },
    );

    expect(await screen.findByText("Grocery Run")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(screen.queryByText("All payment statuses")).not.toBeInTheDocument();
    expect(screen.queryByText("All Pasabuy statuses")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "All Categories" }));
    fireEvent.click(screen.getByRole("button", { name: "Pasabuy" }));

    const pasabuyStatusOption = await screen.findByText("All Pasabuy statuses");
    const pasabuyStatus = pasabuyStatusOption.closest("select");
    expect(pasabuyStatus).not.toBeNull();
    fireEvent.change(pasabuyStatus!, { target: { value: "Payment not yet receive" } });
    await waitFor(() => {
      expect(list).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: pasabuyCategory.id,
          pasabuyStatus: "Payment not yet receive",
          paymentStatus: undefined,
        }),
      );
    });
  });

  it("keeps Payment Status available in Unpaid Pasabuy", async () => {
    renderExpense("Unpaid Pasabuy");
    expect(await screen.findByText("Grocery Run")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(screen.getByText("All payment statuses")).toBeInTheDocument();
  });
});
