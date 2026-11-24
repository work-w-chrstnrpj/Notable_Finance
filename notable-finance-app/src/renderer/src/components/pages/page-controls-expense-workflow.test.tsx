// @vitest-environment jsdom
// page-controls/02: header icons that hide the period picker (and the view switches) on Expense and the workflow pages.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { DEFAULT_SETTINGS } from "@/lib/ui-settings-context";
import { ExpensePage } from "./expense";
import { WorkflowPage } from "./workflow";
import type { ExpenseViewMode, IncomeViewMode, WorkflowSectionId } from "@/types/finance";

afterEach(cleanup);

const account = { id: "acc1", name: "Main Wallet", type: "Cash" as const, icon: null, information: "", startingBalance: 0, currentBalance: 0, creditLimit: null, availableLimit: null, creditPoints: null, annualFee: null, paymentNetwork: null, cardNumbers: null, billingDay: null, dueDay: null, totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true };
const expense = {
  id: "exp1", description: "Grocery Run", purchaseDate: "2026-11-10", datePaid: null, amount: 3000, interest: 0,
  accountId: "acc1", categoryId: "cat1", paymentStatus: "Paid" as const, paymentFrequency: null, periodCount: null,
  bnplAdjustment: null, paidPeriod: null, pasabuyer: null, pasabuyStatus: null, pasabuyDateOfPayment: null,
  pasabuyPaidPeriod: null, pasabuyAccountReceiverId: null, pasabuyBalance: 0, ccLinkPaymentReceiptId: null,
};

type Controls = Record<string, { periodHidden?: boolean; viewsHidden?: boolean }>;
function settingsApi(pageControls: Controls) {
  const update = vi.fn(async (patch: object) => ok({ ...DEFAULT_SETTINGS, ...patch }));
  return { settings: { get: vi.fn(async () => ok({ ...DEFAULT_SETTINGS, pageControls: pageControls as typeof DEFAULT_SETTINGS.pageControls })), update }, update };
}

function renderExpense(viewMode: ExpenseViewMode, pageControls: Controls = {}, selectedDate = "2026-11-15") {
  const list = vi.fn(async () => ok([expense]));
  const s = settingsApi(pageControls);
  renderPage(<ExpensePage viewMode={viewMode} onViewModeChange={vi.fn()} selectedDate={selectedDate} />, {
    apiOverrides: { expenses: { list }, settings: s.settings },
  });
  return { list, update: s.update };
}

const SECTIONS: WorkflowSectionId[] = ["transfer", "credit-card-payment", "alkansya", "borrowings", "receivables"];
function renderWorkflow(section: WorkflowSectionId, viewMode: IncomeViewMode = "Quarterly", pageControls: Controls = {}) {
  const list = vi.fn(async () => ok([]));
  const s = settingsApi(pageControls);
  renderPage(
    <WorkflowPage section={section} selectedMonth="2026-11" selectedDate="2026-11-15" viewMode={viewMode} onViewModeChange={vi.fn()} />,
    {
      apiOverrides: {
        accounts: { list: vi.fn(async () => ok([account])) },
        categories: { income: vi.fn(async () => ok([])), expense: vi.fn(async () => ok([])) },
        incomes: { list },
        expenses: { list: vi.fn(async () => ok([])), listForCCCoverage: vi.fn(async () => ok([])) },
        settings: s.settings,
      },
    },
  );
  return { list, update: s.update };
}

const expensePicker = () => screen.queryByLabelText("Expense view");
const workflowPicker = () => document.querySelector('[aria-label$=" view"]') as HTMLElement | null;
const headerNames = (title: string) => {
  const header = screen.getByRole("heading", { name: new RegExp(title) }).closest("div")!.parentElement as HTMLElement;
  return within(header).getAllByRole("button").map((b) => b.getAttribute("aria-label") ?? (b.textContent ?? "").replace(/New .*/, "New").trim());
};

