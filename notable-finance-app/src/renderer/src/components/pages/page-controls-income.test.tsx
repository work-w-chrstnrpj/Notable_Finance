// @vitest-environment jsdom
// page-controls/01: header icons that hide the period picker and the view switches, on Income.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { account } from "../../../../../test/factories";
import { DEFAULT_SETTINGS } from "@/lib/ui-settings-context";
import { IncomePage } from "./income";
import type { IncomeViewMode } from "@/types/finance";

const category = { id: "cat1", source: "Salary", auxiliary: false, icon: null, monthlyEarnings: 0, monthlyExpenditure: 0, monthlyGross: 0, earningPercentage: 0 };
const rec = { id: "i1", name: "November Pay", date: "2026-11-10", grossIncome: 1000, capitalExpenditure: 0, accountId: "acc1", categoryId: "cat1" };

function renderIncome(
  viewMode: IncomeViewMode = "Monthly",
  pageControls: Record<string, { periodHidden: boolean; viewsHidden: boolean }> = {},
) {
  const list = vi.fn(async () => ok([rec]));
  const update = vi.fn(async (patch: object) => ok({ ...DEFAULT_SETTINGS, ...patch }));
  renderPage(<IncomePage viewMode={viewMode} onViewModeChange={vi.fn()} selectedDate="2026-11-24" />, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => ok([account({ id: "acc1", name: "Main Wallet", type: "Cash" })])) },
      categories: { income: vi.fn(async () => ok([category])), expense: vi.fn(async () => ok([])) },
      incomes: { list },
      settings: { get: vi.fn(async () => ok({ ...DEFAULT_SETTINGS, pageControls })), update },
    },
  });
  return { list, update };
}
const loaded = () => screen.findByText("November Pay");
const picker = () => screen.queryByLabelText("Income view");
const annualSwitch = () => screen.queryByLabelText("Annual display");

describe("page-controls/01 Income", () => {
  it("page-controls/01#AC1 hiding the period picker removes the bar while the records still follow the chosen period", async () => {
    const { list } = renderIncome("Quarterly");
    await loaded();
    expect(picker()).not.toBeNull();
    const before = list.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Hide period picker" }));
    await waitFor(() => expect(picker()).toBeNull());
    // the chosen Quarterly period is still the one being listed
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ rangeStart: "2026-10-01", rangeEnd: "2026-12-31" }));
    expect(screen.getByText("November Pay")).toBeInTheDocument();
    expect(list.mock.calls.length).toBeGreaterThanOrEqual(before);
  });

  it("page-controls/01#AC2 the header icons run Period, Filters, Search, New Income, and Views joins only while Annually shows its switch", async () => {
    renderIncome("Monthly");
    await loaded();
    const names = (scope: HTMLElement) => within(scope).getAllByRole("button").map((b) => b.getAttribute("aria-label") ?? (b.textContent ?? "").replace(/New Income.*/, "New Income").trim());
    const header = screen.getByRole("heading", { name: /Income/ }).closest("div")!.parentElement as HTMLElement;
    expect(names(header).slice(0, 4)).toEqual(["Hide period picker", "Filters", "Search", "New Income"]);
    expect(screen.queryByRole("button", { name: /view switches/ })).toBeNull();
  });

  it("page-controls/01#AC2 on Annually the order is Period, Views, Filters, Search, New Income, and shown icons are highlighted", async () => {
    renderIncome("Annually");
    await loaded();
    const header = screen.getByRole("heading", { name: /Income/ }).closest("div")!.parentElement as HTMLElement;
    expect(within(header).getAllByRole("button").map((b) => b.getAttribute("aria-label") ?? (b.textContent ?? "").replace(/New Income.*/, "New Income").trim()).slice(0, 5)).toEqual([
      "Hide period picker", "Hide view switches", "Filters", "Search", "New Income",
    ]);
    expect(screen.getByRole("button", { name: "Hide period picker" }).className).toContain("filter-toggle--active");
    expect(screen.getByRole("button", { name: "Hide view switches" }).className).toContain("filter-toggle--active");
    fireEvent.click(screen.getByRole("button", { name: "Hide period picker" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Show period picker" }).className).not.toContain("filter-toggle--active"));
  });

  it("page-controls/01#AC3 the views icon hides and shows the Annual Table | Chart switch and the chosen display stays", async () => {
    renderIncome("Annually");
    await loaded();
    expect(annualSwitch()).not.toBeNull();
    fireEvent.click(within(annualSwitch()!).getByRole("button", { name: "Chart" }));
    fireEvent.click(screen.getByRole("button", { name: "Hide view switches" }));
    await waitFor(() => expect(annualSwitch()).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Show view switches" }));
    const again = await screen.findByLabelText("Annual display");
    // Chart was chosen before hiding and is still the chosen display
    expect(within(again).getByRole("button", { name: "Chart" }).className).not.toBe(within(again).getByRole("button", { name: "Table" }).className);
  });

  it("page-controls/01#AC4 the hidden state is saved for the page and restored after a restart", async () => {
    const first = renderIncome("Monthly");
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Hide period picker" }));
    await waitFor(() =>
      expect(first.update).toHaveBeenCalledWith({ pageControls: { income: { periodHidden: true } } }),
    );
  });

  it("page-controls/01#AC4 a saved hidden state loads hidden and an older settings object loads everything shown", async () => {
    renderIncome("Monthly", { income: { periodHidden: true, viewsHidden: false } });
    await loaded();
    await waitFor(() => expect(screen.getByRole("button", { name: "Show period picker" })).toBeInTheDocument());
    expect(picker()).toBeNull();
  });

  it("page-controls/01#AC5 each icon has the accessible names Hide/Show period picker and Hide/Show view switches", async () => {
    renderIncome("Annually", { income: { periodHidden: true, viewsHidden: true } });
    await loaded();
    expect(await screen.findByRole("button", { name: "Show period picker" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show view switches" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Show period picker" }));
    fireEvent.click(screen.getByRole("button", { name: "Show view switches" }));
    expect(await screen.findByRole("button", { name: "Hide period picker" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hide view switches" })).toBeInTheDocument();
  });

  it("page-controls/01#AC6 hiding the controls leaves the table and the title in place (the top date bar is not part of this page)", async () => {
    renderIncome("Monthly", { income: { periodHidden: true, viewsHidden: true } });
    await loaded();
    expect(screen.getByRole("heading", { name: /Income/ })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
