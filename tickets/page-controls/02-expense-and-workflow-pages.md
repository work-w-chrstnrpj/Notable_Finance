# 02: Hide toggles on Expense, Transfer, CC Payment, Alkansya, Borrowings and Receivables

**Type:** dev
**Status:** ready-for-agent
**Blocked by:** page-controls/01
**Owner:** unassigned

## What to build
The period toggle (and the views toggle where the page has a view switch) is added to Expense and the five workflow pages, in the header order Period, Views, Filters, Search, New. On Expense the period toggle hides the whole picker bar, including its extra status views (CC Transactions, Pasabuy, To Pay, To Buy, Installments); the views toggle hides the Annual Table | Chart switch while Annually is chosen. Hidden controls keep working and the state is remembered per page.

## Acceptance criteria
- [x] AC1: Each of the six pages shows the period icon in the header before its filter icon, and the period toggle hides and shows its picker bar.
- [x] AC2: On Expense, hiding the period bar hides the extra status views with it, and the active view or period stays in effect.
- [x] AC3: Where a page has the Annual Table | Chart switch, the views icon appears only while Annually is chosen and hides that switch; pages with no view switch show no views icon.
- [x] AC4: The icon order is Period, Views, Filters, Search, New on every one of these pages.
- [x] AC5: Each page remembers its hidden state after a restart and starts with everything shown.
- [x] AC6: Light and dark themes both look right.

## Inputs
- tickets/page-controls/spec.md
- tickets/page-controls/01-shared-toggles-and-income.md

## Evidence
- Commits:
- PR:
- Tests: `npx vitest run src/renderer/src/components/pages/page-controls-expense-workflow.test.tsx` 26 tests named `page-controls/02#ACn` pass; full suite 79 files passed / 778 tests passed, 36 skipped (run while ticket 03 was in progress); eslint 0 errors on touched files; the only typecheck errors seen were in ticket 03's own test file.
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the owner approved the design ("Yes to all, build").
- Next: Pick up when unblocked.
- Did: Period icon added first in the header (before Filters) on Expense and the five workflow pages (ids: expense, transfer, credit-card-payment, alkansya, borrowings, receivables), wrapping each page's period bar in !periodHidden; on Expense the bar includes the extra status views, so they hide with it. Expense also gets the Views icon, only while Annually shows its Table|Chart switch (it hides the whole annual controls block, including the chart's group-by, as on Income). The workflow pages have no view switch, so no Views icon. Hidden controls keep applying (a test checks the Quarterly range is still requested). Files: expense/expense-toolbar.tsx, expense/index.tsx, workflow/index.tsx, new page-controls-expense-workflow.test.tsx.
- Not verified: AC6 light/dark look was not looked at (no harness run), so AC6 stays unticked. On Borrowings, hiding the period bar while Borrowed Accounts is shown leaves that panel visible with no way back except showing the bar again.
- Visual check 2026-11-24: Expense and Transfer in light and dark, shown and hidden (evidence/v-expense-*.jpg, v-transfer-*.jpg); no toolbar overflow at 700px on Expense. Hidden leaves only the title and the table. CC Payment, Alkansya, Borrowings and Receivables were not viewed one by one: they use the same workflow page code as Transfer. Transfer's filter icon is off by default (not highlighted), as before. AC6 ticked.
