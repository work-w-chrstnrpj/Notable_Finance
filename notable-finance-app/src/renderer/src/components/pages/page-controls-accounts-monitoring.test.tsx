// @vitest-environment jsdom
// page-controls/03: hide toggles on Accounts and Monitoring.
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { account } from "../../../../../test/factories";
import { DEFAULT_SETTINGS } from "@/lib/ui-settings-context";
import type { Account } from "@/types/finance";
import { AccountsPage } from "./accounts";
import { MonthlyMonitoringPage } from "./monitoring";

type Controls = Record<string, { periodHidden?: boolean; viewsHidden?: boolean }>;

const savings = (): Account => account({ id: "d1", name: "BDO Savings", type: "Savings", currentBalance: 1000 }) as Account;
const card = (): Account =>
  account({ id: "c1", name: "RCBC Visa", type: "Credit Account", paymentNetwork: "Visa", currentBalance: -500, creditLimit: 5000, availableLimit: 4500 }) as Account;

function renderAccounts(pageControls: Controls = {}, accountsFilters: Partial<typeof DEFAULT_SETTINGS.accountsFilters> = {}) {
  const update = vi.fn(async (patch: object) => ok({ ...DEFAULT_SETTINGS, ...patch }));
  renderPage(<AccountsPage />, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => ok([savings(), card()])) },
      categories: { income: vi.fn(async () => ok([])), expense: vi.fn(async () => ok([])) },
      incomes: { list: vi.fn(async () => ok([])) },
      expenses: { list: vi.fn(async () => ok([])), listForCCCoverage: vi.fn(async () => ok([])) },
      settings: {
        get: vi.fn(async () =>
          ok({
            ...DEFAULT_SETTINGS,
            pageControls,
            accountsFilters: { ...DEFAULT_SETTINGS.accountsFilters, accountScope: "all" as const, viewMode: "table" as const, ...accountsFilters },
          } as never),
        ),
        update,
      },
    },
  });
  return { update };
}
const accountsLoaded = () => screen.findByText("BDO Savings");

function renderMonitoring(pageControls: Controls = {}) {
  const update = vi.fn(async (patch: object) => ok({ ...DEFAULT_SETTINGS, ...patch }));
  const expensesList = vi.fn(async (_p?: unknown) => ok([]));
  renderPage(<MonthlyMonitoringPage viewMode="Quarterly" onViewModeChange={vi.fn()} selectedDate="2026-11-15" />, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => ok([])) },
      categories: {
        income: vi.fn(async () => ok([])),
        expense: vi.fn(async () => ok([{ id: "food", name: "Food", auxiliary: false, icon: null, monthlyBudget: 8000 }])),
        pasabuyers: vi.fn(async () => ok([])),
      },
      incomes: { list: vi.fn(async () => ok([])) },
      expenses: { list: expensesList },
      settings: { get: vi.fn(async () => ok({ ...DEFAULT_SETTINGS, pageControls } as never)), update },
      budgets: {
        list: vi.fn(async () => ok([])),
        mirrorStatus: vi.fn(async () => ok({ databaseId: "db-1", databaseMissing: false, missingColumns: [], lastRunAt: null, lastError: null })),
      },
    } as never,
  });
  return { update, expensesList };
}
const monitoringLoaded = () => screen.findByRole("button", { name: "Add Forecast" });
const bar = (label: string) => document.querySelector(`[aria-label="${label}"]`);

