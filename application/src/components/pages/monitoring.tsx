"use client";

import { useRef, useEffect, useState } from "react";
import { ArrowUpRight, CircleDollarSign, Frown, PiggyBank, Plus, Receipt, Smile, TrendingUp, X } from "lucide-react";
import { useLiveCollections, getIncomeCategorySummaries, getExpenseCategorySummaries } from "@/components/hooks";
import { CategoryDonutChart } from "@/components/charts";
import { categoryPalette, type ForecastIncome } from "@/components/constants";
import { Panel, MetricCard, Field, FilterSelect, FilterToggle, SegmentedControl, BudgetRow, CategoryCard, MoneyValue, FormSectionDivider } from "@/components/ui";
import { PageToolbar } from "@/components/ui";
import { DataTable } from "@/components/ui/data-table";
import { useIncomes, useExpenses } from "@/lib/use-data";
import { useFabRegister } from "@/lib/fab-export-context";
import { SHOT_HIDE_CLASS } from "@/lib/export-node";
import { cx, getExpenseTotal, getIncomeCapitalExpenditureTotal, getIncomeGrossTotal, getIncomeNetTotal, getMonthLabel, parseNumberInput } from "@/lib/finance-helpers";
import { calculateCategoryTotalOverview } from "@/lib/finance-rules";
import { formatMoney, formatPercent } from "@/lib/format";
import type { ExpenseRecord, IncomeRecord } from "@/types/finance";

