# Data Model

## Data Storage Overview

Notion is the canonical store for finance records. The app metadata store is planned from the start for sync logs, pending mutations, conflicts, audit events, sessions if needed, and cached snapshots. PostgreSQL is the durable app metadata store, with Neon Free as the planned provider while the app remains within free-tier limits. Redis may be added later for cache, rate limits, short-lived sessions, or queue coordination if implementation needs it. Those stores are supporting state only.

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
| `config` | Notion-maintained reference/config field used for labels, filters, selectors, or budget mapping. App may read it but normal app flows must not update it. |
| `computed` | Notion formula, rollup, reverse relation, or derived value. Display only. |
| `hidden` | Internal or advanced field hidden from normal UI. |
| `none` | No user-facing create/edit exposure for this entity in MVP. |

## Accounts

| Notion Field | Type | Access | Notes |
| --- | --- | --- | --- |
| `Account Name` | title | config | Primary account name. Maintained in Notion only. |
| `Account Type` | select | config | Cash, Credit Account, Debit, Savings Account, e-Wallet, Digital Bank, BYPL, Auxiliary. Maintained in Notion only. |
| `Account Information` | text | config | Optional details. Maintained in Notion only. |
| `Starting Balance` | number | config | Initial balance. Maintained in Notion only. |
| `Credit Limit` | number | config | Mainly for credit accounts. Maintained in Notion only. |
| `Credit Points` | number | config | Reward/point tracking if used. Maintained in Notion only. |
| `Annual Fee` | number | config | Card/account annual fee. Maintained in Notion only. |
| `Billing Day` | number | config | Day of month. Maintained in Notion only. |
| `Due Day` | number | config | Day of month. Maintained in Notion only. |
| `Inactive` | checkbox | config | Hide inactive accounts from normal selects. Maintained in Notion only. |
| `Income Label` | text | config | Label helper if still used. Maintained in Notion only. |
| `Expense Label` | text | config | Label helper if still used. Maintained in Notion only. |
| `Balance Label` | text | config | Label helper if still used. Maintained in Notion only. |
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

Accounts are read-only in normal app flows. The app must not expose account create, edit, or delete actions. Account setup, inactive marking, and other maintenance happen directly in Notion.

Default account views should show active accounts only. The app should provide gallery/card and table views. The month selector should not appear for Accounts because the app does not need per-month balance snapshots.

## Income Categories

| Notion Field | Type | Access | Notes |
| --- | --- | --- | --- |
| `Source of Income` | title | config | Category/source name. Maintained in Notion only. |
| `Incomes` | relation | readOnly | Related income records. |
| `toCalculator` | relation | readOnly | Monthly monitoring relation. |
| `Monthly Earnings` | formula | computed | Display only. |
| `Monthly Expenditure` | rollup | computed | Display only. |
| `Monthly Gross Earnings` | rollup | computed | Display only. |
| `Monthly Net Income` | rollup | computed | Display only. |
| `Total Monthly Income` | rollup | computed | Display only. |
| `Earning Percentage` | formula | computed | Display only. |

Normal Income category pickers must exclude auxiliary workflow categories. Current Notion view evidence identifies the auxiliary income labels as `IOU`, `Transfer`, `Old Income Logger`, `Credit Card Payment`, and `Debt Payment`.

Income Categories are read-only reference/configuration data in normal app flows. The app should query IDs and `Source of Income` names for selectors, filters, and category mapping, but it should not expose category create, edit, or delete actions. Notion formula/rollup values such as `Monthly Earnings`, `Monthly Net Income`, and `Earning Percentage` are not the source for selectable-month reporting; the app calculates those metrics from scoped Income records.

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
| `Net Income` | formula | computed | App calculates normal Income display from `Gross Income - Capital Expenditure`; Notion value is not needed for normal forms. |
| `Transaction Amount` | formula | computed | Hidden from normal app views; database helper only. |
| `Monthly Capital Expenditure Sorter` | formula | computed | Hidden from normal UI. |
| `Monthly Net Sorter` | formula | computed | Hidden from normal UI. |
| `Monthly Gross Sorter` | formula | computed | Hidden from normal UI. |
| `Sum of CC Covered Overview` | rollup | computed | Display only if useful. |

