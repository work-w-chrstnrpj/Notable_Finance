// Pure rules for the Accounts "Cards" view: grouping, the summary strip and the line under each
// card. Kept apart from the React view so the thresholds are testable. The rules and the wording
// mirror the approved prototype (prototypes/account-cards/index.html).
import { hasNetwork } from "@/components/ui/account-card/network-mark";
import { isCreditLikeAccountType } from "@/lib/finance-rules";
import type { Account } from "@/types/finance";

export type AccountGroupId = "credit" | "debit" | "wallets";

export const ACCOUNT_GROUP_TITLES: Record<AccountGroupId, string> = {
  credit: "Credit",
  debit: "Debit & savings",
  wallets: "Wallets & cash",
};

/** Credit-like accounts, then non-credit accounts that have a payment network, then the rest. */
export function groupAccounts(accounts: Account[]): Array<{ id: AccountGroupId; title: string; accounts: Account[] }> {
  const credit = accounts.filter((a) => isCreditLikeAccountType(a.type));
  const debit = accounts.filter((a) => !isCreditLikeAccountType(a.type) && hasNetwork(a.paymentNetwork));
  const wallets = accounts.filter((a) => !isCreditLikeAccountType(a.type) && !hasNetwork(a.paymentNetwork));
  const groups: Array<{ id: AccountGroupId; accounts: Account[] }> = [
    { id: "credit", accounts: credit },
    { id: "debit", accounts: debit },
    { id: "wallets", accounts: wallets },
  ];
  return groups.filter((g) => g.accounts.length > 0).map((g) => ({ ...g, title: ACCOUNT_GROUP_TITLES[g.id] }));
}

/** Amount owed on a credit-like account: the same figure the card face shows. */
export function amountOwed(account: Account): number {
  return Math.max(0, -account.currentBalance);
}

/** Share of the credit limit in use, 0 to 1 (0 when there is no limit). */
export function usageRatio(account: Account): number {
  const limit = account.creditLimit ?? 0;
  if (limit <= 0) return 0;
  return Math.min(1, amountOwed(account) / limit);
}

export type UsageTone = "green" | "amber" | "rose";

/** Green under 30%, amber under 70%, red from 70%. */
export function usageTone(ratio: number): UsageTone {
  if (ratio >= 0.7) return "rose";
  if (ratio >= 0.3) return "amber";
  return "green";
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** The next date a given day of the month falls on, today included. Short months clamp to their last day. */
export function nextDueDate(dueDay: number, today: Date): Date {
  const base = startOfDay(today);
  const clamp = (year: number, month: number) => {
    const last = new Date(year, month + 1, 0).getDate();
    return new Date(year, month, Math.min(dueDay, last));
  };
  const thisMonth = clamp(base.getFullYear(), base.getMonth());
  return thisMonth >= base ? thisMonth : clamp(base.getFullYear(), base.getMonth() + 1);
}

export type DueTone = "neutral" | "warn" | "bad";

export interface DueInfo {
  days: number;
  tone: DueTone;
  /** "Due today · Nov 27", "Due tomorrow · Nov 28" or "Due in 5 days · Dec 2". */
  label: string;
}

/** Due pill for a credit account; null when no due day is set. Amber within 7 days, red within 3. */
export function dueInfo(account: Account, today: Date): DueInfo | null {
  if (account.dueDay == null) return null;
  const due = nextDueDate(account.dueDay, today);
  const days = Math.round((due.getTime() - startOfDay(today).getTime()) / 86_400_000);
  const when = due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const text = days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : `Due in ${days} days`;
  return { days, tone: days <= 3 ? "bad" : days <= 7 ? "warn" : "neutral", label: `${text} · ${when}` };
}

export function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

export interface CardsSummary {
  cashFlow: number;
  creditCount: number;
  nonCreditCount: number;
  totalOwed: number;
  /** Total credit limit of the credit accounts shown. */
  totalLimit: number;
  /** Overall usage 0 to 1, or null when no credit account with a limit is shown. */
  usage: number | null;
  nextDue: { name: string; info: DueInfo } | null;
}

/** Figures for the strip above the cards, from exactly the accounts the page is showing. */
export function summarize(accounts: Account[], today: Date): CardsSummary {
  const credit = accounts.filter((a) => isCreditLikeAccountType(a.type));
  const other = accounts.filter((a) => !isCreditLikeAccountType(a.type));
  const totalOwed = credit.reduce((s, a) => s + amountOwed(a), 0);
  const totalLimit = credit.reduce((s, a) => s + (a.creditLimit ?? 0), 0);
  let nextDue: CardsSummary["nextDue"] = null;
  for (const a of credit) {
    const info = dueInfo(a, today);
    if (info && (!nextDue || info.days < nextDue.info.days)) nextDue = { name: a.name, info };
  }
  return {
    cashFlow: other.reduce((s, a) => s + a.currentBalance, 0),
    creditCount: credit.length,
    nonCreditCount: other.length,
    totalOwed,
    totalLimit,
    usage: totalLimit > 0 ? Math.min(1, totalOwed / totalLimit) : null,
    nextDue,
  };
}
