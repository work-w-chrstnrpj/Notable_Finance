import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { useQueryClient } from "@tanstack/react-query";
import "./assets/globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { FinanceDataProvider } from "@/lib/finance-data-context";
import { QueryProvider } from "@/lib/query-provider";
import { UiSettingsProvider } from "@/lib/ui-settings-context";
import { FinanceWorkspace } from "@/components/finance-workspace";
import { WorkspaceTabBar } from "@/components/layout/workspace-tab-bar";
import { AppTabsProvider, useActiveTabSection } from "@/lib/app-tabs-context";
import { ShortcutProvider } from "@/lib/shortcuts/context";
import { GlobalShortcuts, CheatSheet } from "@/components/shortcuts";
import { DevModeProbe } from "@/components/dev-mode-probe";

// Desktop entry — UiSettings (SQLite) wraps theme/auth so profile + prefs persist.

/**
 * Bridges main-process events into React Query: when ANY window writes (or a sync pass
 * applies remote changes), main broadcasts records:changed / derived:updated and every
 * window invalidates its query families — this is what keeps multiple windows / tabs and
 * sync-applied changes live, replacing the web app's per-tab refetching.
 */
function IpcInvalidationBridge() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const api = window.api
    if (!api?.on) return
    const invalidateAll = () => {
      for (const key of [
        ["incomes"], ["expenses"], ["workflow"], ["dashboard"],
        ["monthlyMonitoring"], ["expenseScheduler"], ["accounts"],
        ["incomeCategories"], ["expenseCategories"], ["syncStatus"],
      ]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    };
    const offRecords = api.on("records:changed", invalidateAll);
    const offDerived = api.on("derived:updated", invalidateAll);
    const offSync = api.on("sync:status", () => {
      void queryClient.invalidateQueries({ queryKey: ["syncStatus"] });
    });
    return () => {
      offRecords();
      offDerived();
      offSync();
    };
  }, [queryClient]);
  return null;
}

function TabbedWorkspace() {
  const section = useActiveTabSection();
  return (
    <div className="app-shell">
      <WorkspaceTabBar />
      <FinanceWorkspace activeSection={section} />
    </div>
  );
}

function App() {
  return (
    <QueryProvider>
      <UiSettingsProvider>
        <DevModeProbe />
        <ThemeProvider>
          <AuthProvider>
            <FinanceDataProvider>
              <IpcInvalidationBridge />
              <AppTabsProvider>
                <ShortcutProvider>
                  <GlobalShortcuts />
                  <TabbedWorkspace />
                  <CheatSheet />
                </ShortcutProvider>
              </AppTabsProvider>
            </FinanceDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </UiSettingsProvider>
    </QueryProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
