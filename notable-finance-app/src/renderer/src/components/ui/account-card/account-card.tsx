import { useId, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { cardColorByName, isCardColorName, pickAutoCardColor } from "@shared/card-colors";
import type { CardFinish } from "@shared/card-colors";
import { formatMoney } from "@/lib/format";
import { isCreditLikeAccountType } from "@/lib/finance-rules";
import { useUiSettings } from "@/lib/ui-settings-context";
import type { Account } from "@/types/finance";
import { maskedCardNumberOrNull } from "@shared/card-number";
import { NO_NETWORK_LABEL, NetworkMark, hasNetwork, isNotApplicable, normalizeNetwork } from "./network-mark";
import styles from "./account-card.module.css";

/** Type glyphs for accounts with no payment network (the "plain" look). Same paths as the prototype. */
const GLYPH: Record<string, string> = {
  Cash: "M2 7h20v10H2zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  "e-Wallet": "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 18h.01",
  Savings: "M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M2 10l10-7 10 7",
  "Digital Bank": "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM12 18h.01",
  "e-Credit": "M2 5h20v14H2zM2 10h20",
};

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;
}

export interface AccountCardProps {
  account: Account;
  /** Palette color name. Defaults to the account's saved color, then an automatic pick. */
  colorName?: string | null;
  /** Defaults to the finish chosen in Settings. */
  finish?: CardFinish;
  /** Defaults to the Profile display name. */
  cardholder?: string;
  /** Click flips the card (default). Turn off where a parent owns the click. */
  flippable?: boolean;
  /** Double-click (or Shift+Enter) asks the parent to open the account. */
  onOpen?: (account: Account) => void;
}

function Chip() {
  const id = `chip${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg className={styles.chip} viewBox="0 0 52 40" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6e7a6" />
          <stop offset=".5" stopColor="#d9b552" />
          <stop offset="1" stopColor="#b58a2c" />
        </linearGradient>
      </defs>
      <rect width="52" height="40" rx="8" fill={`url(#${id})`} />
      <g stroke="#8a6a1e" strokeOpacity=".7" strokeWidth="1" fill="none">
        <path d="M0 14h14M0 26h14M38 14h14M38 26h14M14 0v40M38 0v40M14 20h24" />
        <rect x="14" y="10" width="24" height="20" rx="5" />
      </g>
    </svg>
  );
}

function Contactless() {
  return (
    <svg className={styles.cl} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M7 8.5a6 6 0 0 1 0 7" />
      <path d="M11 6a10 10 0 0 1 0 12" />
      <path d="M15 3.5a14 14 0 0 1 0 17" />
    </svg>
  );
}

/**
 * One account drawn as a payment card. Hover tilts it and moves a glare, click flips it to a
 * statement back. Credit-like accounts show the amount owed on the face; others their balance.
 */
