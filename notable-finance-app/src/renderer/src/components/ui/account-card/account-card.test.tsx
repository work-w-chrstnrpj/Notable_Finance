// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { account } from "../../../../../../test/factories";
import type { Account } from "@/types/finance";
import { AccountCard } from "./account-card";

const credit = (over: Partial<Account> = {}): Account =>
  account({
    name: "RCBC Gold Mastercard",
    type: "Credit Account",
    paymentNetwork: "Mastercard",
    currentBalance: -85133.01,
    creditLimit: 1924000,
    availableLimit: 1838866.99,
    billingDay: 12,
    dueDay: 27,
    totalIncomes: 412000,
    totalExpenses: 497133.01,
    creditPoints: 18420,
    ...over,
  }) as Account;

const savings = (over: Partial<Account> = {}): Account =>
  account({ name: "BDO Savings", type: "Savings", paymentNetwork: "Visa", currentBalance: 284310.42, ...over }) as Account;

const wrap = () => screen.getByTestId("account-card");
const front = () => wrap().querySelector('[data-face="front"]') as HTMLElement;
const back = () => wrap().querySelector('[data-face="back"]') as HTMLElement;

const realMatchMedia = window.matchMedia;
afterEach(() => {
  vi.restoreAllMocks();
  window.matchMedia = realMatchMedia;
});

