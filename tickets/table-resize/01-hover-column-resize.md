# 01: Hover-only column resizing across Money movement

**Type:** dev
**Status:** ready-for-agent
**Blocked by:** None
**Owner:** unassigned

## What to build
In every Money movement table the user can drag a column edge to change its width. The resize handle is invisible until the pointer hovers over a column edge, then it shows an accent line and a resize cursor. The same handle replaces Expense's always-visible line, so every page behaves alike. Widths reset on reload, as they do in Expense today.

## Acceptance criteria
- [ ] AC1: The Income, Expense, Transfer, CC Payment, Alkansya, Borrowings records and Receivables tables each have resizable columns.
- [ ] AC2: No resize line shows at rest; it appears on hover, and on keyboard focus, at the column edge.
- [ ] AC3: The pointer shows a resize cursor on the handle, and dragging changes the column width, never below 96px.
- [ ] AC4: The arrow keys resize a focused handle by 16px.
- [ ] AC5: Pinned first columns on wide tables, sorting, row selection and the Expense table's existing behaviour still work.
- [ ] AC6: The Borrow Account table in Borrowings is unchanged.
- [ ] AC7: The handle stays invisible on touch-only devices.

## Inputs
- Decisions from the grilling session of 2026-11-18 (recorded in the progress log below)
- `GLOSSARY.md` (Money movement)
- Existing Expense resize behaviour in the shared data table

## Evidence
- Commits:
- PR:
- Tests:
- Review:
- Docs updated:

## Progress log
### 2026-11-18 claude
- Did: Recorded the decisions the user approved with "yes to all" in `grill-with-docs`: scope is every table in the Money movement group except the small Borrow Account table; one hover-only handle everywhere, including Expense; the handle is an invisible hit area that shows an accent line and resize cursor on hover or focus; widths are not remembered; pinned first columns and the 96px minimum stay.
- Decisions: Remembering widths per view across restarts is a separate ticket (needs a setting and a reset option). No ADR: easy to reverse.
- Next: Claim and implement with `/implement table-resize/01`. The change is mostly in the shared data table and its styles, plus turning the resize flag on for each page.
