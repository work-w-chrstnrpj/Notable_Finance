# 02: Saved budgets data layer

**Type:** dev
**Status:** done
**Blocked by:** None
**Owner:** claude

## What to build
The app can store saved budgets per month locally and work out the budget each category is judged against for any range of months, with the source set to Notion or Saved. In Notion mode the result is identical to today. In Saved mode a month with a saved set uses it (a category missing from it counts as 0), and a month without one falls back to Notion budgets. The app can list, copy from Notion, replace and delete a month's saved set, and remembers the chosen budget source. There is no screen yet.

## Acceptance criteria
- [x] AC1: A new additive migration creates the saved-budgets table, unique per month and category, and an existing database upgrades without losing data.
- [x] AC2: Saving rejects a month that is not a real `YYYY-MM` and a budget that is negative or not a finite number; budgets are rounded to 2 decimals.
- [x] AC3: The app can copy current Notion budgets into a month (asking to replace when the month already has a set), replace a month's set in one transaction, delete a month's set, and list saved rows for a range.
- [x] AC4: With the source on Notion, the resolved budgets equal the current monthly budget times the months in range for Monthly, Quarterly, Semi-Annually and Annually.
- [x] AC5: With the source on Saved, a month with a saved set uses it and a category missing from it counts as 0; a month with no saved set uses Notion budgets; an explicit saved 0 stays 0.
- [x] AC6: Saved mode with Food at 5,000 for 5 months and 8,000 for 7 months gives an Annually Food budget of 81,000.
- [x] AC7: Resolution reports how many months in the range have a saved set, builds the month list correctly across a year boundary, and includes categories that appear only in saved rows.
- [x] AC8: Sync reset, discard-unsynced and a Notion re-pull leave saved rows unchanged.
- [x] AC9: The budget source setting defaults to Notion, accepts only Notion or Saved, and persists across restarts.
- [x] AC10: No saved-budget action calls the Notion API.

## Inputs
- `tickets/monthly-budget/spec.md`
- `wiki/desktop/monthly-budget-snapshots.md` (sections 4, 5, 9, 13)
- `docs/adr/0004-derived-values-computed-not-stored.md`
- `docs/adr/0006-saved-budgets-local-only.md`
- `GLOSSARY.md` (Saved budget, Budget source)

## Evidence
- Commits: shipped in desktop v3.1.0 (merge 7bf9d4c on main)
- PR: https://github.com/work-w-chrstnrpj/Notable_Finance/pull/11 merged (7bf9d4c)
- Tests: `npx vitest run` under Electron's Node (so the SQLite tests run): 56 files, 549 tests passed. Files: `test/saved-budgets.test.ts`, `test/budgets-repo.test.ts`, `test/ui-settings.test.ts`. Under plain `npm test` the SQLite-backed tests skip because the binding targets Electron (same as `test/backup.test.ts`): 512 passed, 37 skipped. `npm run typecheck` clean, `eslint` 0 errors.
- Review: `code-review` against `HEAD` (uncommitted). Fixed: (1) the Edit budgets modal reloaded its saved set whenever Monitoring re-rendered, which would have wiped what the user was typing; it now reloads only when the category list changes. (2) the Import modal would open two file dialogs under React StrictMode in development; it now opens one. (3) a budget cell with a muted Notion line sorted as text; it now carries a numeric value and sorts as a number. Each has a regression test. Noted, not changed: export does not escape cells that start with `=`, `+`, `-` or `@` (spreadsheet formula injection), low risk because category names come from the user's own Notion; row and name lengths in `budgets:saveSet` are not capped; the resolution function's complexity warning (19 against a limit of 15).
- Docs updated: `wiki/desktop/monthly-budget-snapshots.md` (corrected the 81,000 example); the schema, IPC and product docs are for ticket monthly-budget/05

## Progress log
### 2026-11-18 claude
- Did: Created from the spec at the user's approval of the breakdown.
- Next: Claim and implement test-first at two seams: the pure resolution function, and the repository on a temporary SQLite database.

### 2026-11-18 claude
- Did: Claimed with `/cook-a-ticket` (cook only: no tests, no review, no commit). Working on the current branch `development` because no working branch is set.

### 2026-11-18 claude
- Did: Cooked the code (no tests written, no criteria ticked, nothing committed). Added the migration `0015` with its journal entry and the drizzle table, a repository (list, replace set, copy from Notion, delete set, bulk upsert), the shared `resolveBudgets` / `monthsInRange` module, validation helpers, the `budgets:*` channels with the preload bridge, and the `monitoringBudgetSource` setting (default `notion`).
- Decisions: Saved rows match a current category by id, then by name, so a full Notion re-pull (which mints new local category ids) does not orphan saved budgets. Rows that match no current category stay and show as a removed category. The category list is the one Monitoring shows (non-auxiliary).
- Requirement change: AC6 said 61,000; 5 x 5,000 + 7 x 8,000 is 81,000. Corrected the number in this ticket and in the wiki spec (section 13, item 3). No behaviour change.
- Checked (not as tests): `typecheck` clean, `lint` 0 errors, the existing `npm test` passes (451 passed, 7 skipped), the migration SQL runs in sqlite3 and the unique rule fires, and a scratch script gave Annually Food 81,000 and the year-boundary month list. The database-backed checks (AC1, AC3, AC8) were not run: the `better-sqlite3` binding does not match system Node.
- Next: Write the tests at the two seams, tick the criteria they prove, then review and serve.
- Docs to check: `wiki/desktop/local-data-schema.md`, `wiki/desktop/ipc-contract.md` (ticket 05 covers these).

### 2026-11-18 claude
- Did: Ran `test` and `review`. Wrote `test/saved-budgets.test.ts`, `test/budgets-repo.test.ts` and an addition to `test/ui-settings.test.ts`; all ten criteria are ticked because a passing test names each. SQLite-backed tests run under Electron's Node (`ELECTRON_RUN_AS_NODE=1 electron node_modules/vitest/vitest.mjs run`); they skip under plain `npm test` on this machine.
- Note: AC8 (sync never touches saved rows) and AC10 (no Notion call) are proven partly by source checks (the sync and discard code and the budget modules never name the table or import Notion) plus a re-pull simulation, not by running a real sync.
- Next: `taste` and `serve` when the user is ready. Not committed.

### 2026-11-21 claude
Closed after release: code shipped in desktop v3.1.0. Criteria checked against passing tests (full suite 583 passed, 41 SQLite tests skipped under plain Node; typecheck and lint clean).
