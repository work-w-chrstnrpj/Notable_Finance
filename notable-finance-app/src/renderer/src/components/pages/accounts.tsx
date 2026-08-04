
import { useState } from "react";
import { Panel, PageToolbar, FilterDropdown, FilterToggle, SegmentedControl, Badge, MoneyLine } from "@/components/ui";
import { MetricCardGridSkeleton, PanelSkeleton } from "@/components/ui";
import { DataTable } from "@/components/ui/data-table";
import { AccountIcon, AccountDetailModal } from "@/components/ui/accounts";
import { useFinanceData } from "@/lib/finance-data-context";
import { isCreditLikeAccountType } from "@/lib/finance-rules";
import { formatMoney } from "@/lib/format";
import { cx } from "@/lib/finance-helpers";
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

function AccountsPage() {
  const { settings, ready: settingsReady, updateSettings } = useUiSettings();
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [accountScope, setAccountScope] = useState<AccountScope>("standard");
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [cardTypeFilter, setCardTypeFilter] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const { allAccounts: allRawAccounts, referenceLoading } = useFinanceData();
  const sourceAccounts = allRawAccounts.filter((a) => a.notionSynced);

  usePersistedFilters({
    ready: settingsReady,
    source: settings.accountsFilters,
    hydrate: (f) => {
      setViewMode(f.viewMode);
      setAccountScope(f.accountScope);
      setHideZeroBalance(f.hideZeroBalance);
      setCardTypeFilter(f.cardTypeFilter);
    },
    values: [viewMode, accountScope, hideZeroBalance, cardTypeFilter],
    persist: () => {
      void updateSettings({
        accountsFilters: { viewMode, accountScope, hideZeroBalance, cardTypeFilter },
      });
    },
  });

  // ── Keyboard shortcuts ──────────────────────────────────────────
  useShortcutAction("view.toggleHideZero", () => setHideZeroBalance((h) => !h));
  useShortcutAction("view.toggleAccountLayout", () => setViewMode((v) => (v === "cards" ? "table" : "cards")));
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
      <PageToolbar title="Accounts" />

      {/* Scope tabs on their own row (like Daily/Weekly on other views), then a
          wrapping filter row with card-type, hide-zero, and the Cards/Table
          toggle — nothing lives in the header, so nothing overflows. */}
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
      <div className="account-filter-row">
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
        <SegmentedControl
          label="Account view"
          options={[
            { label: "Cards", value: "cards" },
            { label: "Table", value: "table" },
          ]}
          value={viewMode}
          onChange={(value) => setViewMode(value as "cards" | "table")}
          shortcutId="view.toggleAccountLayout"
        />
      </div>

      {viewMode === "cards" ? (
        <section className="account-grid">
          {visibleAccounts.map((account) => (
            <button
              type="button"
              className="account-card account-card--button"
              key={account.id}
              onClick={() => setSelectedAccount(account)}
            >
              <div className="account-card__top">
                <div className="account-card__name-row">
                  <AccountIcon account={account} />
                  <div>
                    <h2>{account.name}</h2>
                    {account.inactive && <p>Inactive account</p>}
                  </div>
                </div>
                <Badge
                  tone={
                    account.inactive
                      ? "neutral"
                      : isCreditLikeAccountType(account.type)
                        ? "amber"
                        : "blue"
                  }
                >
                  {account.type}
                </Badge>
              </div>
              <MoneyLine label="Current Balance" value={account.currentBalance} colorBySign />
              {isCreditLikeAccountType(account.type) && account.creditLimit !== null && (
                <MoneyLine label="Credit Limit" value={account.creditLimit} />
              )}
              {isCreditLikeAccountType(account.type) && account.availableLimit !== null && (
                <MoneyLine label="Available Limit" value={account.availableLimit} />
              )}
              {isCreditLikeAccountType(account.type) && account.totalIncomes !== null && (
                <MoneyLine label="Total Payment Made" value={account.totalIncomes} />
              )}
              {isCreditLikeAccountType(account.type) && account.totalExpenses !== null && (
                <MoneyLine label="Total Purchase Expenses" value={account.totalExpenses} />
              )}
            </button>
          ))}
        </section>
      ) : (
        // Wrap in a Panel exactly like Income/Expense — the Panel provides the
        // min-width:0 containment so the wide table scrolls INSIDE it instead of
        // stretching the whole page.
        <Panel title="Accounts">
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
