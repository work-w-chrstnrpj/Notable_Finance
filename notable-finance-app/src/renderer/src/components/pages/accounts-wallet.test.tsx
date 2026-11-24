// @vitest-environment jsdom
// account-cards/05: the Wallet view on the Accounts page (picker rail + one large card and its details).
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { account, expense, income } from "../../../../../test/factories";
import { formatMoney } from "@/lib/format";
import { DEFAULT_SETTINGS } from "@/lib/ui-settings-context";
import type { Account, ExpenseRecord, IncomeRecord } from "@/types/finance";
import { AccountsPage } from "./accounts";
import {
  ACTIVITY_LIMIT,
  isoDay,
  panelSubtitle,
  railSubtitle,
  recentActivity,
  resolveSelection,
  sparkPaths,
  spendingByDay,
  stepSelection,
} from "./accounts-wallet-model";

const TODAY = new Date(2026, 10, 24); // Nov 24, 2026

// The pure rules take the renderer's record types; the factories build the IPC DTOs (same fields for what these rules read).
const exp = (over: Parameters<typeof expense>[0] = {}) => expense(over) as unknown as ExpenseRecord;
const inc = (over: Parameters<typeof income>[0] = {}) => income(over) as unknown as IncomeRecord;

const credit = (over: Partial<Account> = {}): Account =>
  account({
    id: "c1",
    name: "RCBC Visa Flex Gold",
    type: "Credit Account",
    paymentNetwork: "Visa",
    currentBalance: -132687.25,
    creditLimit: 462000,
    availableLimit: 329312.75,
    billingDay: 26,
    dueDay: 11,
    totalIncomes: 98000,
    totalExpenses: 230687.25,
    ...over,
  }) as Account;
const credit2 = (over: Partial<Account> = {}): Account =>
  credit({ id: "c2", name: "BDO Visa Platinum", currentBalance: -237600, creditLimit: 850000, availableLimit: 612400, dueDay: 20, billingDay: 3, ...over });
const debit = (over: Partial<Account> = {}): Account =>
  account({ id: "d1", name: "BDO Savings", type: "Savings", paymentNetwork: "Visa", currentBalance: 284310.42, ...over }) as Account;
const wallet = (over: Partial<Account> = {}): Account =>
  account({ id: "w1", name: "GCash", type: "e-Wallet", paymentNetwork: null, cardNumbers: null, currentBalance: 6840.25, ...over }) as Account;

type ListParams = { accountId?: string; rangeStart?: string; rangeEnd?: string; view?: string };

interface Seed {
  expenses?: ReturnType<typeof expense>[];
  incomes?: ReturnType<typeof income>[];
  transfers?: ReturnType<typeof income>[];
  cardPayments?: ReturnType<typeof income>[];
}

function renderAccounts(
  accounts: Account[],
  opts: { filters?: Partial<typeof DEFAULT_SETTINGS.accountsFilters>; seed?: Seed; settings?: Partial<typeof DEFAULT_SETTINGS> } = {},
) {
  const seed = opts.seed ?? {};
  const update = vi.fn(async (patch: object) => ok({ ...DEFAULT_SETTINGS, ...patch }));
  const expensesList = vi.fn(async (p?: ListParams) => ok((seed.expenses ?? []).filter((e) => !p?.accountId || e.accountId === p.accountId)));
  const incomesList = vi.fn(async (p?: ListParams) => {
    const rows = p?.view === "transfers" ? seed.transfers : p?.view === "creditCardPayments" ? seed.cardPayments : seed.incomes;
    return ok((rows ?? []).filter((r) => !p?.accountId || r.accountId === p.accountId));
  });
  const view = renderPage(<AccountsPage />, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => ok(accounts)) },
      categories: {
        income: vi.fn(async () => ok([])),
        expense: vi.fn(async () => ok([{ id: "ecat", name: "Groceries", monthlyBudget: 0, auxiliary: false }])),
      },
      incomes: { list: incomesList },
      expenses: { list: expensesList, listForCCCoverage: vi.fn(async () => ok([])) },
      settings: {
        get: vi.fn(async () =>
          ok({
            ...DEFAULT_SETTINGS,
            ...opts.settings,
            accountsFilters: { ...DEFAULT_SETTINGS.accountsFilters, accountScope: "all" as const, viewMode: "wallet" as const, ...opts.filters },
          }),
        ),
        update,
      },
    },
  });
  return { ...view, update, expensesList, incomesList };
}

