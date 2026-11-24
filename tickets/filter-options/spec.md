# Spec: Extra filter options for Transfer, CC Payment and Expense

**Status:** ready-for-agent
**Owner:** work-w-chrstnrpj

## Problem Statement
Records with a missing account (or a non-credit account on a CC Payment) clutter the Transfer and CC Payment pages, and the Expense page cannot show "everything still unpaid" or "every Pasabuy not yet fully received" in one pick. The owner has to choose one status at a time and mentally combine the results.

## Solution
Add five filter options, each placed first in its dropdown under the "All ..." placeholder:

1. Transfer, second account filter ("All Transfer Accounts"): **Exclude Empty Transfer Account**. Shows only records that have a transfer account.
2. CC Payment, first account filter ("All CC Accounts"): **Exclude Non Credit Account**. Shows only records whose CC account is set and is a credit-type account.
3. CC Payment, second account filter ("All Payer Accounts"): **Exclude Empty Payer Account**. Shows only records that have a payer account.
4. Expense, payment status filter: **All non-paid statuses**. Matches Unpaid and Installment (not Cancelled, not Paid).
5. Expense, Pasabuy payment status filter: **All non-payment fully received**. Matches "Payment not yet receive", "Payment partially received" and "Payment partially received (installment)".

## User Stories
1. As the owner, I want to hide Transfers with no transfer account, so that I only review complete transfers.
2. As the owner, I want to hide CC Payments whose CC account is empty or not a credit account, so that the list only holds real card payments.
3. As the owner, I want to hide CC Payments with no payer account, so that I can see which payer funded each payment.
4. As the owner, I want one option for every unpaid-ish expense (Unpaid + Installment), so that I do not pick statuses one by one.
5. As the owner, I want one option for every Pasabuy whose payment is not fully received, so that I can chase the remaining ones.
6. As the owner, I want these options to appear only where their filter already shows, so that views like To pay and Installments stay unchanged.
7. As the owner, I want my chosen option to survive a restart like other filters, and a clear-filters action to reset it.

## Implementation Decisions
- Each option is a sentinel id in the existing dropdown, following the existing `__none__` / `__credit__` pattern. Sentinels: empty-transfer-excluded, non-credit-excluded, empty-payer-excluded (Transfer/CC Payment, matched in the workflow page's account filter), non-paid and non-fully-received (Expense, matched where the status filters already reach the main-process list query).
- Transfer and CC Payment: matching is by presence of `transactedAccountId` (second filter) and by `accountId` resolving to a credit-type account (CC filter). Account type is read from the accounts already loaded in the renderer.
- Expense: the status sentinels expand to a set of statuses in the list query's filter, not a new column. The status labels stay the single source in the finance rules. The options appear only under the existing gates: payment status is hidden in To pay and Installments; Pasabuy status shows only in the Pasabuy view or with a Pasabuy category selected.
- Derived values stay computed, not stored (ADR-0004). No schema, Notion or migration change. Saved filter values stay valid strings in UI settings.
- Option labels use the owner's exact wording.

## Testing Decisions
- Seams: (a) the Workflow page (Transfer and CC Payment) through the rendered filter row, and (b) the Expense page toolbar plus the expense list query through the rendered page and the IPC filter. Fewer seams, highest level.
- Good tests assert visible rows after picking an option, and that the option is absent in gated views. They do not assert internals.
- Prior art: `income-filter-order.test.tsx`, `accounts-filter-toggle.test.tsx`, `expense.test.tsx`, `receivables-pasabuy.test.tsx`, `workflow.test.tsx`. Playwright e2e is not part of `npm test` (see memory: UI text changes can break e2e), so grep e2e for the changed labels.

## Inputs
None under `docs/inputs`.

## Out of Scope
- Cancelled expenses in "All non-paid statuses".
- New options for Income, Borrowings, Receivables or Alkansya.
- Any new filter control, toggle or sort.

## Further Notes
- Open check for the builder: confirm whether Unpaid Pasabuy and Unpaid CC views show the payment status filter today. If they do and already restrict by status, hide the new option there. Otherwise keep the existing gate unchanged.
- Add the filter terms to `GLOSSARY.md` only if a term turns out fuzzy; none did in the grilling.
