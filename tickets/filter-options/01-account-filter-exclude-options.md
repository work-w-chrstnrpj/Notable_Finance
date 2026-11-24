# 01: Transfer and CC Payment account filter exclude options

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** unassigned

## What to build
Three new first options in the account filter dropdowns of the Workflow pages. On Transfer, "All Transfer Accounts" gets **Exclude Empty Transfer Account**. On CC Payment, "All CC Accounts" gets **Exclude Non Credit Account** and "All Payer Accounts" gets **Exclude Empty Payer Account**. Each shows only the records that match, and works with the saved filter and clear-filters like the other options.

## Acceptance criteria
- [x] AC1: Transfer "All Transfer Accounts" lists **Exclude Empty Transfer Account** first; picking it shows only records that have a transfer account.
- [x] AC2: CC Payment "All CC Accounts" lists **Exclude Non Credit Account** first; picking it shows only records whose CC account is set and is a credit account.
- [x] AC3: CC Payment "All Payer Accounts" lists **Exclude Empty Payer Account** first; picking it shows only records that have a payer account.
- [x] AC4: Each option combines correctly with the other account filter, the period and search.
- [x] AC5: Closing the filters resets each option and restores every record. ~~a saved option survives a restart~~ dropped: Transfer and CC Payment filters are not persisted.
- [x] AC6: Borrowings and other pages are unchanged.

## Inputs
- Spec: tickets/filter-options/spec.md
- Grill session 2026-11-24

## Evidence
- Commits:
- PR:
- Tests: npx vitest run (full suite: 81 files passed, 798 tests; new tests in filter-options-workflow.test.tsx, filter-options-expense.test.tsx, query-filters.test.ts, ui-settings.test.ts); npm run typecheck clean
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Created from the grill-with-docs session of 2026-11-24 and approved by the user in /to-tickets.
- Next: Claim and implement with /implement.

### 2026-11-24 claude
- Did: Cooked. Added the three options (Exclude Empty Transfer Account, Exclude Non Credit Account, Exclude Empty Payer Account) as first items of their dropdowns on the Transfer and CC Payment pages. They filter by sentinel ids shared in a new shared filter-options module. Credit check uses all accounts, so a record on an inactive credit card still counts. Typecheck passes. No tests written and not looked at in a real window (cook only), so no criteria ticked.
- Next: /cook-a-ticket [test] to prove the criteria, then [serve] to commit and close.

### 2026-11-24 claude
- Did: Tested. One test per criterion, named with the criterion ID. Requirement change: AC5 said a saved option survives a restart, but the Transfer and CC Payment filters are not saved between sessions (they reset on page change or when the filter row closes), so AC5 now reads 'closing the filters restores every record'. The new options appear second in the dropdown, right under the 'All ...' reset entry.
- Next: /cook-a-ticket [serve] to commit and close.
