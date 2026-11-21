# 07: Two-way loan links

**Type:** dev
**Status:** done
**Blocked by:** None
**Owner:** unassigned

## What to build
A repayment can be linked to a loan from either side, like a Notion relation. In the repayment form the Loan picker lists every Borrowed row on the chosen Borrow account, whether or not it has Loan terms. In a Borrowed row's record modal a Payments section lists its linked repayments and lets the user link an existing unlinked repayment from that Borrow account, or unlink one. Both entry points set the same link on the repayment. A Borrowed row with no Loan terms but with linked repayments is treated as a loan with Interest 0: it shows Paid amount, Payments made and Remaining balance, and has no Suggested payment.

## Acceptance criteria
- [x] AC1: The repayment form's Loan picker lists every Borrowed row on the chosen Borrow account, with or without Loan terms, and the user can link a repayment to a loan that has no terms.
- [x] AC2: A Borrowed row's record modal lists its linked repayments (name and date, with a Total paid line); linking and unlinking are done in the edit form (AC9), not by a separate dropdown and button. (Reworded 2026-11-21 when AC9 replaced the first Payments UI.)
- [x] AC3: A Borrowed row without Loan terms and with linked repayments shows Paid amount, Payments made and Remaining balance (principal minus payments, never below 0, no Suggested payment); a Borrowed row without terms and without links looks and behaves as before.
- [x] AC4: The Borrow Accounts panel counts a loan with linked repayments once (no double counting) and equals the sum of loan Remaining balances plus the balance-based amount for the rest.
- [x] AC5: Main-process validation accepts a link to any non-deleted Borrowed row and rejects a link to itself, to a repayment, or to a row that does not exist.
- [x] AC6: The chat assistant can link a repayment to a loan without terms by name.
- [x] AC7: A link made from either side is the same stored link and syncs to Notion's Linked Borrowing; a link made in Notion shows on both sides after sync.
- [x] AC8: A loan's Remaining balance is shown in red, like the other owed amounts, whenever it is above 0 (record modal and Borrowings table); at 0 it uses the normal colour.
- [x] AC9: On a Borrowed row, Payments works like Covered Expenses on a CC Payment: a multi-select list in the loan's edit form of the repayments on the same Borrow account (name and date as the label, amount as the sublabel), with a computed Total paid line; selecting several and saving links all of them, deselecting and saving unlinks them, and the saved links show again when the loan is reopened. The separate "Link a repayment" dropdown and Link button are removed.
- [x] AC10: A repayment links to at most one loan: a repayment already linked to a different loan is not selectable in another loan's list (shown disabled with the other loan's name, or left out), while one loan can have many repayments.
- [x] AC11: Linking repayments from the loan side really saves: linking two repayments from the loan, saving and reopening shows both, and Paid amount, Payments made and Remaining balance update; the same link is seen from the repayment's own Loan picker.

## Inputs
- `tickets/borrowing-terms/spec.md`
- `docs/adr/0007-loan-interest-inside-the-borrowing.md`
- `docs/adr/0004-derived-values-computed-not-stored.md`
- `GLOSSARY.md` (Loan terms, Remaining balance)

## Evidence
- Commits: 50aed9c, 6258b6f
- PR: not merged (local commit 50aed9c on branch claude/borrowing-terms-02-662ac8)
- Tests: (from `notable-finance-app/`) `borrowing-terms/07#AC1,AC2,AC3,AC4,AC7` in `src/renderer/src/components/pages/workflow-borrowing-links.test.tsx` (screen seam), `07#AC3,AC4,AC5` in `test/loan-terms.test.ts` (shared math and main validation), `07#AC6` in `test/chat-borrowings.test.ts`. AC1 and AC2 also ran end to end: `npx electron-vite build && npx playwright test e2e/borrowing-terms.spec.ts` → 2 passed (the original 150,000 flow and a new loan-side link of a repayment to a loan without terms). AC7: the renderer tests prove both entry points send the same `{ linkedBorrowingId }` patch and a stored link shows on both sides; `Linked Borrowing` mapping and pull linking are covered by `borrowing-terms/02#AC2` (unchanged, passing). Full suite: `npx vitest run` → 54 files passed, 1 skipped; 504 tests passed, 7 skipped (SQLite). Electron Node (`ELECTRON_RUN_AS_NODE=1 ./node_modules/electron/dist/Electron.app/Contents/MacOS/Electron node_modules/vitest/vitest.mjs run`) → 55 files, 511 tests, all passed. `npm run typecheck` 0 errors; `npx eslint src test e2e` 0 errors, 116 warnings.
- Review: not run for this ticket (the earlier code-review covered 02-06 only). Unit suite, typecheck and Playwright (2 tests) run instead, see Tests.
- Docs updated: `wiki/desktop/borrowings.md`, `notable-finance-app/CHANGELOG.md` (Unreleased). `wiki/shared/notion-field-mapping.md` already lists `Linked Borrowing` as a single writable relation, unchanged.

## Progress log
### 2026-11-21 claude
- Did: Created after the user installed the app and found the Loan picker empty for an existing loan, and asked for linking from either side like Notion.
- Requirement change: this overrides the spec decision that only loans with terms qualify for linking (ticket 04 AC1, AC5, AC6; ticket 02 AC8).
- Next: Claim and implement test-first.

### 2026-11-21 claude
- Requirement change: added AC8 (Remaining balance in red when above 0). The user tried the installed app and asked for the Remaining balance number to be red as well, like the other owed amounts. Reason: it is money still owed.

