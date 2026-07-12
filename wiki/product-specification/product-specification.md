# Product Specification

## Product Summary

Notion Finance is a finance UI application for an existing Notion financial workspace. Notion remains the source of truth. The app provides a focused encoding and viewing experience over multiple Notion databases so the user can manage finance records without working directly inside complex Notion tables and formula-heavy views.

The app must support view and sync workflows for:

- Accounts
- Income Categories
- Expense Categories
- Monthly Monitoring

The app must support create, edit, delete, view, and sync workflows for transaction-like finance records:

- Incomes
- Transactions
- Expenses
- Expense Scheduler

## Problem

The existing finance system lives in Notion and uses relations, formulas, rollups, and dashboard-style database views. That is powerful, but day-to-day finance encoding can become slow and error-prone because normal forms expose too many computed or technical fields.

The app should make common workflows faster while preserving Notion as the canonical data store.

## Users

Initial target user:

- Owner: the person who maintains the Notion finance workspace and needs full access to view, encode, edit, delete, sync, and monitor finance records.

The app should support use by other people through authentication. MVP authentication should support email sign-in and Google sign-in.

Planned user types:

- Viewer: read-only access to dashboards and reports.
- Encoder: limited access for entering records without access to settings or sensitive integration details.

## Core Product Rules

- Notion is the source of truth for all finance records.
- The app is an encoding and viewing tool, not a replacement finance database.
- The frontend must never store or receive the Notion integration token.
- The app must hide computation-heavy Notion fields from normal create/edit forms.
- Formula, rollup, reverse relation, and system-managed fields are read-only in the app.
- The sync flow must push app changes to Notion, pull latest data from Notion, and refresh the UI from the pulled data.
- Sync must support both direct-save form submissions and explicit queued changes through a Sync button.
- App metadata storage is planned from the start for sync logs, sessions if needed, conflicts, pending mutations, audit events, and snapshots.
- Canonical mapping docs must preserve live Notion select labels exactly, even when labels are awkward. App UI labels may be friendlier when they stay obvious and close to the Notion meaning.
- Accounts, Income Categories, and Expense Categories are Notion-maintained reference/configuration data in the app. The app may query and display them, but it must not expose add, edit, or delete flows for them.
- Dashboard, Monthly Monitoring, and category reporting for selectable months must be calculated from scoped Income and Expense records plus category/account reference data. Do not use Notion Monthly Monitoring, Income Category, or Expense Category formulas/rollups as the reporting source for arbitrary selected months.
- Monthly Monitoring is an app section for month-level monitoring. It is display-focused and must not expose Notion formula, rollup, or relation-maintenance fields for editing.
- Transaction is an app workflow backed by the existing Incomes data source and Transaction views.
- Expense Scheduler is an app workflow backed by the existing Expenses data source and Expense Scheduler views.
- Real application code should be created or expanded only when the user explicitly asks to implement that scope.

## Primary Workflows

### View Finance Data

1. User opens the app.
2. App loads or pulls the latest Notion-backed finance data.
3. User views dashboards, lists, and detail pages with clean labels and computed fields presented as read-only values.

### Create A Record

1. User opens a form for an income, transaction, expense, or expense-scheduler record.
2. App shows only writable fields.
3. User submits the form.
4. App queues or sends a create operation to the backend.
5. Backend writes to Notion.
6. Backend pulls the latest Notion data.
7. UI refreshes with Notion's current computed values.

### Edit A Record

1. User edits writable fields.
2. App rejects attempts to edit read-only computed fields.
3. Backend validates the change and writes it to Notion.
4. App pulls fresh data and updates the UI.

### Delete A Record

1. User requests deletion.
2. App asks for confirmation.
3. Backend applies the resource-specific deletion policy.
4. App pulls fresh data and updates the UI.

Deletion policy:

