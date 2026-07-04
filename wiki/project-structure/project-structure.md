# Project Structure

## Current State

This repository contains project planning, AI structure, the first frontend implementation foundation, and the first backend implementation foundation. The `application/` folder contains a Next.js app scaffold and mock Notion-backed UI surfaces. The `service/` folder contains a NestJS backend scaffold with route modules, validation, mapping, sync orchestration, schema status, and tests. Shared contracts and cross-cutting tests remain planned unless source files are added in those folders.

## Repository Tree

```text
notion-finance/
  application/          Next.js finance UI application foundation.
  service/              NestJS backend API and Notion integration service foundation.
  shared/               Future shared contracts, types, schemas, constants, and mappers.
  tests/                Future automated and manual test assets.
  tickets/              Planning and task artifacts.
  wiki/                 Product, technical, data, API, testing, deployment, and diagram docs.
  .agents/              Canonical AI roles, skills, overlays, workflows, and tool policies.
  .ai/                  Context routing, maps, prompt recipes, and index guidance.
  .claude/              Generated Claude adapter files.
  .codex/               Generated Codex adapter files.
  .cursor/              Generated Cursor adapter files.
  .github/              Generated GitHub/Copilot adapter files and repo automation.
  .opencode/            Generated OpenCode adapter files.
  scripts/              AI adapter and maintenance scripts.
```

## Planned Module Responsibilities

### `application/`

Owns the user-facing finance experience. Current foundation files include Next.js routing, a finance workspace shell, typed mock DTO data, frontend field-visibility rules, a backend API client boundary, CSS, and rule tests.

- Dashboard and summary views.
- Accounts, income category, and expense category reference/configuration screens.
- Income, transaction, expense, expense scheduler, Transfer, Credit Card Payment, Alkansya, Receivables, Dashboard, and Monthly Monitoring screens.
- Create/edit forms for supported transactional records that show writable fields only.
- Sync status UI and pending operation indicators.
- API client calls to the backend service.

The frontend must not call Notion directly and must not contain Notion tokens.
Account and category maintenance remains a Notion-only function; the app should not expose create, edit, or delete actions for Accounts, Income Categories, or Expense Categories.

### `service/`

Owns backend behavior. Current foundation files include NestJS modules/controllers for the planned `/api/v1` surface, server-side config loading, a Notion adapter boundary backed by an in-memory development repository, field mapping, mutation validation, sync orchestration, schema-status reporting, auth shell endpoints, and backend tests.

- Authentication and authorization, if implemented.
- HTTP API endpoints.
- Input validation.
- Notion API client and adapter. The current implementation uses a development repository behind the adapter boundary until live Notion credentials and schema verification are available.
- Notion schema/property mapping.
- Sync orchestration.
- Conflict detection.
- Schema drift checks.
- Error normalization.
- App metadata persistence for sync logs, pending mutations, conflicts, audit events, sessions if needed, and cached snapshots.

### `shared/`

Owns cross-layer contracts:

- DTOs and API response types.
- Field access classifications.
- Entity/resource names.
- Validation schemas where sharing is safe.
- Formatting constants and enums.

Shared code must not import frontend-only or backend-only runtime modules.

### `tests/`

Owns cross-cutting verification assets:

- Unit test fixtures.
- Integration test fixtures.
- Contract tests.
- E2E tests.
- Manual test cases and evidence templates.

### `wiki/`

Owns project intent and planning truth:

- `product-specification/`: product behavior and acceptance criteria.
- `tdd/`: technical design and architecture intent.
- `api/`: API contract planning.
- `database/`: Notion-backed data model and field access contract.
- `diagrams/`: context, data flow, ERD, and user flow diagrams.
- `testing/`: test strategy.
- `deployment/`: deployment and operations planning.
- `development-plan/`: phased work plan and status.
- `commands/`: command reference once tooling exists.

## Dependency Direction

Expected dependency direction after implementation:

```text
application -> shared
service -> shared
service -> Notion API
tests -> application/service/shared
```

Forbidden dependency directions:

- `shared` must not depend on `application` or `service`.
- `application` must not depend on the Notion SDK or direct Notion API calls.
- `application` must not read server-only environment variables.
- `service` must not depend on frontend UI components.

## Naming Conventions

Use stable domain names:

- `accounts`
- `income-categories`
- `incomes`
- `transactions`
- `expense-categories`
- `expenses`
- `expense-scheduler`
- `sync`
- `notion`

Use camelCase for API fields and keep raw Notion property names inside the backend mapping layer.

## Adding A Module

Before adding implementation code:

1. Confirm the module is in scope in `wiki/product-specification/product-specification.md`.
2. Confirm the technical boundary in `wiki/tdd/tdd.md`.
3. Define API/data contracts in `wiki/api/api-specification.md` and `wiki/database/data-model.md`.
4. Add tests or manual verification expectations.
5. Keep the edit small and reviewable.

## Current Implementation Constraint

Application and backend source code have started because implementation was explicitly requested. Continue to keep frontend work behind the backend API boundary, avoid Notion secrets in the browser, and add live Notion or database behavior only when the needed credentials, schema access, and implementation scope are confirmed.
