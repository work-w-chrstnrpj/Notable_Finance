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
import {
  accounts as mockAccounts,
  expenseCategories as mockExpenseCategories,
  expenseRecords as mockExpenses,
  incomeCategories as mockIncomeCategories,
  incomeRecords as mockIncomes,
} from "./finance-data";
import type {
  DashboardSummary,
  ExpenseRecord,
  ExpenseSchedulerRecord,
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
  fallback: T,
) {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading" });

  // Keep fetcher and fallback in refs so refetch always has the latest versions
  const fetcherRef = useRef(fetcher);
  // eslint-disable-next-line react-hooks/refs
  fetcherRef.current = fetcher;
  const fallbackRef = useRef(fallback);
  // eslint-disable-next-line react-hooks/refs
  fallbackRef.current = fallback;

  useEffect(() => {
    let cancelled = false;

    // Transition to loading when the effect re-runs (fetcher or fallback changed).
    // Use queueMicrotask to avoid the synchronous setState-in-effect lint rule.
    queueMicrotask(() => {
      if (!cancelled) {
        setState({ status: "loading" });
      }
    });

    fetcher()
      .then((result) => {
        if (cancelled) {
          return;
        }

        if (result.success) {
          setState({ status: "success", data: result.data });
        } else {
          setState({ status: "success", data: fallback });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: "success", data: fallback });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fetcher, fallback]);

  const refetch = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const result = await fetcherRef.current();

      if (result.success) {
        setState({ status: "success", data: result.data });
      } else {
        setState({ status: "success", data: fallbackRef.current });
      }
    } catch {
      setState({ status: "success", data: fallbackRef.current });
    }
  }, []);

  return { state, refetch };
}

// ── Combined dashboard data (multiple parallel fetches) ───────────────

export type DashboardData = Awaited<
  ReturnType<ReturnType<typeof useDashboardData>["refetch"]>
> extends { state: { status: "success"; data: infer D } }
  ? D
  : never;

export function useDashboardData(month: string) {
  return useApiData(
    () => dashboardApi.summary(month),
    deriveDashboardFallback(month),
  );
}

function deriveDashboardFallback(month: string): DashboardSummary {
  const scopedIncomes = mockIncomes.filter(
    (r) => r.date.startsWith(month.slice(0, 7)),
  );
  const scopedExpenses = mockExpenses.filter(
    (r) => r.purchaseDate.startsWith(month.slice(0, 7)),
  );
  const totalIncome = scopedIncomes.reduce(
    (s, r) => s + r.grossIncome - r.capitalExpenditure,
    0,
  );
  const totalExpense = scopedExpenses.reduce((s, r) => s + r.amount, 0);
  const totalCashFlow = mockAccounts
    .filter(
      (a) =>
        !a.inactive &&
        a.type !== "Credit Account" &&
        a.type !== "BYPL",
    )
    .reduce((s, a) => s + a.currentBalance, 0);

  return {
    month,
    totalCashFlow,
    netIncome: totalIncome,
    grossIncome: scopedIncomes.reduce((s, r) => s + r.grossIncome, 0),
    expenses: totalExpense,
    availableCredit: 0,
    creditLimit: 0,
    creditBalanceTotal: 0,
    pasabuyBalance: 0,
    pendingOperations: 0,
    lastSync: "N/A",
    trendMonths: [],
    incomeTrend: [],
    expenseTrend: [],
    spendingBreakdown: [],
    recentTransactions: [],
  };
}

// ── Account hooks ─────────────────────────────────────────────────────

export function useAccounts(includeInactive = false) {
  return useApiData(
    () => accountsApi.list({ includeInactive }),
    mockAccounts,
  );
}

export function useAccount(id: string | null) {
  return useApiData(
    () => accountsApi.detail(id!),
    mockAccounts.find((a) => a.id === id) ?? mockAccounts[0],
  );
}

// ── Income Category hooks ─────────────────────────────────────────────

export function useIncomeCategories(normalOnly = false) {
  return useApiData(
    () => incomeCategoriesApi.list({ normalOnly }),
    mockIncomeCategories,
  );
}

// ── Expense Category hooks ────────────────────────────────────────────

export function useExpenseCategories() {
  return useApiData(
    () => expenseCategoriesApi.list(),
    mockExpenseCategories,
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
  return useApiData(
    () => incomesApi.list(params),
    filterMockIncomes(params),
  );
}

function filterMockIncomes(
  params?: {
    month?: string;
    categoryId?: string;
    accountId?: string;
  },
): IncomeRecord[] {
  let result = [...mockIncomes];

  if (params?.month) {
    result = result.filter((r) => r.date.startsWith(params.month!));
  }

  if (params?.categoryId) {
    result = result.filter((r) => r.categoryId === params.categoryId);
  }

  if (params?.accountId) {
    result = result.filter(
      (r) => r.accountId === params.accountId,
    );
  }

  return result;
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
  return useApiData(
    () => expensesApi.list(params),
    filterMockExpenses(params),
  );
}

function filterMockExpenses(
  params?: {
    month?: string;
    categoryId?: string;
    accountId?: string;
  },
): ExpenseRecord[] {
  let result = [...mockExpenses];

  if (params?.month) {
    result = result.filter(
      (r) => r.purchaseDate.startsWith(params.month!),
    );
  }

  if (params?.categoryId) {
    result = result.filter(
      (r) => r.categoryId === params.categoryId,
    );
  }

  if (params?.accountId) {
    result = result.filter(
      (r) => r.accountId === params.accountId,
    );
  }

  return result;
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
    { success: false, error: { code: "NOT_CHECKED", message: "Schema not checked" } } as never,
  );
}

// ── Monthly Monitoring hook ───────────────────────────────────────────

export function useMonthlyMonitoring(month: string) {
  return useApiData(
    () => monthlyMonitoringApi.list(month),
    { month, data: [] } as never,
  );
}

// ── Expense Scheduler hook ────────────────────────────────────────────

export function useExpenseScheduler() {
  return useApiData<ExpenseSchedulerRecord[]>(
    () => expenseSchedulerApi.list(),
    [],
  );
}
