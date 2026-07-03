# Data Model

## Data Storage Overview

Notion is the canonical store for finance records. The app metadata store is planned from the start for sync logs, pending mutations, conflicts, audit events, sessions if needed, and cached snapshots. PostgreSQL is the recommended durable app metadata store. Redis may be added later for cache, rate limits, short-lived sessions, or queue coordination if implementation needs it. Those stores are supporting state only.

## Canonical Notion Data Sources

| App Entity | Notion Data Source | Data Source ID |
| --- | --- | --- |
| Account | Accounts '25 | `2893edac-dc7a-4d42-a890-80f5b0490549` |
| IncomeCategory | Income Categories '25 | `11a77f65-247b-417a-bd8f-1c95417a88ff` |
| Income | Incomes '25 | `d29d9b37-8b7a-42ff-ba4d-ff4d875d74ef` |
| Transaction | View of Incomes '25 | `d29d9b37-8b7a-42ff-ba4d-ff4d875d74ef` |
| ExpenseCategory | Expense Categories '25 | `2aff8687-0cc5-4630-97d6-1658532b584c` |
| Expense | Expenses '25 | `d55c679f-5db7-4938-be9d-ceb147ad8d3d` |
| ExpenseScheduler | View of Expenses '25 | `d55c679f-5db7-4938-be9d-ceb147ad8d3d` |
| MonthlyMonitoring | Monthly Monitoring DB '25 | `9be2188b-4e29-47a2-88da-a2ba420cae12`; read-focused app section |

## Field Access Legend

| Access | Meaning |
| --- | --- |
| `write` | App may create/update this Notion field. |
| `readOnly` | App may display this field but must not update it. |
| `computed` | Notion formula, rollup, reverse relation, or derived value. Display only. |
| `hidden` | Internal or advanced field hidden from normal UI. |
| `none` | No user-facing create/edit exposure for this entity in MVP. |

## Accounts

| Notion Field | Type | Access | Notes |
| --- | --- | --- | --- |
| `Account Name` | title | write | Primary account name. |
| `Account Type` | select | write | Cash, Credit Account, Debit, Savings Account, e-Wallet, Digital Bank, BYPL, Auxiliary. |
| `Account Information` | text | write | Optional details. |
| `Starting Balance` | number | write | Initial balance. |
| `Credit Limit` | number | write | Mainly for credit accounts. |
| `Credit Points` | number | write | Reward/point tracking if used. |
| `Annual Fee` | number | write | Card/account annual fee. |
| `Billing Day` | number | write | Day of month. |
| `Due Day` | number | write | Day of month. |
| `Inactive` | checkbox | write | Hide inactive accounts from normal selects. |
| `Income Label` | text | write | Label helper if still used. |
| `Expense Label` | text | write | Label helper if still used. |
| `Balance Label` | text | write | Label helper if still used. |
| `Incomes` | relation | readOnly | Reverse/related records. |
| `Expenses` | relation | readOnly | Reverse/related records. |
| `CC, Debt or Transfer` | relation | readOnly | Related income records. |
| `Pasabuy` | relation | readOnly | Related expense records. |
| `Current Balance` | formula | computed | Display only. |
| `Available Limit` | formula | computed | Display only. |
| `Total Expenses` | rollup | computed | Display only. |
| `Total Incomes` | rollup | computed | Display only. |
| `Total CC, Debt & Transfer` | rollup | computed | Display only. |
| `Total Credit Interest` | rollup | computed | Display only. |
| `Total Pasabuy` | rollup | computed | Display only. |

Account delete behavior: mark the account inactive by setting `Inactive`; do not physically delete account records.

Default account views should show active accounts only. The app should provide gallery/card and table views. Account create/edit forms should adapt to `Account Type`; credit-specific fields are only shown when the type needs them, especially `Credit Account` and `BYPL`.

## Income Categories

| Notion Field | Type | Access | Notes |
| --- | --- | --- | --- |
| `Source of Income` | title | write | Category/source name. |
| `Incomes` | relation | readOnly | Related income records. |
| `toCalculator` | relation | readOnly | Monthly monitoring relation. |
| `Monthly Earnings` | formula | computed | Display only. |
| `Monthly Expenditure` | rollup | computed | Display only. |
| `Monthly Gross Earnings` | rollup | computed | Display only. |
| `Monthly Net Income` | rollup | computed | Display only. |
| `Total Monthly Income` | rollup | computed | Display only. |
| `Earning Percentage` | formula | computed | Display only. |

