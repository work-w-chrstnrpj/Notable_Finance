# 02: Income offers the seven periods

**Type:** dev
**Status:** in-progress
**Blocked by:** calendar-periods/01
**Owner:** unassigned

## What to build
The Income page's period picker shows Daily, Weekly, Monthly, Quarterly, Semi-Annually, Annually and All Records, in that order. Choosing Quarterly or Semi-Annually lists the Income records of the fixed calendar quarter or half containing the date the owner is on, and the selector arrows step by whole periods. The chosen period is remembered. The annual table and chart view stays tied to Annually.

## Acceptance criteria
- [x] AC1: The Income picker shows the seven options in the order above.
- [x] AC2: Quarterly lists only the records inside the fixed calendar quarter containing the selected date; Semi-Annually the fixed half.
- [x] AC3: The selector label and arrows follow the new periods, and totals on the page match the listed records.
- [x] AC4: The chosen period is remembered after a restart.
- [x] AC5: Daily, Weekly, Monthly, Annually and All Records behave exactly as before.

## Inputs
- tickets/calendar-periods/spec.md
- docs/adr/0012-fixed-calendar-quarters-and-halves.md
- tickets/calendar-periods/01-shared-period-module.md

## Evidence
- Commits:
- PR:
- Tests: `npx vitest run src/renderer/src/components/pages/income-periods.test.tsx src/renderer/src/components/pages/income.test.tsx` 18 passed (new file has 9 tests named `calendar-periods/02#ACn`; `income.test.tsx` now also renders Quarterly and Semi-Annually); typecheck clean; eslint 0 errors on touched files. A full-suite run during this work showed failures only in the concurrent ticket 04's `workflow-periods.test.tsx`, not in Income.
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the grill session.
- Next: Pick up when unblocked.
### 2026-11-24 claude
- Did: Claimed. Ticket 01 already maps Quarterly/Semi-Annually in the shared range code, so the Income page only needed its option list extended; adding tests.
- Next: tests, typecheck, vitest, eslint.
- Did: Added Quarterly and Semi-Annually to the Income picker options (Daily, Weekly, Monthly, Quarterly, Semi-Annually, Annually, All Records). Range filtering, the selector and saved-mode restore already came from ticket 01. Added `income-periods.test.tsx`; extended the view-mode list in `income.test.tsx`. AC1 to AC5 ticked.
- Not verified by eye: the picker bar with seven options at narrow widths.
