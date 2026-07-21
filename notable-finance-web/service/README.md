# Notable Finance Service

NestJS backend service for the Notable Finance app.

## Current Scope

The service exposes the planned `/api/v1` foundation for:

- Health, auth shell, schema status, sync status, sync pull, and sync commit.
- Read-only Accounts, Income Categories, Expense Categories, and Monthly Monitoring.
- Writable Incomes, Transactions, Transfer, Credit Card Payment, Alkansya, Receivables, Expenses, and Expense Scheduler resources.
- Field mapping and mutation validation that rejects read-only, computed, hidden, and out-of-scope fields before writes.
- App-calculated Dashboard and Monthly Monitoring summaries from scoped income and expense records.

The current implementation uses an in-memory Notion-shaped development repository behind `NotionService`. This keeps routes, validation, sync behavior, soft-delete rules, and tests executable without exposing or requiring a real Notion token. The live Notion client and PostgreSQL metadata persistence remain the next backend integration steps.

## Commands

```bash
npm --prefix service install
npm --prefix service run typecheck
npm --prefix service run test
npm --prefix service run build
```

## Environment

Copy `.env.example` when running locally. Notion tokens and database IDs must stay server-side.

```bash
cp service/.env.example service/.env
```

Do not commit `.env`, Notion tokens, PostgreSQL credentials, or provider secrets.
