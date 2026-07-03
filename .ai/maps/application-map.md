# Application Map

Use this map for future finance UI work. Application source code has not been created yet.

## Read First

- `wiki/product-specification/product-specification.md`
- `wiki/tdd/tdd.md`
- `wiki/project-structure/project-structure.md`
- `application/README.md`

## Planned UI Areas

- Dashboard and summary views.
- Accounts list, detail, create, and edit screens.
- Income Categories list, detail, create, and edit screens.
- Incomes list, detail, create, and edit screens.
- Transactions list, detail, create, and edit screens.
- Expense Categories list, detail, create, and edit screens.
- Expenses list, detail, create, and edit screens.
- Expense Scheduler list, detail, create, and edit screens.
- Sync status and pending changes center.
- Direct-save forms and queued Sync button flows.
- Settings for schema health and integration status, if included.

## Boundaries

- The UI calls the backend API only.
- The UI must not call Notion directly.
- The UI must not store Notion tokens.
- Forms show writable fields only; computed fields are read-only display values.
- Live Notion select labels are preserved exactly in app labels.
- Monthly Monitoring is not shown in the app.