- Income and Expense records are soft-deleted by updating the title to include the deleted amount value, then clearing the amount field. For incomes, this means `NameOfToBeDeleted [Deleted: 1234.56]` using the current `Gross Income` value, then clearing `Gross Income`. For expenses, this means `NameOfToBeDeleted [Deleted: 1234.56]` using the current `Expense Amount` value, then clearing `Expense Amount`.
- Transaction records follow the income deletion policy because they are backed by the Incomes data source.
- Expense Scheduler records follow the expense deletion policy because they are backed by the Expenses data source.
- Accounts, Income Categories, and Expense Categories are maintained in Notion only; the app does not expose deletion flows for these resources.

### Sync

1. User starts from the latest Notion state by pulling/syncing from Notion.
2. User either submits a direct-save form or commits queued changes with the Sync button.
3. Create/edit/delete operations are pushed to Notion.
4. Backend handles validation, Notion errors, conflicts, and rate limits.
5. Backend pulls the latest Notion data again.
6. UI refreshes from the pulled data and shows sync status.

## Functional Requirements

### App Sections And Navigation

The app should expose these primary sections:

- Dashboard.
- Accounts.
- Income.
- Expense.
- Monthly Monitoring.
- Transfer.
- Credit Card Payment.
- Alkansya.
- Receivables.

Section labels in the app may be clearer than raw Notion field names. The backend mapping must still preserve the exact Notion property names and select labels.

The persistent top bar should show controls and sync state without repeating the active section title. The sidebar can be toggled to an icon-only width; while collapsed, hovering or focusing the sidebar temporarily reveals full labels until the pointer leaves or focus moves away.

The Dashboard should show `Total Cash Flow` as the sum of active non-credit account balances. Credit-like accounts such as `Credit Account` and `BYPL` are excluded from this total.

### Accounts

- View account name, type, balances, limits, billing day, and due day.
- Show active accounts only by default by filtering out records where `Inactive` is set.
- Support gallery/card view and table view.
- Do not show the global month selector in Accounts; account balances are current Notion account state and do not require per-month snapshots in the app.
- Do not expose account create, edit, or delete actions. Account setup and maintenance stay in Notion.
- Show computed balances and limits as read-only.
- Hide relation and rollup fields unless they are explicitly needed for read-only display.

### Income Categories

- Query income category IDs and `Source of Income` names from Notion for dropdowns, filters, and category mapping.
- Do not expose income category create, edit, or delete actions. Category maintenance stays in Notion.
- Do not use Notion income category formula/rollup values for month-selectable reporting. Monthly earnings, gross, net, expenditure, and percentage values should be calculated from scoped Income records.

### Incomes

- View income records by date, category, and related account.
- Support Daily, Weekly, Monthly, and Annually view modes.
- Show the global month selector only for Monthly view. Daily, Weekly, and Annually are anchored to the current date/current period and should not show the month selector.
- Query only the records needed for the active Income view. The default Income query should use the current month for Monthly view; selected historical months should be queried only when the month selector is used.
- Support Account and Categories filters over the scoped result set.
- Create and edit income title, date, gross income, capital expenditure, account relation, and category relation.
- Do not show transaction-only fields such as `Transacted Account` or `CC Payment Covered` in the normal add-income form.
- Normal income category choices must exclude auxiliary workflow categories. Current Notion evidence shows these auxiliary income category labels: `IOU`, `Transfer`, `Old Income Logger`, `Credit Card Payment`, and `Debt Payment`.
- Calculate net income in the app from gross income less capital expenditure, and color net income green for positive values, red for negative values, and black for zero.
- Hide `Transaction Amount` from Income and transaction-style views because it is only a database calculation helper.

### Expense Categories

- Query expense category IDs, `Categories` names, `Auxiliary`, `Monthly Budget`, and `Upcoming Budget` from Notion for dropdowns, filters, and budget mapping.
- Do not expose expense category create, edit, or delete actions. Category maintenance stays in Notion.
- Do not use Notion expense category formula/rollup values for month-selectable reporting. Spending, remaining budget, overview, total overview, and category percentages should be calculated from scoped Expense records plus Notion-maintained budget config.

### Expenses

