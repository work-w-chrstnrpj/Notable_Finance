"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useFinanceData } from "@/lib/finance-data-context";
import { preferencesApi, syncApi } from "@/lib/api-client";
import { cx } from "@/lib/finance-helpers";
import { activeSelectorUnit, anchorMonth, todayIso } from "@/lib/date-range";

// Layout
import { Sidebar, TopBar } from "@/components/layout";

// Pages
import { DashboardPage } from "@/components/pages/dashboard";
import { AccountsPage } from "@/components/pages/accounts";
import { IncomePage } from "@/components/pages/income";
import { ExpensePage } from "@/components/pages/expense";
import { MonthlyMonitoringPage } from "@/components/pages/monitoring";
import { WorkflowPage } from "@/components/pages/workflow";
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
  const { user, loading: authLoading } = useAuth();
  const { refreshReferenceData } = useFinanceData();
  // Use a stable default to avoid SSR/client hydration mismatch.
  // todayIso() produces different results on server vs client (timezone/time).
  const [selectedDate, setSelectedDate] = useState<string>("2026-07-01");
  // Sync to real date on client mount (runs once, after hydration).
  useEffect(() => { setSelectedDate(todayIso()); }, []);
  const selectedMonth = anchorMonth(selectedDate);
  const [incomeViewMode, setIncomeViewMode] = useState<IncomeViewMode>("Monthly");
  const [expenseViewMode, setExpenseViewMode] = useState<ExpenseViewMode>("Monthly");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [schemaHealth, setSchemaHealth] = useState<SchemaHealth>("notChecked");
  const [pendingOperations, setPendingOperations] = useState(0);
  const [lastSync, setLastSync] = useState("—");
  // Stable default avoids hydration mismatch; synced from localStorage in useEffect below.
  const [showFab, setShowFab] = useState(true);
  // Load FAB preference from localStorage on client mount (after hydration).
  useEffect(() => {
    try {
      const cached = localStorage.getItem("nf_show_fab");
      if (cached !== null) setShowFab(cached === "true");
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    preferencesApi
      .get()
      .then((res) => {
        if (!cancelled && res.success) {
          setShowFab(res.data.showFab);
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
          {activeSection === "sync" && (
            <ErrorBoundary sectionLabel="Sync">
              <SyncPage
                lastSync={lastSync}
                pendingOperations={pendingOperations}
                schemaHealth={schemaHealth}
                syncState={syncState}
                onSchemaVerify={verifySchema}
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
