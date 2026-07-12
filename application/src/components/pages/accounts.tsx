"use client";

import { useState } from "react";
import { PageToolbar, FilterSelect, FilterToggle, SegmentedControl, Badge, MoneyLine } from "@/components/ui";
import { DataTable } from "@/components/ui/data-table";
import { AccountIcon, AccountDetailModal } from "@/components/ui/accounts";
import { useFinanceData } from "@/lib/finance-data-context";
import { isCreditLikeAccountType } from "@/lib/finance-rules";
import { formatMoney } from "@/lib/format";
import type { Account } from "@/types/finance";
import type { AccountScope } from "@/components/constants";

function AccountsPage() {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [accountScope, setAccountScope] = useState<AccountScope>("standard");
  const [hideZeroBalance, setHideZeroBalance] = useState(false);
  const [cardTypeFilter, setCardTypeFilter] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  // Reference accounts come from the shared provider (fetched once per session).
  const { allAccounts: sourceAccounts } = useFinanceData();

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
      : ["Account", "Type", "Balance", "Total Cash Inflow", "Total Cash Outflow"];
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
        formatMoney(account.currentBalance),
        account.creditLimit !== null ? formatMoney(account.creditLimit, { compact: true }) : "-",
        account.availableLimit !== null ? formatMoney(account.availableLimit, { compact: true }) : "-",
        account.totalIncomes !== null ? formatMoney(account.totalIncomes, { compact: true }) : "-",
        account.totalExpenses !== null ? formatMoney(account.totalExpenses, { compact: true }) : "-",
        account.billingDay?.toString() ?? "-",
        account.dueDay?.toString() ?? "-",
      ];
    }

    return [
      accountCell,
      account.type,
      formatMoney(account.currentBalance),
      account.totalIncomes !== null ? formatMoney(account.totalIncomes, { compact: true }) : "-",
      account.totalExpenses !== null ? formatMoney(account.totalExpenses, { compact: true }) : "-",
    ];
  });

  const accountTotalBalance = visibleAccounts.reduce(
    (sum, account) => sum + account.currentBalance,
    0,
  );
  const accountTotalIncome = visibleAccounts.reduce(
    (sum, account) => sum + (account.totalIncomes ?? 0),
    0,
  );
  const accountTotalExpense = visibleAccounts.reduce(
    (sum, account) => sum + (account.totalExpenses ?? 0),
    0,
  );
  const accountTableFooterRows =
    accountScope === "credit"
      ? []
      : [
          [
            "Total",
            "",
            formatMoney(accountTotalBalance),
            formatMoney(accountTotalIncome, { compact: true }),
            formatMoney(accountTotalExpense, { compact: true }),
          ],
        ];

  return (
    <div className="page-stack">
      <PageToolbar
        title="Accounts"
        actions={
          <>
            <FilterSelect
              placeholder="All card types"
              placeholderDisabled={false}
              value={cardTypeFilter}
              onChange={setCardTypeFilter}
            >
              {cardTypeOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </FilterSelect>
            <FilterToggle
              label="Hide zero balance"
              checked={hideZeroBalance}
              onChange={setHideZeroBalance}
            />
            <SegmentedControl
              label="Account view"
              options={[
                { label: "Cards", value: "cards" },
                { label: "Table", value: "table" },
              ]}
              value={viewMode}
              onChange={(value) => setViewMode(value as "cards" | "table")}
            />
            <SegmentedControl
              label="Account mode"
              options={[
                { label: "All Accounts", value: "all" },
                { label: "Accounts", value: "standard" },
                { label: "Credit Accounts", value: "credit" },
              ]}
              value={accountScope}
              onChange={(value) => setAccountScope(value as AccountScope)}
            />
          </>
        }
      />

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
              <MoneyLine label="Current Balance" value={account.currentBalance} />
              {isCreditLikeAccountType(account.type) && account.creditLimit !== null && (
                <MoneyLine label="Credit Limit" value={account.creditLimit} />
              )}
              {isCreditLikeAccountType(account.type) && account.availableLimit !== null && (
                <MoneyLine label="Available Limit" value={account.availableLimit} />
              )}
              {account.totalIncomes !== null && (
                <MoneyLine
                  label={isCreditLikeAccountType(account.type) ? "Total Payment Made" : "Total Cash Inflow"}
                  value={account.totalIncomes}
                />
              )}
              {account.totalExpenses !== null && (
                <MoneyLine
                  label={isCreditLikeAccountType(account.type) ? "Total Purchase Expenses" : "Total Cash Outflow"}
                  value={account.totalExpenses}
                />
              )}
            </button>
          ))}
        </section>
      ) : (
        <DataTable
          headers={accountTableHeaders}
          rows={accountTableRows}
          footerRows={accountTableFooterRows}
          onRowClick={(rowIndex) => {
            const account = visibleAccounts[rowIndex];
            if (account) {
              setSelectedAccount(account);
            }
          }}
        />
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
