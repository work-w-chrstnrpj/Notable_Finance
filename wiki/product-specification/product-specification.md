# Product Specification

## Product Summary

Notion Finance is a finance UI application for an existing Notion financial workspace. Notion remains the source of truth. The app provides a focused encoding and viewing experience over multiple Notion databases so the user can manage finance records without working directly inside complex Notion tables and formula-heavy views.

The app must support create, edit, delete, view, and sync workflows for:

- Accounts
- Income Categories
- Incomes
- Transactions
- Expense Categories
- Expenses
- Expense Scheduler
- Monthly Monitoring

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

1. User opens a form for an account, category, income, or expense.
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
- Income Categories and Expense Categories are deleted.
- Accounts are not physically deleted. Deleting an account marks the account as inactive by setting `Inactive`.

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

### Accounts

- View account name, type, balances, limits, billing day, and due day.
- Show active accounts only by default by filtering out records where `Inactive` is set.
- Support gallery/card view and table view.
- Create and edit normal account setup fields.
- In account creation and editing, adjust fields based on selected `Account Type`.
- Show credit-specific fields such as credit limit, credit points, annual fee, billing day, and due day only when they apply, especially for `Credit Account` and `BYPL`.
- Delete by marking the account inactive, not by physically deleting the Notion record.
- Show computed balances and limits as read-only.
- Hide relation and rollup fields from normal forms unless needed for an advanced/admin view.

### Income Categories

- View income sources and computed income metrics.
- Create and edit the source name.
- Show monthly totals and percentages as read-only.

### Incomes

- View income records by date, category, and related account.
- Support Daily, Weekly, Monthly, and Annually view modes.
- Support frontend-only filters for Account and Categories.
- Create and edit income title, date, gross income, capital expenditure, account relation, and category relation.
- Do not show transaction-only fields such as `Transacted Account` or `CC Payment Covered` in the normal add-income form.
- Normal income category choices must exclude auxiliary workflow categories. Current Notion evidence shows these auxiliary income category labels: `IOU`, `Transfer`, `Old Income Logger`, `Credit Card Payment`, and `Debt Payment`.
- Show net income and transaction amount as read-only computed values.

### Expense Categories

- View category name, budget, spending, remaining budget, and summaries.
- Create and edit category name, monthly budget, upcoming budget if supported, and auxiliary flag.
- Show spending, remaining, overview, and rollups as read-only.

### Expenses

- View expense records by date, status, account, category, frequency, installment, and pasabuy fields.
- Support Daily, Weekly, Monthly, Annually, Pasabuy, To pay, To buy, Installments, and CC Transactions view modes.
- Support frontend-only filters for Account and Categories.
- Allow the user to toggle the expense view mode so each mode corresponds to the relevant filtered Notion-backed workflow.
- Create and edit purchase date, date paid, amount, interest, account, category, payment status, payment frequency, period count, paid period, pasabuy fields, and payment receipt relation where supported.
- Adjust expense form fields based on selected category and account.
- Show credit-card related fields only when the selected account is `Credit Account` or `BYPL`.
- Show Pasabuy related fields only when the Pasabuy workflow/view is active and the selected category is Pasabuy.
- Show computed amount fields, expected dates, extracted account days, and balances as read-only.

### Transactions

- Support transfer, credit card payment, debt payment, receivable, Alkansya, and related transaction flows shown in the Notion Transaction views.
- Reuse the Incomes data source fields and validation.
- Keep computed income fields read-only.

### Transfer

- Show a Monthly view.
- Use the `Transfer` category automatically and do not allow the user to change it in this workflow.
- Include the transaction account field because transfers need both the source and destination account context.

### Credit Card Payment

- Show a Monthly view.
- Use the `Credit Card Payment` category automatically and do not allow the user to change it in this workflow.
- Include the transacted account/payment-through account field needed by the Notion credit card payment views.

### Alkansya

- Show a Monthly view.
- Treat Alkansya as a specialized transaction-style workflow backed by the existing Notion income/transaction records unless implementation discovery proves it belongs to another backing view.

### Receivables

- Show a Monthly view.
- Treat Receivables as a specialized transaction-style workflow backed by the existing Notion income/transaction records.

### Expense Scheduler

- Support to-buy, to-pay, installment, and scheduled expense workflows shown in the Notion Expense Scheduler views.
- Reuse the Expenses data source fields and validation.
- Keep computed expense fields read-only.

### Monthly Monitoring

- Show Monthly Monitoring in the app as a month-level monitoring section.
- Include category budget context and income category context from the related Notion databases.
- Show monthly income total, monthly expense total, gross margin, needs, wants, and savings values as read-only.
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
- Account delete behavior is inactive marking through the `Inactive` field.
- Normal income forms exclude transaction-only fields and auxiliary income categories.
- Expense forms show credit-card and Pasabuy fields only in the relevant account/category/view contexts.

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
- Account delete marks the account inactive through `Inactive`.
- Destructive testing will use a duplicated Notion space provided by the project owner.
- Real Next.js and NestJS code should be created only after the user explicitly says to implement.
- PostgreSQL app metadata storage should use Neon Free while the app remains within free-tier limits.
- Sync starts by pulling from Notion, then writes updates, then pulls fresh Notion data again.
- Schema verification should be available through a button after the Notion integration key is configured.
- The app sections are Dashboard, Accounts, Income, Expense, Monthly Monitoring, Transfer, Credit Card Payment, Alkansya, and Receivables.

## Open Questions

- Which exact fields should appear in compact list views versus detail views after the first UI wireframe pass?
- Confirm whether Alkansya should remain an Incomes-backed transaction workflow or needs a distinct Notion view mapping during implementation discovery.
