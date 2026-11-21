# 03: Monitoring budget source toggle and editing

**Type:** dev
**Status:** in-progress
**Blocked by:** 02
**Owner:** claude

## What to build
On Monitoring the user sees a Budget source control (Notion | Saved) beside the view mode and a badge saying which budgets are in use. In Saved mode they can save the current Notion budgets into a month, edit a month's saved budgets category by category, and delete a month's saved budgets. Budget, spending and remaining figures and the zero filters use the resolved budgets in all four view modes. With Notion selected, everything looks and adds up as it does today.

## Acceptance criteria
- [x] AC1: With the source on Notion, Monitoring figures are identical to the previous release in Monthly, Quarterly, Semi-Annually and Annually.
- [x] AC2: Saving budgets for January and then changing Food's Notion budget leaves January's Saved-mode remaining unchanged and Notion-mode remaining updated.
- [x] AC3: The badge shows "Notion budgets", "Saved budgets", "Saved budgets: N of M months" or "No budget saved" to match the source and coverage, on one short line.
- [x] AC4: Save budgets for this month works for any month, past, current or future, and asks "Replace the saved budgets for <Month Year>?" when that month already has a set.
- [x] AC5: Edit budgets shows one row per category with its saved budget and the Notion budget as a muted reference, and offers Fill from Notion, Delete, Save and Cancel.
- [x] AC6: Invalid input in Edit budgets blocks Save and shows error text; a valid Save writes the whole set at once.
- [x] AC7: Deleting a month's saved budgets asks "Delete saved budgets for <Month Year>?" for every month, and afterwards the month uses Notion budgets.
- [ ] ~~AC8: In Saved mode a category whose period budget differs from the Notion figure shows the Notion figure as a muted line.~~ dropped: the user asked to remove the muted "Notion" line under a saved budget in the table.
- [x] AC9: The zero filters and the budget, spending and remaining totals use the resolved budgets; income cards and the Need/Wants/Savings split are unchanged.
- [x] AC10: The chosen source persists across restarts.
- [x] AC11: A Playwright check switches the source and sees the Monitoring figures change; any existing e2e that asserts Monitoring text is updated.
- [ ] AC12: In Saved mode the budget action buttons sit on the right of the Budget panel and are hidden until the user turns them on with an icon button in the panel header, like the Filters button on Expense; the choice is remembered across restarts.
- [ ] AC13: Edit budgets can show the month's budgets as JSON as well as the form, with a toggle between the two and a Copy button; pasting a month's JSON into another month's JSON view and saving copies the whole budget across, and invalid JSON blocks Save with error text.

## Inputs
- `tickets/monthly-budget/spec.md`
- `wiki/desktop/monthly-budget-snapshots.md` (sections 6, 7, 11, 13)
- `tickets/monthly-budget/02-saved-budgets-data-layer.md`
- Playwright runs separately from `npm test`; run it before in-review (see the e2e note in project memory).

## Evidence
- Commits: pending (uncommitted)
- PR:
- Tests: `src/renderer/src/components/pages/monitoring-budgets.test.tsx` (21 tests), `test/saved-budgets.test.ts`, `e2e/saved-budgets.spec.ts` (Playwright, `npx playwright test`: 49 passed including the existing Monitoring-adjacent specs). `npm run typecheck` clean, `eslint` 0 errors.
- Review: `code-review` against `HEAD` (uncommitted). Fixed: (1) the Edit budgets modal reloaded its saved set whenever Monitoring re-rendered, which would have wiped what the user was typing; it now reloads only when the category list changes. (2) the Import modal would open two file dialogs under React StrictMode in development; it now opens one. (3) a budget cell with a muted Notion line sorted as text; it now carries a numeric value and sorts as a number. Each has a regression test. Noted, not changed: export does not escape cells that start with `=`, `+`, `-` or `@` (spreadsheet formula injection), low risk because category names come from the user's own Notion; row and name lengths in `budgets:saveSet` are not capped; the resolution function's complexity warning (19 against a limit of 15).
- Docs updated: `wiki/desktop/monthly-budget-snapshots.md` (corrected the 81,000 example); the schema, IPC and product docs are for ticket monthly-budget/05

## Progress log
### 2026-11-18 claude
- Did: Created from the spec at the user's approval of the breakdown.
- Next: Wait for 02, then claim. Test through the resolution seam and one Playwright check; avoid testing React internals.

### 2026-11-18 claude
- Did: Claimed with `/cook-a-ticket` (cook only: no tests, no review, no commit). Working on the current branch `development` because no working branch is set.

