// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, waitForElementToBeRemoved, within } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { ExpensePage } from "./expense";
import type { ExpenseViewMode } from "@/types/finance";
import type { IncomeRecordDto, UpdateIncomeInput } from "@shared/finance.types";

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
  bnplAdjustment: null,
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
  it("links an installment expense to two receipts and shows both in its details", async () => {
    const card = { ...account, type: "Credit Account" as const };
    const expense = { ...expenseRecord, ccLinkPaymentReceiptId: "payment-1" };
    const firstPayment = {
      id: "payment-1", name: "July payment", date: "2026-07-15", grossIncome: 1000,
      capitalExpenditure: 0, accountId: card.id, categoryId: "credit-card-payment",
      ccPaymentCoveredIds: [expense.id],
    };
    const payments: IncomeRecordDto[] = [
      firstPayment,
      { ...firstPayment, id: "payment-2", name: "August payment", date: "2026-08-15", ccPaymentCoveredIds: ["another-expense"] },
    ];
    const update = vi.fn(async (id: string, patch: UpdateIncomeInput) => {
      const payment = payments.find((record) => record.id === id)!;
      payment.ccPaymentCoveredIds = [...(payment.ccPaymentCoveredIds ?? []), ...patch.addCcPaymentCoveredIds!];
      return ok(payment);
    });
    renderPage(
      <ExpensePage viewMode="CC Transaction" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />,
      {
        apiOverrides: {
          accounts: { list: vi.fn(async () => ok([card])) },
          categories: { expense: vi.fn(async () => ok([category])) },
          expenses: { list: vi.fn(async () => ok([expense])) },
          incomes: {
            list: vi.fn(async () => ok(payments)),
            update,
          },
        },
      },
    );

    await screen.findByText(expense.description);
    fireEvent.click(screen.getByRole("button", { name: "Select row" }));
    fireEvent.click(screen.getByRole("button", { name: "Cover the expense" }));
    expect(await screen.findByRole("radio", { name: /July payment.*Already linked/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("radio", { name: /August payment/ }));
    fireEvent.click(screen.getByRole("button", { name: "Cover" }));

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Cover 1 Expense" })).toBeNull());
    expect(update).toHaveBeenCalledExactlyOnceWith("payment-2", { addCcPaymentCoveredIds: [expense.id] });
    expect(screen.queryByText("Continue to Bulk CC Pay?")).toBeNull();
    fireEvent.click(screen.getByText(expense.description));
    expect(await screen.findByText("CC Payment Receipts")).toBeInTheDocument();
    expect(screen.getByText("July payment")).toBeInTheDocument();
    expect(screen.getByText("August payment")).toBeInTheDocument();
  });

  const headersByMode: Record<ExpenseViewMode, string[]> = {
    Daily: DEFAULT_HEADERS,
    Weekly: DEFAULT_HEADERS,
    Monthly: DEFAULT_HEADERS,
    Annually: DEFAULT_HEADERS,
    "All Records": DEFAULT_HEADERS,
    "To pay": DEFAULT_HEADERS,
    "To buy": DEFAULT_HEADERS,
    Installments: INSTALLMENT_HEADERS,
    "CC Transaction": CC_HEADERS,
    Pasabuy: ["Purchase Date", "Description", "Amount", "Account", "Pasabuyer", "Pasabuy Status", "Pasabuy Date of Payment", "Pasabuy Account Receiver", "Pasabuy Paid Period", "Pasabuy Received Amount", "Pasabuyer Balance"],
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

  it("loads all available expenses in the All Records view without date bounds", async () => {
    const list = vi.fn(async () => ok([expenseRecord]));
    renderPage(
      <ExpensePage viewMode="All Records" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />,
      { apiOverrides: { expenses: { list } } },
    );
    expect(await screen.findByText("Grocery Run")).toBeInTheDocument();
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ rangeStart: undefined, rangeEnd: undefined }));
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

    const paymentStatus = screen.getByText("All payment statuses").closest("select")!;
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

  it("combines Payment Status and Pasabuy Payment Status in CC Transaction", async () => {
    const list = vi.fn(async () => ok([expenseRecord]));
    renderPage(
      <ExpensePage viewMode="CC Transaction" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />,
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
    expect(screen.getByText("All payment statuses")).toBeInTheDocument();
    fireEvent.change(screen.getByText("All payment statuses").closest("select")!, { target: { value: "Paid" } });
    expect(screen.queryByText("All Pasabuy payment statuses")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("combobox", { name: "All Categories" }));
    fireEvent.click(screen.getByRole("option", { name: "Pasabuy" }));

    const pasabuyStatusOption = await screen.findByText("All Pasabuy payment statuses");
    const pasabuyStatus = pasabuyStatusOption.closest("select");
    expect(pasabuyStatus).not.toBeNull();
    fireEvent.change(pasabuyStatus!, { target: { value: "Payment not yet receive" } });
    await waitFor(() => {
      expect(list).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId: pasabuyCategory.id,
          pasabuyStatus: "Payment not yet receive",
          paymentStatus: "Paid",
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

it.each([
  ["Daily", "2026-07-15", "2026-07-15"],
  ["Weekly", "2026-07-13", "2026-07-19"],
  ["Monthly", "2026-07-01", "2026-07-31"],
  ["Annually", "2026-01-01", "2026-12-31"],
  ["All Records", undefined, undefined],
] as const)("CC Transaction %s passes matching purchase-date bounds", async (ccPeriod, rangeStart, rangeEnd) => {
  const list = vi.fn(async () => ok([]));
  renderPage(<ExpensePage viewMode="CC Transaction" ccPeriod={ccPeriod} onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, { apiOverrides: { expenses: { list } } });
  await waitFor(() => expect(list).toHaveBeenCalledWith(expect.objectContaining({ expenseViewMode: "CC Transaction", rangeStart, rangeEnd })));
  expect(screen.queryByRole("combobox", { name: "CC Transaction period" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Filters" }));
  expect(screen.getByRole("combobox", { name: "CC Transaction period" })).toHaveValue(ccPeriod);
  const view = screen.getByLabelText("Expense view");
  expect(within(view).getAllByRole("button").map(button => button.textContent)).toEqual(["Daily", "Weekly", "Monthly", "Annually", "All Records", "CC Transactions", "Pasabuy", "To Pay", "To Buy", "Installments"]);
  expect(within(view).queryByText("Unpaid CC")).not.toBeInTheDocument();
  expect(within(view).queryByText("Unpaid Pasabuy")).not.toBeInTheDocument();
});

it.each([
  ["Daily", "2026-07-15", "2026-07-15"],
  ["Weekly", "2026-07-13", "2026-07-19"],
  ["Monthly", "2026-07-01", "2026-07-31"],
  ["Annually", "2026-01-01", "2026-12-31"],
  ["All Records", undefined, undefined],
] as const)("Pasabuy %s applies purchase-date bounds", async (pasabuyPeriod, rangeStart, rangeEnd) => {
  const list = vi.fn(async () => ok([expenseRecord]));
  const changePeriod = vi.fn();
  renderPage(
    <ExpensePage viewMode="Pasabuy" pasabuyPeriod={pasabuyPeriod} onPasabuyPeriodChange={changePeriod}
      onViewModeChange={vi.fn()} selectedDate="2026-07-15" />,
    { apiOverrides: { expenses: { list } } },
  );
  await waitFor(() => expect(list).toHaveBeenCalledWith(expect.objectContaining({ expenseViewMode: "Pasabuy", rangeStart, rangeEnd })));
  fireEvent.click(screen.getByRole("button", { name: "Filters" }));
  const period = screen.getByRole("combobox", { name: "Pasabuy purchase period" });
  expect(period).toHaveValue(pasabuyPeriod);
  fireEvent.change(period, { target: { value: pasabuyPeriod === "Daily" ? "Weekly" : "Daily" } });
  expect(changePeriod).toHaveBeenCalled();
});

it("filters Pasabuy by the same status colors used to highlight rows", async () => {
  const pending = "Payment not yet receive" as const;
  const records = [
    { description: "Red expense", paymentStatus: "Unpaid" as const, pasabuyStatus: null },
    { description: "Blue expense", paymentStatus: "Paid" as const, pasabuyStatus: pending },
    { description: "Violet expense", paymentStatus: "Unpaid" as const, pasabuyStatus: pending },
    { description: "Yellow expense", paymentStatus: "Installment" as const, pasabuyStatus: pending },
  ].map((record) => ({ ...expenseRecord, ...record, id: record.description }));
  renderPage(<ExpensePage viewMode="Pasabuy" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, {
    apiOverrides: { expenses: { list: vi.fn(async () => ok(records)) } },
  });
  await screen.findByText("Yellow expense");
  fireEvent.click(screen.getByRole("button", { name: "Filters" }));
  const filter = screen.getByRole("option", { name: "All status colors" }).closest("select")!;
  for (const color of ["Red", "Blue", "Violet", "Yellow"]) {
    fireEvent.change(filter, { target: { value: color.toLowerCase() } });
    expect(screen.getByText(`${color} expense`)).toBeInTheDocument();
    expect(within(screen.getByRole("table")).getAllByText(/ expense$/)).toHaveLength(1);
  }
});

 it.each(["Paid", "Unpaid", "Cancelled"] as const)("CC description highlights only outstanding records: %s", async paymentStatus => {
  renderPage(<ExpensePage viewMode="CC Transaction" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, {
    apiOverrides: { expenses: { list: vi.fn(async () => ok([{ ...expenseRecord, paymentStatus }])) } },
  });
  const description = await screen.findByText("Grocery Run");
  if (paymentStatus === "Unpaid") expect(description).toHaveClass("expense-cell--unpaid");
  else expect(description).not.toHaveClass("expense-cell--unpaid");
});

it.each([["All Credit Accounts", "Credit purchase", "Cash purchase"], ["All Debit Accounts", "Cash purchase", "Credit purchase"]])("To Pay filters %s without sending a synthetic account ID", async (label, included, excluded) => {
  const list = vi.fn(async () => ok([
    { ...expenseRecord, id: "cash", description: "Cash purchase", paymentStatus: "Unpaid" as const },
    { ...expenseRecord, id: "credit", accountId: "cc1", description: "Credit purchase", paymentStatus: "Unpaid" as const },
  ]));
  renderPage(<ExpensePage viewMode="To pay" onViewModeChange={vi.fn()} selectedDate="2026-07-15" />, { apiOverrides: {
    accounts: { list: vi.fn(async () => ok([account, { ...account, id: "cc1", type: "Credit Account" as const }])) },
    expenses: { list },
  } });
  await screen.findByText("Cash purchase");
  fireEvent.click(screen.getByRole("button", { name: "Filters" }));
  fireEvent.click(screen.getByRole("combobox", { name: "All accounts" }));
  fireEvent.click(screen.getByRole("option", { name: label }));
  await waitFor(() => expect(screen.queryByText(excluded)).not.toBeInTheDocument());
  expect(screen.getByText(included)).toBeInTheDocument();
  expect(list).not.toHaveBeenCalledWith(expect.objectContaining({ accountId: expect.stringMatching(/^__/) }));
});
