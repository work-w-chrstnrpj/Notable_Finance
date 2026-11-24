import filterStyles from "./accounts-filters.module.css";

import { useMemo, useState } from "react";
import { assignAutoCardColors } from "@shared/card-colors";
import { Panel, PageToolbar, FilterDropdown, FilterToggle, SegmentedControl } from "@/components/ui";
import { FilterToggle as FilterIconToggle, PeriodToggle, ViewsToggle } from "@/components/ui/search-bar";
import { usePageControls } from "@/lib/use-page-controls";
import { MetricCardGridSkeleton, PanelSkeleton } from "@/components/ui";
import { DataTable } from "@/components/ui/data-table";
import { AccountIcon, AccountDetailModal } from "@/components/ui/accounts";
import { useFinanceData } from "@/lib/finance-data-context";
import { isCreditLikeAccountType } from "@/lib/finance-rules";
import { formatMoney } from "@/lib/format";
import { cx } from "@/lib/finance-helpers";
import { AccountsCardsView } from "./accounts-cards-view";
import { AccountsWalletView } from "./accounts-wallet-view";
import { useUiSettings } from "@/lib/ui-settings-context";
import { useShortcutAction } from "@/lib/shortcuts/context";
import { usePersistedFilters } from "@/features/records/use-persisted-filters";
import type { Account } from "@/types/finance";
import type { AccountScope } from "@/components/constants";

/** Balance colored by sign (red/neg, ink/zero, green/pos), mono figures. */
function signedMoney(value: number) {
  const cls = value < 0 ? "num--neg" : value > 0 ? "num--pos" : "num--zero";
  return <span className={cx("num", cls)}>{formatMoney(value)}</span>;
}

/** Plain monospace figure (no sign color). */
function money(value: number | null, opts?: { compact?: boolean }) {
  if (value === null) return "-";
  return <span className="num">{formatMoney(value, opts)}</span>;
}

/** The views the switch offers, in the order the layout shortcut cycles them. */
type AccountView = "table" | "cards" | "wallet";
const VIEW_CYCLE: AccountView[] = ["table", "cards", "wallet"];