Delete behavior: update `Name` to `Original Name [Deleted: 1234.56]` using the current `Gross Income` value, then clear `Gross Income`.

Normal Income forms should not expose every writable Incomes field. They should show income-related fields only: `Name`, `Date`, `Gross Income`, `Capital Expenditure`, `Accounts`, and `Categories`. `Transacted Account` and `CC Payment Covered` remain writable only for specialized transaction workflows such as transfer and credit card payment.

Income table views should include `Capital Expenditure` and app-calculated `Net Income`. `Transaction Amount` should not be shown in Income or transaction-style app views.

## Transactions

Transactions are app workflows backed by the Incomes data source and Transaction views. They use the same field contract as Incomes.

Known Transaction views include transfer, credit card payment, debt payment, receivables, Alkansya, and related transaction views. The implementation should treat these as filtered workflows over Incomes, not as a separate canonical data source.

Workflow-specific rules:

- Transfer uses the `Transfer` category automatically and does not allow the user to change it.
- Credit Card Payment uses the `Credit Card Payment` category automatically and does not allow the user to change it.
- Transfer labels the primary relation as `Source Account` and the transacted relation as `Transfer Account`; both selectors use non-credit accounts.
- Credit Card Payment labels the primary relation as `CC Account` and limits it to credit-like accounts (`Credit Account` and `BYPL`). It labels the transacted/payment-through account as `Payer Account` and limits it to non-credit accounts.
- Alkansya uses the `Savings` category automatically and currently represents amounts as negative values so they do not inflate total accumulated money.
- Receivables use the same visible fields as normal Income forms. A record remains a receivable while the receiving account relation is empty; selecting a receiving account moves it to normal Income logs.

Delete behavior follows Incomes.

## Expense Categories

| Notion Field | Type | Access | Notes |
| --- | --- | --- | --- |
| `Categories` | title | config | Expense category name. Maintained in Notion only. |
| `Monthly Budget` | number | config | Current monthly budget. Maintained in Notion only and used for app-calculated budget remaining. |
| `Upcoming Budget` | number | config | Future budget if used. Maintained in Notion only. |
| `Auxiliary` | select | config | Yes/No. Maintained in Notion only. |
| `Expenses` | relation | readOnly | Related expenses. |
| `toCalculator` | relation | readOnly | Monthly monitoring relation. |
| `Spending` | formula | computed | Display only. |
| `Remaining` | formula | computed | Display only. |
| `Overview` | formula | computed | Display only. |
| `Total Overview` | formula | computed | Category spending share over total expense, expressed as a percentage. |
| `Rollup of Specific Monthly Spending` | rollup | computed | Display only. |
| `Total Overall Monthly Expense` | rollup | computed | Display only. |

Normal Expense category pickers should hide records marked as auxiliary when the current workflow does not require them. View-specific workflows such as Pasabuy may intentionally include their category.

