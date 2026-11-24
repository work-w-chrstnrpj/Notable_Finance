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
function renderMonitoring({ mode = "Monthly" as Mode, source = "default", rows = [] as SavedBudgetRow[] } = {}) {
  const update = vi.fn(async (patch: object) => ok({ ...DEFAULT_SETTINGS, monitoringBudgetSource: source, ...patch }));
  const list = vi.fn(async () => ok(rows));
  const utils = renderPage(<MonthlyMonitoringPage viewMode={mode} onViewModeChange={vi.fn()} selectedDate="2026-01-15" />, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => ok([])) },
      categories: { income: vi.fn(async () => ok([])), expense: vi.fn(async () => ok([food, transport, aux])), pasabuyers: vi.fn(async () => ok([])) },
      incomes: { list: vi.fn(async () => ok([])) },
      expenses: { list: vi.fn(async () => ok([expense("lunch", "food", 1000), expense("bus", "transport", 300)])) },
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
  return { ...utils, update, list };
}

/** The Budget panel's table row for a category. */
async function budgetRow(name: string) {
  return await screen.findByRole("row", { name: new RegExp(`^${name}\\b`) });
}

afterEach(() => vi.restoreAllMocks());

describe("Monitoring budget source", () => {
  it("monthly-budget/03#AC1 Notion source shows the monthly budget times the months in each view mode", async () => {
    for (const [mode, months] of [["Monthly", 1], ["Quarterly", 4], ["Semi-Annually", 6], ["Annually", 12]] as const) {
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
    expect(await screen.findByText("Custom budgets: 1 of 4 months")).toBeInTheDocument();
    const row = await budgetRow("Food");
    // Jan saved 5,000 + Feb to Apr Notion 3 x 8,000 = 29,000. No muted Notion line under the figure.
    expect(row).toHaveTextContent("29,000.00");
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
    // Food 29,000 vs Transport 7,000: ascending puts Transport first, which a text sort of "₱29…" / "₱7…" would reverse.
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
