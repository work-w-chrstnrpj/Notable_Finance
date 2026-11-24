# 10: Accounts filter row sits above the tabs

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
On the Accounts page the filter row (card type, Hide zero balance and the Table | Cards | Wallet switch) moves above the All Accounts / Accounts / Credit Accounts tabs, the same order as Income and Expense, where the filters come first and the period picker below. The header filter icon, its shortcut and the remembered choices keep working.

## Acceptance criteria
- [x] AC1: On Accounts the filter row comes before the scope tabs, matching the order on Income.
- [x] AC2: The header filter icon still shows and hides the card-type dropdown and Hide zero balance, and its shortcut, the view switch, the remembered view and the filtering all still work.
- [x] AC3: With the filters hidden, the view switch stays visible above the tabs and the layout does not jump or break.
- [x] AC4: Light and dark themes both look right; a screenshot beside Income's header area is in the evidence.

## Inputs
- tickets/account-cards/09-accounts-filter-toggle.md
- Owner request 2026-11-24 with screenshot of Income (filters above the Daily/Weekly picker): Accounts should be consistent with the other pages.

## Evidence
- Commits:
- PR:
- Tests: `account-cards/10#AC1..AC3` in accounts-filter-order.test.tsx (3 tests); the ticket-09 filter tests and all Accounts page tests still pass (4 files, 57 tests). Full run at the end: 651 passed, 2 failed in other tickets' files (see log); typecheck clean; eslint 0 errors on touched files.
- Review: not run.
- Screenshots: tickets/account-cards/evidence/10-{accounts,income}-{light,dark}.jpg (same real app shell and CSS via a throwaway harness with a mocked data bridge, 1440 wide; Income with its filters opened).
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the owner's request ("Yes, both").
- Next: Implement and test.
- Did: Moved the filter row (card type, Hide zero balance, Table|Cards|Wallet switch) above the scope tabs in the Accounts page, so the order matches Income (filters first, picker below). Ticket 09 behavior (header icon, shortcut, hidden-row state with the view switch alone) is unchanged and its tests pass. Added 3 tests (DOM order, behavior still works, hidden-row state). Compared with Income in light and dark in a throwaway harness (deleted; .claude/launch.json restored).
- Note: the final full run had 2 failures outside this ticket: account-cards/01#AC4 (payment-network DB upgrade test) and account-cards/03#AC1 (card front shows the masked number), both in areas ticket 11 is changing concurrently.

### 2026-11-24 Requirement change (correction)
- Owner, comparing Income and Expense screenshots: the standard order on Expense and the workflow pages is the period/scope picker first, then the filter row. Income was the odd one out; ticket 10 had wrongly copied Income's order.
- Changed: AC1 and AC3 now mean the scope tabs come BEFORE the filter row (the original Accounts order). The code and tests were reverted to that order, and Income was moved to match Expense. The 10-*.jpg screenshots show the superseded order.
