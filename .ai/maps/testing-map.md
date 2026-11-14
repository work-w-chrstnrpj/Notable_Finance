# Testing Map

Use this map for test planning and implementation.

## Read First

- `wiki/desktop/desktop-testing-strategy.md`
- `tests/README.md`

## Test Areas

- Vitest unit and integration tests in `notable-finance-app/test/` (main process) and next to renderer components.
- Playwright + Electron e2e tests in `notable-finance-app/e2e/` (not part of `npm test`).
- Manual tests against a non-production Notion workspace.

## Commands (run in `notable-finance-app/`)

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`.

## Rule

Do not claim checks passed unless they actually ran.
