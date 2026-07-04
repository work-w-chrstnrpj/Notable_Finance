# API Specification

## API Goal

The API provides a protected backend layer between the finance UI and Notion. The frontend must never call Notion directly. The backend owns validation, Notion property mapping, sync orchestration, schema drift checks, conflict handling, and protection of the Notion token.

The runtime stack is Next.js plus NestJS. This file defines the callable contract and should stay aligned with the implementation in `application/` and `service/`.

## Current Implementation Status

The first NestJS service foundation now exists under `service/`. It implements the `/api/v1` route surface, field mapping, mutation validation, read-only reference endpoints, app-calculated Dashboard and Monthly Monitoring responses, sync status/pull/commit behavior, schema-status reporting, and backend tests over an in-memory Notion-shaped development repository.

The live Notion adapter, live schema verification, PostgreSQL metadata persistence, production auth, and external HTTP integration tests remain pending implementation or blocked on credentials and schema access.

## Base Path

```text
/api/v1
```

## Common Rules

- API fields use `camelCase`.
- Raw Notion property names stay inside the backend mapping layer.
- Resource IDs are opaque strings. The first implementation may use Notion page IDs.
- Money values should be represented consistently by the selected implementation. Prefer decimal-safe handling and avoid floating point math for balances.
- Dates use ISO date strings, such as `2026-07-03`.
- Create/update requests must accept writable fields only.
- Read-only and computed fields may appear in responses, but must be rejected in mutation payloads.
- Accounts, Income Categories, and Expense Categories are read-only app resources. The backend queries them from Notion for current account state, dropdowns, filters, category labels, auxiliary flags, and budget config, but normal app APIs must not expose create, update, or delete operations for them. If a client attempts a mutation for these resources, the backend must reject it with `FORBIDDEN` or `VALIDATION_ERROR`; it must not translate the request into a Notion write.
- Dashboard, Monthly Monitoring, and category reporting endpoints calculate selected-month values from scoped Income and Expense records. They must not use Notion Monthly Monitoring, Income Category, or Expense Category formula/rollup values as the source for arbitrary selected-month reports.