- View expense records by date, description, amount, account, category, date paid, and a local expense status indicator derived only from `Date Paid`.
- Support Daily, Weekly, Monthly, Unpaid Pasabuy, To pay, To buy, Installments, and CC Transactions view modes. Annually is intentionally not in Expense scope.
- Use `Purchase Date` as the month anchor for monthly Expense reporting.
- Show the global month selector only for Monthly view. Other Expense views are scoped to their own current-period or outstanding-workflow logic and should not show the month selector.
- Query only the records needed for the active Expense view. The default Monthly query should use the current month; selected historical months should be queried only when the month selector is used.
- Support Account and Categories filters over the scoped result set. Category filtering must support All, W/out Pasabuy, and specific category options in general Expense views.
- In Unpaid Pasabuy, all records are Pasabuy records, so the category filter should be hidden/ignored; include records where `Date Paid` is empty or `Pasabuy Status` is not `Payment fully received`, and allow filtering by `Pasabuyer`.
- Allow the user to toggle the expense view mode so each mode corresponds to the relevant filtered Notion-backed workflow.
- Create and edit purchase description, purchase date, account, category, amount, and date paid for base expense records.
- Adjust expense form fields based on selected category and account.
- Show credit-card related fields only when the selected account is `Credit Account` or `BYPL`; these include payment status, interest, payment frequency, period count, paid period, and app-calculated gross price, installment amount, paid amount, remaining balance, and expected payment date.
- Show Pasabuy related fields only when the Unpaid Pasabuy workflow/view is active or the selected category is Pasabuy; these include pasabuyer, pasabuy status, pasabuy date of payment, pasabuy account receiver, pasabuy paid period, and app-calculated received amount and balance.
- Daily, Weekly, and Monthly views do not depend on paid state. Unpaid Pasabuy, To pay, Installments, and CC Transactions show records that are not paid, not fully paid, or have no paid date.
- For Dashboard, Monthly Monitoring, Income, Expense, and category reporting, calculate display values in application/shared code from scoped records when they can be derived from writable Notion fields. Use Notion formula/rollup values only where they represent current account state that the app deliberately displays as read-only.

### Form Required Fields

The following table documents which fields are required when creating or editing records in each view. All other fields are optional.

| View | Required Fields | Notes |
|------|----------------|-------|
| Income (main) | Name, Date | Account, Category, Gross Income, Capital Expenditure are optional |
| Income (QuickAdd) | Name, Date | Same as main |
| Expense (main) | Description | Purchase Date, Account, Category, Amount are optional |
| Expense (QuickAdd) | Description | Purchase Date is optional |
| Transfer | Name, Date | Source Account is optional; Transfer Account is optional |
| CC Payment | Name, Date | CC Account is optional; Payer Account is optional |
| Receivables | Name | Date and Account are optional |
| Alkansya | Name, Date, Account | Category is optional |

### Transactions

- Support transfer, credit card payment, debt payment, receivable, Alkansya, and related transaction flows shown in the Notion Transaction views.
- Reuse the Incomes data source fields and validation.
- Keep computed income fields read-only.
- Hide `Transaction Amount` from transaction-style app views.
- Transaction workflow lists should display full `Date` values. The selected month only scopes records; rows should not replace dates with month-only labels.

### Transfer

- Show a Monthly view.
- Use the `Transfer` category automatically and do not allow the user to change it in this workflow.
- Show `Source Account`, `Transfer Account`, and `Transfer Amount`.
- Allow only non-credit accounts in both Transfer account selectors.

### Credit Card Payment

- Show a Monthly view.
- Use the `Credit Card Payment` category automatically and do not allow the user to change it in this workflow.
- Show `CC Account` for the credit-like account being paid and `Payer Account` for the non-credit account used to pay.
- Allow only `Credit Account` and `BYPL` accounts for `CC Account`; allow only non-credit accounts for `Payer Account`.

### Alkansya

- Show a Monthly view.
- Use the `Savings` category automatically.
- Represent Alkansya amounts as negative values for now so they do not inflate total accumulated money.

### Receivables

- Show a Monthly view.
- Use the same visible fields as normal Income forms.
- Treat Receivables as normal income records that do not yet have a receiving account. Once a receiving account is selected, the record should move to normal Income logs.

### Expense Scheduler

