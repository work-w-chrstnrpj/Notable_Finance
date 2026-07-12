"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useMemo, useRef, useState, useEffect, startTransition, isValidElement } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { ColorPicker } from "@/components/color-picker";
import { userNotionConfigApi, preferencesApi } from "@/lib/api-client";
import {
  FabExportProvider,
  useFabExport,
  useFabRegister,
  type ReceiptContext,
  type ReceiptRow,
} from "@/lib/fab-export-context";
import {
  SHOT_HIDE_CLASS,
  downloadNodeAsPng,
  nodeToPngDataUrl,
  printNode,
} from "@/lib/export-node";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  ArrowUpDown,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  CircleDollarSign,
  ClipboardCheck,
  Copy,
  Download,
  TrendingUp,
  CreditCard,
  Database,
  FileWarning,
  Gauge,
  KeyRound,
  Landmark,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Palette,
  Pencil,
  PiggyBank,
  Plus,
  Printer,
  QrCode,
  Camera,
  ImageDown,
  FileDown,
  Receipt,
  RefreshCw,
  Save,
  Frown,
  Settings,
  ShieldCheck,
  Smartphone,
  Smile,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
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
  financeSections,
  getActiveSectionLabel,
} from "@/lib/finance-data";
import {
  useExpenses,
  useFinanceInvalidation,
  useIncomes,
  useSyncStatus,
  useWorkflowRecords,
} from "@/lib/use-data";
import { useFinanceData } from "@/lib/finance-data-context";
import {
  alkansyaApi,
  creditCardPaymentsApi,
  expensesApi,
  incomesApi,
  receivablesApi,
  syncApi,
  transfersApi,
} from "@/lib/api-client";
import {
  activeSelectorUnit,
  anchorMonth,
  computeRange,
  expenseModeToUnit,
  incomeModeToUnit,
  rangeLabel,
  stepAnchor,
  todayIso,
  type ViewUnit,
} from "@/lib/date-range";
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
  getExpenseConditionalSections,
  getMoneyValueTone,
  getWorkflowFixedCategory,
  isCreditLikeAccountType,
  pasabuyerLabels,
  pasabuyStatusLabels,
  paymentFrequencyLabels,
  paymentStatusLabels,
} from "@/lib/finance-rules";
import { formatDate, formatMoney, formatPercent, toYYMMDD } from "@/lib/format";
import type {
  Account,
  AccountType,
  ExpenseCategory,
  ExpenseRecord,
  ExpenseViewMode,
  FinanceSection,
  FinanceSectionId,
  IncomeCategory,
  IncomeRecord,
  IncomeViewMode,
  PasabuyStatus,
  PaymentFrequency,
  PaymentStatus,
  SchemaHealth,
  SyncState,
  SyncLogEntry,
  WorkflowSectionId,
} from "@/types/finance";

const sectionIcons: Record<FinanceSectionId, LucideIcon> = {
  dashboard: LayoutDashboard,
  accounts: WalletCards,
  income: ArrowUpRight,
  expense: ArrowDownLeft,
  "monthly-monitoring": CalendarDays,
  transfer: ArrowUpDown,
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
  "To pay",
  "To buy",
  "Installments",
  "Unpaid CC",
  "Unpaid Pasabuy",
];

const expenseCategoryFilterWithoutPasabuy = "__without-pasabuy";
const prototypeAccent = "#5B6CF9";

const categoryPalette = [prototypeAccent, "#0D9488", "#D97706", "#E11D48", "#7C3AED", "#64748B"];

type ForecastIncome = { id: string; label: string; amount: number };

type ModalState = {
  mode: "new" | "edit";
  title: string;
} | null;

type AccountScope = "all" | "standard" | "credit";
type ComputedValueTone = "green" | "rose" | "amber" | "ink";

/**
 * Update the [YYMMDDx] tag in a description string based on a new date.
 * - If the description has no tag, prepend [YYMMDDx] with default code 'x'.
 * - If the description already has a [..] tag, replace the date portion
 *   while preserving the existing transaction code letter.
 * Preserves any text after the tag.
 */
function applyNotionTag(description: string, yyymmdd: string | null): string {
  if (!yyymmdd) return description;
  const tagRegex = /^\[(\d{6})([a-zA-Z])\]\s*/;
  const match = description.match(tagRegex);
  if (match) {
    // Preserve existing transaction code letter
    const code = match[2];
    const rest = description.slice(match[0].length);
    return `[${yyymmdd}${code}] ${rest}`;
  }
  // No existing tag — prepend with default code 'x'
  return `[${yyymmdd}x] ${description}`;
}

/**
 * Update the [YYMMDD] tag in an income name string based on a new date.
 * Income uses [YYMMDD] format (no transaction code letter).
 */
function applyIncomeTag(name: string, yyymmdd: string | null): string {
  if (!yyymmdd) return name;
  const tagRegex = /^\[(\d{6})\]\s*/;
  const match = name.match(tagRegex);
  if (match) {
    const rest = name.slice(match[0].length);
    return `[${yyymmdd}] ${rest}`;
  }
  // No existing tag — prepend
  return `[${yyymmdd}] ${name}`;
}

/** Strip Notion's [YYMMDD] or [YYMMDDx] prefix from names/descriptions for display. */
function stripNotionTag(text: string): string {
  return text.replace(/^\[.*?\]\s*/, '');
}

function getMonthLabel(value: string) {
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
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
  return value !== "" && value !== expenseCategoryFilterWithoutPasabuy;
}

function getIncomeGrossTotal(records: IncomeRecord[]) {
  return records.reduce((sum, record) => sum + record.grossIncome, 0);
}

function getIncomeCapitalExpenditureTotal(records: IncomeRecord[]) {
  return records.reduce((sum, record) => sum + record.capitalExpenditure, 0);
}

function getIncomeNetTotal(records: IncomeRecord[]) {
  return records.reduce(
    (sum, record) => sum + calculateNetIncome(record.grossIncome, record.capitalExpenditure),
    0,
  );
}

function getExpenseTotal(records: ExpenseRecord[]) {
  return records.reduce((sum, record) => sum + record.amount, 0);
}

// Reference data (accounts + categories) is fetched once by FinanceDataProvider
// and shared via context. This thin alias keeps existing call sites unchanged.
// See src/lib/finance-data-context.tsx.
function useLiveCollections() {
  return useFinanceData();
}

