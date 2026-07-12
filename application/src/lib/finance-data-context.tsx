"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  useAccounts,
  useExpenseCategories,
  useIncomeCategories,
} from "./use-data";
import { useAuth } from "./auth-context";
import { isCreditLikeAccountType } from "./finance-rules";
import type { Account, ExpenseCategory, IncomeCategory } from "@/types/finance";

/**
 * Reference data (accounts + income/expense categories) changes rarely — only
 * via a Notion-side edit picked up by Sync. Previously every page that called
 * `useLiveCollections()` (Dashboard, Income, Expense, Workflow, Monitoring,
 * Accounts) re-fetched all of it on mount, so navigating between sections
 * issued the same four requests over and over.
 *
 * FinanceDataProvider fetches that reference data ONCE and shares it via
 * context. It is mounted in the ROOT layout (`app/layout.tsx`), inside
 * AuthProvider. The root layout is the only layout that persists across
 * client-side navigation between sections (a layout at the dynamic `[section]`
 * segment remounts when the param changes), so mounting here is what makes the
 * fetch happen once per session. The actual fetching lives in an inner provider
 * that only mounts once the user is authenticated, so `/login` never fires
 * these authenticated requests. Consumers read it with `useFinanceData()`.
 */
export interface FinanceReferenceData {
  allAccounts: Account[];
  activeAccounts: Account[];
  nonCreditActiveAccounts: Account[];
  creditActiveAccounts: Account[];
  allIncomeCategories: IncomeCategory[];
  normalIncomeCategories: IncomeCategory[];
  expenseCategories: ExpenseCategory[];
  accountNameById: Map<string, string>;
  incomeCategoryNameById: Map<string, string>;
  expenseCategoryNameById: Map<string, string>;
  /** True while any reference collection is still on its initial load. */
  referenceLoading: boolean;
  /**
   * Silently re-fetch accounts + categories. Call after a Notion sync so newly
   * added accounts/categories appear without blanking the open dropdowns.
   */
  refreshReferenceData: () => void;
}

// Sorted at the source so every dropdown presents options in a stable order.
const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name);
const bySource = (a: { source: string }, b: { source: string }) =>
  a.source.localeCompare(b.source);

const FinanceDataContext = createContext<FinanceReferenceData | null>(null);

// Safe defaults used before authentication (e.g. on /login) so any consumer
// that renders transiently gets empty collections instead of throwing.
const EMPTY_REFERENCE: FinanceReferenceData = {
  allAccounts: [],
  activeAccounts: [],
  nonCreditActiveAccounts: [],
  creditActiveAccounts: [],
  allIncomeCategories: [],
  normalIncomeCategories: [],
  expenseCategories: [],
  accountNameById: new Map(),
  incomeCategoryNameById: new Map(),
  expenseCategoryNameById: new Map(),
  referenceLoading: false,
  refreshReferenceData: () => {},
};

export function FinanceDataProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  // Gate the fetching provider on auth. This is a conditional render (not a
  // conditional hook), so it's valid: the inner provider mounts once when the
  // user becomes authenticated and then persists with the root layout across
  // section navigation, fetching reference data exactly once.
  if (loading || !user) {
    return (
      <FinanceDataContext.Provider value={EMPTY_REFERENCE}>
        {children}
      </FinanceDataContext.Provider>
    );
  }
  return <AuthedFinanceDataProvider>{children}</AuthedFinanceDataProvider>;
}

function AuthedFinanceDataProvider({ children }: { children: ReactNode }) {
  // These four hooks fire once because this provider mounts once (in the root
  // layout, after auth) and survives client-side section navigation.
  const { state: accountsState, refetch: refetchAccounts } = useAccounts(true);
  const { state: allIncomeCategoriesState, refetch: refetchAllIncomeCategories } =
    useIncomeCategories(false);
  const {
    state: normalIncomeCategoriesState,
    refetch: refetchNormalIncomeCategories,
  } = useIncomeCategories(true);
  const { state: expenseCategoriesState, refetch: refetchExpenseCategories } =
    useExpenseCategories();

  // refetch() from useApiData is stable, so this callback is stable too.
  const refreshReferenceData = useCallback(() => {
    void refetchAccounts({ silent: true });
    void refetchAllIncomeCategories({ silent: true });
    void refetchNormalIncomeCategories({ silent: true });
    void refetchExpenseCategories({ silent: true });
  }, [
    refetchAccounts,
    refetchAllIncomeCategories,
    refetchNormalIncomeCategories,
    refetchExpenseCategories,
  ]);

  const value = useMemo<FinanceReferenceData>(() => {
    const allAccounts = (
      accountsState.status === "success" ? accountsState.data : []
    )
      .slice()
      .sort(byName);
    const activeAccounts = allAccounts.filter(
      (account) => !account.inactive && account.type !== "Auxiliary",
    );
    const nonCreditActiveAccounts = activeAccounts.filter(
      (account) => !isCreditLikeAccountType(account.type),
    );
    const creditActiveAccounts = activeAccounts.filter((account) =>
      isCreditLikeAccountType(account.type),
    );

    const allIncomeCategories = (
      allIncomeCategoriesState.status === "success"
        ? allIncomeCategoriesState.data
        : []
    )
      .slice()
      .sort(bySource);
    const normalIncomeCategories = (
      normalIncomeCategoriesState.status === "success"
        ? normalIncomeCategoriesState.data
        : []
    )
      .slice()
      .sort(bySource);

    const expenseCategories = (
      expenseCategoriesState.status === "success"
        ? (expenseCategoriesState.data as ExpenseCategory[])
        : []
    )
      .slice()
      .sort(byName);

    const accountNameById = new Map(allAccounts.map((a) => [a.id, a.name]));
    const incomeCategoryNameById = new Map(
      allIncomeCategories.map((c) => [c.id, c.source]),
    );
    const expenseCategoryNameById = new Map(
      expenseCategories.map((c) => [c.id, c.name]),
    );

    const referenceLoading =
      accountsState.status === "loading" ||
      allIncomeCategoriesState.status === "loading" ||
      normalIncomeCategoriesState.status === "loading" ||
      expenseCategoriesState.status === "loading";

    return {
      allAccounts,
      activeAccounts,
      nonCreditActiveAccounts,
      creditActiveAccounts,
      allIncomeCategories,
      normalIncomeCategories,
      expenseCategories,
      accountNameById,
      incomeCategoryNameById,
      expenseCategoryNameById,
      referenceLoading,
      refreshReferenceData,
    };
  }, [
    accountsState,
    allIncomeCategoriesState,
    normalIncomeCategoriesState,
    expenseCategoriesState,
    refreshReferenceData,
  ]);

  return (
    <FinanceDataContext.Provider value={value}>
      {children}
    </FinanceDataContext.Provider>
  );
}

export function useFinanceData(): FinanceReferenceData {
  const ctx = useContext(FinanceDataContext);
  if (!ctx) {
    throw new Error("useFinanceData must be used within a FinanceDataProvider");
  }
  return ctx;
}
