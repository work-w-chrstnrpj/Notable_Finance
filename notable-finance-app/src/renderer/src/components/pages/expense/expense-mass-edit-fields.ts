import type { MassEditFieldOption } from "@/components/ui/mass-edit-modal";
import {
  pasabuyerLabels,
  pasabuyStatusLabels,
  paymentFrequencyLabels,
  paymentStatusLabels,
} from "@/lib/finance-rules";
import type { Account, ExpenseCategory } from "@/types/finance";

/**
 * Field catalogue for the Expense bulk-edit modal (refactor_development_plan.md Phase 4.4).
 * Pure configuration — extracted from expense/index.tsx unchanged so the page file is
 * composition rather than a mix of composition and a 60-line data literal.
 */
export function buildExpenseMassEditFields(
  activeAccounts: Account[],
  expenseCategories: ExpenseCategory[],
): MassEditFieldOption[] {
  return [
      { key: "purchaseDate", label: "Purchase Date", kind: "date" },
      { key: "datePaid", label: "Date Paid", kind: "optionalDate", emptyLabel: "— Clear —" },
      { key: "amount", label: "Expense Amount", kind: "number" },
      { key: "interest", label: "Interest", kind: "number" },
      {
        key: "accountId",
        label: "Accounts",
        kind: "select",
        options: activeAccounts.map((a) => ({ value: a.id, label: a.name })),
      },
      {
        key: "categoryId",
        label: "Categories",
        kind: "select",
        options: expenseCategories.map((c) => ({ value: c.id, label: c.name })),
      },
      {
        key: "paymentStatus",
        label: "Payment Status",
        kind: "select",
        options: paymentStatusLabels.map((s) => ({ value: s, label: s })),
      },
      {
        key: "paymentFrequency",
        label: "Payment Frequency",
        kind: "select",
        clearable: true,
        emptyLabel: "— None —",
        options: paymentFrequencyLabels.map((f) => ({ value: f, label: f })),
      },
      { key: "periodCount", label: "Period Count", kind: "optionalNumber" },
      { key: "paidPeriod", label: "Paid Period", kind: "optionalNumber" },
      {
        key: "pasabuyer",
        label: "Pasabuyer",
        kind: "select",
        clearable: true,
        emptyLabel: "— None —",
        options: pasabuyerLabels.map((p) => ({ value: p, label: p })),
      },
      {
        key: "pasabuyStatus",
        label: "Pasabuy Status",
        kind: "select",
        clearable: true,
        emptyLabel: "— None —",
        options: pasabuyStatusLabels.map((s) => ({ value: s, label: s })),
      },
      {
        key: "pasabuyDateOfPayment",
        label: "Pasabuy Date of Payment",
        kind: "optionalDate",
      },
      { key: "pasabuyPaidPeriod", label: "Pasabuy Paid Period", kind: "optionalNumber" },
      {
        key: "pasabuyAccountReceiverId",
        label: "Pasabuy Account Receiver",
        kind: "select",
        clearable: true,
        emptyLabel: "— None —",
        options: activeAccounts.map((a) => ({ value: a.id, label: a.name })),
      },
  ];
}
