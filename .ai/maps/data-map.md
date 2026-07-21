# Data Map

Use this map for Notion schema, field mapping, and future persistence work.

## Read First

- `wiki/web/database/data-model.md`
- `wiki/web/tdd/tdd.md`
- `wiki/web/diagrams/entity-relationship.md`

## Canonical Finance Data

Notion is the source of truth for:

- Accounts
- Income Categories
- Incomes
- Transactions backed by Incomes views
- Expense Categories
- Expenses
- Expense Scheduler backed by Expenses views

Monthly Monitoring exists in Notion but is out of app scope.

## Supporting App Data

Planned app-owned metadata starts with:

- Sessions or users.
- Notion connection settings.
- Data source mapping metadata.
- Sync runs and attempts.
- Pending mutations.
- Conflict records.
- Cache snapshots.
- Audit events.

Supporting app data must not become the canonical finance database.

Live Notion select labels must be preserved exactly in canonical mapping and validation data.

## Key Boundary

Writable versus computed field classification lives in the data model and must be enforced by backend validation before any Notion write.
