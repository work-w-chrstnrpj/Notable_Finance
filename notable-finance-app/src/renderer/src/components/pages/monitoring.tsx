
import { useRef, useEffect, useState } from "react";
import { ArrowUpRight, CircleDollarSign, Frown, PiggyBank, Plus, Receipt, Smile, TrendingUp, X } from "lucide-react";
import { useLiveCollections, getIncomeCategorySummaries, getExpenseCategorySummaries } from "@/components/hooks";
import { CategoryDonutChart } from "@/components/charts";
import { categoryPalette, type ForecastIncome, type ForecastKind } from "@/components/constants";
import type { MonitoringSplitDto } from "@shared/finance.types";
import { viewPeriodKey } from "@shared/budget-periods";
import { budgetSourceBadge, monthsInRange, resolveBudgets, type BudgetSource } from "@shared/saved-budgets";
import { PeriodToggle, ViewsToggle } from "@/components/ui/search-bar";
import { usePageControls } from "@/lib/use-page-controls";
import { Panel, MetricCard, Field, FilterSelect, FilterToggle, SegmentedControl, BudgetRow, CategoryCard, MoneyValue } from "@/components/ui";
import { PageToolbar } from "@/components/ui";
import { CategoryIcon } from "@/components/ui/accounts";
import { MetricCardGridSkeleton, PanelSkeleton } from "@/components/ui";
import { DataTable } from "@/components/ui/data-table";
import { useAlkansya, useExpenses, useIncomes } from "@/lib/use-data";
import { useFabRegister } from "@/lib/fab-export-context";
import { SHOT_HIDE_CLASS } from "@/lib/export-node";
import { cx, getExpenseTotal, getIncomeCapitalExpenditureTotal, getIncomeGrossTotal, getIncomeNetTotal, parseNumberInput } from "@/lib/finance-helpers";
import { anchorMonth, computeRange, monitoringModeToUnit, rangeLabel } from "@/lib/date-range";
import { calculateCategoryTotalOverview, getSavingsKeptAsideTotal } from "@/lib/finance-rules";
import { formatMoney, formatPercent } from "@/lib/format";
import { useUiSettings } from "@/lib/ui-settings-context";
import { usePersistedFilters } from "@/features/records/use-persisted-filters";
import {
  BudgetSourceBadge,
  useSavedBudgets,
  usePeriodBudgets,
} from "./monitoring-budgets";
import styles from "./monitoring.module.css";
import type { ExpenseRecord, IncomeRecord, MonitoringViewMode } from "@/types/finance";

const monitoringViewModes: MonitoringViewMode[] = ["Monthly", "Quarterly", "Semi-Annually", "Annually"];

/** The fixed calendar period (ADR-0012) containing the selected month: the month, its quarter, its half or its year. */
function computeMonitoringRange(mode: MonitoringViewMode, anchor: string): { start: string; end: string } {
  return computeRange(monitoringModeToUnit(mode), `${anchor}-15`);
}

function periodLabel(mode: MonitoringViewMode): string {
  if (mode === "Annually") return "Annual";
  if (mode === "Semi-Annually") return "Semi-Annual";
  if (mode === "Quarterly") return "Quarterly";
  return "Monthly";
}

