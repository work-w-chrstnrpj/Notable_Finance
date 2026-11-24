// Pure rules for the Accounts "Wallet" view: which account is selected, the line under each name
// in the picker, the spending line and the recent activity. Kept apart from the React view so the
// rules are testable. Wording and numbers mirror the approved prototype
// (prototypes/account-cards/index.html); the data is the account's real records.
import { isCreditLikeAccountType } from "@/lib/finance-rules";
import type { Account, ExpenseRecord, IncomeRecord } from "@/types/finance";
import { formatLast4, parseCardNumber } from "@shared/card-number";
import { hasNetwork } from "@/components/ui/account-card/network-mark";
import { dueInfo, nextDueDate, usageRatio } from "./accounts-cards-model";

/** Days the spending line covers (the prototype's "last 24 days"). */
export const SPENDING_DAYS = 24;
/** How far back recent activity looks for the latest records. */
export const ACTIVITY_WINDOW_DAYS = 90;
export const ACTIVITY_LIMIT = 5;

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD in local time, the format the record lists filter on. */
export function isoDay(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function daysAgo(today: Date, days: number): Date {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
}

/** Selection rule: keep the chosen account while it is listed, otherwise the first one listed. */
export function resolveSelection(orderedIds: string[], selectedId: string | null): string | null {
  if (selectedId && orderedIds.includes(selectedId)) return selectedId;
  return orderedIds[0] ?? null;
}

/** Up or down arrow: the neighbouring account, stopping at either end. */
export function stepSelection(orderedIds: string[], currentId: string | null, direction: 1 | -1): string | null {
  if (orderedIds.length === 0) return null;
  const at = currentId ? orderedIds.indexOf(currentId) : -1;
  if (at === -1) return orderedIds[0];
  return orderedIds[Math.max(0, Math.min(orderedIds.length - 1, at + direction))];
}

/** "Dec 11" for the next due date. */
export function shortDueDate(dueDay: number, today: Date): string {
  return nextDueDate(dueDay, today).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** The line under an account's name in the picker: "29% used · due Dec 11", or the network, or the type. */
export function railSubtitle(account: Account, today: Date): string {
  if (isCreditLikeAccountType(account.type)) {
    const used = `${Math.round(usageRatio(account) * 100)}% used`;
    return account.dueDay != null ? `${used} · due ${shortDueDate(account.dueDay, today)}` : used;
  }
  return hasNetwork(account.paymentNetwork) ? account.paymentNetwork! : account.type;
}

/** The line under the account name above the large card: "Credit Account · Visa". */
export function panelSubtitle(account: Account): string {
  const parsed = parseCardNumber(account.cardNumbers);
  return [account.type, hasNetwork(account.paymentNetwork) ? account.paymentNetwork : null, parsed ? formatLast4(parsed) : null]
    .filter(Boolean)
    .join(" · ");
}

export { dueInfo };

/** What an account spent on each of the last `days` days, oldest first. Interest counts as spending. */
export function spendingByDay(expenses: ExpenseRecord[], today: Date, days = SPENDING_DAYS): number[] {
  const index = new Map<string, number>();
  const series = Array.from({ length: days }, (_, i) => {
    index.set(isoDay(daysAgo(today, days - 1 - i)), i);
    return 0;
  });
  for (const e of expenses) {
    const at = index.get((e.purchaseDate ?? "").slice(0, 10));
    if (at !== undefined) series[at] += (e.amount ?? 0) + (e.interest ?? 0);
  }
  return series;
}

/** SVG path for the spending line, scaled to the tallest day. Null when nothing was spent. */
export function sparkPaths(values: number[], width = 560, height = 56): { line: string; area: string } | null {
  const max = Math.max(...values, 0);
  if (values.length < 2 || max <= 0) return null;
  const step = width / (values.length - 1);
  const line = values
    .map((v, i) => `${i ? "L" : "M"}${(i * step).toFixed(1)},${(height - (v / max) * (height - 4) - 2).toFixed(1)}`)
    .join(" ");
  return { line, area: `${line} L${width},${height} L0,${height}Z` };
}

export interface ActivityRow {
  id: string;
  kind: "expense" | "income";
  title: string;
  categoryId: string;
  /** YYYY-MM-DD */
  date: string;
  /** Negative for money out, positive for money in. */
  amount: number;
}

/** The newest records on one account, expenses and income-backed records (income, transfers, card payments) together. */
export function recentActivity(
  expenses: ExpenseRecord[],
  incomes: IncomeRecord[],
  limit = ACTIVITY_LIMIT,
): ActivityRow[] {
  const rows: ActivityRow[] = [
    ...expenses.map<ActivityRow>((e) => ({
      id: `e:${e.id}`,
      kind: "expense",
      title: e.description,
      categoryId: e.categoryId,
      date: (e.purchaseDate ?? "").slice(0, 10),
      amount: -((e.amount ?? 0) + (e.interest ?? 0)),
    })),
    ...incomes
      .filter((i) => !i.deleted)
      .map<ActivityRow>((i) => ({
        id: `i:${i.id}`,
        kind: "income",
        title: i.name,
        categoryId: i.categoryId,
        date: (i.date ?? "").slice(0, 10),
        amount: i.grossIncome ?? 0,
      })),
  ];
  const seen = new Set<string>();
  return rows
    .filter((r) => r.date && !seen.has(r.id) && seen.add(r.id))
    .sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date < b.date ? 1 : -1))
    .slice(0, limit);
}

/** "Nov 24" for an activity row. */
export function activityDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
