# Application Map

Use this map for finance UI work. Application source code has started under `application/`.

## Read First

- `wiki/product-specification/product-specification.md`
- `wiki/tdd/tdd.md`
- `wiki/project-structure/project-structure.md`
- `application/README.md`

## Current Entry Points

- `application/src/app/page.tsx`: redirects to the dashboard route.
- `application/src/app/[section]/page.tsx`: validates section route params and renders the workspace.
- `application/src/components/finance-workspace.tsx`: finance app shell and current mock UI surfaces.
- `application/src/lib/finance-data.ts`: temporary mock DTO data.
- `application/src/lib/finance-rules.ts`: frontend field-visibility and workflow guardrails.
- `application/src/lib/api-client.ts`: backend-only API client boundary.
- `application/src/lib/finance-rules.test.ts`: focused rule tests.

## UI Areas

- Dashboard and summary views.
- Accounts list, detail, create, and edit screens.
- Income Categories list, detail, create, and edit screens.
- Incomes list, detail, create, and edit screens.
- Transactions list, detail, create, and edit screens.
- Expense Categories list, detail, create, and edit screens.
- Expenses list, detail, create, and edit screens.
- Expense Scheduler list, detail, create, and edit screens.
- Monthly Monitoring read-only section.
- Sync status and pending changes center.
- Direct-save forms and queued Sync button flows.
- Settings for schema health and integration status, if included.

## Boundaries

- The UI calls the backend API only.
- The UI must not call Notion directly.
- The UI must not store Notion tokens.
- Forms show writable fields only; computed fields are read-only display values.
- Live Notion select labels are preserved exactly in app labels.
- Monthly Monitoring is shown as a read-only section.
