# Application Map

Use this map for finance UI work. Application source code has started under `notable-finance-web/application/`.

## Read First

- `wiki/web/product-specification/product-specification.md`
- `wiki/web/tdd/tdd.md`
- `wiki/web/project-structure/project-structure.md`
- `notable-finance-web/application/README.md`

## Current Entry Points

- `notable-finance-web/application/src/app/page.tsx`: redirects to the dashboard route.
- `notable-finance-web/application/src/app/[section]/page.tsx`: validates section route params and renders the workspace.
- `notable-finance-web/application/src/components/finance-workspace.tsx`: finance app shell and current mock UI surfaces.
- `notable-finance-web/application/src/lib/finance-data.ts`: temporary mock DTO data.
- `notable-finance-web/application/src/lib/finance-rules.ts`: frontend field-visibility and workflow guardrails.
- `notable-finance-web/application/src/lib/api-client.ts`: backend-only API client boundary.
- `notable-finance-web/application/src/lib/finance-rules.test.ts`: focused rule tests.

## UI Areas

- Dashboard and summary views.
- Accounts reference/configuration views only.
- Income Categories reference/configuration views only.
- Incomes list, detail, create, and edit screens.
- Transactions list, detail, create, and edit screens.
- Expense Categories reference/configuration views only.
- Expenses list, detail, create, and edit screens.
- Expense Scheduler list, detail, create, and edit screens.
- Monthly Monitoring display-focused section with app-calculated selected-month values.
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