### 2026-11-18 claude
- Did: Cooked the code (no tests written, no criteria ticked, nothing committed). Monitoring now has a Notion | Saved Budget source control beside the view mode, a coverage badge in the Budget panel header, and in Saved mode buttons for Save budgets for this month, Edit budgets, Import CSV and Export. The Edit budgets modal has a month picker limited to the range, per-category inputs with the Notion budget as a muted reference, Fill from Notion, Delete, Save and Cancel, with error text and the shaking field on bad input. Budget, spending and remaining figures, totals, cards and the zero filters use the resolved budgets in all four view modes. In Notion mode the budget is still the monthly budget times the months, so figures should not move.
- Decisions: Replace and delete confirmations use `window.confirm`, as the chat page does. In Saved mode with no saved set for the month, Edit budgets starts from today's Notion budgets and saves nothing until Save. The breakdown view's "% used" uses the period budget in Saved mode; Notion mode keeps the old figure unchanged.
- Not done: AC11 (the Playwright check) is not written or run. The UI was not opened in a browser or the app yet beyond the build in the next step.
- Next: Write the Playwright check and the resolution tests, run the app and look at the screen, then review and serve.
- Docs to check: `wiki/desktop/ui-ux-redesign.md` if the toolbar layout is described there, and `wiki/shared/product-specification.md` (ticket 05).

### 2026-11-18 claude
- Did: Ran `test` and `review`. Added `monitoring-budgets.test.tsx` (Monitoring page in all four view modes, badges, zero filter, totals, Edit and Save modals, delete confirm, review regressions) and `e2e/saved-budgets.spec.ts` (AC11, passes against the built app with a real SQLite file). All eleven criteria are ticked.
- Review fixes: see the Evidence line. No requirement changed.
- Next: `taste` and `serve` when the user is ready. Not committed.

### 2026-11-18 claude
- Requirement change: the user tried the build and asked for the Save, Edit, Import and Export buttons to sit on the right and to be hidden or shown with an icon button like the Filters button on Expense ("make these buttons in the right, and make them hideable toggleable by a (i) button"). Added AC12; AC1 to AC11 are unchanged. The buttons start hidden, as the Expense filter row does, and the choice is stored with the other Monitoring filters.
- Did: Moved the buttons to a right-aligned row toggled by an info (i) icon button in the Budget panel header; updated the existing Monitoring tests and the Playwright check to open the buttons first. AC12 is not ticked: no test names it yet.
- Checked: `typecheck` clean, `eslint` 0 errors on the changed files, the existing unit tests (512 passed, 37 skipped under plain Node) and all 49 Playwright specs pass after the change. Not run: no test names AC12 yet, so it stays unticked; the gate will not pass until one does. Next: `/cook-a-ticket [test]` to add it. Not committed.

### 2026-11-18 claude
- Requirement change: the user asked that Edit budgets can also be viewed as JSON, with a toggle, so a whole month's budget can be copied to another month ("toggle to view in json, which I can copy easily whole budget of a certain month to another month"). Added AC13; AC1 to AC12 are unchanged.
- Decisions: the JSON is a plain object of category name to budget (`{ "Food": 5000 }`), with no month inside, so it can be pasted into any month. Names match case-insensitively; a name that matches no category is an error; a category left out of the JSON keeps its current value; budgets follow the same rule as the form (0 or more, up to 2 decimals).

### 2026-11-18 claude
- Requirement change: the user asked to remove the "Notion ₱…" line shown under a budget figure in Saved mode ("remove the 'Notion: ...' when we are using the saved budget"). AC8 is dropped, not renumbered. The Notion reference beside each field in Edit budgets (AC5) is a different place and stays.
- Did: Removed the muted line and its component from the Monitoring table; updated the tests that asserted it.
- Did: Edit budgets now has a Form | JSON toggle. The JSON view shows `{ "Food": 5000, ... }` for the chosen month with a Copy JSON button; switching the month keeps you in the JSON view and loads that month's values, so pasting over them and pressing Save copies a whole month across. Invalid JSON, an unknown category name or a bad number blocks Save and the switch back to the form, with error text. The JSON helpers are in the shared module.
- Did: Removed the muted "Notion ₱…" line under a saved budget in the Monitoring table (AC8 dropped). The Notion reference next to each field in Edit budgets stays.
- Found and fixed along the way: the Form | JSON toggle, the Export choices and the Import policy buttons were wrapped in a label element, which made the first button's accessible name the whole group ("View Form JSON"). They now use a plain labelled group.
- Checked: `typecheck` clean, `eslint` 0 errors, all 549 unit tests pass (Electron's Node), and all 49 Playwright specs pass after updating the one that asserted the removed line. A throwaway UI check of the JSON copy flow and the error cases passed and was deleted; no test names AC13 yet, so it stays unticked. Next: `/cook-a-ticket [test]` to add it. Not committed.

### 2026-11-18 claude
- Requirement change: the user found the Budget panel title wrapping onto two lines and the long badge "No saved budgets, using Notion budgets" ugly in the header ("Just say 'No budget saved.' automatically i know it is using Notion"). AC3 reworded: the none-saved badge is "No budget saved", and the partial badge drops "(rest use Notion)" for the same reason (my reading; say if you want it back). The panel title stays on one line and the header controls share one row.
- Did: Changed the badge text, kept the panel title on one line, tidied the header layout, updated the tests and the Playwright check that asserted the old text.
