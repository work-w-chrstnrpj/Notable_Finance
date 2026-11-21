# 05: Backup, activity log, chat parity and docs

**Type:** dev
**Status:** in-progress
**Blocked by:** 02, 03, 04
**Owner:** unassigned

## What to build
Saved budgets are protected and documented. Database backups report them and restore them, and a backup from before this feature still restores cleanly. Saving, editing, deleting and importing saved budgets leave activity entries (counts only). A full local reset warns the user to export saved budgets first. The chat assistant can report budgets on either source and defaults to Notion, so its answers do not change. The docs and changelog describe the feature.

## Acceptance criteria
- [x] AC1: A database backup and restore keeps saved budgets, and the backup's table counts include them.
- [x] AC2: Restoring a backup made before this feature works and shows no saved sets.
- [x] AC3: Save, edit, delete and import each record an activity entry with counts only and no row dumps.
- [x] AC4: The full local reset confirmation tells the user to export saved budgets first (it also says the reset keeps them, because they live only on this computer).
- [x] AC5: The chat read tool and the monitoring report accept an optional budget source that defaults to Notion, and answers are unchanged when it is not given.
- [x] AC6: No chat write tool for saved budgets is added.
- [x] AC7: `wiki/desktop/local-data-schema.md`, `wiki/desktop/ipc-contract.md`, `wiki/shared/product-specification.md`, the app changelog and the `GLOSSARY.md` terms (no longer "proposed, not built") are updated, and `AGENTS.md` if the structure changed.
- [x] AC8: `wiki/desktop/monthly-budget-snapshots.md` status changes from "not implemented" to implemented.
- [x] AC9: `tickets/features/monthly-budget-snapshots.md` is marked superseded by these tickets.

## Inputs
- `tickets/monthly-budget/spec.md`
- `wiki/desktop/monthly-budget-snapshots.md` (sections 10, 13, 15)
- `docs/adr/0006-saved-budgets-local-only.md`
- Tickets 02, 03 and 04

## Evidence
- Commits:
- PR:
- Tests: `ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron node_modules/vitest/vitest.mjs run` (see progress log); tests named `monthly-budget/05#AC1`..`AC6` in `test/backup.test.ts`, `test/budgets-activity.test.ts`, `test/monitoring-budget-source.test.ts`, `src/renderer/src/components/pages/sync-reset.test.tsx`. AC7 to AC9 are doc edits, checked by reading.
- Review:
- Docs updated: `wiki/desktop/local-data-schema.md`, `wiki/desktop/ipc-contract.md`, `wiki/shared/product-specification.md`, `notable-finance-app/CHANGELOG.md`, `GLOSSARY.md`, `wiki/desktop/monthly-budget-snapshots.md`, `tickets/features/monthly-budget-snapshots.md`. `AGENTS.md` unchanged (structure did not change).

## Progress log
### 2026-11-18 claude
- Did: Created from the spec at the user's approval of the breakdown.
- Next: Wait for 02, 03 and 04, then claim. Use the existing backup test as prior art for AC1 and AC2.

### 2026-11-18 claude
- Did: Claimed. Added `monthly_budget_snapshots` to the backup counts (AC1); a pre-feature backup test (drops the table and the last migration row, then restores) (AC2); `budgets:save|delete|import` operation-log entries with counts only, written in `ipc/budgets.ts` (AC3); reset confirmation wording (AC4); optional `budgetSource` on `reports.monitoring`, `getMonthlyMonitoringSnapshot` and `getCategoryBudgetStatus` and their tool schemas, default Notion (AC5); no chat write tool (AC6); docs, changelog, glossary, spec status and the old feature ticket marked superseded (AC7 to AC9).
- Decision: The History page is the Notion sync feed (pull/push, incomes/expenses only), so budget events went to the existing operation log (`logDevOperation`, as `backup:import` does) instead of `activity_log`. Say if you want them in the History page; that needs a new resource type there.
- Decision: The in-app Reset local database does not wipe saved budgets (its wipe list omits the table; ticket 02 AC8 tests that). The warning therefore says they are kept but exist only on this computer, so export first. The spec line that a full reset removes them only holds for deleting the database file.
- Next: Run `[serve]` after 02 to 04 are closed; this ticket is not committed.
