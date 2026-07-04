"use client";

import Link from "next/link";
import type { Route } from "next";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  Database,
  FileWarning,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  PiggyBank,
  Plus,
  Receipt,
  RefreshCw,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  accounts,
  expenseCategories,
  expenseRecords,
  financeSections,
  getAccountName,
  getActiveSectionLabel,
  getExpenseCategoryName,
  getIncomeCategoryName,
  incomeCategories,
  incomeRecords,
  months,
  syncLog,
} from "@/lib/finance-data";
import {
  calculateCategoryTotalOverview,
  calculateExpectedPaymentDate,
  calculateGrossPrice,
  calculateInstallmentAmount,
  calculateNetIncome,
  calculatePaidAmount,
  calculatePasabuyerBalance,
  calculatePasabuyReceivedAmount,
  calculateRemainingBalance,
  calculateTotalCashFlow,
  getExpenseConditionalSections,
  getExpenseStatusFromDatePaid,
  getMoneyValueTone,
  getNormalIncomeCategories,
  getWorkflowFixedCategory,
  getMonthKeyFromIsoDate,
  isExpenseRecordInViewScope,
  isIncomeRecordInViewScope,
  isCreditAccountExpense,
  isCreditLikeAccountType,
  isOutstandingExpense,
  isPasabuyCategoryName,
  isUnpaidPasabuyExpense,
  pasabuyerLabels,
  pasabuyStatusLabels,
  paymentFrequencyLabels,
  paymentStatusLabels,
  shouldShowGlobalMonthSelector,
} from "@/lib/finance-rules";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import type {
  ExpenseViewMode,
  FinanceSection,
  FinanceSectionId,
  IncomeViewMode,
  PasabuyStatus,
  PaymentFrequency,
  PaymentStatus,
  SchemaHealth,
  SyncState,
  WorkflowSectionId,
} from "@/types/finance";

const sectionIcons: Record<FinanceSectionId, LucideIcon> = {
  dashboard: LayoutDashboard,
  accounts: WalletCards,
  income: ArrowUpRight,
  expense: Receipt,
  "monthly-monitoring": CalendarDays,
  transfer: ArrowDownRight,
  "credit-card-payment": CreditCard,
  alkansya: PiggyBank,
  receivables: Banknote,
  sync: RefreshCw,
  settings: Settings,
};

const incomeViewModes: IncomeViewMode[] = ["Daily", "Weekly", "Monthly", "Annually"];
const expenseViewModes: ExpenseViewMode[] = [
  "Daily",
  "Weekly",
  "Monthly",
  "Unpaid Pasabuy",
  "To pay",
  "To buy",
  "Installments",
  "CC Transactions",
];

const activeAccounts = accounts.filter((account) => !account.inactive);
const nonCreditActiveAccounts = activeAccounts.filter((account) => !isCreditLikeAccountType(account.type));
const creditActiveAccounts = activeAccounts.filter((account) => isCreditLikeAccountType(account.type));
const normalIncomeCategories = getNormalIncomeCategories(incomeCategories);
const expenseCategoryFilterAll = "__all";
const expenseCategoryFilterWithoutPasabuy = "__without-pasabuy";
const prototypeAccent = "#5B6CF9";

const categoryPalette = [prototypeAccent, "#0D9488", "#D97706", "#E11D48", "#7C3AED", "#64748B"];

type ModalState = {
  mode: "new" | "edit";
  title: string;
} | null;

type AccountScope = "all" | "standard" | "credit";
type ComputedValueTone = "green" | "rose" | "amber" | "ink";

