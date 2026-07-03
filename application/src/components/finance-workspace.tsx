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
  ListFilter,
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
  getAccountType,
  getActiveSectionLabel,
  getExpenseCategoryName,
  getIncomeCategoryName,
  incomeCategories,
  incomeRecords,
  monthlyMonitoring,
  months,
  syncLog,
} from "@/lib/finance-data";
import {
  getAccountFormFields,
  getExpenseConditionalSections,
  getNormalIncomeCategories,
  getWorkflowFixedCategory,
  isCreditLikeAccountType,
} from "@/lib/finance-rules";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import type {
  AccountType,
  ExpenseViewMode,
  FinanceSection,
  FinanceSectionId,
  IncomeViewMode,
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
  "Annually",
  "Pasabuy",
  "To pay",
  "To buy",
  "Installments",
  "CC Transactions",
];

const accountTypes: AccountType[] = [
  "Cash",
  "Credit Account",
  "Debit",
  "Savings Account",
  "e-Wallet",
  "Digital Bank",
  "BYPL",
  "Auxiliary",
];

const totalIncome = incomeRecords.reduce((sum, record) => sum + record.netIncome, 0);
const totalExpenses = expenseRecords.reduce((sum, record) => sum + record.amount, 0);
const activeAccounts = accounts.filter((account) => !account.inactive);
const normalIncomeCategories = getNormalIncomeCategories(incomeCategories);
const prototypeAccent = "#5B6CF9";

const dashboardTrendData = [
  { month: "Feb", income: 82000, expenses: 38500 },
  { month: "Mar", income: 85000, expenses: 41200 },
  { month: "Apr", income: 85000, expenses: 43800 },
  { month: "May", income: 110000, expenses: 47200 },
  { month: "Jun", income: 85000, expenses: 39600 },
  { month: "Jul", income: 103400, expenses: 31216 },
];

const spendingBreakdownData = [
  { name: "Housing", value: 12500, color: prototypeAccent },
  { name: "Food", value: 5200, color: "#0D9488" },
  { name: "Transport", value: 2200, color: "#D97706" },
  { name: "Gadgets", value: 3866, color: "#E11D48" },
  { name: "Shopping", value: 3500, color: "#7C3AED" },
];

const categoryPalette = [prototypeAccent, "#0D9488", "#D97706", "#E11D48", "#7C3AED", "#64748B"];

const recentTransactionsData = [
  {
    id: "recent-july-salary",
    title: "July Salary - Accenture",
    meta: "Employment - Jul 15",
    value: 72500,
    tone: "green" as const,
  },
  {
    id: "recent-freelance",
    title: "Freelance - Globe API",
    meta: "Freelance - Jul 05",
    value: 20000,
    tone: "green" as const,
  },
  {
    id: "recent-groceries",
    title: "S&R Groceries",
    meta: "Food & Dining - Jul 03",
    value: -3500,
    tone: "rose" as const,
  },
  {
    id: "recent-load",
    title: "Grab Monthly Load",
    meta: "Transportation - Jul 02",
    value: -2200,
    tone: "rose" as const,
  },
  {
    id: "recent-rent",
    title: "Pasig Studio Rent",
    meta: "Housing - Jul 01",
    value: -12500,
    tone: "rose" as const,
  },
];

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

export function FinanceWorkspace({ activeSection }: { activeSection: FinanceSectionId }) {
  const [selectedMonth, setSelectedMonth] = useState("2026-07");
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
    <div className="workspace">
      <Sidebar activeSection={activeSection} />
      <div className="workspace__main">
        <TopBar
          activeSection={activeSection}
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
            <DashboardPage lastSync={lastSync} pendingOperations={pendingOperations} />
          )}
          {activeSection === "accounts" && <AccountsPage />}
          {activeSection === "income" && <IncomePage />}
          {activeSection === "expense" && <ExpensePage />}
          {activeSection === "monthly-monitoring" && <MonthlyMonitoringPage />}
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

