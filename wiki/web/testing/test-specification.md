# Test Specification

## Current Status

Frontend application code now exists under `application/`, and the first runnable frontend checks are available. Backend, integration, contract, e2e, and destructive manual testing are still pending until service contracts and a duplicated Notion space are available.

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
- Month-scoped Dashboard and Monthly Monitoring calculation shape.

### End-To-End Tests

- Pull latest Notion data.
- Create expense and sync.
- Edit expense and sync.
- Delete record and sync.
- Create income and sync.
- View transaction and expense scheduler workflows.
- Switch Income between Daily, Weekly, Monthly, and Annually views.
- Switch Expense between Daily, Weekly, Monthly, Unpaid Pasabuy, To pay, To buy, Installments, and CC Transactions views.
- Confirm Expense has no Annually view.
- View Monthly Monitoring as read-only app-calculated month-level monitoring.
- Display schema drift error.
- Display conflict error.

### Manual Tests

Manual tests must use a duplicated, non-production Notion space for destructive checks. The project owner will provide this duplicated Notion setup.

Minimum manual scenarios:

- Verify app-scoped data source and view mappings.
- Confirm relation dropdowns only show valid records.
- Confirm Dashboard `Total Cash Flow` sums active non-credit account balances only and excludes `Credit Account` and `BYPL` accounts.
- Confirm Dashboard monthly gross income, net income, expenses, and category breakdowns are calculated from records queried for the selected month, not from Notion Monthly Monitoring or category formula/rollup fields.
- Confirm Accounts show active records by default and support gallery/card and table views.
- Confirm Accounts has no month selector and no account create/edit/delete actions.
- Confirm Income Categories and Expense Categories are read-only Notion reference/configuration data in the app, with no add/edit/delete category actions.
- Confirm income category names and expense category names/auxiliary/budget config hydrate from Notion and are used for selectors, filters, and monitoring category mapping.
- Confirm computed fields are hidden from forms.
- Confirm normal Income forms do not show `Transacted Account` or `CC Payment Covered`.
- Confirm normal Income account selectors show non-credit accounts only.
- Confirm the month selector appears in Income only for Monthly view; Daily, Weekly, and Annually use current-period scope.
- Confirm normal Income views do not show `Transaction Amount`, show `Capital Expenditure`, and calculate `Net Income` from gross income less capital expenditure.
- Confirm `Net Income` appears green when positive, red when negative, and black when zero.
- Confirm normal Income category choices exclude auxiliary workflow categories such as `IOU`, `Transfer`, `Old Income Logger`, `Credit Card Payment`, and `Debt Payment`.
- Confirm Expense forms show credit-card fields only for `Credit Account` or `BYPL` accounts.
- Confirm Expense supports Daily, Weekly, Monthly, Unpaid Pasabuy, To pay, To buy, Installments, and CC Transactions; Annually is not present.
- Confirm the month selector appears in Expense only for Monthly view.
- Confirm Expense Monthly reporting uses `Purchase Date` as the selected-month anchor.
- Confirm non-credit Expense forms show only base purchase fields plus the category selector needed to choose Pasabuy.
- Confirm credit Expense forms show payment status, interest, gross price, payment frequency, period count, paid period, paid amount, remaining balance, expected payment date, and installment amount only when status is `Installment`.
- Confirm Expense category filters include All, W/out Pasabuy, and specific category options in general Expense views.
- Confirm Expense table columns show Date, Description, Amount, Account, Category, Date Paid, and Expense Status; Expense Status is a red circle when `Date Paid` is empty and a green circle when `Date Paid` has a value.
- Confirm Unpaid Pasabuy hides the category filter, shows only Pasabuy records with no paid date or Pasabuy status other than `Payment fully received`, and can be filtered by `Pasabuyer`.
- Confirm Pasabuy fields show only in the Unpaid Pasabuy view/category flow and use dropdowns for `Pasabuy Status` and `Pasabuy Account Receiver`.
- Confirm Transfer and Credit Card Payment workflows lock their category values.
- Confirm Transfer labels account fields as `Source Account` and `Transfer Account`, and both selectors show non-credit accounts only.
- Confirm Credit Card Payment labels account fields as `CC Account` and `Payer Account`; `CC Account` shows credit-like accounts only and `Payer Account` shows non-credit accounts only.
- Confirm Alkansya uses the `Savings` category and negative amount values.
- Confirm Receivables use normal Income-style fields and leave the receivables list once a receiving account is selected.
- Confirm Transfer, Credit Card Payment, Alkansya, and Receivables table rows show full dates, not month-only labels.
- Confirm the top bar does not repeat the current section title, and the sidebar can collapse to icon-only mode while hover/focus temporarily reveals full labels.
- Confirm MB Breakdown `Total Overview` is shown as each category's percentage of total spending.
- Confirm Monthly Monitoring values are visible but not editable, and are app-calculated from selected-month Income and Expense records plus Notion category budget/config data.
- Confirm write creates/updates the expected Notion page.
- Confirm income/transaction delete rewrites the title with `[Deleted: Amount]` and clears `Gross Income`.
- Confirm expense/expense-scheduler delete rewrites the title with `[Deleted: Amount]` and clears `Expense Amount`.
- Confirm Accounts, Income Categories, and Expense Categories do not expose app delete flows.
- Confirm post-sync pull shows app-calculated reporting values based on the scoped fresh Notion records.
- Confirm invalid Notion token and missing database access errors are understandable.
- Confirm the schema verification button works after the Notion integration key is configured.

## Commands

Current frontend commands from `application/`:

```text
lint: npm run lint
typecheck: npm run typecheck
build: npm run build
unit tests: npm run test
e2e placeholder: npm run test:e2e
```

Recommended after backend and integration scaffolding:

```text
integration tests: npm run test:integration
e2e tests: npm run test:e2e
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

- Frontend rule tests exist (including `finance-rules.test.ts` for business logic), but component, integration, contract, and Playwright coverage are still pending.
- A duplicated Notion space is planned for destructive testing, but its access details are not documented yet.
- No CI workflow defined yet.

> Last updated: 2026-07-14 — reflects current codebase state
