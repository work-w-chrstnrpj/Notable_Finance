# Borrowings (money you owe)

Desktop-only section. It uses the existing Income and Income Categories databases, with no new table or Notion property. It is separate from Receivables (money owed *to* you).

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

## Receivables types

Receivables is filtered by a **Type** dropdown in the filter bar (default All): **Expected Income** (no account needed), **Money Lent** (loans with a source account, repayment flow in [money-lent.md](money-lent.md)), and **Pasabuy** (paid credit-card Pasabuy expenses awaiting payment). Totals, selection and the receipt follow the selected type. **New Record** asks **Lend Money** or **Expected Income** first.

Tests: `test/borrowings.test.ts`, `components/pages/workflow.test.tsx`.
