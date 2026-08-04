
import { useRef, useEffect, useState } from "react";
import { ArrowUpRight, CircleDollarSign, Frown, PiggyBank, Plus, Receipt, Smile, TrendingUp, X } from "lucide-react";
import { useLiveCollections, getIncomeCategorySummaries, getExpenseCategorySummaries } from "@/components/hooks";
import { CategoryDonutChart } from "@/components/charts";
import { categoryPalette, type ForecastIncome, type ForecastKind } from "@/components/constants";
import type { MonitoringSplitDto } from "@shared/finance.types";
import { Panel, MetricCard, Field, FilterSelect, FilterToggle, SegmentedControl, BudgetRow, CategoryCard, MoneyValue } from "@/components/ui";
import { PageToolbar } from "@/components/ui";
import { CategoryIcon } from "@/components/ui/accounts";
import { MetricCardGridSkeleton, PanelSkeleton } from "@/components/ui";
import { DataTable } from "@/components/ui/data-table";
import { useIncomes, useExpenses } from "@/lib/use-data";
import { useFabRegister } from "@/lib/fab-export-context";
import { SHOT_HIDE_CLASS } from "@/lib/export-node";
import { cx, getExpenseTotal, getIncomeCapitalExpenditureTotal, getIncomeGrossTotal, getIncomeNetTotal, getMonthLabel, parseNumberInput } from "@/lib/finance-helpers";
import { anchorMonth } from "@/lib/date-range";
import { calculateCategoryTotalOverview } from "@/lib/finance-rules";
import { formatMoney, formatPercent } from "@/lib/format";
import { useUiSettings } from "@/lib/ui-settings-context";
import { usePersistedFilters } from "@/features/records/use-persisted-filters";
import styles from "./monitoring.module.css";
import type { ExpenseRecord, IncomeRecord, MonitoringViewMode } from "@/types/finance";

const monitoringViewModes: MonitoringViewMode[] = ["Monthly", "Quarterly", "Semi-Annually", "Annually"];

function computeMonitoringRange(mode: MonitoringViewMode, anchor: string): { start: string; end: string } {
  const d = new Date(anchor + "-15"); // mid-month to avoid edge cases
  const y = d.getFullYear();
  const m = d.getMonth(); // 0-indexed

  if (mode === "Annually") {
    return { start: `${y}-01-01`, end: `${y}-12-31` };
  }
  if (mode === "Semi-Annually") {
    // Start from selected month, span 6 months
    const endD = new Date(y, m + 6, 0); // last day of month 5 after anchor (day 0 of m+6 = last day of m+5)
    return {
      start: `${y}-${String(m + 1).padStart(2, "0")}-01`,
      end: `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, "0")}-${String(endD.getDate()).padStart(2, "0")}`,
    };
  }
  if (mode === "Quarterly") {
    // Start from selected month, span 4 months
    const endD = new Date(y, m + 4, 0); // last day of month 3 after anchor (day 0 of m+4 = last day of m+3)
    return {
      start: `${y}-${String(m + 1).padStart(2, "0")}-01`,
      end: `${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, "0")}-${String(endD.getDate()).padStart(2, "0")}`,
    };
  }
  // Monthly - single month
  const endDate = new Date(y, m + 1, 0);
  return { start: `${y}-${String(m + 1).padStart(2, "0")}-01`, end: `${y}-${String(m + 1).padStart(2, "0")}-${endDate.getDate()}` };
}

function periodLabel(mode: MonitoringViewMode): string {
  if (mode === "Annually") return "Annual";
  if (mode === "Semi-Annually") return "Semi-Annual";
  if (mode === "Quarterly") return "Quarterly";
  return "Monthly";
}