## Common Response Shape

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Error response:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Expense amount is required.",
    "details": {}
  }
}
```

## Error Codes

| Code | Meaning |
| --- | --- |
| `VALIDATION_ERROR` | Request body or query is invalid |
| `NOT_FOUND` | Record does not exist or is inaccessible |
| `NOTION_API_ERROR` | Notion request failed |
| `NOTION_RATE_LIMITED` | Notion returned a rate limit response |
| `SCHEMA_DRIFT_DETECTED` | Required Notion database/property contract changed |
| `CONFLICT_ERROR` | Record changed in Notion after the app loaded it |
| `UNAUTHORIZED` | User/session is not authenticated |
| `FORBIDDEN` | User cannot perform the operation |
| `SYNC_PARTIAL_FAILURE` | Some sync operations succeeded and some failed |
| `INTERNAL_SERVER_ERROR` | Unexpected backend error |

## Planned Resources

| Resource | Collection Endpoint | Notion Backing Store | CRUD Scope |
| --- | --- | --- | --- |
| Accounts | `/accounts` | Accounts | Read only in app |
| Income Categories | `/income-categories` | Income Categories | Read-only reference/config |
| Incomes | `/incomes` | Incomes | Create, read, update, soft delete by title/amount mutation |
| Transactions | `/transactions` | Incomes Transaction views | Create, read, update, soft delete by income title/amount mutation |
| Expense Categories | `/expense-categories` | Expense Categories | Read-only reference/config |
| Expenses | `/expenses` | Expenses | Create, read, update, soft delete by title/amount mutation |
| Expense Scheduler | `/expense-scheduler` | Expenses Scheduler views | Create, read, update, soft delete by expense title/amount mutation |
| Monthly Monitoring | `/monthly-monitoring` | Calculated from scoped Incomes, Expenses, Accounts, and category config | Read only |
| Transfer | `/transfers` | Incomes Transaction views | Create, read, update, soft delete with fixed `Transfer` category |
| Credit Card Payment | `/credit-card-payments` | Incomes Transaction views | Create, read, update, soft delete with fixed `Credit Card Payment` category |
| Alkansya | `/alkansya` | Incomes Transaction views unless remapped during implementation | Create, read, update, soft delete by income title/amount mutation |
| Receivables | `/receivables` | Incomes Transaction views | Create, read, update, soft delete by income title/amount mutation |

## Standard Resource Endpoints

Writable resources should follow:

```http
GET /api/v1/{resource}
GET /api/v1/{resource}/{id}
POST /api/v1/{resource}
PATCH /api/v1/{resource}/{id}
DELETE /api/v1/{resource}/{id}
```

`DELETE` behavior is resource-specific for writable resources:

- Incomes and Transactions: update `Name` to `Original Name [Deleted: 1234.56]` using the current `Gross Income` value, then clear `Gross Income`.
- Expenses and Expense Scheduler records: update `Purchase description` to `Original Name [Deleted: 1234.56]` using the current `Expense Amount` value, then clear `Expense Amount`.
- Accounts, Income Categories, and Expense Categories have no normal app delete endpoint.

Read-only resources should expose list/detail reads only:

```http
GET /api/v1/accounts
GET /api/v1/accounts/{id}
GET /api/v1/income-categories
GET /api/v1/income-categories/{id}
GET /api/v1/expense-categories
GET /api/v1/expense-categories/{id}
```

Read-only reference resources should still be protected by the same authentication and authorization model as the rest of the app. They may include current Notion-computed values in responses when those values are intentionally displayed as read-only state, such as account balances or limits, but they must not accept those fields in request bodies.

## Query Parameters

List endpoints may support:

```text
viewMode=daily|weekly|monthly|annually
expenseViewMode=daily|weekly|monthly|unpaidPasabuy|toPay|toBuy|installments|ccTransactions
month=YYYY-MM
accountId=...
categoryId=...|withoutPasabuy|all
pasabuyer=...
paymentStatus=...
cursor=...
limit=...
```

Income supports Annually. Expense intentionally does not.

Income and Expense endpoints should query only the records needed for the active view and scope:

- Accounts are fetched as current read-only reference data and do not use `month`.
- Income Monthly view uses Income `Date` and `month=YYYY-MM`; Daily, Weekly, and Annually use the current date/current period unless a later contract explicitly adds another period selector.
- Expense Monthly view uses Expense `Purchase Date` and `month=YYYY-MM`; Daily, Weekly, Unpaid Pasabuy, To pay, To buy, Installments, and CC Transactions use their own current-period or outstanding-workflow scopes.
- Account/category/pasabuyer filters narrow the scoped query or scoped result set.

The final parameter set should be confirmed per resource during implementation.

## Sync API

The app supports both direct-save resource endpoints and queued sync commits. Direct-save form submissions use resource endpoints. Batch or staged changes use `/sync/commit`. Both paths must write to Notion, pull fresh data, and return enough state for the UI to refresh from Notion-backed data.

### Get Sync Status

```http
GET /api/v1/sync/status
```

Returns last sync time, pending operation count, failed operation count, and schema status.

### Pull Latest Notion Data

```http
POST /api/v1/sync/pull
```

Request examples should be scoped by active view instead of requesting all finance resources together. Accounts may be included as current read-only reference data when a view needs account labels or account-type logic.
Read-only reference resources may be returned in a pull snapshot, but queued operations must not include create, update, or delete actions for `accounts`, `incomeCategories`, or `expenseCategories`.

Request:

```json
{
  "resources": [
    "accounts",
    "expenseCategories",
    "expenses"
  ],
  "scope": {
    "resource": "expenses",
    "viewMode": "monthly",
    "month": "2026-07"
  }
}
```

### Commit Pending Changes

```http
POST /api/v1/sync/commit
```

Request:

```json
{
  "operations": [
    {
      "clientOperationId": "op-001",
      "resource": "expenses",
      "action": "create",
      "data": {
        "purchaseDate": "2026-07-03",
        "expenseAmount": "1299.00",
        "accountId": "account-id",
        "categoryId": "category-id",
        "paymentStatus": "Unpaid"
      }
    }
  ],
  "returnFreshSnapshot": true,
  "snapshotMonth": "2026-07"
}
```

Response includes applied operations, failed operations, and the fresh snapshot when requested.

`/sync/commit` must reject operations against read-only reference resources. For example, a queued `update` to an Account or Expense Category must fail validation before any Notion write is attempted.

## System API

```http
GET /api/v1/health
GET /api/v1/system/schema-status
```

Schema status must verify:

- Required data sources exist.
- Required properties exist.
- Property types match the expected mapping.
- Relation targets are accessible.
- Required select/status options are available.

The frontend should expose this through a schema verification button after the Notion integration key is configured.

## Authentication API

Authentication should support email sign-in and Google sign-in so the app can be used by other people. Expected endpoints are:

```http
POST /api/v1/auth/login
POST /api/v1/auth/google
GET /api/v1/auth/me
POST /api/v1/auth/logout
```

Write endpoints and sync commit must be protected.

## Dashboard API

```http
GET /api/v1/dashboard/summary?month=YYYY-MM
```

Returns app-friendly summaries built from pulled Notion data. Summary values remain derived from Notion-backed records, not from an independent finance database.

Dashboard summary should calculate selected-month values from scoped Income and Expense records plus Account and category reference/config data. It should not depend on the Notion Monthly Monitoring database or category formula/rollup values for selected-month reporting.

## Monthly Monitoring API

```http
GET /api/v1/monthly-monitoring?month=YYYY-MM
GET /api/v1/monthly-monitoring/{id}
```

Returns read-only app-calculated month-level monitoring data for `month=YYYY-MM`, including category budget context and income/expense category breakdowns. Income uses `Date` as the month anchor. Expense uses `Purchase Date` as the month anchor. Mutation endpoints are not planned for Monthly Monitoring in normal app flows.

## Workflow APIs

Specialized workflow endpoints may wrap filtered Incomes-backed records so the UI can stay simple:

```http
GET /api/v1/transfers?month=YYYY-MM
POST /api/v1/transfers
GET /api/v1/credit-card-payments?month=YYYY-MM
POST /api/v1/credit-card-payments
GET /api/v1/alkansya?month=YYYY-MM
POST /api/v1/alkansya
GET /api/v1/receivables?month=YYYY-MM
POST /api/v1/receivables
```

Transfer requests must set the Notion category to `Transfer` server-side and reject attempts to override it. Credit Card Payment requests must set the Notion category to `Credit Card Payment` server-side and reject attempts to override it.

Writable workflow resources should also support the standard detail, update, and delete patterns when they are in app scope:

```http
GET /api/v1/{workflow}/{id}
PATCH /api/v1/{workflow}/{id}
DELETE /api/v1/{workflow}/{id}
```

Workflow delete operations follow the Incomes-backed transaction delete policy unless implementation discovery remaps the workflow to another backing data source.

## Security Contract

- The API must not expose Notion tokens.
- The API must reject attempts to write computed/read-only fields.
- The API must validate relation IDs before writing to Notion.
- The API must normalize Notion errors into user-safe error responses.
- The API must avoid returning raw stack traces.

## Contract Test Expectations

When implementation starts, add contract tests for:

- Resource list/detail response shapes.
- Mutation payload validation.
- Read-only field rejection.
- Sync commit success and partial failure.
- Schema drift response shape.
- Conflict response shape.
