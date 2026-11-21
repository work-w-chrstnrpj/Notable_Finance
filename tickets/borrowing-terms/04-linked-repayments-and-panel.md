# 04: Linked repayments and Borrow Accounts panel

**Type:** dev
**Status:** done
**Blocked by:** 02, 03
**Owner:** unassigned

## What to build
When recording a repayment the user can pick which loan it pays (only loans with terms on that Borrow account). Opening a loan and choosing Record repayment prefills the Suggested payment and the link, and the amount stays editable so any amount can be paid. The user can link or unlink an existing repayment by editing it. The Borrow Accounts panel shows what is still owed including unpaid interest.

## Acceptance criteria
- [x] AC1: The repayment form has a loan picker listing loans with terms on the chosen Borrow account.
- [x] AC2: Record repayment from a loan prefills the Suggested payment and the loan link, and the user can change the amount before saving.
- [x] AC3: After a linked 12,916.67 repayment on the 150,000 loan, Paid amount is 12,916.67, Payments made is 1 and Remaining balance is 142,083.33.
- [x] AC4: A smaller or larger payment is accepted and reflected in Remaining balance; an overpayment leaves 0.
- [x] AC5: Editing a repayment can link or unlink it, and balances update; a deleted repayment is ignored.
- [x] AC6: The Borrow Accounts panel still-owed equals the sum of Remaining balances of loans with terms plus the old amount for borrowings without terms.

## Inputs
- `tickets/borrowing-terms/spec.md`
- `docs/adr/0004-derived-values-computed-not-stored.md`
- `docs/adr/0007-loan-interest-inside-the-borrowing.md`
- `GLOSSARY.md` (Loan terms, Suggested payment, Remaining balance)

## Evidence
- Commits: c6f53aa
- PR: not merged (local commit c6f53aa on branch claude/borrowing-terms-02-662ac8)
- Tests: `workflow-borrowing-repayments.test.tsx` (shared fixtures in `borrowing-terms-fixtures.tsx`), one test per criterion named `borrowing-terms/04#ACn` (AC4 is parametrized: smaller, larger, over payment). From `notable-finance-app/`: `npx vitest run src/renderer/src/components/pages/workflow-borrowing` → 2 files, 13 tests passed (this file: 8 tests). Full suite: `npx vitest run` → 53 files passed, 1 skipped; 481 tests passed, 7 skipped (SQLite-backed). Under Electron's Node (`ELECTRON_RUN_AS_NODE=1 ./node_modules/electron/dist/Electron.app/Contents/MacOS/Electron node_modules/vitest/vitest.mjs run`) → 54 files, 488 tests, all passed. `npm run typecheck` clean (after replacing `.at()` in the new tests; the two new files were re-run alone afterwards: 13 passed). Playwright not re-run (UI behaviour unchanged).
- Review: `code-review` against HEAD (uncommitted) of tickets 02-06 together. Fixed: (1) push fallback left loan terms marked synced, so a later pull could wipe them (02); (2) main-process validation for Period count, the Period count/Frequency pair and the loan link (02); (3) editing a repayment silently unlinked it when its loan was not in the picker (03/04); (4) Record repayment prefilled more than the remaining balance (04). Noted, not changed: a link made in Notion to a loan on a different Borrow account is counted twice in the panel; the missing-property fallback match was tightened rather than removed.
- Docs updated: wiki/desktop/borrowings.md, wiki/shared/notion-field-mapping.md, wiki/desktop/local-data-schema.md, notable-finance-app/CHANGELOG.md (written under ticket 06)

## Progress log
### 2026-11-21 claude
- Did: Created from the spec at the user's approval of the breakdown.
- Next: Claim after 02 and 03.

