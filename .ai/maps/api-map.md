# API Map

Use this map for planned backend API contract work.

## Read First

- `wiki/api/api-specification.md`
- `wiki/tdd/tdd.md`
- `wiki/database/data-model.md`

## Planned API Areas

- `/api/v1/accounts`
- `/api/v1/income-categories`
- `/api/v1/incomes`
- `/api/v1/transactions`
- `/api/v1/expense-categories`
- `/api/v1/expenses`
- `/api/v1/expense-scheduler`
- `/api/v1/dashboard/summary`
- `/api/v1/monthly-monitoring`
- `/api/v1/sync/status`
- `/api/v1/sync/pull`
- `/api/v1/sync/commit`
- `/api/v1/system/schema-status`
- `/api/v1/health`

Monthly Monitoring is a read-only app endpoint with app-calculated month-scoped values.

## Contract Rules

- API fields use `camelCase`.
- Raw Notion property names stay in backend mapping code.
- Mutation endpoints accept writable fields only.
- Sync commit pushes changes to Notion and returns a fresh pulled snapshot when requested.
- Error responses must be user-safe and must not expose raw secrets or stack traces.
