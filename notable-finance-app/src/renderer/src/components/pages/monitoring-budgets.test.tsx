// @vitest-environment jsdom
// Saved budgets on the Monitoring screen (tickets monthly-budget/03). Drives the page and the
// Edit / Save modals through the preload bridge mock, the same way the other page tests do.
import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { DEFAULT_SETTINGS } from "@/lib/ui-settings-context";
import { MonthlyMonitoringPage } from "./monitoring";
import { SavedBudgetsSettings } from "./monitoring-budgets";
import type { SavedBudgetRow } from "@shared/saved-budgets";

const food = { id: "food", name: "Food", auxiliary: false, icon: null, monthlyBudget: 8000 };
const transport = { id: "transport", name: "Transport", auxiliary: false, icon: null, monthlyBudget: 2000 };
const aux = { id: "aux", name: "Transfer", auxiliary: true, icon: null, monthlyBudget: 0 };

function savedRow(month: string, categoryId: string, budget: number, categoryName = categoryId): SavedBudgetRow {
  return { id: `${month}-${categoryId}`, month, categoryId, categoryName, budget, createdAt: 1, updatedAt: 1 };
}

const expense = (id: string, categoryId: string, amount: number, purchaseDate = "2026-01-10") => ({
  id, description: id, purchaseDate, datePaid: purchaseDate, amount, interest: 0, accountId: "a", categoryId,
  paymentStatus: "Paid", paymentFrequency: "Monthly", periodCount: 1, bnplAdjustment: null, paidPeriod: 1,
  pasabuyer: "", pasabuyStatus: null, pasabuyDateOfPayment: null, pasabuyPaidPeriod: 0, pasabuyAccountReceiverId: null,
  pasabuyBalance: 0, ccLinkPaymentReceiptId: null,
});

type Mode = "Monthly" | "Quarterly" | "Semi-Annually" | "Annually";
function renderMonitoring({ mode = "Monthly" as Mode, source = "default", rows = [] as SavedBudgetRow[], selectedDate = "2026-01-15" } = {}) {
  const update = vi.fn(async (patch: object) => ok({ ...DEFAULT_SETTINGS, monitoringBudgetSource: source, ...patch }));
  const list = vi.fn(async () => ok(rows));
  const expensesList = vi.fn(async (_params?: unknown) => ok([expense("lunch", "food", 1000), expense("bus", "transport", 300)]));
  const utils = renderPage(<MonthlyMonitoringPage viewMode={mode} onViewModeChange={vi.fn()} selectedDate={selectedDate} />, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => ok([])) },
      categories: { income: vi.fn(async () => ok([])), expense: vi.fn(async () => ok([food, transport, aux])), pasabuyers: vi.fn(async () => ok([])) },
      incomes: { list: vi.fn(async () => ok([])) },
      expenses: { list: expensesList },
      settings: {
        get: vi.fn(async () => ok({ ...DEFAULT_SETTINGS, monitoringBudgetSource: source })),
        update,
      },
      budgets: {
        list,
        // A saved Custom monthly budget database ID, so the Custom option is enabled.
        mirrorStatus: vi.fn(async () =>
          ok({ databaseId: "db-1", databaseMissing: false, missingColumns: [], lastRunAt: null, lastError: null }),
        ),
      },
    } as never,
  });
  return { ...utils, update, list, expensesList };
}

/** The Budget panel's table row for a category. */
async function budgetRow(name: string) {
  return await screen.findByRole("row", { name: new RegExp(`^${name}\\b`) });
}

afterEach(() => vi.restoreAllMocks());

