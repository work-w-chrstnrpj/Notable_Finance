import type { CSSProperties } from "react";
import { CARD_COLORS, CARD_FINISHES, cardColorByName, isCardColorName, pickAutoCardColor } from "@shared/card-colors";
import type { CardFinish } from "@shared/card-colors";
import { SettingsModal } from "@/components/ui/form-modals";
import { AccountCard } from "@/components/ui/account-card";
import { useFinanceData } from "@/lib/finance-data-context";
import { useUiSettings } from "@/lib/ui-settings-context";
import type { Account } from "@/types/finance";
import styles from "./account-cards-modal.module.css";

const FINISH_COPY: Record<CardFinish, { title: string; hint: string }> = {
  glass: { title: "Glass", hint: "Soft light and depth" },
  metal: { title: "Metal", hint: "Brushed, with a sheen" },
  matte: { title: "Matte", hint: "Flat and quiet" },
};

/** One sample card for the finish previews (same sample as the approved prototype). */
const SAMPLE_ACCOUNT: Account = {
  id: "card-finish-sample",
  name: "RCBC Visa Flex Gold",
  type: "Credit Account",
  icon: null,
  information: "",
  startingBalance: 0,
  currentBalance: -132687.25,
  creditLimit: 462000,
  availableLimit: 329312.75,
  creditPoints: null,
  annualFee: null,
  paymentNetwork: "Visa",
  cardNumbers: "16, 7730", // the prototype's sample number, so the previews show a masked number
  billingDay: 26,
  dueDay: 11,
  totalIncomes: null,
  totalExpenses: null,
  totalPasabuy: null,
  totalCcDebtTransfer: null,
  qrCode: null,
  inactive: false,
  notionSynced: true,
};

function swatchStyle(name: string): CSSProperties {
  const color = cardColorByName(name);
  return { "--a": color?.dark, "--b": color?.mid } as CSSProperties;
}

/**
 * Settings > Accounts: the card finish for every card, and a color for each account.
 * Both are local display preferences (ADR-0011): nothing here is written to Notion, and
 * accounts cannot be added or removed here.
 */
function AccountCardsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useUiSettings();
  const { allAccounts } = useFinanceData();
  const accounts = allAccounts
    .filter((a) => a.notionSynced && !a.inactive && a.type !== "Auxiliary")
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <SettingsModal
      title="Settings · Accounts"
      subtitle="Appearance. Accounts themselves come from Notion; these choices stay on this computer."
      onClose={onClose}
      panelClassName={styles.panel}
      footer={
        <button type="button" className="button button--primary" onClick={onClose}>
          Done
        </button>
      }
    >
      <div className={styles.lbl}>Card finish</div>
      <div className={styles.opts} role="group" aria-label="Card finish">
        {CARD_FINISHES.map((finish) => (
          <button
            key={finish}
            type="button"
            className={styles.opt}
            aria-pressed={settings.cardFinish === finish}
            aria-label={`${FINISH_COPY[finish].title} finish`}
            onClick={() => void updateSettings({ cardFinish: finish })}
          >
            <div className={styles.preview} aria-hidden="true">
              <AccountCard account={SAMPLE_ACCOUNT} colorName="Gold" finish={finish} flippable={false} />
            </div>
            <b className={styles.optTitle}>{FINISH_COPY[finish].title}</b>
            <small>{FINISH_COPY[finish].hint}</small>
          </button>
        ))}
      </div>

      <div className={`${styles.lbl} ${styles.colorsHead}`}>Account colors</div>
      <div className={`${styles.sub} ${styles.colorsSub}`}>
        Auto picks a color no other card is using. Choose one to override.
      </div>
      <div role="list" aria-label="Account colors">
        {accounts.map((account) => {
          const saved = settings.accountColors[account.id];
          const custom = settings.customAccountColors.includes(account.id) && isCardColorName(saved);
          const name = isCardColorName(saved) ? saved : pickAutoCardColor(account, new Set());
          return (
            <div key={account.id} className={styles.crow} role="listitem" data-account-id={account.id}>
              <span className={styles.acc}>
                <i className={styles.thumb} style={swatchStyle(name)} />
                <span>
                  <b className={styles.accName}>{account.name}</b>
                  <small className={styles.accMeta}>
                    {custom ? "Custom" : "Auto"} · {name}
                  </small>
                </span>
              </span>
              <span className={styles.swatches} role="group" aria-label={`Color for ${account.name}`}>
                <button
                  type="button"
                  className={`${styles.sw} ${styles.auto}`}
                  data-name="Auto"
                  aria-label="Auto"
                  aria-pressed={!custom}
                  onClick={() => void updateSettings({ accountColors: { [account.id]: null } })}
                >
                  Auto
                </button>
                {CARD_COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    className={styles.sw}
                    style={swatchStyle(color.name)}
                    data-name={color.name}
                    aria-label={color.name}
                    aria-pressed={custom && saved === color.name}
                    onClick={() => void updateSettings({ accountColors: { [account.id]: color.name } })}
                  />
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </SettingsModal>
  );
}

export { AccountCardsModal };
