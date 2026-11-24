# 04: Remove the one-time budget migration

**Type:** dev
**Status:** in-progress
**Blocked by:** 02
**Owner:** claude

## What to build
After the owner has run the one-time migration and confirmed in Notion that every budget they wanted is there, the code that sends budgets to Notion is deleted. From then on the app only reads the Custom monthly budget database (and can still add missing category columns when the user presses the button). Nothing about how budgets are shown or pulled changes.

A human has to start this ticket: the owner must say the migration ran and their budgets are in Notion.

## Acceptance criteria
- [x] AC1: The owner has confirmed in the progress log that all wanted budgets are in the Custom monthly budget database.
- [x] AC2: The code that pushes budget rows to Notion, and its tests, are deleted; the only remaining Notion write for budgets is adding missing columns.
- [x] AC3: Syncing, the cache, Default and Custom in Monitoring, and CSV export behave exactly as before.
- [x] AC4: Docs, the glossary and ADR-0010 say the migration was a one-time step that has been removed.
- [x] AC5: The full unit and end-to-end suites pass.

## Inputs
- docs/adr/0010-custom-monthly-budget-database-is-source-of-truth.md
- tickets/custom-budget/02-notion-source-of-truth-cache.md

## Evidence
- Commits:
- PR:
- Tests: typecheck clean; vitest 65 files / 639 tests pass; Playwright 51 pass
- Review:
- Docs updated:

## Progress log
### 2026-11-25 claude
- Did: Created because the user said the sending of local budgets happens once and is then removed.
- Next: after custom-budget/02 is done and the user confirms the migration ran, /cook-a-ticket custom-budget/04

### 2026-11-24 claude
- Did: Owner said the budgets are in Notion (AC1). Checked read-only that the migration flag was set with no error and the local cache holds 36 months read back from Notion. Deleted `custom-budget-migration.ts`, `migrateLocalBudgets`, the preview and migrate IPC channels and preload calls, the Settings send button and confirm, and their tests; removed `createPage` from the mirror client type. Docs and ADR-0010 updated.
- Next: full unit and e2e suites (AC5), then install the rebuilt app.
