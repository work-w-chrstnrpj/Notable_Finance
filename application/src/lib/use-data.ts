"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResult } from "./api-client";
import { useAuth } from "./auth-context";
import {
  accountsApi,
  alkansyaApi,
  creditCardPaymentsApi,
  dashboardApi,
  expenseCategoriesApi,
  expenseSchedulerApi,
  expensesApi,
  incomeCategoriesApi,
  incomesApi,
  monthlyMonitoringApi,
  receivablesApi,
  syncApi,
  transfersApi,
  type WorkflowListParams,
} from "./api-client";
import type {
  Account,
  DashboardSummary,
  ExpenseRecord,
  ExpenseSchedulerRecord,
  IncomeCategory,
  IncomeRecord,
  SyncStatus,
} from "@/types/finance";

// ── Generic data hook ─────────────────────────────────────────────────

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

export function useApiData<T>(
  fetcher: () => Promise<ApiResult<T>>,
  fallback?: T,
  /**
   * Serialized query key. When it changes the data is refetched — this is what
   * makes month/view-mode switches issue a fresh query instead of showing the
   * initial (stale) result forever.
   */
  key?: string,
) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });

  const fetcherRef = useRef(fetcher);
  // eslint-disable-next-line react-hooks/refs
  fetcherRef.current = fetcher;
  const fallbackRef = useRef(fallback);
  // eslint-disable-next-line react-hooks/refs
  fallbackRef.current = fallback;

  useEffect(() => {
    // Wait for AuthProvider to finish deciding whether the caller is
    // authenticated. If we fire the fetch before AuthProvider's own useEffect
    // populates api-client's module-level authToken, the Bearer header is
    // missing and every backend read returns empty (the per-user Notion
    // config never gets loaded server-side).
    if (authLoading) return;

    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setState({ status: "loading" });
      }
    });

    fetcherRef.current()
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setState({ status: "success", data: result.data });
        } else if (fallbackRef.current !== undefined) {
          setState({ status: "success", data: fallbackRef.current });
        } else {
          setState({ status: "error", error: result.error?.message ?? "Request failed" });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (fallbackRef.current !== undefined) {
          setState({ status: "success", data: fallbackRef.current });
        } else {
          setState({ status: "error", error: err instanceof Error ? err.message : "Network error" });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, authLoading, user?.id]);

  const refetch = useCallback(async (opts?: { silent?: boolean }) => {
    // Silent (stale-while-revalidate) refetch keeps the currently displayed
    // data on screen instead of blanking it with a loading spinner. Used after
    // an optimistic mutation to reconcile computed/server-side fields quietly.
    const silent = opts?.silent ?? false;
    if (!silent) {
      setState({ status: "loading" });
    }

    try {
      const result = await fetcherRef.current();

      if (result.success) {
        setState({ status: "success", data: result.data });
      } else if (fallbackRef.current !== undefined) {
        setState({ status: "success", data: fallbackRef.current });
      } else if (!silent) {
        setState({ status: "error", error: result.error?.message ?? "Request failed" });
      }
      // silent + no fallback + failure: keep the prior data rather than error out
    } catch (err: unknown) {
      if (fallbackRef.current !== undefined) {
        setState({ status: "success", data: fallbackRef.current });
      } else if (!silent) {
        setState({ status: "error", error: err instanceof Error ? err.message : "Network error" });
      }
    }
  }, []);

  /**
   * Synchronously merge a change into the currently displayed data without a
   * network round-trip. Enables optimistic create/update/delete: the returned
   * record is spliced into the list immediately, then a silent refetch
   * reconciles any server-computed fields. No-op unless data is already loaded.
   */
  const applyLocal = useCallback((updater: (prev: T) => T) => {
    setState((prev) =>
      prev.status === "success"
        ? { status: "success", data: updater(prev.data) }
        : prev,
    );
  }, []);

  return { state, refetch, applyLocal };
}

// ── Dashboard ─────────────────────────────────────────────────────────

