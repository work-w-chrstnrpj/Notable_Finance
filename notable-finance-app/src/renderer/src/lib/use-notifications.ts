import { useCallback, useEffect, useMemo, useState } from "react";
import { todayIso } from "./date-range";
import { calculateExpectedPaymentDate, isCreditLikeAccountType } from "./finance-rules";
import { formatMoney } from "./format";
import { useAccounts, useExpenses } from "./use-data";
import { useUiSettings } from "./ui-settings-context";
import type { NotificationInbox } from "@shared/notifications";
import type { Account, ExpenseRecord } from "@/types/finance";

/**
 * Workspace notifications.
 *
 * Due reminders are derived here rather than in main: the expected-payment-date formula
 * already lives in the renderer (finance-rules), and the accounts/expenses React Query
 * caches the pages use are reused instead of a second source of truth. Main owns only the
 * error entries and the dismissal list, which have to outlive a window reload.
 */

export type NotificationKind = "account" | "expense" | "error";
export type DueWhen = "today" | "tomorrow";

export interface NotificationItem {
  /** Stable per occurrence — `account:<id>:<date>` — so dismissing one day leaves the next. */
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  /** ISO due date for due reminders; absent on errors. */
  dueDate?: string;
  due?: DueWhen;
  /** Epoch ms an error was last seen. */
  at?: number;
  /** How many times an identical error repeated. */
  count?: number;
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const shifted = new Date(Date.UTC(y, (m ?? 1) - 1, (d ?? 1) + days, 12));
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(shifted.getUTCFullYear(), 4)}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`;
}

function daysInMonth(iso: string): number {
  const [y, m] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m ?? 1, 0, 12)).getUTCDate();
}

/**
 * True when `iso` is the account's statement due date for that month. A due day past the
 * end of a short month lands on the last day, matching how the due date is shown elsewhere.
 */
function isAccountDueOn(account: Account, iso: string): boolean {
  if (account.dueDay == null) return false;
  const day = Number(iso.slice(8, 10));
  return day === Math.min(account.dueDay, daysInMonth(iso));
}

function expenseIsUnsettled(record: ExpenseRecord): boolean {
  return record.paymentStatus === "Unpaid" || record.paymentStatus === "Installment";
}

export interface DueDate {
  iso: string;
  due: DueWhen;
}

export function accountReminders(accounts: Account[], dueWindow: DueDate[]): NotificationItem[] {
  const out: NotificationItem[] = [];
  for (const account of accounts) {
    if (account.inactive || !isCreditLikeAccountType(account.type)) continue;
    for (const { iso, due } of dueWindow) {
      if (!isAccountDueOn(account, iso)) continue;
      out.push({
        id: `account:${account.id}:${iso}`,
        kind: "account",
        title: `${account.name} payment is due ${due}`,
        detail:
          account.currentBalance < 0
            ? `Outstanding balance ${formatMoney(Math.abs(account.currentBalance))}.`
            : "Statement due date reached.",
        dueDate: iso,
        due,
      });
    }
  }
  return out;
}

export function expenseReminders(
  records: Iterable<ExpenseRecord>,
  accountById: Map<string, Account>,
  dueWindow: DueDate[],
): NotificationItem[] {
  const out: NotificationItem[] = [];
  for (const record of records) {
    if (!expenseIsUnsettled(record)) continue;
    const account = accountById.get(record.accountId);
    if (!account || !isCreditLikeAccountType(account.type)) continue;
    const expected = calculateExpectedPaymentDate({
      purchaseDate: record.purchaseDate,
      billingDay: account.billingDay,
      dueDay: account.dueDay,
      periodCount: record.periodCount,
      paymentFrequency: record.paymentFrequency,
      datePaid: record.datePaid,
      bnplAdjustment: record.bnplAdjustment,
    });
    const match = dueWindow.find((entry) => entry.iso === expected);
    if (!match) continue;
    out.push({
      id: `expense:${record.id}:${match.iso}`,
      kind: "expense",
      title: `${record.description} is due ${match.due}`,
      detail: `${record.paymentStatus} on ${account.name} — ${formatMoney(record.amount + record.interest)}.`,
      dueDate: match.iso,
      due: match.due,
    });
  }
  return out;
}

export function useNotifications() {
  const { settings } = useUiSettings();
  const enabled = settings.notificationsEnabled;
  const includeTomorrow = settings.notificationsIncludeTomorrow;

  const accountsState = useAccounts(false);
  // Both views are credit-scoped and carry no date filter, so between them they cover every
  // candidate: `unpaidCc` excludes installments by design, `installments` adds them back.
  const unpaidCc = useExpenses({ expenseViewMode: "unpaidCc" }, { enabled });
  const installments = useExpenses({ expenseViewMode: "installments" }, { enabled });

  const [inbox, setInbox] = useState<NotificationInbox>({ errors: [], dismissedIds: [] });

  const reloadInbox = useCallback(async () => {
    const api = window.api;
    if (!api?.notifications) return;
    const res = await api.notifications.inbox();
    if (res.ok) setInbox(res.data);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void reloadInbox();
    return window.api?.on?.("notifications:changed", () => void reloadInbox());
  }, [enabled, reloadInbox]);

  const dismiss = useCallback(async (id: string) => {
    const api = window.api;
    if (!api?.notifications) return;
    const res = await api.notifications.dismiss(id);
    if (res.ok) setInbox(res.data);
  }, []);

  const items = useMemo<NotificationItem[]>(() => {
    if (!enabled) return [];

    const today = todayIso();
    const dueWindow: DueDate[] = [{ iso: today, due: "today" }];
    if (includeTomorrow) dueWindow.push({ iso: addDays(today, 1), due: "tomorrow" });

    const accounts = accountsState.state.status === "success" ? accountsState.state.data : [];
    const accountById = new Map(accounts.map((account) => [account.id, account]));

    // The two credit views overlap, so de-duplicate by id before deriving reminders.
    const expenses = new Map<string, ExpenseRecord>();
    for (const state of [unpaidCc.state, installments.state]) {
      if (state.status !== "success") continue;
      for (const record of state.data) expenses.set(record.id, record);
    }

    const dismissed = new Set(inbox.dismissedIds);
    const due = [
      ...accountReminders(accounts, dueWindow),
      ...expenseReminders(expenses.values(), accountById, dueWindow),
    ]
      .filter((item) => !dismissed.has(item.id))
      .sort(
        (a, b) =>
          (a.dueDate ?? "").localeCompare(b.dueDate ?? "") || a.title.localeCompare(b.title),
      );

    const errors: NotificationItem[] = inbox.errors.map((entry) => ({
      id: entry.id,
      kind: "error",
      title: entry.source,
      detail: entry.message,
      at: entry.createdAt,
      count: entry.count,
    }));

    return [...errors, ...due];
  }, [enabled, includeTomorrow, accountsState.state, unpaidCc.state, installments.state, inbox]);

  const loading =
    enabled &&
    (accountsState.state.status === "loading" ||
      unpaidCc.state.status === "loading" ||
      installments.state.status === "loading");

  return { items, loading, dismiss, refresh: reloadInbox };
}

/** Sidebar badge count. Shares the hook's queries, so it costs no extra fetch. */
export function useNotificationCount(): number {
  return useNotifications().items.length;
}
