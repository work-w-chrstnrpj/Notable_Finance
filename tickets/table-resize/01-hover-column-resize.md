# 01: Hover-only column resizing across Money movement

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
In every Money movement table the user can drag a column edge to change its width. The resize handle is invisible until the pointer hovers over a column edge, then it shows an accent line and a resize cursor. The same handle replaces Expense's always-visible line, so every page behaves alike. Widths reset on reload, as they do in Expense today.

## Acceptance criteria
- [x] AC1: The Income, Expense, Transfer, CC Payment, Alkansya, Borrowings records and Receivables tables each have resizable columns.
- [x] AC2: No resize line shows at rest; it appears on hover, and on keyboard focus, at the column edge.
- [x] AC3: The pointer shows a resize cursor on the handle, and dragging changes the column width, never below 96px.
- [x] AC4: The arrow keys resize a focused handle by 16px.
- [x] AC5: Pinned first columns on wide tables, sorting, row selection and the Expense table's existing behaviour still work.
- [x] AC6: The Borrow Account table in Borrowings is unchanged.
- [x] AC7: The handle stays invisible on touch-only devices.

## Inputs
- Decisions from the grilling session of 2026-11-18 (recorded in the progress log below)
- `GLOSSARY.md` (Money movement)
- Existing Expense resize behaviour in the shared data table

## Evidence
- Commits:
- PR:
- Tests: `ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron node_modules/vitest/vitest.mjs run` → 563/563 pass (tests named `table-resize/01#AC1`..`AC7` in `pages/table-resize.test.tsx`); `npx playwright test` → 49/49 pass; eslint 0 errors; typecheck clean. AC2, AC3 cursor and AC7 are checked by reading the stylesheet rules, since jsdom does not apply CSS; the hover look was not checked in a real window.
- Review:
- Docs updated:

## Progress log
### 2026-11-18 claude
- Did: Recorded the decisions the user approved with "yes to all" in `grill-with-docs`: scope is every table in the Money movement group except the small Borrow Account table; one hover-only handle everywhere, including Expense; the handle is an invisible hit area that shows an accent line and resize cursor on hover or focus; widths are not remembered; pinned first columns and the 96px minimum stay.
- Decisions: Remembering widths per view across restarts is a separate ticket (needs a setting and a reset option). No ADR: easy to reverse.
- Next: Claim and implement with `/implement table-resize/01`. The change is mostly in the shared data table and its styles, plus turning the resize flag on for each page.

### 2026-11-19 claude
- Did: Claimed. The shared data table already had the resize handle for Expense, so the work was small. `ui/data-table.module.css`: the handle line is now transparent at rest and turns accent on hover, keyboard focus or drag, with the resize cursor; the handle is hidden under `@media (hover: none)`. Turned `resizable` on in `pages/income/index.tsx` and for the records table in `pages/workflow/index.tsx` (Transfer, CC Payment, Alkansya, Borrowings, Receivables). The Borrow Account table is untouched. Added `pages/table-resize.test.tsx`.
- Side effect: resizable header cells carry an `aria-label`, so `optimistic-save.test.tsx` found two "Name" and "Date" labels once Income became resizable; I scoped its queries to the dialog.
- Next: look at it in the app (hover a column edge on Income and Transfer), then `[serve]`. Not reinstalled on this Mac yet.
