// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { WorkflowPage } from "./workflow";
import type { ExpenseRecord, WorkflowSectionId } from "@/types/finance";
import { useFabExport } from '@/lib/fab-export-context';

const sourceAccount = { id: "acc1", name: "Main Wallet", type: "Cash" as const, icon: null, information: "", startingBalance: 0, currentBalance: 0, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true };
const destAccount = { ...sourceAccount, id: "acc2", name: "Savings Jar" };
const category = { id: "cat1", source: "Transfer", auxiliary: true, icon: null, monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0 };
const pasabuyExpenseCategory = { id: "pasabuy", name: "Pasabuy", auxiliary: true, icon: null, monthlyBudget: 0, upcomingBudget: 0, spending: 0, remaining: 0, overview: "", totalOverview: 0 };
const pasabuyExpense = {
  id: "exp1", description: "Groceries for Ana", purchaseDate: "2026-07-09", datePaid: "2026-07-11",
  amount: 1000, interest: 0, accountId: "acc1", categoryId: "pasabuy", paymentStatus: "Paid" as const,
  paymentFrequency: null, periodCount: null, bnplAdjustment: null, paidPeriod: null, pasabuyer: "Ana",
  pasabuyStatus: "Payment partially received" as const, pasabuyDateOfPayment: "2026-07-12",
  pasabuyPaidPeriod: null, pasabuyAccountReceiverId: null, pasabuyBalance: 600, ccLinkPaymentReceiptId: null,
};
const workflowRecord = {
  id: "wf1",
  name: "Weekly Transfer",
  date: "2026-07-10",
  grossIncome: 1000,
  capitalExpenditure: 0,
  accountId: "acc1",
  categoryId: "cat1",
  transactedAccountId: "acc2"
};

function renderWorkflow(section: WorkflowSectionId) {
  return renderPage(<WorkflowPage section={section} selectedMonth="2026-07" />, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => (ok([sourceAccount, destAccount]))) },
      categories: {
        income: vi.fn(async () => (ok([category]))),
        expense: vi.fn(async () => (ok([pasabuyExpenseCategory])))
      },
      incomes: { list: vi.fn(async () => (ok([workflowRecord]))) },
      expenses: { list: vi.fn(async () => ok([
        pasabuyExpense,
        { ...pasabuyExpense, id: "exp-unpaid", description: "Not yet paid", paymentStatus: "Unpaid", datePaid: null },
        { ...pasabuyExpense, id: "exp-complete", description: "Fully received", pasabuyStatus: "Payment fully received" },
        { ...pasabuyExpense, id: "exp-wrong-category", description: "Other category", categoryId: "cat-other" },
      ] as ExpenseRecord[])), listForCCCoverage: vi.fn(async () => (ok([]))) }
    }
  });
}

const HEADERS_BY_SECTION: Record<WorkflowSectionId, string[]> = {
  transfer: ["Date", "Name", "Source Account", "Amount", "Transfer Account", "Transferred Amount"],
  "credit-card-payment": ["Date", "Name", "CC Account", "Amount", "Payer Account"],
  alkansya: ["Name", "Date", "Accounts", "Category", "Amount"],
  receivables: ["Name", "Date", "Account", "Category", "Amount"]
};

