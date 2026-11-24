// @vitest-environment jsdom
// account-cards/10: the Accounts filter row sits above the scope tabs, like Income and Expense.
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { account } from "../../../../../test/factories";
import { DEFAULT_SETTINGS } from "@/lib/ui-settings-context";
import type { Account } from "@/types/finance";
import { AccountsPage } from "./accounts";

const savings = (): Account => account({ id: "d1", name: "BDO Savings", type: "Savings", currentBalance: 1000 }) as Account;
const wallet = (): Account => account({ id: "w1", name: "GCash", type: "e-Wallet", currentBalance: 50 }) as Account;

function renderAccounts(filters: Partial<typeof DEFAULT_SETTINGS.accountsFilters> = {}) {
  const update = vi.fn(async (patch: object) => ok({ ...DEFAULT_SETTINGS, ...patch }));
  renderPage(<AccountsPage />, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => ok([savings(), wallet()])) },
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
}

// The page shows a skeleton until accounts load.
const loaded = () => screen.findByText("BDO Savings");
const filterRow = () => document.querySelector(".account-filter-row") as HTMLElement;
const tabs = () => document.querySelector('[aria-label="Account mode"]') as HTMLElement;
const before = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("account-cards/10 scope tabs above the filter row (same order as Expense; corrected after owner feedback)", () => {
  it("account-cards/10#AC1 the scope tabs come before the filter row", async () => {
    renderAccounts();
    await loaded();
    expect(filterRow()).not.toBeNull();
    expect(tabs()).not.toBeNull();
    expect(before(tabs(), filterRow())).toBe(true);
    // the card-type dropdown and Hide zero balance are inside the filter row
    expect(filterRow().contains(screen.getByRole("checkbox", { name: /Hide zero balance/ }))).toBe(true);
    expect(filterRow().querySelector('[aria-label="Account view"]')).not.toBeNull();
    expect(filterRow().contains(tabs())).toBe(false);
  });

  it("account-cards/10#AC2 the icon, view switch and tabs still work in the new order", async () => {
    renderAccounts();
    await loaded();
    fireEvent.click(screen.getByRole("button", { name: "Close filters" }));
    expect(screen.queryByRole("checkbox", { name: /Hide zero balance/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(screen.getByRole("checkbox", { name: /Hide zero balance/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cards" }));
    await waitFor(() => expect(screen.getAllByTestId("account-card").length).toBe(2));
    fireEvent.click(screen.getByRole("button", { name: "Credit Accounts" }));
    await waitFor(() => expect(screen.queryAllByTestId("account-card").length).toBe(0));
  });

  it("account-cards/10#AC3 with the filters hidden the view switch is still in the row below the tabs", async () => {
    renderAccounts({ filterActive: false });
    await loaded();
    await screen.findByRole("button", { name: "Filters" });
    expect(filterRow().children).toHaveLength(1);
    expect(filterRow().querySelector('[aria-label="Account view"]')).not.toBeNull();
    expect(before(tabs(), filterRow())).toBe(true);
  });
});
