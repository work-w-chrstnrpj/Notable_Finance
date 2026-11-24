# 03: Expense "All non-payment fully received" Pasabuy status option

**Type:** dev
**Status:** in-progress
**Blocked by:** 02
**Owner:** unassigned

## What to build
A new option **All non-payment fully received** in the Expense Pasabuy payment status filter. It shows Pasabuy expenses whose payment is not yet received, partially received, or partially received (installment). It appears only where this filter already shows: the Pasabuy view, or when a Pasabuy category is selected.

## Acceptance criteria
- [x] AC1: The Pasabuy payment status filter lists **All non-payment fully received**, first under the "All Pasabuy payment statuses" placeholder.
- [x] AC2: Picking it shows only Pasabuy expenses with "Payment not yet receive", "Payment partially received" or "Payment partially received (installment)"; "Payment fully received" is hidden.
- [x] AC3: The option shows only where the Pasabuy status filter already shows, and not in Unpaid Pasabuy.
- [x] AC4: Clear-filters resets it, and a saved option survives a restart.
- [x] AC5: Existing single-status options behave as before, and Playwright e2e is checked for changed labels.

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
- Did: Created from the grill-with-docs session of 2026-11-24 and approved by the user in /to-tickets. Blocked by 02 because both touch the same Expense status filter and list query.
- Next: Claim and implement with /implement after 02.

### 2026-11-24 claude
- Did: Cooked together with 02 because they share the same query code. Added 'All non-payment fully received' as the first option of the Pasabuy status filter; the main-process query matches any Pasabuy status except 'Payment fully received' (records with no status are excluded). It shows under the existing gate only. Typecheck passes. No tests written and not looked at in a real window, so no criteria ticked.
- Next: /cook-a-ticket [test] to prove the criteria, then [serve] to commit and close.

### 2026-11-24 claude
- Did: Tested. One test per criterion. The option shows in the Pasabuy view and is absent in Monthly and in Unpaid Pasabuy without a Pasabuy category. e2e checked by grep only, not run.
- Next: /cook-a-ticket [serve] to commit and close.