describe("Monitoring budget source", () => {
  it("monthly-budget/03#AC1 Notion source shows the monthly budget times the months in each view mode", async () => {
    for (const [mode, months] of [["Monthly", 1], ["Quarterly", 3], ["Semi-Annually", 6], ["Annually", 12]] as const) {
      const { unmount } = renderMonitoring({ mode });
      const row = await budgetRow("Food");
      // ₱8,000 per month x months; remaining = budget - 1,000 spent.
      expect(row).toHaveTextContent(new RegExp(`${(8000 * months).toLocaleString("en-US")}\\.00`));
      expect(row).toHaveTextContent(new RegExp(`${(8000 * months - 1000).toLocaleString("en-US")}\\.00`));
      expect(screen.getByText("Default budgets")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^Export$/ })).not.toBeInTheDocument();
      unmount();
    }
  });

  it("monthly-budget/03#AC3 monthly-budget/03#AC8 Saved source with some months saved shows the partial-coverage badge and uses Notion for the rest", async () => {
    renderMonitoring({ mode: "Quarterly", source: "custom", rows: [savedRow("2026-01", "food", 5000), savedRow("2026-01", "transport", 1000)] });
    expect(await screen.findByText("Q1 2026 not found: adding Jan–Mar monthly budgets (custom for 1 of 3 months)")).toBeInTheDocument();
    const row = await budgetRow("Food");
    // Jan saved 5,000 + Feb and Mar (the rest of Q1) Notion 2 x 8,000 = 21,000. No muted Notion line under the figure.
    expect(row).toHaveTextContent("21,000.00");
    expect(row).not.toHaveTextContent("Notion");
  });

  it("monthly-budget/03#AC3 says so when no month has saved budgets, and keeps Notion figures", async () => {
    renderMonitoring({ source: "custom" });
    expect(await screen.findByText("No custom budget")).toBeInTheDocument();
    expect(await budgetRow("Food")).toHaveTextContent("8,000.00");
  });

  it("monthly-budget/03#AC3 says Saved budgets when every month in the range has a set", async () => {
    renderMonitoring({ source: "custom", rows: [savedRow("2026-01", "food", 5000)] });
    expect(await screen.findByText("Custom budgets")).toBeInTheDocument();
  });

  it("monthly-budget/02#AC5 monthly-budget/03#AC9 a category missing from a saved month counts as 0 and the totals follow", async () => {
    renderMonitoring({ source: "custom", rows: [savedRow("2026-01", "food", 5000)] });
    const transportRow = await budgetRow("Transport");
    // Budget 0, spent 300, remaining -300.
    expect(transportRow).toHaveTextContent("0.00");
    expect(transportRow).toHaveTextContent("-₱300.00");
    // The Budget panel total is 5,000 (Food only) with 1,300 spent; the Income table has its own Total row.
    const totals = await screen.findAllByRole("row", { name: /^Total/ });
    const budgetTotal = totals.find((row) => row.textContent?.includes("5,000.00"));
    expect(budgetTotal).toBeDefined();
    expect(budgetTotal).toHaveTextContent("1,300.00");
    expect(budgetTotal).toHaveTextContent("3,700.00");
  });

  it("monthly-budget/03#AC9 the zero-budget filter uses the resolved budgets", async () => {
    renderMonitoring({ source: "custom", rows: [savedRow("2026-01", "food", 5000)] });
    await budgetRow("Transport");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "hide-budget" } });
    await waitFor(() => expect(screen.queryByRole("row", { name: /^Transport\b/ })).not.toBeInTheDocument());
    expect(screen.getByRole("row", { name: /^Food\b/ })).toBeInTheDocument();
  });

  it("monthly-budget/03#AC10 choosing Saved stores the setting so it survives a restart", async () => {
    const { update } = renderMonitoring();
    const group = await screen.findByLabelText("Budget source");
    fireEvent.click(within(group).getByRole("button", { name: "Custom" }));
    await waitFor(() => expect(update).toHaveBeenCalledWith({ monitoringBudgetSource: "custom" }));
  });
});

describe("No budget actions on Monitoring", () => {
  it("custom-budget/03#AC1 Custom mode offers no budget button: no info icon, export, edit, save or import", async () => {
    renderMonitoring({ source: "custom" });
    await budgetRow("Food");
    for (const gone of [/Export/, /Edit budgets/, /Save budgets/, /Import/, /actions/i]) {
      expect(screen.queryByRole("button", { name: gone })).not.toBeInTheDocument();
    }
  });
});

describe("review fixes", () => {
  it("a saved budget sorts as a number in the table", async () => {
    renderMonitoring({ mode: "Quarterly", source: "custom", rows: [savedRow("2026-01", "food", 5000), savedRow("2026-01", "transport", 1000)] });
    await budgetRow("Food");
    fireEvent.click(screen.getByRole("button", { name: /Quarterly Budget/ }));
    const names = () => screen.getAllByRole("row").map((r) => r.textContent ?? "").filter((t) => /^(Food|Transport)/.test(t)).map((t) => t.slice(0, 4));
    // Food 21,000 vs Transport 5,000: ascending puts Transport first, which a text sort of "₱21…" / "₱5…" would reverse.
    await waitFor(() => expect(names()[0]).toBe("Tran"));
  });
});

describe("Saved budgets in Settings", () => {
  it("custom-budget/03#AC2 Settings exports every cached month with no range and offers no import", async () => {
    const exportCsv = vi.fn(async () => ok({ canceled: false, path: "/tmp/b.csv", rows: 7 }));
    renderPage(<SavedBudgetsSettings />, { apiOverrides: { budgets: { exportCsv } } as never });
    // Let the providers finish loading before clicking, or the click lands on a component that remounts.
    await new Promise((resolve) => setTimeout(resolve, 100));
    fireEvent.click(screen.getByRole("button", { name: /Export all budgets/ }));
    await waitFor(() => expect(exportCsv).toHaveBeenCalledWith({ kind: "saved" }));
    expect(await screen.findByText(/Exported 7 custom budgets/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Import/ })).not.toBeInTheDocument();
  });
});

