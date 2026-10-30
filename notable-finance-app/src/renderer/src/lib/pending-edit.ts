/**
 * Lightweight mechanism for the History page to signal another page
 * (expense, income, or workflow) to auto-open the edit modal for a specific record.
 *
 * Usage from History:
 *   setPendingEdit("expenses", recordId);
 *   navigate("/expense");
 *
 * Usage from ExpensePage / IncomePage / WorkflowPage:
 *   useEffect(() => {
 *     const pending = consumePendingEdit(resource);
 *     if (pending) openModal("edit", pending.recordId);
 *   }, []);
 */

export type PendingEditResource = "expenses" | "incomes" | "transfers" | "creditCardPayments" | "alkansya" | "receivables";

let _pending: { resource: PendingEditResource; recordId: string; payload?: unknown } | null = null;

export function setPendingEdit(resource: PendingEditResource, recordId: string, payload?: unknown): void {
  _pending = { resource, recordId, payload };
}

export function consumePendingEdit(resource: PendingEditResource): { recordId: string; payload?: unknown } | null {
  if (_pending && _pending.resource === resource) {
    const result = { recordId: _pending.recordId, payload: _pending.payload };
    _pending = null;
    return result;
  }
  return null;
}

export function clearPendingEdit(): void {
  _pending = null;
}
