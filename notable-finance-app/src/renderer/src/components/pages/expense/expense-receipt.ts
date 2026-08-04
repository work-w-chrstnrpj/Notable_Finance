import { buildReceipt } from "@/features/records/receipt";
import { getMonthLabel, stripNotionTag } from "@/lib/finance-helpers";
import { anchorMonth } from "@/lib/date-range";
import { formatMoney, formatDate } from "@/lib/format";
import type { ReceiptContext } from "@/lib/fab-export-context";
import type { ExpenseRecord, ExpenseViewMode } from "@/types/finance";
import type { ExpenseComputed } from "./expense-tables";

/**
 * Receipt builder for the Expense page (refactor_development_plan.md Phase 4.4).
 *
 * Shared by the FAB receipt (all enabled rows) and the bulk "print" action (selected rows) —
 * the two used to carry identical copies of the view-mode value mapping and the installment
 * breakdown. Which records go in is the only difference, so that stays the caller's choice.
 */
export function makeExpenseReceiptBuilder({
  viewMode,
  selectedDate,
  derive,
}: {
  viewMode: ExpenseViewMode;
  selectedDate: string;
  derive: (record: ExpenseRecord) => ExpenseComputed;
}) {
  return function buildExpenseReceipt(
    records: ExpenseRecord[],
    excludeIds?: Set<string>,
  ): ReceiptContext {
    const isInstallment = viewMode === "Installments";
    const receiptValue = (record: ExpenseRecord): number => {
      if (isInstallment) return derive(record).installment ?? 0;
      if (viewMode === "Unpaid CC") return derive(record).remaining;
      if (viewMode === "Unpaid Pasabuy") return record.pasabuyBalance ?? 0;
      return record.amount;
    };
    return buildReceipt({
      records,
      excludeIds,
      viewTitle: `${viewMode} Expenses`,
      periodLabel: getMonthLabel(anchorMonth(selectedDate)),
      amountHeader: isInstallment ? "Installment Amount" : "Amount",
      installmentLayout: isInstallment || undefined,
      valueOf: receiptValue,
      toRow: (record) => {
        const base = {
          date: formatDate(record.purchaseDate),
          description: stripNotionTag(record.description),
          amount: formatMoney(receiptValue(record)),
        };
        if (!isInstallment) return base;
        const c = derive(record);
        return {
          ...base,
          grossAmount: formatMoney(c.gross),
          paidAmount: formatMoney(c.paid),
          remainingBalance: formatMoney(c.remaining),
          installmentAmount: c.installment != null ? formatMoney(c.installment) : "—",
          expectedPaymentDate: c.expected ? formatDate(c.expected) : "—",
        };
      },
    });
  };
}