function getIncomeCategorySummaries(
  records: IncomeRecord[],
  categories: IncomeCategory[],
) {
  const totalNetIncome = getIncomeNetTotal(records);

  return categories.map((category) => {
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

function getExpenseCategorySummaries(records: ExpenseRecord[], categories: ExpenseCategory[]) {
  const totalExpense = getExpenseTotal(records);

  return categories
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

export function FinanceWorkspace({ activeSection }: { activeSection: FinanceSectionId }) {
  const { user, loading: authLoading } = useAuth();
  const { refreshReferenceData } = useFinanceData();
  const [selectedDate, setSelectedDate] = useState<string>(() => todayIso());
  const selectedMonth = anchorMonth(selectedDate);
  const [incomeViewMode, setIncomeViewMode] = useState<IncomeViewMode>("Monthly");
  const [expenseViewMode, setExpenseViewMode] = useState<ExpenseViewMode>("Monthly");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [schemaHealth, setSchemaHealth] = useState<SchemaHealth>("notChecked");
  const [pendingOperations, setPendingOperations] = useState(0);
  const [lastSync, setLastSync] = useState("—");
  // FAB visibility preference (per-user, synced via the backend). Defaults on.
  // localStorage cache prevents flash on remount while API is in flight.
  const [showFab, setShowFab] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const cached = localStorage.getItem("nf_show_fab");
      return cached !== null ? cached === "true" : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    preferencesApi
      .get()
      .then((res) => {
        if (!cancelled && res.success) {
          setShowFab(res.data.showFab);
          // Sync localStorage cache
          try {
            localStorage.setItem("nf_show_fab", String(res.data.showFab));
          } catch { /* ignore */ }
        }
      })
      .catch(() => {
        /* keep default on network/backend error */
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  async function updateShowFab(next: boolean) {
    setShowFab(next);
    // Persist to localStorage immediately
    try {
      localStorage.setItem("nf_show_fab", String(next));
    } catch { /* ignore */ }
    try {
      await preferencesApi.save({ showFab: next });
    } catch {
      /* optimistic; ignore persistence errors */
    }
  }

  const selectorUnit = activeSelectorUnit(activeSection, incomeViewMode, expenseViewMode);

  // Sync is pull-only: it refreshes the app's cache from Notion. Creates and
  // updates go straight to Notion from the item modals (POST/PATCH), so there
  // is nothing to push here.
  async function runSync() {
    setSyncState("syncing");

    try {
      const pullResult = await syncApi.pullLatest({
        resources: [
          "accounts",
          "incomeCategories",
          "expenseCategories",
          "incomes",
          "expenses",
        ],
        month: selectedMonth,
      });
      if (pullResult.success) {
        setSyncState("fresh");
        setPendingOperations(0);
        setLastSync(new Date().toISOString().replace("T", " ").slice(0, 16));
        // A pull may have brought in new/changed accounts or categories —
        // refresh the shared reference data (silently) so dropdowns update.
        refreshReferenceData();
      } else {
        setSyncState("error");
      }
    } catch {
      setSyncState("error");
    }
  }

  async function verifySchema() {
    try {
      const result = await syncApi.schemaStatus();

      if (result.success) {
        setSchemaHealth("verified");
      } else {
        setSchemaHealth("warning");
      }
    } catch {
      // Fall back to mock verify behavior
      setSchemaHealth("warning");
    }
  }

  return (
    <FabExportProvider>
    <div
      className={cx(
        "workspace",
        sidebarCollapsed && "workspace--sidebar-collapsed",
        mobileNavOpen && "workspace--mobile-nav-open",
      )}
    >
      <Sidebar
        activeSection={activeSection}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((current) => !current)}
        onNavigate={() => setMobileNavOpen(false)}
      />
      <div
        className="mobile-nav-backdrop"
        role="presentation"
        onClick={() => setMobileNavOpen(false)}
      />
      <div className="workspace__main">
        <TopBar
          activeSection={activeSection}
          expenseViewMode={expenseViewMode}
          incomeViewMode={incomeViewMode}
          lastSync={lastSync}
          pendingOperations={pendingOperations}
          schemaHealth={schemaHealth}
          selectedDate={selectedDate}
          selectorUnit={selectorUnit}
          syncState={syncState}
          onDateChange={setSelectedDate}
          onSchemaVerify={verifySchema}
          onSync={runSync}
          onMobileNavToggle={() => setMobileNavOpen((v) => !v)}
        />
        <main className="workspace__content">
          {activeSection === "dashboard" && (
            <DashboardPage
              lastSync={lastSync}
              selectedMonth={selectedMonth}
            />
          )}
          {activeSection === "accounts" && <AccountsPage />}
          {activeSection === "income" && (
            <IncomePage
              viewMode={incomeViewMode}
              onViewModeChange={setIncomeViewMode}
              selectedDate={selectedDate}
            />
          )}
          {activeSection === "expense" && (
            <ExpensePage
              viewMode={expenseViewMode}
              onViewModeChange={setExpenseViewMode}
              selectedDate={selectedDate}
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
            <SettingsPage
              schemaHealth={schemaHealth}
              onSchemaVerify={verifySchema}
              showFab={showFab}
              onShowFabChange={updateShowFab}
            />
          )}
        </main>
      </div>
      {showFab && user && (
        <WorkspaceFab
          activeSection={activeSection}
          selectedDate={selectedDate}
        />
      )}
    </div>
    </FabExportProvider>
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

function AccountTypeIcon({ type, size = 18 }: { type: AccountType; size?: number }) {
  switch (type) {
    case "Cash":
      return <Banknote size={size} />;
    case "Credit Account":
    case "e-Credit":
    case "BNPL":
      return <CreditCard size={size} />;
    case "Savings":
      return <Landmark size={size} />;
    case "e-Wallet":
    case "Digital Bank":
      return <Smartphone size={size} />;
    default:
      return <Building2 size={size} />;
  }
}

function isImageUrl(value: string): boolean {
  return /^(https?:\/\/|data:|\/)/.test(value);
}

function AccountIcon({ account }: { account: Account }) {
  if (account.icon && isImageUrl(account.icon)) {
    return (
      <Image
        src={account.icon}
        alt=""
        width={24}
        height={24}
        className="account-icon"
        unoptimized
        onError={(event) => {
          const target = event.currentTarget;
          target.style.display = "none";
          const fallback = target.nextElementSibling;
          if (fallback) {
            (fallback as HTMLElement).style.display = "grid";
          }
        }}
      />
    );
  }

  if (account.icon) {
    return (
      <span className="account-icon account-icon--emoji" aria-hidden="true">
        {account.icon}
      </span>
    );
  }

  return (
    <span className="account-icon account-icon--fallback">
      <AccountTypeIcon type={account.type} size={18} />
    </span>
  );
}

function Sidebar({
  activeSection,
  collapsed,
  onToggle,
  onNavigate,
}: {
  activeSection: FinanceSectionId;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const { user, logout } = useAuth();
  const groupedSections = useMemo(
    () => ({
      primary: financeSections.filter((section) => section.group === "primary"),
      workflow: financeSections.filter((section) => section.group === "workflow"),
      system: financeSections.filter((section) => section.group === "system"),
    }),
    [],
  );
  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand__mark">N</div>
        <div>
          <p className="brand__name">Notable Finance</p>
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
        <NavGroup title="Core" sections={groupedSections.primary} activeSection={activeSection} onNavigate={onNavigate} />
        <NavGroup title="Workflows" sections={groupedSections.workflow} activeSection={activeSection} onNavigate={onNavigate} />
        <NavGroup title="System" sections={groupedSections.system} activeSection={activeSection} onNavigate={onNavigate} />
      </nav>
      <div className="sidebar-profile">
        <div className="sidebar-profile__avatar">{initials}</div>
        <div>
          <p>{user?.name ?? user?.email ?? "Guest"}</p>
          <span>{user ? "Authenticated" : "Not signed in"}</span>
        </div>
        {user && (
          <button type="button" title="Sign out" onClick={logout}>
            <LogOut size={13} />
          </button>
        )}
      </div>
    </aside>
  );
}

function NavGroup({
  title,
  sections,
  activeSection,
  onNavigate,
}: {
  title: string;
  sections: FinanceSection[];
  activeSection: FinanceSectionId;
  onNavigate?: () => void;
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
            onClick={onNavigate}
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
  lastSync,
  pendingOperations,
  schemaHealth,
  selectedDate,
  selectorUnit,
  syncState,
  onDateChange,
  onSchemaVerify,
  onSync,
  onMobileNavToggle,
}: {
  activeSection: FinanceSectionId;
  expenseViewMode: ExpenseViewMode;
  incomeViewMode: IncomeViewMode;
  lastSync: string;
  pendingOperations: number;
  schemaHealth: SchemaHealth;
  selectedDate: string;
  selectorUnit: ViewUnit | null;
  syncState: SyncState;
  onDateChange: (isoDate: string) => void;
  onSchemaVerify: () => void;
  onSync: () => void;
  onMobileNavToggle: () => void;
}) {
  const { user } = useAuth();
  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <header className="topbar">
      <button
        type="button"
        className="mobile-nav-toggle"
        aria-label="Open navigation"
        onClick={onMobileNavToggle}
      >
        <Menu size={18} />
      </button>
      <div className="topbar__actions" aria-label="Workspace controls">
        {selectorUnit && (
          <DateRangeSelector
            unit={selectorUnit}
            anchorDate={selectedDate}
            onChange={onDateChange}
          />
        )}
        <StatusPill syncState={syncState} schemaHealth={schemaHealth} />
        <span className="sync-meta">{pendingOperations} pending</span>
        <span className="sync-meta">Last sync {lastSync}</span>
        <button
          type="button"
          className="button"
          onClick={onSchemaVerify}
          title="Check /system/schema-status"
        >
          <Database size={12} />
          Schema Check
        </button>
        <div className="sync-btn-wrapper">
          <button type="button" className="button button--primary" onClick={onSync}>
            <RefreshCw size={12} className={syncState === "syncing" ? "spin" : undefined} />
            Sync
          </button>
        </div>
        <Link href="/settings" className="topbar__avatar">{initials}</Link>
      </div>
    </header>
  );
}

const PICKER_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function DateRangeSelector({
  unit,
  anchorDate,
  onChange,
}: {
  unit: ViewUnit;
  anchorDate: string;
  onChange: (isoDate: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [year, month, day] = anchorDate.split("-").map(Number);
  const [draftYear, setDraftYear] = useState(year);

  function toggleOpen() {
    setOpen((v) => {
      const next = !v;
      if (next) setDraftYear(year); // sync draft to current anchor on open
      return next;
    });
  }

  const label = rangeLabel(unit, anchorDate);
  const showDayPicker = unit === "day" || unit === "week";
  const showMonthGrid = unit === "day" || unit === "week" || unit === "month";

  function pickMonth(m: number) {
    // Keep the day when possible; clamp to the 1st for month/year scopes.
    const targetDay = showDayPicker ? day : 1;
    onChange(
      `${draftYear.toString().padStart(4, "0")}-${(m + 1)
        .toString()
        .padStart(2, "0")}-${targetDay.toString().padStart(2, "0")}`,
    );
    if (!showDayPicker) setOpen(false);
  }

  return (
    <div className="month-stepper">
      <button
        type="button"
        aria-label="Previous"
        onClick={() => onChange(stepAnchor(unit, anchorDate, -1))}
      >
        <ChevronLeft size={13} />
      </button>
      <button
        type="button"
        className="month-stepper__label"
        onClick={toggleOpen}
        aria-expanded={open}
      >
        {label}
      </button>
      <button
        type="button"
        aria-label="Next"
        onClick={() => onChange(stepAnchor(unit, anchorDate, 1))}
      >
        <ChevronRight size={13} />
      </button>

      {open && (
        <>
          <div
            className="date-picker__backdrop"
            role="presentation"
            onClick={() => setOpen(false)}
          />
          <div className="date-picker" role="dialog" aria-label="Pick a date">
            {unit === "year" ? (
              <div className="date-picker__year-list">
                {Array.from({ length: 9 }, (_, i) => year - 4 + i).map((y) => (
                  <button
                    type="button"
                    key={y}
                    className={cx("date-picker__cell", y === year && "is-active")}
                    onClick={() => {
                      onChange(`${y}-01-01`);
                      setOpen(false);
                    }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="date-picker__year-row">
                  <button type="button" onClick={() => setDraftYear((y) => y - 1)}>
                    <ChevronLeft size={14} />
                  </button>
                  <strong>{draftYear}</strong>
                  <button type="button" onClick={() => setDraftYear((y) => y + 1)}>
                    <ChevronRight size={14} />
                  </button>
                </div>
                {showMonthGrid && (
                  <div className="date-picker__month-grid">
                    {PICKER_MONTHS.map((mName, m) => (
                      <button
                        type="button"
                        key={mName}
                        className={cx(
                          "date-picker__cell",
                          draftYear === year && m + 1 === month && "is-active",
                        )}
                        onClick={() => pickMonth(m)}
                      >
                        {mName}
                      </button>
                    ))}
                  </div>
                )}
                {showDayPicker && (
                  <label className="date-picker__day">
                    Exact day
                    <input
                      type="date"
                      value={anchorDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          onChange(e.target.value);
                          setOpen(false);
                        }
                      }}
                    />
                  </label>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
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
  selectedMonth,
}: {
  lastSync: string;
  selectedMonth: string;
}) {
  const {
    creditActiveAccounts,
    nonCreditActiveAccounts,
    expenseCategories,
    accountNameById,
    expenseCategoryNameById,
  } = useLiveCollections();
  const { state: incomesState } = useIncomes({ month: selectedMonth });
  const { state: expensesState } = useExpenses({ month: selectedMonth });
  const { state: alkansyaState } = useWorkflowRecords("alkansya", {
    month: selectedMonth,
  });
  const { state: transferState } = useWorkflowRecords("transfer", {
    month: selectedMonth,
  });
  const { state: ccPaymentState } = useWorkflowRecords("credit-card-payment", {
    month: selectedMonth,
  });
  const monthLabel = getMonthLabel(selectedMonth);

  const monthIncomes: IncomeRecord[] = (
    incomesState.status === "success" ? incomesState.data : []
  ).filter((r) => !r.name?.includes("[Deleted:"));
  const monthExpenses: ExpenseRecord[] = (
    expensesState.status === "success" ? expensesState.data : []
  ).filter((r) => !r.description?.includes("[Deleted:"));
  const monthAlkansya: IncomeRecord[] = (
    alkansyaState.status === "success" ? alkansyaState.data : []
  ).filter((r) => !r.name?.includes("[Deleted:"));

  const monthlyGrossIncome = monthIncomes.reduce(
    (sum, r) => sum + r.grossIncome,
    0,
  );
  // Pasabuy expenses are paid on behalf of others ("pinasabay lang"), so they
  // are not part of the user's own monthly expense.
  const pasabuyCategoryIds = new Set(
    expenseCategories.filter((c) => /pasabuy/i.test(c.name)).map((c) => c.id),
  );
  const ownExpenses = monthExpenses.filter(
    (r) => !pasabuyCategoryIds.has(r.categoryId),
  );
  const monthlyExpenses = ownExpenses.reduce(
    (sum, r) => sum + r.amount + (r.interest ?? 0),
    0,
  );
  const alkansyaBalance = monthAlkansya.reduce(
    (sum, r) => sum + (r.grossIncome - r.capitalExpenditure),
    0,
  );

  const totalCashFlow = nonCreditActiveAccounts.reduce(
    (sum, a) => sum + (a.currentBalance ?? 0),
    0,
  );
  const availableCredit = creditActiveAccounts.reduce(
    (sum, a) => sum + (a.availableLimit ?? 0),
    0,
  );
  const creditLimit = creditActiveAccounts.reduce(
    (sum, a) => sum + (a.creditLimit ?? 0),
    0,
  );
  const creditBalanceTotal = creditActiveAccounts.reduce(
    (sum, a) => sum + (a.currentBalance ?? 0),
    0,
  );

  // #1 — Monthly Total CC Transactions: sum of expenses on a credit account.
  const creditAccountIds = new Set(creditActiveAccounts.map((a) => a.id));
  const monthlyCcTransactions = monthExpenses
    .filter((r) => creditAccountIds.has(r.accountId))
    .reduce((sum, r) => sum + r.amount + (r.interest ?? 0), 0);

  // #2 — Spending by category (with % of month's expense), used for both the
  // Spending Breakdown donut and the Top 5 Spending Category panel.
  // Pasabuy is a passthrough (someone else pays us back), not user spending —
  // exclude it so the breakdown reflects real category spend.
  const spendingBreakdown = expenseCategories
    .filter((cat) => !/pasabuy/i.test(cat.name))
    .map((cat) => {
      const value = monthExpenses
        .filter((r) => r.categoryId === cat.id)
        .reduce((sum, r) => sum + r.amount + (r.interest ?? 0), 0);
      return { name: cat.name, value };
    })
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);

  const topSpendingCategories = spendingBreakdown.slice(0, 5).map((row) => ({
    name: row.name,
    value: row.value,
    percent: monthlyExpenses > 0 ? (row.value / monthlyExpenses) * 100 : 0,
  }));

  // #2 — Most Expensive Purchase of the Month (largest individual expenses).
  const topExpensePurchases = [...monthExpenses]
    .map((r) => ({
      id: r.id,
      description: r.description.replace(/\s*\[Deleted:.*\]/, ""),
      amount: r.amount + (r.interest ?? 0),
      category: expenseCategoryNameById.get(r.categoryId) ?? "—",
      account: accountNameById.get(r.accountId) ?? "—",
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const sectionPriority: Record<string, number> = {
    income: 0,
    "credit-card-payment": 1,
    expense: 2,
    transfer: 3,
  };

  const sectionMeta: Record<string, string> = {
    income: "Income",
    "credit-card-payment": "CC Payment",
    expense: "Expense",
    transfer: "Transfer",
  };

  const incomeItems = [...monthIncomes].map((r) => ({
    id: r.id,
    date: r.date,
    title: r.name.replace(/\s*\[Deleted:.*\]/, ""),
    section: "income",
    value: r.grossIncome - r.capitalExpenditure,
  }));

  const ccPaymentItems = (ccPaymentState.status === "success" ? ccPaymentState.data : [])
    .filter((r) => !r.name?.includes("[Deleted:"))
    .map((r) => ({
      id: r.id,
      date: r.date,
      title: r.name.replace(/\s*\[Deleted:.*\]/, ""),
      section: "credit-card-payment",
      value: r.grossIncome - r.capitalExpenditure,
    }));

  const expenseItems = [...monthExpenses].map((r) => ({
    id: r.id,
    date: r.purchaseDate,
    title: r.description.replace(/\s*\[Deleted:.*\]/, ""),
    section: "expense",
    value: -(r.amount + (r.interest ?? 0)),
  }));

  const transferItems = (transferState.status === "success" ? transferState.data : [])
    .filter((r) => !r.name?.includes("[Deleted:"))
    .map((r) => ({
      id: r.id,
      date: r.date,
      title: r.name.replace(/\s*\[Deleted:.*\]/, ""),
      section: "transfer",
      value: r.grossIncome - r.capitalExpenditure,
    }));

  const recentTransactions = [...incomeItems, ...ccPaymentItems, ...expenseItems, ...transferItems]
    .sort((a, b) => {
      if (b.date > a.date) return 1;
      if (b.date < a.date) return -1;
      return (sectionPriority[a.section] ?? 99) - (sectionPriority[b.section] ?? 99);
    })
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      date: r.date,
      title: r.title,
      meta: sectionMeta[r.section] ?? r.section,
      section: r.section,
      value: r.value,
      tone: r.value >= 0 ? ("green" as const) : ("rose" as const),
    }));

  const display = {
    totalCashFlow,
    monthlyGrossIncome,
    monthlyExpenses,
    alkansyaBalance,
    pendingOperations: monthExpenses.filter((r) => r.datePaid === null).length,
    lastSync,
    availableCredit,
    creditLimit,
    creditBalanceTotal,
    monthlyCcTransactions,
    spendingBreakdown,
    topSpendingCategories,
    topExpensePurchases,
    recentTransactions,
  };

  const spendingData = display.spendingBreakdown.length > 0
    ? display.spendingBreakdown.map((item) => ({
        name: item.name,
        value: item.value,
        color: categoryPalette[display.spendingBreakdown.indexOf(item) % categoryPalette.length],
      }))
    : [];

  const toneForValue = (value: number): "green" | "rose" => value >= 0 ? "green" : "rose";
  const recentData = display.recentTransactions.length > 0
    ? display.recentTransactions.map((item) => ({
        id: item.id,
        date: item.date,
        title: item.title,
        meta: item.meta,
        section: item.section,
        value: item.value,
        tone: toneForValue(item.value),
      }))
    : [];

  return (
    <div className="page-stack">
      <section className="metric-grid metric-grid--prototype">
        <MetricCard
          title="Total Cash Flow"
          value={formatMoney(display.totalCashFlow)}
          detail="Non-credit accounts"
          icon={WalletCards}
          tone="blue"
        />
        <MetricCard
          title="Monthly Income"
          value={formatMoney(display.monthlyGrossIncome)}
          detail={monthLabel}
          icon={Banknote}
          tone="green"
        />
        <MetricCard
          title="Monthly Expenses"
          value={formatMoney(display.monthlyExpenses)}
          detail={monthLabel}
          icon={Receipt}
          tone="rose"
        />
        <MetricCard
          title="Sync Queue"
          value={`${display.pendingOperations}`}
          detail={`Last sync ${display.lastSync}`}
          icon={RefreshCw}
          tone="amber"
        />
      </section>

      <section className="metric-grid metric-grid--prototype">
        <MetricCard
          title="Alkansya Balance"
          value={formatMoney(display.alkansyaBalance)}
          detail={monthLabel}
          icon={PiggyBank}
          tone="green"
        />
        <MetricCard
          title="Available Credit"
          value={formatMoney(display.availableCredit)}
          detail={`Limit ${formatMoney(display.creditLimit, { compact: true })}`}
          icon={CreditCard}
          tone="blue"
        />
        <MetricCard
          title="Monthly Total CC Transactions"
          value={formatMoney(display.monthlyCcTransactions)}
          detail={`${creditActiveAccounts.length} credit accounts · ${monthLabel}`}
          icon={CreditCard}
          tone="amber"
        />
        <MetricCard
          title="CC Balance Total"
          value={formatMoney(display.creditBalanceTotal)}
          detail={`${creditActiveAccounts.length} credit accounts`}
          icon={AlertTriangle}
          tone="rose"
        />
      </section>

      <section className="dashboard-chart-grid">
        <TopExpensePurchasesCard purchases={display.topExpensePurchases} monthLabel={monthLabel} />
        <SpendingBreakdownCard data={spendingData} monthLabel={monthLabel} />
      </section>

      <section className="dashboard-bottom-grid">
        <TopSpendingCategoriesCard categories={display.topSpendingCategories} monthLabel={monthLabel} />
        <RecentTransactionsList records={recentData} />
      </section>
    </div>
  );
}

function TopExpensePurchasesCard({
  purchases,
  monthLabel,
}: {
  purchases: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    account: string;
  }>;
  monthLabel: string;
}) {
  // Rank ramp: #1 red → #5 yellow.
  const rankColors = ["#DC2626", "#EA580C", "#F97316", "#F59E0B", "#CA8A04"];

  return (
    <section className="dashboard-card">
      <div className="dashboard-card__header dashboard-card__header--stacked">
        <h2>Most Expensive Purchase of the Month</h2>
        <p>{monthLabel}</p>
      </div>
      {purchases.length === 0 ? (
        <EmptyState title="No expenses" detail="No expenses are scoped to this month." />
      ) : (
        <div className="top-expense-list">
          {purchases.map((p, index) => {
            const color = rankColors[index] ?? rankColors[rankColors.length - 1];
            return (
              <div key={p.id} className="top-expense-row">
                <span
                  className="top-expense-row__rank"
                  style={{ backgroundColor: color }}
                >
                  {index + 1}
                </span>
                <div className="top-expense-row__content">
                  <strong className="top-expense-row__title" style={{ color }}>
                    {p.description || "Untitled"}
                  </strong>
                  <div className="top-expense-row__meta">
                    <span>{p.category} · {p.account}</span>
                    <strong>{formatMoney(p.amount)}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TopSpendingCategoriesCard({
  categories,
  monthLabel,
}: {
  categories: Array<{ name: string; value: number; percent: number }>;
  monthLabel: string;
}) {
  return (
    <section className="dashboard-card">
      <div className="dashboard-card__header dashboard-card__header--stacked">
        <h2>Top 5 Spending Category</h2>
        <p>{monthLabel}</p>
      </div>
      {categories.length === 0 ? (
        <EmptyState title="No spending" detail="No expenses are scoped to this month." />
      ) : (
        <div className="budget-usage-list">
          {categories.map((cat) => {
            const percent = Math.round(cat.percent);
            const color = percent > 50 ? "#E11D48" : percent > 25 ? "#D97706" : prototypeAccent;
            return (
              <div key={cat.name} className="budget-usage-row">
                <div>
                  <span>{cat.name}</span>
                  <strong>{formatMoney(cat.value, { compact: true })} · {percent}%</strong>
                </div>
                <div className="budget-usage-track">
                  <i style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RecentTransactionsList({
  records,
}: {
  records: Array<{
    id: string;
    title: string;
    meta: string;
    section: string;
    value: number;
    tone: "green" | "rose";
  }>;
}) {
  const iconMap: Record<string, LucideIcon> = {
    income: ArrowUpRight,
    expense: ArrowDownLeft,
    transfer: ArrowUpDown,
    "credit-card-payment": CreditCard,
  };

  return (
    <section className="dashboard-card recent-list-card">
      <div className="recent-list-card__header">
        <h2>Recent Transactions</h2>
      </div>
      <div className="recent-list">
        {records.map((record) => {
          const Icon = iconMap[record.section] ?? ArrowUpRight;
          const prefix = record.value > 0 ? "+" : "-";

          return (
            <button type="button" className="recent-list__row" key={record.id}>
              <span className={cx("recent-list__icon", `recent-list__icon--${record.tone}`)}>
                <Icon size={16} />
              </span>
              <span className="recent-list__copy">
                <span>{record.title}</span>
                <span>{record.meta}</span>
              </span>
              <span className={cx("recent-list__amount", `recent-list__amount--${record.section}`)}>
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

// ── Annually chart (Income + Expense) ─────────────────────────────────

type AnnualGroupBy = "month" | "account" | "category";

const ANNUAL_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type AnnualRecord = {
  dateIso: string;
  accountId: string | null;
  categoryId: string;
  value: number;
};

function buildAnnualGroups(
  records: AnnualRecord[],
  groupBy: AnnualGroupBy,
  accountNameById: Map<string, string>,
  categoryNameById: Map<string, string>,
): Array<{ label: string; value: number }> {
  if (groupBy === "month") {
    const sums = new Array(12).fill(0) as number[];
    for (const r of records) {
      const m = Number((r.dateIso || "").slice(5, 7)) - 1;
      if (m >= 0 && m < 12) sums[m] += r.value;
    }
    return ANNUAL_MONTHS.map((label, i) => ({ label, value: sums[i] }));
  }
  const nameById = groupBy === "account" ? accountNameById : categoryNameById;
  const sums = new Map<string, number>();
  for (const r of records) {
    const key = (groupBy === "account" ? r.accountId ?? "" : r.categoryId) || "—";
    sums.set(key, (sums.get(key) ?? 0) + r.value);
  }
  return [...sums.entries()]
    .map(([key, value]) => ({ label: nameById.get(key) ?? "—", value }))
    .sort((a, b) => b.value - a.value);
}

function GroupBySelect({
  value,
  onChange,
}: {
  value: AnnualGroupBy;
  onChange: (v: AnnualGroupBy) => void;
}) {
  return (
    <label className="group-by">
      <select value={value} onChange={(e) => onChange(e.target.value as AnnualGroupBy)}>
        <option value="month">Group by Month</option>
        <option value="account">Group by Account</option>
        <option value="category">Group by Category</option>
      </select>
    </label>
  );
}

function AnnualBarChart({
  data,
  color,
}: {
  data: Array<{ label: string; value: number }>;
  color: string;
}) {
  if (!data.some((d) => d.value !== 0)) {
    return <EmptyState title="No data" detail="Nothing to chart for this year." />;
  }
  const rotated = data.length > 6;
  return (
    <div className="annual-chart" aria-label="Annual bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,25,23,0.06)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#79716B" }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={rotated ? -35 : 0}
            textAnchor={rotated ? "end" : "middle"}
            height={rotated ? 78 : 28}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#79716B" }}
            tickLine={false}
            axisLine={false}
            width={52}
            tickFormatter={(v) => `₱${(Number(v) / 1000).toFixed(0)}k`}
          />
          <Tooltip
            cursor={{ fill: "rgba(28,25,23,0.05)" }}
            formatter={(v) => [formatMoney(Number(v)), ""]}
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "1px solid rgba(28,25,23,0.09)",
              borderRadius: 10,
              fontSize: 12,
            }}
          />
          <Bar dataKey="value" fill={color} radius={[5, 5, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function IncomePage({
  viewMode,
  onViewModeChange,
  selectedDate,
}: {
  viewMode: IncomeViewMode;
  onViewModeChange: (viewMode: IncomeViewMode) => void;
  selectedDate: string;
}) {
  const {
    nonCreditActiveAccounts,
    normalIncomeCategories,
    accountNameById,
    incomeCategoryNameById,
  } = useLiveCollections();
  const range = computeRange(incomeModeToUnit(viewMode), selectedDate);
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [grossIncomeInput, setGrossIncomeInput] = useState("");
  const [capitalExpenditureInput, setCapitalExpenditureInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [annualView, setAnnualView] = useState<"table" | "chart">("table");
  const [groupBy, setGroupBy] = useState<AnnualGroupBy>("month");
  const isAnnual = viewMode === "Annually";
  const calculatedNetIncome = calculateNetIncome(
    parseNumberInput(grossIncomeInput),
    parseNumberInput(capitalExpenditureInput),
  );
  const { state: incomesState, refetch, applyLocal } = useIncomes({
    rangeStart: range.start,
    rangeEnd: range.end,
    accountId: accountId || undefined,
    categoryId: categoryId || undefined,
  });
  const { invalidateIncomeFamily } = useFinanceInvalidation();
  useEffect(() => {
    const handler = () => {
      void refetch();
    };
    window.addEventListener(DATA_CHANGED_EVENT, handler);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handler);
  }, [refetch]);

  // Auto-update [YYMMDD] tag when date changes (new or edit mode).
  useEffect(() => {
    if (modal?.mode !== "new" && modal?.mode !== "edit") return;
    const yyymmdd = toYYMMDD(dateInput);
    if (!yyymmdd) return;
    setNameInput((prev) => applyIncomeTag(prev, yyymmdd));
  }, [dateInput, modal?.mode]);

  const isLoading = incomesState.status === "loading";
  const allIncomeRecords: IncomeRecord[] =
    incomesState.status === "success" ? incomesState.data : [];
  const visibleIncomeRecords: IncomeRecord[] = allIncomeRecords.filter(
    (record) => !record.name?.includes("[Deleted:"),
  );
  const annualIncomeGroups = buildAnnualGroups(
    visibleIncomeRecords.map((r) => ({
      dateIso: r.date,
      accountId: r.accountId,
      categoryId: r.categoryId,
      value: r.grossIncome,
    })),
    groupBy,
    accountNameById,
    incomeCategoryNameById,
  );

  function openIncomeModal(mode: "new" | "edit", title: string, recordId?: string) {
    const record =
      recordId != null
        ? visibleIncomeRecords.find((r) => r.id === recordId)
        : undefined;
    setNameInput(record?.name ?? "");
    setDateInput(record?.date ?? "");
    setFormAccountId(record?.accountId ?? "");
    setFormCategoryId(record?.categoryId ?? "");
    setGrossIncomeInput(record?.grossIncome?.toString() ?? "");
    setCapitalExpenditureInput(record?.capitalExpenditure?.toString() ?? "");
    setEditingId(record?.id ?? null);
    setEditing(mode === "new"); // new starts editable; edit starts read-only
    setSaveError(null);
    setModal({ mode, title });
  }

  async function handleSaveIncome() {
    if (!nameInput.trim() || !dateInput) {
      setSaveError("Name and date are required.");
      return;
    }
    const payload = {
      name: nameInput.trim(),
      date: dateInput,
      grossIncome: parseNumberInput(grossIncomeInput),
      capitalExpenditure: parseNumberInput(capitalExpenditureInput),
      accountId: formAccountId,
      categoryId: formCategoryId,
    };
    setSaving(true);
    setSaveError(null);
    const res =
      modal?.mode === "edit" && editingId
        ? await incomesApi.update(editingId, payload)
        : await incomesApi.create(payload);
    setSaving(false);
    if (!res.success) {
      setSaveError(res.error.message || "Failed to save to Notion.");
      return;
    }
    setModal(null);
    // Optimistic: splice the returned record into the visible list immediately,
    // then invalidate the income family so this list AND cross-section views
    // (Dashboard, Monthly Monitoring) reconcile from the server.
    const saved = res.data;
    applyLocal((rows) => {
      const idx = rows.findIndex((r) => r.id === saved.id);
      if (idx === -1) return [saved, ...rows];
      const next = rows.slice();
      next[idx] = saved;
      return next;
    });
    invalidateIncomeFamily();
  }

  function handleDuplicateIncome() {
    // Keep the currently-loaded field values but detach from the source record
    // so Save creates a fresh income instead of updating the original.
    setEditingId(null);
    setEditing(true);
    setSaveError(null);
    setModal({ mode: "new", title: "New Income (Copy)" });
  }

  async function handleDeleteIncome() {
    if (!editingId) return;
    if (!window.confirm("Soft-delete this income in Notion?")) return;
    const deletedId = editingId;
    setSaving(true);
    const res = await incomesApi.delete(deletedId);
    setSaving(false);
    if (!res.success) {
      setSaveError(res.error.message || "Failed to delete.");
      return;
    }
    setModal(null);
    // Optimistic: drop the row immediately, then invalidate the income family so
    // this list and cross-section views reconcile.
    applyLocal((rows) => rows.filter((r) => r.id !== deletedId));
    invalidateIncomeFamily();
  }

  return (
    <div className="page-stack">
      <PageToolbar
        title="Income"
        actions={
          <>
            <FilterSelect
              placeholder="All Accounts"
              placeholderDisabled={false}
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
              placeholder="All Categories"
              placeholderDisabled={false}
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

      <Panel title={`${viewMode} Income Records`}>
        {isLoading && <LoadingBlock label="Querying Notion…" />}
        {isAnnual && annualView === "chart" ? (
          <AnnualBarChart data={annualIncomeGroups} color="#0D9488" />
        ) : (
        <DataTable
          headers={["Name", "Date", "Account", "Category", "Gross", "Expenditure", "Net"]}
          rows={visibleIncomeRecords.map((record) => {
            const netIncome = calculateNetIncome(record.grossIncome, record.capitalExpenditure);

            return [
              stripNotionTag(record.name),
              formatDate(record.date),
              accountNameById.get(record.accountId ?? "") ?? "—",
              incomeCategoryNameById.get(record.categoryId) ?? "—",
              formatMoney(record.grossIncome),
              formatMoney(record.capitalExpenditure),
              <MoneyValue key={`${record.id}-net`} value={netIncome} />,
            ];
          })}
          footerRows={[
            [
              "Total",
              "",
              "",
              "",
              formatMoney(getIncomeGrossTotal(visibleIncomeRecords)),
              formatMoney(getIncomeCapitalExpenditureTotal(visibleIncomeRecords)),
              <MoneyValue
                key="income-total-net"
                value={getIncomeNetTotal(visibleIncomeRecords)}
              />,
            ],
          ]}
          onRowClick={(rowIndex) => {
            const record = visibleIncomeRecords[rowIndex];
            if (record) {
              openIncomeModal("edit", record.name, record.id);
            }
          }}
        />
        )}
      </Panel>

      <FormModal
        deleteLabel="Soft Delete"
        modal={modal}
        editing={editing}
        saving={saving}
        error={saveError}
        subtitle="Net income updates from gross income less capital expenditure."
        onEdit={() => setEditing(true)}
        onSave={handleSaveIncome}
        onDelete={handleDeleteIncome}
        onDuplicate={handleDuplicateIncome}
        onClose={() => setModal(null)}
      >
        <div className="form-grid form-grid--single">
          <Field label="Name">
            <input
              placeholder="Income title"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={dateInput}
              onChange={(event) => setDateInput(event.target.value)}
            />
          </Field>
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
            <select value={formAccountId} onChange={(event) => setFormAccountId(event.target.value)}>
              <option value="">— None —</option>
              {nonCreditActiveAccounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Categories">
            <select value={formCategoryId} onChange={(event) => setFormCategoryId(event.target.value)}>
              <option value="">— None —</option>
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
  viewMode,
  onViewModeChange,
  selectedDate,
}: {
  viewMode: ExpenseViewMode;
  onViewModeChange: (viewMode: ExpenseViewMode) => void;
  selectedDate: string;
}) {
  const {
    activeAccounts,
    expenseCategories,
    accountNameById,
    expenseCategoryNameById,
  } = useLiveCollections();
  const expenseUnit = expenseModeToUnit(viewMode);
  const expenseRange = expenseUnit ? computeRange(expenseUnit, selectedDate) : null;
  const [descriptionInput, setDescriptionInput] = useState("");
  const [accountFilterId, setAccountFilterId] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("");
  const [pasabuyerFilter, setPasabuyerFilter] = useState("");
  const [annualView, setAnnualView] = useState<"table" | "chart">("table");
  const [groupBy, setGroupBy] = useState<AnnualGroupBy>("month");
  const isAnnual = viewMode === "Annually";
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

  const pasabuyCategory = expenseCategories.find((c) => /pasabuy/i.test(c.name));
  const selectedFormAccount = activeAccounts.find((account) => account.id === formAccountId);
  const accountType = selectedFormAccount?.type ?? "Cash";
  const categoryName = expenseCategoryNameById.get(formCategoryId) ?? "";
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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { state: expensesState, refetch, applyLocal } = useExpenses({
    rangeStart: expenseRange?.start,
    rangeEnd: expenseRange?.end,
    accountId: accountFilterId || undefined,
    categoryId: isSpecificExpenseCategoryFilter(expenseCategoryFilter)
      ? expenseCategoryFilter
      : undefined,
    paymentStatus: undefined,
    pasabuyer: pasabuyerFilter || undefined,
    expenseViewMode: viewMode,
  });
  const { invalidateExpenseFamily } = useFinanceInvalidation();
  useEffect(() => {
    const handler = () => {
      void refetch();
    };
    window.addEventListener(DATA_CHANGED_EVENT, handler);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handler);
  }, [refetch]);
  const isLoading = expensesState.status === "loading";
  const allExpenseRecords: ExpenseRecord[] =
    expensesState.status === "success" ? expensesState.data : [];
  const visibleExpenseRecords: ExpenseRecord[] = allExpenseRecords.filter(
    (record) => {
      if (record.description?.includes("[Deleted:")) return false;
      if (
        expenseCategoryFilter === expenseCategoryFilterWithoutPasabuy &&
        pasabuyCategory &&
        record.categoryId === pasabuyCategory.id
      ) {
        return false;
      }
      return true;
    },
  );
  const annualExpenseGroups = buildAnnualGroups(
    visibleExpenseRecords.map((r) => ({
      dateIso: r.purchaseDate,
      accountId: r.accountId,
      categoryId: r.categoryId,
      value: r.amount + (r.interest ?? 0),
    })),
    groupBy,
    accountNameById,
    expenseCategoryNameById,
  );

  // Derived credit/installment figures per record, mirroring the modal's math,
  // for the detailed CC Transactions and Installments table columns.
  const accountById = new Map(activeAccounts.map((a) => [a.id, a]));
  function deriveExpenseComputed(record: ExpenseRecord) {
    const gross = calculateGrossPrice(record.amount, record.interest ?? 0);
    const installment = calculateInstallmentAmount({
      grossPrice: gross,
      paymentStatus: record.paymentStatus,
      periodCount: record.periodCount,
    });
    const paid = calculatePaidAmount({
      grossPrice: gross,
      paymentStatus: record.paymentStatus,
      installmentAmount: installment,
      paidPeriod: record.paidPeriod,
    });
    const remaining = calculateRemainingBalance(gross, paid);
    const account = accountById.get(record.accountId ?? "");
    const expected = calculateExpectedPaymentDate({
      purchaseDate: record.purchaseDate,
      billingDay: account?.billingDay ?? null,
      dueDay: account?.dueDay ?? null,
    });
    return { gross, installment, paid, remaining, expected };
  }

  // Auto-update [YYMMDDx] tag when purchase date changes (new or edit mode).
  useEffect(() => {
    if (modal?.mode !== "new" && modal?.mode !== "edit") return;
    const yyymmdd = toYYMMDD(purchaseDateInput);
    if (!yyymmdd) return;
    setDescriptionInput((prev) => applyNotionTag(prev, yyymmdd));
  }, [purchaseDateInput, modal?.mode]);

  function openExpenseModal(mode: "new" | "edit", title: string, recordId?: string) {
    const record =
      recordId != null
        ? visibleExpenseRecords.find((r) => r.id === recordId)
        : undefined;
    const nextCategoryId =
      record?.categoryId ??
      (viewMode === "Unpaid Pasabuy" ? pasabuyCategory?.id : undefined) ??
      (isSpecificExpenseCategoryFilter(expenseCategoryFilter) ? expenseCategoryFilter : "");

    setDescriptionInput(record?.description ?? "");
    setFormAccountId(record?.accountId ?? accountFilterId);
    setFormCategoryId(nextCategoryId);
    setPurchaseDateInput(record?.purchaseDate ?? "");
    setDatePaidInput(record?.datePaid ?? "");
    setExpenseAmountInput(record?.amount?.toString() ?? "");
    setInterestInput(record?.interest?.toString() ?? "");
    setPaymentStatus(record?.paymentStatus ?? "");
    setPaymentFrequency(record?.paymentFrequency ?? "");
    setPeriodCountInput(record?.periodCount?.toString() ?? "");
    setPaidPeriodInput(record?.paidPeriod?.toString() ?? "");
    setPasabuyer(record?.pasabuyer ?? "");
    setPasabuyStatus(record?.pasabuyStatus ?? "");
    setPasabuyDateOfPaymentInput(record?.pasabuyDateOfPayment ?? "");
    setPasabuyPaidPeriodInput(record?.pasabuyPaidPeriod?.toString() ?? "");
    setPasabuyAccountReceiverId(record?.pasabuyAccountReceiverId ?? "");
    setEditingId(record?.id ?? null);
    setEditing(mode === "new");
    setSaveError(null);
    setModal({ mode, title });
  }

  async function handleSaveExpense() {
    if (!descriptionInput.trim()) {
      setSaveError("Description is required.");
      return;
    }
    const payload: Record<string, unknown> = {
      description: descriptionInput.trim(),
      purchaseDate: purchaseDateInput,
      datePaid: datePaidInput || null,
      amount: parseNumberInput(expenseAmountInput),
      interest: parseNumberInput(interestInput),
      accountId: formAccountId,
      categoryId: formCategoryId,
      paymentStatus: paymentStatus || "Unpaid",
      paymentFrequency: paymentFrequency || null,
      periodCount: parseOptionalNumberInput(periodCountInput),
      paidPeriod: parseOptionalNumberInput(paidPeriodInput),
      pasabuyer: pasabuyer || null,
      pasabuyStatus: pasabuyStatus || null,
      pasabuyDateOfPayment: pasabuyDateOfPaymentInput || null,
      pasabuyPaidPeriod: parseOptionalNumberInput(pasabuyPaidPeriodInput),
      pasabuyAccountReceiverId: pasabuyAccountReceiverId || null,
    };
    setSaving(true);
    setSaveError(null);
    const res =
      modal?.mode === "edit" && editingId
        ? await expensesApi.update(editingId, payload)
        : await expensesApi.create(payload);
    setSaving(false);
    if (!res.success) {
      setSaveError(res.error.message || "Failed to save to Notion.");
      return;
    }
    setModal(null);
    // Optimistic: splice the returned record into the visible list immediately,
    // then invalidate the expense family so this list AND cross-section views
    // (Dashboard, Monthly Monitoring) reconcile from the server.
    const saved = res.data;
    applyLocal((rows) => {
      const idx = rows.findIndex((r) => r.id === saved.id);
      if (idx === -1) return [saved, ...rows];
      const next = rows.slice();
      next[idx] = saved;
      return next;
    });
    invalidateExpenseFamily();
  }

  function handleDuplicateExpense() {
    // Keep the loaded field values but detach from the source record so Save
    // creates a fresh expense instead of updating the original.
    setEditingId(null);
    setEditing(true);
    setSaveError(null);
    setModal({ mode: "new", title: "New Expense (Copy)" });
  }

  async function handleDeleteExpense() {
    if (!editingId) return;
    if (!window.confirm("Soft-delete this expense in Notion?")) return;
    const deletedId = editingId;
    setSaving(true);
    const res = await expensesApi.delete(deletedId);
    setSaving(false);
    if (!res.success) {
      setSaveError(res.error.message || "Failed to delete.");
      return;
    }
    setModal(null);
    // Optimistic: drop the row immediately, then invalidate the expense family
    // so this list and cross-section views reconcile.
    applyLocal((rows) => rows.filter((r) => r.id !== deletedId));
    invalidateExpenseFamily();
  }

  function handleExpenseViewModeChange(nextViewMode: ExpenseViewMode) {
    if (nextViewMode === "Unpaid Pasabuy") {
      setExpenseCategoryFilter("");
    }

    onViewModeChange(nextViewMode);
  }

  // Publish a printable receipt of the current view for the floating button.
  // The "Amount" column is remapped per view per the receipt spec.
  const { setReceipt } = useFabRegister();
  const receiptContext = useMemo<ReceiptContext>(() => {
    const amountHeader =
      viewMode === "Installments" ? "Installment Amount" : "Amount";
    const receiptValue = (record: ExpenseRecord): number => {
      if (viewMode === "Installments") {
        return deriveExpenseComputed(record).installment ?? 0;
      }
      if (viewMode === "Unpaid CC") {
        return deriveExpenseComputed(record).remaining;
      }
      if (viewMode === "Unpaid Pasabuy") {
        return record.pasabuyBalance ?? 0;
      }
      return record.amount;
    };
    const rows: ReceiptRow[] = visibleExpenseRecords.map((record) => ({
      date: formatDate(record.purchaseDate),
      description: stripNotionTag(record.description),
      amount: formatMoney(receiptValue(record)),
    }));
    const total = visibleExpenseRecords.reduce(
      (sum, record) => sum + receiptValue(record),
      0,
    );
    return {
      viewTitle: `${viewMode} Expenses`,
      periodLabel: getMonthLabel(anchorMonth(selectedDate)),
      amountHeader,
      rows,
      total: formatMoney(total),
    };
    // deriveExpenseComputed is a stable closure over the same render inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedDate, visibleExpenseRecords]);

  useEffect(() => {
    setReceipt(receiptContext);
    return () => setReceipt(null);
  }, [receiptContext, setReceipt]);

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
                placeholder="All Categories"
                placeholderDisabled={false}
                value={expenseCategoryFilter}
                onChange={setExpenseCategoryFilter}
              >
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

      <Panel title={`${viewMode} Expenses`}>
        {isLoading && <LoadingBlock label="Querying Notion…" />}
        {isAnnual && annualView === "chart" ? (
          <AnnualBarChart data={annualExpenseGroups} color="#E11D48" />
        ) : viewMode === "Unpaid Pasabuy" ? (
          <DataTable
            wide
            headers={["Date", "Name", "Balance", "Pasabuyer", "Status", "DOP", "Account Receiver"]}
            rows={visibleExpenseRecords.map((record) => [
              formatDate(record.purchaseDate),
              <span className="expense-cell--unpaid" key={`${record.id}-desc`}>
                {stripNotionTag(record.description)}
              </span>,
              <span className="expense-cell--unpaid" key={`${record.id}-bal`}>
                {formatMoney(record.pasabuyBalance)}
              </span>,
              record.pasabuyer ?? "—",
              record.pasabuyStatus ?? "—",
              record.pasabuyDateOfPayment ? formatDate(record.pasabuyDateOfPayment) : "—",
              accountNameById.get(record.pasabuyAccountReceiverId ?? "") ?? "—",
            ])}
            footerRows={[
              [
                "Total",
                "",
                formatMoney(
                  visibleExpenseRecords.reduce((sum, r) => sum + (r.pasabuyBalance ?? 0), 0),
                ),
                "",
                "",
                "",
                "",
              ],
            ]}
            onRowClick={(rowIndex) => {
              const record = visibleExpenseRecords[rowIndex];
              if (record) {
                openExpenseModal("edit", record.description, record.id);
              }
            }}
          />
        ) : viewMode === "Unpaid CC" ? (
          <DataTable
            wide
            headers={[
              "Date",
              "Description",
              "Account",
              "Amount",
              "Category",
              "Interest",
              "Gross Amount",
              "Remaining Balance",
              "Payment Status",
              "Expected payment date",
              "Date Paid",
            ]}
            rows={visibleExpenseRecords.map((record) => {
              const c = deriveExpenseComputed(record);
              return [
                formatDate(record.purchaseDate),
                <span className="expense-cell--unpaid" key={`${record.id}-desc`}>
                  {stripNotionTag(record.description)}
                </span>,
                accountNameById.get(record.accountId ?? "") ?? "—",
                <span className="expense-cell--unpaid" key={`${record.id}-amt`}>
                  {formatMoney(record.amount)}
                </span>,
                expenseCategoryNameById.get(record.categoryId) ?? "—",
                formatMoney(record.interest ?? 0),
                formatMoney(c.gross),
                formatMoney(c.remaining),
                record.paymentStatus ?? "—",
                c.expected ? formatDate(c.expected) : "-",
                record.datePaid ? formatDate(record.datePaid) : "-",
              ];
            })}
            footerRows={[
              [
                "Total",
                "",
                "",
                formatMoney(visibleExpenseRecords.reduce((s, r) => s + r.amount, 0)),
                "",
                formatMoney(visibleExpenseRecords.reduce((s, r) => s + (r.interest ?? 0), 0)),
                formatMoney(
                  visibleExpenseRecords.reduce((s, r) => s + deriveExpenseComputed(r).gross, 0),
                ),
                formatMoney(
                  visibleExpenseRecords.reduce((s, r) => s + deriveExpenseComputed(r).remaining, 0),
                ),
                "",
                "",
                "",
              ],
            ]}
            onRowClick={(rowIndex) => {
              const record = visibleExpenseRecords[rowIndex];
              if (record) {
                openExpenseModal("edit", record.description, record.id);
              }
            }}
          />
        ) : viewMode === "Installments" ? (
          <DataTable
            wide
            headers={[
              "Date",
              "Description",
              "Account",
              "Amount",
              "Category",
              "Interest",
              "Gross Amount",
              "Period Count",
              "Installment Amount",
              "Paid Period",
              "Paid Amount",
              "Remaining Balance",
              "Payment Status",
              "Expected payment date",
              "Date Paid",
            ]}
            rows={visibleExpenseRecords.map((record) => {
              const c = deriveExpenseComputed(record);
              return [
                formatDate(record.purchaseDate),
                stripNotionTag(record.description),
                accountNameById.get(record.accountId ?? "") ?? "—",
                formatMoney(record.amount),
                expenseCategoryNameById.get(record.categoryId) ?? "—",
                formatMoney(record.interest ?? 0),
                formatMoney(c.gross),
                record.periodCount ?? "—",
                c.installment != null ? formatMoney(c.installment) : "—",
                record.paidPeriod ?? "—",
                formatMoney(c.paid),
                formatMoney(c.remaining),
                record.paymentStatus ?? "—",
                c.expected ? formatDate(c.expected) : "-",
                record.datePaid ? formatDate(record.datePaid) : "-",
              ];
            })}
            footerRows={[
              [
                "Total",
                "",
                "",
                formatMoney(visibleExpenseRecords.reduce((s, r) => s + r.amount, 0)),
                "",
                formatMoney(visibleExpenseRecords.reduce((s, r) => s + (r.interest ?? 0), 0)),
                formatMoney(
                  visibleExpenseRecords.reduce((s, r) => s + deriveExpenseComputed(r).gross, 0),
                ),
                "",
                "",
                "",
                formatMoney(
                  visibleExpenseRecords.reduce((s, r) => s + deriveExpenseComputed(r).paid, 0),
                ),
                formatMoney(
                  visibleExpenseRecords.reduce((s, r) => s + deriveExpenseComputed(r).remaining, 0),
                ),
                "",
                "",
                "",
              ],
            ]}
            onRowClick={(rowIndex) => {
              const record = visibleExpenseRecords[rowIndex];
              if (record) {
                openExpenseModal("edit", record.description, record.id);
              }
            }}
          />
        ) : (
          <DataTable
            wide
            headers={["Date", "Description", "Amount", "Account", "Category", "Date Paid"]}
            rows={visibleExpenseRecords.map((record) => {
              const isUnpaid = !record.datePaid;
              return [
                formatDate(record.purchaseDate),
                stripNotionTag(record.description),
                formatMoney(record.amount),
                accountNameById.get(record.accountId ?? "") ?? "—",
                expenseCategoryNameById.get(record.categoryId) ?? "—",
                record.datePaid ? formatDate(record.datePaid) : "-",
              ].map((cell, cellIndex) =>
                isUnpaid && (cellIndex === 1 || cellIndex === 2) ? (
                  <span className="expense-cell--unpaid" key={`cell-${record.id}-${cellIndex}`}>
                    {cell}
                  </span>
                ) : (
                  cell
                ),
              );
            })}
            footerRows={[
              [
                "Total",
                "",
                formatMoney(getExpenseTotal(visibleExpenseRecords)),
                "",
                "",
                "",
              ],
            ]}
            onRowClick={(rowIndex) => {
              const record = visibleExpenseRecords[rowIndex];
              if (record) {
                openExpenseModal("edit", record.description, record.id);
              }
            }}
          />
        )}
      </Panel>

      <FormModal
        deleteLabel="Soft Delete"
        modal={modal}
        editing={editing}
        saving={saving}
        error={saveError}
        subtitle="Context fields change from the selected account and category."
        onEdit={() => setEditing(true)}
        onSave={handleSaveExpense}
        onDelete={handleDeleteExpense}
        onDuplicate={handleDuplicateExpense}
        onClose={() => setModal(null)}
      >
        <div className="form-grid form-grid--single">
          <Field label="Purchase description">
            <input
              placeholder="Purchase description"
              value={descriptionInput}
              onChange={(event) => setDescriptionInput(event.target.value)}
            />
          </Field>
          <Field label="Purchase Date">
            <input
              type="date"
              value={purchaseDateInput}
              onChange={(event) => setPurchaseDateInput(event.target.value)}
            />
          </Field>
          <Field label="Accounts">
            <select value={formAccountId} onChange={(event) => setFormAccountId(event.target.value)}>
              <option value="">— None —</option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Categories">
            <select value={formCategoryId} onChange={(event) => setFormCategoryId(event.target.value)}>
              <option value="">— None —</option>
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
                  <option value="">— None —</option>
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
                  <option value="">— None —</option>
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
                  <option value="">— None —</option>
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
                  <option value="">— None —</option>
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
                  <option value="">— None —</option>
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
  const {
    nonCreditActiveAccounts,
    creditActiveAccounts,
    normalIncomeCategories,
    accountNameById,
    incomeCategoryNameById,
  } = useLiveCollections();
  const fixedCategory = getWorkflowFixedCategory(section);
  const label = getActiveSectionLabel(section);
  const isTransfer = section === "transfer";
  const isCreditCardPayment = section === "credit-card-payment";
  const isAlkansya = section === "alkansya";
  const isReceivables = section === "receivables";
  // Receivables have no fixed category; Alkansya defaults to Savings but the
  // user may change it to move the record out of the bucket into normal Income.
  const categoryEditable = isReceivables || isAlkansya;
  const savingsCategoryId =
    normalIncomeCategories.find((c) => c.source.toLowerCase() === "savings")?.id ?? "";
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
  const [workflowNameInput, setWorkflowNameInput] = useState("");
  const [workflowDateInput, setWorkflowDateInput] = useState("");
  const [receivingAccountId, setReceivingAccountId] = useState("");
  const [transactedAccountId, setTransactedAccountId] = useState("");
  const [workflowCategoryIdInput, setWorkflowCategoryIdInput] = useState("");
  const [workflowAmountInput, setWorkflowAmountInput] = useState("");
  const [workflowCapitalExpenditureInput, setWorkflowCapitalExpenditureInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const workflowNetIncome = calculateNetIncome(
    parseNumberInput(workflowAmountInput),
    parseNumberInput(workflowCapitalExpenditureInput),
  );

  // Auto-update [YYMMDD] tag when date changes (new or edit mode).
  useEffect(() => {
    if (modal?.mode !== "new" && modal?.mode !== "edit") return;
    const yyymmdd = toYYMMDD(workflowDateInput);
    if (!yyymmdd) return;
    setWorkflowNameInput((prev) => applyIncomeTag(prev, yyymmdd));
  }, [workflowDateInput, modal?.mode]);

  // Each workflow is the Incomes data source filtered server-side by its fixed
  // category (transfer→Transfer, credit-card-payment→Credit Card Payment,
  // alkansya→Savings) or, for receivables, by an empty receiving account.
  // Alkansya and Receivables are month-independent buckets — they show every
  // matching record so items can be triaged and updated later, so no month is
  // passed for them.
  const monthScoped = section === "transfer" || section === "credit-card-payment";
  const { state: workflowState, refetch, applyLocal } = useWorkflowRecords(section, {
    month: monthScoped ? selectedMonth : undefined,
  });
  // Workflows are income-backed views, so they share the income invalidation.
  const { invalidateIncomeFamily } = useFinanceInvalidation();
  const isLoading = workflowState.status === "loading";
  const workflowIncomes: IncomeRecord[] = (
    workflowState.status === "success" ? workflowState.data : []
  ).filter((r) => !r.name?.includes("[Deleted:"));
  const workflowApi =
    section === "transfer"
      ? transfersApi
      : section === "credit-card-payment"
        ? creditCardPaymentsApi
        : section === "alkansya"
          ? alkansyaApi
          : receivablesApi;
  // Transfer has its own column layout (source + destination account and a
  // computed "Transferred Amount" = Amount × -1); the other workflows share a
  // simpler Name/Date/Account/Category/Amount table.
  const workflowHeaders = isTransfer
    ? ["Date", "Name", "Source Account", "Amount", "Transfer Account", "Transferred Amount"]
    : isCreditCardPayment
      ? ["Date", "Name", "CC Account", "Amount", "Payer Account"]
      : ["Name", "Date", sourceAccountLabel, "Category", "Amount"];
  const workflowRows = workflowIncomes.map((record) => {
    if (isTransfer) {
      return [
        formatDate(record.date),
        stripNotionTag(record.name),
        accountNameById.get(record.accountId ?? "") ?? "—",
        <MoneyValue key={`${record.id}-amount`} value={record.grossIncome} />,
        accountNameById.get(record.transactedAccountId ?? "") ?? "—",
        <MoneyValue key={`${record.id}-transferred`} value={-record.grossIncome} />,
      ];
    }
    if (isCreditCardPayment) {
      return [
        formatDate(record.date),
        stripNotionTag(record.name),
        accountNameById.get(record.accountId ?? "") ?? "—",
        <MoneyValue key={`${record.id}-amount`} value={record.grossIncome} />,
        accountNameById.get(record.transactedAccountId ?? "") ?? "—",
      ];
    }
    return [
      stripNotionTag(record.name),
      formatDate(record.date),
      accountNameById.get(record.accountId ?? "") ?? "—",
      fixedCategory ?? incomeCategoryNameById.get(record.categoryId) ?? "—",
      formatMoney(record.grossIncome),
    ];
  });

  function openWorkflowModal(mode: "new" | "edit", title: string, recordId?: string) {
    const record =
      recordId != null
        ? workflowIncomes.find((r) => r.id === recordId)
        : undefined;
    setWorkflowNameInput(record?.name ?? "");
    setWorkflowDateInput(record?.date ?? "");
    setReceivingAccountId(record?.accountId ?? "");
    setTransactedAccountId(record?.transactedAccountId ?? "");
    // New Alkansya records default to the Savings category (editable).
    setWorkflowCategoryIdInput(
      record?.categoryId ?? (isAlkansya ? savingsCategoryId : ""),
    );
    setWorkflowAmountInput(record?.grossIncome?.toString() ?? "");
    setWorkflowCapitalExpenditureInput(
      record?.capitalExpenditure?.toString() ?? "",
    );
    setEditingId(record?.id ?? null);
    setEditing(mode === "new");
    setSaveError(null);
    setModal({ mode, title });
  }

  async function handleSaveWorkflow() {
    if (!workflowNameInput.trim() || (!isReceivables && !workflowDateInput) || (!isReceivables && !isTransfer && !isCreditCardPayment && !receivingAccountId)) {
      setSaveError("Name is required.");
      return;
    }
    const payload: Record<string, unknown> = {
      name: workflowNameInput.trim(),
      date: workflowDateInput,
      grossIncome: parseNumberInput(workflowAmountInput),
      capitalExpenditure: parseNumberInput(workflowCapitalExpenditureInput),
      accountId: receivingAccountId,
    };
    // Transfer & CC Payment carry a transacted/payer account.
    if (secondaryAccountLabel) {
      payload.transactedAccountId = transactedAccountId || null;
    }
    // Receivables and Alkansya let the user choose/change the income category
    // (Alkansya defaults to Savings). Transfer & CC Payment stay locked to
    // their fixed category server-side (must NOT send categoryId).
    if (categoryEditable) {
      payload.categoryId = workflowCategoryIdInput;
    }
    setSaving(true);
    setSaveError(null);
    const res =
      modal?.mode === "edit" && editingId
        ? await workflowApi.update(editingId, payload)
        : await workflowApi.create(payload);
    setSaving(false);
    if (!res.success) {
      setSaveError(res.error.message || "Failed to save to Notion.");
      return;
    }
    setModal(null);
    // Optimistic: splice the returned record into the visible list immediately,
    // then invalidate the income family (workflows are income-backed) so this
    // list AND cross-section views reconcile from the server.
    const saved = res.data;
    applyLocal((rows) => {
      const idx = rows.findIndex((r) => r.id === saved.id);
      if (idx === -1) return [saved, ...rows];
      const next = rows.slice();
      next[idx] = saved;
      return next;
    });
    invalidateIncomeFamily();
  }

  function handleDuplicateWorkflow() {
    // Keep the loaded field values but detach from the source record so Save
    // creates a fresh record instead of updating the original.
    setEditingId(null);
    setEditing(true);
    setSaveError(null);
    setModal({ mode: "new", title: `New ${label} Record (Copy)` });
  }

  async function handleDeleteWorkflow() {
    if (!editingId) return;
    if (!window.confirm(`Soft-delete this ${label} record in Notion?`)) return;
    const deletedId = editingId;
    setSaving(true);
    const res = await workflowApi.delete(deletedId);
    setSaving(false);
    if (!res.success) {
      setSaveError(res.error.message || "Failed to delete.");
      return;
    }
    setModal(null);
    // Optimistic: drop the row immediately, then invalidate the income family
    // (workflows are income-backed) so this list and cross-section views reconcile.
    applyLocal((rows) => rows.filter((r) => r.id !== deletedId));
    invalidateIncomeFamily();
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
        {isLoading && <LoadingBlock label="Querying Notion…" />}
        {workflowRows.length ? (
          <DataTable
            headers={workflowHeaders}
            rows={workflowRows}
            onRowClick={(rowIndex) => {
              const record = workflowIncomes[rowIndex];
              if (record) {
                openWorkflowModal("edit", record.name, record.id);
              }
            }}
          />
        ) : (
          <EmptyState
            title={monthScoped ? `No ${label.toLowerCase()} records this month` : `No ${label.toLowerCase()} records`}
            detail={
              isReceivables
                ? "Receivables are income records that do not yet have a receiving account."
                : isAlkansya
                  ? "Alkansya holds income records in the Savings category."
                  : `No ${label} entries were found for ${getMonthLabel(selectedMonth)}.`
            }
          />
        )}
      </Panel>

      <FormModal
        deleteLabel="Soft Delete"
        modal={modal}
        editing={editing}
        saving={saving}
        error={saveError}
        subtitle={`${label} uses the same income-backed write path with workflow-only fields exposed.`}
        onEdit={() => setEditing(true)}
        onSave={handleSaveWorkflow}
        onDelete={handleDeleteWorkflow}
        onDuplicate={handleDuplicateWorkflow}
        onClose={() => setModal(null)}
      >
        <div className="form-grid form-grid--single">
          <Field label="Name">
            <input
              placeholder={`${label} title`}
              value={workflowNameInput}
              onChange={(event) => setWorkflowNameInput(event.target.value)}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={workflowDateInput}
              onChange={(event) => setWorkflowDateInput(event.target.value)}
            />
          </Field>
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
              <option value="">— None —</option>
              {sourceAccountOptions.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Field>
          {secondaryAccountLabel && (
            <Field label={secondaryAccountLabel}>
              <select value={transactedAccountId} onChange={(event) => setTransactedAccountId(event.target.value)}>
                <option value="">— None —</option>
                {nonCreditActiveAccounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </Field>
          )}
          {!categoryEditable && fixedCategory ? (
            <ComputedField label="Categories" value={fixedCategory} />
          ) : (
            <Field label="Categories">
              <select value={workflowCategoryIdInput} onChange={(event) => setWorkflowCategoryIdInput(event.target.value)}>
                <option value="">— None —</option>
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
  const { state: syncStatusState } = useSyncStatus();

  // Use API sync status when available, fall back to parent props
  const apiStatus =
    syncStatusState.status === "success" ? syncStatusState.data : null;

  const displayLastSync =
    apiStatus?.lastSyncAt?.replace("T", " ").slice(0, 16) ?? lastSync;
  const displayPending =
    apiStatus?.pendingOperations ?? pendingOperations;
  const displayFailed = apiStatus?.failedOperations ?? 1;

  return (
    <div className="page-stack">
      <section className="metric-grid">
        <MetricCard title="Last Successful Sync" value={displayLastSync.split(" ")[1] || "-"} detail={displayLastSync.split(" ")[0] || "-"} icon={RefreshCw} tone="blue" />
        <MetricCard title="Pending Operations" value={`${displayPending}`} detail="Queued changes" icon={ClipboardCheck} tone="amber" />
        <MetricCard title="Failed Operations" value={`${displayFailed}`} detail="Needs review" icon={AlertTriangle} tone="rose" />
        <MetricCard title="Schema Health" value={schemaHealth === "warning" ? "Review" : schemaHealth === "verified" ? "Verified" : "Unchecked"} detail="/api/v1/system/schema-status" icon={Database} tone="green" />
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
      <Panel title="Activity Log" action={<Badge tone="neutral">0 entries</Badge>}>
        <div className="activity-list">
          {([] as SyncLogEntry[]).map((entry) => (
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

const KNOWN_DB_ID_KEYS = [
  { key: "accounts", label: "Accounts" },
  { key: "incomeCategories", label: "Income Portfolio" },
  { key: "incomes", label: "Incomes" },
  { key: "expenseCategories", label: "Expense Categories" },
  { key: "expenses", label: "Expenses" },
  { key: "monthlyMonitoring", label: "Monthly Monitoring" },
] as const;

type SettingsModalKind = "notion" | "email" | "password" | "delete" | "theme" | null;

function SettingsPage({
  schemaHealth,
  onSchemaVerify,
  showFab,
  onShowFabChange,
}: {
  schemaHealth: SchemaHealth;
  onSchemaVerify: () => void;
  showFab: boolean;
  onShowFabChange: (next: boolean) => void;
}) {
  const { user, loading, logout } = useAuth();
  const [modal, setModal] = useState<SettingsModalKind>(null);
  const { mode, primaryColor, secondaryColor, setMode, setPrimaryColor, setSecondaryColor } = useTheme();

  return (
    <div className="page-stack">
      <Panel title="Interface">
        <div className="settings-row">
          <div>
            <p className="settings-toggle__title">Quick-action button</p>
            <p className="settings-toggle__hint">
              Show a floating button for adding income/expense and printing
              receipts or monthly insights.
            </p>
          </div>
          <label
            className={cx("switch", showFab && "switch--on")}
            aria-label="Toggle quick-action button"
          >
            <input
              type="checkbox"
              checked={showFab}
              onChange={(event) => onShowFabChange(event.target.checked)}
            />
            <span className="switch__track"><span className="switch__thumb" /></span>
          </label>
        </div>
      </Panel>
      <Panel title="Theme">
        <div className="settings-row">
          <div>
            <p className="settings-toggle__title">Appearance &amp; Colors</p>
            <p className="settings-toggle__hint">
              Click here to{" "}
              <button
                type="button"
                className="settings-inline-link"
                onClick={() => setModal("theme")}
              >
                customize
              </button>{" "}
              your appearance settings.
            </p>
          </div>
          <button
            type="button"
            className="button"
            onClick={() => setModal("theme")}
          >
            <Palette size={16} />
            Customize
          </button>
        </div>
      </Panel>
      <section className="two-column">
        <Panel
          title="Account"
          action={
            user
              ? <Badge tone="green">{user.email}</Badge>
              : <Badge tone="neutral">Not signed in</Badge>
          }
        >
          {loading ? (
            <p>Loading...</p>
          ) : user ? (
            <div className="form-grid form-grid--single">
              <Field label="Name"><input value={user.name} readOnly /></Field>
              <Field label="Email"><input value={user.email} readOnly /></Field>
              <div className="settings-actions">
                <button type="button" className="button" onClick={() => setModal("email")}>
                  <Mail size={16} />
                  Change Email
                </button>
                <button type="button" className="button" onClick={() => setModal("password")}>
                  <KeyRound size={16} />
                  Change Password
                </button>
                <button type="button" className="button" onClick={logout}>
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-preview">
              <Link href="/login" className="button button--primary">
                <LockKeyhole size={16} />
                Sign In
              </Link>
              <Link href="/register" className="button">
                <ShieldCheck size={16} />
                Create Account
              </Link>
            </div>
          )}
        </Panel>
        <Panel title="Schema" action={<StatusPill syncState="idle" schemaHealth={schemaHealth} />}>
          <div className="form-grid form-grid--single">
            <Field label="Backend API Base Path">
              <input value="/api/v1" readOnly />
            </Field>
            <ComputedField label="Token Storage" value="Backend only (AES-256-GCM encrypted)" />
            <ComputedField label="Database Mapping" value="Per-user Notion configuration" />
            <button type="button" className="button button--primary" onClick={onSchemaVerify}>
              <Database size={16} />
              Verify Schema
            </button>
          </div>
        </Panel>
      </section>

      {user && (
        <Panel title="Notion Configuration">
          <div className="settings-row">
            <p>Your Notion integration token and database IDs are stored encrypted on the backend.</p>
            <button type="button" className="button button--primary" onClick={() => setModal("notion")}>
              <Database size={16} />
              Manage Configuration
            </button>
          </div>
        </Panel>
      )}

      {user && (
        <Panel title="Danger Zone">
          <div className="settings-row settings-row--danger">
            <p>Permanently delete your account and all associated data. This cannot be undone.</p>
            <button type="button" className="button button--danger" onClick={() => setModal("delete")}>
              <Trash2 size={16} />
              Delete Account
            </button>
          </div>
        </Panel>
      )}

      {modal === "notion" && <NotionConfigModal onClose={() => setModal(null)} />}
      {modal === "email" && <ChangeEmailModal onClose={() => setModal(null)} />}
      {modal === "password" && <ChangePasswordModal onClose={() => setModal(null)} />}
      {modal === "delete" && <DeleteAccountModal onClose={() => setModal(null)} />}
      {modal === "theme" && <ThemeCustomizeModal onClose={() => setModal(null)} />}
    </div>
  );
}

function ThemeCustomizeModal({ onClose }: { onClose: () => void }) {
  const { mode, primaryColor, secondaryColor, setMode, setPrimaryColor, setSecondaryColor } =
    useTheme();

  return (
    <SettingsModal
      title="Customize Theme"
      subtitle="Personalize your appearance and accent colors."
      onClose={onClose}
      footer={
        <button type="button" className="button button--primary" onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="theme-modal-grid">
        <div className="theme-modal-section">
          <p className="settings-toggle__title">Appearance</p>
          <p className="settings-toggle__hint">
            Choose light, dark, or follow your system setting.
          </p>
          <select
            className="settings-select"
            value={mode}
            onChange={(e) => setMode(e.target.value as "light" | "dark" | "system")}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
        <div className="theme-modal-section">
          <p className="settings-toggle__title">Colors</p>
          <p className="settings-toggle__hint">
            Customize accent colors applied globally.
          </p>
          <div className="theme-color-pickers">
            <div className="theme-color-picker-group">
              <span className="settings-color-label">Primary</span>
              <ColorPicker value={primaryColor} onChange={setPrimaryColor} />
            </div>
            <div className="theme-color-picker-group">
              <span className="settings-color-label">Secondary</span>
              <ColorPicker value={secondaryColor} onChange={setSecondaryColor} />
            </div>
          </div>
        </div>
      </div>
    </SettingsModal>
  );
}

function SettingsModal({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-panel__header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <div className="modal-panel__body">{children}</div>
        <div className="modal-panel__footer">{footer}</div>
      </section>
    </div>
  );
}

function NotionConfigModal({ onClose }: { onClose: () => void }) {
  const [notionToken, setNotionToken] = useState("");
  const [dbIds, setDbIds] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    userNotionConfigApi.get().then((res) => {
      if (cancelled || !res.success || !res.data.configured) return;
      startTransition(() => {
        setNotionToken(res.data.tokenConfigured ? "stored" : "");
        setDbIds(res.data.dbIds);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function setDbId(key: string, value: string) {
    setDbIds((prev) => ({ ...prev, [key]: value.trim() }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setNotice(null);
    const token = notionToken === "stored" ? undefined : notionToken;
    const res = await userNotionConfigApi.save({ token: token || undefined, dbIds });
    setSaving(false);
    if (res.success) {
      setNotice("Configuration saved.");
      setNotionToken(token ? "stored" : notionToken === "stored" ? "stored" : "");
    } else {
      setError(res.error.message);
    }
  }

  async function handleRemove() {
    if (!window.confirm("Remove your Notion configuration?")) return;
    setSaving(true);
    setError(null);
    const res = await userNotionConfigApi.remove();
    setSaving(false);
    if (res.success) {
      setNotionToken("");
      setDbIds({});
      setNotice("Configuration removed.");
    } else {
      setError(res.error.message);
    }
  }

  return (
    <SettingsModal
      title="Notion Configuration"
      subtitle="View, edit, or remove your Notion token and database IDs."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="button" onClick={handleRemove} disabled={saving}>
            <Trash2 size={16} />
            Remove
          </button>
          <button type="button" className="button button--primary" onClick={handleSave} disabled={saving}>
            <Save size={16} />
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <div className="form-grid form-grid--single">
        {error && <div className="auth-form__error">{error}</div>}
        {notice && <div className="auth-form__notice">{notice}</div>}
        <Field label="Notion Integration Token">
          <input
            type="password"
            value={notionToken}
            onChange={(e) => setNotionToken(e.target.value)}
            placeholder={notionToken === "stored" ? "Stored — enter new to replace" : "ntn_…"}
            autoComplete="off"
          />
        </Field>
        <FormSectionDivider title="Database IDs" />
        {KNOWN_DB_ID_KEYS.map(({ key, label }) => (
          <Field key={key} label={`${label} Database ID`}>
            <input
              value={dbIds[key] ?? ""}
              onChange={(e) => setDbId(key, e.target.value)}
              placeholder={`${key} database ID`}
              spellCheck={false}
              autoComplete="off"
            />
          </Field>
        ))}
      </div>
    </SettingsModal>
  );
}

function ChangeEmailModal({ onClose }: { onClose: () => void }) {
  const { user, changeEmail } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!newEmail.trim() || !currentPassword) {
      setError("New email and current password are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await changeEmail(currentPassword, newEmail.trim());
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.error ?? "Failed to change email.");
  }

  return (
    <SettingsModal
      title="Change Email"
      subtitle={`Current: ${user?.email ?? ""}`}
      onClose={onClose}
      footer={
        done ? (
          <button type="button" className="button button--primary" onClick={onClose}>Done</button>
        ) : (
          <button type="button" className="button button--primary" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Update Email"}
          </button>
        )
      }
    >
      <div className="form-grid form-grid--single">
        {error && <div className="auth-form__error">{error}</div>}
        {done ? (
          <div className="auth-form__notice">Email updated to {user?.email}.</div>
        ) : (
          <>
            <Field label="New Email">
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="off" />
            </Field>
            <Field label="Current Password">
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            </Field>
          </>
        )}
      </div>
    </SettingsModal>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!currentPassword || !newPassword) {
      setError("Current and new password are required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await changePassword(currentPassword, newPassword);
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.error ?? "Failed to change password.");
  }

  return (
    <SettingsModal
      title="Change Password"
      onClose={onClose}
      footer={
        done ? (
          <button type="button" className="button button--primary" onClick={onClose}>Done</button>
        ) : (
          <button type="button" className="button button--primary" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Update Password"}
          </button>
        )
      }
    >
      <div className="form-grid form-grid--single">
        {error && <div className="auth-form__error">{error}</div>}
        {done ? (
          <div className="auth-form__notice">Your password has been updated.</div>
        ) : (
          <>
            <Field label="Current Password">
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            </Field>
            <Field label="New Password">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" minLength={6} />
            </Field>
            <Field label="Confirm New Password">
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </Field>
          </>
        )}
      </div>
    </SettingsModal>
  );
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { deleteAccount } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!currentPassword) {
      setError("Enter your password to confirm.");
      return;
    }
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    const res = await deleteAccount(currentPassword);
    setBusy(false);
    if (res.ok) {
      router.push("/login");
    } else {
      setError(res.error ?? "Failed to delete account.");
    }
  }

  return (
    <SettingsModal
      title="Delete Account"
      subtitle="This permanently deletes your account and Notion configuration."
      onClose={onClose}
      footer={
        <button type="button" className="button button--danger" onClick={submit} disabled={busy}>
          <Trash2 size={16} />
          {busy ? "Deleting…" : "Delete My Account"}
        </button>
      }
    >
      <div className="form-grid form-grid--single">
        {error && <div className="auth-form__error">{error}</div>}
        <div className="auth-form__error">
          Warning: this action is irreversible. All your data will be removed.
        </div>
        <Field label="Confirm Password">
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
        </Field>
      </div>
    </SettingsModal>
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

function AccountDetailModal({
  account,
  onClose,
}: {
  account: Account;
  onClose: () => void;
}) {
  const isCredit = isCreditLikeAccountType(account.type);
  const [showQr, setShowQr] = useState(false);

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
        aria-labelledby="account-modal-title"
        aria-modal="true"
        className="modal-panel modal-panel--account"
        role="dialog"
      >
        <div className="modal-panel__header">
          <div className="account-modal__title-row">
            {account.icon && isImageUrl(account.icon) ? (
              <Image src={account.icon} alt="" width={40} height={40} className="account-icon account-icon--large" unoptimized />
            ) : account.icon ? (
              <span className="account-icon account-icon--emoji account-icon--large" aria-hidden="true">
                {account.icon}
              </span>
            ) : (
              <span className="account-icon account-icon--fallback account-icon--large">
                <AccountTypeIcon type={account.type} size={22} />
              </span>
            )}
            <div>
              <h2 id="account-modal-title">{account.name}</h2>
              <p>{account.information}</p>
            </div>
          </div>
          <div className="account-modal__header-actions">
            {showQr && account.qrCode && (
              <a
                href={account.qrCode}
                download={`${account.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`}
                className="icon-button"
                aria-label="Download QR code"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download size={17} />
              </a>
            )}
            {account.qrCode && (
              <button
                type="button"
                className="icon-button"
                aria-label={showQr ? "Show account details" : "Show QR code"}
                onClick={() => setShowQr((prev) => !prev)}
              >
                {showQr ? <ArrowLeft size={17} /> : <QrCode size={17} />}
              </button>
            )}
            <button type="button" className="icon-button" aria-label="Close modal" onClick={onClose}>
              <X size={17} />
            </button>
          </div>
        </div>
        {showQr && account.qrCode ? (
          <div className="account-qr">
            <img src={account.qrCode} alt={`${account.name} QR code`} />
          </div>
        ) : (
          <div className="modal-panel__body">
            <div className="account-detail-grid">
              <div className="account-detail-section">
              <h3 className="account-detail-section__title">Account Info</h3>
              <div className="account-detail-fields">
                <div className="account-detail-field">
                  <span>Type</span>
                  <strong>{account.type}</strong>
                </div>
                <div className="account-detail-field">
                  <span>Status</span>
                  <strong>{account.inactive ? "Inactive" : "Active"}</strong>
                </div>

              </div>
            </div>

            <div className="account-detail-section">
              <h3 className="account-detail-section__title">Balances</h3>
              <div className="account-detail-fields">
                <div className="account-detail-field">
                  <span>Starting Balance</span>
                  <MoneyValue value={account.startingBalance} />
                </div>
                <div className="account-detail-field">
                  <span>Current Balance</span>
                  <MoneyValue value={account.currentBalance} />
                </div>
                <div className="account-detail-field">
                  <span>{isCredit ? "Total Payment Made" : "Total Cash Inflow"}</span>
                  {account.totalIncomes !== null ? (
                    <MoneyValue value={account.totalIncomes} />
                  ) : (
                    <span className="money-value">—</span>
                  )}
                </div>
                <div className="account-detail-field">
                  <span>{isCredit ? "Total Purchase Expenses" : "Total Cash Outflow"}</span>
                  {account.totalExpenses !== null ? (
                    <MoneyValue value={account.totalExpenses} />
                  ) : (
                    <span className="money-value">—</span>
                  )}
                </div>
              </div>
            </div>

            {isCredit && (
              <div className="account-detail-section">
                <h3 className="account-detail-section__title">Credit Details</h3>
                <div className="account-detail-fields">
                  {account.creditLimit !== null && (
                    <div className="account-detail-field">
                      <span>Credit Limit</span>
                      <MoneyValue value={account.creditLimit} />
                    </div>
                  )}
                  {account.availableLimit !== null && (
                    <div className="account-detail-field">
                      <span>Available Limit</span>
                      <MoneyValue value={account.availableLimit} />
                    </div>
                  )}
                  {account.creditPoints !== null && (
                    <div className="account-detail-field">
                      <span>Credit Points</span>
                      <strong>{account.creditPoints.toLocaleString()}</strong>
                    </div>
                  )}
                  {account.annualFee !== null && (
                    <div className="account-detail-field">
                      <span>Annual Fee</span>
                      <MoneyValue value={account.annualFee} />
                    </div>
                  )}
                  {account.billingDay !== null && (
                    <div className="account-detail-field">
                      <span>Billing Day</span>
                      <strong>Day {account.billingDay}</strong>
                    </div>
                  )}
                  {account.dueDay !== null && (
                    <div className="account-detail-field">
                      <span>Due Day</span>
                      <strong>Day {account.dueDay}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </section>
    </div>
  );
}

function FormModal({
  modal,
  subtitle,
  deleteLabel,
  editing,
  saving,
  error,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  onClose,
  children,
}: {
  modal: ModalState;
  subtitle: string;
  deleteLabel: string;
  /** True when inputs are active. New items start editing; edits start read-only. */
  editing: boolean;
  saving: boolean;
  error?: string | null;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  /** Turn the current record into a prefilled new-record draft. */
  onDuplicate?: () => void;
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
        if (event.target === event.currentTarget && !saving) {
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
            <p>{editing ? subtitle : "Read-only — click Edit to change and save to Notion."}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close modal" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <div className="modal-panel__body">
          {error && <div className="auth-form__error">{error}</div>}
          <fieldset className="modal-fieldset" disabled={!editing || saving}>
            {children}
          </fieldset>
        </div>
        <div className="modal-panel__footer">
          {modal.mode === "edit" && (
            <button type="button" className="button" onClick={onDelete} disabled={saving}>
              <Trash2 size={16} />
              {deleteLabel}
            </button>
          )}
          {modal.mode === "edit" && onDuplicate && (
            <button type="button" className="button" onClick={onDuplicate} disabled={saving}>
              <Copy size={16} />
              Duplicate
            </button>
          )}
          {!editing && modal.mode === "edit" ? (
            <button type="button" className="button button--primary" onClick={onEdit}>
              <Pencil size={16} />
              Edit
            </button>
          ) : (
            <button type="button" className="button button--primary" onClick={onSave} disabled={saving}>
              {saving ? (
                <RefreshCw size={16} className="spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Saving…" : "Save"}
            </button>
          )}
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

function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="loading-block" role="status" aria-live="polite">
      <RefreshCw size={16} className="spin" />
      <span>{label}</span>
    </div>
  );
}

/** Pull a comparable value out of a table cell (string, number, or element). */
function cellText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(cellText).join("");
  if (isValidElement(node)) {
    const props = node.props as { value?: unknown; children?: ReactNode };
    if (typeof props.value === "number") return String(props.value);
    return cellText(props.children);
  }
  return "";
}

function cellSortKey(node: ReactNode): { num: number | null; text: string } {
  // MoneyValue and similar carry a numeric `value` prop — sort numerically.
  if (isValidElement(node) && typeof (node.props as { value?: unknown }).value === "number") {
    return { num: (node.props as { value: number }).value, text: "" };
  }
  const text = cellText(node).trim();
  const numeric = text.replace(/[₱,\s]/g, "");
  if (numeric && /^-?\d*\.?\d+$/.test(numeric)) {
    return { num: Number(numeric), text };
  }
  // Dates like "Jul 5, 2026".
  if (/\b\d{4}\b/.test(text)) {
    const parsed = Date.parse(text);
    if (!Number.isNaN(parsed)) return { num: parsed, text };
  }
  return { num: null, text: text.toLowerCase() };
}

function DataTable({
  headers,
  rows,
  footerRows = [],
  onRowClick,
  unsortableColumns = [],
  wide = false,
}: {
  headers: string[];
  rows: ReactNode[][];
  footerRows?: ReactNode[][];
  onRowClick?: (rowIndex: number) => void;
  /** Column indices that should not be clickable/sortable (e.g. icon columns). */
  unsortableColumns?: number[];
  /** Size the table to its content and let the wrapper scroll horizontally. */
  wide?: boolean;
}) {
  const [sort, setSort] = useState<{ col: number; dir: "asc" | "desc" } | null>(null);
  const skip = new Set(unsortableColumns);

  function toggleSort(col: number) {
    setSort((prev) => {
      if (!prev || prev.col !== col) return { col, dir: "asc" };
      if (prev.dir === "asc") return { col, dir: "desc" };
      return null; // third click restores original order
    });
  }

  // Keep original indices so row clicks still map to the right record.
  const ordered = useMemo(() => {
    const indexed = rows.map((row, index) => ({ row, index }));
    if (!sort) return indexed;
    const { col, dir } = sort;
    return [...indexed].sort((a, b) => {
      const ka = cellSortKey(a.row[col]);
      const kb = cellSortKey(b.row[col]);
      let cmp: number;
      if (ka.num !== null && kb.num !== null) cmp = ka.num - kb.num;
      else cmp = ka.text.localeCompare(kb.text);
      return dir === "asc" ? cmp : -cmp;
    });
  }, [rows, sort]);

  return (
    <div className="table-wrap">
      <table className={cx(wide && "data-table--wide")}>
        <thead>
          <tr>
            {headers.map((header, columnIndex) => {
              const sortable = !skip.has(columnIndex);
              const active = sort?.col === columnIndex;
              return (
                <th
                  key={header}
                  aria-sort={
                    active ? (sort?.dir === "asc" ? "ascending" : "descending") : "none"
                  }
                >
                  {sortable ? (
                    <button
                      type="button"
                      className={cx("th-sort", active && "th-sort--active")}
                      onClick={() => toggleSort(columnIndex)}
                    >
                      {header}
                      <span className="th-sort__icon">
                        {active ? (
                          sort?.dir === "asc" ? (
                            <ChevronUp size={13} />
                          ) : (
                            <ChevronDown size={13} />
                          )
                        ) : (
                          <ChevronsUpDown size={13} />
                        )}
                      </span>
                    </button>
                  ) : (
                    header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {ordered.map(({ row, index }) => (
            <tr
              key={`row-${index}`}
              className={cx(onRowClick && "table-row--clickable")}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={() => onRowClick?.(index)}
              onKeyDown={(event) => {
                if (!onRowClick) {
                  return;
                }

                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onRowClick(index);
                }
              }}
            >
              {row.map((cell, cellIndex) => (
                <td key={`cell-${index}-${cellIndex}`}>{cell}</td>
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

function FilterToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={cx("filter-toggle", checked && "filter-toggle--active")}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
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

function BudgetRow({ label, percent, amount }: { label: string; percent: number; amount: number }) {
  return (
    <div className="budget-row">
      <strong className="budget-row__label">{label}</strong>
      <span className="budget-row__percent">{percent}%</span>
      <span className="budget-row__amount">{formatMoney(amount)}</span>
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

// ── Floating action button ────────────────────────────────────────────

/** Broadcast so open Income/Expense lists refetch after a quick add. */
const DATA_CHANGED_EVENT = "nf:data-changed";
function emitDataChanged() {
  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
}

type FabModalKind = "income" | "expense" | "receipt" | "insight" | null;

function WorkspaceFab({
  activeSection,
  selectedDate,
}: {
  activeSection: FinanceSectionId;
  selectedDate: string;
}) {
  const { receipt, insight } = useFabExport();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<FabModalKind>(null);

  const canPrintReceipt = activeSection === "expense" && receipt !== null;
  const canShotInsight = activeSection === "monthly-monitoring" && insight !== null;

  function choose(kind: Exclude<FabModalKind, null>) {
    setOpen(false);
    setModal(kind);
  }

  return (
    <>
      <div className="fab">
        {open && (
          <div className="fab__menu" role="menu">
            <button type="button" className="fab__action" onClick={() => choose("income")}>
              <span className="fab__action-label">Add New Income</span>
              <span className="fab__action-icon fab__action-icon--income">
                <ArrowUpRight size={18} />
              </span>
            </button>
            <button type="button" className="fab__action" onClick={() => choose("expense")}>
              <span className="fab__action-label">Add New Expense</span>
              <span className="fab__action-icon fab__action-icon--expense">
                <Receipt size={18} />
              </span>
            </button>
            {canPrintReceipt && (
              <button type="button" className="fab__action" onClick={() => choose("receipt")}>
                <span className="fab__action-label">Print Receipt</span>
                <span className="fab__action-icon">
                  <Printer size={18} />
                </span>
              </button>
            )}
            {canShotInsight && (
              <button type="button" className="fab__action" onClick={() => choose("insight")}>
                <span className="fab__action-label">Monthly Insight Shot</span>
                <span className="fab__action-icon">
                  <Camera size={18} />
                </span>
              </button>
            )}
          </div>
        )}
        <button
          type="button"
          className={cx("fab__toggle", open && "fab__toggle--open")}
          aria-label={open ? "Close quick actions" : "Open quick actions"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Plus size={24} />
        </button>
      </div>

      {open && (
        <div
          className="fab__backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        />
      )}

      {modal === "income" && (
        <QuickAddIncomeModal onClose={() => setModal(null)} />
      )}
      {modal === "expense" && (
        <QuickAddExpenseModal
          selectedDate={selectedDate}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "receipt" && receipt && (
        <ReceiptModal receipt={receipt} onClose={() => setModal(null)} />
      )}
      {modal === "insight" && insight && (
        <InsightShotModal insight={insight} onClose={() => setModal(null)} />
      )}
    </>
  );
}

// ── Quick-add modals (mirror the Income/Expense page forms) ────────────
// These are intentionally self-contained so the working Income/Expense pages
// stay untouched. All money math is shared via finance-rules — only the form
// layout is duplicated here.

function QuickAddIncomeModal({ onClose }: { onClose: () => void }) {
  const { nonCreditActiveAccounts, normalIncomeCategories } = useLiveCollections();
  const { invalidateIncomeFamily } = useFinanceInvalidation();
  const [nameInput, setNameInput] = useState("");
  const [dateInput, setDateInput] = useState(() => todayIso());
  const [formAccountId, setFormAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [grossIncomeInput, setGrossIncomeInput] = useState("");
  const [capitalExpenditureInput, setCapitalExpenditureInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-update [YYMMDD] tag when date changes.
  useEffect(() => {
    const yyymmdd = toYYMMDD(dateInput);
    if (!yyymmdd) return;
    setNameInput((prev) => applyIncomeTag(prev, yyymmdd));
  }, [dateInput]);

  const calculatedNetIncome = calculateNetIncome(
    parseNumberInput(grossIncomeInput),
    parseNumberInput(capitalExpenditureInput),
  );

  async function handleSave() {
    if (!nameInput.trim() || !dateInput) {
      setSaveError("Name and date are required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const res = await incomesApi.create({
      name: nameInput.trim(),
      date: dateInput,
      grossIncome: parseNumberInput(grossIncomeInput),
      capitalExpenditure: parseNumberInput(capitalExpenditureInput),
      accountId: formAccountId,
      categoryId: formCategoryId,
    });
    setSaving(false);
    if (!res.success) {
      setSaveError(res.error.message || "Failed to save to Notion.");
      return;
    }
    emitDataChanged();
    invalidateIncomeFamily();
    onClose();
  }

  return (
    <FormModal
      deleteLabel="Soft Delete"
      modal={{ mode: "new", title: "New Income" }}
      editing
      saving={saving}
      error={saveError}
      subtitle="Net income updates from gross income less capital expenditure."
      onEdit={() => {}}
      onSave={handleSave}
      onDelete={() => {}}
      onClose={onClose}
    >
      <div className="form-grid form-grid--single">
        <Field label="Name">
          <input
            placeholder="Income title"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            value={dateInput}
            onChange={(event) => setDateInput(event.target.value)}
          />
        </Field>
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
          <select value={formAccountId} onChange={(event) => setFormAccountId(event.target.value)}>
            <option value="">— None —</option>
            {nonCreditActiveAccounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Categories">
          <select value={formCategoryId} onChange={(event) => setFormCategoryId(event.target.value)}>
            <option value="">— None —</option>
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
  );
}

function QuickAddExpenseModal({
  selectedDate,
  onClose,
}: {
  selectedDate: string;
  onClose: () => void;
}) {
  const { activeAccounts, expenseCategories, expenseCategoryNameById } =
    useLiveCollections();
  const { invalidateExpenseFamily } = useFinanceInvalidation();
  const [descriptionInput, setDescriptionInput] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [purchaseDateInput, setPurchaseDateInput] = useState(() =>
    selectedDate || todayIso(),
  );
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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-update [YYMMDDx] tag when purchase date changes.
  useEffect(() => {
    const yyymmdd = toYYMMDD(purchaseDateInput);
    if (!yyymmdd) return;
    setDescriptionInput((prev) => applyNotionTag(prev, yyymmdd));
  }, [purchaseDateInput]);

  const selectedFormAccount = activeAccounts.find((a) => a.id === formAccountId);
  const accountType = selectedFormAccount?.type ?? "Cash";
  const categoryName = expenseCategoryNameById.get(formCategoryId) ?? "";
  const sections = getExpenseConditionalSections({
    accountType,
    viewMode: "Monthly",
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

  async function handleSave() {
    if (!descriptionInput.trim()) {
      setSaveError("Description is required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const res = await expensesApi.create({
      description: descriptionInput.trim(),
      purchaseDate: purchaseDateInput,
      datePaid: datePaidInput || null,
      amount: parseNumberInput(expenseAmountInput),
      interest: parseNumberInput(interestInput),
      accountId: formAccountId,
      categoryId: formCategoryId,
      paymentStatus: paymentStatus || "Unpaid",
      paymentFrequency: paymentFrequency || null,
      periodCount: parseOptionalNumberInput(periodCountInput),
      paidPeriod: parseOptionalNumberInput(paidPeriodInput),
      pasabuyer: pasabuyer || null,
      pasabuyStatus: pasabuyStatus || null,
      pasabuyDateOfPayment: pasabuyDateOfPaymentInput || null,
      pasabuyPaidPeriod: parseOptionalNumberInput(pasabuyPaidPeriodInput),
      pasabuyAccountReceiverId: pasabuyAccountReceiverId || null,
    });
    setSaving(false);
    if (!res.success) {
      setSaveError(res.error.message || "Failed to save to Notion.");
      return;
    }
    emitDataChanged();
    invalidateExpenseFamily();
    onClose();
  }

  return (
    <FormModal
      deleteLabel="Soft Delete"
      modal={{ mode: "new", title: "New Expense" }}
      editing
      saving={saving}
      error={saveError}
      subtitle="Context fields change from the selected account and category."
      onEdit={() => {}}
      onSave={handleSave}
      onDelete={() => {}}
      onClose={onClose}
    >
      <div className="form-grid form-grid--single">
        <Field label="Purchase description">
          <input
            placeholder="Purchase description"
            value={descriptionInput}
            onChange={(event) => setDescriptionInput(event.target.value)}
          />
        </Field>
        <Field label="Purchase Date">
          <input
            type="date"
            value={purchaseDateInput}
            onChange={(event) => setPurchaseDateInput(event.target.value)}
          />
        </Field>
        <Field label="Accounts">
          <select value={formAccountId} onChange={(event) => setFormAccountId(event.target.value)}>
            <option value="">— None —</option>
            {activeAccounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Categories">
          <select value={formCategoryId} onChange={(event) => setFormCategoryId(event.target.value)}>
            <option value="">— None —</option>
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
                <option value="">— None —</option>
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
                <option value="">— None —</option>
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
                <option value="">— None —</option>
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
                <option value="">— None —</option>
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
                <option value="">— None —</option>
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
  );
}

// ── Print Receipt ─────────────────────────────────────────────────────

function ExportModalShell({
  title,
  subtitle,
  onClose,
  onPrint,
  onSaveImage,
  busy,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  onPrint: () => void;
  onSaveImage: () => void;
  busy?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal-panel modal-panel--export"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-panel__header fab-shot-hide">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <div className="modal-panel__body export-preview">{children}</div>
        <div className="modal-panel__footer fab-shot-hide">
          <button type="button" className="button" onClick={onSaveImage} disabled={busy}>
            <ImageDown size={16} />
            Save as Image
          </button>
          <button type="button" className="button button--primary" onClick={onPrint} disabled={busy}>
            <FileDown size={16} />
            Print / Save as PDF
          </button>
        </div>
      </section>
    </div>
  );
}

function ReceiptModal({
  receipt,
  onClose,
}: {
  receipt: ReceiptContext;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const surfaceRef = useRef<HTMLDivElement>(null);

  return (
    <ExportModalShell
      title="Print Receipt"
      subtitle="Export the current expense view as a receipt."
      onClose={onClose}
      onPrint={() => surfaceRef.current && printNode(surfaceRef.current)}
      onSaveImage={() =>
        surfaceRef.current && downloadNodeAsPng(surfaceRef.current, "notable-receipt")
      }
    >
      <div className="receipt" ref={surfaceRef}>
        <div className="receipt__head">
          <h1 className="receipt__brand">Notable Finance Receipt</h1>
          <p className="receipt__tagline">by {user?.name ?? user?.email ?? "Guest"}</p>
          <p className="receipt__meta">{receipt.viewTitle}</p>
          <p className="receipt__meta">{receipt.periodLabel}</p>
        </div>
        <div className="receipt__rule" />
        <table className="receipt__table">
          <colgroup>
            <col className="receipt__col-date" />
            <col className="receipt__col-desc" />
            <col className="receipt__col-amount" />
          </colgroup>
          <thead>
            <tr>
              <th>Date of Purchase</th>
              <th>Description</th>
              <th className="receipt__amount">{receipt.amountHeader}</th>
            </tr>
          </thead>
          <tbody>
            {receipt.rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="receipt__empty">No items to display.</td>
              </tr>
            ) : (
              receipt.rows.map((row, index) => (
                <tr key={`${row.date}-${index}`}>
                  <td className="receipt__date">{row.date}</td>
                  <td>{row.description}</td>
                  <td className="receipt__amount">{row.amount}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Total</td>
              <td className="receipt__amount">{receipt.total}</td>
            </tr>
          </tfoot>
        </table>
        <div className="receipt__rule" />
        <p className="receipt__disclaimer">
          This document is electronically generated and does not require a
          signature.
        </p>
      </div>
    </ExportModalShell>
  );
}

// ── Monthly Insight Shot ──────────────────────────────────────────────

function InsightShotModal({
  insight,
  onClose,
}: {
  insight: { monthLabel: string; getNode: () => HTMLElement | null };
  onClose: () => void;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [status, setStatus] = useState<"capturing" | "ready" | "error">(
    "capturing",
  );

  useEffect(() => {
    let cancelled = false;
    const node = insight.getNode();
    if (!node) {
      queueMicrotask(() => {
        if (!cancelled) setStatus("error");
      });
      return;
    }
    nodeToPngDataUrl(node)
      .then((url) => {
        if (!cancelled) {
          setSnapshot(url);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [insight]);

  return (
    <ExportModalShell
      title="Monthly Insight Shot"
      subtitle="A clean snapshot of your monthly monitoring."
      busy={status !== "ready"}
      onClose={onClose}
      onPrint={() => surfaceRef.current && printNode(surfaceRef.current)}
      onSaveImage={() =>
        surfaceRef.current &&
        downloadNodeAsPng(surfaceRef.current, `notable-insight-${insight.monthLabel}`)
      }
    >
      {status === "capturing" && <LoadingBlock label="Building snapshot…" />}
      {status === "error" && (
        <EmptyState
          title="Couldn't build the snapshot"
          detail="Open the Monthly Monitoring view and try again."
        />
      )}
      {status === "ready" && snapshot && (
        <div className="insight-shot" ref={surfaceRef}>
          <div className="insight-shot__head">
            <span className="insight-shot__brand">NOTABLE FINANCE</span>
            <span className="insight-shot__title">Monthly Monitoring</span>
            <span className="insight-shot__month">{insight.monthLabel}</span>
          </div>
          <div className="insight-shot__body">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="insight-shot__image" src={snapshot} alt="Monthly monitoring snapshot" />
          </div>
        </div>
      )}
    </ExportModalShell>
  );
}
