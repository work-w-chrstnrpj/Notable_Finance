// @vitest-environment jsdom
// account-cards/04: the Cards view replaces the old Cards view on the Accounts page.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderPage } from "../../../../../test/render-page";
import { ok } from "../../../../../test/mock-window-api";
import { account } from "../../../../../test/factories";
import { DEFAULT_SETTINGS } from "@/lib/ui-settings-context";
import type { Account } from "@/types/finance";
import { AccountsPage } from "./accounts";
import { dueInfo, groupAccounts, nextDueDate, summarize, usageRatio, usageTone } from "./accounts-cards-model";

const TODAY = new Date(2026, 10, 24); // Nov 24, 2026

const credit = (over: Partial<Account> = {}): Account =>
  account({
    id: "c1",
    name: "RCBC Gold Mastercard",
    type: "Credit Account",
    paymentNetwork: "Mastercard",
    currentBalance: -85133.01,
    creditLimit: 1924000,
    availableLimit: 1838866.99,
    billingDay: 12,
    dueDay: 27,
    ...over,
  }) as Account;
const debit = (over: Partial<Account> = {}): Account =>
  account({ id: "d1", name: "BDO Savings", type: "Savings", paymentNetwork: "Visa", currentBalance: 284310.42, ...over }) as Account;
const wallet = (over: Partial<Account> = {}): Account =>
  account({ id: "w1", name: "GCash", type: "e-Wallet", paymentNetwork: null, cardNumbers: null, currentBalance: 6840.25, ...over }) as Account;

function renderAccounts(accounts: Account[], accountsFilters: Partial<typeof DEFAULT_SETTINGS.accountsFilters> = {}) {
  const update = vi.fn(async (patch: object) => ok({ ...DEFAULT_SETTINGS, ...patch }));
  const view = renderPage(<AccountsPage />, {
    apiOverrides: {
      accounts: { list: vi.fn(async () => ok(accounts)) },
      categories: { income: vi.fn(async () => ok([])), expense: vi.fn(async () => ok([])) },
      incomes: { list: vi.fn(async () => ok([])) },
      expenses: { list: vi.fn(async () => ok([])), listForCCCoverage: vi.fn(async () => ok([])) },
      settings: {
        get: vi.fn(async () => ok({ ...DEFAULT_SETTINGS, accountsFilters: { ...DEFAULT_SETTINGS.accountsFilters, accountScope: "all" as const, ...accountsFilters } })),
        update,
      },
    },
  });
  return { ...view, update };
}
const usedText = (text: string) => screen.getByText((_, el) => el?.tagName === "SPAN" && el.textContent === text);
const cardCount = () => screen.queryAllByTestId("account-card").length;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(TODAY);
});
afterEach(() => vi.useRealTimers());

