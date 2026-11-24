// @vitest-environment jsdom
// account-cards/09: the Accounts header gets the same filter icon as Income and Expense.
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { account } from "../../../../../test/factories";
import { DEFAULT_SETTINGS } from "@/lib/ui-settings-context";
import type { Account } from "@/types/finance";
import { AccountsPage } from "./accounts";

const savings = (over: Partial<Account> = {}): Account =>
  account({ id: "d1", name: "BDO Savings", type: "Savings", currentBalance: 1000, ...over }) as Account;
const empty = (over: Partial<Account> = {}): Account =>
  account({ id: "d2", name: "Empty Savings", type: "Savings", currentBalance: 0, ...over }) as Account;
const wallet = (over: Partial<Account> = {}): Account =>
  account({ id: "w1", name: "GCash", type: "e-Wallet", currentBalance: 50, ...over }) as Account;

function renderAccounts(filters: Partial<typeof DEFAULT_SETTINGS.accountsFilters> = {}, accounts = [savings(), empty(), wallet()]) {
  const update = vi.fn(async (patch: object) => ok({ ...DEFAULT_SETTINGS, ...patch }));
  renderPage(<AccountsPage />, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => ok(accounts)) },
      categories: { income: vi.fn(async () => ok([])), expense: vi.fn(async () => ok([])) },
      incomes: { list: vi.fn(async () => ok([])) },
      expenses: { list: vi.fn(async () => ok([])), listForCCCoverage: vi.fn(async () => ok([])) },
      settings: {
        get: vi.fn(async () =>
          ok({ ...DEFAULT_SETTINGS, accountsFilters: { ...DEFAULT_SETTINGS.accountsFilters, accountScope: "all" as const, viewMode: "table" as const, ...filters } }),
        ),
        update,
      },
    },
  });
  return { update };
}

// The page shows a skeleton until accounts load, so wait for the table before looking at the toolbar.
const loaded = () => screen.findByText("BDO Savings");
const dropdown = () => screen.queryByLabelText("All card types") ?? screen.queryByRole("button", { name: /All card types/ });
const hideZero = () => screen.queryByRole("checkbox", { name: /Hide zero balance/ });

describe("account-cards/09 the Accounts filter toggle", () => {
  it("account-cards/09#AC1 the header has a Filters icon, shown as Close filters and active while the row is open", async () => {
    renderAccounts();
    await loaded();
    const toggle = await screen.findByRole("button", { name: "Close filters" });
    expect(toggle.className).toContain("filter-toggle--active");
  });

  it("account-cards/09#AC2 the icon hides and shows the filter row while the view switch and tabs stay", async () => {
    renderAccounts();
    await loaded();
    await screen.findByRole("button", { name: "Close filters" });
    expect(dropdown()).toBeInTheDocument();
    expect(hideZero()).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close filters" }));
    expect(dropdown()).toBeNull();
    expect(hideZero()).toBeNull();
    expect(screen.getByRole("button", { name: "Filters" }).className).not.toContain("filter-toggle--active");
    expect(screen.getByRole("button", { name: "Wallet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Credit Accounts" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(dropdown()).toBeInTheDocument();
  });

  it("account-cards/09#AC3 a hidden filter row still filters: hide zero balance and a chosen card type keep applying", async () => {
    renderAccounts({ filterActive: false, hideZeroBalance: true });
    await screen.findByRole("button", { name: "Filters" });
    expect(await screen.findByText("BDO Savings")).toBeInTheDocument();
    expect(screen.queryByText("Empty Savings")).toBeNull();
    expect(dropdown()).toBeNull();
  });

  it("account-cards/09#AC3 a card type chosen before hiding the row keeps applying", async () => {
    renderAccounts({ filterActive: false, cardTypeFilter: "e-Wallet" });
    await screen.findByRole("button", { name: "Filters" });
    expect(await screen.findByText("GCash")).toBeInTheDocument();
    expect(screen.queryByText("BDO Savings")).toBeNull();
  });

  it("account-cards/09#AC4 the row is shown by default and the choice is saved", async () => {
    const { update } = renderAccounts();
    await loaded();
    await screen.findByRole("button", { name: "Close filters" });
    fireEvent.click(screen.getByRole("button", { name: "Close filters" }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ accountsFilters: expect.objectContaining({ filterActive: false }) }),
      ),
    );
  });

  it("account-cards/09#AC4 a saved hidden state is restored", async () => {
    renderAccounts({ filterActive: false });
    await loaded();
    await screen.findByRole("button", { name: "Filters" });
    expect(dropdown()).toBeNull();
  });

  it("account-cards/09#AC5 the existing Filters shortcut toggles the row on this page", async () => {
    renderAccounts();
    await loaded();
    await screen.findByRole("button", { name: "Close filters" });
    fireEvent.keyDown(window, { key: "f", code: "KeyF", metaKey: true, ctrlKey: true, shiftKey: true });
    await waitFor(() => expect(dropdown()).toBeNull());
    fireEvent.keyDown(window, { key: "f", code: "KeyF", metaKey: true, ctrlKey: true, shiftKey: true });
    await waitFor(() => expect(dropdown()).toBeInTheDocument());
  });

  it("account-cards/09#AC6 with the row hidden the view switch is still the only item in its row", async () => {
    renderAccounts({ filterActive: false });
    await loaded();
    await screen.findByRole("button", { name: "Filters" });
    const row = screen.getByRole("button", { name: "Wallet" }).closest(".account-filter-row");
    expect(row).not.toBeNull();
    expect(row!.querySelector('[aria-label="Account view"]')).not.toBeNull();
    expect(row!.children).toHaveLength(1);
  });
});