Normal Income category pickers must exclude auxiliary workflow categories. Current Notion view evidence identifies the auxiliary income labels as `IOU`, `Transfer`, `Old Income Logger`, `Credit Card Payment`, and `Debt Payment`.

## Incomes

| Notion Field | Type | Access | Notes |
| --- | --- | --- | --- |
| `Name` | title | write | Income record title. |
| `Date` | date | write | Income date. |
| `Gross Income` | number | write | Main income amount. |
| `Capital Expenditure` | number | write | Deduction/capital spending. |
| `Accounts` | relation | write | Primary account relation. |
| `Categories` | relation | write | Income category relation. |
| `Transacted Account` | relation | write | Transfer/transaction account relation. |
| `CC Payment Covered` | relation | write | Expense payment receipt relation when needed. |
| `Net Income` | formula | computed | Display only. |
| `Transaction Amount` | formula | computed | Display only. |
| `Monthly Capital Expenditure Sorter` | formula | computed | Hidden from normal UI. |
| `Monthly Net Sorter` | formula | computed | Hidden from normal UI. |
| `Monthly Gross Sorter` | formula | computed | Hidden from normal UI. |
| `Sum of CC Covered Overview` | rollup | computed | Display only if useful. |

Delete behavior: update `Name` to `Original Name [Deleted: 1234.56]` using the current `Gross Income` value, then clear `Gross Income`.

Normal Income forms should not expose every writable Incomes field. They should show income-related fields only: `Name`, `Date`, `Gross Income`, `Capital Expenditure`, `Accounts`, and `Categories`. `Transacted Account` and `CC Payment Covered` remain writable only for specialized transaction workflows such as transfer and credit card payment.

## Transactions

Transactions are app workflows backed by the Incomes data source and Transaction views. They use the same field contract as Incomes.

Known Transaction views include transfer, credit card payment, debt payment, receivables, Alkansya, and related transaction views. The implementation should treat these as filtered workflows over Incomes, not as a separate canonical data source.

Workflow-specific rules:

- Transfer uses the `Transfer` category automatically and does not allow the user to change it.
- Credit Card Payment uses the `Credit Card Payment` category automatically and does not allow the user to change it.
- Transfer and credit card payment workflows include the transacted account/payment-through account context that normal Income forms hide.
- Alkansya and Receivables are Monthly transaction-style workflows unless implementation discovery remaps them.

Delete behavior follows Incomes.

## Expense Categories

| Notion Field | Type | Access | Notes |
| --- | --- | --- | --- |
| `Categories` | title | write | Expense category name. |
| `Monthly Budget` | number | write | Current monthly budget. |
| `Upcoming Budget` | number | write | Future budget if used. |
| `Auxiliary` | select | write | Yes/No. |
| `Expenses` | relation | readOnly | Related expenses. |
| `toCalculator` | relation | readOnly | Monthly monitoring relation. |
| `Spending` | formula | computed | Display only. |
| `Remaining` | formula | computed | Display only. |
| `Overview` | formula | computed | Display only. |
| `Total Overview` | formula | computed | Display only. |
| `Rollup of Specific Monthly Spending` | rollup | computed | Display only. |
| `Total Overall Monthly Expense` | rollup | computed | Display only. |

Normal Expense category pickers should hide records marked as auxiliary when the current workflow does not require them. View-specific workflows such as Pasabuy may intentionally include their category.

## Expenses