describe("page-controls/03 Accounts", () => {
  it("page-controls/03#AC1 the header shows Period, Views, Filters in that order", async () => {
    renderAccounts();
    await accountsLoaded();
    const names = screen
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label") ?? "")
      .filter((n) => /period picker|view switches|filters/i.test(n));
    expect(names).toEqual(["Hide period picker", "Hide view switches", "Close filters"]);
  });

  it("page-controls/03#AC1 the period toggle hides the scope tabs and the chosen scope stays in effect", async () => {
    renderAccounts({}, { accountScope: "credit" });
    await screen.findByText("RCBC Visa");
    expect(bar("Account mode")).not.toBeNull();
    expect(screen.queryByText("BDO Savings")).toBeNull(); // Credit Accounts scope
    fireEvent.click(screen.getByRole("button", { name: "Hide period picker" }));
    expect(bar("Account mode")).toBeNull();
    expect(screen.getByText("RCBC Visa")).toBeInTheDocument();
    expect(screen.queryByText("BDO Savings")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show period picker" }));
    expect(bar("Account mode")).not.toBeNull();
  });

  it("page-controls/03#AC1 the views toggle hides Table | Cards | Wallet and the chosen view stays in effect", async () => {
    renderAccounts({}, { viewMode: "cards" });
    await waitFor(() => expect(screen.queryAllByTestId("account-card").length).toBeGreaterThan(0));
    expect(bar("Account view")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Hide view switches" }));
    expect(bar("Account view")).toBeNull();
    expect(screen.queryAllByTestId("account-card").length).toBeGreaterThan(0);
  });

  it("page-controls/03#AC1 the filter icon and the views toggle each hide only their own controls", async () => {
    renderAccounts();
    await accountsLoaded();
    fireEvent.click(screen.getByRole("button", { name: "Close filters" }));
    expect(screen.queryByRole("checkbox", { name: /Hide zero balance/ })).toBeNull();
    expect(bar("Account view")).not.toBeNull(); // the views toggle governs the view switch
    fireEvent.click(screen.getByRole("button", { name: "Hide view switches" }));
    expect(document.querySelector(".account-filter-row")).toBeNull(); // nothing left to show
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(screen.getByRole("checkbox", { name: /Hide zero balance/ })).toBeInTheDocument();
    expect(bar("Account view")).toBeNull();
  });

  it("page-controls/03#AC3 with everything hidden Accounts shows only the header and the table", async () => {
    renderAccounts({ accounts: { periodHidden: true, viewsHidden: true } }, { filterActive: false });
    await accountsLoaded();
    expect(bar("Account mode")).toBeNull();
    expect(bar("Account view")).toBeNull();
    expect(document.querySelector(".account-filter-row")).toBeNull();
    expect(screen.queryByRole("checkbox", { name: /Hide zero balance/ })).toBeNull();
    expect(screen.getByRole("heading", { name: "Accounts" })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: /BDO Savings/ })).toBeInTheDocument();
  });

  it("page-controls/03#AC4 Accounts remembers what was hidden and starts with everything shown", async () => {
    const { update } = renderAccounts();
    await accountsLoaded();
    expect(bar("Account mode")).not.toBeNull();
    expect(bar("Account view")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Hide period picker" }));
    await waitFor(() => expect(update).toHaveBeenCalledWith({ pageControls: { accounts: { periodHidden: true } } }));
  });

  it("page-controls/03#AC4 a saved hidden state is restored on Accounts", async () => {
    renderAccounts({ accounts: { periodHidden: true } });
    await accountsLoaded();
    expect(bar("Account mode")).toBeNull();
    expect(screen.getByRole("button", { name: "Show period picker" })).toBeInTheDocument();
  });
});

describe("page-controls/03 Monitoring", () => {
  it("page-controls/03#AC2 the header shows Period and Views before Add Forecast", async () => {
    renderMonitoring();
    await monitoringLoaded();
    const names = screen
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label") ?? b.textContent?.trim() ?? "")
      .filter((n) => /period picker|view switches|Add Forecast/i.test(n));
    expect(names).toEqual(["Hide period picker", "Hide view switches", "Add Forecast"]);
  });

  it("page-controls/03#AC2 the period toggle hides the Monthly … Annually bar and the period stays in effect", async () => {
    const { expensesList } = renderMonitoring();
    await monitoringLoaded();
    await waitFor(() => expect(expensesList).toHaveBeenCalled());
    const firstRange = JSON.stringify(expensesList.mock.calls[expensesList.mock.calls.length - 1]);
    expect(bar("Monitoring view")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Hide period picker" }));
    expect(bar("Monitoring view")).toBeNull();
    expect(JSON.stringify(expensesList.mock.calls[expensesList.mock.calls.length - 1])).toBe(firstRange); // same Q4 range requested
    expect(screen.getByRole("heading", { name: "Quarterly Monitoring" })).toBeInTheDocument();
  });

  it("page-controls/03#AC2 the views toggle hides Default | Custom and the budget source stays in effect", async () => {
    renderMonitoring();
    await monitoringLoaded();
    expect(bar("Budget source")).not.toBeNull();
    expect(screen.getByText("Default budgets")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Hide view switches" }));
    expect(bar("Budget source")).toBeNull();
    expect(screen.getByText("Default budgets")).toBeInTheDocument();
  });

  it("page-controls/03#AC3 with both hidden Monitoring shows the header and its content only", async () => {
    renderMonitoring({ monitoring: { periodHidden: true, viewsHidden: true } });
    await monitoringLoaded();
    expect(bar("Monitoring view")).toBeNull();
    expect(bar("Budget source")).toBeNull();
    expect(document.querySelector(".toolbar-row")).toBeNull();
    expect(screen.getByRole("heading", { name: "Quarterly Monitoring" })).toBeInTheDocument();
    expect(within(document.body).getByText("Default budgets")).toBeInTheDocument();
  });

  it("page-controls/03#AC4 Monitoring remembers what was hidden", async () => {
    const { update } = renderMonitoring();
    await monitoringLoaded();
    fireEvent.click(screen.getByRole("button", { name: "Hide view switches" }));
    await waitFor(() => expect(update).toHaveBeenCalledWith({ pageControls: { monitoring: { viewsHidden: true } } }));
  });
});