function getMonthLabel(value: string) {
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getShortMonthLabel(value: string) {
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(date);
}

function getAdjacentMonth(value: string, delta: number) {
  const index = months.indexOf(value);

  if (index === -1) {
    return value;
  }

  return months[(index + delta + months.length) % months.length];
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function parseNumberInput(value: string) {
  const parsed = Number(value.replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

function parseOptionalNumberInput(value: string) {
  if (value.trim() === "") {
    return null;
  }

  return parseNumberInput(value);
}

function isSpecificExpenseCategoryFilter(value: string) {
  return value !== expenseCategoryFilterAll && value !== expenseCategoryFilterWithoutPasabuy;
}

function matchesExpenseCategoryFilter(
  categoryId: string,
  categoryName: string,
  filterValue: string,
) {
  if (filterValue === expenseCategoryFilterAll) {
    return true;
  }

  if (filterValue === expenseCategoryFilterWithoutPasabuy) {
    return !isPasabuyCategoryName(categoryName);
  }

  return categoryId === filterValue;
}

function matchesExpenseViewMode(
  record: (typeof expenseRecords)[number],
  categoryName: string,
  viewMode: ExpenseViewMode,
) {
  if (viewMode === "Daily" || viewMode === "Weekly" || viewMode === "Monthly") {
    return true;
  }

  if (viewMode === "Unpaid Pasabuy") {
    return isUnpaidPasabuyExpense(record, categoryName);
  }

  if (viewMode === "To pay") {
    return isOutstandingExpense(record);
  }

  if (viewMode === "To buy") {
    return record.paymentStatus === "Unpaid" && isOutstandingExpense(record);
  }

  if (viewMode === "Installments") {
    return record.paymentStatus === "Installment" && isOutstandingExpense(record);
  }

  return isCreditAccountExpense(record, accounts) && isOutstandingExpense(record);
}

function getIncomeRecordsForMonth(month: string) {
  return incomeRecords.filter((record) => getMonthKeyFromIsoDate(record.date) === month);
}

function getExpenseRecordsForMonth(month: string) {
  return expenseRecords.filter((record) => getMonthKeyFromIsoDate(record.purchaseDate) === month);
}

function getIncomeGrossTotal(records: typeof incomeRecords) {
  return records.reduce((sum, record) => sum + record.grossIncome, 0);
}

function getIncomeCapitalExpenditureTotal(records: typeof incomeRecords) {
  return records.reduce((sum, record) => sum + record.capitalExpenditure, 0);
}

function getIncomeNetTotal(records: typeof incomeRecords) {
  return records.reduce(
    (sum, record) => sum + calculateNetIncome(record.grossIncome, record.capitalExpenditure),
    0,
  );
}

function getExpenseTotal(records: typeof expenseRecords) {
  return records.reduce((sum, record) => sum + record.amount, 0);
}

function getAvailableCreditTotal() {
  return creditActiveAccounts.reduce((sum, account) => sum + (account.availableLimit ?? 0), 0);
}

function getCreditLimitTotal() {
  return creditActiveAccounts.reduce((sum, account) => sum + (account.creditLimit ?? 0), 0);
}

function getCreditBalanceTotal() {
  return creditActiveAccounts.reduce((sum, account) => sum + Math.abs(account.currentBalance), 0);
}

function getPasabuyBalance(records: typeof expenseRecords) {
  return records.reduce((sum, record) => {
    const categoryName = getExpenseCategoryName(record.categoryId);

    if (!isUnpaidPasabuyExpense(record, categoryName)) {
      return sum;
    }

    const grossPrice = calculateGrossPrice(record.amount, record.interest);
    const installmentAmount = calculateInstallmentAmount({
      grossPrice,
      paymentStatus: record.paymentStatus,
      periodCount: record.periodCount,
    });
    const receivedAmount = calculatePasabuyReceivedAmount({
      grossPrice,
      pasabuyStatus: record.pasabuyStatus ?? "",
      installmentAmount,
      pasabuyPaidPeriod: record.pasabuyPaidPeriod,
      periodCount: record.periodCount,
    });

    return sum + calculatePasabuyerBalance(grossPrice, receivedAmount);
  }, 0);
}

function getIncomeCategorySummaries(records: typeof incomeRecords) {
  const totalNetIncome = getIncomeNetTotal(records);

  return normalIncomeCategories.map((category) => {
    const categoryRecords = records.filter((record) => record.categoryId === category.id);
    const grossIncome = getIncomeGrossTotal(categoryRecords);
    const capitalExpenditure = getIncomeCapitalExpenditureTotal(categoryRecords);
    const netIncome = getIncomeNetTotal(categoryRecords);

    return {
      id: category.id,
      source: category.source,
      grossIncome,
      capitalExpenditure,
      netIncome,
      earningPercentage: calculateCategoryTotalOverview(netIncome, totalNetIncome),
    };
  });
}

function getExpenseCategorySummaries(records: typeof expenseRecords) {
  const totalExpense = getExpenseTotal(records);

  return expenseCategories
    .filter((category) => category.auxiliary === "No")
    .map((category) => {
      const categoryRecords = records.filter((record) => record.categoryId === category.id);
      const spending = getExpenseTotal(categoryRecords);
      const remaining = category.monthlyBudget - spending;
      const usage = calculateCategoryTotalOverview(spending, category.monthlyBudget);

      return {
        id: category.id,
        name: category.name,
        monthlyBudget: category.monthlyBudget,
        upcomingBudget: category.upcomingBudget,
        auxiliary: category.auxiliary,
        spending,
        remaining,
        overview: `${formatPercent(usage)} used`,
        totalOverview: calculateCategoryTotalOverview(spending, totalExpense),
      };
    });
}

function getMonthlyMonitoringSnapshot(month: string) {
  const scopedIncomeRecords = getIncomeRecordsForMonth(month);
  const scopedExpenseRecords = getExpenseRecordsForMonth(month);
  const monthlyIncome = getIncomeNetTotal(scopedIncomeRecords);
  const monthlyExpense = getExpenseTotal(scopedExpenseRecords);
  const grossMargin = monthlyIncome - monthlyExpense;

  return {
    month,
    monthlyIncome,
    monthlyGrossIncome: getIncomeGrossTotal(scopedIncomeRecords),
    monthlyCapitalExpenditure: getIncomeCapitalExpenditureTotal(scopedIncomeRecords),
    monthlyExpense,
    grossMargin,
    forNeeds: grossMargin * 0.5,
    forWants: grossMargin * 0.2,
    forSavings: grossMargin * 0.3,
  };
}

function getDashboardTrendData(selectedMonth: string) {
  const selectedIndex = Math.max(months.indexOf(selectedMonth), 0);
  const trendMonths = months.slice(Math.max(selectedIndex - 5, 0), selectedIndex + 1);

  return trendMonths.map((month) => ({
    month: getShortMonthLabel(month),
    income: getIncomeNetTotal(getIncomeRecordsForMonth(month)),
    expenses: getExpenseTotal(getExpenseRecordsForMonth(month)),
  }));
}

function getSpendingBreakdownData(records: typeof expenseRecords) {
  return getExpenseCategorySummaries(records)
    .filter((category) => category.spending > 0)
    .map((category, index) => ({
      name: category.name,
      value: category.spending,
      color: categoryPalette[index % categoryPalette.length],
    }));
}

function getRecentTransactionsData(
  scopedIncomeRecords: typeof incomeRecords,
  scopedExpenseRecords: typeof expenseRecords,
) {
  return [
    ...scopedIncomeRecords.map((record) => ({
      id: record.id,
      date: record.date,
      title: record.name,
      meta: `${getIncomeCategoryName(record.categoryId)} - ${formatDate(record.date)}`,
      value: calculateNetIncome(record.grossIncome, record.capitalExpenditure),
      tone: "green" as const,
    })),
    ...scopedExpenseRecords.map((record) => ({
      id: record.id,
      date: record.purchaseDate,
      title: record.description,
      meta: `${getExpenseCategoryName(record.categoryId)} - ${formatDate(record.purchaseDate)}`,
      value: -record.amount,
      tone: "rose" as const,
    })),
  ]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 5);
}

export function FinanceWorkspace({ activeSection }: { activeSection: FinanceSectionId }) {
  const [selectedMonth, setSelectedMonth] = useState("2026-07");
  const [incomeViewMode, setIncomeViewMode] = useState<IncomeViewMode>("Monthly");
  const [expenseViewMode, setExpenseViewMode] = useState<ExpenseViewMode>("Monthly");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [schemaHealth, setSchemaHealth] = useState<SchemaHealth>("notChecked");
  const [pendingOperations, setPendingOperations] = useState(3);
  const [lastSync, setLastSync] = useState("2026-07-03 09:30");

  function runSync() {
    setSyncState("syncing");
    window.setTimeout(() => {
      setSyncState("fresh");
      setPendingOperations(0);
      setLastSync("2026-07-03 09:42");
    }, 700);
  }

  function verifySchema() {
    setSchemaHealth("warning");
  }

  return (
    <div className={cx("workspace", sidebarCollapsed && "workspace--sidebar-collapsed")}>
      <Sidebar
        activeSection={activeSection}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((current) => !current)}
      />
      <div className="workspace__main">
        <TopBar
          activeSection={activeSection}
          expenseViewMode={expenseViewMode}
          incomeViewMode={incomeViewMode}
          lastSync={lastSync}
          pendingOperations={pendingOperations}
          schemaHealth={schemaHealth}
          selectedMonth={selectedMonth}
          syncState={syncState}
          onMonthChange={setSelectedMonth}
          onSync={runSync}
        />
        <main className="workspace__content">
          {activeSection === "dashboard" && (
            <DashboardPage
              lastSync={lastSync}
              pendingOperations={pendingOperations}
              selectedMonth={selectedMonth}
            />
          )}
          {activeSection === "accounts" && <AccountsPage />}
          {activeSection === "income" && (
            <IncomePage
              selectedMonth={selectedMonth}
              viewMode={incomeViewMode}
              onViewModeChange={setIncomeViewMode}
            />
          )}
          {activeSection === "expense" && (
            <ExpensePage
              selectedMonth={selectedMonth}
              viewMode={expenseViewMode}
              onViewModeChange={setExpenseViewMode}
            />
          )}
          {activeSection === "monthly-monitoring" && (
            <MonthlyMonitoringPage selectedMonth={selectedMonth} />
          )}
          {isWorkflowSection(activeSection) && (
            <WorkflowPage section={activeSection} selectedMonth={selectedMonth} />
          )}
          {activeSection === "sync" && (
            <SyncPage
              lastSync={lastSync}
              pendingOperations={pendingOperations}
              schemaHealth={schemaHealth}
              syncState={syncState}
              onSchemaVerify={verifySchema}
              onSync={runSync}
            />
          )}
          {activeSection === "settings" && (
            <SettingsPage schemaHealth={schemaHealth} onSchemaVerify={verifySchema} />
          )}
        </main>
      </div>
    </div>
  );
}

function isWorkflowSection(section: FinanceSectionId): section is WorkflowSectionId {
  return (
    section === "transfer" ||
    section === "credit-card-payment" ||
    section === "alkansya" ||
    section === "receivables"
  );
}

function Sidebar({
  activeSection,
  collapsed,
  onToggle,
}: {
  activeSection: FinanceSectionId;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const groupedSections = useMemo(
    () => ({
      primary: financeSections.filter((section) => section.group === "primary"),
      workflow: financeSections.filter((section) => section.group === "workflow"),
      system: financeSections.filter((section) => section.group === "system"),
    }),
    [],
  );

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand__mark">N</div>
        <div>
          <p className="brand__name">Notion Finance</p>
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggle}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
      <nav className="nav" aria-label="Finance sections">
        <NavGroup title="Core" sections={groupedSections.primary} activeSection={activeSection} />
        <NavGroup title="Workflows" sections={groupedSections.workflow} activeSection={activeSection} />
        <NavGroup title="System" sections={groupedSections.system} activeSection={activeSection} />
      </nav>
      <div className="sidebar-profile">
        <div className="sidebar-profile__avatar">CP</div>
        <div>
          <p>Christian Paje</p>
          <span>Owner</span>
        </div>
        <button type="button" title="Sign out">
          <LogOut size={13} />
        </button>
      </div>
    </aside>
  );
}

function NavGroup({
  title,
  sections,
  activeSection,
}: {
  title: string;
  sections: FinanceSection[];
  activeSection: FinanceSectionId;
}) {
  return (
    <div className="nav__group">
      <p className="nav__title">{title}</p>
      {sections.map((section) => {
        const Icon = sectionIcons[section.id];
        return (
          <Link
            key={section.id}
            href={`/${section.id}` as Route}
            className={cx("nav__item", activeSection === section.id && "nav__item--active")}
          >
            <Icon size={17} />
            <span>{section.shortLabel ?? section.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function TopBar({
  activeSection,
  expenseViewMode,
  incomeViewMode,
  lastSync,
  pendingOperations,
  schemaHealth,
  selectedMonth,
  syncState,
  onMonthChange,
  onSync,
}: {
  activeSection: FinanceSectionId;
  expenseViewMode: ExpenseViewMode;
  incomeViewMode: IncomeViewMode;
  lastSync: string;
  pendingOperations: number;
  schemaHealth: SchemaHealth;
  selectedMonth: string;
  syncState: SyncState;
  onMonthChange: (month: string) => void;
  onSync: () => void;
}) {
  const showMonthSelector = shouldShowGlobalMonthSelector({
    section: activeSection,
    incomeViewMode,
    expenseViewMode,
  });

  return (
    <header className="topbar">
      <div className="topbar__actions" aria-label="Workspace controls">
        {showMonthSelector && (
          <div className="month-stepper" aria-label="Selected month">
            <button type="button" onClick={() => onMonthChange(getAdjacentMonth(selectedMonth, -1))}>
              <ChevronLeft size={13} />
            </button>
            <span>{getMonthLabel(selectedMonth)}</span>
            <button type="button" onClick={() => onMonthChange(getAdjacentMonth(selectedMonth, 1))}>
              <ChevronRight size={13} />
            </button>
          </div>
        )}
        <StatusPill syncState={syncState} schemaHealth={schemaHealth} />
        <span className="sync-meta">{pendingOperations} pending</span>
        <span className="sync-meta">Last sync {lastSync}</span>
        <button type="button" className="button button--primary" onClick={onSync}>
          <RefreshCw size={12} className={syncState === "syncing" ? "spin" : undefined} />
          Sync
        </button>
        <div className="topbar__avatar">CP</div>
      </div>
    </header>
  );
}

function StatusPill({
  syncState,
  schemaHealth,
}: {
  syncState: SyncState;
  schemaHealth: SchemaHealth;
}) {
  if (syncState === "syncing") {
    return (
      <span className="pill pill--info">
        <RefreshCw size={14} className="spin" />
        Syncing
      </span>
    );
  }

  if (schemaHealth === "warning") {
    return (
      <span className="pill pill--warning">
        <FileWarning size={14} />
        Schema review
      </span>
    );
  }

  if (schemaHealth === "verified" || syncState === "fresh") {
    return (
      <span className="pill pill--success">
        <CheckCircle2 size={14} />
        Fresh
      </span>
    );
  }

  return (
    <span className="pill">
      <Gauge size={14} />
      Ready
    </span>
  );
}

function DashboardPage({
  lastSync,
  pendingOperations,
  selectedMonth,
}: {
  lastSync: string;
  pendingOperations: number;
  selectedMonth: string;
}) {
  const totalCashFlow = calculateTotalCashFlow(accounts);
  const scopedIncomeRecords = getIncomeRecordsForMonth(selectedMonth);
  const scopedExpenseRecords = getExpenseRecordsForMonth(selectedMonth);
  const monthlyGrossIncome = getIncomeGrossTotal(scopedIncomeRecords);
  const monthlyNetIncome = getIncomeNetTotal(scopedIncomeRecords);
  const monthlyExpenses = getExpenseTotal(scopedExpenseRecords);
  const monthlyExpenseSummaries = getExpenseCategorySummaries(scopedExpenseRecords);
  const spendingBreakdownData = getSpendingBreakdownData(scopedExpenseRecords);
  const recentTransactionsData = getRecentTransactionsData(scopedIncomeRecords, scopedExpenseRecords);
  const pasabuyBalance = getPasabuyBalance(scopedExpenseRecords);
  const monthLabel = getMonthLabel(selectedMonth);

  return (
    <div className="page-stack">
      <section className="metric-grid metric-grid--prototype">
        <MetricCard
          title="Total Cash Flow"
          value={formatMoney(totalCashFlow)}
          detail="Non-credit accounts"
          icon={WalletCards}
          tone="blue"
        />
        <MetricCard
          title="Monthly Net Income"
          value={formatMoney(monthlyNetIncome)}
          detail={monthLabel}
          icon={ArrowUpRight}
          tone="green"
        />
        <MetricCard
          title="Monthly Expenses"
          value={formatMoney(monthlyExpenses)}
          detail={monthLabel}
          icon={Receipt}
          tone="rose"
        />
        <MetricCard
          title="Sync Queue"
          value={`${pendingOperations}`}
          detail={`Last sync ${lastSync}`}
          icon={RefreshCw}
          tone="amber"
        />
      </section>

      <section className="metric-grid metric-grid--prototype">
        <MetricCard
          title="Available Credit"
          value={formatMoney(getAvailableCreditTotal())}
          detail={`Limit ${formatMoney(getCreditLimitTotal(), { compact: true })}`}
          icon={CreditCard}
          tone="blue"
        />
        <MetricCard
          title="Monthly Gross"
          value={formatMoney(monthlyGrossIncome)}
          detail={monthLabel}
          icon={Banknote}
          tone="green"
        />
        <MetricCard
          title="Pasabuy Balance"
          value={formatMoney(pasabuyBalance)}
          detail="Unpaid Pasabuy"
          icon={PiggyBank}
          tone="amber"
        />
        <MetricCard
          title="CC Balance Total"
          value={formatMoney(getCreditBalanceTotal())}
          detail={`${creditActiveAccounts.length} credit accounts`}
          icon={AlertTriangle}
          tone="rose"
        />
      </section>

      <section className="dashboard-chart-grid">
        <IncomeExpenseChart data={getDashboardTrendData(selectedMonth)} />
        <SpendingBreakdownCard data={spendingBreakdownData} monthLabel={monthLabel} />
      </section>

      <section className="dashboard-bottom-grid">
        <BudgetUsageCard summaries={monthlyExpenseSummaries} />
        <RecentTransactionsList records={recentTransactionsData} />
      </section>
    </div>
  );
}

function RecentTransactionsList({
  records,
}: {
  records: Array<{
    id: string;
    title: string;
    meta: string;
    value: number;
    tone: "green" | "rose";
  }>;
}) {
  return (
    <section className="dashboard-card recent-list-card">
      <div className="recent-list-card__header">
        <h2>Recent Transactions</h2>
        <Link href={"/income" as Route}>View all</Link>
      </div>
      <div className="recent-list">
        {records.map((record) => {
          const Icon = record.tone === "green" ? ArrowDownRight : ArrowUpRight;
          const prefix = record.value > 0 ? "+" : "-";

          return (
            <button type="button" className="recent-list__row" key={record.id}>
              <span className={cx("recent-list__icon", `recent-list__icon--${record.tone}`)}>
                <Icon size={16} />
              </span>
              <span className="recent-list__copy">
                <strong>{record.title}</strong>
                <span>{record.meta}</span>
              </span>
              <span className={cx("recent-list__amount", `recent-list__amount--${record.tone}`)}>
                {prefix}
                {formatMoney(Math.abs(record.value), { compact: true })}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function IncomeExpenseChart({
  data,
}: {
  data: Array<{ month: string; income: number; expenses: number }>;
}) {
  return (
    <section className="dashboard-card dashboard-card--income-expense">
      <div className="dashboard-card__header">
        <div>
          <h2>Income vs Expenses</h2>
          <p>Last 6 months</p>
        </div>
        <div className="chart-legend">
          <span><i style={{ backgroundColor: prototypeAccent }} />Income</span>
          <span><i style={{ backgroundColor: "#FB7185" }} />Expenses</span>
        </div>
      </div>
      <div className="income-expense-chart" aria-label="Income versus expenses chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={prototypeAccent} stopOpacity={0.18} />
                <stop offset="95%" stopColor={prototypeAccent} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E11D48" stopOpacity={0.14} />
                <stop offset="95%" stopColor="#E11D48" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,25,23,0.06)" />
            <XAxis
              axisLine={false}
              dataKey="month"
              tick={{ fontSize: 12, fill: "#79716B" }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              domain={[0, 120000]}
              tick={{ fontSize: 11, fill: "#79716B" }}
              tickFormatter={(value) => `₱${(Number(value) / 1000).toFixed(0)}k`}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(28,25,23,0.09)",
                borderRadius: 12,
                boxShadow: "0 16px 34px rgba(28,25,23,0.1)",
                fontSize: 13,
              }}
              formatter={(value, name) => [
                formatMoney(Number(value)),
                name === "income" ? "Income" : "Expenses",
              ]}
              labelStyle={{ color: "#1C1917", marginBottom: 8 }}
            />
            <Area
              activeDot={{ r: 4, stroke: "#FFFFFF", strokeWidth: 2 }}
              dataKey="income"
              fill="url(#incomeGradient)"
              isAnimationActive={false}
              stroke={prototypeAccent}
              strokeWidth={2.25}
              type="monotone"
            />
            <Area
              activeDot={{ r: 4, stroke: "#FFFFFF", strokeWidth: 2 }}
              dataKey="expenses"
              fill="url(#expenseGradient)"
              isAnimationActive={false}
              stroke="#E11D48"
              strokeWidth={2.25}
              type="monotone"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function SpendingBreakdownCard({
  data,
  monthLabel,
}: {
  data: Array<{ name: string; value: number; color: string }>;
  monthLabel: string;
}) {
  return (
    <section className="dashboard-card dashboard-card--spending">
      <div className="dashboard-card__header dashboard-card__header--stacked">
        <h2>Spending Breakdown</h2>
        <p>{monthLabel}</p>
      </div>
      <div className="spending-donut" aria-label="Spending breakdown donut chart">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                cx="50%"
                cy="50%"
                data={data}
                dataKey="value"
                innerRadius={47}
                isAnimationActive={false}
                outerRadius={76}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid rgba(28,25,23,0.09)",
                  borderRadius: 10,
                  fontSize: 12,
                }}
                formatter={(value) => formatMoney(Number(value))}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState title="No spending" detail="No expenses are scoped to this month." />
        )}
      </div>
      <div className="spending-list">
        {data.map((item) => (
          <div key={item.name} className="spending-list__row">
            <span><i style={{ backgroundColor: item.color }} />{item.name}</span>
            <strong>{formatMoney(item.value, { compact: true })}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function BudgetUsageCard({
  summaries,
}: {
  summaries: ReturnType<typeof getExpenseCategorySummaries>;
}) {
  return (
    <section className="dashboard-card">
      <div className="dashboard-card__header dashboard-card__header--stacked">
        <h2>Budget Usage</h2>
        <p>Top spending categories</p>
      </div>
      <div className="budget-usage-list">
        {summaries.slice(0, 5).map((category) => {
          const percent = Math.min(
            category.monthlyBudget > 0 ? Math.round((category.spending / category.monthlyBudget) * 100) : 0,
            100,
          );
          const color = percent > 90 ? "#E11D48" : percent > 75 ? "#D97706" : prototypeAccent;

          return (
            <div key={category.id} className="budget-usage-row">
              <div>
                <span>{category.name}</span>
                <strong>{percent}%</strong>
              </div>
              <div className="budget-usage-track">
                <i style={{ width: `${percent}%`, backgroundColor: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AccountsPage() {
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [accountScope, setAccountScope] = useState<AccountScope>("standard");
  const visibleAccounts = accounts.filter((account) => {
    if (accountScope === "all") {
      return true;
    }

    if (accountScope === "credit") {
      return !account.inactive && isCreditLikeAccountType(account.type);
    }

    return !account.inactive && !isCreditLikeAccountType(account.type);
  });
  const accountTableHeaders =
    accountScope === "standard"
      ? ["Account", "Type", "Balance", "Total Income", "Total Expense"]
      : ["Account", "Type", "Balance", "Credit Limit", "Available Balance", "Billing", "Due"];
  const accountTableRows = visibleAccounts.map((account) => {
    if (accountScope === "standard") {
      return [
        account.name,
        account.type,
        formatMoney(account.currentBalance),
        formatMoney(getAccountTotalIncome(account.id), { compact: true }),
        formatMoney(getAccountTotalExpense(account.id), { compact: true }),
      ];
    }

    return [
      account.name,
      account.type,
      formatMoney(account.currentBalance),
      account.creditLimit !== null ? formatMoney(account.creditLimit, { compact: true }) : "-",
      account.availableLimit !== null ? formatMoney(account.availableLimit, { compact: true }) : "-",
      account.billingDay?.toString() ?? "-",
      account.dueDay?.toString() ?? "-",
    ];
  });

  function getAccountTotalIncome(accountId: string) {
    return incomeRecords
      .filter((record) => record.accountId === accountId)
      .reduce(
        (sum, record) => sum + calculateNetIncome(record.grossIncome, record.capitalExpenditure),
        0,
      );
  }

  function getAccountTotalExpense(accountId: string) {
    return expenseRecords
      .filter((record) => record.accountId === accountId)
      .reduce((sum, record) => sum + record.amount, 0);
  }

  return (
    <div className="page-stack">
      <PageToolbar
        title="Accounts"
        actions={
          <>
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
            <article className="account-card" key={account.id}>
              <div className="account-card__top">
                <div>
                  <h2>{account.name}</h2>
                  {account.inactive && <p>Inactive account</p>}
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
              {account.creditLimit !== null && (
                <MoneyLine label="Credit Limit" value={account.creditLimit} />
              )}
              {account.availableLimit !== null && (
                <MoneyLine label="Available Limit" value={account.availableLimit} />
              )}
            </article>
          ))}
        </section>
      ) : (
        <DataTable
          headers={accountTableHeaders}
          rows={accountTableRows}
        />
      )}
    </div>
  );
}

function IncomePage({
  selectedMonth,
  viewMode,
  onViewModeChange,
}: {
  selectedMonth: string;
  viewMode: IncomeViewMode;
  onViewModeChange: (viewMode: IncomeViewMode) => void;
}) {
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [grossIncomeInput, setGrossIncomeInput] = useState("");
  const [capitalExpenditureInput, setCapitalExpenditureInput] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const calculatedNetIncome = calculateNetIncome(
    parseNumberInput(grossIncomeInput),
    parseNumberInput(capitalExpenditureInput),
  );
  const visibleIncomeRecords = incomeRecords.filter((record) => {
    if (!isIncomeRecordInViewScope(record, viewMode, selectedMonth)) {
      return false;
    }

    if (accountId && record.accountId !== accountId) {
      return false;
    }

    if (categoryId && record.categoryId !== categoryId) {
      return false;
    }

    return true;
  });

  function openIncomeModal(mode: "new" | "edit", title: string, recordId?: string) {
    const record = incomeRecords.find((item) => item.id === recordId);
    setAccountId(record?.accountId ?? "");
    setCategoryId(record?.categoryId ?? "");
    setGrossIncomeInput(record?.grossIncome.toString() ?? "");
    setCapitalExpenditureInput(record?.capitalExpenditure.toString() ?? "");
    setModal({ mode, title });
  }

  return (
    <div className="page-stack">
      <PageToolbar
        title="Income"
        actions={
          <>
            <FilterSelect
              placeholder="Select your account"
              value={accountId}
              onChange={setAccountId}
            >
              {nonCreditActiveAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              placeholder="Select your category"
              value={categoryId}
              onChange={setCategoryId}
            >
              {normalIncomeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.source}
                </option>
              ))}
            </FilterSelect>
            <button
              type="button"
              className="button button--primary"
              onClick={() => openIncomeModal("new", "New Income")}
            >
              <Plus size={16} />
              New Income
            </button>
          </>
        }
      />

      <SegmentedControl
        label="Income view"
        options={incomeViewModes.map((mode) => ({ label: mode, value: mode }))}
        value={viewMode}
        onChange={(value) => onViewModeChange(value as IncomeViewMode)}
      />

      <Panel title={`${viewMode} Income Records`}>
        <DataTable
          headers={["Name", "Date", "Account", "Category", "Gross", "Expenditure", "Net"]}
          rows={visibleIncomeRecords.map((record) => {
            const netIncome = calculateNetIncome(record.grossIncome, record.capitalExpenditure);

            return [
              record.name,
              formatDate(record.date),
              getAccountName(record.accountId),
              getIncomeCategoryName(record.categoryId),
              formatMoney(record.grossIncome),
              formatMoney(record.capitalExpenditure),
              <MoneyValue key={`${record.id}-net`} value={netIncome} />,
            ];
          })}
          onRowClick={(rowIndex) => {
            const record = visibleIncomeRecords[rowIndex];
            if (record) {
              openIncomeModal("edit", record.name, record.id);
            }
          }}
        />
      </Panel>

      <FormModal
        deleteLabel="Soft Delete"
        modal={modal}
        saveLabel="Direct Save"
        subtitle="Net income updates from gross income less capital expenditure."
        onClose={() => setModal(null)}
      >
        <div className="form-grid form-grid--single">
          <Field label="Name"><input placeholder="Income title" /></Field>
          <Field label="Date"><input type="date" /></Field>
          <Field label="Gross Income">
            <input
              inputMode="decimal"
              placeholder="0.00"
              value={grossIncomeInput}
              onChange={(event) => setGrossIncomeInput(event.target.value)}
            />
          </Field>
          <Field label="Capital Expenditure">
            <input
              inputMode="decimal"
              placeholder="0.00"
              value={capitalExpenditureInput}
              onChange={(event) => setCapitalExpenditureInput(event.target.value)}
            />
          </Field>
          <Field label="Accounts">
            <select value={accountId} onChange={(event) => setAccountId(event.target.value)}>
              <option value="" disabled>
                Select your account
              </option>
              {nonCreditActiveAccounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Categories">
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="" disabled>
                Select your category
              </option>
              {normalIncomeCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.source}</option>
              ))}
            </select>
          </Field>
          <ComputedField
            label="Net Income"
            value={formatMoney(calculatedNetIncome)}
            valueTone={getMoneyValueTone(calculatedNetIncome)}
          />
        </div>
      </FormModal>
    </div>
  );
}

function ExpensePage({
  selectedMonth,
  viewMode,
  onViewModeChange,
}: {
  selectedMonth: string;
  viewMode: ExpenseViewMode;
  onViewModeChange: (viewMode: ExpenseViewMode) => void;
}) {
  const [accountFilterId, setAccountFilterId] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState(expenseCategoryFilterAll);
  const [pasabuyerFilter, setPasabuyerFilter] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [purchaseDateInput, setPurchaseDateInput] = useState("");
  const [datePaidInput, setDatePaidInput] = useState("");
  const [expenseAmountInput, setExpenseAmountInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("");
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency | "">("");
  const [periodCountInput, setPeriodCountInput] = useState("");
  const [paidPeriodInput, setPaidPeriodInput] = useState("");
  const [pasabuyer, setPasabuyer] = useState("");
  const [pasabuyStatus, setPasabuyStatus] = useState<PasabuyStatus | "">("");
  const [pasabuyDateOfPaymentInput, setPasabuyDateOfPaymentInput] = useState("");
  const [pasabuyPaidPeriodInput, setPasabuyPaidPeriodInput] = useState("");
  const [pasabuyAccountReceiverId, setPasabuyAccountReceiverId] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const pasabuyCategory = expenseCategories.find((category) => isPasabuyCategoryName(category.name));
  const selectedFormAccount = activeAccounts.find((account) => account.id === formAccountId);
  const accountType = selectedFormAccount?.type ?? "Cash";
  const categoryName = getExpenseCategoryName(formCategoryId);
  const sections = getExpenseConditionalSections({
    accountType,
    viewMode,
    categoryName,
  });
  const expenseAmount = parseNumberInput(expenseAmountInput);
  const interestAmount = sections.creditCard ? parseNumberInput(interestInput) : 0;
  const periodCount = parseOptionalNumberInput(periodCountInput);
  const paidPeriod = parseOptionalNumberInput(paidPeriodInput);
  const pasabuyPaidPeriod = parseOptionalNumberInput(pasabuyPaidPeriodInput);
  const grossPrice = calculateGrossPrice(expenseAmount, interestAmount);
  const installmentAmount = calculateInstallmentAmount({
    grossPrice,
    paymentStatus,
    periodCount,
  });
  const paidAmount = calculatePaidAmount({
    grossPrice,
    paymentStatus,
    installmentAmount,
    paidPeriod,
  });
  const remainingBalance = calculateRemainingBalance(grossPrice, paidAmount);
  const expectedPaymentDate = calculateExpectedPaymentDate({
    purchaseDate: purchaseDateInput,
    billingDay: selectedFormAccount?.billingDay ?? null,
    dueDay: selectedFormAccount?.dueDay ?? null,
  });
  const pasabuyReceivedAmount = calculatePasabuyReceivedAmount({
    grossPrice,
    pasabuyStatus,
    installmentAmount,
    pasabuyPaidPeriod,
    periodCount,
  });
  const pasabuyerBalance = calculatePasabuyerBalance(grossPrice, pasabuyReceivedAmount);
  const visibleExpenseRecords = expenseRecords.filter((record) => {
    const recordCategoryName = getExpenseCategoryName(record.categoryId);

    if (!isExpenseRecordInViewScope(record, viewMode, selectedMonth)) {
      return false;
    }

    if (accountFilterId && record.accountId !== accountFilterId) {
      return false;
    }

    if (
      viewMode !== "Unpaid Pasabuy" &&
      !matchesExpenseCategoryFilter(record.categoryId, recordCategoryName, expenseCategoryFilter)
    ) {
      return false;
    }

    if (!matchesExpenseViewMode(record, recordCategoryName, viewMode)) {
      return false;
    }

    if (viewMode === "Unpaid Pasabuy" && pasabuyerFilter && record.pasabuyer !== pasabuyerFilter) {
      return false;
    }

    return true;
  });

  function openExpenseModal(mode: "new" | "edit", title: string, recordId?: string) {
    const record = expenseRecords.find((item) => item.id === recordId);
    const nextCategoryId =
      record?.categoryId ??
      (viewMode === "Unpaid Pasabuy" ? pasabuyCategory?.id : undefined) ??
      (isSpecificExpenseCategoryFilter(expenseCategoryFilter) ? expenseCategoryFilter : "");

    setFormAccountId(record?.accountId ?? accountFilterId);
    setFormCategoryId(nextCategoryId);
    setPurchaseDateInput(record?.purchaseDate ?? "");
    setDatePaidInput(record?.datePaid ?? "");
    setExpenseAmountInput(record?.amount.toString() ?? "");
    setInterestInput(record?.interest.toString() ?? "");
    setPaymentStatus(record?.paymentStatus ?? "");
    setPaymentFrequency(record?.paymentFrequency ?? "");
    setPeriodCountInput(record?.periodCount?.toString() ?? "");
    setPaidPeriodInput(record?.paidPeriod?.toString() ?? "");
    setPasabuyer(record?.pasabuyer ?? "");
    setPasabuyStatus(record?.pasabuyStatus ?? "");
    setPasabuyDateOfPaymentInput(record?.pasabuyDateOfPayment ?? "");
    setPasabuyPaidPeriodInput(record?.pasabuyPaidPeriod?.toString() ?? "");
    setPasabuyAccountReceiverId(record?.pasabuyAccountReceiverId ?? "");
    setModal({ mode, title });
  }

  function handleExpenseViewModeChange(nextViewMode: ExpenseViewMode) {
    if (nextViewMode === "Unpaid Pasabuy") {
      setExpenseCategoryFilter(expenseCategoryFilterAll);
    }

    onViewModeChange(nextViewMode);
  }

  return (
    <div className="page-stack">
      <PageToolbar
        title="Expense"
        actions={
          <>
            <FilterSelect
              placeholder="All accounts"
              placeholderDisabled={false}
              value={accountFilterId}
              onChange={setAccountFilterId}
            >
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </FilterSelect>
            {viewMode !== "Unpaid Pasabuy" && (
              <FilterSelect
                placeholder="All categories"
                value={expenseCategoryFilter}
                onChange={setExpenseCategoryFilter}
              >
                <option value={expenseCategoryFilterAll}>All</option>
                <option value={expenseCategoryFilterWithoutPasabuy}>W/out Pasabuy</option>
                {expenseCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </FilterSelect>
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
            <button
              type="button"
              className="button button--primary"
              onClick={() => openExpenseModal("new", "New Expense")}
            >
              <Plus size={16} />
              New Expense
            </button>
          </>
        }
      />

      <SegmentedControl
        label="Expense view"
        options={expenseViewModes.map((mode) => ({ label: mode, value: mode }))}
        value={viewMode}
        onChange={(value) => handleExpenseViewModeChange(value as ExpenseViewMode)}
      />

      <Panel title={`${viewMode} Expenses`}>
        <DataTable
          headers={["Date", "Description", "Amount", "Account", "Category", "Date Paid", "Expense Status"]}
          rows={visibleExpenseRecords.map((record) => [
            formatDate(record.purchaseDate),
            record.description,
            formatMoney(record.amount),
            getAccountName(record.accountId),
            getExpenseCategoryName(record.categoryId),
            record.datePaid ? formatDate(record.datePaid) : "-",
            <ExpenseStatusDot
              key={`${record.id}-expense-status`}
              status={getExpenseStatusFromDatePaid(record.datePaid)}
            />,
          ])}
          onRowClick={(rowIndex) => {
            const record = visibleExpenseRecords[rowIndex];
            if (record) {
              openExpenseModal("edit", record.description, record.id);
            }
          }}
        />
      </Panel>

      <FormModal
        deleteLabel="Soft Delete"
        modal={modal}
        saveLabel="Direct Save"
        subtitle="Context fields change from the selected account and category."
        onClose={() => setModal(null)}
      >
        <div className="form-grid form-grid--single">
          <Field label="Purchase description"><input placeholder="Purchase description" /></Field>
          <Field label="Purchase Date">
            <input
              type="date"
              value={purchaseDateInput}
              onChange={(event) => setPurchaseDateInput(event.target.value)}
            />
          </Field>
          <Field label="Accounts">
            <select value={formAccountId} onChange={(event) => setFormAccountId(event.target.value)}>
              <option value="" disabled>
                Select your account
              </option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Categories">
            <select value={formCategoryId} onChange={(event) => setFormCategoryId(event.target.value)}>
              <option value="" disabled>
                Select your category
              </option>
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Expense Amount">
            <input
              inputMode="decimal"
              placeholder="0.00"
              value={expenseAmountInput}
              onChange={(event) => setExpenseAmountInput(event.target.value)}
            />
          </Field>
          <Field label="Date Paid">
            <input
              type="date"
              value={datePaidInput}
              onChange={(event) => setDatePaidInput(event.target.value)}
            />
          </Field>
          {sections.creditCard && (
            <>
              <FormSectionDivider title="CC Transaction" />
              <Field label="Payment Status">
                <select
                  value={paymentStatus}
                  onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}
                >
                  <option value="" disabled>
                    Select your payment status
                  </option>
                  {paymentStatusLabels.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </Field>
              <Field label="Interest">
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  value={interestInput}
                  onChange={(event) => setInterestInput(event.target.value)}
                />
              </Field>
              <ComputedField label="Gross Price" value={formatMoney(grossPrice)} />
              <Field label="Payment Frequency">
                <select
                  value={paymentFrequency}
                  onChange={(event) => setPaymentFrequency(event.target.value as PaymentFrequency)}
                >
                  <option value="" disabled>
                    Select your payment frequency
                  </option>
                  {paymentFrequencyLabels.map((frequency) => (
                    <option key={frequency} value={frequency}>{frequency}</option>
                  ))}
                </select>
              </Field>
              <Field label="Period Count">
                <input
                  inputMode="numeric"
                  placeholder="0"
                  value={periodCountInput}
                  onChange={(event) => setPeriodCountInput(event.target.value)}
                />
              </Field>
              {paymentStatus === "Installment" && installmentAmount !== null && (
                <ComputedField label="Installment Amount" value={formatMoney(installmentAmount)} />
              )}
              <Field label="Paid period">
                <input
                  inputMode="numeric"
                  placeholder="0"
                  value={paidPeriodInput}
                  onChange={(event) => setPaidPeriodInput(event.target.value)}
                />
              </Field>
              <ComputedField label="Paid Amount" value={formatMoney(paidAmount)} />
              <ComputedField label="Remaining Balance" value={formatMoney(remainingBalance)} />
              <ComputedField
                label="Expected payment date"
                value={expectedPaymentDate ? formatDate(expectedPaymentDate) : "-"}
              />
            </>
          )}
          {sections.pasabuy && (
            <>
              <FormSectionDivider title="Pasabuy Transaction" />
              <Field label="Pasabuyer">
                <select value={pasabuyer} onChange={(event) => setPasabuyer(event.target.value)}>
                  <option value="" disabled>
                    Select your pasabuyer
                  </option>
                  {pasabuyerLabels.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Pasabuy Status">
                <select
                  value={pasabuyStatus}
                  onChange={(event) => setPasabuyStatus(event.target.value as PasabuyStatus)}
                >
                  <option value="" disabled>
                    Select your pasabuy status
                  </option>
                  {pasabuyStatusLabels.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </Field>
              <Field label="Pasabuy Date of Payment">
                <input
                  type="date"
                  value={pasabuyDateOfPaymentInput}
                  onChange={(event) => setPasabuyDateOfPaymentInput(event.target.value)}
                />
              </Field>
              <Field label="Pasabuy Account Receiver">
                <select
                  value={pasabuyAccountReceiverId}
                  onChange={(event) => setPasabuyAccountReceiverId(event.target.value)}
                >
                  <option value="" disabled>
                    Select receiver account
                  </option>
                  {activeAccounts.map((account) => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Pasabuy paid period">
                <input
                  inputMode="numeric"
                  placeholder="0"
                  value={pasabuyPaidPeriodInput}
                  onChange={(event) => setPasabuyPaidPeriodInput(event.target.value)}
                />
              </Field>
              <ComputedField label="Pasabuy Received Amount" value={formatMoney(pasabuyReceivedAmount)} />
              <ComputedField label="Pasabuyer Balance" value={formatMoney(pasabuyerBalance)} />
            </>
          )}
        </div>
      </FormModal>
    </div>
  );
}

function WorkflowPage({
  section,
  selectedMonth,
}: {
  section: WorkflowSectionId;
  selectedMonth: string;
}) {
  const fixedCategory = getWorkflowFixedCategory(section);
  const label = getActiveSectionLabel(section);
  const isTransfer = section === "transfer";
  const isCreditCardPayment = section === "credit-card-payment";
  const isAlkansya = section === "alkansya";
  const isReceivables = section === "receivables";
  const sourceAccountLabel = isTransfer
    ? "Source Account"
    : isCreditCardPayment
      ? "CC Account"
      : isReceivables
        ? "Receiving Account"
        : "Accounts";
  const sourceAccountOptions = isCreditCardPayment ? creditActiveAccounts : nonCreditActiveAccounts;
  const secondaryAccountLabel = isTransfer
    ? "Transfer Account"
    : isCreditCardPayment
      ? "Payer Account"
      : null;
  const amountLabel = isTransfer
    ? "Transfer Amount"
    : isCreditCardPayment
      ? "Payment Amount"
      : isAlkansya
        ? "Savings Amount"
        : "Gross Income";
  const [modal, setModal] = useState<ModalState>(null);
  const [receivingAccountId, setReceivingAccountId] = useState("");
  const [transactedAccountId, setTransactedAccountId] = useState("");
  const [workflowCategoryId, setWorkflowCategoryId] = useState("");
  const [workflowAmountInput, setWorkflowAmountInput] = useState("");
  const [workflowCapitalExpenditureInput, setWorkflowCapitalExpenditureInput] = useState("");
  const workflowNetIncome = calculateNetIncome(
    parseNumberInput(workflowAmountInput),
    parseNumberInput(workflowCapitalExpenditureInput),
  );
  const workflowAmounts = isAlkansya ? [-12000, -3500] : [12000, 3500];
  const workflowAccountIds = isCreditCardPayment
    ? ["acct-metrobank-card", "acct-bypl"]
    : ["acct-bdo-checking", "acct-gcash"];
  const workflowDates = [`${selectedMonth}-05`, `${selectedMonth}-18`];
  const workflowCategory = fixedCategory ?? label;
  const workflowRows =
    isReceivables && receivingAccountId
      ? []
      : [
          [
            `${label} sample`,
            formatDate(workflowDates[0]),
            getAccountName(workflowAccountIds[0]),
            workflowCategory,
            formatMoney(workflowAmounts[0]),
          ],
          [
            `${label} adjustment`,
            formatDate(workflowDates[1]),
            getAccountName(workflowAccountIds[1]),
            workflowCategory,
            formatMoney(workflowAmounts[1]),
          ],
        ];

  function openWorkflowModal(mode: "new" | "edit", title: string) {
    setReceivingAccountId("");
    setTransactedAccountId("");
    setWorkflowCategoryId("");
    setWorkflowAmountInput(isAlkansya ? "-12000" : "");
    setWorkflowCapitalExpenditureInput("");
    setModal({ mode, title });
  }

  return (
    <div className="page-stack">
      <PageToolbar
        title={label}
        actions={
          <button
            type="button"
            className="button button--primary"
            onClick={() => openWorkflowModal("new", `New ${label} Record`)}
          >
            <Plus size={16} />
            New Record
          </button>
        }
      />

      <Panel title="Records">
        {workflowRows.length ? (
          <DataTable
            headers={["Name", "Date", sourceAccountLabel, "Category", "Amount"]}
            rows={workflowRows}
            onRowClick={(rowIndex) => openWorkflowModal("edit", workflowRows[rowIndex]?.[0] ?? label)}
          />
        ) : (
          <EmptyState
            title="No outstanding receivables"
            detail="Receivables leave this view after a receiving account is selected."
          />
        )}
      </Panel>

      <FormModal
        deleteLabel="Soft Delete"
        modal={modal}
        saveLabel="Direct Save"
        subtitle={`${label} uses the same income-backed write path with workflow-only fields exposed.`}
        onClose={() => setModal(null)}
      >
        <div className="form-grid form-grid--single">
          <Field label="Name"><input placeholder={`${label} title`} /></Field>
          <Field label="Date"><input type="date" /></Field>
          <Field label={amountLabel}>
            <input
              inputMode="decimal"
              placeholder={isAlkansya ? "-0.00" : "0.00"}
              value={workflowAmountInput}
              onChange={(event) => setWorkflowAmountInput(event.target.value)}
            />
          </Field>
          {isReceivables && (
            <Field label="Capital Expenditure">
              <input
                inputMode="decimal"
                placeholder="0.00"
                value={workflowCapitalExpenditureInput}
                onChange={(event) => setWorkflowCapitalExpenditureInput(event.target.value)}
              />
            </Field>
          )}
          <Field label={sourceAccountLabel}>
            <select value={receivingAccountId} onChange={(event) => setReceivingAccountId(event.target.value)}>
              <option value="" disabled>
                Select your account
              </option>
              {sourceAccountOptions.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Field>
          {secondaryAccountLabel && (
            <Field label={secondaryAccountLabel}>
              <select value={transactedAccountId} onChange={(event) => setTransactedAccountId(event.target.value)}>
                <option value="" disabled>
                  Select your account
                </option>
                {nonCreditActiveAccounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </Field>
          )}
          {fixedCategory ? (
            <ComputedField label="Categories" value={fixedCategory} />
          ) : (
            <Field label="Categories">
              <select value={workflowCategoryId} onChange={(event) => setWorkflowCategoryId(event.target.value)}>
                <option value="" disabled>
                  Select your category
                </option>
                {normalIncomeCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.source}</option>
                ))}
              </select>
            </Field>
          )}
          {isReceivables && (
            <ComputedField
              label="Net Income"
              value={formatMoney(workflowNetIncome)}
              valueTone={getMoneyValueTone(workflowNetIncome)}
            />
          )}
        </div>
      </FormModal>
    </div>
  );
}

function MonthlyMonitoringPage({ selectedMonth }: { selectedMonth: string }) {
  const [incomeCategoryView, setIncomeCategoryView] = useState("table");
  const [expenseCategoryView, setExpenseCategoryView] = useState("simplified");
  const scopedIncomeRecords = getIncomeRecordsForMonth(selectedMonth);
  const scopedExpenseRecords = getExpenseRecordsForMonth(selectedMonth);
  const monitoring = getMonthlyMonitoringSnapshot(selectedMonth);
  const incomeCategorySummaries = getIncomeCategorySummaries(scopedIncomeRecords);
  const expenseCategorySummaries = getExpenseCategorySummaries(scopedExpenseRecords);
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

  return (
    <div className="page-stack">
      <PageToolbar
        title="Monthly Monitoring"
      />
      <section className="metric-grid">
        <MetricCard title="Monthly Income" value={formatMoney(monitoring.monthlyIncome)} detail={getMonthLabel(selectedMonth)} icon={ArrowUpRight} tone="green" />
        <MetricCard title="Monthly Expense" value={formatMoney(monitoring.monthlyExpense)} detail={getMonthLabel(selectedMonth)} icon={Receipt} tone="rose" />
        <MetricCard title="Gross Margin" value={formatMoney(monitoring.grossMargin)} detail="Income less expenses" icon={CircleDollarSign} tone="blue" />
        <MetricCard title="For Savings" value={formatMoney(monitoring.forSavings)} detail="30% allocation" icon={PiggyBank} tone="amber" />
      </section>
      <section className="two-column">
        <Panel title="Budget Allocation">
          <BudgetRow label="Needs" spent={monitoring.forNeeds} budget={monitoring.grossMargin} />
          <BudgetRow label="Wants" spent={monitoring.forWants} budget={monitoring.grossMargin} />
          <BudgetRow label="Savings" spent={monitoring.forSavings} budget={monitoring.grossMargin} />
        </Panel>
        <Panel title="Category Context">
          <div className="category-grid category-grid--compact">
            {expenseCategorySummaries.slice(0, 4).map((category) => (
              <CategoryCard
                key={category.id}
                title={category.name}
                detail={`Spent ${formatMoney(category.spending, { compact: true })}`}
                value={formatMoney(category.remaining, { compact: true })}
              />
            ))}
          </div>
        </Panel>
      </section>

      <Panel
        title="Income Categories"
        action={
          <div className="panel-header-actions">
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
          </div>
        }
      >
        {incomeCategoryView === "table" && (
          <DataTable
            headers={["Income Type", "Gross Income", "Expenditure", "Net Income", "Earning Percentage"]}
            rows={incomeCategorySummaries.map((category) => [
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
            data={incomeCategorySummaries.map((category, index) => ({
              name: category.source,
              value: Math.max(category.netIncome, 0),
              color: categoryPalette[index % categoryPalette.length],
            }))}
          />
        )}
        {incomeCategoryView === "cards" && (
          <div className="category-grid">
            {incomeCategorySummaries.map((category) => (
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
        title="Expense Categories"
        action={
          <div className="panel-header-actions">
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
          </div>
        }
      >
        {expenseCategoryView === "simplified" && (
          <DataTable
            headers={["Expense category", "Monthly Budget", "Spending", "Remaining"]}
            rows={expenseCategorySummaries.map((category) => [
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
            rows={expenseCategorySummaries.map((category) => [
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
            data={expenseCategorySummaries.map((category, index) => ({
              name: category.name,
              value: category.spending,
              color: categoryPalette[index % categoryPalette.length],
            }))}
          />
        )}
        {expenseCategoryView === "cards" && (
          <div className="category-grid">
            {expenseCategorySummaries.map((category) => (
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
    </div>
  );
}

function SyncPage({
  lastSync,
  pendingOperations,
  schemaHealth,
  syncState,
  onSchemaVerify,
  onSync,
}: {
  lastSync: string;
  pendingOperations: number;
  schemaHealth: SchemaHealth;
  syncState: SyncState;
  onSchemaVerify: () => void;
  onSync: () => void;
}) {
  return (
    <div className="page-stack">
      <section className="metric-grid">
        <MetricCard title="Last Successful Sync" value={lastSync.split(" ")[1]} detail={lastSync.split(" ")[0]} icon={RefreshCw} tone="blue" />
        <MetricCard title="Pending Operations" value={`${pendingOperations}`} detail="Queued changes" icon={ClipboardCheck} tone="amber" />
        <MetricCard title="Failed Operations" value="1" detail="Needs review" icon={AlertTriangle} tone="rose" />
        <MetricCard title="Schema Health" value={schemaHealth === "warning" ? "Review" : "Unchecked"} detail="/api/v1/system/schema-status" icon={Database} tone="green" />
      </section>
      <section className="two-column">
        <Panel title="Sync Actions" action={<StatusPill syncState={syncState} schemaHealth={schemaHealth} />}>
          <div className="action-list">
            <button type="button" className="button button--primary" onClick={onSync}>
              <RefreshCw size={16} className={syncState === "syncing" ? "spin" : undefined} />
              Commit Queue
            </button>
            <button type="button" className="button" onClick={onSchemaVerify}>
              <ShieldCheck size={16} />
              Verify Schema
            </button>
          </div>
          <div className="snapshot-card">
            <p className="snapshot-card__title">Refresh Source</p>
            <p>Local optimistic state is replaced by the fresh backend snapshot after direct-save or queued sync.</p>
          </div>
        </Panel>
        <Panel title="Errors" action={<Badge tone="amber">User safe</Badge>}>
          <div className="error-list">
            <ErrorRow code="VALIDATION_ERROR" detail="Expense Amount is required." />
            <ErrorRow code="SCHEMA_DRIFT_DETECTED" detail="Payment Status option changed." />
            <ErrorRow code="CONFLICT_ERROR" detail="Record changed after the app loaded it." />
            <ErrorRow code="NOTION_RATE_LIMITED" detail="Retry after the backend cooldown." />
            <ErrorRow code="FORBIDDEN" detail="The signed-in user cannot sync this resource." />
          </div>
        </Panel>
      </section>
      <Panel title="Activity Log" action={<Badge tone="neutral">{syncLog.length} entries</Badge>}>
        <div className="activity-list">
          {syncLog.map((entry) => (
            <div className="activity-row" key={entry.id}>
              <Badge tone={entry.type === "error" || entry.type === "conflict" ? "amber" : "blue"}>
                {entry.type}
              </Badge>
              <div>
                <p>{entry.resource}</p>
                <span>{entry.description}</span>
              </div>
              <time>{entry.timestamp}</time>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function SettingsPage({
  schemaHealth,
  onSchemaVerify,
}: {
  schemaHealth: SchemaHealth;
  onSchemaVerify: () => void;
}) {
  return (
    <div className="page-stack">
      <section className="two-column">
        <Panel title="Access" action={<Badge tone="green">Email and Google</Badge>}>
          <div className="auth-preview">
            <button type="button" className="button button--primary">
              <LockKeyhole size={16} />
              Email Sign In
            </button>
            <button type="button" className="button">
              <ShieldCheck size={16} />
              Google Sign In
            </button>
            <div className="snapshot-card">
              <p className="snapshot-card__title">Session State</p>
              <p>Signed-in, signed-out, loading, and unauthorized states are represented in the shell contract.</p>
            </div>
          </div>
        </Panel>
        <Panel title="Schema" action={<StatusPill syncState="idle" schemaHealth={schemaHealth} />}>
          <div className="form-grid form-grid--single">
            <Field label="Backend API Base Path">
              <input value="/api/v1" readOnly />
            </Field>
            <ComputedField label="Token Storage" value="Backend only" />
            <ComputedField label="Database Mapping" value="Server configuration" />
            <button type="button" className="button button--primary" onClick={onSchemaVerify}>
              <Database size={16} />
              Verify Schema
            </button>
          </div>
        </Panel>
      </section>
    </div>
  );
}

function PageToolbar({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-toolbar">
      <div>
        <h2>{title}</h2>
      </div>
      {actions && <div className="page-toolbar__actions">{actions}</div>}
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel__header">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function MetricCard({
  title,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: "green" | "rose" | "blue" | "amber";
}) {
  return (
    <article className={cx("metric-card", `metric-card--${tone}`)}>
      <div className="metric-card__top">
        <p>{title}</p>
        <span className="metric-card__icon">
          <Icon size={14} />
        </span>
      </div>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}

function Badge({ tone, children }: { tone: "green" | "rose" | "blue" | "amber" | "neutral"; children: ReactNode }) {
  return <span className={cx("badge", `badge--${tone}`)}>{children}</span>;
}

function MoneyLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="money-line">
      <span>{label}</span>
      <strong>{formatMoney(value)}</strong>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cx("field", className)}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function ComputedField({
  label,
  value,
  valueTone = "ink",
}: {
  label: string;
  value: string;
  valueTone?: ComputedValueTone;
}) {
  return (
    <div className="computed-field">
      <span>{label}</span>
      <strong className={cx("computed-field__value", `computed-field__value--${valueTone}`)}>{value}</strong>
    </div>
  );
}

function FormSectionDivider({ title }: { title: string }) {
  return (
    <div className="form-section-divider">
      <span>{title}</span>
    </div>
  );
}

function MoneyValue({ value }: { value: number }) {
  const tone = getMoneyValueTone(value);

  return (
    <span className={cx("money-value", `money-value--${tone}`)}>
      {formatMoney(value)}
    </span>
  );
}

function ExpenseStatusDot({ status }: { status: "paid" | "unpaid" }) {
  return (
    <span
      aria-label={status === "paid" ? "Paid" : "Unpaid"}
      className={cx("expense-status-dot", `expense-status-dot--${status}`)}
      role="img"
    />
  );
}

function FormModal({
  modal,
  subtitle,
  deleteLabel,
  secondaryDeleteLabel,
  saveLabel,
  onClose,
  children,
}: {
  modal: ModalState;
  subtitle: string;
  deleteLabel: string;
  secondaryDeleteLabel?: string;
  saveLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!modal) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="form-modal-title"
        aria-modal="true"
        className="modal-panel"
        role="dialog"
      >
        <div className="modal-panel__header">
          <div>
            <h2 id="form-modal-title">{modal.title}</h2>
            <p>{subtitle}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close modal" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <div className="modal-panel__body">{children}</div>
        <div className="modal-panel__footer">
          {modal.mode === "edit" && (
            <button type="button" className="button" onClick={onClose}>
              <Trash2 size={16} />
              {deleteLabel}
            </button>
          )}
          {modal.mode === "edit" && secondaryDeleteLabel && (
            <button type="button" className="button button--danger" onClick={onClose}>
              <Trash2 size={16} />
              {secondaryDeleteLabel}
            </button>
          )}
          <button type="button" className="button button--primary" onClick={onClose}>
            <Save size={16} />
            {saveLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}

function DataTable({
  headers,
  rows,
  footerRows = [],
  onRowClick,
}: {
  headers: string[];
  rows: ReactNode[][];
  footerRows?: ReactNode[][];
  onRowClick?: (rowIndex: number) => void;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={`row-${rowIndex}`}
              className={cx(onRowClick && "table-row--clickable")}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={() => onRowClick?.(rowIndex)}
              onKeyDown={(event) => {
                if (!onRowClick) {
                  return;
                }

                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onRowClick(rowIndex);
                }
              }}
            >
              {row.map((cell, cellIndex) => (
                <td key={`cell-${rowIndex}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
        {footerRows.length > 0 && (
          <tfoot>
            {footerRows.map((row, rowIndex) => (
              <tr key={`footer-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`footer-cell-${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tfoot>
        )}
      </table>
    </div>
  );
}

function SegmentedControl({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="segmented" aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          key={option.value}
          className={cx(option.value === value && "segmented__item--active")}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function FilterSelect({
  placeholder,
  placeholderDisabled = true,
  value,
  onChange,
  children,
}: {
  placeholder: string;
  placeholderDisabled?: boolean;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="filter-select">
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="" disabled={placeholderDisabled}>
          {placeholder}
        </option>
        {children}
      </select>
    </label>
  );
}

function CategoryDonutChart({
  data,
}: {
  data: Array<{ name: string; value: number; color: string }>;
}) {
  return (
    <div className="category-chart">
      <div className="category-chart__visual" aria-label="Category chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={data}
              dataKey="value"
              innerRadius={54}
              isAnimationActive={false}
              outerRadius={86}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(28,25,23,0.09)",
                borderRadius: 10,
                fontSize: 12,
              }}
              formatter={(value) => formatMoney(Number(value))}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="category-chart__legend">
        {data.map((item) => (
          <div key={item.name}>
            <span><i style={{ backgroundColor: item.color }} />{item.name}</span>
            <strong>{formatMoney(item.value, { compact: true })}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetRow({ label, spent, budget }: { label: string; spent: number; budget: number }) {
  const ratio = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;
  return (
    <div className="budget-row">
      <div>
        <strong>{label}</strong>
        <span>{formatMoney(spent, { compact: true })} of {formatMoney(budget, { compact: true })}</span>
      </div>
      <div className="progress" aria-label={`${label} progress`}>
        <span style={{ width: `${ratio}%` }} />
      </div>
    </div>
  );
}

function CategoryCard({
  title,
  detail,
  value,
  muted = false,
  onClick,
}: {
  title: string;
  detail: string;
  value: string;
  muted?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <p>{title}</p>
      <span>{detail}</span>
      <strong>{value}</strong>
    </>
  );
  const className = cx("category-card", muted && "category-card--muted", onClick && "category-card--button");

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <article className={cx("category-card", muted && "category-card--muted")}>
      {content}
    </article>
  );
}

function ErrorRow({ code, detail }: { code: string; detail: string }) {
  return (
    <div className="error-row">
      <FileWarning size={16} />
      <div>
        <strong>{code}</strong>
        <span>{detail}</span>
      </div>
    </div>
  );
}
