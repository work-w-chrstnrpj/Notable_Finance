# 05: Monitoring uses fixed calendar quarters and halves

**Type:** dev
**Status:** in-progress
**Blocked by:** calendar-periods/01
**Owner:** unassigned

## What to build
Monitoring's Quarterly and Semi-Annually views cover the fixed calendar quarter or half containing the selected month (Q4 = Oct to Dec, H2 = Jul to Dec), replacing the floating windows that start at the picked month (the 4-month Quarterly bug goes away). Monitoring keeps its four options, shows the selector label "Q4 2026 · Oct – Dec", and keeps titles "Quarterly Monitoring" and "Semi-Annual Monitoring". Income, expense, savings and budget figures cover exactly that period. With Custom budgets, a `Q4 2026` or `H2 2026` row matches the period on screen; the existing most-specific-row rule is unchanged.

## Acceptance criteria
- [x] AC1: A failing test first: with November 2026 selected, Quarterly covers Oct 1 to Dec 31 and Semi-Annually Jul 1 to Dec 31.
- [x] AC2: Selecting any month in a quarter or half gives the same period and the same figures.
- [x] AC3: Income, expense, savings and budget figures all cover exactly the period range, and Quarterly no longer spans 4 months.
- [x] AC4: The selector shows "Q4 2026 · Oct – Dec" / "H2 2026 · Jul – Dec" and the arrows step one whole period.
- [x] AC5: With Custom budgets a row for the shown quarter or half is used for its months, the most specific row still wins per month, and months with no row use the Default budget.
- [x] AC6: Monthly and Annually behave as before, and the chosen mode is remembered.

## Inputs
- tickets/calendar-periods/spec.md
- docs/adr/0012-fixed-calendar-quarters-and-halves.md
- docs/adr/0010-custom-monthly-budget-database-is-source-of-truth.md
- tickets/calendar-periods/01-shared-period-module.md

## Evidence
- Commits:
- PR:
- Tests: `npx vitest run` 75 files passed, 729 tests passed, 36 skipped (SQLite-only); `calendar-periods/05#AC1` to `AC6` in `monitoring-budgets.test.tsx` and `calendar-periods/05#AC2` in `test/saved-budgets.test.ts`; `npm run typecheck` clean; eslint 0 errors on touched files.
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the grill session.
- Next: Pick up when unblocked.

### 2026-11-24 claude
- Did: Claimed. Reading Monitoring's range, label and budget code.
- Next: replace floating windows with the shared calendar periods; check Custom budget summing over multi-month ranges; tests.
- Did: Monitoring's range now comes from the shared calendar module (computeRange with the monitoring unit of the selected month) and its label from rangeLabel ("Q4 2026 · Oct – Dec"); the floating 4-month and 6-month windows are gone. `monthsInRange` in `src/shared/saved-budgets.ts` now returns the fixed calendar quarter, half or year (3, 6, 12 months), so Default and Custom budget figures cover exactly the period. Custom rows still resolve per month (a quarter, half or year row is split into months when cached, per ADR-0010); a month with no row uses the Default budget. Updated the old tests that assumed 4-month Quarterly (monitoring-budgets, saved-budgets). All six ACs ticked.
- Not checked: a visual look at the running app.