describe("account-cards/04 the pure rules", () => {
  it("account-cards/04#AC5 usage bar tone is green under 30%, amber under 70%, red from 70%", () => {
    expect(usageTone(0)).toBe("green");
    expect(usageTone(0.299)).toBe("green");
    expect(usageTone(0.3)).toBe("amber");
    expect(usageTone(0.699)).toBe("amber");
    expect(usageTone(0.7)).toBe("rose");
    expect(usageTone(1)).toBe("rose");
  });

  it("account-cards/04#AC5 the due pill is amber within 7 days, red within 3, and reads like the prototype", () => {
    const at = (dueDay: number) => dueInfo(credit({ dueDay }), TODAY)!;
    expect(at(24)).toMatchObject({ days: 0, tone: "bad", label: "Due today · Nov 24" });
    expect(at(25)).toMatchObject({ days: 1, tone: "bad", label: "Due tomorrow · Nov 25" });
    expect(at(27)).toMatchObject({ days: 3, tone: "bad", label: "Due in 3 days · Nov 27" });
    expect(at(28)).toMatchObject({ days: 4, tone: "warn" });
    expect(at(1)).toMatchObject({ days: 7, tone: "warn", label: "Due in 7 days · Dec 1" });
    expect(at(2)).toMatchObject({ days: 8, tone: "neutral", label: "Due in 8 days · Dec 2" });
  });

  it("account-cards/04#AC5 a due day that already passed this month rolls to next month, and short months clamp", () => {
    expect(nextDueDate(5, TODAY).getMonth()).toBe(11);
    expect(nextDueDate(31, new Date(2026, 1, 10))).toEqual(new Date(2026, 1, 28));
  });

  it("account-cards/04#AC5 a zero limit or no due day cannot divide by zero or throw", () => {
    expect(usageRatio(credit({ creditLimit: 0 }))).toBe(0);
    expect(usageRatio(credit({ creditLimit: null }))).toBe(0);
    expect(dueInfo(credit({ dueDay: null }), TODAY)).toBeNull();
  });

  it("account-cards/04#AC4 the summary is built only from the accounts it is given", () => {
    const a = credit({ currentBalance: -300, creditLimit: 1000, dueDay: 28 });
    const b = credit({ id: "c2", name: "BPI Amex", currentBalance: -100, creditLimit: 1000, dueDay: 25 });
    const s = summarize([a, b, debit({ currentBalance: 50 }), wallet({ currentBalance: 25 })], TODAY);
    expect(s).toMatchObject({ cashFlow: 75, creditCount: 2, nonCreditCount: 2, totalOwed: 400, totalLimit: 2000, usage: 0.2 });
    expect(s.nextDue?.name).toBe("BPI Amex");
    const none = summarize([debit()], TODAY);
    expect(none).toMatchObject({ creditCount: 0, usage: null, nextDue: null });
  });

  it("account-cards/03#AC3 an account whose Payment Network is N/A groups with the wallets, not with debit and savings", () => {
    const groups = groupAccounts([debit({ paymentNetwork: "N/A" }), debit({ id: "d2", name: "Real Visa" })]);
    expect(groups.map((g) => g.id)).toEqual(["debit", "wallets"]);
    expect(groups[1].accounts[0].paymentNetwork).toBe("N/A");
  });

  it("account-cards/04#AC1 accounts group as Credit, Debit & savings, Wallets & cash, in that order", () => {
    const groups = groupAccounts([wallet(), debit(), credit()]);
    expect(groups.map((g) => g.title)).toEqual(["Credit", "Debit & savings", "Wallets & cash"]);
    expect(groupAccounts([wallet()]).map((g) => g.id)).toEqual(["wallets"]);
  });
});