function MonthlyMonitoringPage({ selectedMonth }: { selectedMonth: string }) {
  const [incomeCategoryView, setIncomeCategoryView] = useState("table");
  const [expenseCategoryView, setExpenseCategoryView] = useState("simplified");
  const [hideZeroIncomeCategories, setHideZeroIncomeCategories] = useState(false);
  type ZeroFilter = "all" | "hide-both" | "hide-spending" | "hide-budget";
  const [zeroFilter, setZeroFilter] = useState<ZeroFilter>("all");
  const { normalIncomeCategories, expenseCategories } = useLiveCollections();
  const { state: incomesState } = useIncomes({ month: selectedMonth });
  const { state: expensesState } = useExpenses({ month: selectedMonth });

  // ── Forecast income (Monitoring-only, local, NOT written to Notion) ──────
  // Since real income lands mid/end of month, monthly income can read negative
  // beforehand. A forecast income temporarily props up Monthly Income here.
  // Persisted per-month in localStorage; removed once the real income is logged.
  const forecastKey = `nf_forecast_income_${selectedMonth}`;
  const [forecasts, setForecasts] = useState<ForecastIncome[]>([]);
  const [forecastModalOpen, setForecastModalOpen] = useState(false);
  const [forecastLabel, setForecastLabel] = useState("");
  const [forecastAmount, setForecastAmount] = useState("");

  useEffect(() => {
    // Load this month's forecasts from the local store when the month changes.
    let items: ForecastIncome[] = [];
    try {
      const raw = localStorage.getItem(forecastKey);
      if (raw) items = JSON.parse(raw) as ForecastIncome[];
    } catch {
      items = [];
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForecasts(items);
  }, [forecastKey]);

  function persistForecasts(next: ForecastIncome[]) {
    setForecasts(next);
    try {
      localStorage.setItem(forecastKey, JSON.stringify(next));
    } catch {
      // ignore storage errors (private mode, quota)
    }
  }

  function addForecast() {
    const amount = parseNumberInput(forecastAmount);
    if (!amount) return;
    persistForecasts([
      ...forecasts,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        label: forecastLabel.trim() || "Forecast income",
        amount,
      },
    ]);
    setForecastLabel("");
    setForecastAmount("");
    setForecastModalOpen(false);
  }

  function removeForecast(id: string) {
    persistForecasts(forecasts.filter((f) => f.id !== id));
  }

  const forecastTotal = forecasts.reduce((sum, f) => sum + f.amount, 0);

  const scopedIncomeRecords: IncomeRecord[] = (
    incomesState.status === "success" ? incomesState.data : []
  ).filter((record) => !record.name?.includes("[Deleted:"));
  const scopedExpenseRecords: ExpenseRecord[] = (
    expensesState.status === "success" ? expensesState.data : []
  ).filter((record) => !record.description?.includes("[Deleted:"));
  const monthlyGrossIncome = getIncomeGrossTotal(scopedIncomeRecords);
  const monthlyCapitalExpenditure = getIncomeCapitalExpenditureTotal(
    scopedIncomeRecords,
  );
  // Forecast income only lifts the Monitoring metrics, never the dashboard.
  const monthlyIncome = monthlyGrossIncome + forecastTotal;
  // Pasabuy expenses are fronted for others ("pinasabay lang"), so they are
  // excluded from the user's own Monthly Expense.
  const pasabuyCategoryIds = new Set(
    expenseCategories.filter((c) => /pasabuy/i.test(c.name)).map((c) => c.id),
  );
  const ownExpenseRecords = scopedExpenseRecords.filter(
    (record) => !pasabuyCategoryIds.has(record.categoryId),
  );
  const monthlyExpense = getExpenseTotal(ownExpenseRecords);
  const grossMargin = monthlyIncome - monthlyExpense;
  const monitoring = {
    month: selectedMonth,
    monthlyIncome,
    monthlyGrossIncome,
    monthlyCapitalExpenditure,
    monthlyExpense,
    grossMargin,
    forNeeds: monthlyIncome * 0.5,
    forWants: monthlyIncome * 0.3,
    forSavings: monthlyIncome * 0.2,
  };
  const incomeCategorySummaries = getIncomeCategorySummaries(
    scopedIncomeRecords,
    normalIncomeCategories,
  );
  const visibleIncomeCategorySummaries = hideZeroIncomeCategories
    ? incomeCategorySummaries.filter((category) => category.grossIncome !== 0)
    : incomeCategorySummaries;
  const expenseCategorySummaries = getExpenseCategorySummaries(
    scopedExpenseRecords,
    expenseCategories,
  );
  const visibleExpenseCategorySummaries = expenseCategorySummaries.filter(
    (category) => {
      if (zeroFilter === "hide-both" && category.monthlyBudget === 0 && category.spending === 0) return false;
      if (zeroFilter === "hide-budget" && category.monthlyBudget === 0) return false;
      if (zeroFilter === "hide-spending" && category.spending === 0) return false;
      return true;
    },
  );
  const incomeNetTotal = getIncomeNetTotal(scopedIncomeRecords);
  const incomeGrossTotal = getIncomeGrossTotal(scopedIncomeRecords);
  const incomeCapitalExpenditureTotal = getIncomeCapitalExpenditureTotal(scopedIncomeRecords);
  const monthlyBudgetTotal = expenseCategorySummaries.reduce(
    (sum, category) => sum + category.monthlyBudget,
    0,
  );
  const budgetSpendingTotal = expenseCategorySummaries.reduce(
    (sum, category) => sum + category.spending,
    0,
  );
  const remainingTotal = expenseCategorySummaries.reduce(
    (sum, category) => sum + category.remaining,
    0,
  );

  // Expose this view's DOM to the FAB so it can capture a Monthly Insight Shot.
  const { setInsight } = useFabRegister();
  const captureRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setInsight({
      monthLabel: getMonthLabel(selectedMonth),
      getNode: () => captureRef.current,
    });
    return () => setInsight(null);
  }, [selectedMonth, setInsight]);

  return (
    <div className="page-stack" ref={captureRef}>
      <PageToolbar
        title="Monthly Monitoring"
        actions={
          <button
            type="button"
            className={cx("button button--primary", SHOT_HIDE_CLASS)}
            onClick={() => setForecastModalOpen(true)}
          >
            <Plus size={16} />
            Add Forecast Income
          </button>
        }
      />
      {forecasts.length > 0 && (
        <div className="forecast-banner">
          <span className="forecast-banner__icon">
            <TrendingUp size={16} />
          </span>
          <div className="forecast-banner__body">
            <div className="forecast-banner__title">
              <strong>Forecast income</strong>
              <span className="forecast-banner__tag">Monitoring only</span>
            </div>
            <div className="forecast-banner__items">
              {forecasts.map((f) => (
                <span key={f.id} className="forecast-chip">
                  <span className="forecast-chip__label">{f.label}</span>
                  <span className="forecast-chip__amount">{formatMoney(f.amount)}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.label}`}
                    onClick={() => removeForecast(f.id)}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="forecast-banner__total">
            <span>Applied</span>
            <strong>{formatMoney(forecastTotal)}</strong>
          </div>
        </div>
      )}
      <section className="metric-grid">
        <MetricCard
          title="Monthly Income"
          value={formatMoney(monitoring.monthlyIncome)}
          detail={
            forecastTotal
              ? `${getMonthLabel(selectedMonth)} · incl. ${formatMoney(forecastTotal, { compact: true })} forecast`
              : getMonthLabel(selectedMonth)
          }
          icon={ArrowUpRight}
          tone="green"
        />
        <MetricCard title="Monthly Expense" value={formatMoney(monitoring.monthlyExpense)} detail={getMonthLabel(selectedMonth)} icon={Receipt} tone="rose" />
        <MetricCard title="Gross Margin" value={formatMoney(monitoring.grossMargin)} detail="Income less expenses" icon={CircleDollarSign} tone="blue" />
        <MetricCard title="For Savings" value={formatMoney(monitoring.forSavings)} detail="30% allocation" icon={PiggyBank} tone="amber" />
      </section>
      <section className="two-column">
        <Panel title="Budget Allocation">
          <BudgetRow label="Needs" percent={50} amount={monitoring.forNeeds} />
          <BudgetRow label="Wants" percent={30} amount={monitoring.forWants} />
          <BudgetRow label="Savings" percent={20} amount={monitoring.forSavings} />
        </Panel>
        <Panel title="Monthly Insight">
          {(() => {
            const setBudget = monitoring.forNeeds + monitoring.forWants;
            // On track when actual spending stays within the Needs+Wants budget.
            const onTrack = monitoring.monthlyExpense <= setBudget;
            const difference = Math.abs(setBudget - monitoring.monthlyExpense);
            return (
              <div className={cx("insight", onTrack ? "insight--good" : "insight--bad")}>
                <span className="insight__icon">
                  {onTrack ? <Smile size={40} /> : <Frown size={40} />}
                </span>
                <div className="insight__body">
                  <p className="insight__budget">
                    Total Set Budget: <strong>{formatMoney(setBudget)}</strong>
                  </p>
                  <p className="insight__message">
                    {onTrack
                      ? `You spent ${formatMoney(difference)} less than your set budget this month — you're on track!`
                      : `You've exceeded your set budget by ${formatMoney(difference)}.`}
                  </p>
                </div>
              </div>
            );
          })()}
        </Panel>
      </section>

      <Panel
        title="Income Portfolio"
        action={
          <div className={cx("panel-header-actions", SHOT_HIDE_CLASS)}>
            <SegmentedControl
              label="Income category view"
              options={[
                { label: "Table", value: "table" },
                { label: "Chart", value: "chart" },
                { label: "Cards", value: "cards" },
              ]}
              value={incomeCategoryView}
              onChange={setIncomeCategoryView}
            />
            <FilterToggle
              label="Hide zero gross"
              checked={hideZeroIncomeCategories}
              onChange={setHideZeroIncomeCategories}
            />
          </div>
        }
      >
        {incomeCategoryView === "table" && (
          <DataTable
            headers={["Income Type", "Gross Income", "Expenditure", "Net Income", "Earning Percentage"]}
            rows={visibleIncomeCategorySummaries.map((category) => [
              category.source,
              formatMoney(category.grossIncome),
              formatMoney(category.capitalExpenditure),
              <MoneyValue key={`${category.id}-net`} value={category.netIncome} />,
              formatPercent(category.earningPercentage),
            ])}
            footerRows={[
              [
                "Total",
                formatMoney(incomeGrossTotal),
                formatMoney(incomeCapitalExpenditureTotal),
                formatMoney(incomeNetTotal),
                formatPercent(incomeNetTotal > 0 ? 100 : 0),
              ],
            ]}
          />
        )}
        {incomeCategoryView === "chart" && (
          <CategoryDonutChart
            data={visibleIncomeCategorySummaries.map((category, index) => ({
              name: category.source,
              value: Math.max(category.netIncome, 0),
              color: categoryPalette[index % categoryPalette.length],
            }))}
          />
        )}
        {incomeCategoryView === "cards" && (
          <div className="category-grid">
            {visibleIncomeCategorySummaries.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.source}
                detail={formatPercent(category.earningPercentage)}
                value={formatMoney(category.netIncome)}
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Monthly Budget"
        action={
          <div className={cx("panel-header-actions", SHOT_HIDE_CLASS)}>
            <SegmentedControl
              label="Expense category view"
              options={[
                { label: "Simplified", value: "simplified" },
                { label: "MB Breakdown", value: "breakdown" },
                { label: "Chart", value: "chart" },
                { label: "Cards", value: "cards" },
              ]}
              value={expenseCategoryView}
              onChange={setExpenseCategoryView}
            />
            <FilterSelect
              placeholder="Show All"
              placeholderDisabled={false}
              value={zeroFilter}
              onChange={(value) => setZeroFilter(value as ZeroFilter)}
            >
              <option value="hide-both">Hide Zero Spending &amp; Budget</option>
              <option value="hide-spending">Hide Zero Spending</option>
              <option value="hide-budget">Hide Zero Budget</option>
            </FilterSelect>
          </div>
        }
      >
        {expenseCategoryView === "simplified" && (
          <DataTable
            headers={["Expense category", "Monthly Budget", "Spending", "Remaining"]}
            rows={visibleExpenseCategorySummaries.map((category) => [
              category.name,
              formatMoney(category.monthlyBudget),
              formatMoney(category.spending),
              formatMoney(category.remaining),
            ])}
            footerRows={[
              ["Total", formatMoney(monthlyBudgetTotal), formatMoney(budgetSpendingTotal), formatMoney(remainingTotal)],
            ]}
          />
        )}
        {expenseCategoryView === "breakdown" && (
          <DataTable
            headers={[
              "Expense category",
              "Monthly Budget",
              "Spending",
              "Remaining",
              "Overview",
              "Total Overview",
            ]}
            rows={visibleExpenseCategorySummaries.map((category) => [
              category.name,
              formatMoney(category.monthlyBudget),
              formatMoney(category.spending),
              formatMoney(category.remaining),
              category.overview,
              formatPercent(category.totalOverview),
            ])}
            footerRows={[
              [
                "Total",
                formatMoney(monthlyBudgetTotal),
                formatMoney(budgetSpendingTotal),
                formatMoney(remainingTotal),
                "",
                formatPercent(calculateCategoryTotalOverview(budgetSpendingTotal, monitoring.monthlyExpense)),
              ],
            ]}
          />
        )}
        {expenseCategoryView === "chart" && (
          <CategoryDonutChart
            data={visibleExpenseCategorySummaries.map((category, index) => ({
              name: category.name,
              value: category.spending,
              color: categoryPalette[index % categoryPalette.length],
            }))}
          />
        )}
        {expenseCategoryView === "cards" && (
          <div className="category-grid">
            {visibleExpenseCategorySummaries.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.name}
                detail={`Remaining ${formatMoney(category.remaining, { compact: true })}`}
                value={formatMoney(category.monthlyBudget, { compact: true })}
              />
            ))}
          </div>
        )}
      </Panel>

      {forecastModalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setForecastModalOpen(false);
          }}
        >
          <section
            aria-labelledby="forecast-modal-title"
            aria-modal="true"
            className="modal-panel modal-panel--narrow"
            role="dialog"
          >
            <div className="modal-panel__header">
              <div>
                <h2 id="forecast-modal-title">Add Forecast Income</h2>
                <p>Temporary, Monitoring-only. Not saved to Notion.</p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Close modal"
                onClick={() => setForecastModalOpen(false)}
              >
                <X size={17} />
              </button>
            </div>
            <div className="modal-panel__body">
              <div className="form-grid form-grid--single">
                <Field label="Label">
                  <input
                    placeholder="e.g. Salary (15th)"
                    value={forecastLabel}
                    onChange={(event) => setForecastLabel(event.target.value)}
                  />
                </Field>
                <Field label="Amount">
                  <input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={forecastAmount}
                    onChange={(event) => setForecastAmount(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") addForecast();
                    }}
                  />
                </Field>
              </div>
            </div>
            <div className="modal-panel__footer">
              <button type="button" className="button" onClick={() => setForecastModalOpen(false)}>
                Cancel
              </button>
              <button type="button" className="button button--primary" onClick={addForecast}>
                <Plus size={16} />
                Add Forecast
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export { MonthlyMonitoringPage };