function monitoringRangeLabel(mode: MonitoringViewMode, anchor: string): string {
  const d = new Date(anchor + "-15");
  if (mode === "Annually") return anchor.slice(0, 4);
  if (mode === "Semi-Annually") {
    const startLabel = getMonthLabel(anchor).slice(0, 3);
    const endD = new Date(d.getFullYear(), d.getMonth() + 6, 0);
    const endLabel = getMonthLabel(`${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, "0")}`).slice(0, 3);
    return `${startLabel} – ${endLabel} ${anchor.slice(0, 4)}`;
  }
  if (mode === "Quarterly") {
    const startLabel = getMonthLabel(anchor).slice(0, 3);
    const endD = new Date(d.getFullYear(), d.getMonth() + 4, 0);
    const endLabel = getMonthLabel(`${endD.getFullYear()}-${String(endD.getMonth() + 1).padStart(2, "0")}`).slice(0, 3);
    return `${startLabel} – ${endLabel} ${anchor.slice(0, 4)}`;
  }
  return getMonthLabel(anchor);
}

function MonthlyMonitoringPage({
  viewMode,
  onViewModeChange,
  selectedDate,
}: {
  viewMode: MonitoringViewMode;
  onViewModeChange: (viewMode: MonitoringViewMode) => void;
  selectedDate: string;
}) {
  type ZeroFilter = "all" | "hide-both" | "hide-spending" | "hide-budget";
  const { settings, ready: settingsReady, updateSettings } = useUiSettings();
  const [incomeCategoryView, setIncomeCategoryView] = useState("table");
  const [expenseCategoryView, setExpenseCategoryView] = useState("simplified");
  const [hideZeroIncomeCategories, setHideZeroIncomeCategories] = useState(false);
  const [zeroFilter, setZeroFilter] = useState<ZeroFilter>("all");
  const { normalIncomeCategories, expenseCategories } = useLiveCollections();

  const selectedMonth = anchorMonth(selectedDate);

  // Compute the date range based on view mode
  const range = computeMonitoringRange(viewMode, selectedMonth);

  // Compute the period multiplier for budget scaling
  const periodMultiplier = viewMode === "Annually" ? 12 : viewMode === "Semi-Annually" ? 6 : viewMode === "Quarterly" ? 4 : 1;

  const period = periodLabel(viewMode);
  const rangeLbl = monitoringRangeLabel(viewMode, selectedMonth);

  const { state: incomesState } = useIncomes({ rangeStart: range.start, rangeEnd: range.end });
  const { state: expensesState } = useExpenses({ rangeStart: range.start, rangeEnd: range.end });

  usePersistedFilters({
    ready: settingsReady,
    source: settings.monitoringFilters,
    hydrate: (f) => {
      setIncomeCategoryView(f.incomeCategoryView);
      setExpenseCategoryView(f.expenseCategoryView);
      setHideZeroIncomeCategories(f.hideZeroIncomeCategories);
      setZeroFilter(f.zeroFilter);
    },
    values: [incomeCategoryView, expenseCategoryView, hideZeroIncomeCategories, zeroFilter],
    persist: () => {
      void updateSettings({
        monitoringFilters: {
          incomeCategoryView,
          expenseCategoryView,
          hideZeroIncomeCategories,
          zeroFilter,
        },
      });
    },
  });

  // ── Forecast income (Monitoring-only, local, NOT written to Notion) ──────
  // Since real income lands mid/end of month, monthly income can read negative
  // beforehand. A forecast income temporarily props up Monthly Income here.
  // Persisted per-month in localStorage; removed once the real income is logged.
  // Needs/Wants/Savings split from the Notion "Total Monthly Monitoring" row,
  // falling back to the classic 50/30/20 until (or unless) Notion answers.
  const [split, setSplit] = useState<MonitoringSplitDto>({
    needsPct: 0.5,
    wantsPct: 0.3,
    savingsPct: 0.2,
    source: "default",
    rowFound: false,
  });
  useEffect(() => {
    let cancelled = false;
    void window.api?.reports?.monitoringSplit?.().then((res) => {
      if (!cancelled && res?.ok) setSplit(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const forecastKey = `nf_forecast_income_${viewMode}_${range.start}`;
  const [forecasts, setForecasts] = useState<ForecastIncome[]>([]);
  const [forecastModalOpen, setForecastModalOpen] = useState(false);
  const [forecastKind, setForecastKind] = useState<ForecastKind>("income");
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
        label:
          forecastLabel.trim() ||
          (forecastKind === "expense" ? "Forecast expense" : "Forecast income"),
        amount,
        kind: forecastKind,
      },
    ]);
    setForecastLabel("");
    setForecastAmount("");
    setForecastModalOpen(false);
  }

  function removeForecast(id: string) {
    persistForecasts(forecasts.filter((f) => f.id !== id));
  }

  const forecastIncomeTotal = forecasts
    .filter((f) => f.kind !== "expense")
    .reduce((sum, f) => sum + f.amount, 0);
  const forecastExpenseTotal = forecasts
    .filter((f) => f.kind === "expense")
    .reduce((sum, f) => sum + f.amount, 0);


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
  const monthlyIncome = monthlyGrossIncome + forecastIncomeTotal;
  // Pasabuy expenses are fronted for others ("pinasabay lang"), so they are
  // excluded from the user's own Monthly Expense.
  const pasabuyCategoryIds = new Set(
    expenseCategories.filter((c) => /pasabuy/i.test(c.name)).map((c) => c.id),
  );
  const ownExpenseRecords = scopedExpenseRecords.filter(
    (record) => !pasabuyCategoryIds.has(record.categoryId),
  );
  // Forecast expense mirrors forecast income: it lifts Monthly Expense here only.
  const monthlyExpense = getExpenseTotal(ownExpenseRecords) + forecastExpenseTotal;
  const grossMargin = monthlyIncome - monthlyExpense;
  const monitoring = {
    month: selectedMonth,
    monthlyIncome,
    monthlyGrossIncome,
    monthlyCapitalExpenditure,
    monthlyExpense,
    grossMargin,
    forNeeds: monthlyIncome * split.needsPct,
    forWants: monthlyIncome * split.wantsPct,
    forSavings: monthlyIncome * split.savingsPct,
  };
  const pct = (frac: number) => Math.round(frac * 100);
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

  // Scaled budget values: budgets represent monthly allocations, so multiply
  // by the period multiplier. Spending values are actuals — do NOT scale.
  const scaledMonthlyBudgetTotal = monthlyBudgetTotal * periodMultiplier;
  const scaledBudgetSpendingTotal = budgetSpendingTotal; // spending is actual
  const scaledRemainingTotal = scaledMonthlyBudgetTotal - budgetSpendingTotal;

  // Expose this view's DOM to the FAB so it can capture an Insight Shot.
  const { setInsight } = useFabRegister();
  const captureRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setInsight({
      monthLabel: rangeLbl,
      viewLabel: `${period} Insight Shot`,
      getNode: () => captureRef.current,
    });
    return () => setInsight(null);
  }, [rangeLbl, period, setInsight]);


  // P5: Show skeleton while primary data is loading
  const isLoading = incomesState.status === "loading" && expensesState.status === "loading";
  if (isLoading) {
    return (
      <div className="page-stack">
        <section className="metric-grid metric-grid--prototype">
          <MetricCardGridSkeleton count={4} />
        </section>
        <PanelSkeleton rows={5} />
        <PanelSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div className="page-stack" ref={captureRef}>
      <PageToolbar
        title={`${period} Monitoring`}
        actions={
          <>
            <SegmentedControl
              label="Monitoring view"
              options={monitoringViewModes.map((mode) => ({ label: mode, value: mode }))}
              value={viewMode}
              onChange={(value) => onViewModeChange(value as MonitoringViewMode)}
            />
            <button
              type="button"
              className={cx("button button--primary", SHOT_HIDE_CLASS)}
              onClick={() => setForecastModalOpen(true)}
            >
              <Plus size={16} />
              Add Forecast
            </button>
          </>
        }
      />
      {forecasts.length > 0 && (
        <div className={styles["forecast-banner"]}>
          <span className={styles["forecast-banner__icon"]}>
            <TrendingUp size={16} />
          </span>
          <div className={styles["forecast-banner__body"]}>
            <div className={styles["forecast-banner__title"]}>
              <strong>Forecast</strong>
              <span className={styles["forecast-banner__tag"]}>Monitoring only</span>
            </div>
            <div className={styles["forecast-banner__items"]}>
              {forecasts.map((f) => (
                <span
                  key={f.id}
                  className={cx(
                    styles["forecast-chip"],
                    f.kind === "expense" && styles["forecast-chip--expense"],
                  )}
                >
                  <span className={styles["forecast-chip__kind"]}>
                    {f.kind === "expense" ? "Expense" : "Income"}
                  </span>
                  <span className={styles["forecast-chip__label"]}>{f.label}</span>
                  <span className={styles["forecast-chip__amount"]}>
                    {f.kind === "expense" ? "−" : "+"}
                    {formatMoney(f.amount)}
                  </span>
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
          <div className={styles["forecast-banner__total"]}>
            {forecastIncomeTotal > 0 && (
              <span className={styles["forecast-banner__total-line"]}>
                Income <strong>+{formatMoney(forecastIncomeTotal)}</strong>
              </span>
            )}
            {forecastExpenseTotal > 0 && (
              <span className={styles["forecast-banner__total-line"]}>
                Expense <strong>−{formatMoney(forecastExpenseTotal)}</strong>
              </span>
            )}
          </div>
        </div>
      )}
      <section className="metric-grid">
        <MetricCard
          title={`${period} Income`}
          value={formatMoney(monitoring.monthlyIncome)}
          detail={
            forecastIncomeTotal
              ? `${rangeLbl} · incl. ${formatMoney(forecastIncomeTotal, { compact: true })} forecast`
              : rangeLbl
          }
          icon={ArrowUpRight}
          tone="green"
        />
        <MetricCard
          title={`${period} Expense`}
          value={formatMoney(monitoring.monthlyExpense)}
          detail={
            forecastExpenseTotal
              ? `${rangeLbl} · incl. ${formatMoney(forecastExpenseTotal, { compact: true })} forecast`
              : rangeLbl
          }
          icon={Receipt}
          tone="rose"
        />
        <MetricCard title="Gross Margin" value={formatMoney(monitoring.grossMargin)} detail="Income less expenses" icon={CircleDollarSign} tone="blue" />
        <MetricCard title="For Savings" value={formatMoney(monitoring.forSavings)} detail={`${pct(split.savingsPct)}% allocation`} icon={PiggyBank} tone="amber" />
      </section>
      <section className="two-column">
        <Panel
          title="Budget Allocation"
          action={
            <span className={styles["allocation-source"]} title="Where these percentages come from">
              {split.source === "notion"
                ? "Notion"
                : "Default 50 / 30 / 20"}
            </span>
          }
        >
          <BudgetRow label="Needs" percent={pct(split.needsPct)} amount={monitoring.forNeeds} />
          <BudgetRow label="Wants" percent={pct(split.wantsPct)} amount={monitoring.forWants} />
          <BudgetRow label="Savings" percent={pct(split.savingsPct)} amount={monitoring.forSavings} />
        </Panel>
        <Panel title={`${period} Insight`}>
          {(() => {
            const setBudget = monitoring.forNeeds + monitoring.forWants;
            // On track when actual spending stays within the Needs+Wants budget.
            const onTrack = monitoring.monthlyExpense <= setBudget;
            const difference = Math.abs(setBudget - monitoring.monthlyExpense);
            return (
              <div className={cx(styles.insight, onTrack ? styles["insight--good"] : styles["insight--bad"])}>
                <span className={styles.insight__icon}>
                  {onTrack ? <Smile size={40} /> : <Frown size={40} />}
                </span>
                <div className={styles.insight__body}>
                  <p className={styles.insight__budget}>
                    Total Set Budget: <strong>{formatMoney(setBudget)}</strong>
                  </p>
                  <p className={styles.insight__message}>
                    {onTrack
                      ? `You spent ${formatMoney(difference)} less than your set budget ${viewMode === "Monthly" ? "this month" : "this period"} — you're on track!`
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
          <div className={cx(styles["panel-header-actions"], SHOT_HIDE_CLASS)}>
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
              <span key={`${category.id}-name`} className={styles["category-cell"]}>
                <CategoryIcon icon={category.icon} />
                {category.source}
              </span>,
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
          <div className={styles["category-grid"]}>
            {visibleIncomeCategorySummaries.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.source}
                detail={formatPercent(category.earningPercentage)}
                value={formatMoney(category.netIncome)}
                icon={<CategoryIcon icon={category.icon} />}
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title={`${period} Budget`}
        action={
          <div className={cx(styles["panel-header-actions"], SHOT_HIDE_CLASS)}>
            <SegmentedControl
              label="Expense category view"
              options={[
                { label: "Simplified", value: "simplified" },
                { label: "Breakdown", value: "breakdown" },
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
            headers={["Expense category", `${period} Budget`, "Spending", "Remaining"]}
            rows={visibleExpenseCategorySummaries.map((category) => [
              <span key={`${category.id}-name`} className={styles["category-cell"]}>
                <CategoryIcon icon={category.icon} />
                {category.name}
              </span>,
              formatMoney(category.monthlyBudget * periodMultiplier),
              formatMoney(category.spending),
              formatMoney(category.monthlyBudget * periodMultiplier - category.spending),
            ])}
            footerRows={[
              ["Total", formatMoney(scaledMonthlyBudgetTotal), formatMoney(scaledBudgetSpendingTotal), formatMoney(scaledRemainingTotal)],
            ]}
          />
        )}
        {expenseCategoryView === "breakdown" && (
          <DataTable
            headers={[
              "Expense category",
              `${period} Budget`,
              "Spending",
              "Remaining",
              "Overview",
              "Total Overview",
            ]}
            rows={visibleExpenseCategorySummaries.map((category) => [
              <span key={`${category.id}-name`} className={styles["category-cell"]}>
                <CategoryIcon icon={category.icon} />
                {category.name}
              </span>,
              formatMoney(category.monthlyBudget * periodMultiplier),
              formatMoney(category.spending),
              formatMoney(category.monthlyBudget * periodMultiplier - category.spending),
              category.overview,
              formatPercent(category.totalOverview),
            ])}
            footerRows={[
              [
                "Total",
                formatMoney(scaledMonthlyBudgetTotal),
                formatMoney(scaledBudgetSpendingTotal),
                formatMoney(scaledRemainingTotal),
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
          <div className={styles["category-grid"]}>
            {visibleExpenseCategorySummaries.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.name}
                detail={`Remaining ${formatMoney(category.monthlyBudget * periodMultiplier - category.spending, { compact: true })}`}
                value={formatMoney(category.monthlyBudget * periodMultiplier, { compact: true })}
                icon={<CategoryIcon icon={category.icon} />}
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
            className={cx("modal-panel", styles["modal-panel--narrow"])}
            role="dialog"
          >
            <div className="modal-panel__header">
              <div>
                <h2 id="forecast-modal-title">Add Forecast</h2>
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
                <Field label="Type">
                  <SegmentedControl
                    label="Forecast type"
                    options={[
                      { label: "Income", value: "income" },
                      { label: "Expense", value: "expense" },
                    ]}
                    value={forecastKind}
                    onChange={(value) => setForecastKind(value as ForecastKind)}
                  />
                </Field>
                <Field label="Label">
                  <input
                    placeholder={
                      forecastKind === "expense"
                        ? "e.g. Rent (due 30th)"
                        : "e.g. Salary (15th)"
                    }
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
