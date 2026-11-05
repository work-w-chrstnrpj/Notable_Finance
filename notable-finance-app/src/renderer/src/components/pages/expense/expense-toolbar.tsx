import { useLiveCollections } from "@/components/hooks";
import styles from "@/components/ui/filter-row.module.css";
import { Plus } from "lucide-react";
import {
  FilterSelect,
  FilterDropdown,
  SegmentedControl,
  PageToolbar,
} from "@/components/ui";
import { SearchToggle, SearchInput, FilterToggle } from "@/components/ui/search-bar";
import { AccountIcon, CategoryIcon } from "@/components/ui/accounts";
import { ShortcutHint } from "@/components/shortcuts";
import { GroupBySelect } from "@/components/charts";
import { isPasabuyCategoryName, pasabuyStatusLabels, paymentStatusLabels } from "@/lib/finance-rules";
import { expenseCategoryFilterWithoutPasabuy, type AnnualGroupBy } from "@/components/constants";
import type { Account, ExpenseCategory, ExpenseViewMode } from "@/types/finance";

/**
 * Expense page header: title + New/Search/Filter actions, the filter row, the view-mode
 * tabs, and the Annually table/chart switch (refactor_development_plan.md Phase 4.4).
 * Presentational — every piece of state stays owned by the page and is passed in.
 */
