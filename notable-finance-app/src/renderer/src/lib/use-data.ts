
import { useCallback } from "react";
import {
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
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
  historyApi,
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
  HistoryData,
  IncomeCategory,
  IncomeRecord,
  SyncStatus,
} from "@/types/finance";

// Reference data changes rarely (P1); cache it longer than transactional data.
const REFERENCE_STALE_TIME = 5 * 60_000;

// ── Generic read hook (React Query backed) ────────────────────────────
//
// Reads go through React Query (ADR-001) but keep the { state, refetch,
// applyLocal } shape the workspace already consumes, so migrating the data
// layer did not require touching the ~15 read sites in finance-workspace.tsx.
// React Query provides caching, request deduplication, stale-while-revalidate,
// and background refetch for free.

export type AsyncState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

interface ApiQueryOptions<T> {
  fallback?: T;
  staleTime?: number;
  /** Extra gate on top of the auth-ready gate (e.g. an id must be present). */
  enabled?: boolean;
}

function useApiQuery<T>(
  queryKey: QueryKey,
  fetcher: () => Promise<ApiResult<T>>,
  options: ApiQueryOptions<T> = {},
) {
  const { loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { fallback, staleTime, enabled = true } = options;

  const query = useQuery<T, Error>({
    queryKey,
    enabled: !authLoading && enabled,
    staleTime,
    queryFn: async () => {
      try {
        const res = await fetcher();
        if (res.success) return res.data;
        if (fallback !== undefined) return fallback;
        throw new Error(res.error?.message ?? "Request failed");
      } catch (err) {
        // Preserve the old fallback-on-any-failure behaviour.
        if (fallback !== undefined) return fallback;
        throw err instanceof Error ? err : new Error("Network error");
      }
    },
  });

  // Stale-while-revalidate: keep showing data even if the background refetch
  // failed. Consumers see stale data instead of a blank screen.
  const state: AsyncState<T> =
    query.data !== undefined
      ? { status: "success", data: query.data }
      : query.isError
        ? { status: "error", error: query.error?.message ?? "Request failed" }
        : { status: "loading" };

  // Stable refetch. React Query refetch is inherently stale-while-revalidate
  // (keeps prior data on screen), so it never blanks the current view.
  const rqRefetch = query.refetch;
  const refetch = useCallback(async () => {
    await rqRefetch();
  }, [rqRefetch]);

  // Optimistic local merge → writes straight into the query cache. Called only
  // from event handlers, so a plain (non-memoized) function is fine. No-op
  // until the query has data.
  const applyLocal = (updater: (prev: T) => T) => {
    queryClient.setQueryData<T>(queryKey, (prev) =>
      prev === undefined ? prev : updater(prev),
    );
  };

  return { state, refetch, applyLocal };
}

// ── Dashboard ─────────────────────────────────────────────────────────

export function useDashboardData(month: string) {
  return useApiQuery<DashboardSummary>(["dashboard", month], () =>
    dashboardApi.summary(month),
  );
}

// ── Account hooks ─────────────────────────────────────────────────────

export function useAccounts(includeInactive = false) {
  return useApiQuery<Account[]>(
    ["accounts", { includeInactive }],
    () => accountsApi.list({ includeInactive }),
    { staleTime: REFERENCE_STALE_TIME },
  );
}

export function useAccount(id: string | null) {
  return useApiQuery<Account>(["account", id], () => accountsApi.detail(id!), {
    enabled: id != null,
  });
}

// ── Income Category hooks ─────────────────────────────────────────────

export function useIncomeCategories(normalOnly = false) {
  return useApiQuery<IncomeCategory[]>(
    ["incomeCategories", { normalOnly }],
    () => incomeCategoriesApi.list({ normalOnly }),
    { staleTime: REFERENCE_STALE_TIME },
  );
}

// ── Expense Category hooks ────────────────────────────────────────────

export function useExpenseCategories() {
  return useApiQuery(["expenseCategories"], () => expenseCategoriesApi.list(), {
    staleTime: REFERENCE_STALE_TIME,
  });
}

// ── Income hooks ──────────────────────────────────────────────────────

export function useIncomes(params?: {
  month?: string;
  rangeStart?: string;
  rangeEnd?: string;
  categoryId?: string;
  accountId?: string;
}) {
  return useApiQuery<IncomeRecord[]>(["incomes", params ?? {}], () =>
    incomesApi.list(params),
  );
}

// ── Expense hooks ─────────────────────────────────────────────────────

export function useExpenses(params?: {
  month?: string;
  rangeStart?: string;
  rangeEnd?: string;
  categoryId?: string;
  accountId?: string;
  paymentStatus?: string;
  expenseViewMode?: string;
  pasabuyer?: string;
}) {
  return useApiQuery<ExpenseRecord[]>(["expenses", params ?? {}], () =>
    expensesApi.list(params),
  );
}

export function useExpensesForCCCoverage() {
  return useApiQuery<ExpenseRecord[]>(
    ["expenses", "ccCoverage"],
    () => expensesApi.listForCCCoverage(),
  );
}

// ── Workflow hooks (income-backed views) ──────────────────────────────

export function useTransfers(params?: WorkflowListParams) {
  return useApiQuery<IncomeRecord[]>(["workflow", "transfer", params ?? {}], () =>
    transfersApi.list(params),
  );
}

export function useCreditCardPayments(params?: WorkflowListParams) {
  return useApiQuery<IncomeRecord[]>(
    ["workflow", "credit-card-payment", params ?? {}],
    () => creditCardPaymentsApi.list(params),
  );
}

export function useAlkansya(params?: WorkflowListParams) {
  return useApiQuery<IncomeRecord[]>(["workflow", "alkansya", params ?? {}], () =>
    alkansyaApi.list(params),
  );
}

export function useReceivables(params?: WorkflowListParams) {
  return useApiQuery<IncomeRecord[]>(
    ["workflow", "receivables", params ?? {}],
    () => receivablesApi.list(params),
  );
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
  return useApiQuery<IncomeRecord[]>(["workflow", section, params ?? {}], () =>
    api.list(params),
  );
}

// ── Sync hooks ────────────────────────────────────────────────────────

export function useSyncStatus() {
  return useApiQuery<SyncStatus>(["syncStatus"], () => syncApi.status(), {
    fallback: {
      lastSyncAt: null,
      state: "idle",
      pendingOperations: 0,
      failedOperations: 0,
    },
  });
}

export function useSchemaStatus() {
  return useApiQuery(["schemaStatus"], () => syncApi.schemaStatus());
}

// ── History hook ──────────────────────────────────────────────────────

export function useHistory(runs = 2) {
  return useApiQuery<HistoryData>(
    ["history", runs],
    () => historyApi.get(runs),
    {
      fallback: { unsynced: [], recent: [], lastPullAt: null, lastPushAt: null },
    },
  );
}

// ── Monthly Monitoring hook ───────────────────────────────────────────

export function useMonthlyMonitoring(month: string) {
  return useApiQuery(["monthlyMonitoring", month], () =>
    monthlyMonitoringApi.list(month),
  );
}

// ── Expense Scheduler hook ────────────────────────────────────────────

export function useExpenseScheduler() {
  return useApiQuery<ExpenseSchedulerRecord[]>(["expenseScheduler"], () =>
    expenseSchedulerApi.list(),
  );
}

// ── Cross-section invalidation (ADR-001 invalidation map) ─────────────
//
// After a mutation, invalidate the affected query families so every consumer —
// including Dashboard and Monthly Monitoring, which compute from income/expense
// reads — refreshes. Prefix keys cover every filtered/month variant. React
// Query refetches active queries immediately and marks inactive ones stale for
// their next mount.

export function useFinanceInvalidation() {
  const queryClient = useQueryClient();

  const invalidateIncomeFamily = useCallback(() => {
    for (const key of [["incomes"], ["workflow"], ["dashboard"], ["monthlyMonitoring"]]) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  }, [queryClient]);

  const invalidateExpenseFamily = useCallback(() => {
    for (const key of [["expenses"], ["expenseScheduler"], ["dashboard"], ["monthlyMonitoring"]]) {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  }, [queryClient]);

  return { invalidateIncomeFamily, invalidateExpenseFamily };
}