describe("page-controls/02 Expense", () => {
  it("page-controls/02#AC1 the period icon sits before the filter icon and hides and shows the picker bar", async () => {
    renderExpense("Monthly");
    await screen.findByText("Grocery Run");
    expect(headerNames("Expense").slice(0, 4)).toEqual(["Hide period picker", "Filters", "Search", "New"]);
    expect(expensePicker()).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Hide period picker" }));
    await waitFor(() => expect(expensePicker()).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Show period picker" }));
    await waitFor(() => expect(expensePicker()).not.toBeNull());
  });

  it("page-controls/02#AC2 hiding the bar hides the extra status views with it, and the chosen period stays in effect", async () => {
    const { list } = renderExpense("Quarterly");
    await screen.findByText("Grocery Run");
    expect(within(expensePicker()!).getByRole("button", { name: "Pasabuy" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hide period picker" }));
    await waitFor(() => expect(expensePicker()).toBeNull());
    expect(screen.queryByRole("button", { name: "Pasabuy" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Installments" })).toBeNull();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ rangeStart: "2026-10-01", rangeEnd: "2026-12-31" }));
    expect(screen.getByText("Grocery Run")).toBeInTheDocument();
  });

  it("page-controls/02#AC3 the views icon appears only on Annually, and hides the Annual Table | Chart switch", async () => {
    renderExpense("Monthly");
    await screen.findByText("Grocery Run");
    expect(screen.queryByRole("button", { name: /view switches/ })).toBeNull();
    cleanup();
    renderExpense("Annually");
    await screen.findByText("Grocery Run");
    expect(headerNames("Expense").slice(0, 5)).toEqual(["Hide period picker", "Hide view switches", "Filters", "Search", "New"]);
    expect(screen.queryByLabelText("Annual display")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Hide view switches" }));
    await waitFor(() => expect(screen.queryByLabelText("Annual display")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Show view switches" }));
    await waitFor(() => expect(screen.queryByLabelText("Annual display")).not.toBeNull());
  });

  it("page-controls/02#AC4 the header order is Period, Views, Filters, Search, New on Expense", async () => {
    renderExpense("Annually");
    await screen.findByText("Grocery Run");
    expect(headerNames("Expense").slice(0, 5)).toEqual(["Hide period picker", "Hide view switches", "Filters", "Search", "New"]);
  });

  it("page-controls/02#AC5 Expense saves its own hidden state and restores it, and starts with everything shown", async () => {
    const first = renderExpense("Monthly");
    await screen.findByText("Grocery Run");
    fireEvent.click(screen.getByRole("button", { name: "Hide period picker" }));
    await waitFor(() => expect(first.update).toHaveBeenCalledWith({ pageControls: { expense: { periodHidden: true } } }));
    cleanup();
    renderExpense("Monthly", { expense: { periodHidden: true, viewsHidden: false } });
    await screen.findByText("Grocery Run");
    expect(expensePicker()).toBeNull();
    expect(screen.getByRole("button", { name: "Show period picker" })).toBeInTheDocument();
  });
});

describe("page-controls/02 workflow pages", () => {
  for (const section of SECTIONS) {
    it(`page-controls/02#AC1 ${section} puts the period icon before the filter icon and hides and shows its picker bar`, async () => {
      renderWorkflow(section);
      await waitFor(() => expect(workflowPicker()).not.toBeNull());
      const header = screen.getByRole("heading", { level: 2 }).closest("div")!.parentElement as HTMLElement;
      const names = within(header).getAllByRole("button").map((b) => b.getAttribute("aria-label") ?? (b.textContent ?? "").trim());
      expect(names.slice(0, 3)).toEqual(["Hide period picker", "Filters", "Search"]);
      fireEvent.click(screen.getByRole("button", { name: "Hide period picker" }));
      await waitFor(() => expect(workflowPicker()).toBeNull());
      fireEvent.click(screen.getByRole("button", { name: "Show period picker" }));
      await waitFor(() => expect(workflowPicker()).not.toBeNull());
    });

    it(`page-controls/02#AC3 ${section} has no view switch, so it shows no views icon`, async () => {
      renderWorkflow(section);
      await waitFor(() => expect(workflowPicker()).not.toBeNull());
      expect(screen.queryByRole("button", { name: /view switches/ })).toBeNull();
    });

    it(`page-controls/02#AC2 ${section} keeps listing the chosen period while its picker is hidden`, async () => {
      const { list } = renderWorkflow(section, "Quarterly", { [section]: { periodHidden: true } });
      await waitFor(() => expect(list).toHaveBeenCalled());
      expect(workflowPicker()).toBeNull();
      expect(list).toHaveBeenCalledWith(expect.objectContaining({ rangeStart: "2026-10-01", rangeEnd: "2026-12-31" }));
    });

    it(`page-controls/02#AC5 ${section} saves its own hidden state under its own id`, async () => {
      const { update } = renderWorkflow(section);
      await waitFor(() => expect(workflowPicker()).not.toBeNull());
      fireEvent.click(screen.getByRole("button", { name: "Hide period picker" }));
      await waitFor(() => expect(update).toHaveBeenCalledWith({ pageControls: { [section]: { periodHidden: true } } }));
    });
  }

  it("page-controls/02#AC5 one page's hidden state does not hide another page's picker", async () => {
    renderWorkflow("alkansya", "Monthly", { transfer: { periodHidden: true } });
    await waitFor(() => expect(workflowPicker()).not.toBeNull());
  });
});