### 2026-11-21 claude (cook + test)
- Did: Added `isLoan` in `shared/borrowings.ts` (terms or any live linked repayment); `stillOwedForBorrowAccount` and the chat read tool use it. Main validation (`assertLinkableLoan` in `db/repositories.ts`) now accepts any live Borrowed row (found by its Borrow account) and rejects self, a repayment, a deleted or a missing row. Chat `findLoan` lists every Borrowed row on the account. Renderer: picker lists all Borrowed rows on the chosen Borrow account; table/modal figures for a loan without terms appear only when it has linked repayments (no Suggested payment row then); new Payments section in a Borrowed row's modal (list, link an unlinked repayment from the same Borrow account, unlink) acting immediately through the same update path; Record repayment links any Borrowed row and prefills min(suggested, remaining) as before. Review fixes (keep existing link, no options from a partial list, prefill min) kept.
- Changed tests: `04#AC1` now expects the plain loan in the picker; the old `02#validation` terms-only link test was replaced by `07#AC5`; `02` test fixtures gained a Borrow account and `accountId` so a loan is recognised as Borrowed. Test helper `rowFor` is scoped to the table.
- Decision: the Payments section is shown for every saved Borrowed row (needed to link the first payment), but the computed Total owed / Paid / Remaining fields only appear for a loan (terms or links), so a bare Borrowed row looks as before apart from that section.

### 2026-11-21 claude (AC8)
- Did: Remaining balance is red above 0 and normal at 0. Table column uses the existing `OwedValue` (`money-value--rose`, the same `var(--rose)` as the Borrow Accounts panel; zero uses `money-value--ink`); the record modal's Remaining balance card passes `valueTone` "rose" above 0, else "ink" (`computed-field__value--rose` also resolves to `var(--rose)`, no new colour). No-terms, no-links rows keep the dash.
- Tests: `borrowing-terms/07#AC8` in `workflow-borrowing-links.test.tsx` (failed first with the plain `num` span, then passed). Re-run from `notable-finance-app/`: `npx vitest run src/renderer/src/components/pages/workflow-borrowing` → 26 passed; `npx vitest run` → 54 files passed, 1 skipped; 505 tests passed, 7 skipped; Electron Node run → 55 files, 512 tests, all passed; `npm run typecheck` 0 errors. Playwright not re-run (its assertions are text-only).

### 2026-11-21 claude
- Requirement change: added AC9-AC11. The user tried the installed app: the Payments section's "Link a repayment" dropdown and Link button did nothing useful and the UI was poor. They asked for the same multi-select pattern as Cover expense, with one loan able to hold many payments and a payment able to link only one loan. The previous Payments UI (a single dropdown plus a Link button) is replaced.

### 2026-11-21 claude (AC9-AC11)
- Root cause of "Link does nothing": the record modal body is `<fieldset class="modal-fieldset" disabled={!editing || saving}>` (`components/ui/form-modals.tsx`). The Payments dropdown and Link button sat inside it, so in the read-only view (where a user opens a loan) they were disabled; the main update path itself was fine (`updateIncome` with `{ linkedBorrowingId }` is covered by `07#AC5`). My earlier test missed it because jsdom's `fireEvent` still reached the handler. The regression test now asserts the control is disabled in view mode and enabled (`toBeEnabled`, which honours fieldset ancestors) after Edit.
- Did: Replaced the dropdown and Link button with a Payments `MultiSelect` in the loan's edit form (same pattern as Covered Expenses: label name and date, sublabel amount, computed Total paid; the read-only modal lists the chips). Items are repayments on the loan's Borrow account that are unlinked or already linked to this loan; repayments linked to a different loan are left out. Saving the loan applies the diff, one update per changed repayment (`{ linkedBorrowingId: loanId | null }`), only when the selection was touched (so a not-yet-loaded list can never unlink anything), and stays open with an error if one fails. `workflow/index.tsx`, `workflow-form-fields.tsx`, `use-workflow-form.ts`.
- Tests: `borrowing-terms/07#AC9`, `#AC10`, `#AC11` in `workflow-borrowing-links.test.tsx` (the old `#AC2` list/link/unlink test was removed and `#AC7` side 2 now uses the multi-select). They failed before the change (4 failures) and pass now. Playwright spec extended: `repayments can be linked from the loan side with the Payments multi-select` (links two repayments, saves, sees ₱500.00 remaining, reopens and sees both).
- Commands (from `notable-finance-app/`): `npx vitest run src/renderer/src/components/pages/workflow-borrowing` → 28 passed. `npx vitest run` → 54 files passed, 1 skipped; 507 passed, 7 skipped. Electron Node run → 55 files, 514 passed. `npm run typecheck` 0 errors; `npx eslint src test e2e` 0 errors, 116 warnings. `npx electron-vite build && npx playwright test e2e/borrowing-terms.spec.ts` → 2 passed.
- Docs: `wiki/desktop/borrowings.md` and the CHANGELOG now describe the multi-select.

### 2026-11-21 claude
- Did: Served: 50aed9c. Modifiers run: season (AC8 red balance, AC9-AC11 multi-select Payments), test, serve. The user tried the installed app and accepted closing ("Works, serve it"). Final runs before the commit: `npx vitest run` 54 files passed, 1 skipped, 507 tests passed, 7 skipped; under Electron's Node 55 files, 514 tests passed; typecheck clean; `npx electron-vite build && npx playwright test e2e/borrowing-terms.spec.ts` 2 passed. Commit made on branch claude/borrowing-terms-02-662ac8, not merged.
- Docs to check: GLOSSARY.md and docs/adr/0007 (exist only in the main checkout), tickets/borrowing-terms/spec.md (linking rule changed).

### 2026-11-21 claude
- Requirement change: reworded AC2 (the old dropdown and Link button it described were replaced by AC9's multi-select; the read-only list of linked repayments stays). Added test `borrowing-terms/07#AC2` for it.
