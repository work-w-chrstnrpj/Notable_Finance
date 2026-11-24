# 09: Show or hide the filters on Accounts

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
The Accounts page gets the same filter icon the Income and Expense pages have, in the page header. Clicking it shows or hides the filter row (card type and Hide zero balance). The Table | Cards | Wallet switch and the All Accounts, Accounts and Credit Accounts tabs stay visible either way. A filter that is set keeps filtering while the row is hidden. The row starts shown (as today).

## Acceptance criteria
- [x] AC1: The Accounts header has the filter icon, labelled "Filters" and "Close filters" and highlighted while the filter row is shown, like Income.
- [x] AC2: The icon shows and hides the card-type dropdown and the Hide zero balance toggle; the view switch and scope tabs are always visible.
- [x] AC3: Hiding the row does not clear its filters: a chosen card type and Hide zero balance still apply to the list in Table, Cards and Wallet.
- [x] AC4: Whether the row is shown is remembered after a restart; it is shown by default.
- [x] AC5: The existing Filters shortcut toggles it on this page, and the icon shows that shortcut hint like the other pages.
- [x] AC6: With the row hidden, the view switch keeps its look and the page layout does not jump or break.

## Inputs
- tickets/account-cards/spec.md
- Income page header filter toggle (the pattern to follow)
- Owner request, 2026-11-24: "In accounts, can we have also the toggle filter setting icon that shows/hide the filters?"

## Evidence
- Commits:
- PR:
- Tests: `npx vitest run` 68 files passed, 648 tests passed, 36 skipped (SQLite-only); new `accounts-filter-toggle.test.tsx` 8 tests named `account-cards/09#ACn`; `npm run typecheck` clean; eslint 0 errors on touched files.
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Ticket drafted from the owner's request and approved ("Yes, go ahead", filter row shown by default).
- Next: Implement and test.
- Did: Added the Filters icon (same component and shortcut as Income) to the Accounts header; the filter row (card type, Hide zero balance) shows or hides while the view switch and tabs stay; hidden filters keep applying; `filterActive` is saved with the accounts filters (default shown, tolerant of older saved settings). Adjusted the filter-row CSS so the view switch does not inherit the dropdown's width when alone.
- Not verified: a visual check of the hidden-row layout in the real app (AC6 is asserted by structure in a test, not by screenshot).
