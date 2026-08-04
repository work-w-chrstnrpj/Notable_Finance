import type { MassEditFieldOption } from "@/components/ui/mass-edit-modal";
import type { Account, IncomeCategory } from "@/types/finance";

/**
 * Field catalogue for the Income bulk-edit modal (refactor_development_plan.md Phase 5.2 —
 * same pattern as buildExpenseMassEditFields in Phase 4.4).
 */
export function buildIncomeMassEditFields(
  nonCreditActiveAccounts: Account[],
  normalIncomeCategories: IncomeCategory[],
): MassEditFieldOption[] {
  return [
    { key: "date", label: "Date", kind: "date" },
    { key: "grossIncome", label: "Gross Income", kind: "number" },
    { key: "capitalExpenditure", label: "Capital Expenditure", kind: "number" },
    {
      key: "accountId",
      label: "Accounts",
      kind: "select",
      clearable: true,
      emptyLabel: "— None —",
      options: nonCreditActiveAccounts.map((a) => ({ value: a.id, label: a.name })),
    },
    {
      key: "categoryId",
      label: "Categories",
      kind: "select",
      clearable: true,
      emptyLabel: "— None —",
      options: normalIncomeCategories.map((c) => ({ value: c.id, label: c.source })),
    },
  ];
}