describe("Monitoring fixed calendar periods (ADR-0012)", () => {
  const rangeOf = (list: ReturnType<typeof vi.fn>) => {
    const call = list.mock.calls.map((c) => c[0] as { rangeStart?: string; rangeEnd?: string } | undefined).find((p) => p?.rangeStart);
    return [call?.rangeStart, call?.rangeEnd];
  };

  it("calendar-periods/05#AC1 with November 2026 selected, Quarterly covers Oct 1 to Dec 31 and Semi-Annually Jul 1 to Dec 31", async () => {
    const q = renderMonitoring({ mode: "Quarterly", selectedDate: "2026-11-15" });
    await budgetRow("Food");
    expect(rangeOf(q.expensesList)).toEqual(["2026-10-01", "2026-12-31"]);
    q.unmount();
    const h = renderMonitoring({ mode: "Semi-Annually", selectedDate: "2026-11-15" });
    await budgetRow("Food");
    expect(rangeOf(h.expensesList)).toEqual(["2026-07-01", "2026-12-31"]);
  });

  it("calendar-periods/05#AC2 any month of a quarter or half gives the same period and the same budget", async () => {
    for (const [mode, dates] of [["Quarterly", ["2026-04-02", "2026-05-20", "2026-06-30"]], ["Semi-Annually", ["2026-01-05", "2026-04-15", "2026-06-30"]]] as const) {
      const ranges = new Set<string>();
      for (const date of dates) {
        const { expensesList, unmount } = renderMonitoring({ mode, selectedDate: date });
        await budgetRow("Food");
        ranges.add(rangeOf(expensesList).join("→"));
        unmount();
      }
      expect(ranges.size).toBe(1);
    }
  });

  it("calendar-periods/05#AC3 the budget covers exactly the period's months: Quarterly is 3 months, not 4", async () => {
    renderMonitoring({ mode: "Quarterly", selectedDate: "2026-11-15" });
    // Q4: 3 x 8,000 = 24,000 (the old floating window gave 4 x 8,000).
    expect(await budgetRow("Food")).toHaveTextContent("24,000.00");
  });

  it("calendar-periods/05#AC4 the period label reads Q4 2026 · Oct – Dec and H2 2026 · Jul – Dec", async () => {
    const q = renderMonitoring({ mode: "Quarterly", selectedDate: "2026-11-15" });
    await budgetRow("Food");
    expect(screen.getAllByText("Q4 2026 · Oct – Dec").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Quarterly Monitoring" })).toBeInTheDocument();
    q.unmount();
    renderMonitoring({ mode: "Semi-Annually", selectedDate: "2026-11-15" });
    await budgetRow("Food");
    expect(screen.getAllByText("H2 2026 · Jul – Dec").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Semi-Annual Monitoring" })).toBeInTheDocument();
  });

  it("calendar-periods/05#AC5 with Custom budgets the shown quarter's months use their rows, and months without one use the Default budget", async () => {
    // Q4 2026: Oct and Nov have rows (the cache already split any Q4 row into months), Dec falls back to Default 8,000.
    renderMonitoring({
      mode: "Quarterly", source: "custom", selectedDate: "2026-11-15",
      rows: [savedRow("2026-10", "food", 5000), savedRow("2026-11", "food", 6000), savedRow("2026-09", "food", 99999)],
    });
    expect(await screen.findByText("Q4 2026 not found: adding Oct–Dec monthly budgets (custom for 2 of 3 months)")).toBeInTheDocument();
    // 5,000 + 6,000 + 8,000 = 19,000; the September row is outside Q4 and ignored.
    expect(await budgetRow("Food")).toHaveTextContent("19,000.00");
  });

  it("calendar-periods/05#AC6 Monthly and Annually keep their periods", async () => {
    const m = renderMonitoring({ mode: "Monthly", selectedDate: "2026-11-15" });
    await budgetRow("Food");
    expect(rangeOf(m.expensesList)).toEqual(["2026-11-01", "2026-11-30"]);
    m.unmount();
    const y = renderMonitoring({ mode: "Annually", selectedDate: "2026-11-15" });
    await budgetRow("Food");
    expect(rangeOf(y.expensesList)).toEqual(["2026-01-01", "2026-12-31"]);
  });
});
