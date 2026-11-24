// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderPage } from "../../../../../../test/render-page";
import { ok } from "../../../../../../test/mock-window-api";
import { DEFAULT_SETTINGS } from "@/lib/ui-settings-context";
import { SettingsPage } from "../settings";
import { AccountCardsModal } from "./account-cards-modal";

const acct = (over: Record<string, unknown>) => ({
  id: "a", name: "Account", type: "Credit Account", icon: null, information: "", startingBalance: 0, currentBalance: -1000,
  creditLimit: 5000, availableLimit: 4000, creditPoints: null, annualFee: null, paymentNetwork: "Visa", billingDay: 1, dueDay: 15,
  totalIncomes: null, totalExpenses: null, totalPasabuy: null, totalCcDebtTransfer: null, qrCode: null, inactive: false, notionSynced: true,
  ...over,
});
const accounts = [
  acct({ id: "a1", name: "BDO Visa Platinum" }),
  acct({ id: "a2", name: "Cash Wallet", type: "Cash", paymentNetwork: null }),
  acct({ id: "a3", name: "Old Card", inactive: true }),
  acct({ id: "a4", name: "Seed only", notionSynced: false }),
  acct({ id: "a5", name: "Borrow Aux", type: "Auxiliary" }),
];

/** A settings API that behaves like the main process: it keeps the last saved state and echoes it back. */
function fakeSettings(initial: Partial<typeof DEFAULT_SETTINGS> = {}) {
  let saved = { ...DEFAULT_SETTINGS, ...initial };
  const update = vi.fn(async (patch: Record<string, unknown>) => {
    const colors: Record<string, string> = { ...saved.accountColors };
    const custom = new Set(saved.customAccountColors);
    const pc = patch.accountColors as Record<string, string | null> | undefined;
    if (pc) for (const [id, v] of Object.entries(pc)) {
      if (v === null) { delete colors[id]; custom.delete(id); } else { colors[id] = v; custom.add(id); }
    }
    saved = { ...saved, ...(patch.cardFinish ? { cardFinish: patch.cardFinish as typeof saved.cardFinish } : {}), accountColors: colors, customAccountColors: [...custom] };
    return ok(saved);
  });
  const get = vi.fn(async () => ok(saved));
  return { api: { get, update } as never, update, current: () => saved };
}

async function open(initial: Partial<typeof DEFAULT_SETTINGS> = {}) {
  const s = fakeSettings(initial);
  renderPage(<AccountCardsModal onClose={vi.fn()} />, {
    apiOverrides: { settings: s.api, accounts: { list: vi.fn(async () => ok(accounts)) } as never },
  });
  await screen.findByText("BDO Visa Platinum");
  return s;
}
const row = (name: string) => screen.getByText(name).closest("[data-account-id]") as HTMLElement;