describe("WorkflowPage", () => {
  for (const [section, headers] of Object.entries(HEADERS_BY_SECTION) as Array<[WorkflowSectionId, string[]]>) {
    it(`renders the ${section} section with its own headers and the seeded record`, async () => {
      renderWorkflow(section);

      expect(await screen.findByText("Weekly Transfer")).toBeInTheDocument();

      const table = screen.getByRole("table");
      for (const header of headers) {
        expect(within(table).getByText(header)).toBeInTheDocument();
      }
    });
  }

  it.each(["credit-card-payment", "alkansya", "receivables"] as const)(
    "shows a Total Amount footer on %s",
    async (section) => {
      const { unmount } = renderWorkflow(section);
      const table = await screen.findByRole("table");
      const footer = table.querySelector("tfoot");
      expect(footer).not.toBeNull();
      expect(within(footer as HTMLElement).getByText("Total")).toBeInTheDocument();
      unmount();
    },
  );

  it("does not show a Total Amount footer on transfer", async () => {
    renderWorkflow("transfer");
    const table = await screen.findByRole("table");
    expect(table.querySelector("tfoot")).toBeNull();
  });

  it("includes eligible Pasabuy expenses in Receivables and opens Pasabuy-only details", async () => {
    renderWorkflow("receivables");
    expect(await screen.findByText("Groceries for Ana")).toBeInTheDocument();
    expect(screen.queryByText("Not yet paid")).not.toBeInTheDocument();
    expect(screen.queryByText("Fully received")).not.toBeInTheDocument();
    expect(screen.queryByText("Other category")).not.toBeInTheDocument();
    expect(screen.getByText("Pasabuy · Expense")).toBeInTheDocument();
    expect(screen.getByText("₱600.00")).toBeInTheDocument();
    const originalHash = window.location.hash;
    fireEvent.click(screen.getByText("Groceries for Ana"));
    const dialog = screen.getByRole('dialog', { name: 'Pasabuy receivable' });
    expect(within(dialog).getByLabelText(/^Purchase description/)).toHaveValue('Groceries for Ana');
    expect(within(dialog).getByLabelText('Pasabuy Status')).toBeInTheDocument();
    expect(within(dialog).queryByLabelText('Expense Amount')).not.toBeInTheDocument();
    expect(window.location.hash).toBe(originalHash);
  });

  it.each(["alkansya", "receivables"] as const)("scopes %s to the selected weekly period", async (section) => {
    const list = vi.fn(async () => ok([workflowRecord]));
    renderPage(
      <WorkflowPage
        section={section}
        selectedMonth="2026-07"
        selectedDate="2026-07-11"
        viewMode="Weekly"
        onViewModeChange={vi.fn()}
      />,
      { apiOverrides: {
        accounts: { list: vi.fn(async () => ok([sourceAccount, destAccount])) },
        categories: { income: vi.fn(async () => ok([category])), expense: vi.fn(async () => ok([pasabuyExpenseCategory])) },
        incomes: { list },
        expenses: { list: vi.fn(async () => ok([pasabuyExpense])), listForCCCoverage: vi.fn(async () => ok([])) },
      } },
    );
    await screen.findByText(section === "receivables" ? "Groceries for Ana" : "Weekly Transfer");
    expect(list).toHaveBeenCalledWith(expect.objectContaining({
      view: section === "alkansya" ? "alkansya" : "receivables",
      rangeStart: "2026-07-06",
      rangeEnd: "2026-07-12",
    }));
    expect(screen.getByRole("button", { name: "Daily" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Weekly" })).toBeInTheDocument();
  });

  it.each(["alkansya", "receivables"] as const)("loads all available %s records in All Records view", async (section) => {
    const list = vi.fn(async () => ok([workflowRecord]));
    renderPage(
      <WorkflowPage section={section} selectedMonth="2026-07" selectedDate="2026-07-11" viewMode="All Records" onViewModeChange={vi.fn()} />,
      { apiOverrides: {
        accounts: { list: vi.fn(async () => ok([sourceAccount, destAccount])) },
        categories: { income: vi.fn(async () => ok([category])), expense: vi.fn(async () => ok([pasabuyExpenseCategory])) },
        incomes: { list },
        expenses: { list: vi.fn(async () => ok([pasabuyExpense])), listForCCCoverage: vi.fn(async () => ok([])) },
      } },
    );
    await screen.findByText("Weekly Transfer");
    expect(list).toHaveBeenCalledWith(expect.objectContaining({ rangeStart: undefined, rangeEnd: undefined }));
  });
});


describe("Workflow filters and fixed Savings", () => {
  const other = { ...workflowRecord, id: "wf2", name: "Zebra reserve", accountId: "acc2", transactedAccountId: null, grossIncome: 200 };
  for (const section of ["alkansya", "transfer", "credit-card-payment", "receivables"] as WorkflowSectionId[]) {
    it(`combines account filtering and search on ${section} and restores records when controls close`, async () => {
      renderPage(<WorkflowPage section={section} selectedMonth="2026-07" />, { apiOverrides: {
        accounts: { list: vi.fn(async () => ok([sourceAccount, destAccount])) },
        categories: { income: vi.fn(async () => ok([category])), expense: vi.fn(async () => ok([])) },
        incomes: { list: vi.fn(async () => ok([workflowRecord, other])) },
        expenses: { listForCCCoverage: vi.fn(async () => ok([])) },
      } });
      expect(await screen.findByText("Zebra reserve")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Filters" }));
      fireEvent.click(screen.getByRole("button", { name: "All Accounts" }));
      fireEvent.click(screen.getByRole("button", { name: "Main Wallet" }));
      expect(screen.queryByText("Zebra reserve")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      fireEvent.change(screen.getByPlaceholderText(/^Search /), { target: { value: "Zebra reserve" } });
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.getByText("No matching records")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Close filters" }));
      expect(screen.getByText("Zebra reserve")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Close search" }));
      expect(screen.getByText("Weekly Transfer")).toBeInTheDocument();
      expect(screen.getByText("Zebra reserve")).toBeInTheDocument();
    });
  }

  it.each(["transfer", "credit-card-payment"] as const)("matches the destination/payer account on %s", async (section) => {
    renderWorkflow(section);
    await screen.findByText("Weekly Transfer");
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    fireEvent.click(screen.getByRole("button", { name: "All Accounts" }));
    fireEvent.click(screen.getByRole("button", { name: "Savings Jar" }));
    expect(screen.getByText("Weekly Transfer")).toBeInTheDocument();
  });

  it("allows filtering Receivables with no receiving account", async () => {
    renderWorkflow("receivables");
    await screen.findByText("Weekly Transfer");
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    fireEvent.click(screen.getByRole("button", { name: "All Accounts" }));
    fireEvent.click(screen.getByRole("button", { name: "No Account" }));
    expect(screen.queryByText("Weekly Transfer")).not.toBeInTheDocument();
  });

  it("logs Alkansya with read-only Savings and no category override", async () => {
    const create = vi.fn(async (_input: unknown) => ok(workflowRecord));
    renderPage(<WorkflowPage section="alkansya" selectedMonth="2026-07" />, { apiOverrides: {
      accounts: { list: vi.fn(async () => ok([sourceAccount])) },
      categories: { income: vi.fn(async () => ok([category, { ...category, id: "savings", source: "Savings" }])), expense: vi.fn(async () => ok([])) },
      incomes: { list: vi.fn(async () => ok([workflowRecord])), create },
      expenses: { listForCCCoverage: vi.fn(async () => ok([])) },
    } });
    await screen.findByText("Weekly Transfer");
    fireEvent.click(screen.getByRole("button", { name: /New Record/ }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Savings")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Savings" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Transfer" })).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByPlaceholderText("Alkansya title"), { target: { value: "Reserve" } });
    fireEvent.change(dialog.querySelector('input[type="date"]')!, { target: { value: "2026-07-15" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Accounts" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Main Wallet" }));
    fireEvent.click(within(dialog).getByRole("button", { name: /^Save/ }));
    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][0]).toMatchObject({ view: "alkansya", accountId: "acc1" });
    expect(create.mock.calls[0][0]).not.toHaveProperty("categoryId");
  });
});

function ReceiptProbe() {
  const { receipt } = useFabExport();
  return <output data-testid="receipt-data">{JSON.stringify(receipt)}</output>;
}

describe('Money Lent', () => {
  const loanCategory = { ...category, id: 'loan-cat', source: 'Money Lent' };
  const loan = { ...workflowRecord, id: 'loan1', name: 'Ana loan', categoryId: loanCategory.id, grossIncome: -1000, transactedAccountId: null };
  function renderLoans(options: Parameters<typeof renderPage>[1] = {}) {
    return renderPage(<><WorkflowPage section="receivables" selectedMonth="2026-07" /><ReceiptProbe /></>, { apiOverrides: {
      accounts: { list: vi.fn(async () => ok([sourceAccount, destAccount])) },
      categories: { income: vi.fn(async () => ok([category, loanCategory, { ...category, id: 'salary-cat', source: 'Salary', auxiliary: false }])), expense: vi.fn(async () => ok([])) },
      incomes: { list: vi.fn(async () => ok([loan])), ...options.apiOverrides?.incomes },
      settings: options.apiOverrides?.settings,
    } });
  }

  it('displays a positive loan row and total without changing the stored amount', async () => {
    renderLoans();
    await screen.findByText('Ana loan');
    const table = screen.getByRole('table');
    expect(within(table).getAllByText('₱1,000.00')).toHaveLength(2);
    expect(within(table).queryByText('-₱1,000.00')).not.toBeInTheDocument();
    await waitFor(() => expect(JSON.parse(screen.getByTestId('receipt-data').textContent!)).toMatchObject({
      total: '₱1,000.00', rows: [expect.objectContaining({ amount: '₱1,000.00', description: 'Ana loan' })],
    }));
  });

  it('creates a loan from a positive amount using the locked category and signed persistence', async () => {
    const create = vi.fn(async (_input: unknown) => ok(loan));
    renderLoans({ apiOverrides: { incomes: { create } } });
    await screen.findByText('Ana loan');
    fireEvent.click(screen.getByRole('button', { name: 'Lend money' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByPlaceholderText('Money Lent title'), { target: { value: 'Ben loan' } });
    fireEvent.change(dialog.querySelector('input[type="date"]')!, { target: { value: '2026-07-15' } });
    fireEvent.change(within(dialog).getByPlaceholderText('0.00'), { target: { value: '1000' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Source Account' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Main Wallet' }));
    expect(within(dialog).queryByText('Capital Expenditure')).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: /^Save/ }));
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({
      view: 'moneyLent', grossIncome: -1000, accountId: 'acc1', categoryId: 'loan-cat', capitalExpenditure: 0,
    })));
  });

  it('offers auxiliary Money Lent in the normal Receivables category picker and switches to lending fields', async () => {
    const create = vi.fn(async (_input: unknown) => ok(loan));
    renderLoans({ apiOverrides: { incomes: { create } } });
    await screen.findByText('Ana loan');
    fireEvent.click(screen.getByRole('button', { name: /New Record/ }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Categories' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Money Lent' }));
    expect(within(dialog).getByText('Amount lent')).toBeInTheDocument();
    expect(within(dialog).queryByText('Capital Expenditure')).not.toBeInTheDocument();
    fireEvent.change(within(dialog).getByPlaceholderText('Money Lent title'), { target: { value: 'New category loan' } });
    fireEvent.change(dialog.querySelector('input[type="date"]')!, { target: { value: '2026-07-15' } });
    fireEvent.change(within(dialog).getByPlaceholderText('0.00'), { target: { value: '1000' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Source Account' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Main Wallet' }));
    fireEvent.click(within(dialog).getByRole('button', { name: /^Save/ }));
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({
      categoryId: 'loan-cat', view: 'moneyLent', grossIncome: -1000, accountId: 'acc1', capitalExpenditure: 0,
    })));
  });

  it('lets a new Receivables draft switch between Money Lent and a normal category', async () => {
    renderLoans();
    await screen.findByText('Ana loan');
    fireEvent.click(screen.getByRole('button', { name: /New Record/ }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Categories' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Money Lent' }));
    expect(within(dialog).getByText('Amount lent')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Categories' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salary' }));
    expect(within(dialog).getByText('Capital Expenditure')).toBeInTheDocument();
    expect(within(dialog).queryByText('Amount lent')).not.toBeInTheDocument();
  });

  it('switches back from Transfer to same-account repayment without using the old destination', async () => {
    const repayMoneyLent = vi.fn(async (_id: string, _input: unknown) => ok(loan));
    renderLoans({ apiOverrides: { incomes: { repayMoneyLent } } });
    fireEvent.click(await screen.findByText('Ana loan'));
    fireEvent.click(screen.getByRole('button', { name: 'Record repayment' }));
    const dialog = screen.getByRole('dialog', { name: 'Record full repayment' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Transfer to another account' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Transfer Account' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Savings Jar' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Same account' }));
    expect(within(dialog).queryByRole('button', { name: 'Transfer Account' })).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm full repayment' }));
    await waitFor(() => expect(repayMoneyLent).toHaveBeenCalledWith('loan1', expect.objectContaining({ receivingAccountId: 'acc1' })));
  });

  it.each(['acc1', 'acc2'])('previews full repayment into %s and uses the settlement endpoint', async (account) => {
    const repayMoneyLent = vi.fn(async (_id: string, _input: unknown) => ok({ ...loan, deleted: account === 'acc1' }));
    renderLoans({ apiOverrides: { incomes: { repayMoneyLent } } });
    fireEvent.click(await screen.findByText('Ana loan'));
    fireEvent.click(screen.getByRole('button', { name: 'Record repayment' }));
    const dialog = screen.getByRole('dialog', { name: 'Record full repayment' });
    if (account === 'acc2') {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Transfer to another account' }));
      expect(within(dialog).getByRole('button', { name: 'Convert to Transfer' })).toBeDisabled();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Transfer Account' }));
      expect(within(dialog).queryByRole('button', { name: 'Main Wallet' })).not.toBeInTheDocument();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Savings Jar' }));
      expect(within(dialog).getByText(/Convert this loan to a Transfer from Main Wallet to Savings Jar/)).toBeInTheDocument();
    } else {
      expect(within(dialog).getByText(/Soft-delete this loan and restore/)).toBeInTheDocument();
    }
    fireEvent.click(within(dialog).getByRole('button', { name: account === 'acc2' ? 'Convert to Transfer' : 'Confirm full repayment' }));
    await waitFor(() => expect(repayMoneyLent).toHaveBeenCalledWith('loan1', expect.objectContaining({
      receivingAccountId: account, expectedAmount: 1000, expectedSourceAccountId: 'acc1',
    })));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('cancels repayment without changing the loan', async () => {
    const { api } = renderLoans();
    fireEvent.click(await screen.findByText('Ana loan'));
    fireEvent.click(screen.getByRole('button', { name: 'Record repayment' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(api.incomes.repayMoneyLent).not.toHaveBeenCalled();
    expect(screen.getByText('Ana loan')).toBeInTheDocument();
  });

  it('shows settlement errors and lets the user retry without losing the preview', async () => {
    const repayMoneyLent = vi.fn(async () => ({ ok: false as const, error: { code: 'E_VALIDATION', message: 'The loan changed.' } }));
    renderLoans({ apiOverrides: { incomes: { repayMoneyLent } } });
    fireEvent.click(await screen.findByText('Ana loan'));
    fireEvent.click(screen.getByRole('button', { name: 'Record repayment' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm full repayment' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The loan changed.');
    expect(screen.getByRole('dialog', { name: 'Record full repayment' })).toBeInTheDocument();
  });
});
