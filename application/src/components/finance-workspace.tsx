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

// Hooks & types
import { isWorkflowSection } from "@/components/hooks";
import type { ExpenseViewMode, FinanceSectionId, IncomeViewMode, SchemaHealth, SyncState } from "@/types/finance";

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
