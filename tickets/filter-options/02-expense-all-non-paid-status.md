# 02: Expense "All non-paid statuses" payment status option

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** unassigned

## What to build
A new option **All non-paid statuses** in the Expense payment status filter. It shows expenses that are Unpaid or Installment, and not Cancelled or Paid. It appears only in the views that already show this filter.

## Acceptance criteria
- [x] AC1: The payment status filter lists **All non-paid statuses**, first under the "All payment statuses" placeholder.
- [x] AC2: Picking it shows expenses with status Unpaid or Installment only; Paid and Cancelled are hidden.
- [x] AC3: The option is absent in To pay and Installments, where the filter is already hidden.
- [x] AC4: The option stays wherever the payment status filter already shows, including Unpaid Pasabuy; Unpaid CC redirects to CC Transaction. ~~hidden in Unpaid Pasabuy and Unpaid CC~~ dropped: the filter itself is not hidden there today.
- [x] AC5: Clear-filters resets it, and a saved option survives a restart.
- [x] AC6: Existing single-status options behave as before, and Playwright e2e is checked for changed labels.

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
- Did: Cooked. Added 'All non-paid statuses' as the first option of the payment status filter; the main-process expense query expands it to Unpaid + Installment. AC4 finding: Unpaid CC and Unpaid Pasabuy are not separate views in the UI (both redirect to CC Transaction / Monthly on load), so nothing extra to hide. Typecheck passes. No tests written and not looked at in a real window, so no criteria ticked. Playwright e2e (app.spec) only checks that the two status selects with the 'All ...' placeholders are visible; the placeholders are unchanged, so the spec is unaffected (checked by grep, e2e not run).
- Next: /cook-a-ticket [test] to prove the criteria, then [serve] to commit and close.

### 2026-11-24 claude
- Did: Tested. AC4 amended after checking: the payment status filter does show in Unpaid Pasabuy (an existing test requires it), so the option stays there; Unpaid CC is redirected to CC Transaction on load. Saved-restart is covered by the settings test (the sentinel id is stored as a normal string). AC6: single-status matching is tested; e2e checked by grep only, not run.
- Next: /cook-a-ticket [serve] to commit and close.
