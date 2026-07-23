
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFinanceData } from "@/lib/finance-data-context";
import { syncApi } from "@/lib/api-client";
import { cx } from "@/lib/finance-helpers";
import { activeSelectorUnit, anchorMonth, todayIso } from "@/lib/date-range";
import { useUiSettings } from "@/lib/ui-settings-context";
import { useDebouncedPersist } from "@/lib/use-debounced-persist";

// Layout
import { Sidebar, TopBar } from "@/components/layout";

// Pages
import { DashboardPage } from "@/components/pages/dashboard";
import { AccountsPage } from "@/components/pages/accounts";
import { IncomePage } from "@/components/pages/income";
import { ExpensePage } from "@/components/pages/expense";
import { MonthlyMonitoringPage } from "@/components/pages/monitoring";
import { WorkflowPage } from "@/components/pages/workflow";
import { HistoryPage } from "@/components/pages/history";
import { SyncPage } from "@/components/pages/sync";
import { SettingsPage } from "@/components/pages/settings";

// FAB
import { WorkspaceFab } from "@/components/fab";

// FabExportProvider
import { FabExportProvider } from "@/lib/fab-export-context";

// P5: Error boundary
import { ErrorBoundary } from "@/components/ui/error-boundary";

// Hooks & types
import { isWorkflowSection } from "@/components/hooks";
import type { ExpenseViewMode, FinanceSectionId, IncomeViewMode, SchemaHealth, SyncState } from "@/types/finance";

export function FinanceWorkspace({ activeSection }: { activeSection: FinanceSectionId }) {
  const { user } = useAuth();
  const { refreshReferenceData } = useFinanceData();
  const { settings, ready: settingsReady, updateSettings } = useUiSettings();
  const [workspaceHydrated, setWorkspaceHydrated] = useState(false);

  const [selectedDate, setSelectedDate] = useState<string>("2026-07-01");
  const selectedMonth = anchorMonth(selectedDate);
  const [incomeViewMode, setIncomeViewMode] = useState<IncomeViewMode>("Monthly");
  const [expenseViewMode, setExpenseViewMode] = useState<ExpenseViewMode>("Monthly");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [schemaHealth, setSchemaHealth] = useState<SchemaHealth>("notChecked");
  const [pendingOperations, setPendingOperations] = useState(0);
  const [lastSync, setLastSync] = useState("—");
  const [showFab, setShowFab] = useState(true);

  // Hydrate workspace prefs from SQLite once.
  useEffect(() => {
    if (!settingsReady || workspaceHydrated) return;
    const ws = settings.workspace;
    setSelectedDate(ws.selectedDate || todayIso());
    setIncomeViewMode(ws.incomeViewMode);
    setExpenseViewMode(ws.expenseViewMode);
    setSidebarCollapsed(ws.sidebarCollapsed);
    setShowFab(ws.showFab);
    setWorkspaceHydrated(true);
  }, [settingsReady, workspaceHydrated, settings.workspace]);

  useDebouncedPersist(
    workspaceHydrated,
    [selectedDate, incomeViewMode, expenseViewMode, sidebarCollapsed, showFab, activeSection],
    () => {
      void updateSettings({
        workspace: {
          selectedDate,
          incomeViewMode,
          expenseViewMode,
          sidebarCollapsed,
          showFab,
          lastSection: activeSection,
        },
      });
      try {
        localStorage.setItem("nf_show_fab", String(showFab));
      } catch {
        /* ignore */
      }
    },
  );

  async function updateShowFab(next: boolean) {
    setShowFab(next);
  }

  const [activeSyncKind, setActiveSyncKind] = useState<"full" | "pull" | "push" | null>(null);

  const selectorUnit = activeSelectorUnit(activeSection, incomeViewMode, expenseViewMode);

  async function runSyncPass(kind: "full" | "pull" | "push") {
    setActiveSyncKind(kind);
    setSyncState("syncing");
    try {
      const result =
        kind === "pull"
          ? await syncApi.pullOnly()
          : kind === "push"
            ? await syncApi.pushOnly()
            : await syncApi.fullSync();
      if (result.success) {
        setSyncState("fresh");
        setPendingOperations(0);
        setLastSync(new Date().toISOString().replace("T", " ").slice(0, 16));
        refreshReferenceData();
      } else {
        setSyncState("error");
      }
    } catch {
      setSyncState("error");
    } finally {
      setActiveSyncKind(null);
    }
  }

  /** Header Sync button — always full sync (pull then push). */
  const runSync = () => void runSyncPass("full");

  async function verifySchema() {
    try {
      const result = await syncApi.schemaStatus();
      if (result.success) {
        setSchemaHealth("verified");
      } else {
        setSchemaHealth("warning");
      }
    } catch {
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
          activeSyncKind={activeSyncKind}
          onDateChange={setSelectedDate}
          onSchemaVerify={verifySchema}
          onSync={runSync}
          onMobileNavToggle={() => setMobileNavOpen((v) => !v)}
        />
        <main className="workspace__content">
          {activeSection === "dashboard" && (
            <ErrorBoundary sectionLabel="Dashboard">
              <DashboardPage
                lastSync={lastSync}
                selectedMonth={selectedMonth}
              />
            </ErrorBoundary>
          )}
          {activeSection === "accounts" && (
            <ErrorBoundary sectionLabel="Accounts">
              <AccountsPage />
            </ErrorBoundary>
          )}
          {activeSection === "income" && (
            <ErrorBoundary sectionLabel="Income">
              <IncomePage
                viewMode={incomeViewMode}
                onViewModeChange={setIncomeViewMode}
                selectedDate={selectedDate}
              />
            </ErrorBoundary>
          )}
          {activeSection === "expense" && (
            <ErrorBoundary sectionLabel="Expense">
              <ExpensePage
                viewMode={expenseViewMode}
                onViewModeChange={setExpenseViewMode}
                selectedDate={selectedDate}
              />
            </ErrorBoundary>
          )}
          {activeSection === "monthly-monitoring" && (
            <ErrorBoundary sectionLabel="Monthly Monitoring">
              <MonthlyMonitoringPage selectedMonth={selectedMonth} />
            </ErrorBoundary>
          )}
          {isWorkflowSection(activeSection) && (
            <ErrorBoundary sectionLabel={activeSection}>
              <WorkflowPage section={activeSection} selectedMonth={selectedMonth} />
            </ErrorBoundary>
          )}
          {activeSection === "history" && (
            <ErrorBoundary sectionLabel="History">
              <HistoryPage />
            </ErrorBoundary>
          )}
          {activeSection === "sync" && (
            <ErrorBoundary sectionLabel="Sync">
              <SyncPage
                lastSync={lastSync}
                pendingOperations={pendingOperations}
                schemaHealth={schemaHealth}
                syncState={syncState}
                activeSyncKind={activeSyncKind}
                onSchemaVerify={verifySchema}
                onPullSync={() => void runSyncPass("pull")}
                onPushSync={() => void runSyncPass("push")}
                onSync={runSync}
              />
            </ErrorBoundary>
          )}
          {activeSection === "settings" && (
            <ErrorBoundary sectionLabel="Settings">
              <SettingsPage
                schemaHealth={schemaHealth}
                onSchemaVerify={verifySchema}
                showFab={showFab}
                onShowFabChange={updateShowFab}
              />
            </ErrorBoundary>
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
