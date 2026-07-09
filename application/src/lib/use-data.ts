"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResult } from "./api-client";
import {
  accountsApi,
  dashboardApi,
  expenseCategoriesApi,
  expenseSchedulerApi,
  expensesApi,
  incomeCategoriesApi,
  incomesApi,
  monthlyMonitoringApi,
  syncApi,
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
) {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });

  const fetcherRef = useRef(fetcher);
  // eslint-disable-next-line react-hooks/refs
  fetcherRef.current = fetcher;
  const fallbackRef = useRef(fallback);
  // eslint-disable-next-line react-hooks/refs
  fallbackRef.current = fallback;

  useEffect(() => {
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
  }, []);

  const refetch = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const result = await fetcherRef.current();

      if (result.success) {
        setState({ status: "success", data: result.data });
      } else if (fallbackRef.current !== undefined) {
        setState({ status: "success", data: fallbackRef.current });
      } else {
        setState({ status: "error", error: result.error?.message ?? "Request failed" });
      }
    } catch (err: unknown) {
      if (fallbackRef.current !== undefined) {
        setState({ status: "success", data: fallbackRef.current });
      } else {
        setState({ status: "error", error: err instanceof Error ? err.message : "Network error" });
      }
    }
  }, []);

  return { state, refetch };
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
    categoryId?: string;
    accountId?: string;
  },
) {
  return useApiData<IncomeRecord[]>(
    () => incomesApi.list(params),
  );
}

// ── Expense hooks ─────────────────────────────────────────────────────

export function useExpenses(
  params?: {
    month?: string;
    categoryId?: string;
    accountId?: string;
    paymentStatus?: string;
    expenseViewMode?: string;
    pasabuyer?: string;
  },
) {
  return useApiData<ExpenseRecord[]>(
    () => expensesApi.list(params),
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