function Sidebar({ activeSection }: { activeSection: FinanceSectionId }) {
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
  lastSync,
  pendingOperations,
  schemaHealth,
  selectedMonth,
  syncState,
  onMonthChange,
  onSync,
}: {
  activeSection: FinanceSectionId;
  lastSync: string;
  pendingOperations: number;
  schemaHealth: SchemaHealth;
  selectedMonth: string;
  syncState: SyncState;
  onMonthChange: (month: string) => void;
  onSync: () => void;
}) {
  return (
    <header className="topbar">
      <div>
        <h1>{getActiveSectionLabel(activeSection)}</h1>
      </div>
      <div className="topbar__actions">
        <div className="month-stepper" aria-label="Selected month">
          <button type="button" onClick={() => onMonthChange(getAdjacentMonth(selectedMonth, -1))}>
            <ChevronLeft size={13} />
          </button>
          <span>{getMonthLabel(selectedMonth)}</span>
          <button type="button" onClick={() => onMonthChange(getAdjacentMonth(selectedMonth, 1))}>
            <ChevronRight size={13} />
          </button>
        </div>
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
}: {
  lastSync: string;
  pendingOperations: number;
}) {
  const balance = activeAccounts.reduce((sum, account) => sum + account.currentBalance, 0);

  return (
    <div className="page-stack">
      <section className="metric-grid metric-grid--prototype">
        <MetricCard
          title="Total Balance"
          value={formatMoney(balance)}
          detail="All accounts combined"
          icon={WalletCards}
          tone="blue"
        />
        <MetricCard
          title="Monthly Net Income"
          value={formatMoney(totalIncome)}
          detail="July 2026"
          icon={ArrowUpRight}
          tone="green"
        />
        <MetricCard
          title="Monthly Expenses"
          value={formatMoney(totalExpenses)}
          detail="Budget usage tracked below"
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
          value={formatMoney(216700)}
          detail="Limit ₱350,000"
          icon={CreditCard}
          tone="blue"
        />
        <MetricCard
          title="Monthly Gross"
          value={formatMoney(110000)}
          detail="Before deductions"
          icon={Banknote}
          tone="green"
        />
        <MetricCard
          title="Pasabuy Balance"
          value={formatMoney(8000)}
          detail="1 active pasabuy"
          icon={PiggyBank}
          tone="amber"
        />
        <MetricCard
          title="CC Balance Total"
          value={formatMoney(133300)}
          detail="2 credit cards"
          icon={AlertTriangle}
          tone="rose"
        />
      </section>

      <section className="dashboard-chart-grid">
        <IncomeExpenseChart />
        <SpendingBreakdownCard />
      </section>

      <section className="dashboard-bottom-grid">
        <BudgetUsageCard />
        <RecentTransactionsList />
      </section>
    </div>
  );
}