const rail = () => screen.findByRole("listbox", { name: "Accounts" });
const rows = async () => within(await rail()).getAllByRole("option");
const selectedName = async () => {
  const sel = (await rows()).find((r) => r.getAttribute("aria-selected") === "true");
  return sel?.querySelector("span:nth-child(2) > span")?.textContent ?? null;
};
const panel = () => screen.getByLabelText("Account details");
const isActive = (name: string) => /--active/.test(screen.getByRole("button", { name }).className);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(TODAY);
});
afterEach(() => vi.useRealTimers());

describe("account-cards/05 the pure rules", () => {
  it("account-cards/05#AC2 the picker line reads like the prototype: '29% used · due Dec 11', else the network, else the type", () => {
    expect(railSubtitle(credit({ currentBalance: -132687.25, creditLimit: 462000, dueDay: 11 }), TODAY)).toBe("29% used · due Dec 11");
    expect(railSubtitle(credit({ dueDay: null }), TODAY)).toBe("29% used");
    // account-cards/03#AC3: N/A is not a network, so the picker falls back to the type
    expect(railSubtitle(credit({ type: "Savings", paymentNetwork: "N/A" }), TODAY)).toBe("Savings");
    expect(railSubtitle(debit(), TODAY)).toBe("Visa");
    expect(railSubtitle(wallet(), TODAY)).toBe("e-Wallet");
  });

  it("account-cards/11#AC1 the Wallet line shows '•••• 4056' after the network when a valid card number is set", () => {
    expect(panelSubtitle(credit({ paymentNetwork: "Visa", cardNumbers: "16, 4056" }))).toBe("Credit Account · Visa · •••• 4056");
    expect(panelSubtitle(credit({ paymentNetwork: null, cardNumbers: "15, 1005" }))).toBe("Credit Account · •••• 1005");
  });

  it("account-cards/11#AC3 the Wallet line shows no number when the value is empty or invalid", () => {
    for (const cardNumbers of [null, "", "abc", "16, 40", "30, 4056"]) {
      expect(panelSubtitle(credit({ paymentNetwork: "Visa", cardNumbers }))).toBe("Credit Account · Visa");
    }
  });

  it("account-cards/05#AC5 the selection stays while the account is listed, otherwise it is the first one listed", () => {
    expect(resolveSelection(["a", "b", "c"], "b")).toBe("b");
    expect(resolveSelection(["a", "b", "c"], "z")).toBe("a");
    expect(resolveSelection(["a", "b"], null)).toBe("a");
    expect(resolveSelection([], "a")).toBeNull();
  });

  it("account-cards/05#AC3 stepping moves to the neighbour and stops at either end", () => {
    const ids = ["a", "b", "c"];
    expect(stepSelection(ids, "a", 1)).toBe("b");
    expect(stepSelection(ids, "c", 1)).toBe("c");
    expect(stepSelection(ids, "a", -1)).toBe("a");
    expect(stepSelection(ids, "b", -1)).toBe("a");
    expect(stepSelection(ids, null, 1)).toBe("a");
    expect(stepSelection([], "a", 1)).toBeNull();
  });

  it("account-cards/05#AC7 spending per day covers the last 24 days, oldest first, and counts interest", () => {
    const series = spendingByDay(
      [
        exp({ id: "1", purchaseDate: "2026-11-24", amount: 100, interest: 5 }),
        exp({ id: "2", purchaseDate: "2026-11-24", amount: 50 }),
        exp({ id: "3", purchaseDate: "2026-11-01", amount: 30 }),
        exp({ id: "4", purchaseDate: "2026-10-31", amount: 999 }), // 24 days back: outside the window
      ],
      TODAY,
    );
    expect(series).toHaveLength(24);
    expect(series[23]).toBe(155);
    expect(series[0]).toBe(30); // Nov 1 is the 24th day back
    expect(series.reduce((a, b) => a + b, 0)).toBe(185);
    expect(isoDay(TODAY)).toBe("2026-11-24");
  });

  it("account-cards/05#AC7 the spending line is empty when nothing was spent and scales to the tallest day otherwise", () => {
    expect(sparkPaths(Array(24).fill(0))).toBeNull();
    const paths = sparkPaths([0, 10, 5, 0])!;
    expect(paths.line.startsWith("M0.0,")).toBe(true);
    expect(paths.area.endsWith("Z")).toBe(true);
  });

  it("account-cards/05#AC7 recent activity is the newest records of all kinds, money out negative, capped at five", () => {
    const e = (n: number, day: string, amount: number) => exp({ id: `e${n}`, description: `Buy ${n}`, purchaseDate: day, amount });
    const out = recentActivity(
      [e(1, "2026-11-20", 100), e(2, "2026-11-22", 200), e(3, "2026-11-10", 300), e(4, "2026-11-05", 50)],
      [inc({ id: "i1", name: "Salary", date: "2026-11-23", grossIncome: 5000 }), inc({ id: "i2", name: "Old", date: "2026-10-01", grossIncome: 1 })],
    );
    expect(out).toHaveLength(ACTIVITY_LIMIT);
    expect(out.map((r) => r.title)).toEqual(["Salary", "Buy 2", "Buy 1", "Buy 3", "Buy 4"]);
    expect(out[0].amount).toBe(5000);
    expect(out[1].amount).toBe(-200);
    expect(recentActivity([], [])).toEqual([]);
  });
});