/** "November 2026", "Q4 2026 · Oct – Dec", "H2 2026 · Jul – Dec" or "2026". */
function monitoringRangeLabel(mode: MonitoringViewMode, anchor: string): string {
  return rangeLabel(monitoringModeToUnit(mode), `${anchor}-15`);
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
  const { periodHidden, viewsHidden, togglePeriod, toggleViews } = usePageControls("monitoring");
  const [incomeCategoryView, setIncomeCategoryView] = useState("table");
  const [expenseCategoryView, setExpenseCategoryView] = useState("simplified");
  const [hideZeroIncomeCategories, setHideZeroIncomeCategories] = useState(false);
  const [zeroFilter, setZeroFilter] = useState<ZeroFilter>("all");
  const { normalIncomeCategories, expenseCategories } = useLiveCollections();

  const selectedMonth = anchorMonth(selectedDate);

  // Compute the date range based on view mode
  const range = computeMonitoringRange(viewMode, selectedMonth);

  // Months the range covers: budgets are resolved month by month (Default budgets, or the Custom monthly budget database).
  const rangeMonths = monthsInRange(viewMode, selectedMonth);
  const budgetSource: BudgetSource = settings.monitoringBudgetSource;
  // Custom needs the Custom monthly budget database ID saved in Notion Configuration (ADR-0010).
  const [hasCustomDatabase, setHasCustomDatabase] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void window.api?.budgets?.mirrorStatus?.().then((res) => {
      if (!cancelled && res.ok) setHasCustomDatabase(Boolean(res.data.databaseId));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const { rows: savedBudgetRows } = useSavedBudgets(
    rangeMonths[0],
    rangeMonths[rangeMonths.length - 1],
  );

  const periodBudgetRows = usePeriodBudgets(rangeMonths[0]);

  const period = periodLabel(viewMode);
  const rangeLbl = monitoringRangeLabel(viewMode, selectedMonth);

  const { state: incomesState } = useIncomes({ rangeStart: range.start, rangeEnd: range.end });
  const { state: expensesState } = useExpenses({ rangeStart: range.start, rangeEnd: range.end });
  // Alkansya is the Savings-category income view. Scoped to the same period as
  // the other monitoring metrics so Monthly/Quarterly/Annual stay aligned.
  const { state: alkansyaState } = useAlkansya({ rangeStart: range.start, rangeEnd: range.end });

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
  const periodSavingsRecords: IncomeRecord[] = (
    alkansyaState.status === "success" ? alkansyaState.data : []
  ).filter((record) => !record.name?.includes("[Deleted:"));
  const periodSavingsTotal = getSavingsKeptAsideTotal(periodSavingsRecords);

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
  // Budgets for the range: today's Notion budgets, or each month's saved budgets (ADR-0006).
  const budgetCategories = expenseCategorySummaries.map((category) => ({
    id: category.id,
    name: category.name,
    monthlyBudget: category.monthlyBudget,
  }));
  const resolvedBudgets = resolveBudgets({
    months: rangeMonths,
    categories: budgetCategories,
    snapshots: savedBudgetRows,
    source: budgetSource,
    periodRows: periodBudgetRows,
    periodKey: viewPeriodKey(viewMode, rangeMonths),
  });
  const resolvedById = new Map(resolvedBudgets.perCategory.map((entry) => [entry.categoryId, entry]));
  const budgetBadgeText = budgetSourceBadge(budgetSource, resolvedBudgets.monthsCovered, resolvedBudgets.monthsInRange, resolvedBudgets);
  const expenseBudgetRows = [
    ...expenseCategorySummaries.map((category) => {
      const resolved = resolvedById.get(category.id);
      // Notion source keeps the exact old arithmetic (monthly budget x months) so figures do not move.
      const budget = budgetSource === "default" ? category.monthlyBudget * rangeMonths.length : (resolved?.budget ?? 0);
      return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        spending: category.spending,
        budget,
        remaining: budget - category.spending,
        overview:
          budgetSource === "default"
            ? category.overview
            : `${formatPercent(calculateCategoryTotalOverview(category.spending, budget))} used`,
        totalOverview: category.totalOverview,
      };
    }),
    // Categories that only appear in saved rows (removed or renamed in Notion) stay visible in saved mode.
    ...resolvedBudgets.perCategory
      .filter((entry) => entry.removed)
      .map((entry) => ({
        id: `removed:${entry.categoryId}`,
        name: entry.name,
        icon: null as string | null,
        spending: 0,
        budget: entry.budget,
        remaining: entry.budget,
        overview: `${formatPercent(0)} used`,
        totalOverview: 0,
      })),
  ];
  const visibleExpenseBudgetRows = expenseBudgetRows.filter((row) => {
    if (zeroFilter === "hide-both" && row.budget === 0 && row.spending === 0) return false;
    if (zeroFilter === "hide-budget" && row.budget === 0) return false;
    if (zeroFilter === "hide-spending" && row.spending === 0) return false;
    return true;
  });
  const incomeNetTotal = getIncomeNetTotal(scopedIncomeRecords);
  const incomeGrossTotal = getIncomeGrossTotal(scopedIncomeRecords);
  const incomeCapitalExpenditureTotal = getIncomeCapitalExpenditureTotal(scopedIncomeRecords);
  const budgetSpendingTotal = expenseCategorySummaries.reduce(
    (sum, category) => sum + category.spending,
    0,
  );

  // Budget totals follow the resolved budgets. Spending values are actuals — do NOT scale.
  const scaledMonthlyBudgetTotal = expenseBudgetRows.reduce((sum, row) => sum + row.budget, 0);
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
            <PeriodToggle hidden={periodHidden} onToggle={togglePeriod} />
            <ViewsToggle hidden={viewsHidden} onToggle={toggleViews} />
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

      {/* Same order as Expense and the workflow pages: the period picker first, then the filter-like switch. */}
      {!periodHidden && (
        <SegmentedControl
          label="Monitoring view"
          options={monitoringViewModes.map((mode) => ({ label: mode, value: mode }))}
          value={viewMode}
          onChange={(value) => onViewModeChange(value as MonitoringViewMode)}
        />
      )}
      {!viewsHidden && (
      <div className="toolbar-row">
        <SegmentedControl
          label="Budget source"
          options={[
            { label: "Default", value: "default" },
            {
              label: "Custom",
              value: "custom",
              disabled: !hasCustomDatabase && budgetSource !== "custom",
              title: hasCustomDatabase
                ? "Use the Custom monthly budget database"
                : "Save the Custom monthly budget database ID in Notion Configuration first",
            },
          ]}
          value={budgetSource}
          onChange={(value) => void updateSettings({ monitoringBudgetSource: value as BudgetSource })}
        />
      </div>
      )}
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
        <MetricCard title="Savings" value={formatMoney(periodSavingsTotal)} detail={rangeLbl} icon={PiggyBank} tone="amber" />
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
          <BudgetRow label="For Needs" percent={pct(split.needsPct)} amount={monitoring.forNeeds} />
          <BudgetRow label="For Wants" percent={pct(split.wantsPct)} amount={monitoring.forWants} />
          <BudgetRow label="For Savings" percent={pct(split.savingsPct)} amount={monitoring.forSavings} />
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
          <div className={styles["budget-header-actions"]}>
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
            <BudgetSourceBadge text={budgetBadgeText} muted={budgetSource === "custom" && resolvedBudgets.monthsCovered === 0} />
          </div>
        }
      >
        {expenseCategoryView === "simplified" && (
          <DataTable
            headers={["Expense category", `${period} Budget`, "Spending", "Remaining"]}
            rows={visibleExpenseBudgetRows.map((row) => [
              <span key={`${row.id}-name`} className={styles["category-cell"]}>
                <CategoryIcon icon={row.icon} />
                {row.name}
              </span>,
              formatMoney(row.budget),
              formatMoney(row.spending),
              <MoneyValue key={`${row.id}-remaining`} value={row.remaining} />,
            ])}
            footerRows={[
              ["Total", formatMoney(scaledMonthlyBudgetTotal), formatMoney(scaledBudgetSpendingTotal), <MoneyValue key="remaining-total" value={scaledRemainingTotal} />],
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
            rows={visibleExpenseBudgetRows.map((row) => [
              <span key={`${row.id}-name`} className={styles["category-cell"]}>
                <CategoryIcon icon={row.icon} />
                {row.name}
              </span>,
              formatMoney(row.budget),
              formatMoney(row.spending),
              <MoneyValue key={`${row.id}-remaining`} value={row.remaining} />,
              row.overview,
              formatPercent(row.totalOverview),
            ])}
            footerRows={[
              [
                "Total",
                formatMoney(scaledMonthlyBudgetTotal),
                formatMoney(scaledBudgetSpendingTotal),
                <MoneyValue key="remaining-total" value={scaledRemainingTotal} />,
                "",
                formatPercent(calculateCategoryTotalOverview(budgetSpendingTotal, monitoring.monthlyExpense)),
              ],
            ]}
          />
        )}
        {expenseCategoryView === "chart" && (
          <CategoryDonutChart
            data={visibleExpenseBudgetRows.map((row, index) => ({
              name: row.name,
              value: row.spending,
              color: categoryPalette[index % categoryPalette.length],
            }))}
          />
        )}
        {expenseCategoryView === "cards" && (
          <div className={styles["category-grid"]}>
            {visibleExpenseBudgetRows.map((row) => (
              <CategoryCard
                key={row.id}
                title={row.name}
                detail={`Remaining ${formatMoney(row.remaining, { compact: true })}`}
                value={formatMoney(row.budget, { compact: true })}
                icon={<CategoryIcon icon={row.icon} />}
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