describe("account-cards/03 account card", () => {
  it("account-cards/03#AC1 the front shows name, type, masked number and the Profile name; the back shows the statement", () => {
    render(<AccountCard account={credit({ cardNumbers: "16, 4056" })} />);
    const f = within(front());
    expect(f.getByText("RCBC Gold Mastercard")).toBeInTheDocument();
    expect(f.getByText("Credit Account")).toBeInTheDocument();
    expect(f.getByText("•••• •••• •••• 4056")).toBeInTheDocument();
    expect(f.getByText("Local User")).toBeInTheDocument(); // Profile display name default
    const b = within(back());
    for (const label of ["Credit limit", "Available", "Payments made", "Purchases", "Billing / Due", "Points"]) {
      expect(b.getByText(label)).toBeInTheDocument();
    }
    expect(b.getByText("12th / 27th")).toBeInTheDocument();
    expect(b.getByText("18,420")).toBeInTheDocument();
  });

  it("account-cards/03#AC1 a non-credit back shows balance and type, and a custom cardholder replaces the Profile name", () => {
    render(<AccountCard account={savings()} cardholder="Chris P" />);
    expect(within(front()).getByText("Chris P")).toBeInTheDocument();
    expect(within(back()).getByText("Type")).toBeInTheDocument();
    expect(within(back()).getByText("Savings")).toBeInTheDocument();
    expect(within(back()).queryByText("Credit limit")).toBeNull();
  });

  it("account-cards/03#AC2 a credit-like account shows the amount owed on the face", () => {
    for (const type of ["Credit Account", "e-Credit", "BNPL"] as const) {
      const { unmount } = render(<AccountCard account={credit({ type })} />);
      expect(within(front()).getByText("Amount owed")).toBeInTheDocument();
      expect(within(front()).getByText("₱85,133.01")).toBeInTheDocument();
      unmount();
    }
  });

  it("account-cards/03#AC2 other accounts show their balance, not an amount owed", () => {
    render(<AccountCard account={savings()} />);
    expect(within(front()).getByText("Balance")).toBeInTheDocument();
    expect(within(front()).getByText("₱284,310.42")).toBeInTheDocument();
    expect(within(front()).queryByText("Amount owed")).toBeNull();
  });

  it("account-cards/03#AC3 Visa, Mastercard, Amex, JCB and UnionPay each show their mark", () => {
    const cases: Array<[string, string]> = [
      ["Visa", "Visa"],
      ["Mastercard", "Mastercard"],
      ["Master Card", "Mastercard"],
      ["Amex", "American Express"],
      ["American Express", "American Express"],
      ["JCB", "JCB"],
      ["UnionPay", "UnionPay"],
    ];
    for (const [network, mark] of cases) {
      const { unmount } = render(<AccountCard account={credit({ paymentNetwork: network })} />);
      expect(within(front()).getByRole("img", { name: mark })).toBeInTheDocument();
      unmount();
    }
  });

  it("account-cards/03#AC3 the American Express mark is plain text with no colored box", () => {
    render(<AccountCard account={credit({ paymentNetwork: "American Express" })} />);
    const mark = within(front()).getByRole("img", { name: "American Express" });
    expect(mark.textContent).toMatch(/^AMERICAN\s*EXPRESS$/);
    expect([...mark.querySelectorAll("text")].map((n) => n.textContent)).toEqual(["AMERICAN", "EXPRESS"]);
    expect(mark.querySelector("rect")).toBeNull();
  });

  it("account-cards/03#AC3 an empty network shows the quiet Set network state and an unknown one shows its text, with no mark", () => {
    const { unmount } = render(<AccountCard account={credit({ paymentNetwork: null })} />);
    expect(within(front()).getByText("+ Set network")).toBeInTheDocument();
    expect(within(front()).queryByRole("img")).toBeNull();
    unmount();

    render(<AccountCard account={credit({ paymentNetwork: "BancNet" })} />);
    expect(within(front()).getByText("BancNet")).toBeInTheDocument();
    expect(within(front()).queryByRole("img", { name: /visa|mastercard|american|jcb|unionpay/i })).toBeNull();
    expect(within(front()).getByText("RCBC Gold Mastercard")).toBeInTheDocument(); // page still renders
  });

  it("account-cards/03#AC3 an account with no network and no credit uses the plain look with the quiet chip", () => {
    render(<AccountCard account={account({ name: "Cash Wallet", type: "Cash", paymentNetwork: null, cardNumbers: null, currentBalance: 3250 }) as Account} />);
    expect(within(front()).getByText("+ Set network")).toBeInTheDocument();
    expect(within(front()).getByText("₱3,250.00")).toBeInTheDocument();
  });

  it("account-cards/03#AC3 a Payment Network of N/A shows No Available Network in the dotted chip, never Set network", () => {
    for (const value of ["N/A", "n/a", "NA"]) {
      const { unmount } = render(<AccountCard account={account({ name: "Cash Wallet", type: "Cash", paymentNetwork: value, currentBalance: 10 }) as Account} />);
      expect(within(front()).getByText("No Available Network")).toBeInTheDocument();
      expect(within(front()).queryByText("+ Set network")).toBeNull();
      expect(within(front()).queryByText(value)).toBeNull();
      expect(within(front()).queryByRole("img")).toBeNull();
      unmount();
    }
    render(<AccountCard account={credit({ paymentNetwork: "N/A" })} />);
    expect(within(front()).getByText("No Available Network")).toBeInTheDocument();
  });

  it("account-cards/11#AC1 a value of 16, 4056 shows 12 dots then 4056 in four groups on the card", () => {
    render(<AccountCard account={credit({ cardNumbers: "16, 4056" })} />);
    expect(within(front()).getByText("•••• •••• •••• 4056")).toBeInTheDocument();
  });

  it("account-cards/11#AC2 a 15-digit number groups 4-6-5 and a 14-digit one 4-6-4 on the card", () => {
    const { unmount } = render(<AccountCard account={credit({ cardNumbers: "15, 1005", paymentNetwork: "Amex" })} />);
    expect(within(front()).getByText("•••• •••••• •1005")).toBeInTheDocument();
    unmount();
    render(<AccountCard account={credit({ cardNumbers: "14, 0004" })} />);
    expect(within(front()).getByText("•••• •••••• 0004")).toBeInTheDocument();
  });

  it("account-cards/11#AC3 with no value, or an invalid one, no number line is drawn and the cardholder stays", () => {
    for (const cardNumbers of [null, "", "abc", "16, 40", "8, 4056"]) {
      const { unmount } = render(<AccountCard account={credit({ cardNumbers })} />);
      expect(within(front()).queryByText(/•/)).toBeNull();
      expect(within(front()).getByText("Local User")).toBeInTheDocument(); // cardholder line keeps its place
      expect(within(front()).getByRole("img", { name: "Mastercard" })).toBeInTheDocument(); // network mark too
      unmount();
    }
  });

  it("account-cards/11#AC7 the number renders cleanly on the front, the flipped back, the plain look and with the American Express text mark", () => {
    const { unmount } = render(<AccountCard account={credit({ cardNumbers: "16, 4056" })} />);
    fireEvent.click(wrap());
    expect(within(back()).getByText("Credit limit")).toBeInTheDocument();
    expect(within(back()).queryByText(/•/)).toBeNull(); // the number lives on the front only
    expect(within(front()).getByText("•••• •••• •••• 4056")).toBeInTheDocument();
    unmount();

    const plain = render(<AccountCard account={account({ name: "Cash Wallet", type: "Cash", paymentNetwork: null, cardNumbers: null, currentBalance: 10 }) as Account} />);
    expect(within(front()).queryByText(/•/)).toBeNull();
    expect(within(front()).getByText("+ Set network")).toBeInTheDocument();
    plain.unmount();

    render(<AccountCard account={credit({ cardNumbers: "15, 1005", paymentNetwork: "American Express" })} />);
    expect(within(front()).getByText("•••• •••••• •1005")).toBeInTheDocument();
    expect(within(front()).getByRole("img", { name: "American Express" })).toBeInTheDocument();
  });

  it("account-cards/03#AC4 Glass, Metal and Matte are each applied, and the default is Glass", () => {
    const { rerender } = render(<AccountCard account={savings()} />);
    expect(wrap()).toHaveAttribute("data-finish", "glass");
    for (const finish of ["metal", "matte", "glass"] as const) {
      rerender(<AccountCard account={savings()} finish={finish} />);
      expect(wrap()).toHaveAttribute("data-finish", finish);
    }
  });

  it("account-cards/03#AC4 the color comes from the saved choice, then Auto; an explicit color wins", () => {
    const { rerender } = render(<AccountCard account={savings()} colorName="Red" />);
    expect(wrap().style.getPropertyValue("--c1")).toBe("#991b1b");
    rerender(<AccountCard account={savings({ type: "Cash" })} />); // Auto: Cash is Graphite
    expect(wrap().style.getPropertyValue("--c1")).toBe("#3f3f46");
  });

  it("account-cards/03#AC5 Yellow, Silver and White use dark text and a dark Visa mark; Red stays light", () => {
    for (const name of ["Yellow", "Silver", "White"]) {
      const { unmount } = render(<AccountCard account={savings()} colorName={name} />);
      expect(wrap().style.getPropertyValue("--ink-on")).toBe("#1c1917");
      const visa = within(front()).getByRole("img", { name: "Visa" });
      expect(visa.querySelector("text")).toHaveAttribute("fill", "currentColor"); // follows the dark text color
      unmount();
    }
    render(<AccountCard account={savings()} colorName="Red" />);
    expect(wrap().style.getPropertyValue("--ink-on")).toBe("#fff");
  });

  it("account-cards/03#AC6 click flips the card to the statement and back; the hidden face is hidden from assistive tech", () => {
    render(<AccountCard account={credit()} />);
    expect(wrap()).toHaveAttribute("aria-pressed", "false");
    expect(back()).toHaveAttribute("aria-hidden", "true");
    expect(front()).toHaveAttribute("aria-hidden", "false");
    fireEvent.click(wrap());
    expect(wrap()).toHaveAttribute("aria-pressed", "true");
    expect(back()).toHaveAttribute("aria-hidden", "false");
    expect(front()).toHaveAttribute("aria-hidden", "true");
    fireEvent.keyDown(wrap(), { key: "Enter" });
    expect(wrap()).toHaveAttribute("aria-pressed", "false");
  });

  it("account-cards/03#AC6 hover tilts the card and moves the glare; leaving resets it", () => {
    render(<AccountCard account={credit()} />);
    vi.spyOn(wrap(), "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 400, height: 250, right: 400, bottom: 250, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.pointerMove(wrap(), { clientX: 400, clientY: 0 });
    const tilt = wrap().firstElementChild as HTMLElement;
    expect(tilt.style.getPropertyValue("--ry")).toBe("8.00deg");
    expect(tilt.style.getPropertyValue("--rx")).toBe("6.00deg");
    expect(wrap().style.getPropertyValue("--mx")).toBe("100%");
    fireEvent.pointerLeave(wrap());
    expect(tilt.style.getPropertyValue("--ry")).toBe("");
  });

  it("account-cards/03#AC6 with reduced motion on, hovering does not tilt or move the glare", () => {
    window.matchMedia = ((q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as typeof window.matchMedia;
    render(<AccountCard account={credit()} />);
    vi.spyOn(wrap(), "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, width: 400, height: 250, right: 400, bottom: 250, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.pointerMove(wrap(), { clientX: 400, clientY: 0 });
    expect((wrap().firstElementChild as HTMLElement).style.getPropertyValue("--ry")).toBe("");
    expect(wrap().style.getPropertyValue("--mx")).toBe("");
  });

  it("account-cards/03#AC6 the motion CSS switches tilt, flip animation and glare off under reduced motion", () => {
    const css = readFileSync(resolve(__dirname, "account-card.module.css"), "utf8");
    const block = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(block).toMatch(/\.tilt[\s\S]*\.flipper[\s\S]*transition:\s*none/);
    expect(block).toMatch(/\.glare[\s\S]*display:\s*none/);
  });

  it("account-cards/03#AC7 the card sizes itself from its container: a fluid ratio box and container-unit type, no fixed pixel text", () => {
    // Layout can't be measured in jsdom; this guards the technique the prototype uses.
    const css = readFileSync(resolve(__dirname, "account-card.module.css"), "utf8");
    expect(css).toMatch(/container-type:\s*inline-size/);
    expect(css).toMatch(/aspect-ratio:\s*1\.586/);
    expect(css).toMatch(/font-size:\s*5\.2cqw/);
    const fontSizes = [...css.matchAll(/font-size:\s*([^;]+);/g)].map((m) => m[1]);
    expect(fontSizes.length).toBeGreaterThan(8);
    expect(fontSizes.every((s) => s.endsWith("cqw"))).toBe(true);
  });

  it("account-cards/03#AC8 double-click asks the parent to open the account; no card is flippable when the parent owns the click", () => {
    const onOpen = vi.fn();
    const acct = credit();
    const { rerender } = render(<AccountCard account={acct} onOpen={onOpen} />);
    fireEvent.doubleClick(wrap());
    expect(onOpen).toHaveBeenCalledWith(acct);
    rerender(<AccountCard account={acct} flippable={false} />);
    fireEvent.click(wrap());
    expect(back()).toHaveAttribute("aria-hidden", "true");
  });

  it("account-cards/03#AC9 the back's three rows and the hint fit inside the card height (nothing cut off)", () => {
    // Layout can't be measured in jsdom; add up the container-unit budget from the CSS instead.
    const css = readFileSync(resolve(__dirname, "account-card.module.css"), "utf8");
    const num = (re: RegExp) => parseFloat(css.match(re)?.[1] ?? "NaN");
    const cardHeight = 100 / 1.586;
    const padTop = num(/\.bc\s*{[^}]*?padding:\s*([\d.]+)cqw/);
    const rowGap = num(/\.bc\s*{[^}]*?gap:\s*([\d.]+)cqw/);
    const label = num(/\.bk\s*{[^}]*?font-size:\s*([\d.]+)cqw/);
    const value = num(/\.bv\s*{[^}]*?font-size:\s*([\d.]+)cqw/);
    const hintBottom = num(/\.hint\s*{[^}]*?bottom:\s*([\d.]+)cqw/);
    const hintSize = num(/\.hint\s*{[^}]*?font-size:\s*([\d.]+)cqw/);
    const rows = 3 * ((label + value) * 1.2 + 0.4) + 2 * rowGap;
    expect(css).toMatch(/\.hint\s*{[^}]*position:\s*absolute/);
    expect(padTop + rows).toBeLessThan(cardHeight - hintBottom - hintSize * 1.2);
  });
});
