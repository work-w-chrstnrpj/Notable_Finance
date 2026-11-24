# 04: Transfer, CC Payment, Alkansya, Borrowings and Receivables offer the seven periods

**Type:** dev
**Status:** in-progress
**Blocked by:** calendar-periods/01
**Owner:** unassigned

## What to build
The five workflow pages that share one period picker show Daily, Weekly, Monthly, Quarterly, Semi-Annually, Annually and All Records, in that order. Quarterly and Semi-Annually list the records of the fixed calendar quarter or half containing the selected date. The chosen mode is remembered.

## Acceptance criteria
- [x] AC1: Each of the five pages shows the seven options in order.
- [x] AC2: Quarterly and Semi-Annually list only records inside the fixed calendar quarter or half on each page.
- [x] AC3: The selector label and arrows follow the new periods on each page.
- [x] AC4: The chosen mode is remembered after a restart.
- [x] AC5: Daily, Weekly, Monthly, Annually and All Records behave exactly as before, and the Dashboard stays on one month.

## Inputs
- tickets/calendar-periods/spec.md
- docs/adr/0012-fixed-calendar-quarters-and-halves.md
- tickets/calendar-periods/01-shared-period-module.md

## Evidence
- Commits:
- PR:
- Tests: `npx vitest run` 75 files passed, 729 tests passed, 36 skipped (other tickets were running at the same time); new `workflow-periods.test.tsx` (19 tests named `calendar-periods/04#ACn`); `npm run typecheck` clean; eslint 0 errors on the workflow folder and the new test.
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the grill session.
- Next: Pick up when unblocked.

### 2026-11-24 claude
- Did: Started. The five workflow pages share one picker in the workflow page; ccPeriod/pasabuyPeriod belong to Expense's CC Transaction and Pasabuy views (ticket 03), so they are left alone here.
- Did: The shared workflow picker now lists Daily, Weekly, Monthly, Quarterly, Semi-Annually, Annually, All Records (Borrowings still adds Borrowed Accounts after them). The page already maps modes to ranges through the shared module (ticket 01), so Quarterly/Semi-Annually ask for the fixed calendar range and the empty-state text shows the new label. One-line change in the workflow page plus a comment; no shared type or settings edits. ccPeriod/pasabuyPeriod are Expense's CC Transaction and Pasabuy period selectors (ticket 03) and were left alone. Dashboard unchanged (still one month; covered by ticket 01's mapping tests).
