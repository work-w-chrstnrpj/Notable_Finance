"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiResult } from "./api-client";
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
  }, [key]);

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
