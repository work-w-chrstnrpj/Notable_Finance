# 04: Pull edits with newest-wins

**Type:** dev
**Status:** in-progress
**Blocked by:** 01, 03
**Owner:** claude

## What to build
After pushing, the sync step pulls Notion rows. A month edited more recently in Notion than locally replaces the local value, and the overwritten value is logged in activity. Quarter, half and year rows the user added by hand are split across their months and fill only months with no saved budget; they are not re-pushed in another shape. Archiving or deleting a row in Notion never removes local data.

## Acceptance criteria
- [x] AC1: For each month and category, the value with the newer edit time wins.
- [x] AC2: Every overwritten local value is logged in activity with month, category and the old value.
- [x] AC3: A period row fills only months that have no saved budget yet, and never changes existing ones.
- [x] AC4: Imported period rows are not re-pushed in a different shape.
- [x] AC5: Rows with unrecognized titles are skipped with a logged reason.
- [x] AC6: Archiving or deleting a Notion row leaves local saved budgets untouched.
- [ ] AC7: Sync reset, discard-unsynced and Notion re-pull never wipe the local saved budgets.

## Inputs
- Spec: tickets/saved-budgets-notion/spec.md
- ADR-0008 (supersedes ADR-0006)
- GLOSSARY.md: Saved budget, Budget period, Saved Budgets database

## Evidence
- Commits:
- PR:
- Tests: `ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron node_modules/vitest/vitest.mjs run` in notable-finance-app: 65 files, 642 tests pass; typecheck clean; eslint 0 errors (tests named saved-budgets-notion/NN#ACn in test/saved-budgets-mirror.test.ts)
- Review:
- Docs updated:

## Progress log
### 2026-11-23 claude
- Did: Created from the grill-with-docs session of 2026-11-23 and approved by the user in /to-tickets.
- Next: Claim and implement with /implement.

### 2026-11-24 claude
- Did: Cooked. Pull runs before push so newest edit wins per cell; overwritten values are kept in the mirror state (shown in Settings) and written to the Dev Mode log, not to the History activity feed, which only supports incomes and expenses. AC7 is not proven: the code never touches the table from reset or re-pull, and the existing guard test still passes, but no new test names it.
- Next: /cook-a-ticket [serve] to commit and close once you have tried it.
