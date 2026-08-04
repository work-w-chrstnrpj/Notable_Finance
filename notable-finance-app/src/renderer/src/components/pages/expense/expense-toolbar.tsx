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
import { pasabuyerLabels } from "@/lib/finance-rules";
import { expenseCategoryFilterWithoutPasabuy, type AnnualGroupBy } from "@/components/constants";
import type { Account, ExpenseCategory, ExpenseViewMode } from "@/types/finance";

/**
 * Expense page header: title + New/Search/Filter actions, the filter row, the view-mode
 * tabs, and the Annually table/chart switch (refactor_development_plan.md Phase 4.4).
 * Presentational — every piece of state stays owned by the page and is passed in.
 */
export function ExpenseToolbar({
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
  annualView,
  setAnnualView,
  groupBy,
  setGroupBy,
  onNewExpense,
  onViewModeChange,
}: {
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
  annualView: "table" | "chart";
  setAnnualView: (value: "table" | "chart") => void;
  groupBy: AnnualGroupBy;
  setGroupBy: (value: AnnualGroupBy) => void;
  onNewExpense: () => void;
  onViewModeChange: (mode: ExpenseViewMode) => void;
}) {
  return (
    <>
      <PageToolbar
        title="Expense"
        actions={
          <>
            <FilterToggle
              active={filterActive}
              onToggle={() => {
                if (filterActive) {
                  setAccountFilterId("");
                  setExpenseCategoryFilter("");
                  setPasabuyerFilter("");
                }
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

      {(searchActive || filterActive) && (
        <div className="toolbar-row">
          {filterActive && (
            <>
              <FilterDropdown
                placeholder="All accounts"
                value={accountFilterId}
                onChange={setAccountFilterId}
                items={activeAccounts.map((account) => ({
                  id: account.id,
                  label: account.name,
                  icon: <AccountIcon account={account} />,
                }))}
              />
              {viewMode !== "Unpaid Pasabuy" && (
                <FilterDropdown
                  placeholder="All Categories"
                  value={expenseCategoryFilter}
                  onChange={setExpenseCategoryFilter}
                  items={[
                    { id: expenseCategoryFilterWithoutPasabuy, label: "W/out Pasabuy" },
                    ...expenseCategories.map((category) => ({
                      id: category.id,
                      label: category.name,
                      icon: <CategoryIcon icon={category.icon} />,
                    })),
                  ]}
                />
              )}
              {viewMode === "Unpaid Pasabuy" && (
                <FilterSelect
                  placeholder="All pasabuyers"
                  placeholderDisabled={false}
                  value={pasabuyerFilter}
                  onChange={setPasabuyerFilter}
                >
                  {pasabuyerLabels.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </FilterSelect>
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

      <SegmentedControl
        label="Expense view"
        options={expenseViewModes.map((mode) => ({ label: mode, value: mode }))}
        value={viewMode}
        onChange={(value) => onViewModeChange(value as ExpenseViewMode)}
        shortcutId="view.filterTab"
      />

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
