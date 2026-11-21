# 03: Borrow form and table with loan terms

**Type:** dev
**Status:** done
**Blocked by:** 02
**Owner:** unassigned

## What to build
On Borrowings the user can enter Interest, Payment Frequency and Period count when creating or editing a Borrow. The Borrowings table shows a Remaining balance column, and a loan's record modal shows total owed, Suggested payment, Paid amount, Payments made and Remaining balance.

## Acceptance criteria
- [x] AC1: The Borrow form shows Interest, Payment Frequency and Period count; they are optional as a group, and Period count without Frequency (or the reverse) is rejected with clear error text.
- [x] AC2: Saving a 150,000 borrow with 5,000 interest, Monthly, 12 periods shows total owed 155,000 and Suggested payment 12,916.67 in the record modal.
- [x] AC3: The Borrowings table shows Remaining balance for loans with terms and a dash for loans without.
- [x] AC4: Interest never appears in Expense totals, budgets or Monitoring.
- [x] AC5: Editing a loan's terms updates every figure and syncs the new fields.

## Inputs
- `tickets/borrowing-terms/spec.md`
- `docs/adr/0004-derived-values-computed-not-stored.md`
- `docs/adr/0007-loan-interest-inside-the-borrowing.md`
- `GLOSSARY.md` (Loan terms, Suggested payment, Remaining balance)

## Evidence
- Commits: c6f53aa
- PR: not merged (local commit c6f53aa on branch claude/borrowing-terms-02-662ac8)
- Tests: `workflow-borrowing-terms.test.tsx` (shared fixtures in `borrowing-terms-fixtures.tsx`), one test per criterion named `borrowing-terms/03#ACn`. From `notable-finance-app/`: `npx vitest run src/renderer/src/components/pages/workflow-borrowing` → 2 files, 13 tests passed (this file: 5 tests). Full suite: `npx vitest run` → 53 files passed, 1 skipped; 481 tests passed, 7 skipped (SQLite-backed). Under Electron's Node (`ELECTRON_RUN_AS_NODE=1 ./node_modules/electron/dist/Electron.app/Contents/MacOS/Electron node_modules/vitest/vitest.mjs run`) → 54 files, 488 tests, all passed. `npm run typecheck` clean (after replacing `.at()` in the new tests; the two new files were re-run alone afterwards: 13 passed). Playwright not re-run (UI behaviour unchanged).
- Review: `code-review` against HEAD (uncommitted) of tickets 02-06 together. Fixed: (1) push fallback left loan terms marked synced, so a later pull could wipe them (02); (2) main-process validation for Period count, the Period count/Frequency pair and the loan link (02); (3) editing a repayment silently unlinked it when its loan was not in the picker (03/04); (4) Record repayment prefilled more than the remaining balance (04). Noted, not changed: a link made in Notion to a loan on a different Borrow account is counted twice in the panel; the missing-property fallback match was tightened rather than removed.
- Docs updated: wiki/desktop/borrowings.md, wiki/shared/notion-field-mapping.md, wiki/desktop/local-data-schema.md, notable-finance-app/CHANGELOG.md (written under ticket 06)

## Progress log
### 2026-11-21 claude
- Did: Created from the spec at the user's approval of the breakdown.
- Next: Claim after 02 and implement at the Borrowings screen seam.

### 2026-11-21 claude (cook-only)
- Did: Borrow form (Borrowed type only) gains an optional "Loan terms" group: Interest, Payment Frequency, Period count. Saved loan with terms shows computed Total owed, Suggested payment, Paid amount, Payments made, Remaining balance in its record modal (via `computeLoanSummary`, never stored). Borrowings table gains a Remaining balance column (amount for loans with terms, dash otherwise and for repayments). Bulk duplicate copies the terms. Renderer `IncomeRecord` gained interest/paymentFrequency/periodCount/linkedBorrowingId. Typecheck (web and node) clean. No tests run, nothing committed, criteria not ticked.
- Files: `src/renderer/src/components/pages/workflow/{index.tsx,use-workflow-form.ts,workflow-form-fields.tsx}`, `src/renderer/src/types/finance.ts`.
- Decisions: Renderer rejects Period count without Frequency (and the reverse), non-whole or <1 Period count, and negative Interest, with inline error text and shake. Interest alone is allowed (total owed without a suggested payment). Switching a record's type to Repayment on edit sends nulls and clears its terms. Interest is only stored on the income row, so Expense totals, budgets and Monitoring are untouched (AC4 needs no code; confirm in review).
- Finding for 02 (not changed): main `validateLoanTerms` in `src/main/domain/validation.ts` does not enforce the group rule, whole-number Period count or a valid frequency, so chat (05) and other callers can still save Period count without Frequency. Consider moving the group rule there.
- Next for 04: the form does not set `linkedBorrowingId`; `openBorrowNew("repayment", source)` in workflow `index.tsx` already receives the loan row (prefill amount with `computeLoanSummary(...).suggestedPayment`, set the link). `loanSummaryById` in the page is available for the panel. Borrow Accounts panel still uses balance-only figures.

### 2026-11-21 claude (test)
- Did: Wrote `workflow-borrowing-terms.test.tsx` at the Borrowings screen seam (WorkflowPage over a mutable mocked incomes store). All 5 tests passed on the first full run, so no code bug was found in 03/04. Ticked AC1-AC5. AC4 of 03 is checked at the renderer (Borrowings Net excludes interest) plus `monthlyMonitoring` ignoring the Borrowed Money category; Expense totals have no interest path from Income rows, so there is no further renderer assertion. Nothing committed.

### 2026-11-21 claude
- Did: Served: c6f53aa. Modifiers run: test, review, serve (review ran once over tickets 02-06 together; the user accepted closing). Playwright `e2e/borrowing-terms.spec.ts` re-run after the review fixes: 1 passed; unit suite under Electron's Node: 54 files, 503 tests passed; typecheck clean. Commit made on branch claude/borrowing-terms-02-662ac8, not merged.
- Docs to check: GLOSSARY.md (Loan terms, Suggested payment, Remaining balance exist only in the main checkout), docs/adr/0007 (same).
