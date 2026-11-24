import { Fragment, useEffect, useId, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import { cardColorByName, isCardColorName } from "@shared/card-colors";
import { AccountCard, NO_NETWORK_LABEL, hasNetwork, isNotApplicable } from "@/components/ui/account-card";
import { CategoryIcon } from "@/components/ui/accounts";
import { useFinanceData } from "@/lib/finance-data-context";
import { isCreditLikeAccountType } from "@/lib/finance-rules";
import { formatMoney } from "@/lib/format";
import { useExpenses, useIncomes, useWorkflowRecords } from "@/lib/use-data";
import { useUiSettings } from "@/lib/ui-settings-context";
import type { Account, ExpenseRecord, IncomeRecord } from "@/types/finance";
import { amountOwed, groupAccounts, usageRatio, usageTone } from "./accounts-cards-model";
import cardStyles from "./accounts-cards.module.css";
import {
  ACTIVITY_WINDOW_DAYS,
  activityDate,
  daysAgo,
  dueInfo,
  isoDay,
  panelSubtitle,
  railSubtitle,
  recentActivity,
  resolveSelection,
  SPENDING_DAYS,
  sparkPaths,
  spendingByDay,
  stepSelection,
} from "./accounts-wallet-model";
import styles from "./accounts-wallet.module.css";

const TONE_VAR = { green: "var(--green)", amber: "var(--amber)", rose: "var(--rose)" } as const;
const pillTone = (tone: "neutral" | "warn" | "bad") => (tone === "neutral" ? "" : ` ${cardStyles[tone]}`);
const EMPTY: never[] = [];

/** The two palette shades a thumbnail or ring uses (dark, then mid). Graphite when the name is unknown. */
function shades(colorName: string | undefined): CSSProperties {
  const c = cardColorByName(colorName) ?? cardColorByName("Graphite")!;
  return { "--a": c.dark, "--b": c.mid } as CSSProperties;
}

function Rail({
  accounts,
  colors,
  selectedId,
  onSelect,
  today,
}: {
  accounts: Account[];
  colors: Record<string, string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  today: Date;
}) {
  const groups = groupAccounts(accounts);
  const railRef = useRef<HTMLDivElement>(null);

  // Keep the chosen row in view (arrow keys can move it past the edge of the rail).
  useEffect(() => {
    const row = railRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    row?.scrollIntoView?.({ block: "nearest" });
  }, [selectedId]);

  return (
    <div className={styles.rail} role="listbox" aria-label="Accounts" ref={railRef}>
      {groups.map((group) => (
        <Fragment key={group.id}>
          <div className={styles.group}>{group.title}</div>
          {group.accounts.map((account) => {
            const credit = isCreditLikeAccountType(account.type);
            const ratio = credit ? usageRatio(account) : 0;
            return (
              <button
                key={account.id}
                type="button"
                role="option"
                className={styles.ri}
                aria-selected={account.id === selectedId}
                data-account-id={account.id}
                style={shades(colors[account.id])}
                onClick={() => onSelect(account.id)}
              >
                <span className={styles.th} aria-hidden="true" />
                <span>
                  <span className={styles.n}>{account.name}</span>
                  <span className={styles.s}>{railSubtitle(account, today)}</span>
                  {credit && (
                    <span className={styles.mini} style={{ "--c": TONE_VAR[usageTone(ratio)] } as CSSProperties}>
                      <i style={{ width: `${Math.max(3, ratio * 100)}%` }} />
                    </span>
                  )}
                </span>
                <span className={`${styles.amt} ${styles.num}`}>
                  {formatMoney(credit ? amountOwed(account) : account.currentBalance, { compact: true })}
                </span>
              </button>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}

function UsageRing({ ratio }: { ratio: number }) {
  const circumference = 2 * Math.PI * 44;
  return (
    <div className={styles.ring}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="44" fill="none" stroke="var(--surface-muted)" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke={TONE_VAR[usageTone(ratio)]}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circumference * ratio} ${circumference}`}
        />
      </svg>
      <div className={styles.ringCenter}>
        <b className={styles.num}>{Math.round(ratio * 100)}%</b>
        <span className={styles.lbl}>used</span>
      </div>
    </div>
  );
}

function Spark({ values }: { values: number[] }) {
  const gradientId = `spark${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const paths = sparkPaths(values);
  if (!paths) return <div className={styles.empty}>No spending in the last {SPENDING_DAYS} days.</div>;
  return (
    <svg className={styles.spark} viewBox="0 0 560 56" preserveAspectRatio="none" role="img" aria-label={`Spending, last ${SPENDING_DAYS} days`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--blue)" stopOpacity=".25" />
          <stop offset="1" stopColor="var(--blue)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={paths.area} fill={`url(#${gradientId})`} />
      <path d={paths.line} fill="none" stroke="var(--blue)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** One account's real expenses, income, transfers and card payments for the last few months. */
function useAccountRecords(accountId: string, today: Date) {
  const range = { accountId, rangeStart: isoDay(daysAgo(today, ACTIVITY_WINDOW_DAYS)), rangeEnd: isoDay(today) };
  const expenses = useExpenses(range).state;
  const incomes = useIncomes(range).state;
  const transfers = useWorkflowRecords("transfer", range).state;
  const cardPayments = useWorkflowRecords("credit-card-payment", range).state;
  const ready = [expenses, incomes, transfers, cardPayments].every((s) => s.status !== "loading");
  const rows = <T,>(s: { status: string; data?: T[] }): T[] => (s.status === "success" ? (s.data as T[]) : (EMPTY as T[]));
  return {
    ready,
    expenses: rows<ExpenseRecord>(expenses),
    incomes: [...rows<IncomeRecord>(incomes), ...rows<IncomeRecord>(transfers), ...rows<IncomeRecord>(cardPayments)].filter(
      (r) => r.accountId === accountId,
    ),
  };
}

function Details({
  account,
  colorName,
  isCustom,
  today,
  onOpen,
}: {
  account: Account;
  colorName: string;
  isCustom: boolean;
  today: Date;
  onOpen: (account: Account) => void;
}) {
  const credit = isCreditLikeAccountType(account.type);
  const { expenseCategories, allIncomeCategories } = useFinanceData();
  const records = useAccountRecords(account.id, today);

  const ratio = usageRatio(account);
  const due = credit ? dueInfo(account, today) : null;
  const limit = account.creditLimit;
  const available = account.availableLimit ?? (limit != null ? limit - amountOwed(account) : null);
  const spending = spendingByDay(records.expenses, today);
  const activity = recentActivity(records.expenses, records.incomes);
  const categoryOf = (row: { kind: "expense" | "income"; categoryId: string }) =>
    row.kind === "expense"
      ? expenseCategories.find((c) => c.id === row.categoryId)
      : allIncomeCategories.find((c) => c.id === row.categoryId);

  const figure = (label: string, value: string, big = false) => (
    <div className={big ? styles.big : undefined}>
      <div className={styles.k}>{label}</div>
      <div className={`${styles.v} ${styles.num}`}>{value}</div>
    </div>
  );

  return (
    <div key={account.id}>
      <div className={styles.ph}>
        <div>
          <h3 className={styles.title}>{account.name}</h3>
          <div className={styles.sub}>{panelSubtitle(account)}</div>
        </div>
        <span className={cardStyles.pill}>{credit && account.billingDay != null ? `Billing day ${account.billingDay}` : credit ? "Credit" : "Active"}</span>
      </div>

      <div className={styles.hero}>
        <div>
          <AccountCard account={account} colorName={colorName} onOpen={onOpen} />
        </div>
        <div className={styles.heroSide}>
          {credit && (
            <div className={styles.ringRow}>
              <UsageRing ratio={ratio} />
              <div>
                <div className={styles.lbl}>Card color</div>
                <div className={styles.colorName}>
                  {colorName} <span className={`${cardStyles.pill}${isCustom ? "" : ` ${cardStyles.ok}`}`} style={{ marginLeft: 4 }}>{isCustom ? "Custom" : "Auto"}</span>
                </div>
              </div>
            </div>
          )}
          <div className={styles.kv}>
            {credit ? (
              <>
                {figure("Amount owed", formatMoney(amountOwed(account)), true)}
                {figure("Available", available != null ? formatMoney(available) : "-", true)}
                {figure("Credit limit", limit != null ? formatMoney(limit, { compact: true }) : "-")}
                <div>
                  <div className={styles.k}>Next due</div>
                  <div className={styles.v}>
                    {due ? <span className={`${cardStyles.pill}${pillTone(due.tone)}`}>{due.label}</span> : "-"}
                  </div>
                </div>
                {figure("Payments made", account.totalIncomes != null ? formatMoney(account.totalIncomes, { compact: true }) : "-")}
                {figure("Purchases", account.totalExpenses != null ? formatMoney(account.totalExpenses, { compact: true }) : "-")}
              </>
            ) : (
              <>
                {figure("Balance", formatMoney(account.currentBalance), true)}
                <div>
                  <div className={styles.k}>Payment network</div>
                  <div className={styles.v}>
                    {hasNetwork(account.paymentNetwork) ? account.paymentNetwork : <span className={`${cardStyles.pill} ${cardStyles.ghost}`}>{isNotApplicable(account.paymentNetwork) ? NO_NETWORK_LABEL : "Not set"}</span>}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={`${styles.lbl} ${styles.sectionLabel}`}>Spending, last {SPENDING_DAYS} days</div>
      {records.ready ? <Spark values={spending} /> : <div className={styles.empty}>Loading…</div>}

      <div className={`${styles.lbl} ${styles.sectionLabel2}`}>Recent activity</div>
      <div className={styles.tx}>
        {records.ready && activity.length === 0 ? (
          <div className={styles.empty}>No recent activity on this account.</div>
        ) : (
          <ul>
            {activity.map((row) => {
              const category = categoryOf(row);
              const name = category ? ("name" in category ? category.name : category.source) : row.kind === "expense" ? "Expense" : "Income";
              return (
                <li key={row.id}>
                  <span className={styles.dot}>
                    <CategoryIcon icon={category?.icon} className="category-icon" />
                  </span>
                  <span className={styles.t}>
                    {row.title}
                    <small>
                      {name} · {activityDate(row.date)}
                    </small>
                  </span>
                  <span className={styles.num}>{formatMoney(row.amount)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export function AccountsWalletView({
  accounts,
  colors,
  selectedId,
  onSelect,
  onOpen,
}: {
  accounts: Account[];
  /** Resolved palette color name per account id. */
  colors: Record<string, string>;
  /** The account the owner chose; falls back to the first one listed when it is filtered out. */
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpen: (account: Account) => void;
}) {
  const { settings } = useUiSettings();
  const today = new Date();
  // The picker lists accounts grouped Credit, Debit & savings, Wallets & cash, so that is the arrow-key order too.
  const ordered = useMemo(() => groupAccounts(accounts).flatMap((g) => g.accounts), [accounts]);
  const orderedIds = useMemo(() => ordered.map((a) => a.id), [ordered]);
  const effectiveId = resolveSelection(orderedIds, selectedId);
  const selected = ordered.find((a) => a.id === effectiveId) ?? null;

  // When the chosen account drops out of the list (a tab or filter changed), the first one listed becomes the
  // choice, so it does not jump back later if the filtered-out account returns.
  useEffect(() => {
    if (effectiveId && effectiveId !== selectedId) onSelect(effectiveId);
  }, [effectiveId, selectedId, onSelect]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== "ArrowDown" && e.key !== "ArrowUp") || e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (document.querySelector('[role="dialog"]')) return;
      const next = stepSelection(orderedIds, effectiveId, e.key === "ArrowDown" ? 1 : -1);
      if (next) {
        e.preventDefault();
        onSelect(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [orderedIds, effectiveId, onSelect]);

  if (!selected) return <div className={cardStyles.empty}>No accounts to show.</div>;
  const saved = colors[selected.id];
  const colorName = isCardColorName(saved) ? saved : "Graphite";

  return (
    <div className={styles.root}>
      <div className={styles.wallet}>
        <Rail accounts={accounts} colors={colors} selectedId={effectiveId} onSelect={onSelect} today={today} />
        <div className={styles.panel} aria-label="Account details">
          <Details
            key={selected.id}
            account={selected}
            colorName={colorName}
            isCustom={settings.customAccountColors.includes(selected.id)}
            today={today}
            onOpen={onOpen}
          />
        </div>
      </div>
    </div>
  );
}

