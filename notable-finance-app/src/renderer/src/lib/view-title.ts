import type { ExpenseViewMode, IncomeViewMode } from "@/types/finance";

/** The period word in a page title: the same adjective forms Monitoring uses. */
const PERIOD_WORD: Record<IncomeViewMode, string> = {
  Daily: "Daily",
  Weekly: "Weekly",
  Monthly: "Monthly",
  Quarterly: "Quarterly",
  "Semi-Annually": "Semi-Annual",
  Annually: "Annual",
  "All Records": "All Records",
};

/** Expense views that are not a period, with the title each one shows. */
const EXPENSE_VIEW_TITLE: Partial<Record<ExpenseViewMode, string>> = {
  Pasabuy: "Pasabuy Expenses",
  "CC Transaction": "Credit Card Expenses",
  Installments: "Installments",
  "To pay": "To Pay",
  "To buy": "To Buy",
};

/**
 * "Daily Income", "Semi-Annual Transfer", "All Income Records". Views that are not a
 * period (Expense's To pay, Pasabuy, …) show their own name, e.g. "Pasabuy Expenses".
 */
export function periodPageTitle(page: string, viewMode: IncomeViewMode | ExpenseViewMode): string {
  const own = page === "Expense" ? EXPENSE_VIEW_TITLE[viewMode as ExpenseViewMode] : undefined;
  if (own) return own;
  const word = PERIOD_WORD[viewMode as IncomeViewMode];
  if (!word) return page;
  return viewMode === "All Records" ? `All ${page} Records` : `${word} ${page}`;
}
