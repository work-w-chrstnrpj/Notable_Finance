import { Plus } from "lucide-react";
import { FilterDropdown, SegmentedControl, PageToolbar } from "@/components/ui";
import { SearchToggle, SearchInput, FilterToggle } from "@/components/ui/search-bar";
import { AccountIcon, CategoryIcon } from "@/components/ui/accounts";
import { ShortcutHint } from "@/components/shortcuts";
import { GroupBySelect } from "@/components/charts";
import type { AnnualGroupBy } from "@/components/constants";
import type { Account, IncomeCategory, IncomeViewMode } from "@/types/finance";

/**
 * Income page header: title + New/Search/Filter actions, the filter row, the view-mode
 * tabs, and the Annually table/chart switch (refactor_development_plan.md Phase 5.2 —
 * same pattern as ExpenseToolbar in Phase 4.4). Presentational — every piece of state
 * stays owned by the page and is passed in.
 */
export function IncomeToolbar({
  viewMode,
  incomeViewModes,
  isAnnual,
  nonCreditActiveAccounts,
  normalIncomeCategories,
  filterActive,
  setFilterActive,
  searchActive,
  toggleSearch,
  searchQuery,
  setSearchQuery,
  accountId,
  setAccountId,
  categoryId,
  setCategoryId,
  annualView,
  setAnnualView,
  groupBy,
  setGroupBy,
  onNewIncome,
  onViewModeChange,
}: {
  viewMode: IncomeViewMode;
  incomeViewModes: IncomeViewMode[];
  isAnnual: boolean;
  nonCreditActiveAccounts: Account[];
  normalIncomeCategories: IncomeCategory[];
  filterActive: boolean;
  setFilterActive: (updater: (prev: boolean) => boolean) => void;
  searchActive: boolean;
  toggleSearch: () => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  accountId: string;
  setAccountId: (value: string) => void;
  categoryId: string;
  setCategoryId: (value: string) => void;
  annualView: "table" | "chart";
  setAnnualView: (value: "table" | "chart") => void;
  groupBy: AnnualGroupBy;
  setGroupBy: (value: AnnualGroupBy) => void;
  onNewIncome: () => void;
  onViewModeChange: (mode: IncomeViewMode) => void;
}) {
  return (
    <>
      <PageToolbar
        title="Income"
        actions={
          <>
            <FilterToggle
              active={filterActive}
              onToggle={() => setFilterActive((prev) => !prev)}
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
              onClick={onNewIncome}
            >
              <Plus size={16} />
              New Income
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
                placeholder="All Accounts"
                value={accountId}
                onChange={setAccountId}
                items={nonCreditActiveAccounts.map((account) => ({
                  id: account.id,
                  label: account.name,
                  icon: <AccountIcon account={account} />,
                }))}
              />
              <FilterDropdown
                placeholder="All Categories"
                value={categoryId}
                onChange={setCategoryId}
                items={normalIncomeCategories.map((category) => ({
                  id: category.id,
                  label: category.source,
                  icon: <CategoryIcon icon={category.icon} />,
                }))}
              />
            </>
          )}
          {searchActive && (
            <SearchInput
              query={searchQuery}
              onQueryChange={setSearchQuery}
              placeholder="Search income..."
            />
          )}
        </div>
      )}

      <SegmentedControl
        label="Income view"
        options={incomeViewModes.map((mode) => ({ label: mode, value: mode }))}
        value={viewMode}
        onChange={(value) => onViewModeChange(value as IncomeViewMode)}
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