function RecentTransactionsList() {
  return (
    <section className="dashboard-card recent-list-card">
      <div className="recent-list-card__header">
        <h2>Recent Transactions</h2>
        <Link href={"/income" as Route}>View all</Link>
      </div>
      <div className="recent-list">
        {recentTransactionsData.map((record) => {
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

function IncomeExpenseChart() {
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
          <AreaChart data={dashboardTrendData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
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

function SpendingBreakdownCard() {
  return (
    <section className="dashboard-card dashboard-card--spending">
      <div className="dashboard-card__header dashboard-card__header--stacked">
        <h2>Spending Breakdown</h2>
        <p>July 2026</p>
      </div>
      <div className="spending-donut" aria-label="Spending breakdown donut chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={spendingBreakdownData}
              dataKey="value"
              innerRadius={47}
              isAnimationActive={false}
              outerRadius={76}
              stroke="none"
            >
              {spendingBreakdownData.map((entry) => (
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
      <div className="spending-list">
        {spendingBreakdownData.map((item) => (
          <div key={item.name} className="spending-list__row">
            <span><i style={{ backgroundColor: item.color }} />{item.name}</span>
            <strong>{formatMoney(item.value, { compact: true })}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function BudgetUsageCard() {
  return (
    <section className="dashboard-card">
      <div className="dashboard-card__header dashboard-card__header--stacked">
        <h2>Budget Usage</h2>
        <p>Top spending categories</p>
      </div>
      <div className="budget-usage-list">
        {expenseCategories.slice(0, 5).map((category) => {
          const percent = Math.min(Math.round((category.spending / category.monthlyBudget) * 100), 100);
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
  const [accountScope, setAccountScope] = useState<AccountScope>("all");
  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [accountName, setAccountName] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<(typeof accounts)[number] | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const visibleAccounts = accounts.filter((account) => {
    if (accountScope === "all") {
      return true;
    }

    if (accountScope === "credit") {
      return !account.inactive && isCreditLikeAccountType(account.type);
    }

    return !account.inactive && !isCreditLikeAccountType(account.type);
  });
  const visibleFields = accountType ? getAccountFormFields(accountType) : [];
  const selectedAccountTotalIncome = selectedAccount
    ? getAccountTotalIncome(selectedAccount.id)
    : 0;
  const selectedAccountTotalExpense = selectedAccount
    ? getAccountTotalExpense(selectedAccount.id)
    : 0;
  const selectedAccountIsCreditLike = accountType !== "" && isCreditLikeAccountType(accountType);
  const scopeDetail = {
    all: "All account records",
    standard: "Non-credit and non-BNPL accounts",
    credit: "Credit Account and BNPL accounts",
  } satisfies Record<AccountScope, string>;
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
      .reduce((sum, record) => sum + record.netIncome, 0);
  }

  function getAccountTotalExpense(accountId: string) {
    return expenseRecords
      .filter((record) => record.accountId === accountId)
      .reduce((sum, record) => sum + record.amount, 0);
  }

  function getBalanceValueTone(value: number): ComputedValueTone {
    if (value > 0) {
      return "green";
    }

    if (value < 0) {
      return "rose";
    }

    return "ink";
  }

  function openAccountModal(mode: "new" | "edit", title: string, account?: (typeof accounts)[number]) {
    setSelectedAccount(account ?? null);
    setAccountName(account?.name ?? "");
    setAccountType(account?.type ?? "");
    setModal({ mode, title });
  }

  function getAccountField(field: string) {
    if (field === "Account Name") {
      return (
        <input
          value={accountName}
          onChange={(event) => setAccountName(event.target.value)}
          placeholder="Account name"
        />
      );
    }

    if (field === "Account Information") {
      return <input defaultValue={selectedAccount?.information ?? ""} placeholder="Account information" />;
    }

    if (field === "Starting Balance") {
      return (
        <input
          defaultValue={selectedAccount?.startingBalance ?? ""}
          inputMode="decimal"
          placeholder="0.00"
        />
      );
    }

    if (field === "Credit Limit") {
      return (
        <input
          defaultValue={selectedAccount?.creditLimit ?? ""}
          inputMode="decimal"
          placeholder="0.00"
        />
      );
    }

    if (field === "Credit Points") {
      return (
        <input
          defaultValue={selectedAccount?.creditPoints ?? ""}
          inputMode="numeric"
          placeholder="0"
        />
      );
    }

    if (field === "Annual Fee") {
      return (
        <input
          defaultValue={selectedAccount?.annualFee ?? ""}
          inputMode="decimal"
          placeholder="0.00"
        />
      );
    }

    if (field === "Billing Day") {
      return (
        <input
          defaultValue={selectedAccount?.billingDay ?? ""}
          inputMode="numeric"
          placeholder="1-31"
        />
      );
    }

    if (field === "Due Day") {
      return (
        <input
          defaultValue={selectedAccount?.dueDay ?? ""}
          inputMode="numeric"
          placeholder="1-31"
        />
      );
    }

    return <input placeholder={field} />;
  }

  return (
    <div className="page-stack">
      <PageToolbar
        title="Accounts"
        detail={`${visibleAccounts.length} shown - ${scopeDetail[accountScope]}`}
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
            <button
              type="button"
              className="button button--primary"
              onClick={() => openAccountModal("new", "New Account")}
            >
              <Plus size={16} />
              New Account
            </button>
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
              onClick={() => openAccountModal("edit", account.name, account)}
            >
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
            </button>
          ))}
        </section>
      ) : (
        <DataTable
          headers={accountTableHeaders}
          rows={accountTableRows}
          onRowClick={(rowIndex) => {
            const account = visibleAccounts[rowIndex];
            if (account) {
              openAccountModal("edit", account.name, account);
            }
          }}
        />
      )}

      <FormModal
        deleteLabel="Mark as Inactive"
        modal={modal}
        saveLabel="Save Account"
        secondaryDeleteLabel="Delete"
        subtitle={
          modal?.mode === "new"
            ? "Choose an account type first. Related fields appear before you save."
            : "Writable account fields only; computed balances stay outside the form."
        }
        onClose={() => setModal(null)}
      >
        <div className="form-grid form-grid--modal">
          <Field label="Account Type">
            <select value={accountType} onChange={(event) => setAccountType(event.target.value as AccountType)}>
              <option value="" disabled>
                Select your account type
              </option>
              {accountTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          {visibleFields.map((field) => (
            <Field key={field} label={field} className={field === "Account Information" ? "field--full" : undefined}>
              {getAccountField(field)}
            </Field>
          ))}
          {modal?.mode === "edit" && selectedAccount && (
            <div className="computed-summary">
              <ComputedField
                label="Total Income"
                value={formatMoney(selectedAccountTotalIncome)}
                valueTone="green"
              />
              <ComputedField
                label="Total Expense"
                value={formatMoney(selectedAccountTotalExpense)}
                valueTone="rose"
              />
              {selectedAccountIsCreditLike ? (
                <>
                  <ComputedField
                    label="Current Balance"
                    value={formatMoney(selectedAccount.currentBalance)}
                    valueTone={getBalanceValueTone(selectedAccount.currentBalance)}
                  />
                  <ComputedField
                    label="Available Limit"
                    value={selectedAccount.availableLimit !== null ? formatMoney(selectedAccount.availableLimit) : "-"}
                    valueTone="amber"
                  />
                </>
              ) : (
                <ComputedField
                  label="Current Balance"
                  value={formatMoney(selectedAccount.currentBalance)}
                  valueTone={getBalanceValueTone(selectedAccount.currentBalance)}
                />
              )}
            </div>
          )}
        </div>
      </FormModal>
    </div>
  );
}

function IncomePage() {
  const [viewMode, setViewMode] = useState<IncomeViewMode>("Monthly");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  function openIncomeModal(mode: "new" | "edit", title: string, recordId?: string) {
    const record = incomeRecords.find((item) => item.id === recordId);
    setAccountId(record?.accountId ?? "");
    setCategoryId(record?.categoryId ?? "");
    setModal({ mode, title });
  }

  return (
    <div className="page-stack">
      <PageToolbar
        title="Income"
        detail="Daily, weekly, monthly, and annual views"
        actions={
          <>
            <FilterSelect
              icon={WalletCards}
              placeholder="Select your account"
              value={accountId}
              onChange={setAccountId}
            >
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              icon={ListFilter}
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
        onChange={(value) => setViewMode(value as IncomeViewMode)}
      />

      <Panel title={`${viewMode} Income Records`} action={<Badge tone="green">Normal categories</Badge>}>
        <DataTable
          headers={["Name", "Date", "Account", "Category", "Gross", "Net"]}
          rows={incomeRecords.map((record) => [
            record.name,
            formatDate(record.date),
            getAccountName(record.accountId),
            getIncomeCategoryName(record.categoryId),
            formatMoney(record.grossIncome),
            formatMoney(record.netIncome),
          ])}
          onRowClick={(rowIndex) => {
            const record = incomeRecords[rowIndex];
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
        subtitle="Computed Notion fields are shown for context but cannot be edited."
        onClose={() => setModal(null)}
      >
        <div className="form-grid form-grid--single">
          <Field label="Name"><input placeholder="Income title" /></Field>
          <Field label="Date"><input type="date" /></Field>
          <Field label="Gross Income"><input inputMode="decimal" placeholder="0.00" /></Field>
          <Field label="Capital Expenditure"><input inputMode="decimal" placeholder="0.00" /></Field>
          <Field label="Accounts">
            <select value={accountId} onChange={(event) => setAccountId(event.target.value)}>
              <option value="" disabled>
                Select your account
              </option>
              {activeAccounts.map((account) => (
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
          <ComputedField label="Net Income" value={formatMoney(80000)} />
          <ComputedField label="Transaction Amount" value={formatMoney(80000)} />
        </div>
      </FormModal>
    </div>
  );
}

function ExpensePage() {
  const [viewMode, setViewMode] = useState<ExpenseViewMode>("Monthly");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const accountType = getAccountType(accountId);
  const categoryName = getExpenseCategoryName(categoryId);
  const sections = getExpenseConditionalSections({
    accountType,
    viewMode,
    categoryName,
  });

  function openExpenseModal(mode: "new" | "edit", title: string, recordId?: string) {
    const record = expenseRecords.find((item) => item.id === recordId);
    setAccountId(record?.accountId ?? "");
    setCategoryId(record?.categoryId ?? "");
    setModal({ mode, title });
  }

  return (
    <div className="page-stack">
      <PageToolbar
        title="Expense"
        detail="Filtered Notion-backed expense workflows"
        actions={
          <>
            <FilterSelect
              icon={WalletCards}
              placeholder="Select your account"
              value={accountId}
              onChange={setAccountId}
            >
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </FilterSelect>
            <FilterSelect
              icon={ListFilter}
              placeholder="Select your category"
              value={categoryId}
              onChange={setCategoryId}
            >
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </FilterSelect>
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
        onChange={(value) => setViewMode(value as ExpenseViewMode)}
      />

      <Panel title={`${viewMode} Expenses`} action={<Badge tone="amber">Frontend filters</Badge>}>
        <DataTable
          headers={["Description", "Date", "Account", "Category", "Status", "Amount"]}
          rows={expenseRecords.map((record) => [
            record.description,
            formatDate(record.purchaseDate),
            getAccountName(record.accountId),
            getExpenseCategoryName(record.categoryId),
            record.paymentStatus,
            formatMoney(record.amount),
          ])}
          onRowClick={(rowIndex) => {
            const record = expenseRecords[rowIndex];
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
          <Field label="Purchase Date"><input type="date" /></Field>
          <Field label="Date Paid"><input type="date" /></Field>
          <Field label="Expense Amount"><input inputMode="decimal" placeholder="0.00" /></Field>
          <Field label="Interest"><input inputMode="decimal" placeholder="0.00" /></Field>
          <Field label="Accounts">
            <select value={accountId} onChange={(event) => setAccountId(event.target.value)}>
              <option value="" disabled>
                Select your account
              </option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Categories">
            <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              <option value="" disabled>
                Select your category
              </option>
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Payment Status">
            <select defaultValue="">
              <option value="" disabled>
                Select your payment status
              </option>
              <option>Paid</option>
              <option>Unpaid</option>
              <option>Installment</option>
              <option>Cancelled</option>
            </select>
          </Field>
          <Field label="Payment Frequency">
            <select defaultValue="">
              <option value="" disabled>
                Select your payment frequency
              </option>
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Annually</option>
            </select>
          </Field>
          {sections.creditCard && (
            <>
              <Field label="CC Link Payment Receipt"><input placeholder="Related payment receipt" /></Field>
              <ComputedField label="Extracted Billing Day" value="15" />
              <ComputedField label="Extracted Due Day" value="10" />
            </>
          )}
          {sections.pasabuy && (
            <>
              <Field label="Pasabuyer">
                <select defaultValue="">
                  <option value="" disabled>
                    Select your pasabuyer
                  </option>
                  <option>Shared</option>
                  <option>Maimai</option>
                  <option>Claire</option>
                  <option>22-H</option>
                </select>
              </Field>
              <Field label="Pasabuy Status"><input placeholder="Pasabuy status" /></Field>
              <Field label="Pasabuy Account Receiver"><input placeholder="Receiver account" /></Field>
            </>
          )}
          <ComputedField label="Gross Price" value={formatMoney(46200)} />
          <ComputedField label="Installment Amount" value={formatMoney(3866.67)} />
          <ComputedField label="Remaining Balance" value={formatMoney(33400)} />
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
  const [modal, setModal] = useState<ModalState>(null);
  const [receivingAccountId, setReceivingAccountId] = useState("");
  const [transactedAccountId, setTransactedAccountId] = useState("");
  const [workflowCategoryId, setWorkflowCategoryId] = useState("");
  const workflowRows =
    section === "receivables" && receivingAccountId
      ? []
      : [
          [
            `${label} sample`,
            selectedMonth,
            getAccountName("acct-bdo-checking"),
            fixedCategory ?? label,
            formatMoney(12000),
          ],
          [
            `${label} adjustment`,
            selectedMonth,
            getAccountName("acct-gcash"),
            fixedCategory ?? label,
            formatMoney(3500),
          ],
        ];

  function openWorkflowModal(mode: "new" | "edit", title: string) {
    setReceivingAccountId("");
    setTransactedAccountId("");
    setWorkflowCategoryId("");
    setModal({ mode, title });
  }

  return (
    <div className="page-stack">
      <PageToolbar
        title={label}
        detail={`${selectedMonth} monthly workflow`}
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

      <Panel title="Monthly Records" action={<Badge tone="green">Incomes-backed workflow</Badge>}>
        {workflowRows.length ? (
          <DataTable
            headers={["Name", "Month", "Account", "Category", "Amount"]}
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
          <Field label="Gross Income"><input inputMode="decimal" placeholder="0.00" /></Field>
          <Field label={section === "receivables" ? "Receiving Account" : "Accounts"}>
            <select value={receivingAccountId} onChange={(event) => setReceivingAccountId(event.target.value)}>
              <option value="" disabled>
                Select your account
              </option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Transacted Account">
            <select value={transactedAccountId} onChange={(event) => setTransactedAccountId(event.target.value)}>
              <option value="" disabled>
                Select your transacted account
              </option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Field>
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
          <ComputedField label="Transaction Amount" value={formatMoney(12000)} />
        </div>
      </FormModal>
    </div>
  );
}

function MonthlyMonitoringPage() {
  const [incomeCategoryView, setIncomeCategoryView] = useState("table");
  const [expenseCategoryView, setExpenseCategoryView] = useState("simplified");
  const [categoryModal, setCategoryModal] = useState<ModalState>(null);
  const [categoryKind, setCategoryKind] = useState<"income" | "expense">("income");
  const [categoryAuxiliary, setCategoryAuxiliary] = useState<"" | "Yes" | "No">("");
  const incomeOverviewCategories = normalIncomeCategories;
  const budgetCategories = expenseCategories.filter((category) => category.auxiliary === "No");
  const incomeEarningsTotal = incomeOverviewCategories.reduce(
    (sum, category) => sum + category.monthlyEarnings,
    0,
  );
  const monthlyBudgetTotal = budgetCategories.reduce((sum, category) => sum + category.monthlyBudget, 0);
  const spendingTotal = budgetCategories.reduce((sum, category) => sum + category.spending, 0);
  const remainingTotal = budgetCategories.reduce((sum, category) => sum + category.remaining, 0);
  const totalOverviewSum = budgetCategories.reduce((sum, category) => sum + category.totalOverview, 0);

  function openCategoryModal(
    kind: "income" | "expense",
    mode: "new" | "edit",
    title: string,
    auxiliary?: "Yes" | "No",
  ) {
    setCategoryKind(kind);
    setCategoryAuxiliary(auxiliary ?? "");
    setCategoryModal({ mode, title });
  }

  return (
    <div className="page-stack">
      <PageToolbar
        title="Monthly Monitoring"
        detail={monthlyMonitoring.month}
        actions={<Badge tone="blue">Read-only</Badge>}
      />
      <section className="metric-grid">
        <MetricCard title="Monthly Income" value={formatMoney(monthlyMonitoring.monthlyIncome)} detail="Rollup" icon={ArrowUpRight} tone="green" />
        <MetricCard title="Monthly Expense" value={formatMoney(monthlyMonitoring.monthlyExpense)} detail="Rollup" icon={Receipt} tone="rose" />
        <MetricCard title="Gross Margin" value={formatMoney(monthlyMonitoring.grossMargin)} detail="Formula" icon={CircleDollarSign} tone="blue" />
        <MetricCard title="For Savings" value={formatMoney(monthlyMonitoring.forSavings)} detail="Formula" icon={PiggyBank} tone="amber" />
      </section>
      <section className="two-column">
        <Panel title="Budget Allocation" action={<Badge tone="neutral">Formula values</Badge>}>
          <BudgetRow label="Needs" spent={monthlyMonitoring.forNeeds} budget={monthlyMonitoring.grossMargin} />
          <BudgetRow label="Wants" spent={monthlyMonitoring.forWants} budget={monthlyMonitoring.grossMargin} />
          <BudgetRow label="Savings" spent={monthlyMonitoring.forSavings} budget={monthlyMonitoring.grossMargin} />
        </Panel>
        <Panel title="Category Context" action={<Badge tone="green">Relations displayed</Badge>}>
          <div className="category-grid category-grid--compact">
            {expenseCategories.slice(0, 4).map((category) => (
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
          <button
            type="button"
            className="button"
            onClick={() => openCategoryModal("income", "new", "New Income Category")}
          >
            <Plus size={16} />
            New Category
          </button>
        }
      >
        <div className="panel-tools">
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
        {incomeCategoryView === "table" && (
          <DataTable
            headers={["Income Type", "Monthly Earnings", "Earning Percentage"]}
            rows={incomeOverviewCategories.map((category) => [
              category.source,
              formatMoney(category.monthlyEarnings),
              formatPercent(category.earningPercentage),
            ])}
            footerRows={[["Total", formatMoney(incomeEarningsTotal), formatPercent(100)]]}
            onRowClick={(rowIndex) => {
              const category = incomeOverviewCategories[rowIndex];
              if (category) {
                openCategoryModal("income", "edit", category.source);
              }
            }}
          />
        )}
        {incomeCategoryView === "chart" && (
          <CategoryDonutChart
            data={incomeOverviewCategories.map((category, index) => ({
              name: category.source,
              value: category.monthlyEarnings,
              color: categoryPalette[index % categoryPalette.length],
            }))}
          />
        )}
        {incomeCategoryView === "cards" && (
          <div className="category-grid">
            {incomeOverviewCategories.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.source}
                detail={formatPercent(category.earningPercentage)}
                value={formatMoney(category.monthlyEarnings)}
                onClick={() => openCategoryModal("income", "edit", category.source)}
              />
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Expense Categories"
        action={
          <button
            type="button"
            className="button"
            onClick={() => openCategoryModal("expense", "new", "New Expense Category")}
          >
            <Plus size={16} />
            New Category
          </button>
        }
      >
        <div className="panel-tools">
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
        {expenseCategoryView === "simplified" && (
          <DataTable
            headers={["Expense category", "Monthly Budget", "Spending", "Remaining"]}
            rows={budgetCategories.map((category) => [
              category.name,
              formatMoney(category.monthlyBudget),
              formatMoney(category.spending),
              formatMoney(category.remaining),
            ])}
            footerRows={[
              ["Total", formatMoney(monthlyBudgetTotal), formatMoney(spendingTotal), formatMoney(remainingTotal)],
            ]}
            onRowClick={(rowIndex) => {
              const category = budgetCategories[rowIndex];
              if (category) {
                openCategoryModal("expense", "edit", category.name, category.auxiliary);
              }
            }}
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
            rows={budgetCategories.map((category) => [
              category.name,
              formatMoney(category.monthlyBudget),
              formatMoney(category.spending),
              formatMoney(category.remaining),
              category.overview,
              formatMoney(category.totalOverview),
            ])}
            footerRows={[
              [
                "Total",
                formatMoney(monthlyBudgetTotal),
                formatMoney(spendingTotal),
                formatMoney(remainingTotal),
                "",
                formatMoney(totalOverviewSum),
              ],
            ]}
            onRowClick={(rowIndex) => {
              const category = budgetCategories[rowIndex];
              if (category) {
                openCategoryModal("expense", "edit", category.name, category.auxiliary);
              }
            }}
          />
        )}
        {expenseCategoryView === "chart" && (
          <CategoryDonutChart
            data={budgetCategories.map((category, index) => ({
              name: category.name,
              value: category.spending,
              color: categoryPalette[index % categoryPalette.length],
            }))}
          />
        )}
        {expenseCategoryView === "cards" && (
          <div className="category-grid">
            {budgetCategories.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.name}
                detail={`Remaining ${formatMoney(category.remaining, { compact: true })}`}
                value={formatMoney(category.monthlyBudget, { compact: true })}
                onClick={() => openCategoryModal("expense", "edit", category.name, category.auxiliary)}
              />
            ))}
          </div>
        )}
      </Panel>

      <FormModal
        deleteLabel={categoryKind === "income" ? "Delete Category" : "Delete Category"}
        modal={categoryModal}
        saveLabel="Save Category"
        subtitle={
          categoryKind === "income"
            ? "Matches the Income Overview view from Notion."
            : "Matches MB Simplified and Monthly Budget (v1) from Notion."
        }
        onClose={() => setCategoryModal(null)}
      >
        {categoryKind === "income" ? (
          <div className="form-grid form-grid--single">
            <Field label="Income Type"><input placeholder="Source of income" /></Field>
            <ComputedField label="Monthly Earnings" value={formatMoney(85000)} />
            <ComputedField label="Earning Percentage" value={formatPercent(74.4)} />
          </div>
        ) : (
          <div className="form-grid form-grid--single">
            <Field label="Expense category"><input placeholder="Expense category" /></Field>
            <Field label="Monthly Budget"><input inputMode="decimal" placeholder="0.00" /></Field>
            <Field label="Upcoming Budget"><input inputMode="decimal" placeholder="0.00" /></Field>
            <Field label="Auxiliary">
              <select
                value={categoryAuxiliary}
                onChange={(event) => setCategoryAuxiliary(event.target.value as "Yes" | "No")}
              >
                <option value="" disabled>
                  Select your auxiliary status
                </option>
                <option>Yes</option>
                <option>No</option>
              </select>
            </Field>
            <ComputedField label="Spending" value={formatMoney(12500)} />
            <ComputedField label="Remaining" value={formatMoney(2500)} />
            <ComputedField label="Overview" value="83% used" />
            <ComputedField label="Total Overview" value={formatMoney(2500)} />
          </div>
        )}
      </FormModal>
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
  detail,
  actions,
}: {
  title: string;
  detail: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-toolbar">
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
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
      <Badge tone="neutral">Read-only</Badge>
    </div>
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
  rows: string[][];
  footerRows?: string[][];
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
              key={`${row[0]}-${rowIndex}`}
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
                <td key={`${cell}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
        {footerRows.length > 0 && (
          <tfoot>
            {footerRows.map((row, rowIndex) => (
              <tr key={`footer-${row[0]}-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`footer-${cell}-${cellIndex}`}>{cell}</td>
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
  icon: Icon,
  placeholder,
  value,
  onChange,
  children,
}: {
  icon: LucideIcon;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="filter-select">
      <Icon size={15} />
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="" disabled>
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
  const ratio = Math.min(100, Math.round((spent / budget) * 100));
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
