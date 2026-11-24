// filter-options: sentinel ids for the "combined" filter dropdown options. They are never
// stored on a record; the UI picks one and the list code expands it. Shared so the renderer
// (labels, dropdowns) and the main process (list query) cannot drift apart.

/** Expense payment status: every status that is still owed (Unpaid + Installment). */
export const NON_PAID_STATUSES_FILTER = '__non-paid__'
/** Expense Pasabuy status: every status except "Payment fully received". */
export const NON_FULLY_RECEIVED_FILTER = '__non-fully-received__'

/** Transfer / CC Payment account filters. */
export const EXCLUDE_EMPTY_TRANSFER_ACCOUNT = '__exclude-empty-transfer__'
export const EXCLUDE_NON_CREDIT_ACCOUNT = '__exclude-non-credit__'
export const EXCLUDE_EMPTY_PAYER_ACCOUNT = '__exclude-empty-payer__'

const NON_PAID = new Set(['Unpaid', 'Installment'])

/** True when an expense's payment status passes the (possibly combined) filter value. */
export function matchesPaymentStatusFilter(status: string | null | undefined, filter: string): boolean {
  if (filter === NON_PAID_STATUSES_FILTER) return NON_PAID.has(status ?? '')
  return status === filter
}

/** True when an expense's Pasabuy status passes the (possibly combined) filter value. */
export function matchesPasabuyStatusFilter(status: string | null | undefined, filter: string): boolean {
  if (filter === NON_FULLY_RECEIVED_FILTER) return !!status && status !== 'Payment fully received'
  return status === filter
}
