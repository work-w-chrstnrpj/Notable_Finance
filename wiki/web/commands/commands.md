# Command Reference

## Current Status

Frontend tooling has started under `application/`. Backend tooling has started under `service/`. Integration and end-to-end tooling remain pending.

## Frontend Commands

Run these from `application/`:

```powershell
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

- `npm install`: installs the Next.js frontend dependencies.
- `npm run dev`: starts the local Next.js development server.
- `npm run lint`: runs ESLint against the frontend source.
- `npm run typecheck`: runs TypeScript without emitting files.
- `npm run test`: runs Vitest rule tests.
- `npm run build`: builds the Next.js application.
- `npm run test:e2e`: placeholder until Playwright coverage is added.

## Backend Commands

Run these from the repository root:

```powershell
npm --prefix service install
npm --prefix service run typecheck
npm --prefix service run test
npm --prefix service run build
```

- `npm --prefix service install`: installs backend dependencies.
- `npm --prefix service run typecheck`: runs TypeScript without emitting files.
- `npm --prefix service run test`: runs Vitest backend tests against the development Notion-shaped repository.
- `npm --prefix service run build`: builds the NestJS service with TypeScript.

## Documentation Checks

Find template placeholders that may still need project-specific updates:

```powershell
rg -n "\[Project Name\]|\[State the project goal here\.\]|Suggested Sections|intended to" AGENTS.md wiki
```

Find draft files that should not remain canonical:

```powershell
Get-ChildItem -Recurse wiki -Filter *-draft.md
```

List wiki files:

```powershell
Get-ChildItem -Recurse wiki -File
```

## Recommended Future Commands

Add or expand these as backend and integration scaffolding land:

- `npm run dev:frontend`: start the Next.js frontend.
- `npm run dev:backend`: start the NestJS backend.
- `npm run test:integration`: run backend/API integration tests.
- `npm run test:e2e`: run Playwright end-to-end tests.
- `npm run db:migrate`: apply PostgreSQL metadata-store migrations after approval.
- `npm run schema:verify`: call backend Notion schema verification after the integration key is configured.

Each command should document what it does, whether it mutates files, and whether approval is required.

Recommended tooling:

- ESLint for linting.
- TypeScript for typechecking.
- Vitest for shared/frontend-friendly unit tests.
- React Testing Library for frontend component tests.
- Jest or Vitest for NestJS unit tests, depending on scaffold defaults.
- Direct controller/service contract tests for the current backend scaffold; Supertest or equivalent HTTP integration tests can be added when socket-based test execution is available.
- Playwright for end-to-end tests.
