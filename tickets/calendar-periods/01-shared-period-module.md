# 01: Shared period module with fixed quarters and halves

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** unassigned

## What to build
The shared date-range library knows two new units, quarter and half, beside day, week, month and year. For any date it gives the fixed calendar period containing it (Q1 Jan to Mar, Q2 Apr to Jun, Q3 Jul to Sep, Q4 Oct to Dec; H1 Jan to Jun, H2 Jul to Dec), steps by whole periods across year boundaries, and labels it for the date selector ("Q4 2026 · Oct – Dec", "H2 2026 · Jul – Dec"). The date selector steps and shows these units. Saved view modes accept the two new values and fall back to Monthly for unknown ones. Nothing on the pages changes yet.

## Acceptance criteria
- [x] AC1: A failing test first: November 2026 in Quarterly gives Oct 1 to Dec 31 and in Semi-Annually gives Jul 1 to Dec 31.
- [x] AC2: Every month maps to the right quarter and half (Jan to Mar = Q1 and so on), including the first and last days of each period and a leap-year February.
- [x] AC3: Stepping forward and back moves one whole quarter or half and crosses year boundaries (Q4 2026 forward is Q1 2027; H1 2026 back is H2 2025).
- [x] AC4: The selector label reads "Q4 2026 · Oct – Dec" and "H2 2026 · Jul – Dec"; existing day, week, month and year labels are unchanged.
- [x] AC5: The date selector component shows these labels and its arrows step by whole periods.
- [x] AC6: Saved Income, Expense and workflow view modes accept Quarterly and Semi-Annually, and an unknown stored value falls back to Monthly.

## Inputs
- tickets/calendar-periods/spec.md
- docs/adr/0012-fixed-calendar-quarters-and-halves.md

## Evidence
- Commits:
- PR:
- Tests: `npx vitest run` 72 files passed, 679 tests passed, 36 skipped (SQLite-only); new tests `calendar-periods/01#AC1` to `#AC6` in `src/renderer/src/lib/date-range.test.ts`, `src/renderer/src/components/ui/date-range.test.tsx`, `test/ui-settings-periods.test.ts`; `npm run typecheck` clean; eslint 0 errors on touched files.
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the grill session.
- Next: Pick up when unblocked.

### 2026-11-24 claude
- Did: Claimed the ticket; reading date-range, selector, settings and mode types.
- Next: implement quarter/half units, mode types, settings coercion, tests.
- Did: date-range.ts gained units quarter and half (fixed calendar, ADR-0012). Exports for tickets 02-05: `ViewUnit` ("quarter" | "half" added), `computeRange`, `periodContaining` (alias of computeRange), `stepAnchor` (steps to the first day of the neighbouring period), `rangeLabel` ("Q4 2026 · Oct – Dec", "H2 2026 · Jul – Dec"), `quarterOf`, `halfOf`, `periodMonthIndexes(unit, iso)` (0-indexed months of the period, [] for other units); `incomeModeToUnit`, `expenseModeToUnit`, `monitoringModeToUnit` and `activeSelectorUnit` map Quarterly -> quarter and Semi-Annually -> half. Types: `IncomeViewMode` and `ExpenseViewMode` (renderer types and `UiWorkspaceSettings` in shared) gain Quarterly and Semi-Annually; page prop types that spelled out the old literal union (Expense props/toolbar/receipt, Workflow props) now use `IncomeViewMode`. Settings: INCOME_MODES and EXPENSE_MODES accept the new values; EXPENSE_MODES also now includes All Records (it was missing, so a saved Expense All Records fell back to Monthly). Date selector: the month grid also shows for quarter and half and highlights every month of the period; the workspace's floating activeMonths (4 or 6 months from the picked month) is gone. Pickers on the pages are NOT changed (tickets 02-05).
- Notes: `shouldShowGlobalMonthSelector` in finance-rules.ts is unused by the app (tests only) and was left unchanged. Monitoring's own range code in monitoring.tsx still uses the floating windows until ticket 05.
