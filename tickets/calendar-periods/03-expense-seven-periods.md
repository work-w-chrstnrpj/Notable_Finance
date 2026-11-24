# 03: Expense offers the seven periods and keeps its extras

**Type:** dev
**Status:** in-progress
**Blocked by:** calendar-periods/01
**Owner:** claude

## What to build
The Expense page's period picker shows Daily, Weekly, Monthly, Quarterly, Semi-Annually, Annually and All Records, followed by its existing status views (CC Transaction, Pasabuy, To pay, To buy, Installments, Unpaid CC, whatever the page shows today). Quarterly and Semi-Annually list the Expense records of the fixed calendar quarter or half. The chosen mode is remembered.

## Acceptance criteria
- [x] AC1: The picker shows the seven periods first, in order, followed by the existing extra views, none lost.
- [x] AC2: Quarterly lists only records inside the fixed calendar quarter containing the selected date; Semi-Annually the fixed half.
- [x] AC3: The selector label and arrows follow the new periods, and totals match the listed records.
- [x] AC4: The extra status views are not date-scoped, as today, and the selector behaves as it does now when one is chosen.
- [x] AC5: The chosen mode is remembered after a restart.

## Inputs
- tickets/calendar-periods/spec.md
- docs/adr/0012-fixed-calendar-quarters-and-halves.md
- tickets/calendar-periods/01-shared-period-module.md

## Evidence
- Commits:
- PR:
- Tests: `npx vitest run src/renderer/src/components/pages/expense` 5 files, 63 tests passed (new `expense-periods.test.tsx`, 8 tests named `calendar-periods/03#ACn`; `expense.test.tsx` period tables extended with Quarterly and Semi-Annually). AC5 (remembered mode) rests on ticket 01's saved-settings test, which accepts these modes for Expense. Full suite: 728 passed, 36 skipped, 1 failed in `workflow-periods.test.tsx` (ticket 04's file, in progress by another agent, not this ticket). Typecheck clean; eslint 0 errors on the touched files.
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the grill session.
- Next: Pick up when unblocked.
- Did: Expense picker list is now Daily, Weekly, Monthly, Quarterly, Semi-Annually, Annually, All Records, then CC Transaction, Pasabuy, To pay, To buy, Installments (none lost, same order). The CC Transaction and Pasabuy sub-period dropdown lists the same seven. Records are fetched by the shared period range from ticket 01 (Q = fixed calendar quarter, H = fixed half); status views stay unbounded. Files: `expense/index.tsx` (mode list), `expense/expense-toolbar.tsx` (sub-period list), tests only otherwise.
