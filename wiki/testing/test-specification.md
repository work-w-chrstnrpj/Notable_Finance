# Test Specification

## Current Status

No application code exists yet, so runnable test commands are not available. This document defines the expected verification strategy once implementation begins.

## Test Strategy

Testing must prove that the app remains a safe interface over Notion:

- Writable fields are accepted and mapped correctly.
- Computed/read-only fields are rejected in mutation payloads.
- Sync writes to Notion, pulls fresh data, and refreshes UI state.
- Notion secrets stay server-side.
- Schema drift and conflicts produce user-safe errors.

## Planned Test Levels

### Unit Tests

- Field access classification.
- Notion property mappers.
- DTO validation.
- Money/date formatting.
- Business rules for paid status, installment periods, and required relations.
- Error normalization.

### Integration Tests

- Backend resource endpoints with mocked Notion responses.
- Sync commit success and partial failure.
- Schema status checks.
- Conflict detection using stale last-edited metadata.
- Backend rejects read-only/computed fields.

### Contract Tests

- API response shapes.
- Error response shapes.
- Sync operation payload shape.
- Dashboard summary shape.

### End-To-End Tests

- Pull latest Notion data.
- Create expense and sync.
- Edit expense and sync.
- Delete record and sync.
- Create income and sync.
- View transaction and expense scheduler workflows.
- Switch Income between Daily, Weekly, Monthly, and Annually views.
- Switch Expense between Daily, Weekly, Monthly, Annually, Pasabuy, To pay, To buy, Installments, and CC Transactions views.
- View Monthly Monitoring as read-only month-level monitoring.
- Display schema drift error.
- Display conflict error.

### Manual Tests

Manual tests must use a duplicated, non-production Notion space for destructive checks. The project owner will provide this duplicated Notion setup.

Minimum manual scenarios:

- Verify app-scoped data source and view mappings.
- Confirm relation dropdowns only show valid records.
- Confirm Accounts show active records by default and support gallery/card and table views.
- Confirm computed fields are hidden from forms.
- Confirm normal Income forms do not show `Transacted Account` or `CC Payment Covered`.
- Confirm normal Income category choices exclude auxiliary workflow categories such as `IOU`, `Transfer`, `Old Income Logger`, `Credit Card Payment`, and `Debt Payment`.
- Confirm Expense forms show credit-card fields only for `Credit Account` or `BYPL` accounts.
- Confirm Pasabuy fields show only in the Pasabuy view/category flow.
- Confirm Transfer and Credit Card Payment workflows lock their category values.
- Confirm Monthly Monitoring values are visible but not editable.
- Confirm write creates/updates the expected Notion page.
- Confirm income/transaction delete rewrites the title with `[Deleted: Amount]` and clears `Gross Income`.
- Confirm expense/expense-scheduler delete rewrites the title with `[Deleted: Amount]` and clears `Expense Amount`.
- Confirm account delete marks the account inactive through `Inactive` and does not physically delete the Notion record.
- Confirm income category and expense category delete removes the category record according to the chosen Notion deletion method.
- Confirm post-sync pull shows Notion-computed values.
- Confirm invalid Notion token and missing database access errors are understandable.
- Confirm the schema verification button works after the Notion integration key is configured.

## Commands

Recommended after project scaffolding:

```text
lint: npm run lint
typecheck: npm run typecheck
unit tests: npm run test
integration tests: npm run test:integration
e2e tests: npm run test:e2e
build: npm run build
```

Recommended tools:

- ESLint for linting.
- TypeScript for typechecking.
- Vitest for shared/frontend-friendly unit tests.
- React Testing Library for frontend component tests.
- Jest or Vitest for NestJS unit tests, depending on scaffold defaults.
- Supertest for backend HTTP integration tests.
- Playwright for end-to-end tests.

Documentation-only verification for the current phase:

```powershell
rg -n "\\[Project Name\\]|\\[State the project goal here\\.\\]|Suggested Sections|intended to" AGENTS.md wiki
Get-ChildItem -Recurse wiki -Filter *-draft.md
```

## Known Gaps

- Frameworks are selected, but no test runner has been configured yet.
- A duplicated Notion space is planned for destructive testing, but its access details are not documented yet.
- No CI workflow defined yet.
