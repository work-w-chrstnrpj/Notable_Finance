# 02: Notion as the source for custom budgets, with a read-only cache

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
The one-time migration is temporary and is removed afterwards by custom-budget/04; build it so it can be deleted cleanly (one self-contained piece).

When a database ID is saved, each sync pulls the Custom monthly budget database into the local cache, replacing it from Notion. The first time, local months that have no row in Notion are pushed once as Jan 2025 rows, never overwriting a Notion row; if any push fails, local data is kept and the cache is not replaced. After that Notion always wins. A month uses its most specific row (month, quarter, half, year); quarter, half and year rows are split evenly across their months. A month with no row uses the Default budget. The mirror on/off switch, the newest-edit-wins rule and the overwritten-values list go away.

## Acceptance criteria
- [ ] AC1: With an ID saved, a sync replaces the local cache with the rows pulled from Notion.
- [ ] AC2: The one-time migration pushes only local months that have no Notion row and never changes a Notion row.
- [ ] AC3: If the migration fails for any month, the local data is kept and the cache is not replaced.
- [ ] AC4: After migration, an edit made in Notion always replaces the cached value on the next sync.
- [ ] AC5: When rows overlap for a month, the month row wins over quarter, half and year, in that order.
- [ ] AC6: Quarter, half and year rows are split evenly across their months, adding back to the total.
- [ ] AC7: A month with no row uses the Default budget, and a category with no column is skipped.
- [ ] AC8: The mirror switch, newest-edit-wins and the overwritten-values list are removed, and Settings shows the database status, the missing columns and Add missing columns.

## Inputs
- docs/adr/0010-custom-monthly-budget-database-is-source-of-truth.md
- GLOSSARY.md: Custom monthly budget, Budget source, Budget period
- Grill session 2026-11-25

## Evidence
- Commits:
- PR:
- Tests:
- Review:
- Docs updated:

## Progress log
### 2026-11-25 claude
- Did: Created from the grill-with-docs session (the user said "yes to all" to five points).
- Next: /cook-a-ticket custom-budget/02

### 2026-11-25 claude
- Requirement change: the user said the sending of local budgets happens once and the functionality is then removed. The migration stays in this ticket, built as one removable piece; removal is custom-budget/04.

### 2026-11-25 claude
- Did: Cooked. The mirror module is now a sync that replaces the local cache from the Custom monthly budget database on every sync (Notion always wins; most specific row wins; quarter, half and year rows split evenly; no row means Default; categories without a column are skipped). The mirror switch, newest-edit-wins and the overwritten-values list are gone. New replaceAllSavedBudgets (one transaction). The one-time send is its own file, custom-budget-migration.ts, so it can be deleted whole.
- Decision: the one-time send is started by a button in Settings ("Send saved budgets to Notion") with a confirmation showing the counts, not automatically on the first sync, so nothing is written to the user's Notion without their say-so. Until it is done, and while local months exist, the cache is left alone so nothing is lost. It refuses while category columns are missing. With no local months it is marked done automatically.
- Tests: rewrote test/saved-budgets-mirror.test.ts (named custom-budget/02#ACn). Typecheck clean, eslint 0 errors, 643 unit and 51 e2e tests pass. The Notion calls have never run against real Notion. No criteria are ticked (cooked without the test step).
- Docs updated: wiki monthly-budget-snapshots section 17.
