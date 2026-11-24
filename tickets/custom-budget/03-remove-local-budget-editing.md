# 03: Remove local editing of custom budgets

**Type:** dev
**Status:** in-progress
**Blocked by:** 02
**Owner:** claude

## What to build
The app no longer edits saved budgets: Save budgets from Notion, editing, replacing and deleting a month's set, and CSV import are removed from Monitoring and Settings. CSV export stays in Settings as a read-only copy (Monitoring has no export or budget-actions button). Chat tools and docs that wrote or described local editing are updated. Backups still include the cache.

## Acceptance criteria
- [x] AC1: Monitoring and Settings have no action that creates, edits, replaces or deletes custom budgets in the app.
- [x] AC2: CSV import is gone and CSV export (Settings only) still writes the cached budgets.
- [x] AC3: Chat has no tool or wording that changes custom budgets, and describes them as edited in Notion.
- [x] AC4: The reset confirmation and export hints read correctly now that Notion is the source.
- [x] AC5: The wiki pages, tests and end-to-end tests that referred to local editing or the old labels are updated, and the full suites pass.

## Inputs
- docs/adr/0010-custom-monthly-budget-database-is-source-of-truth.md
- GLOSSARY.md: Custom monthly budget, Budget source, Budget period
- Grill session 2026-11-25

## Evidence
- Commits:
- PR:
- Tests: typecheck clean; vitest 64 files / 584 tests pass; Playwright 51 pass; eslint 0 errors
- Review:
- Docs updated: wiki/desktop/monthly-budget-snapshots.md, wiki/desktop/ipc-contract.md

## Progress log
### 2026-11-25 claude
- Did: Created from the grill-with-docs session (the user said "yes to all" to five points).
- Next: /cook-a-ticket custom-budget/03

### 2026-11-24 claude
- Did: Removed Save budgets from Notion, Edit/replace/delete a month's set, CSV import and the template export from Monitoring, Settings, IPC, preload, db and shared helpers (JSON view, typed-budget parsing). CSV export of the cache stays. Chat wording now says custom budgets are edited in Notion; the reset confirmation says they stay in Notion and are refilled on the next sync. Tests and the e2e were rewritten around a seeded cache; deleted the activity test for the removed handlers.
- Next: commit when the owner says so; board status via /cook-a-ticket [serve].

### 2026-11-24 claude
- Requirement change: the owner does not want the (i) budget-actions button or the Export button on Monitoring. AC1/AC2 now say Monitoring has no budget actions at all; export stays only in Settings.
