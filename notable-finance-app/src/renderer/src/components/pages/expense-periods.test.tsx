// @vitest-environment jsdom
// calendar-periods/03: Expense offers the seven periods and keeps its extra status views.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { ExpensePage } from "./expense";
import type { ExpenseViewMode } from "@/types/finance";

const record = {
  id: "exp1", description: "Grocery Run", purchaseDate: "2026-07-10", datePaid: null, amount: 3000, interest: 0,
  accountId: "acc1", categoryId: "cat1", paymentStatus: "Paid" as const, paymentFrequency: null, periodCount: null,
  bnplAdjustment: null, paidPeriod: null, pasabuyer: null, pasabuyStatus: null, pasabuyDateOfPayment: null,
  pasabuyPaidPeriod: null, pasabuyAccountReceiverId: null, pasabuyBalance: 0, ccLinkPaymentReceiptId: null,
};

function renderExpense(viewMode: ExpenseViewMode, selectedDate = "2026-11-15") {
  const list = vi.fn(async () => ok([record]));
  renderPage(<ExpensePage viewMode={viewMode} onViewModeChange={vi.fn()} selectedDate={selectedDate} />, {
    apiOverrides: { expenses: { list } },
  });
  return { list };
}

describe("calendar-periods/03 Expense periods", () => {
  it("calendar-periods/03#AC1 the picker shows the seven periods first, then the existing extra views, none lost", async () => {
    renderExpense("Monthly");
    const view = await screen.findByLabelText("Expense view");
    expect(within(view).getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Daily", "Weekly", "Monthly", "Quarterly", "Semi-Annually", "Annually", "All Records",
      "CC Transactions", "Pasabuy", "To Pay", "To Buy", "Installments",
    ]);
  });

  it("calendar-periods/03#AC2 Quarterly asks for the fixed calendar quarter containing the selected date", async () => {
    const { list } = renderExpense("Quarterly", "2026-11-15");
    await waitFor(() => expect(list).toHaveBeenCalledWith(expect.objectContaining({ rangeStart: "2026-10-01", rangeEnd: "2026-12-31" })));
  });

  it("calendar-periods/03#AC2 Quarterly in the first quarter covers Jan to Mar", async () => {
    const { list } = renderExpense("Quarterly", "2026-02-20");
    await waitFor(() => expect(list).toHaveBeenCalledWith(expect.objectContaining({ rangeStart: "2026-01-01", rangeEnd: "2026-03-31" })));
  });

  it("calendar-periods/03#AC2 Semi-Annually asks for H2 in November and H1 in March", async () => {
    const h2 = renderExpense("Semi-Annually", "2026-11-15");
    await waitFor(() => expect(h2.list).toHaveBeenCalledWith(expect.objectContaining({ rangeStart: "2026-07-01", rangeEnd: "2026-12-31" })));
  });

  it("calendar-periods/03#AC2 Semi-Annually in March covers H1, Jan to Jun", async () => {
    const h1 = renderExpense("Semi-Annually", "2026-03-10");
    await waitFor(() => expect(h1.list).toHaveBeenCalledWith(expect.objectContaining({ rangeStart: "2026-01-01", rangeEnd: "2026-06-30" })));
  });

  it("calendar-periods/03#AC2 a mode with no date limit (All Records) is unbounded", async () => {
    const { list } = renderExpense("All Records");
    await waitFor(() => expect(list).toHaveBeenCalledWith(expect.objectContaining({ rangeStart: undefined, rangeEnd: undefined })));
  });

  it("calendar-periods/03#AC3 the listed rows are the records the period returns and the footer total matches", async () => {
    renderExpense("Quarterly", "2026-07-15");
    expect(await screen.findByText("Grocery Run")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getAllByText("₱3,000.00").length).toBeGreaterThanOrEqual(2); // the row and the Total
  });

  it("calendar-periods/03#AC4 status views are not date-scoped, as before", async () => {
    for (const mode of ["To pay", "To buy", "Installments"] as const) {
      const { list } = renderExpense(mode, "2026-11-15");
      await waitFor(() => expect(list).toHaveBeenCalled());
      expect(list).toHaveBeenCalledWith(expect.objectContaining({ rangeStart: undefined, rangeEnd: undefined }));
    }
  });

  it("calendar-periods/03#AC4 the CC Transaction and Pasabuy sub-period lists offer all seven periods", async () => {
    const list = vi.fn(async () => ok([]));
    renderPage(<ExpensePage viewMode="CC Transaction" onViewModeChange={vi.fn()} selectedDate="2026-11-15" />, {
      apiOverrides: { expenses: { list } },
    });
    await waitFor(() => expect(list).toHaveBeenCalled());
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    const period = screen.getByRole("combobox", { name: "CC Transaction period" });
    expect(within(period).getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Daily", "Weekly", "Monthly", "Quarterly", "Semi-Annually", "Annually", "All Records",
    ]);
  });
});
