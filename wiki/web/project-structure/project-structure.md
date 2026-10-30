# Project Structure

## Current State

The repository is a monorepo hosting two applications: `notable-finance-web/` (Next.js frontend + NestJS backend) and `notable-finance-app/` (Electron + local SQLite). This document specifies the structure and responsibilities of the **web application** (`notable-finance-web/`).

The web application is at **v1.1.0**, featuring full CRUD for transactional workflows, live and cached Notion sync, schema drift detection, user preferences, PostgreSQL (Neon Free) app metadata persistence, Passport JWT authentication, and automated tests.

## Repository Tree

```text
notable-finance/
  notable-finance-web/    Web application root (holds web package.json).
    application/          Next.js finance UI application (App Router).
    service/              NestJS backend API and Notion integration service.
    package.json          Root commands for frontend and backend.
  notable-finance-app/    Desktop application (Electron + SQLite local-first app; see wiki/desktop/).
  shared/                 Future shared contracts, types, schemas, constants, and mappers.
  tests/                  Cross-cutting automated and manual test assets.
  tickets/                Planning, task, and investigation artifacts.
  wiki/                   Documentation zones: shared/, web/, desktop/.
  .agents/                Canonical AI roles, skills, overlays, workflows, and tool policies.
  .ai/                    Context routing, maps, prompt recipes, and index guidance.
  scripts/                AI adapter and maintenance scripts.
```

## Module Responsibilities (`notable-finance-web/`)

### `application/` (`notable-finance-web/application/`)

Owns the user-facing finance experience. Built with Next.js (App Router) and React Query.

- Dashboard and summary views.
- Accounts, income category, and expense category reference/configuration screens.
- Income, transaction, expense, expense scheduler, Transfer, Credit Card Payment, Alkansya, Receivables, Dashboard, and Monthly Monitoring screens.
- Create/edit forms for supported transactional records that show writable fields only.
- Sync status UI, pending operation indicators, conflict display, and toast notifications.
- Typed API client calls to the backend service `/api/v1`.

The frontend must not call Notion directly and must not contain Notion tokens.
Account and category maintenance remains a Notion-only function; the app should not expose create, edit, or delete actions for Accounts, Income Categories, or Expense Categories.

### `service/` (`notable-finance-web/service/`)

Owns backend behavior. Built with NestJS.

- Authentication and authorization (Passport JWT, email and Google sign-in).
- HTTP API endpoints under `/api/v1`.
- Input validation and mutation guards.
- Notion API client, live adapter, in-memory cache, and property mapper.
- Sync orchestration (pull → push → pull) and conflict handling.
- Schema drift detection and verification endpoints.
- Error normalization and Winston structured logging.
- App metadata persistence (PostgreSQL / Neon Free via TypeORM/SQL migrations) for sync logs, activity logs, user preferences, and cached snapshots.

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

1. Confirm the module is in scope in `wiki/web/product-specification/product-specification.md`.
2. Confirm the technical boundary in `wiki/web/tdd/tdd.md`.
3. Define API/data contracts in `wiki/web/api/api-specification.md` and `wiki/web/database/data-model.md`.
4. Add tests or manual verification expectations.
5. Keep the edit small and reviewable.

## Current Implementation Constraint

Application and backend source code have started because implementation was explicitly requested. Continue to keep frontend work behind the backend API boundary, avoid Notion secrets in the browser, and add live Notion or database behavior only when the needed credentials, schema access, and implementation scope are confirmed.