describe("account-cards/04 the Accounts page", () => {
  it("account-cards/04#AC1 the Cards view shows the summary strip, the three groups and a card with its meta line per account", async () => {
    renderAccounts([credit(), debit(), wallet()]);
    await screen.findAllByTestId("account-card");
    expect(cardCount()).toBe(3);
    for (const title of ["Credit", "Debit & savings", "Wallets & cash"]) {
      expect(screen.getByRole("heading", { name: new RegExp(title) })).toBeInTheDocument();
    }
    const strip = screen.getByLabelText("Accounts summary");
    for (const label of ["Total cash flow", "Total owed on credit", "Overall utilization", "Next payment due"]) {
      expect(within(strip).getByText(label)).toBeInTheDocument();
    }
    expect(usedText("4% used")).toBeInTheDocument();
    expect(screen.getByText("Billing 12th")).toBeInTheDocument();
    expect(screen.getByText("Visa debit")).toBeInTheDocument();
    expect(screen.getByText("No network")).toBeInTheDocument();
  });

  it("account-cards/04#AC2 the switch shows Table then Cards (then Wallet, ticket 05) and the choice is saved", async () => {
    const { update } = renderAccounts([credit()]);
    await screen.findAllByTestId("account-card");
    const labels = within(screen.getByLabelText("Account view")).getAllByRole("button").map((b) => b.textContent);
    expect(labels).toEqual(["Table", "Cards", "Wallet"]); // Wallet joined the switch in account-cards/05
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    await waitFor(() => expect(cardCount()).toBe(0));
    await waitFor(() => expect(update).toHaveBeenCalledWith(expect.objectContaining({ accountsFilters: expect.objectContaining({ viewMode: "table" }) })));
  });

  it("account-cards/04#AC2 a saved Table choice is restored on the next start", async () => {
    renderAccounts([credit()], { viewMode: "table" });
    expect(await screen.findByRole("columnheader", { name: /Account/ })).toBeInTheDocument();
    expect(cardCount()).toBe(0);
  });

  it("account-cards/04#AC2 the layout shortcut still changes the view (it now cycles Table, Cards, Wallet: ticket 05)", async () => {
    renderAccounts([credit()]);
    await screen.findAllByTestId("account-card");
    fireEvent.keyDown(window, { key: "`", code: "Backquote", ctrlKey: true, altKey: true, metaKey: true });
    // Cards -> Wallet: the card grid is gone and the Wallet picker is there instead.
    expect(await screen.findByRole("listbox", { name: "Accounts" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Accounts summary")).toBeNull();
  });

  it("account-cards/04#AC3 the Table keeps its columns and has no color swatch beside the name", async () => {
    renderAccounts([credit(), debit()], { viewMode: "table", accountScope: "all" });
    const row = await screen.findByRole("row", { name: /BDO Savings/ });
    expect(within(row).getByText("BDO Savings")).toBeInTheDocument();
    expect(row.querySelector('[class*="swatch"]')).toBeNull();
    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent?.trim());
    expect(headers.slice(0, 3).join("|")).toMatch(/Account.*Type.*Balance/);
  });

  it("account-cards/04#AC3 the old Cards view markup and styles are gone", () => {
    const root = resolve(__dirname, "../..");
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(css|tsx)$/.test(name) && !name.endsWith(".test.tsx")) files.push(p);
      }
    };
    walk(root);
    const offenders = files.filter((f) => /account-card--button|account-card__|account-grid/.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
    expect(readFileSync(join(root, "components/pages/accounts.tsx"), "utf8")).not.toMatch(/MoneyLine|account-card--button/);
  });

  it("account-cards/04#AC4 the summary follows the tabs and filters", async () => {
    renderAccounts([credit(), debit({ currentBalance: 1000 }), wallet({ currentBalance: 0 })]);
    await screen.findAllByTestId("account-card");
    const strip = screen.getByLabelText("Accounts summary");
    expect(within(strip).getByText("2 non-credit accounts")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /Hide zero balance/ }));
    await waitFor(() => expect(within(screen.getByLabelText("Accounts summary")).getByText("1 non-credit accounts")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Credit Accounts" }));
    await waitFor(() => expect(within(screen.getByLabelText("Accounts summary")).getByText("0 non-credit accounts")).toBeInTheDocument());
    expect(within(screen.getByLabelText("Accounts summary")).getByText("across 1 cards")).toBeInTheDocument();
  });

  it("account-cards/04#AC5 a credit card with a zero limit and no due day renders without errors", async () => {
    renderAccounts([credit({ creditLimit: 0, availableLimit: 0, dueDay: null, billingDay: null })]);
    await screen.findAllByTestId("account-card");
    expect(usedText("0% used")).toBeInTheDocument();
    expect(screen.queryByText(/^Due /)).toBeNull();
  });

  it("account-cards/04#AC6 the tabs, the card-type filter and hide-zero work in the Cards view", async () => {
    renderAccounts([credit(), debit(), wallet({ currentBalance: 0 })]);
    await screen.findAllByTestId("account-card");
    expect(cardCount()).toBe(3);
    fireEvent.click(screen.getByRole("button", { name: "Credit Accounts" }));
    await waitFor(() => expect(cardCount()).toBe(1));
    fireEvent.click(screen.getByRole("button", { name: "Accounts" }));
    await waitFor(() => expect(cardCount()).toBe(2));
    fireEvent.click(screen.getByRole("checkbox", { name: /Hide zero balance/ }));
    await waitFor(() => expect(cardCount()).toBe(1));
    fireEvent.click(screen.getByRole("button", { name: "All Accounts" }));
    await waitFor(() => expect(cardCount()).toBe(2));
  });

  it("account-cards/04#AC7 a card flips on click and opens the account detail on double-click", async () => {
    renderAccounts([credit()]);
    const card = (await screen.findAllByTestId("account-card"))[0];
    fireEvent.click(card);
    expect(card.className).toMatch(/flipped/);
    fireEvent.doubleClick(card);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("account-cards/04#AC8 there is no control to create or delete an account", async () => {
    renderAccounts([credit(), debit()]);
    await screen.findAllByTestId("account-card");
    expect(screen.queryByRole("button", { name: /add account|new account|create account|delete account|remove account/i })).toBeNull();
  });

  it("account-cards/04#AC9 until a removed marker exists, every synced account is shown as before", async () => {
    renderAccounts([credit(), debit(), credit({ id: "c9", name: "Inactive Card", inactive: true })]);
    await screen.findAllByTestId("account-card");
    expect(cardCount()).toBe(2); // inactive accounts stay hidden, exactly as before this ticket
  });
});
