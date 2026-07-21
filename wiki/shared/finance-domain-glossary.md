# Finance Domain Glossary

Terms used across both apps. Definitions are derived from the existing web product specification, the field mapping, and the live Notion `Accounts '25` schema — **not invented**. Where a term is a specific Notion select label, it is preserved exactly.

## Core entities

| Term | Meaning |
| --- | --- |
| **Account** | A place money lives or is owed. Read-only reference maintained in Notion. Has a writable `Starting Balance` and (for credit) `Credit Limit`; its `Current Balance` and `Available Limit` are computed. |
| **Income** | A record of money received. Normal income displays `Gross Income`, `Capital Expenditure`, and an app-computed `Net Income` (`Gross Income − Capital Expenditure`). |
| **Expense** | A record of money spent. Amount plus optional `Interest`. Adapts fields by account and category (credit-card fields, Pasabuy fields). |
| **Transaction** | An income-shaped record that also carries transaction-only fields such as `Transacted Account` and `CC Payment Covered`. |
| **Income Category** | Read-only reference categorizing income. Auxiliary categories (`IOU`, `Transfer`, `Old Income Logger`, `Credit Card Payment`, `Debt Payment`) are excluded from normal income forms. |
| **Expense Category** | Read-only reference categorizing expense, with a `Monthly Budget` used to compute spending/remaining. |
| **Expense Scheduler** | Recurring/planned expenses that generate expense records. |
| **Monthly Monitoring** | A read-focused monitoring section. App reporting is calculated from scoped Income/Expense records, not from Notion's Monthly Monitoring formulas/rollups. |

## Account types (Notion `Account Type` select — exact labels)

`Cash`, `Credit Account`, `Debit`, `Savings Account`, `e-Wallet`, `Digital Bank`, `BYPL`, `Auxiliary`.

- **Credit-like** accounts (`Credit Account`, `BYPL`) expose credit-card fields and use `Credit Limit` / `Available Limit`.

## App sections & workflows

| Term | Meaning |
| --- | --- |
| **Dashboard** | Overview of balances and monthly figures, computed from scoped records. |
| **Transfer** | A monthly workflow moving funds between accounts, with fixed non-editable category values and context-filtered account selectors. |
| **Credit Card Payment** | A monthly workflow paying a credit account, with fixed category values and payment-context account selectors. |
| **Alkansya** | Savings workflow. Uses the `Savings` category with **negative** amount values (money set aside). |
| **Pasabuy** | A "buy on behalf of someone" workflow. Unpaid Pasabuy records can be filtered by `Pasabuyer`. Expense forms show Pasabuy fields only in Pasabuy flows. |
| **Receivables** | Money owed to the user. Uses normal Income-style fields; moves to Income logs when a receiving account is selected. |

## Money & computation terms

| Term | Meaning |
| --- | --- |
| **Starting Balance** | Writable per-account opening balance (₱). A sync **input**. |
| **Credit Limit** | Writable per-credit-account limit (₱). A sync **input**. |
| **Current Balance** | Computed. Non-credit: `Starting Balance + Total Incomes − Total Expenses`. Credit: outstanding = charges + interest − payments. Recomputed locally on desktop. |
| **Available Limit** | Computed for credit accounts: `Credit Limit − outstanding`. |
| **Net Income** | Computed: `Gross Income − Capital Expenditure`. |
| **Capital Expenditure** | Portion of gross income treated as capital outlay; subtracted to yield net income. |
| **Interest** | Extra amount on an expense (e.g. credit interest); included in expense totals. |
| **Monthly Budget** | Per-expense-category budget; `remaining = Monthly Budget − spending`. |
| **Soft delete** | Marking an income/expense deleted by rewriting its title to `[Deleted: Amount]` and clearing the amount. No hard delete. |

## Sync terms (desktop)

| Term | Meaning |
| --- | --- |
| **Source of truth** | The store considered authoritative. Web: Notion. Desktop: local SQLite. |
| **Writable field** | A field the app may write to Notion (an input). |
| **Computed field** | A formula/rollup/relation/system field. Never written; derived or cached. |
| **Base snapshot** | The version of a record at the last successful sync — the common ancestor for three-way merge. |
| **Dirty** | A local record changed since the last successful push. |
| **Tombstone / soft-delete** | A record marked deleted; propagated as a title rewrite, not a row removal. |
| **Reconcile** | A sync pass comparing base/local/remote and applying push/pull/merge/conflict outcomes. |