### 2026-11-21 claude (cook-only)
- Did: Repayment form gets a "Loan" picker (native select, "Not linked to a loan" default) listing loans with terms on the chosen Borrow account, labelled with name and remaining balance. "Record repayment" from a loan with terms prefills the Suggested payment (or the remaining balance when no Period count) and the link; the amount stays editable. Saving sends `linkedBorrowingId` (null to unlink, or when the picked loan is not on the chosen account). Editing a repayment loads its link, so it can be linked or unlinked. Borrow Accounts panel (rows and total) now uses `stillOwedForBorrowAccount`. Typecheck web and node clean. No tests, nothing committed, criteria not ticked.
- Decision: loan figures (table column, modal, picker, panel) are computed from an unscoped all-records Borrowings query (`useWorkflowRecords("borrowings", {}, { enabled })`, new `enabled` option), because the page list is date-range scoped and a repayment outside the range would otherwise be missed. Soft-deleted repayments are ignored by the shared math.
- Files: `renderer/src/components/pages/workflow/{index.tsx,use-workflow-form.ts,workflow-form-fields.tsx}`, `renderer/src/lib/use-data.ts`.
- Notes for 06: picker is a `<select>` labelled "Loan"; the form fields are labelled Interest, Payment Frequency, Period count; modal shows "Total owed", "Suggested payment", "Paid amount", "Payments made", "Remaining balance" as computed fields; the table column is "Remaining balance". The Suggested payment prefill is a plain number string (12916.67). Unlinked repayments on a loan-with-terms account stay in the old balance-based amount. Docs still to update: wiki/desktop/borrowings.md (picker, panel formula).

### 2026-11-21 claude (test)
- Did: Wrote `workflow-borrowing-repayments.test.tsx` at the Borrowings screen seam (WorkflowPage over a mutable mocked incomes store). All 8 tests passed on the first full run, so no code bug was found in 03/04. Ticked AC1-AC6. AC4 of 03 is checked at the renderer (Borrowings Net excludes interest) plus `monthlyMonitoring` ignoring the Borrowed Money category; Expense totals have no interest path from Income rows, so there is no further renderer assertion. Nothing committed.

### 2026-11-21 claude (review fixes)
- Did: Two review fixes in `workflow/index.tsx` and `workflow-form-fields.tsx` usage, test-first (the new tests failed before the fix, 4 of 7; the explicit "Not linked" test already passed and is kept as a guard).
  1. A repayment's existing link is no longer dropped on an unrelated edit. The picker keeps the current link as an extra option (labelled with the loan's name, or "Linked loan" if unknown) when the loan is not offered; the save sends `null` only when the user picks "— Not linked to a loan —". Loan options are now empty until the full all-records Borrowings list has loaded (or failed), so a range-scoped partial list is never used for choices.
  2. "Record repayment" prefills `min(Suggested payment, Remaining balance)`, the Remaining balance when there is no Period count, and leaves the amount empty (never 0 or negative) when the loan is paid off or overpaid. The link is still set.
- Tests added in `workflow-borrowing-repayments.test.tsx`: `borrowing-terms/04#AC5b` (link survives a name edit when the loan is not in the picker), `#AC5c` (explicit Not linked unlinks), `#AC2b` x4 (5,000 left, a full installment left, paid off, overpaid), `#AC2c` (no Period count prefills remaining). One of my first fixtures had wrong arithmetic (10,000 left, not 5,000); fixed the test, not the code.
- Commands (from `notable-finance-app/`): `npx vitest run src/renderer/src/components/pages/workflow-borrowing` → 20 passed. `npx vitest run` → 53 files passed, 1 skipped; 496 tests passed, 7 skipped. Electron Node run → 54 files, 503 tests, all passed. `npm run typecheck` clean (0 errors). `npx eslint src/renderer/src/components/pages/workflow` → 0 errors, 12 warnings. `npx electron-vite build && npx playwright test e2e/borrowing-terms.spec.ts` → 1 passed. A mid-run full-suite attempt showed failures in `borrowing-terms/02#...` tests while the other session was editing; they passed on the next run, and I did not touch them.

### 2026-11-21 claude
- Did: Served: c6f53aa. Modifiers run: test, review, serve (review ran once over tickets 02-06 together; the user accepted closing). Playwright `e2e/borrowing-terms.spec.ts` re-run after the review fixes: 1 passed; unit suite under Electron's Node: 54 files, 503 tests passed; typecheck clean. Commit made on branch claude/borrowing-terms-02-662ac8, not merged.
- Docs to check: GLOSSARY.md (Loan terms, Suggested payment, Remaining balance exist only in the main checkout), docs/adr/0007 (same).

### 2026-11-21 claude
- Requirement change: after trying the installed app the user found the Loan picker empty for an existing loan without terms, and asked for linking from either side like a Notion relation. Linking now works for any Borrowed row (not only loans with terms) and from the Borrowed row's modal too. Ticket 04 stays done as delivered; the change is tracked in `borrowing-terms/07`.