describe("account-cards/06 Settings: card finish and account colors", () => {
  it("account-cards/06#AC2 choosing a finish saves it and marks it chosen; every card preview follows", async () => {
    const s = await open();
    const matte = screen.getByRole("button", { name: "Matte finish" });
    expect(screen.getByRole("button", { name: "Glass finish" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(matte);
    await waitFor(() => expect(matte).toHaveAttribute("aria-pressed", "true"));
    expect(s.update).toHaveBeenCalledWith({ cardFinish: "matte" });
    expect(s.current().cardFinish).toBe("matte");
    // The three previews each render their own finish.
    const finishes = screen.getAllByTestId("account-card").map((c) => c.getAttribute("data-finish"));
    expect(finishes).toEqual(["glass", "metal", "matte"]);
  });

  it("account-cards/06#AC3 choosing a swatch saves the color for that account and shows it as Custom; Auto goes back", async () => {
    const s = await open({ accountColors: { a1: "Forest" } });
    const r = within(row("BDO Visa Platinum"));
    expect(r.getByText(/Auto · Forest/)).toBeInTheDocument();
    fireEvent.click(r.getByRole("button", { name: "Purple" }));
    await waitFor(() => expect(r.getByText(/Custom · Purple/)).toBeInTheDocument());
    expect(s.update).toHaveBeenCalledWith({ accountColors: { a1: "Purple" } });
    expect(r.getByRole("button", { name: "Purple" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(r.getByRole("button", { name: "Auto" }));
    expect(s.update).toHaveBeenLastCalledWith({ accountColors: { a1: null } });
    await waitFor(() => expect(r.getByText(/^Auto ·/)).toBeInTheDocument());
    expect(r.getByRole("button", { name: "Auto" })).toHaveAttribute("aria-pressed", "true");
  });

  it("account-cards/06#AC3 a color change survives reopening (it is read back from saved settings)", async () => {
    const s = fakeSettings();
    const first = renderPage(<AccountCardsModal onClose={vi.fn()} />, {
      apiOverrides: { settings: s.api, accounts: { list: vi.fn(async () => ok(accounts)) } as never },
    });
    await screen.findByText("Cash Wallet");
    fireEvent.click(within(row("Cash Wallet")).getByRole("button", { name: "Teal" }));
    await waitFor(() => expect(s.current().accountColors.a2).toBe("Teal"));
    first.unmount();
    renderPage(<AccountCardsModal onClose={vi.fn()} />, {
      apiOverrides: { settings: s.api, accounts: { list: vi.fn(async () => ok(accounts)) } as never },
    });
    await screen.findByText("Cash Wallet");
    await waitFor(() => expect(within(row("Cash Wallet")).getByText(/Custom · Teal/)).toBeInTheDocument());
  });

  it("account-cards/06#AC4 every swatch, including Auto, carries its name for the instant tooltip and for keyboard focus", async () => {
    await open();
    const r = within(row("BDO Visa Platinum"));
    const names = r.getAllByRole("button").map((b) => b.getAttribute("data-name"));
    expect(names).toEqual([
      "Auto", "Red", "Orange", "Yellow", "Green", "Forest", "Teal", "Sky", "Blue", "Navy",
      "Purple", "Pink", "Ruby", "Gold", "Brown", "Black", "Graphite", "Silver", "White",
    ]);
    const yellow = r.getByRole("button", { name: "Yellow" });
    expect(yellow).toHaveAttribute("data-name", "Yellow");
    yellow.focus();
    expect(yellow).toHaveFocus(); // a real button: reachable by keyboard, tooltip shows on :focus-visible
    // The tooltip is pure CSS from data-name, shown on hover and focus-visible, with no delay.
    const css = readFileSync(resolve(__dirname, "account-cards-modal.module.css"), "utf8");
    expect(css).toMatch(/\.sw::after\s*{\s*content:\s*attr\(data-name\)/);
    expect(css).toMatch(/\.sw:hover::after[\s\S]*\.sw:focus-visible::after/);
  });

  it("account-cards/06#AC5 each row says Auto or Custom and the current color name", async () => {
    await open({ accountColors: { a1: "Ruby", a2: "Graphite" }, customAccountColors: ["a1"] });
    expect(within(row("BDO Visa Platinum")).getByText("Custom · Ruby")).toBeInTheDocument();
    expect(within(row("Cash Wallet")).getByText("Auto · Graphite")).toBeInTheDocument();
  });

  it("account-cards/06#AC5 an account with no saved color shows the color Auto would pick", async () => {
    await open();
    expect(within(row("Cash Wallet")).getByText("Auto · Graphite")).toBeInTheDocument(); // Cash starts at Graphite
    expect(within(row("BDO Visa Platinum")).getByText(/^Auto · \w+$/)).toBeInTheDocument();
  });

  it("account-cards/06#AC7 only active Notion accounts are listed, and nothing can add or delete one", async () => {
    await open();
    expect(screen.queryByText("Old Card")).toBeNull(); // inactive
    expect(screen.queryByText("Seed only")).toBeNull(); // not from Notion
    expect(screen.queryByText("Borrow Aux")).toBeNull(); // auxiliary
    expect(screen.queryByRole("button", { name: /add|delete|remove|new/i })).toBeNull();
  });
});

describe("account-cards/06 Settings page entry", () => {
  it("account-cards/06#AC6 Appearance has an Accounts entry that opens the dialog, reachable by button, and Done closes it", async () => {
    const s = fakeSettings();
    renderPage(<SettingsPage schemaHealth={null as never} onSchemaVerify={vi.fn()} showFab={true} onShowFabChange={vi.fn()} />, { apiOverrides: { settings: s.api, accounts: { list: vi.fn(async () => ok(accounts)) } as never } });
    await screen.findByText("Profile");
    fireEvent.click(screen.getByRole("button", { name: /Appearance/ }));
    expect(await screen.findByText("Account cards")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /Customize/ }).slice(-1)[0]);
    expect(await screen.findByRole("dialog", { name: "Settings · Accounts" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
