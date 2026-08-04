import { formatMoney } from "@/lib/format";
import type { ReceiptContext, ReceiptRow } from "@/lib/fab-export-context";

/**
 * Assemble a printable `ReceiptContext` from a record list.
 *
 * Three sites built this by hand with the same shape (refactor_development_plan.md F2):
 * Expense's FAB receipt (all enabled rows), Expense's bulk "print" action (selected rows),
 * and Workflow's Receivables receipt. What they share is exactly this: drop excluded rows,
 * map each to a `ReceiptRow`, sum a per-record value, and format the total.
 *
 * What they *don't* share — which value a row reports (amount vs installment vs remaining
 * balance vs pasabuy balance) and the extra installment breakdown fields — stays with the
 * caller via `toRow` / `valueOf`, rather than being pulled in here as view-mode branching.
 */
export function buildReceipt<T extends { id: string }>({
  records,
  excludeIds,
  viewTitle,
  periodLabel,
  amountHeader = "Amount",
  toRow,
  valueOf,
  installmentLayout,
}: {
  records: T[];
  /** Rows the user has locally "disabled"; omitted from both rows and the total. */
  excludeIds?: Set<string>;
  viewTitle: string;
  periodLabel: string;
  amountHeader?: string;
  toRow: (record: T) => ReceiptRow;
  valueOf: (record: T) => number;
  installmentLayout?: boolean;
}): ReceiptContext {
  const included = excludeIds ? records.filter((r) => !excludeIds.has(r.id)) : records;

  return {
    viewTitle,
    periodLabel,
    amountHeader,
    rows: included.map(toRow),
    total: formatMoney(included.reduce((sum, record) => sum + valueOf(record), 0)),
    installmentLayout,
  };
}
