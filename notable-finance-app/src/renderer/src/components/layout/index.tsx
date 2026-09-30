
import Link from "@/lib/router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpDown,
  Banknote,
  Bug,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  History,
  LayoutDashboard,
  Menu,
  MessageSquare,
  PiggyBank,
  RefreshCw,
  Settings,
  WalletCards,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { financeSections } from "@/lib/finance-data";
import { cx } from "@/lib/finance-helpers";
import styles from "./index.module.css";
import { userInitials } from "@/lib/avatar";
import { useUiSettings } from "@/lib/ui-settings-context";
import { DateRangeSelector } from "@/components/ui/date-range";
import { ConnectivityIndicator } from "@/components/ui/connectivity-indicator";
import { ShortcutHint, SECTION_SHORTCUT_ID } from "@/components/shortcuts";
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
  chat: MessageSquare,
  "dev-logs": Bug,
  settings: Settings,
};

/**
 * Live count of records with unresolved sync conflicts (needs user resolution on the
 * Sync page). Seeds from sync.status() and updates on every `sync:status` broadcast.
 */
function useConflictCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const api = window.api;
    if (!api?.sync?.status || !api?.on) return;
    let alive = true;
    void api.sync.status().then((r) => {
      if (alive && r.ok) setCount(r.data.conflictCount ?? 0);
    });
    const off = api.on("sync:status", (payload) =>
      setCount((payload as { conflictCount?: number }).conflictCount ?? 0),
    );
    return () => {
      alive = false;
      off();
    };
  }, []);
  return count;
}

/**
 * Live count of local changes not yet pushed to Notion (dirty incomes/expenses
 * + pending hard-deletes). Drives the amber badge on the History nav item and
 * updates on every `sync:status` broadcast and after any local write.
 */
function useDirtyCount(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const api = window.api;
    if (!api?.sync?.status || !api?.on) return;
    let alive = true;
    const refresh = () =>
      void api.sync!.status().then((r) => {
        if (alive && r.ok) setCount(r.data.dirtyCount ?? 0);
      });
    refresh();
    const offStatus = api.on("sync:status", (payload) =>
      setCount((payload as { dirtyCount?: number }).dirtyCount ?? 0),
    );
    const offRecords = api.on("records:changed", refresh);
    return () => {
      alive = false;
      offStatus();
      offRecords();
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
  const { chatEnabled, devModeEnabled } = useUiSettings();
  const conflictCount = useConflictCount();
  const dirtyCount = useDirtyCount();
  const sectionBadges: Partial<Record<FinanceSectionId, number>> = {
    sync: conflictCount,
    history: dirtyCount,
  };
  const groupedSections = useMemo(
    () => ({
      primary: financeSections.filter((section) => section.group === "primary"),
      workflow: financeSections.filter((section) => section.group === "workflow"),
      system: financeSections.filter(
        (section) =>
          section.group === "system" &&
          (section.id !== "chat" || chatEnabled) &&
          (section.id !== "dev-logs" || devModeEnabled),
      ),
    }),
    [chatEnabled, devModeEnabled],
  );
  const initials = userInitials(user?.name, user?.email);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className={styles.brand__mark} aria-hidden="true">
          <img src="./favicon.png" alt="" />
        </div>
        <div>
          <p className={styles.brand__name}>Notable Finance</p>
        </div>
        <button
          type="button"
          className={styles["sidebar-toggle"]}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggle}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>
      <nav className="nav" aria-label="Finance sections">
        <NavGroup title="Overview" sections={groupedSections.primary} activeSection={activeSection} onNavigate={onNavigate} sectionBadges={sectionBadges} />
        <NavGroup title="Money movement" sections={groupedSections.workflow} activeSection={activeSection} onNavigate={onNavigate} sectionBadges={sectionBadges} />
        <NavGroup title="Workspace" sections={groupedSections.system} activeSection={activeSection} onNavigate={onNavigate} sectionBadges={sectionBadges} />
      </nav>
      <div className={styles["sidebar-profile"]}>
        <div className={styles["sidebar-profile__avatar"]} aria-hidden="true">
          {user?.avatarDataUrl ? (
            <img src={user.avatarDataUrl} alt="" />
          ) : (
            initials
          )}
        </div>
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
    <div className={styles.nav__group}>
      <p className={styles.nav__title}>{title}</p>
      {sections.map((section) => {
        const Icon = sectionIcons[section.id];
        const badge = sectionBadges?.[section.id] ?? 0;
        // History shows pending-to-push (amber, informational); Sync shows
        // conflicts that need resolving (red, in the default badge style).
        const isHistory = section.id === "history";
        const badgeHint = isHistory
          ? `${badge} item${badge > 1 ? "s" : ""} waiting to sync`
          : `${badge} item${badge > 1 ? "s" : ""} to resolve`;
        return (
          <Link
            key={section.id}
            href={`/${section.id}`}
            className={cx(styles.nav__item, activeSection === section.id && styles["nav__item--active"])}
            onClick={onNavigate}
            title={badge > 0 ? badgeHint : undefined}
          >
            <Icon size={17} />
            <span>{section.shortLabel ?? section.label}</span>
            {SECTION_SHORTCUT_ID[section.id] && (
              <ShortcutHint id={SECTION_SHORTCUT_ID[section.id]!} className="nav__shortcut" />
            )}
            {badge > 0 && (
              <span
                className={cx(styles.nav__badge, isHistory && styles["nav__badge--warn"])}
                aria-label={badgeHint}
              >
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
  selectedDate,
  selectorUnit,
  syncState,
  activeSyncKind = null,
  activeMonths,
  onDateChange,
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
  activeMonths?: number[];
  onDateChange: (isoDate: string) => void;
  onSchemaVerify: () => void;
  onSync: () => void;
  onMobileNavToggle: () => void;
}) {
  const { user } = useAuth();
  const initials = userInitials(user?.name, user?.email);

  return (
    <header className={styles.topbar}>
      <div className={styles.topbar__status}>
      <button
        type="button"
        className={styles["mobile-nav-toggle"]}
        aria-label="Open navigation"
        onClick={onMobileNavToggle}
      >
        <Menu size={18} />
      </button>
        <ConnectivityIndicator />
      </div>
      <div className={styles.topbar__date}>
        {selectorUnit && (
          <DateRangeSelector
            unit={selectorUnit}
            anchorDate={selectedDate}
            onChange={onDateChange}
            activeMonths={activeMonths}
          />
        )}
      </div>
      <div className={styles.topbar__actions} aria-label="Workspace controls">
        <span className={styles["sync-meta"]}>Last sync {lastSync}</span>
        <div className={styles["sync-btn-wrapper"]}>
          <button type="button" className="button button--primary" onClick={onSync} disabled={syncState === "syncing"}>
            <RefreshCw size={12} className={activeSyncKind === "full" ? "spin" : undefined} />
            Sync
          </button>
        </div>
        <Link href="/settings" className={styles.topbar__avatar} title={user?.name ?? "Settings"}>
          {user?.avatarDataUrl ? <img src={user.avatarDataUrl} alt="" /> : initials}
        </Link>
      </div>
    </header>
  );
}

export { sectionIcons, Sidebar, NavGroup, TopBar };
