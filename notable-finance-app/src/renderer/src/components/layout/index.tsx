
import Link from "@/lib/router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpDown,
  Banknote,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Database,
  History,
  LayoutDashboard,
  Menu,
  PiggyBank,
  RefreshCw,
  Settings,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { financeSections } from "@/lib/finance-data";
import { cx } from "@/lib/finance-helpers";
import { DateRangeSelector, StatusPill } from "@/components/ui/date-range";
import type {
  ExpenseViewMode,
  FinanceSection,
  FinanceSectionId,
  IncomeViewMode,
  SchemaHealth,
  SyncState,
} from "@/types/finance";
import type { ViewUnit } from "@/lib/date-range";

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
  history: History,
  sync: RefreshCw,
  settings: Settings,
};

/**
 * Live count of records with unresolved sync conflicts (needs user resolution on the
 * Sync page). Seeds from sync.status() and updates on every `sync:status` broadcast.
 */
function useConflictCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    void window.api.sync.status().then((r) => {
      if (alive && r.ok) setCount(r.data.conflictCount ?? 0);
    });
    const off = window.api.on("sync:status", (payload) =>
      setCount((payload as { conflictCount?: number }).conflictCount ?? 0),
    );
    return () => {
      alive = false;
      off();
    };
  }, []);
  return count;
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
  const { user } = useAuth();
  const conflictCount = useConflictCount();
  const sectionBadges: Partial<Record<FinanceSectionId, number>> = { sync: conflictCount };
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
        <div className="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
            <rect x="16" y="24" width="992" height="976" rx="250" fill="#17181c" />
            <rect x="74" y="78" width="876" height="864" rx="196" fill="#f7f5f0" />
            <g fill="#17181c">
              <rect x="300" y="182" width="150" height="646" rx="10" />
              <rect x="300" y="182" width="392" height="156" rx="10" />
              <rect x="300" y="430" width="330" height="150" rx="10" />
            </g>
          </svg>
        </div>
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
        <NavGroup title="Core" sections={groupedSections.primary} activeSection={activeSection} onNavigate={onNavigate} sectionBadges={sectionBadges} />
        <NavGroup title="Workflows" sections={groupedSections.workflow} activeSection={activeSection} onNavigate={onNavigate} sectionBadges={sectionBadges} />
        <NavGroup title="System" sections={groupedSections.system} activeSection={activeSection} onNavigate={onNavigate} sectionBadges={sectionBadges} />
      </nav>
      <div className="sidebar-profile">
        <div className="sidebar-profile__avatar">{initials}</div>
        <div>
          <p>{user?.name ?? "Local User"}</p>
          <span>This device</span>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({
  title,
  sections,
  activeSection,
  onNavigate,
  sectionBadges,
}: {
  title: string;
  sections: FinanceSection[];
  activeSection: FinanceSectionId;
  onNavigate?: () => void;
  sectionBadges?: Partial<Record<FinanceSectionId, number>>;
}) {
  return (
    <div className="nav__group">
      <p className="nav__title">{title}</p>
      {sections.map((section) => {
        const Icon = sectionIcons[section.id];
        const badge = sectionBadges?.[section.id] ?? 0;
        return (
          <Link
            key={section.id}
            href={`/${section.id}`}
            className={cx("nav__item", activeSection === section.id && "nav__item--active")}
            onClick={onNavigate}
            title={badge > 0 ? `${badge} item${badge > 1 ? "s" : ""} to resolve` : undefined}
          >
            <Icon size={17} />
            <span>{section.shortLabel ?? section.label}</span>
            {badge > 0 && (
              <span className="nav__badge" aria-label={`${badge} to resolve`}>
                {badge}
              </span>
            )}
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
  activeSyncKind = null,
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
  activeSyncKind?: "full" | "pull" | "push" | null;
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
          <button type="button" className="button button--primary" onClick={onSync} disabled={syncState === "syncing"}>
            <RefreshCw size={12} className={activeSyncKind === "full" ? "spin" : undefined} />
            Sync
          </button>
        </div>
        <Link href="/settings" className="topbar__avatar">{initials}</Link>
      </div>
    </header>
  );
}

export { sectionIcons, Sidebar, NavGroup, TopBar };