| Notion Field | Type | Access | Notes |
| --- | --- | --- | --- |
| `Purchase description` | title | write | Expense title/description. |
| `Purchase Date` | date | write | Purchase date. |
| `Date Paid` | date | write | Actual paid date. |
| `Custom end range` | date | write | Optional custom period end. |
| `Expense Amount` | number | write | Base expense amount. |
| `Interest` | number | write | Interest or fee. |
| `Accounts` | relation | write | Paying account. |
| `Categories` | relation | write | Expense category. |
| `Payment Status` | select | write | Paid, Unpaid, Installment, Cancelled. |
| `Payment Frequency` | select | write | Daily, Weekly, Monthly, Quarterly, Annually. |
| `Period count` | number | write | Total payment periods. |
| `Paid period` | number | write | Paid periods. |
| `CC Link Payment Receipt` | relation | write | Related income/payment receipt. |
| `Pasabuyer` | select | write | Shared, Maimai, Claire, 22-H in current Notion schema. |
| `Pasabuy Status` | select | write | Pasabuy payment status. |
| `Pasabuy paid period` | number | write | Pasabuy paid periods. |
| `Pasabuy Date of Payment` | date | write | Pasabuy payment date. |
| `Pasabuy Account Receiver` | relation | write | Account receiving pasabuy payment. |
| `Gross Price` | formula | computed | Display only. |
| `Installment Amount` | formula | computed | Display only. |
| `Paid Amount` | formula | computed | Display only. |
| `Remaining Balance` | formula | computed | Display only. |
| `Monthly Total` | formula | computed | Display only. |
| `Expected payment date` | formula | computed | Display only. |
| `Extracted Billing Day` | rollup | computed | Display only. |
| `Extracted Due Day` | rollup | computed | Display only. |
| `Pasabuy Received Amount` | formula | computed | Display only. |
| `Pasabuyer Balance` | formula | computed | Display only. |
| `Date range calculator` | formula | computed | Hidden from normal UI. |

Delete behavior: update `Purchase description` to `Original Name [Deleted: 1234.56]` using the current `Expense Amount` value, then clear `Expense Amount`.

Expense forms should adapt to the selected view, category, and account. Credit-card related fields are shown only when the selected account type is `Credit Account` or `BYPL`. Pasabuy fields are shown only when the Pasabuy view/category is selected.

## Expense Scheduler

Expense Scheduler is an app workflow backed by the Expenses data source and Expense Scheduler views. It uses the same field contract as Expenses.

Known Expense Scheduler views include to-buy, to-pay, installment, scheduled expense, and related payment views. The implementation should treat these as filtered workflows over Expenses, not as a separate canonical data source.

Delete behavior follows Expenses.

## Monthly Monitoring

Monthly Monitoring is in app scope as a read-focused monitoring section. It should not create, edit, or delete Monthly Monitoring records through normal app flows.

| Notion Field | Type | Access | Notes |
| --- | --- | --- | --- |
| `Name` | title | readOnly | Month/monitoring label. |
| `Monthly Income Relation` | relation | readOnly | Income category relation. |
| `Monthly Expense Relation` | relation | readOnly | Expense category relation. |
| `Income Monthly Total` | rollup | computed | Display only. |
| `Expense Monthly Total` | rollup | computed | Display only. |
| `Monthly Income` | formula | computed | Display only. |
| `Monthly Expense` | formula | computed | Display only. |
| `Gross Margin` | formula | computed | Display only. |
| `For Needs` | formula | computed | Display only. |
| `For Wants` | formula | computed | Display only. |
| `For Savings` | formula | computed | Display only. |

## Relationships

- Account has many Incomes through `Accounts`.
- Account has many Expenses through `Accounts`.
- Account has many transfer-like Incomes through `Transacted Account`.
- Income Category has many Incomes through `Categories`.
- Expense Category has many Expenses through `Categories`.
- Monthly Monitoring relates to Income Categories and Expense Categories for month-level calculations and is displayed as a read-focused app section.
- Incomes can relate to Expenses through `CC Payment Covered` / `CC Link Payment Receipt`.

## Supporting App Data

PostgreSQL is the recommended primary app metadata store. Expected non-canonical tables/collections include:

- Users or sessions.
- Notion connection settings with encrypted token storage.
- Data source mapping configuration.
- Sync runs and sync attempts.
- Pending mutations.
- Conflict records.
- Cache snapshots.
- Audit events.

Supporting app data must not become the finance source of truth.

Redis is optional. Use it only when the implementation needs fast temporary state, such as cache entries, rate-limit counters, short-lived sessions, or queue coordination.

Live Notion select labels must be preserved exactly in canonical docs, mapping configuration, and validation options. App UI labels may use friendlier wording when the mapping remains obvious and close to the original Notion meaning.

## Sensitive Data Handling

- Store Notion tokens only server-side.
- Encrypt tokens at rest if stored outside environment variables.
- Do not log raw finance payloads in production.
- Do not expose database IDs as secrets to the browser; treat them as backend configuration.
- Use a separate Notion test workspace/page for destructive integration testing.