function AccountsPage() {
  const { settings, ready: settingsReady, updateSettings } = useUiSettings();
  const [viewMode, setViewMode] = useState<AccountView>("cards");
  const [accountScope, setAccountScope] = useState<AccountScope>("standard");
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [cardTypeFilter, setCardTypeFilter] = useState("");
  const [filterActive, setFilterActive] = useState(true);
  const { periodHidden, viewsHidden, togglePeriod, toggleViews } = usePageControls("accounts");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  // The account chosen in Wallet; the view falls back to the first one listed when it is filtered out.
  const [walletAccountId, setWalletAccountId] = useState<string | null>(null);
  const { allAccounts: allRawAccounts, referenceLoading } = useFinanceData();
  const sourceAccounts = allRawAccounts.filter((a) => a.notionSynced);
  // One resolved color per account: the saved choice, else an automatic one no other card uses.
  const cardColors = useMemo(
    () =>
      assignAutoCardColors(
        allRawAccounts.filter((a) => a.notionSynced && !a.inactive && a.type !== "Auxiliary"),
        settings.accountColors,
      ).colors,
    [allRawAccounts, settings.accountColors],
  );

  usePersistedFilters({
    ready: settingsReady,
    source: settings.accountsFilters,
    hydrate: (f) => {
      setViewMode(f.viewMode);
      setAccountScope(f.accountScope);
      setHideZeroBalance(f.hideZeroBalance);
      setCardTypeFilter(f.cardTypeFilter);
      setFilterActive(f.filterActive);
    },
    values: [viewMode, accountScope, hideZeroBalance, cardTypeFilter, filterActive],
    persist: () => {
      void updateSettings({
        accountsFilters: { viewMode, accountScope, hideZeroBalance, cardTypeFilter, filterActive },
      });
    },
  });

  // ── Keyboard shortcuts ──────────────────────────────────────────
  useShortcutAction("view.filters", () => setFilterActive((f) => !f));
  useShortcutAction("view.toggleHideZero", () => setHideZeroBalance((h) => !h));
  useShortcutAction("view.toggleAccountLayout", () =>
    setViewMode((v) => VIEW_CYCLE[(VIEW_CYCLE.indexOf(v) + 1) % VIEW_CYCLE.length]),
  );
  useShortcutAction("view.filterTab", (arg) => {
    const scopes: AccountScope[] = ["all", "standard", "credit"];
    if (arg != null && arg >= 1 && arg <= scopes.length) setAccountScope(scopes[arg - 1]);
  });

  // P5: Show skeleton while reference data is loading
  if (referenceLoading) {
    return (
      <div className="page-stack">
        <section className="metric-grid metric-grid--prototype">
          <MetricCardGridSkeleton count={3} />
        </section>
        <PanelSkeleton rows={6} />
      </div>
    );
  }

  // Distinct account (card) types present, for the Card Type filter dropdown.
  const cardTypeOptions = Array.from(
    new Set(
      sourceAccounts
        .filter((a) => !a.inactive && a.type !== "Auxiliary")
        .map((a) => a.type),
    ),
  ).sort();

  const visibleAccounts = sourceAccounts.filter((account) => {
    if (account.inactive) return false;
    if (hideZeroBalance && account.currentBalance === 0) return false;
    if (cardTypeFilter && account.type !== cardTypeFilter) return false;
    if (accountScope === "all") return account.type !== "Auxiliary";
    if (accountScope === "credit") return isCreditLikeAccountType(account.type);
    return !isCreditLikeAccountType(account.type) && account.type !== "Auxiliary";
  }).sort((a, b) => a.name.localeCompare(b.name));
  const accountTableHeaders =
    accountScope === "credit"
      ? ["Account", "Type", "Balance", "Credit Limit", "Available Balance", "Total Payment Made", "Total Purchase Expenses", "Billing", "Due"]
      : ["Account", "Type", "Balance"];
  const accountTableRows = visibleAccounts.map((account) => {
    const accountCell = (
      <span className="account-cell">
        <AccountIcon account={account} />
        {account.name}
      </span>
    );

    if (accountScope === "credit") {
      return [
        accountCell,
        account.type,
        signedMoney(account.currentBalance),
        money(account.creditLimit, { compact: true }),
        money(account.availableLimit, { compact: true }),
        money(account.totalIncomes, { compact: true }),
        money(account.totalExpenses, { compact: true }),
        account.billingDay != null ? <span className="num">{account.billingDay}</span> : "-",
        account.dueDay != null ? <span className="num">{account.dueDay}</span> : "-",
      ];
    }

    return [
      accountCell,
      account.type,
      signedMoney(account.currentBalance),
    ];
  });

  const sumBy = (pick: (a: (typeof visibleAccounts)[number]) => number | null) =>
    visibleAccounts.reduce((sum, a) => sum + (pick(a) ?? 0), 0);
  const accountTotalBalance = sumBy((a) => a.currentBalance);
  const accountTableFooterRows =
    accountScope === "credit"
      ? [
          [
            "Total",
            "",
            signedMoney(accountTotalBalance),
            money(sumBy((a) => a.creditLimit), { compact: true }),
            money(sumBy((a) => a.availableLimit), { compact: true }),
            money(sumBy((a) => a.totalIncomes), { compact: true }),
            money(sumBy((a) => a.totalExpenses), { compact: true }),
            "",
            "",
          ],
        ]
      : [
          [
            "Total",
            "",
            signedMoney(accountTotalBalance),
          ],
        ];

  return (
    <div className="page-stack">
      <PageToolbar
        title="Accounts"
        actions={
          <>
            <PeriodToggle hidden={periodHidden} onToggle={togglePeriod} />
            <ViewsToggle hidden={viewsHidden} onToggle={toggleViews} />
            <FilterIconToggle
              active={filterActive}
              onToggle={() => setFilterActive((f) => !f)}
              shortcutId="view.filters"
            />
          </>
        }
      />

      {/* Same order as Expense and the workflow pages: the scope tabs first, then the filter row
          (card type, hide-zero, and the Table/Cards/Wallet switch) below them. */}
      {!periodHidden && (
        <SegmentedControl
          label="Account mode"
          options={[
            { label: "All Accounts", value: "all" },
            { label: "Accounts", value: "standard" },
            { label: "Credit Accounts", value: "credit" },
          ]}
          value={accountScope}
          onChange={(value) => setAccountScope(value as AccountScope)}
          shortcutId="view.filterTab"
        />
      )}
      {(filterActive || !viewsHidden) && (
      <div className={`account-filter-row ${filterStyles.filters}`}>
        {filterActive && (
          <>
            <FilterDropdown
              placeholder="All card types"
              value={cardTypeFilter}
              onChange={setCardTypeFilter}
              items={cardTypeOptions.map((type) => ({ id: type, label: type }))}
            />
            <FilterToggle
              label="Hide zero balance"
              checked={hideZeroBalance}
              onChange={setHideZeroBalance}
              shortcutId="view.toggleHideZero"
            />
          </>
        )}
        {!viewsHidden && (
          <SegmentedControl
            label="Account view"
            options={[
              { label: "Table", value: "table" },
              { label: "Cards", value: "cards" },
              { label: "Wallet", value: "wallet" },
            ]}
            value={viewMode}
            onChange={(value) => setViewMode(value as AccountView)}
            shortcutId="view.toggleAccountLayout"
          />
        )}
      </div>
      )}

      {viewMode === "cards" ? (
        <AccountsCardsView accounts={visibleAccounts} colors={cardColors} onOpen={setSelectedAccount} />
      ) : viewMode === "wallet" ? (
        <AccountsWalletView
          accounts={visibleAccounts}
          colors={cardColors}
          selectedId={walletAccountId}
          onSelect={setWalletAccountId}
          onOpen={setSelectedAccount}
        />
      ) : (
        // Wrap in a Panel exactly like Income/Expense — the Panel provides the
        // min-width:0 containment so the wide table scrolls INSIDE it instead of
        // stretching the whole page.
        <Panel>
          <DataTable
            headers={accountTableHeaders}
            rows={accountTableRows}
            footerRows={accountTableFooterRows}
            // Only the 9-column Credit view needs horizontal scroll + pinned
            // columns; the 3-column views render as a normal full-width table.
            wide={accountScope === "credit"}
            unsortableColumns={[0]}
            recordIds={visibleAccounts.map((a) => a.id)}
            onRowClick={(recordId) => {
              const account = visibleAccounts.find((a) => a.id === recordId);
              if (account) {
                setSelectedAccount(account);
              }
            }}
          />
        </Panel>
      )}

      {selectedAccount && (
        <AccountDetailModal
          account={selectedAccount}
          onClose={() => setSelectedAccount(null)}
        />
      )}
    </div>
  );
}

export { AccountsPage };
