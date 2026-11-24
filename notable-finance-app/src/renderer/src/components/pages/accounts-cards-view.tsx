import type { CSSProperties } from "react";
import { AccountCard, NO_NETWORK_LABEL, hasNetwork, isNotApplicable } from "@/components/ui/account-card";
import { formatMoney } from "@/lib/format";
import { isCreditLikeAccountType } from "@/lib/finance-rules";
import type { Account } from "@/types/finance";
import {
  amountOwed,
  dueInfo,
  groupAccounts,
  ordinal,
  summarize,
  usageRatio,
  usageTone,
} from "./accounts-cards-model";
import styles from "./accounts-cards.module.css";

const TONE_VAR = { green: "var(--green)", amber: "var(--amber)", rose: "var(--rose)" } as const;
const pillTone = (tone: "neutral" | "warn" | "bad") => (tone === "neutral" ? "" : ` ${styles[tone]}`);

function SummaryStrip({ accounts, today }: { accounts: Account[]; today: Date }) {
  const s = summarize(accounts, today);
  const dueWhen = s.nextDue
    ? `${s.nextDue.info.days === 0 ? "today" : s.nextDue.info.days === 1 ? "tomorrow" : `in ${s.nextDue.info.days} days`} · ${s.nextDue.info.label.split(" · ")[1]}`
    : "";
  return (
    <section className={styles.summary} aria-label="Accounts summary">
      <div className={styles.stat}>
        <div className={styles.lbl}>Total cash flow</div>
        <div className={`${styles.value} ${styles.num}`}>{formatMoney(s.cashFlow)}</div>
        <div className={styles.sub}>{s.nonCreditCount} non-credit accounts</div>
      </div>
      <div className={styles.stat}>
        <div className={styles.lbl}>Total owed on credit</div>
        <div className={`${styles.value} ${styles.num}`}>{formatMoney(s.totalOwed)}</div>
        <div className={styles.sub}>across {s.creditCount} cards</div>
      </div>
      <div className={styles.stat}>
        <div className={styles.lbl}>Overall utilization</div>
        <div className={`${styles.value} ${styles.num}`}>{s.usage == null ? "-" : `${(s.usage * 100).toFixed(1)}%`}</div>
        {s.usage != null && (
          <div className={`${styles.bar} ${styles.statBar}`} style={{ "--c": TONE_VAR[usageTone(s.usage)] } as CSSProperties}>
            <i style={{ width: `${s.usage * 100}%` }} />
          </div>
        )}
      </div>
      <div className={styles.stat}>
        <div className={styles.lbl}>Next payment due</div>
        <div className={styles.value}>{s.nextDue ? s.nextDue.name : "-"}</div>
        <div className={styles.sub}>{s.nextDue ? dueWhen : "No payment due"}</div>
      </div>
    </section>
  );
}

/** The usage bar, due pill and figures drawn under a card. */
function CardMeta({ account, today }: { account: Account; today: Date }) {
  if (isCreditLikeAccountType(account.type)) {
    const ratio = usageRatio(account);
    const due = dueInfo(account, today);
    const limit = account.creditLimit;
    const available = account.availableLimit ?? (limit != null ? limit - amountOwed(account) : null);
    return (
      <div className={styles.meta}>
        <div className={styles.line}>
          <span className={styles.num}>
            <b>{Math.round(ratio * 100)}%</b> used
          </span>
          <span>
            {available != null ? formatMoney(available) : "-"} available of {limit != null ? formatMoney(limit, { compact: true }) : "-"}
          </span>
        </div>
        <div className={styles.bar} style={{ "--c": TONE_VAR[usageTone(ratio)] } as CSSProperties}>
          <i style={{ width: `${Math.max(2, ratio * 100)}%` }} />
        </div>
        <div className={styles.line}>
          {due ? <span className={`${styles.pill}${pillTone(due.tone)}`}>{due.label}</span> : <span />}
          {account.billingDay != null && <span>Billing {ordinal(account.billingDay)}</span>}
        </div>
      </div>
    );
  }
  return (
    <div className={styles.meta}>
      <div className={styles.line}>
        <span>{account.type}</span>
        {hasNetwork(account.paymentNetwork) ? <span>{account.paymentNetwork} debit</span> : <span className={`${styles.pill} ${styles.ghost}`}>{isNotApplicable(account.paymentNetwork) ? NO_NETWORK_LABEL : "No network"}</span>}
      </div>
    </div>
  );
}

export function AccountsCardsView({
  accounts,
  colors,
  onOpen,
}: {
  accounts: Account[];
  /** Resolved palette color name per account id. */
  colors: Record<string, string>;
  onOpen: (account: Account) => void;
}) {
  const today = new Date();
  const groups = groupAccounts(accounts);
  return (
    <div>
      <SummaryStrip accounts={accounts} today={today} />
      {groups.length === 0 && <div className={styles.empty}>No accounts to show.</div>}
      {groups.map((group) => (
        <section key={group.id} aria-label={group.title}>
          <h2 className={styles.sec}>
            {group.title}
            <small>{group.accounts.length}</small>
          </h2>
          <div className={styles.grid}>
            {group.accounts.map((account) => (
              <div className={styles.tile} key={account.id}>
                <AccountCard account={account} colorName={colors[account.id]} onOpen={onOpen} />
                <CardMeta account={account} today={today} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
