# Borrowings (money you owe)

Desktop-only section. It uses the existing Income and Income Categories databases. Loan terms (below) add four Income columns locally and four Notion Income properties. It is separate from Receivables (money owed *to* you).

## Setup

1. In Notion Income Categories create one category with `Source of Income` exactly **Borrowed Money**, then sync categories. The app treats it as auxiliary, so it never appears in Income totals or Monthly Monitoring.
2. Create one or more accounts of type **Auxiliary** whose name contains **borrow**, **debt**, **loan**, **utang** or **hiram**, e.g. "Borrowed Money", "Debt/Loan" or "Borrowed – Ana" (the Borrow accounts). Other Auxiliary accounts such as "Auxiliary & Rewards" are ignored. It is the placeholder for everything you owe; its balance is the negative of what is still owed.

## Storage

One Income row per event, stored like a Transfer (negative gross on `Account`, credited to `Transacted Account`):

| Event | Account | Transacted Account | Effect |
| --- | --- | --- | --- |
| Borrowed ₱1,000 into Bank | Borrow (Auxiliary) | Bank | Borrow −1,000; Bank +1,000 |
| Repaid ₱400 from Bank | Bank | Borrow (Auxiliary) | Bank −400; Borrow +400 |

The form shows Type (Borrowed / Repayment), Borrow Account, and Received Into / Paid From with a positive amount; main stores the signed row. Type is derived from which side is the Auxiliary account. The table mirrors the Transfer layout and shows the signed effect on each side: `Date, Name, Type, Borrow Account, Borrowed Amount, Other Account, Other Amount`. Borrowed ₱1,000 into Home Wallet reads −₱1,000 on the Borrow account and +₱1,000 on Home Wallet; a ₱1,000 repayment reads +₱1,000 and −₱1,000. The footer **Net** sums both columns, so a negative Borrowed Amount total is what is still owed. The filter bar has a **Type** filter (All / Borrowed / Repayment), and a **Borrow Accounts** panel lists every Borrow account with its still-owed balance.

`Borrowed Money` is added to the local transaction-category tokens (`shared/notion-formulas.ts`). A Notion-side Current Balance formula that only matches transfer / credit card payment / debit payment will not credit the Transacted Account for this category until its token list is extended; the desktop app computes balances locally.

## Creating records and paying borrowed money

**New Record** first asks what you are adding: **Borrow** or **Repayment**. The choice pre-configures the form (type, title `Borrow: ` / `Repayment: `, today's date, first Borrow account), and everything else can still be adjusted. Open a Borrowed row and choose **Record repayment** to prefill a repayment with the full borrowed amount; lower it for a partial payment. Each payment is its own Repayment row, so history stays visible.

The filter bar separates **Borrow Account** and **Other Account** (plus Type). Transfer filters Source Account and Transfer Account (non-credit accounts only); CC Payment filters CC Account (credit accounts only) and Payer Account (non-credit accounts only).

## Loan terms

A Borrowed row can carry optional **Loan terms**: **Interest** (flat total, not a rate), **Payment Frequency** and **Period count**. They are optional as a group: a loan with none behaves exactly as before, and Period count needs a Payment Frequency (and the reverse). Interest alone is allowed. Interest is never an expense: it creates no row and never reaches Expense totals, budgets or Monitoring. See `docs/adr/0007-loan-interest-inside-the-borrowing.md`.

A repayment can be **linked** to its loan, from either side, like a Notion relation. Any Borrowed row can be linked, with or without Loan terms. The Repayment form has a **Loan** picker listing every Borrowed row on the chosen Borrow account (or "Not linked to a loan"); an existing link stays selectable and is kept on unrelated edits. **Record repayment** on a loan prefills the smaller of the Suggested payment and the Remaining balance (the Remaining balance when there is no Period count; empty when paid off) and the link, and the amount stays editable. A Borrowed row's edit form has a **Payments** multi-select, the same pattern as Covered Expenses on a CC Payment: repayments on the same Borrow account (label name and date, sublabel amount) plus a computed **Total paid**. Saving links every selected repayment and unlinks the deselected ones; the read-only modal lists them. A payment links to one loan only, so repayments already linked to a different loan are not offered. Both entry points set the same single stored link (`Linked Borrowing` in Notion). Main validation accepts a link to any live Borrowed row and rejects itself, a repayment and a missing row.

A Borrowed row **without** Loan terms but with linked repayments is read as a loan with Interest 0: it shows Paid amount, Payments made and Remaining balance (principal minus payments, never below 0) and no Suggested payment. A Borrowed row with neither terms nor links is unchanged.

Computed per loan (never stored, ADR-0004), from `computeLoanSummary` in `shared/borrowings.ts`:

| Figure | Rule |
| --- | --- |
| Total owed | principal + Interest |
| Suggested payment | Total owed / Period count; shown only for a positive whole Period count; a guide, never enforced |
| Paid amount | sum of linked, non-deleted repayments |
| Payments made | count of those repayments |
| Remaining balance | max(0, Total owed − Paid amount); an overpayment shows 0 |

Example: ₱150,000 with ₱5,000 interest, Monthly, 12 periods owes ₱155,000 with a Suggested payment of ₱12,916.67; after one linked ₱12,916.67 payment the Remaining balance is ₱142,083.33. The record modal shows all five figures and the table has a **Remaining balance** column (a dash for loans without terms and for repayments). Balances use every Borrowings record, not only the selected date range.

The **Borrow Accounts** panel's still-owed per account is `stillOwedForBorrowAccount`: the Remaining balance of each loan (a Borrowed row with terms or with linked repayments) plus the old balance-based amount for the rest. Repayments with no link count against that old amount. The Borrow account's raw balance stays principal-based.

## Receivables types

Receivables is filtered by a **Type** dropdown in the filter bar (default All): **Expected Income** (no account needed), **Money Lent** (loans with a source account, repayment flow in [money-lent.md](money-lent.md)), and **Pasabuy** (paid credit-card Pasabuy expenses awaiting payment). Totals, selection and the receipt follow the selected type. **New Record** asks **Lend Money** or **Expected Income** first.

Tests: `test/borrowings.test.ts`, `components/pages/workflow.test.tsx`, `test/chat-borrowings.test.ts`; end-to-end: `e2e/borrowing-terms.spec.ts`.
