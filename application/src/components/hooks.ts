"use client";

import { useFinanceData } from "@/lib/finance-data-context";
import { calculateCategoryTotalOverview } from "@/lib/finance-rules";
import { getExpenseTotal, getIncomeCapitalExpenditureTotal, getIncomeGrossTotal, getIncomeNetTotal } from "@/lib/finance-helpers";
import { formatPercent } from "@/lib/format";
import { expenseCategoryFilterWithoutPasabuy } from "@/components/constants";
import type { ExpenseCategory, ExpenseRecord, FinanceSectionId, IncomeCategory, IncomeRecord, WorkflowSectionId } from "@/types/finance";

function isSpecificExpenseCategoryFilter(value: string) {
  return value !== "" && value !== expenseCategoryFilterWithoutPasabuy;
}

// Reference data (accounts + categories) is fetched once by FinanceDataProvider
// and shared via context. This thin alias keeps existing call sites unchanged.
// See src/lib/finance-data-context.tsx.
function useLiveCollections() {
  return useFinanceData();
}

function getIncomeCategorySummaries(
  records: IncomeRecord[],
  categories: IncomeCategory[],
) {
  const totalNetIncome = getIncomeNetTotal(records);

  return categories.map((category) => {
    const categoryRecords = records.filter((record) => record.categoryId === category.id);
    const grossIncome = getIncomeGrossTotal(categoryRecords);
    const capitalExpenditure = getIncomeCapitalExpenditureTotal(categoryRecords);
    const netIncome = getIncomeNetTotal(categoryRecords);

    return {
      id: category.id,
      source: category.source,
      grossIncome,
      capitalExpenditure,
      netIncome,
      earningPercentage: calculateCategoryTotalOverview(netIncome, totalNetIncome),
    };
  });
}

function getExpenseCategorySummaries(records: ExpenseRecord[], categories: ExpenseCategory[]) {
  const totalExpense = getExpenseTotal(records);

  return categories
    .filter((category) => category.auxiliary === "No")
    .map((category) => {
      const categoryRecords = records.filter((record) => record.categoryId === category.id);
      const spending = getExpenseTotal(categoryRecords);
      const remaining = category.monthlyBudget - spending;
      const usage = calculateCategoryTotalOverview(spending, category.monthlyBudget);

      return {
        id: category.id,
        name: category.name,
        monthlyBudget: category.monthlyBudget,
        upcomingBudget: category.upcomingBudget,
        auxiliary: category.auxiliary,
        spending,
        remaining,
        overview: `${formatPercent(usage)} used`,
        totalOverview: calculateCategoryTotalOverview(spending, totalExpense),
      };
    });
}

function isWorkflowSection(section: FinanceSectionId): section is WorkflowSectionId {
  return (
    section === "transfer" ||
    section === "credit-card-payment" ||
    section === "alkansya" ||
    section === "receivables"
  );
}

export { useLiveCollections, getIncomeCategorySummaries, getExpenseCategorySummaries, isWorkflowSection, isSpecificExpenseCategoryFilter };

import { useState, useEffect } from "react";

/**
 * Debounce a rapidly changing value (e.g. text input) so downstream consumers
 * (API queries, expensive filtering) only fire after `delayMs` of inactivity.
 *
 * Usage:
 * ```tsx
 * const [query, setQuery] = useState("");
 * const debouncedQuery = useDebounce(query, 300);
 * // debouncedQuery updates 300ms after the user stops typing
 * ```
 */
function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
}

export { useDebounce };
