# Command Reference

## Current Status

No application tooling has been selected yet. These commands are documentation/planning helpers only.

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

Add these after project scaffolding:

- `npm install`: install dependencies.
- `npm run dev`: start local development services.
- `npm run dev:frontend`: start the Next.js frontend.
- `npm run dev:backend`: start the NestJS backend.
- `npm run lint`: run ESLint.
- `npm run typecheck`: run TypeScript checks.
- `npm run test`: run unit tests.
- `npm run test:integration`: run backend/API integration tests.
- `npm run test:e2e`: run Playwright end-to-end tests.
- `npm run build`: build deployable artifacts.
- `npm run db:migrate`: apply PostgreSQL metadata-store migrations after approval.
- `npm run schema:verify`: call backend Notion schema verification after the integration key is configured.

Each command should document what it does, whether it mutates files, and whether approval is required.

Recommended tooling:

- ESLint for linting.
- TypeScript for typechecking.
- Vitest for shared/frontend-friendly unit tests.
- React Testing Library for frontend component tests.
- Jest or Vitest for NestJS unit tests, depending on scaffold defaults.
- Supertest for backend HTTP integration tests.
- Playwright for end-to-end tests.