export function useDashboardData(month: string) {
  return useApiData<DashboardSummary>(
    () => dashboardApi.summary(month),
  );
}

// ── Account hooks ─────────────────────────────────────────────────────

export function useAccounts(includeInactive = false) {
  return useApiData<Account[]>(
    () => accountsApi.list({ includeInactive }),
  );
}

export function useAccount(id: string | null) {
  return useApiData<Account>(
    () => accountsApi.detail(id!),
  );
}

// ── Income Category hooks ─────────────────────────────────────────────

export function useIncomeCategories(normalOnly = false) {
  return useApiData<IncomeCategory[]>(
    () => incomeCategoriesApi.list({ normalOnly }),
  );
}

// ── Expense Category hooks ────────────────────────────────────────────

export function useExpenseCategories() {
  return useApiData(
    () => expenseCategoriesApi.list(),
  );
}

// ── Income hooks ──────────────────────────────────────────────────────

export function useIncomes(
  params?: {
    month?: string;
    rangeStart?: string;
    rangeEnd?: string;
    categoryId?: string;
    accountId?: string;
  },
) {
  const key = JSON.stringify(params ?? {});
  return useApiData<IncomeRecord[]>(
    () => incomesApi.list(params),
    undefined,
    key,
  );
}

// ── Expense hooks ─────────────────────────────────────────────────────

export function useExpenses(
  params?: {
    month?: string;
    rangeStart?: string;
    rangeEnd?: string;
    categoryId?: string;
    accountId?: string;
    paymentStatus?: string;
    expenseViewMode?: string;
    pasabuyer?: string;
  },
) {
  const key = JSON.stringify(params ?? {});
  return useApiData<ExpenseRecord[]>(
    () => expensesApi.list(params),
    undefined,
    key,
  );
}

// ── Workflow hooks (income-backed views) ──────────────────────────────

export function useTransfers(params?: WorkflowListParams) {
  return useApiData<IncomeRecord[]>(() => transfersApi.list(params));
}

export function useCreditCardPayments(params?: WorkflowListParams) {
  return useApiData<IncomeRecord[]>(() => creditCardPaymentsApi.list(params));
}

export function useAlkansya(params?: WorkflowListParams) {
  return useApiData<IncomeRecord[]>(() => alkansyaApi.list(params));
}

export function useReceivables(params?: WorkflowListParams) {
  return useApiData<IncomeRecord[]>(() => receivablesApi.list(params));
}

export type WorkflowSection =
  | "transfer"
  | "credit-card-payment"
  | "alkansya"
  | "receivables";

const workflowApiBySection = {
  transfer: transfersApi,
  "credit-card-payment": creditCardPaymentsApi,
  alkansya: alkansyaApi,
  receivables: receivablesApi,
} as const;

export function useWorkflowRecords(
  section: WorkflowSection,
  params?: WorkflowListParams,
) {
  const api = workflowApiBySection[section];
  const key = JSON.stringify({ section, ...(params ?? {}) });
  return useApiData<IncomeRecord[]>(
    () => api.list(params),
    undefined,
    key,
  );
}

// ── Sync hooks ────────────────────────────────────────────────────────

export function useSyncStatus() {
  return useApiData<SyncStatus>(
    () => syncApi.status(),
    {
      lastSyncAt: null,
      state: "idle",
      pendingOperations: 0,
      failedOperations: 0,
    },
  );
}

export function useSchemaStatus() {
  return useApiData(
    () => syncApi.schemaStatus(),
  );
}

// ── Monthly Monitoring hook ───────────────────────────────────────────

export function useMonthlyMonitoring(month: string) {
  return useApiData(
    () => monthlyMonitoringApi.list(month),
  );
}

// ── Expense Scheduler hook ────────────────────────────────────────────

export function useExpenseScheduler() {
  return useApiData<ExpenseSchedulerRecord[]>(
    () => expenseSchedulerApi.list(),
  );
}