Expense Categories are read-only reference/configuration data in normal app flows. The app should query IDs, names, `Auxiliary`, `Monthly Budget`, and `Upcoming Budget` for selectors, filters, and category/budget mapping, but it should not expose category create, edit, or delete actions. Notion formula/rollup values such as `Spending`, `Remaining`, `Overview`, and `Total Overview` are not the source for selectable-month reporting; the app calculates those metrics from scoped Expense records plus budget config.

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
| `Pasabuy Status` | select | write | Current Notion labels: `Payment not yet receive`, `Payment partially received`, `Payment partially received (installment)`, `Payment fully received`. |
| `Pasabuy paid period` | number | write | Pasabuy paid periods. |
| `Pasabuy Date of Payment` | date | write | Pasabuy payment date. |
| `Pasabuy Account Receiver` | relation | write | Account receiving pasabuy payment. |
| `Gross Price` | formula | computed | App calculates normal Expense display from `Expense Amount + Interest`. |
| `Installment Amount` | formula | computed | App calculates normal Expense display when payment status is `Installment`. |
| `Paid Amount` | formula | computed | App calculates normal Expense display from status, installment amount, and paid period. |
| `Remaining Balance` | formula | computed | App calculates normal Expense display from gross price less paid amount. |
| `Monthly Total` | formula | computed | Display only. |
| `Expected payment date` | formula | computed | App calculates normal Expense display from purchase date and account billing/due days. |
| `Extracted Billing Day` | rollup | computed | Display only. |
| `Extracted Due Day` | rollup | computed | Display only. |
| `Pasabuy Received Amount` | formula | computed | App calculates normal Expense display from Pasabuy status and paid period context. |
| `Pasabuyer Balance` | formula | computed | App calculates normal Expense display from gross price less Pasabuy received amount. |
| `Date range calculator` | formula | computed | Hidden from normal UI. |

Delete behavior: update `Purchase description` to `Original Name [Deleted: 1234.56]` using the current `Expense Amount` value, then clear `Expense Amount`.

Expense forms should adapt to the selected view, category, and account. Base fields are `Purchase description`, `Purchase Date`, `Accounts`, `Categories`, `Expense Amount`, and `Date Paid`. Credit-card related fields are shown only when the selected account type is `Credit Account` or `BYPL`. Pasabuy fields are shown only when the Unpaid Pasabuy view/category is selected. Expense category filtering should include All, W/out Pasabuy, and specific-category choices; Unpaid Pasabuy can also be filtered by `Pasabuyer`.

Expense Monthly view uses `Purchase Date` as the month anchor. Expense supports Daily, Weekly, Monthly, Unpaid Pasabuy, To pay, To buy, Installments, and CC Transactions views; Annually is intentionally out of Expense scope.

Formula ownership rule: selectable-month Dashboard, Monthly Monitoring, Income, Expense, and category reporting should be calculated in app/shared source code from scoped Notion records. Notion formulas/rollups from Monthly Monitoring, Income Categories, and Expense Categories are not the source for historical selected-month reporting. Current Account computed values may still be displayed as read-only Notion-backed account state.

## Expense Scheduler

Expense Scheduler is an app workflow backed by the Expenses data source and Expense Scheduler views. It uses the same field contract as Expenses.

Known Expense Scheduler views include to-buy, to-pay, installment, scheduled expense, and related payment views. The implementation should treat these as filtered workflows over Expenses, not as a separate canonical data source.

Delete behavior follows Expenses.

## Monthly Monitoring

Monthly Monitoring is in app scope as a read-focused monitoring section. It should not create, edit, or delete Monthly Monitoring records through normal app flows. The Notion Monthly Monitoring DB remains useful schema context, but app Monthly Monitoring reports should be calculated from scoped Income and Expense records for the selected month rather than from Notion Monthly Monitoring formulas/rollups.

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

App-calculated Monthly Monitoring uses Income `Date` and Expense `Purchase Date` as month anchors. Category names and budget config come from Notion category records. Monthly income, gross income, expense total, gross margin, needs/wants/savings, category spending, remaining budget, and percentages are calculated in app/shared code for the selected month.

## Relationships

- Account has many Incomes through `Accounts`.
- Account has many Expenses through `Accounts`.
- Account has many transfer-like Incomes through `Transacted Account`.
- Income Category has many Incomes through `Categories`.
- Expense Category has many Expenses through `Categories`.
- Monthly Monitoring in Notion relates to Income Categories and Expense Categories for Notion-side current/calculator views, but app Monthly Monitoring should calculate selected-month reports from scoped records.
- Incomes can relate to Expenses through `CC Payment Covered` / `CC Link Payment Receipt`.

## Supporting App Data

PostgreSQL is the primary app metadata store. Use Neon Free as the planned hosted PostgreSQL provider while usage remains within free-tier limits. Expected non-canonical tables/collections include:

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