describe("account-cards/05 the Wallet view", () => {
  it("account-cards/05#AC1 a credit account shows its large card, usage ring, figures, spending and activity labels", async () => {
    renderAccounts([credit(), debit(), wallet()]);
    await rail();
    const p = panel();
    expect(within(p).getByRole("heading", { name: "RCBC Visa Flex Gold" })).toBeInTheDocument();
    expect(within(p).getByText("Credit Account · Visa")).toBeInTheDocument();
    expect(within(p).getByText("Billing day 26")).toBeInTheDocument();
    expect(within(p).getByTestId("account-card")).toBeInTheDocument();
    for (const label of ["Amount owed", "Available", "Credit limit", "Next due", "Payments made", "Purchases", "Card color"]) {
      expect(within(p).getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(within(p).getByText("29%")).toBeInTheDocument();
    expect(within(p).getByText("Auto")).toBeInTheDocument();
    expect(within(p).getByText(/Spending, last 24 days/)).toBeInTheDocument();
    expect(within(p).getByText("Recent activity")).toBeInTheDocument();
  });

  it("account-cards/05#AC1 a non-credit account shows its balance and payment network, with no ring", async () => {
    renderAccounts([credit(), debit(), wallet()], { settings: {} });
    fireEvent.click(within(await rail()).getByRole("option", { name: /GCash/ }));
    const p = panel();
    await waitFor(() => expect(within(p).getByRole("heading", { name: "GCash" })).toBeInTheDocument());
    expect(within(p).getAllByText("e-Wallet").length).toBeGreaterThan(0);
    expect(within(p).getByText("Active")).toBeInTheDocument();
    expect(within(p).getAllByText("Balance").length).toBeGreaterThan(0);
    expect(within(p).getByText("Payment network")).toBeInTheDocument();
    expect(within(p).getByText("Not set")).toBeInTheDocument();
    expect(within(p).queryByText("Card color")).toBeNull();
    expect(within(p).queryByText("used")).toBeNull();
  });

  it("account-cards/05#AC1 a color the owner chose by hand reads Custom, an automatic one reads Auto", async () => {
    renderAccounts([credit()], { settings: { accountColors: { c1: "Ruby" }, customAccountColors: ["c1"] } });
    await rail();
    expect(within(panel()).getByText("Custom")).toBeInTheDocument();
    expect(within(panel()).getAllByText("Ruby").length).toBeGreaterThan(0);
  });

  it("account-cards/05#AC1 the picker is grouped Credit, Debit & savings, Wallets & cash, with the amount owed or balance on each row", async () => {
    renderAccounts([wallet(), debit(), credit()]);
    const list = await rail();
    const groups = ["Credit", "Debit & savings", "Wallets & cash"].map((g) => within(list).getByText(g));
    expect(groups[0].compareDocumentPosition(groups[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(groups[1].compareDocumentPosition(groups[2]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const row = within(list).getByRole("option", { name: /RCBC Visa Flex Gold/ });
    expect(within(row).getByText("29% used · due Dec 11")).toBeInTheDocument();
    expect(within(row).getByText(formatMoney(132687.25, { compact: true }))).toBeInTheDocument();
    expect(within(within(list).getByRole("option", { name: /BDO Savings/ })).getByText("Visa")).toBeInTheDocument();
  });

  it("account-cards/05#AC2 clicking a row selects it, marks it and shows its large card and details", async () => {
    renderAccounts([credit(), credit2(), debit()]);
    await rail();
    expect(await selectedName()).toBe("BDO Visa Platinum"); // first listed (alphabetical within Credit)
    fireEvent.click(within(await rail()).getByRole("option", { name: /RCBC Visa Flex Gold/ }));
    await waitFor(async () => expect(await selectedName()).toBe("RCBC Visa Flex Gold"));
    expect(within(panel()).getByRole("heading", { name: "RCBC Visa Flex Gold" })).toBeInTheDocument();
    expect(within(panel()).getByTestId("account-card")).toBeInTheDocument();
    const selected = (await rows()).filter((r) => r.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(1);
  });

  it("account-cards/05#AC2 the large card still flips on click and opens the account detail on double-click", async () => {
    renderAccounts([credit()]);
    await rail();
    const card = within(panel()).getByTestId("account-card");
    fireEvent.click(card);
    expect(card.className).toMatch(/flipped/);
    fireEvent.doubleClick(card);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("account-cards/05#AC3 the down and up arrow keys move the selection through the picker order and keep the row in view", async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    renderAccounts([credit(), credit2(), debit(), wallet()]);
    await rail();
    expect(await selectedName()).toBe("BDO Visa Platinum");
    fireEvent.keyDown(window, { key: "ArrowDown" });
    await waitFor(async () => expect(await selectedName()).toBe("RCBC Visa Flex Gold"));
    fireEvent.keyDown(window, { key: "ArrowDown" });
    await waitFor(async () => expect(await selectedName()).toBe("BDO Savings")); // next group
    fireEvent.keyDown(window, { key: "ArrowDown" });
    await waitFor(async () => expect(await selectedName()).toBe("GCash"));
    fireEvent.keyDown(window, { key: "ArrowDown" }); // end of the list: stays
    await waitFor(async () => expect(await selectedName()).toBe("GCash"));
    fireEvent.keyDown(window, { key: "ArrowUp" });
    await waitFor(async () => expect(await selectedName()).toBe("BDO Savings"));
    expect(within(panel()).getByRole("heading", { name: "BDO Savings" })).toBeInTheDocument();
    expect(scroll).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("account-cards/05#AC3 arrow keys typed into a field or while a dialog is open do not move the selection", async () => {
    renderAccounts([credit(), credit2()]);
    await rail();
    const input = document.createElement("input");
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(await selectedName()).toBe("BDO Visa Platinum");
    input.remove();
    fireEvent.doubleClick(within(panel()).getByTestId("account-card"));
    await screen.findByRole("dialog");
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(await selectedName()).toBe("BDO Visa Platinum");
  });

  it("account-cards/05#AC4 nothing overlaps: the picker scrolls on its own and no card is pulled over another with negative margins", () => {
    const css = readFileSync(join(__dirname, "accounts-wallet.module.css"), "utf8");
    const rule = (selector: string) => new RegExp(`${selector.replace(".", "\\.")}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? "";
    expect(rule(".rail")).toMatch(/position:\s*sticky/);
    expect(rule(".rail")).toMatch(/overflow:\s*auto/);
    expect(rule(".rail")).toMatch(/max-height:/);
    expect(rule(".wallet")).toMatch(/grid-template-columns:\s*300px minmax\(0,\s*1fr\)/);
    expect(css).not.toMatch(/margin(-top|-bottom)?:\s*-\d/);
  });

  it("account-cards/05#AC5 the tabs change the picker and the selection moves to the first account when the chosen one drops out", async () => {
    renderAccounts([credit(), credit2(), debit(), wallet()]);
    fireEvent.click(within(await rail()).getByRole("option", { name: /GCash/ }));
    await waitFor(async () => expect(await selectedName()).toBe("GCash"));
    fireEvent.click(screen.getByRole("button", { name: "Credit Accounts" }));
    await waitFor(async () => expect(await rows()).toHaveLength(2));
    expect(await selectedName()).toBe("BDO Visa Platinum");
    expect(within(panel()).getByRole("heading", { name: "BDO Visa Platinum" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Accounts" }));
    await waitFor(async () => expect(await rows()).toHaveLength(2));
    expect(await selectedName()).toBe("BDO Savings");
  });

  it("account-cards/05#AC5 hide-zero and the card-type filter change the picker", async () => {
    renderAccounts([credit(), debit(), wallet({ currentBalance: 0 })]);
    await waitFor(async () => expect(await rows()).toHaveLength(3));
    fireEvent.click(screen.getByRole("checkbox", { name: /Hide zero balance/ }));
    await waitFor(async () => expect(await rows()).toHaveLength(2));
    expect(within(await rail()).queryByRole("option", { name: /GCash/ })).toBeNull();
  });

  it("account-cards/05#AC5 an empty list shows a plain message and does not throw", async () => {
    renderAccounts([credit()], { filters: { accountScope: "standard" } });
    await waitFor(() => expect(isActive("Wallet")).toBe(true)); // saved view restored
    expect(screen.getByText("No accounts to show.")).toBeInTheDocument();
    expect(screen.queryByRole("listbox", { name: "Accounts" })).toBeNull();
  });

  it("account-cards/05#AC6 the switch offers Table, Cards, Wallet and a saved Wallet choice is restored", async () => {
    renderAccounts([credit()]);
    await rail();
    const labels = within(screen.getByLabelText("Account view")).getAllByRole("button").map((b) => b.textContent);
    expect(labels).toEqual(["Table", "Cards", "Wallet"]);
    expect(isActive("Wallet")).toBe(true);
    expect(isActive("Cards")).toBe(false);
  });

  it("account-cards/05#AC6 choosing Wallet is saved with the other Accounts filters", async () => {
    const { update } = renderAccounts([credit()], { filters: { viewMode: "cards" } });
    await screen.findAllByTestId("account-card");
    fireEvent.click(screen.getByRole("button", { name: "Wallet" }));
    await rail();
    await waitFor(() => expect(update).toHaveBeenCalledWith(expect.objectContaining({ accountsFilters: expect.objectContaining({ viewMode: "wallet" }) })));
  });

  it("account-cards/05#AC6 the layout shortcut cycles Table, Cards, Wallet and back to Table", async () => {
    renderAccounts([credit()], { filters: { viewMode: "table" } });
    await screen.findByRole("columnheader", { name: /Account/ });
    const press = () => fireEvent.keyDown(window, { key: "`", code: "Backquote", ctrlKey: true, altKey: true, metaKey: true });
    press();
    await waitFor(() => expect(isActive("Cards")).toBe(true));
    press();
    await waitFor(() => expect(isActive("Wallet")).toBe(true));
    expect(await rail()).toBeInTheDocument();
    press();
    await waitFor(() => expect(isActive("Table")).toBe(true));
  });

  it("account-cards/05#AC6 a stored 'wallet' view is kept by the settings loader", () => {
    const ui = readFileSync(join(__dirname, "../../../../main/settings/ui.ts"), "utf8");
    expect(ui).toMatch(/r\.viewMode === 'table' \|\| r\.viewMode === 'wallet'/);
  });
});

describe("account-cards/05 real records, not sample data", () => {
  const seed: Seed = {
    expenses: [
      expense({ id: "e1", accountId: "c1", description: "Mercury Drug run", purchaseDate: "2026-11-23", amount: 420.5 }),
      expense({ id: "e2", accountId: "c1", description: "Grocery top-up", purchaseDate: "2026-11-20", amount: 1800 }),
      expense({ id: "e3", accountId: "c2", description: "Other card purchase", purchaseDate: "2026-11-22", amount: 77 }),
    ],
    incomes: [income({ id: "i1", accountId: "c1", name: "Cashback", date: "2026-11-21", grossIncome: 150 })],
    transfers: [income({ id: "t1", accountId: "c1", name: "Transfer out", date: "2026-11-19", grossIncome: -500 })],
    cardPayments: [income({ id: "p1", accountId: "c1", name: "Card payment", date: "2026-11-18", grossIncome: 3000 })],
  };

  it("account-cards/05#AC7 recent activity lists this account's expenses, income, transfers and card payments, newest first", async () => {
    renderAccounts([credit(), credit2()], { seed });
    fireEvent.click(within(await rail()).getByRole("option", { name: /RCBC Visa Flex Gold/ }));
    const p = await waitFor(() => {
      const el = panel();
      expect(within(el).getByText("Mercury Drug run")).toBeInTheDocument();
      return el;
    });
    const items = within(p).getAllByRole("listitem").map((li) => li.textContent ?? "");
    expect(items[0]).toContain("Mercury Drug run");
    expect(items[0]).toContain("Nov 23");
    expect(items[0]).toMatch(/-₱420\.50|₱-420\.50|\(₱420\.50\)/);
    expect(within(p).queryByText("Other card purchase")).toBeNull();
    expect(within(p).getByText("Cashback")).toBeInTheDocument();
    expect(within(p).getByText("Transfer out")).toBeInTheDocument();
    expect(within(p).getByText("Card payment")).toBeInTheDocument();
  });

  it("account-cards/05#AC7 the records are read for the selected account over a recent date range, through the existing lists", async () => {
    const { expensesList, incomesList } = renderAccounts([credit(), credit2()], { seed });
    await waitFor(() => expect(expensesList).toHaveBeenCalled());
    const params = expensesList.mock.calls[expensesList.mock.calls.length - 1][0] as ListParams;
    expect(params).toMatchObject({ accountId: "c2", rangeEnd: "2026-11-24" }); // BDO Visa Platinum is first in the picker
    expect(params.rangeStart).toBe("2026-08-26"); // 90 days back
    const views = incomesList.mock.calls.map((c) => (c[0] as ListParams).view).sort();
    expect(views).toEqual(expect.arrayContaining(["incomes", "transfers", "creditCardPayments"]));
    for (const c of incomesList.mock.calls) expect((c[0] as ListParams).accountId).toBe("c2");
  });

  it("account-cards/05#AC7 spending shows a line when the account spent in the last 24 days", async () => {
    renderAccounts([credit()], { seed });
    await waitFor(() => expect(within(panel()).getByRole("img", { name: "Spending, last 24 days" })).toBeInTheDocument());
  });

  it("account-cards/05#AC7 an account with no records shows plain empty states and no invented rows", async () => {
    renderAccounts([credit()], { seed: {} });
    expect(await screen.findByText("No recent activity on this account.")).toBeInTheDocument();
    expect(screen.getByText("No spending in the last 24 days.")).toBeInTheDocument();
    expect(within(panel()).queryAllByRole("listitem")).toHaveLength(0);
  });

  it("account-cards/05#AC7 the Wallet source has no sample data", () => {
    const src = readFileSync(join(__dirname, "accounts-wallet-view.tsx"), "utf8") + readFileSync(join(__dirname, "accounts-wallet-model.ts"), "utf8");
    expect(src).not.toMatch(/SM Supermarket|Starbucks|Ramen Nagi|Meralco|MERCH\b|Math\.random/);
  });
});
