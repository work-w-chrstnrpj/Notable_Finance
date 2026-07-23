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
import { useSection } from "@/lib/router";

// Desktop entry — mirrors the web root layout (ThemeProvider → AuthProvider →
// QueryProvider → FinanceDataProvider → FinanceWorkspace). Routing is hash-based
// (#/section) instead of Next.js paths; everything else is the same tree.

/**
 * Bridges main-process events into React Query: when ANY window writes (or a sync pass
 * applies remote changes), main broadcasts records:changed / derived:updated and every
 * window invalidates its query families — this is what keeps multiple windows and
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

function App() {
  const section = useSection();
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryProvider>
          <UiSettingsProvider>
            <FinanceDataProvider>
              <IpcInvalidationBridge />
              <FinanceWorkspace activeSection={section} />
            </FinanceDataProvider>
          </UiSettingsProvider>
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