- Support to-buy, to-pay, installment, and scheduled expense workflows shown in the Notion Expense Scheduler views.
- Reuse the Expenses data source fields and validation.
- Keep computed expense fields read-only.

### Monthly Monitoring

- Show Monthly Monitoring in the app as a month-level monitoring section.
- Include category budget context and income category context from Notion reference/configuration data.
- Show monthly income total, monthly gross income, monthly expense total, gross margin, needs, wants, savings, and category breakdowns as read-only.
- Calculate Monthly Monitoring values from Income and Expense records queried for the selected month, using Income `Date` and Expense `Purchase Date` as month anchors. Do not rely on Notion Monthly Monitoring formulas/rollups for historical selected months.
- Do not create, edit, or delete Monthly Monitoring records through normal app flows.

### Sync And Status

- Show last successful sync time.
- Show pending operation count.
- Show failed operation count.
- Show schema health status.
- Provide a user-facing schema verification button after the Notion integration key is configured.
- Show user-friendly errors for validation, Notion access, rate limit, schema drift, and conflict cases.

## Non-Functional Requirements

- Security: keep Notion secrets server-side only.
- Privacy: avoid logging sensitive financial payloads in production.
- Reliability: do not assume local state is canonical after writes; always refresh from Notion.
- Usability: forms must be faster and cleaner than direct Notion editing.
- Maintainability: centralize Notion database and property mappings.
- Resilience: detect schema drift when Notion property names or types change.

## Acceptance Criteria

- The product docs identify Notion as the source of truth.
- The app scope includes Dashboard, Accounts, Income Categories, Incomes, Transactions, Expense Categories, Expenses, Expense Scheduler, Monthly Monitoring, Transfer, Credit Card Payment, Alkansya, and Receivables.
- The docs distinguish writable fields from computed/read-only fields.
- Sync is defined as push changes to Notion, then pull latest Notion data, then refresh UI.
- Security constraints state that Notion secrets must not live in frontend code.
- Source code is created only after an explicit implementation request.
- Authentication direction is email sign-in and Google sign-in.
- Account and category maintenance is Notion-only; the app does not expose create, edit, or delete flows for Accounts, Income Categories, or Expense Categories.
- Normal income forms exclude transaction-only fields and auxiliary income categories.
- Expense forms show credit-card and Pasabuy fields only in the relevant account/category/view contexts.
- Dashboard and Monthly Monitoring selectable-month reports are calculated from scoped records rather than Notion calculator rollups.

## Out Of Scope For Initial Planning

- Bank account syncing.
- Payment execution.
- Investment, tax, or financial advice.
- Replacing Notion as the canonical finance store.
- Real-time collaborative database behavior.
- Editing Notion formulas, rollups, or database schema from normal user flows.
- Multi-tenant SaaS billing.

## Resolved Planning Decisions

- Authentication should support email sign-in and Google sign-in so the app can be used by other people.
- Account maintenance, including inactive marking, happens in Notion only; the app does not expose account delete.
- Destructive testing will use a duplicated Notion space provided by the project owner.
- Real Next.js and NestJS code should be created only after the user explicitly says to implement.
- PostgreSQL app metadata storage should use Neon Free while the app remains within free-tier limits.
- Sync starts by pulling from Notion, then writes updates, then pulls fresh Notion data again.
- Schema verification should be available through a button after the Notion integration key is configured.
- The app sections are Dashboard, Accounts, Income, Expense, Monthly Monitoring, Transfer, Credit Card Payment, Alkansya, and Receivables.
- Accounts, Income Categories, and Expense Categories are queried from Notion as read-only reference/configuration data; all add/edit/delete maintenance for them happens in Notion.
- Dashboard, Monthly Monitoring, and category reports use app-calculated month-scoped values. Notion Monthly Monitoring and category formulas are not the source for selectable-month reporting.
- Expense month-scoped reporting uses `Purchase Date` as the month anchor.
- Expense does not include an Annually view.

## Open Questions

- Which exact fields should appear in compact list views versus detail views after the first UI wireframe pass?
- Confirm live Notion category IDs and relation mappings when backend integration starts.