export function AccountCard({ account, colorName, finish, cardholder, flippable = true, onOpen }: AccountCardProps) {
  const { settings } = useUiSettings();
  const [flipped, setFlipped] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  const credit = isCreditLikeAccountType(account.type);
  const network = normalizeNetwork(account.paymentNetwork);
  const plain = !hasNetwork(account.paymentNetwork) && !credit;
  // "16, 4056" from Notion becomes "•••• •••• •••• 4056"; with no valid value nothing is drawn.
  const maskedNumber = maskedCardNumberOrNull(account.cardNumbers);

  const saved = settings.accountColors[account.id];
  const resolved =
    (isCardColorName(colorName) ? colorName : null) ??
    (isCardColorName(saved) ? saved : null) ??
    pickAutoCardColor(account, new Set());
  const color = cardColorByName(resolved) ?? cardColorByName("Graphite")!;
  const style = {
    "--c1": color.dark,
    "--c2": color.mid,
    "--c3": color.highlight,
    "--glow": `${color.dark}aa`,
    "--ink-on": color.ink === "dark" ? "#1c1917" : "#fff",
  } as CSSProperties;

  const owed = Math.max(0, -account.currentBalance);
  const money = (n: number | null, whole = false) => (n == null ? "-" : formatMoney(n, { compact: whole }));

  function handleMove(e: PointerEvent<HTMLDivElement>) {
    const wrap = wrapRef.current;
    const tilt = tiltRef.current;
    if (!wrap || !tilt || prefersReducedMotion()) return;
    const r = wrap.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    tilt.classList.add(styles.live);
    tilt.style.setProperty("--ry", `${((px - 0.5) * 16).toFixed(2)}deg`);
    tilt.style.setProperty("--rx", `${((0.5 - py) * 12).toFixed(2)}deg`);
    wrap.style.setProperty("--mx", `${px * 100}%`);
    wrap.style.setProperty("--my", `${py * 100}%`);
  }

  function handleLeave() {
    const tilt = tiltRef.current;
    if (!tilt) return;
    tilt.classList.remove(styles.live);
    tilt.style.removeProperty("--rx");
    tilt.style.removeProperty("--ry");
  }

  function handleKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" && e.shiftKey && onOpen) {
      e.preventDefault();
      onOpen(account);
    } else if (flippable && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setFlipped((f) => !f);
    }
  }

  const frontNetwork = network ? (
    <div className={styles.net} title={account.paymentNetwork ?? undefined}>
      <NetworkMark network={network} />
    </div>
  ) : (
    <div className={styles.nonet}>{isNotApplicable(account.paymentNetwork) ? NO_NETWORK_LABEL : (account.paymentNetwork ?? "+ Set network")}</div>
  );

  return (
    <div
      ref={wrapRef}
      className={`${styles.wrap}${flipped ? ` ${styles.flipped}` : ""}`}
      style={style}
      data-finish={finish ?? settings.cardFinish}
      data-testid="account-card"
      role={flippable ? "button" : "group"}
      tabIndex={0}
      aria-label={`${account.name}, ${account.type}${flippable ? ". Press to flip the card." : ""}`}
      aria-pressed={flippable ? flipped : undefined}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      onClick={flippable ? () => setFlipped((f) => !f) : undefined}
      onDoubleClick={onOpen ? () => onOpen(account) : undefined}
      onKeyDown={handleKey}
    >
      <div ref={tiltRef} className={styles.tilt}>
        <div className={styles.flipper}>
          <div className={`${styles.face} ${styles.front}${plain ? ` ${styles.plain}` : ""}`} data-face="front" aria-hidden={flipped}>
            <div className={styles.fc}>
              <div className={styles.top}>
                <div>
                  <div className={styles.nm}>{account.name}</div>
                  <div className={styles.ty}>{account.type}</div>
                </div>
                {(credit || network) && <Contactless />}
                {plain && (
                  <span className={styles.glyph} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={GLYPH[account.type] ?? GLYPH.Cash} />
                    </svg>
                  </span>
                )}
              </div>
              <div className={styles.mid}>
                <Chip />
                <div className={styles.owed}>
                  <div className={styles.owedK}>{credit ? "Amount owed" : "Balance"}</div>
                  <div className={styles.owedV}>{formatMoney(credit ? owed : account.currentBalance)}</div>
                </div>
              </div>
              <div className={styles.bot}>
                <div>
                  {maskedNumber && <div className={`${styles.pan} ${styles.panFull}`}>{maskedNumber}</div>}
                  <div className={styles.hold}>{cardholder ?? settings.profile.displayName}</div>
                </div>
                {frontNetwork}
              </div>
            </div>
            <div className={styles.glare} />
          </div>

          <div className={`${styles.face} ${styles.back}`} data-face="back" aria-hidden={!flipped}>
            <div className={styles.mag} />
            <div className={styles.bc}>
              {credit ? (
                <>
                  <BackItem label="Credit limit" value={money(account.creditLimit, true)} mono />
                  <BackItem label="Available" value={money(account.availableLimit)} mono />
                  <BackItem label="Payments made" value={money(account.totalIncomes, true)} mono />
                  <BackItem label="Purchases" value={money(account.totalExpenses, true)} mono />
                  <BackItem
                    label="Billing / Due"
                    value={`${account.billingDay != null ? ordinal(account.billingDay) : "-"} / ${account.dueDay != null ? ordinal(account.dueDay) : "-"}`}
                    mono
                  />
                  {account.creditPoints != null ? (
                    <BackItem label="Points" value={account.creditPoints.toLocaleString("en-PH")} mono />
                  ) : (
                    <BackItem label="Annual fee" value={money(account.annualFee ?? 0, true)} mono />
                  )}
                </>
              ) : (
                <>
                  <BackItem label="Balance" value={formatMoney(account.currentBalance)} mono />
                  <BackItem label="Type" value={account.type} />
                </>
              )}
              <div className={styles.hint}>{onOpen ? "Click to flip back · double-click to open details" : "Click to flip back"}</div>
            </div>
            <div className={styles.glare} />
          </div>
        </div>
      </div>
    </div>
  );
}

function BackItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className={styles.bk}>{label}</div>
      <div className={`${styles.bv}${mono ? ` ${styles.mono}` : ""}`}>{value}</div>
    </div>
  );
}
