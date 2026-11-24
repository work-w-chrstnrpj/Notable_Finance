# 02: Content-fit columns that fill the card

**Type:** dev
**Status:** in-progress
**Blocked by:** 01
**Owner:** claude

## What to build
Money-movement tables size each column to its content, share any spare width so the table fills its card, and only truncate text that exceeds a maximum width, with a tooltip. A column the user has dragged keeps the dragged width. CC Payment no longer shows a narrow table with its Name cells cut short while the card has room.

## Acceptance criteria
- [ ] AC1: On first view, each column starts at its content width, within a minimum and maximum.
- [ ] AC2: When the columns do not fill the card, the spare width is spread across them so the table fills it.
- [ ] AC3: Text is truncated with an ellipsis only past the maximum width, and the full text shows in a tooltip.
- [ ] AC4: A dragged width wins over the automatic width and still never goes below 96px.
- [ ] AC5: CC Payment, Income, Expense, Transfer, Alkansya, Borrowings and Receivables tables all behave this way.
- [ ] AC6: Pinned first columns, sorting, row selection and the existing table-resize tests still pass.
- [ ] AC7: The Borrow Account table is unchanged.

## Inputs
- Grill session 2026-11-23, item 2
- tickets/table-resize/01-hover-column-resize.md

## Evidence
- Commits:
- PR:
- Tests:
- Review:
- Docs updated:

## Progress log
### 2026-11-23 claude
- Did: Created from the grill-with-docs session of 2026-11-23 and approved by the user in /to-tickets.
- Next: Claim and implement with /implement.

### 2026-11-24 claude
- Did: Cooked. The data table now starts each resizable column at a width taken from its header and up to 200 rows (96 to 360 px), then shares spare card width across columns the user has not dragged. Dragged widths win and keep the 96 px minimum. Not looked at in a real window yet, and no test written (cook only).
- Next: /cook-a-ticket [serve] to commit and close once you have tried it.