export function ExpenseToolbar({
  purchasePeriod,
  pasabuyColorFilter,
  onPasabuyColorChange,
  onPurchasePeriodChange,
  viewMode,
  expenseViewModes,
  isAnnual,
  activeAccounts,
  expenseCategories,
  filterActive,
  setFilterActive,
  searchActive,
  toggleSearch,
  searchQuery,
  setSearchQuery,
  accountFilterId,
  setAccountFilterId,
  expenseCategoryFilter,
  setExpenseCategoryFilter,
  pasabuyerFilter,
  setPasabuyerFilter,
  paymentStatusFilter,
  setPaymentStatusFilter,
  pasabuyStatusFilter,
  setPasabuyStatusFilter,
  pasabuyDateOfPaymentFilter,
  setPasabuyDateOfPaymentFilter,
  pasabuyAccountReceiverFilter,
  setPasabuyAccountReceiverFilter,
  clearFilters,
  annualView,
  setAnnualView,
  groupBy,
  setGroupBy,
  onNewExpense,
  onViewModeChange,
}: {
  pasabuyColorFilter: string;
  onPasabuyColorChange: (value: string) => void;
  purchasePeriod: "Daily" | "Weekly" | "Monthly" | "Annually" | "All Records";
  onPurchasePeriodChange?: (period: "Daily" | "Weekly" | "Monthly" | "Annually" | "All Records") => void;
  viewMode: ExpenseViewMode;
  expenseViewModes: ExpenseViewMode[];
  isAnnual: boolean;
  activeAccounts: Account[];
  expenseCategories: ExpenseCategory[];
  filterActive: boolean;
  setFilterActive: (updater: (prev: boolean) => boolean) => void;
  searchActive: boolean;
  toggleSearch: () => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  accountFilterId: string;
  setAccountFilterId: (value: string) => void;
  expenseCategoryFilter: string;
  setExpenseCategoryFilter: (value: string) => void;
  pasabuyerFilter: string;
  setPasabuyerFilter: (value: string) => void;
  paymentStatusFilter: string;
  setPaymentStatusFilter: (value: string) => void;
  pasabuyStatusFilter: string;
  setPasabuyStatusFilter: (value: string) => void;
  pasabuyDateOfPaymentFilter: string;
  setPasabuyDateOfPaymentFilter: (value: string) => void;
  pasabuyAccountReceiverFilter: string;
  setPasabuyAccountReceiverFilter: (value: string) => void;
  clearFilters: () => void;
  annualView: "table" | "chart";
  setAnnualView: (value: "table" | "chart") => void;
  groupBy: AnnualGroupBy;
  setGroupBy: (value: AnnualGroupBy) => void;
  onNewExpense: () => void;
  onViewModeChange: (mode: ExpenseViewMode) => void;
}) {
  const { pasabuyerOptions } = useLiveCollections();
  const isPasabuyView = viewMode === "Pasabuy";
  const showsPasabuyFilters = isPasabuyView || expenseCategories.some(
    (category) => category.id === expenseCategoryFilter && isPasabuyCategoryName(category.name),
  );
  return (
    <>
      <PageToolbar
        title="Expense"
        actions={
          <>
            <FilterToggle
              active={filterActive}
              onToggle={() => {
                if (filterActive) clearFilters();
                setFilterActive((prev) => !prev);
              }}
              shortcutId="view.filters"
            />
            <SearchToggle
              active={searchActive}
              onToggle={toggleSearch}
              shortcutId="view.search"
            />
            <button
              type="button"
              className="button button--primary"
              onClick={onNewExpense}
            >
              <Plus size={16} />
              New Expense
              <ShortcutHint id="view.newRecord" />
            </button>
          </>
        }
      />

      <SegmentedControl
          label="Expense view"
          options={expenseViewModes.map(mode => ({
            label: mode === "CC Transaction" ? "CC Transactions" : mode === "To pay" ? "To Pay" : mode === "To buy" ? "To Buy" : mode,
            value: mode,
          }))}
          value={viewMode}
          onChange={value => onViewModeChange(value as ExpenseViewMode)}
          shortcutId="view.filterTab"
        />
      {(searchActive || filterActive) && (
        <div className={`toolbar-row ${styles.filters}`}>
          {filterActive && (isPasabuyView || viewMode === "CC Transaction") && (
            <label className="filter-select">
              <select
                aria-label={isPasabuyView ? "Pasabuy purchase period" : "CC Transaction period"}
                value={purchasePeriod}
                onChange={(event) => onPurchasePeriodChange?.(event.target.value as typeof purchasePeriod)}
              >
                {["Daily", "Weekly", "Monthly", "Annually", "All Records"].map(period => <option key={period}>{period}</option>)}
              </select>
            </label>
          )}
          {filterActive && (
            <>
              <FilterDropdown
                placeholder="All accounts"
                value={accountFilterId}
                onChange={setAccountFilterId}
                items={[...(viewMode === "To pay" ? [
                  { id: "__credit__", label: "All Credit Accounts" },
                  { id: "__debit__", label: "All Debit Accounts" },
                ] : []), ...activeAccounts.map((account) => ({
                  id: account.id,
                  label: account.name,
                  icon: <AccountIcon account={account} />,
                }))]}
              />
              {!isPasabuyView && viewMode !== "Unpaid Pasabuy" && (
                <FilterDropdown
                  placeholder="All Categories"
                  value={expenseCategoryFilter}
                  onChange={setExpenseCategoryFilter}
                  items={[
                    { id: expenseCategoryFilterWithoutPasabuy, label: "W/out Pasabuy" },
                    // Pasabuy sits directly under "W/out Pasabuy"; the rest keep their order.
                    ...[
                      ...expenseCategories.filter((category) => isPasabuyCategoryName(category.name)),
                      ...expenseCategories.filter((category) => !isPasabuyCategoryName(category.name)),
                    ].map((category) => ({
                      id: category.id,
                      label: category.name,
                      icon: <CategoryIcon icon={category.icon} />,
                    })),
                  ]}
                />
              )}
              {showsPasabuyFilters && (
                <FilterSelect
                  placeholder="All pasabuyers"
                  placeholderDisabled={false}
                  value={pasabuyerFilter}
                  onChange={setPasabuyerFilter}
                >
                  {pasabuyerFilter && !pasabuyerOptions.includes(pasabuyerFilter) && (
                    <option value={pasabuyerFilter}>{pasabuyerFilter}</option>
                  )}
                  {pasabuyerOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </FilterSelect>
              )}
              {!(["To pay", "Installments"] as ExpenseViewMode[]).includes(viewMode) && (
                <FilterSelect
                  placeholder="All payment statuses"
                  placeholderDisabled={false}
                  value={paymentStatusFilter}
                  onChange={setPaymentStatusFilter}
                >
                  {paymentStatusLabels.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </FilterSelect>
              )}
              {showsPasabuyFilters && (
                  <FilterSelect
                    placeholder="All Pasabuy payment statuses"
                    placeholderDisabled={false}
                    value={pasabuyStatusFilter}
                    onChange={setPasabuyStatusFilter}
                  >
                    {pasabuyStatusLabels.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </FilterSelect>
                )}
              {isPasabuyView && (
                <>
                  <FilterSelect
                    placeholder="All status colors"
                    placeholderDisabled={false}
                    value={pasabuyColorFilter}
                    onChange={onPasabuyColorChange}
                  >
                    <option value="red">Red · Unpaid</option>
                    <option value="blue">Blue · Pasabuy payment pending</option>
                    <option value="violet">Violet · Unpaid and Pasabuy pending</option>
                    <option value="yellow">Yellow · Installment</option>
                  </FilterSelect>
                  <label className="filter-select">
                    <input
                      type="date"
                      aria-label="Pasabuy Date of Payment"
                      value={pasabuyDateOfPaymentFilter}
                      onChange={(event) => setPasabuyDateOfPaymentFilter(event.target.value)}
                    />
                  </label>
                  <FilterDropdown
                    placeholder="All Pasabuy receivers"
                    value={pasabuyAccountReceiverFilter}
                    onChange={setPasabuyAccountReceiverFilter}
                    items={activeAccounts.map((account) => ({
                      id: account.id,
                      label: account.name,
                      icon: <AccountIcon account={account} />,
                    }))}
                  />
                </>
              )}
            </>
          )}
          {searchActive && (
            <SearchInput
              query={searchQuery}
              onQueryChange={setSearchQuery}
              placeholder="Search expenses..."
            />
          )}
        </div>
      )}

      {isAnnual && (
        <div className="annual-controls">
          <SegmentedControl
            label="Annual display"
            options={[
              { label: "Table", value: "table" },
              { label: "Chart", value: "chart" },
            ]}
            value={annualView}
            onChange={(v) => setAnnualView(v as "table" | "chart")}
          />
          {annualView === "chart" && (
            <GroupBySelect value={groupBy} onChange={setGroupBy} />
          )}
        </div>
      )}

    </>
  );
}
