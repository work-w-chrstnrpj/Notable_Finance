# 02: Loan math and loan storage

**Type:** dev
**Status:** done
**Blocked by:** None
**Owner:** unassigned

## What to build
The app can store Interest, Payment Frequency, Period count and a loan link on Income rows, sync them with Notion, and compute total owed, Suggested payment, Paid amount, Payments made and Remaining balance for a loan from its linked repayments. There is no screen yet. A loan without terms behaves exactly as today.

## Acceptance criteria
- [x] AC1: A new additive migration adds the four nullable fields to income rows, and an existing database upgrades without losing data.
- [x] AC2: The four fields round-trip through the local repository and the Notion property mapper and extractor, and join the base snapshot for three-way merge.
- [x] AC3: A Notion row with an empty or missing Interest, Frequency, Period count or link loads without error, and sync still works if a property is absent in Notion.
- [x] AC4: A loan of 150,000 with 5,000 interest over 12 periods has total owed 155,000 and Suggested payment 12,916.67.
- [x] AC5: Paid amount and Payments made count only linked repayments that are not deleted; unlinked repayments never count toward a loan.
- [x] AC6: Remaining balance is total owed minus Paid amount and never goes below 0, including after an overpayment.
- [x] AC7: A loan with no terms, or a Period count that is zero, negative or not a whole number, has no Suggested payment and its other behaviour is unchanged.
- [x] AC8: Still owed for a Borrow account adds the Remaining balance of its loans with terms to the existing balance-based amount for borrowings without terms.

## Inputs
- `tickets/borrowing-terms/spec.md`
- `docs/adr/0004-derived-values-computed-not-stored.md`
- `docs/adr/0007-loan-interest-inside-the-borrowing.md`
- `GLOSSARY.md` (Loan terms, Suggested payment, Remaining balance)
- `wiki/desktop/borrowings.md`

## Evidence
- Commits: c6f53aa
- PR: not merged (local commit c6f53aa on branch claude/borrowing-terms-02-662ac8)
- Tests: `notable-finance-app/test/loan-terms.test.ts` (13 tests, ids `borrowing-terms/02#AC1`..`AC8`). From `notable-finance-app/`: `npx vitest run test/loan-terms.test.ts` → 1 file, 13 passed. Full `npx vitest run` → 52 files passed, 1 skipped; 473 tests passed, 7 skipped (the skips are existing Electron-ABI SQLite suites, not mine; mine use `node:sqlite` and run under plain Node). `npm run typecheck` → 2 errors, both `Array.prototype.at` in another ticket's `src/renderer/src/components/pages/workflow-borrowing-terms.test.tsx`; none in ticket 02 files (node typecheck clean).
- Review: `code-review` against HEAD (uncommitted) of tickets 02-06 together. Fixed: (1) push fallback left loan terms marked synced, so a later pull could wipe them (02); (2) main-process validation for Period count, the Period count/Frequency pair and the loan link (02); (3) editing a repayment silently unlinked it when its loan was not in the picker (03/04); (4) Record repayment prefilled more than the remaining balance (04). Noted, not changed: a link made in Notion to a loan on a different Borrow account is counted twice in the panel; the missing-property fallback match was tightened rather than removed.
- Docs updated: wiki/desktop/borrowings.md, wiki/shared/notion-field-mapping.md, wiki/desktop/local-data-schema.md, notable-finance-app/CHANGELOG.md (written under ticket 06)

## Progress log
### 2026-11-21 claude
- Did: Created from the spec at the user's approval of the breakdown.
- Next: Claim and implement test-first at the loan-math seam and the storage seam.

### 2026-11-21 claude (cook)
- Did: Cooked the code change; nothing committed, no tests written (cook only), criteria not ticked.
  - Storage: migration `0016_loan_terms.sql` (+ journal) adds nullable `interest`, `payment_frequency`, `period_count`, `linked_borrowing_id` to `incomes`; schema, `IncomeRow`/`mapIncome`, `IncomeRecordDto`/create/update inputs, repository insert, patch columns and a restore path in `discard-unsynced.ts`; `validation.ts` rejects negative interest.
  - Sync: the four fields are in `INCOME_WRITABLE_COLS` (so in the base snapshot and three-way merge). Notion names `Interest`, `Payment Frequency`, `Period count`, `Linked Borrowing` in the property mapper, extractor and (optional) schema spec. Pull resolves the link to a local id and fills it after the pass when the loan page was read later than the repayment. Conflict modal shows the loan title for the link.
  - Math: `computeLoanSummary`, `hasLoanTerms` and `stillOwedForBorrowAccount` in `src/shared/borrowings.ts`.
