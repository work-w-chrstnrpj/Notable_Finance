# 04: CSV export and import of saved budgets

**Type:** dev
**Status:** in-progress
**Blocked by:** 02
**Owner:** claude

## What to build
The user can export saved budgets to a CSV file (all of them, or only the months in the current range), export a template prefilled with today's Notion budgets for a range of months, and import a CSV back. Import shows a preview of new, changed, unchanged and invalid rows before anything is written, lets the user overwrite matching rows or skip months that already have saved budgets, and then writes everything in one step or nothing at all. Nothing is sent to Notion.

## Acceptance criteria
- [x] AC1: Export writes `Month,Category,Budget` as UTF-8 with a BOM and CRLF line endings, sorted by month then category, quoting names that contain commas or quotes, to a file chosen in the save dialog.
- [x] AC2: Export can cover all saved months or only the current range, and the template export has one row per month and category prefilled with current Notion budgets.
- [x] AC3: Exporting and then importing into an empty set reproduces identical rows, and the template imports without errors.
- [x] AC4: Import matches categories by trimmed, case-insensitive name, accepts `YYYY-MM` or `YYYY-MM-DD` months, tolerates `₱` and thousands commas, and ignores extra columns and header case.
- [x] AC5: The preview counts new, changed, unchanged and invalid rows and lists each invalid row with its reason (unknown category, ambiguous name, bad month, bad budget, duplicate within the file).
- [x] AC6: Import never creates a category; rows that cannot be matched are skipped and listed, and valid rows still import.
- [x] AC7: The user can choose Overwrite matching rows (default) or Skip months that already have saved budgets; rows not in the file stay.
- [x] AC8: Import is disabled when there are no valid rows, and a file over 5 MB or over 20,000 rows is rejected with a message.
- [x] AC9: The commit is atomic: if any write fails, no row from the file is saved.
- [x] AC10: The parsed rows stay in the main process between preview and commit; the renderer never sends raw rows back.
- [x] AC11: Export and import make no Notion API call.
- [ ] AC12: Settings has a Saved budgets section with Export and Import buttons that cover every saved month at once, with no month or range to choose; import still shows the preview and the overwrite or skip choice.

## Inputs
- `tickets/monthly-budget/spec.md`
- `wiki/desktop/monthly-budget-snapshots.md` (sections 8, 9, 13)
- `tickets/monthly-budget/02-saved-budgets-data-layer.md`
- `test/backup.test.ts` (prior art for a temporary database and the Electron mock)

## Evidence
- Commits: pending (uncommitted)
- PR:
- Tests: `test/budget-csv.test.ts` (pure, 18 tests), `test/budget-files.test.ts` (15 tests, SQLite and mocked dialogs; run under Electron's Node, skipped under plain `npm test`), and the Import screen tests in `monitoring-budgets.test.tsx`. All 549 tests pass under Electron's Node. `npm run typecheck` clean, `eslint` 0 errors.
- Review: `code-review` against `HEAD` (uncommitted). Fixed: (1) the Edit budgets modal reloaded its saved set whenever Monitoring re-rendered, which would have wiped what the user was typing; it now reloads only when the category list changes. (2) the Import modal would open two file dialogs under React StrictMode in development; it now opens one. (3) a budget cell with a muted Notion line sorted as text; it now carries a numeric value and sorts as a number. Each has a regression test. Noted, not changed: export does not escape cells that start with `=`, `+`, `-` or `@` (spreadsheet formula injection), low risk because category names come from the user's own Notion; row and name lengths in `budgets:saveSet` are not capped; the resolution function's complexity warning (19 against a limit of 15).
- Docs updated: `wiki/desktop/monthly-budget-snapshots.md` (corrected the 81,000 example); the schema, IPC and product docs are for ticket monthly-budget/05

## Progress log
### 2026-11-18 claude
- Did: Created from the spec at the user's approval of the breakdown. It can run beside 03, since its tests sit in the main process.
- Next: Wait for 02, then claim. Test through parse, preview and commit, and the export-then-import round trip.

### 2026-11-18 claude
- Did: Claimed with `/cook-a-ticket` (cook only: no tests, no review, no commit). Working on the current branch `development` because no working branch is set.

### 2026-11-18 claude
- Did: Cooked the code (no tests written, no criteria ticked, nothing committed). Added the CSV module (format with BOM and CRLF, an RFC 4180 reader, tolerant amount and month parsing, row classification), the file module (save and open dialogs, export of saved budgets or a template, a preview held in main, an atomic commit through one transaction), the IPC handlers, and the Export and Import modals on Monitoring.
- Decisions: A preview is re-checked against current data at commit, so a stale preview never writes stale decisions. Changing the overwrite / skip policy re-checks the same file without reopening the dialog. Export uses today's category name when the category still exists, so the file imports back by name. Previews are capped at 300 rows on screen with invalid rows first; the cap does not limit what is imported.
- Checked (not as tests): a scratch script showed the BOM and CRLF output, quoting of a name with a comma and quotes, `₱5,000.50` read as a number, a `YYYY-MM-DD` month truncated, a bad month and an unknown category flagged as invalid, and a lowercase name matched to its category. The dialog and database parts were not run.
- Next: Write the tests at the parse, preview and commit seam, including the export-then-import round trip, tick the criteria they prove, then review and serve.
- Docs to check: `wiki/desktop/ipc-contract.md` (ticket 05 covers it).

### 2026-11-18 claude
- Did: Ran `test` and `review`. Added `test/budget-csv.test.ts`, `test/budget-files.test.ts` and the Import screen tests; all eleven criteria are ticked. Export-then-import round trip, the template, the atomic rollback (a trigger forces the second write to fail) and the single-use preview id are covered.
- Review fixes: the Import modal opens one file dialog under StrictMode (see Evidence).
- Next: `taste` and `serve` when the user is ready. Not committed.

### 2026-11-18 claude
- Requirement change: the user asked for Settings to export and import the monthly budgets all at once, not by month ("In settings, give the ability to Export and Import the monthly budgets, all at once"). Added AC12; AC1 to AC11 are unchanged, and the Monitoring Export and Import keep working.
- Did: Added a Saved budgets panel to Settings. Export writes every saved month straight to the file chosen in the save dialog. Import reuses the existing preview, policy choice and atomic commit. AC12 is not ticked: no test names it yet.
- Checked: `typecheck` clean, `eslint` 0 errors on the changed files, the existing unit tests (512 passed, 37 skipped under plain Node) and all 49 Playwright specs pass after the change. Not run: no test names AC12 yet, so it stays unticked; the gate will not pass until one does. Next: `/cook-a-ticket [test]` to add it. Not committed.
