
import Link from "@/lib/router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUpDown,
  Banknote,
  HandCoins,
  Bell,
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
import { useNotificationCount } from "@/lib/use-notifications";
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
  borrowings: HandCoins,
  receivables: Banknote,
  notifications: Bell,
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
  const { chatEnabled, devModeEnabled, settings } = useUiSettings();
  const conflictCount = useConflictCount();
  const dirtyCount = useDirtyCount();
  const notificationCount = useNotificationCount();
  const sectionBadges: Partial<Record<FinanceSectionId, number>> = {
    sync: conflictCount,
    history: dirtyCount,
    notifications: notificationCount,
  };
  const groupedSections = useMemo(
    () => ({
      primary: financeSections.filter((section) => section.group === "primary"),
      workflow: financeSections.filter(
        (section) => section.group === "workflow" && !settings.hiddenSections.includes(section.id as never),
      ),
      system: financeSections.filter(
        (section) =>
          section.group === "system" &&
          (section.id !== "chat" || chatEnabled) &&
          (section.id !== "notifications" || settings.notificationsEnabled) &&
          (section.id !== "dev-logs" || devModeEnabled),
      ),
    }),
    [chatEnabled, devModeEnabled, settings.notificationsEnabled, settings.hiddenSections],
  );
  const [navScrolling, setNavScrolling] = useState(false);
  const navScrollTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(navScrollTimer.current), []);

  function showNavScrollbar() {
    setNavScrolling(true);
    clearTimeout(navScrollTimer.current);
    navScrollTimer.current = setTimeout(() => setNavScrolling(false), 500);
  }
  const initials = userInitials(user?.name, user?.email);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className={styles.brand__mark} aria-hidden="true">
          <img src="./favicon.png" alt="" />
        </div>
        <div className={styles.brand__text}>
          <p className={styles.brand__name}>Notable Finance</p>
        </div>
        <button
          type="button"
          className={styles["sidebar-toggle"]}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggle}
        >
          {/* Collapsed rail: the mark sits here at rest and gives way to the
              chevron on hover/focus, so the brand and the expand control share
              one centred 34px slot. CSS decides which of the two is shown. */}
          <img className={styles["sidebar-toggle__logo"]} src="./favicon.png" alt="" aria-hidden="true" />
          <span className={styles["sidebar-toggle__chevron"]} aria-hidden="true">
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </span>
        </button>
      </div>
      <nav
        className={cx("nav", styles["sidebar-nav"], navScrolling && styles["sidebar-nav--scrolling"])}
        aria-label="Finance sections"
        onScroll={showNavScrollbar}
      >
        <NavGroup title="Overview" sections={groupedSections.primary} activeSection={activeSection} onNavigate={onNavigate} sectionBadges={sectionBadges} collapsed={collapsed} />
        <NavGroup title="Money movement" sections={groupedSections.workflow} activeSection={activeSection} onNavigate={onNavigate} sectionBadges={sectionBadges} collapsed={collapsed} />
        <NavGroup title="Workspace" sections={groupedSections.system} activeSection={activeSection} onNavigate={onNavigate} sectionBadges={sectionBadges} collapsed={collapsed} />
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
  collapsed = false,
}: {
  title: string;
  sections: FinanceSection[];
  activeSection: FinanceSectionId;
  onNavigate?: () => void;
  sectionBadges?: Partial<Record<FinanceSectionId, number>>;
  /** Collapsed rail hides the labels, so each item needs a tooltip instead. */
  collapsed?: boolean;
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
        const navLabel = section.shortLabel ?? section.label;
        const tooltip = collapsed
          ? badge > 0
            ? `${navLabel} — ${badgeHint}`
            : navLabel
          : badge > 0
            ? badgeHint
            : undefined;
        return (
          <Link
            key={section.id}
            href={`/${section.id}`}
            className={cx(styles.nav__item, activeSection === section.id && styles["nav__item--active"])}
            onClick={onNavigate}
            title={tooltip}
            aria-label={collapsed ? navLabel : undefined}
          >
            <Icon size={17} />
            <span>{navLabel}</span>
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