- Decisions:
  - A loan "has terms" when any of Interest, Payment Frequency or Period count is set.
  - Missing Notion property on pull: the local value is kept (unknown, not cleared), so absent properties never wipe terms. Schema check: a missing loan property is a warning, a wrong type is still an error.
  - Push: plain rows never send the four properties (null now and null in the base snapshot); if Notion still rejects a write naming one of them, the write is retried without them.
  - Still owed = balance-based amount, with each loan-with-terms's principal and linked repayments swapped for its Remaining balance; unlinked repayments stay in the balance-based part.
  - Period count is stored as given; only a positive whole number gives a Suggested payment.
- Checks: `npm run typecheck` clean; existing `vitest run` passes (451); a throwaway script confirmed 155,000 / 12,916.67 / 142,083.33 and the mixed-panel figure.
- Not done: no screen, chat or repository read of "still owed" is wired to `stillOwedForBorrowAccount` yet (tickets 03/04/05); GLOSSARY.md does not exist on this branch's base, so the three terms were not added.
- Next: tests per criterion, then review.

### 2026-11-21 claude (cook)
- Did: Renamed the migration to `0016_loan_terms.sql` (journal idx 16, when 1786700000000) because `development` already has `0015_monthly_budget_snapshots`. The branch's journal skips idx 15 until it is merged with `development`.

### 2026-11-21 claude (test)
- Did: Added `test/loan-terms.test.ts`, one test per criterion (AC3 has four, AC2 three), all passing; ticked AC1-AC8. AC1 replays migrations without 0016 on a row, then applies 0016 and checks columns and data. AC2/AC3 run the real pull, push and repository on an in-memory DB with a mocked Notion client, including a repayment read before its loan, the base snapshot, absent properties not wiping local terms, plain rows not sending the properties, and a retry after Notion rejects a missing `Interest`.
- No bug found in the ticket 02 code by these tests.
- Not done: no review or commit (test only). The typecheck errors above belong to another ticket's test file.

### 2026-11-21 claude (review fixes)
- Did, test first (8 new tests in `test/loan-terms.test.ts`, red then green):
  1. Sync data loss. When a push has to leave the loan properties out because Notion lacks them, the saved base snapshot now keeps the previous base for those four fields, and the row stays dirty while it holds terms, so a later pull with the properties present but empty cannot wipe them and the next push sends them. The fallback now matches only Notion's `<name> is not a property that exists` message, so another 400 that merely mentions "Interest" is a normal failure.
  2. Main-process validation: Period count must be a whole number of at least 1; Period count and Payment Frequency are set together or both empty (checked on the merged row for updates, only when the patch touches them); Interest stays optional and non-negative; `linkedBorrowingId` cannot be the row itself and must point at an existing, non-deleted row with loan terms (create and update). Rows without terms are unchanged.
- Files: `src/main/sync/push.ts`, `src/main/domain/validation.ts`, `src/main/db/repositories.ts`, `test/loan-terms.test.ts`.
- Evidence (from `notable-finance-app/`): `npx vitest run test/loan-terms.test.ts` → 21 passed. `npx vitest run` → 52 files passed, 1 failed (not ticket 02: `src/renderer/.../workflow-borrowing-repayments.test.tsx` 04#AC2b, expected '5000' got '10000'); 495 tests passed, 1 failed, 7 skipped. `ELECTRON_RUN_AS_NODE=1 ./node_modules/electron/dist/Electron.app/Contents/MacOS/Electron node_modules/vitest/vitest.mjs run` → 53 files passed, 1 failed (same 04#AC2b); 502 passed, 1 failed, 0 skipped. `npm run typecheck` → clean. Chat tests (`chat-borrowings`, `chat-write-tools`) pass under the stricter rules.

### 2026-11-21 claude
- Did: Served: c6f53aa. Modifiers run: test, review, serve (review ran once over tickets 02-06 together; the user accepted closing). Playwright `e2e/borrowing-terms.spec.ts` re-run after the review fixes: 1 passed; unit suite under Electron's Node: 54 files, 503 tests passed; typecheck clean. Commit made on branch claude/borrowing-terms-02-662ac8, not merged.
- Docs to check: GLOSSARY.md (Loan terms, Suggested payment, Remaining balance exist only in the main checkout), docs/adr/0007 (same).
