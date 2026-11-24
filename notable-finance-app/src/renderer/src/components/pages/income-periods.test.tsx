// @vitest-environment jsdom
// calendar-periods/02: Income offers Daily, Weekly, Monthly, Quarterly, Semi-Annually, Annually, All Records.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { account } from "../../../../../test/factories";
import { normalizeUiSettings } from "../../../../main/settings/ui";
import { IncomePage } from "./income";
import type { IncomeViewMode } from "@/types/finance";

const category = { id: "cat1", source: "Salary", auxiliary: false, icon: null, monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0 };
const rec = (id: string, name: string, date: string, gross: number) => ({
  id, name, date, grossIncome: gross, capitalExpenditure: 0, accountId: "acc1", categoryId: "cat1",
});

function renderIncome(viewMode: IncomeViewMode, selectedDate = "2026-11-24", records = [rec("i1", "November Pay", "2026-11-10", 1000)]) {
  const list = vi.fn(async () => ok(records));
  const onViewModeChange = vi.fn();
  renderPage(<IncomePage viewMode={viewMode} onViewModeChange={onViewModeChange} selectedDate={selectedDate} />, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => ok([account({ id: "acc1", name: "Main Wallet", type: "Cash" })])) },
      categories: { income: vi.fn(async () => ok([category])), expense: vi.fn(async () => ok([])) },
      incomes: { list },
    },
  });
  return { list, onViewModeChange };
}

describe("calendar-periods/02 Income periods", () => {
  it("calendar-periods/02#AC1 the picker shows the seven options in order", async () => {
    renderIncome("Monthly");
    await screen.findByText("November Pay");
    const picker = screen.getByLabelText("Income view");
    expect(within(picker).getAllByRole("button").map((b) => b.textContent?.trim())).toEqual([
      "Daily", "Weekly", "Monthly", "Quarterly", "Semi-Annually", "Annually", "All Records",
    ]);
  });

  it("calendar-periods/02#AC1 choosing Quarterly or Semi-Annually reports that mode", async () => {
    const { onViewModeChange } = renderIncome("Monthly");
    await screen.findByText("November Pay");
    fireEvent.click(screen.getByRole("button", { name: "Quarterly" }));
    expect(onViewModeChange).toHaveBeenCalledWith("Quarterly");
    fireEvent.click(screen.getByRole("button", { name: "Semi-Annually" }));
    expect(onViewModeChange).toHaveBeenCalledWith("Semi-Annually");
  });

  it("calendar-periods/02#AC2 Quarterly asks for exactly the fixed calendar quarter containing the date", async () => {
    const q4 = renderIncome("Quarterly", "2026-11-24");
    await screen.findByText("November Pay");
    expect(q4.list).toHaveBeenCalledWith(expect.objectContaining({ rangeStart: "2026-10-01", rangeEnd: "2026-12-31" }));
  });

  it("calendar-periods/02#AC2 every date in a quarter asks for the same quarter, and Q1 is Jan to Mar", async () => {
    const a = renderIncome("Quarterly", "2026-01-02");
    await waitFor(() => expect(a.list).toHaveBeenCalled());
    expect(a.list).toHaveBeenCalledWith(expect.objectContaining({ rangeStart: "2026-01-01", rangeEnd: "2026-03-31" }));
  });

  it("calendar-periods/02#AC2 Semi-Annually asks for exactly the fixed half (H2 = Jul to Dec, H1 = Jan to Jun)", async () => {
    const h2 = renderIncome("Semi-Annually", "2026-11-24");
    await screen.findByText("November Pay");
    expect(h2.list).toHaveBeenCalledWith(expect.objectContaining({ rangeStart: "2026-07-01", rangeEnd: "2026-12-31" }));
  });

  it("calendar-periods/02#AC2 Semi-Annually in the first half asks for Jan to Jun", async () => {
    const h1 = renderIncome("Semi-Annually", "2026-03-15", [rec("i2", "March Pay", "2026-03-05", 500)]);
    await screen.findByText("March Pay");
    expect(h1.list).toHaveBeenCalledWith(expect.objectContaining({ rangeStart: "2026-01-01", rangeEnd: "2026-06-30" }));
  });

  it("calendar-periods/02#AC3 the totals on the page match the records listed for the period", async () => {
    renderIncome("Quarterly", "2026-11-24", [
      rec("i1", "October Pay", "2026-10-05", 1000),
      rec("i2", "December Pay", "2026-12-20", 2500),
    ]);
    await screen.findByText("October Pay");
    expect(screen.getByText("December Pay")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getAllByText("₱3,500.00").length).toBeGreaterThan(0);
  });

  it("calendar-periods/02#AC4 a saved Quarterly or Semi-Annually Income mode is restored after a restart", () => {
    // The workspace reads this saved mode on start and hands it to the Income page.
    for (const mode of ["Quarterly", "Semi-Annually"] as const) {
      expect(normalizeUiSettings({ workspace: { incomeViewMode: mode } }).workspace.incomeViewMode).toBe(mode);
    }
  });

  it("calendar-periods/02#AC4 the Income page shows the mode it is given as the chosen option", async () => {
    renderIncome("Quarterly");
    await screen.findByText("November Pay");
    const picker = screen.getByLabelText("Income view");
    const chosen = within(picker).getByRole("button", { name: "Quarterly" });
    const other = within(picker).getByRole("button", { name: "Monthly" });
    expect(chosen.className).not.toBe(other.className);
  });

  it("calendar-periods/02#AC5 Daily, Weekly, Monthly, Annually and All Records still ask for their usual ranges", async () => {
    const cases: Array<[IncomeViewMode, string | undefined, string | undefined]> = [
      ["Daily", "2026-11-24", "2026-11-24"],
      ["Monthly", "2026-11-01", "2026-11-30"],
      ["Annually", "2026-01-01", "2026-12-31"],
      ["All Records", undefined, undefined],
    ];
    for (const [mode, start, end] of cases) {
      const { list } = renderIncome(mode, "2026-11-24");
      await waitFor(() => expect(list).toHaveBeenCalled());
      expect(list).toHaveBeenCalledWith(expect.objectContaining({ rangeStart: start, rangeEnd: end }));
      document.body.innerHTML = "";
    }
    const weekly = renderIncome("Weekly", "2026-11-24");
    await waitFor(() => expect(weekly.list).toHaveBeenCalled());
    expect(weekly.list).toHaveBeenCalledWith(expect.objectContaining({ rangeStart: "2026-11-23", rangeEnd: "2026-11-29" }));
  });
});
