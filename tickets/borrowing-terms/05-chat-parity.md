# 05: Chat parity for loan terms

**Type:** dev
**Status:** done
**Blocked by:** 02
**Owner:** claude

## What to build
The chat assistant can create a Borrow with Interest, Payment Frequency and Period count, link a repayment to a loan, and report a loan's Remaining balance. The confirm card shows computed values (total owed, Suggested payment, Remaining balance) as read-only.

## Acceptance criteria
- [x] AC1: A chat request to borrow 150,000 with 5,000 interest over 12 months produces a draft with the terms filled and a read-only total owed and Suggested payment.
- [x] AC2: A chat repayment can name the loan it pays and is saved linked.
- [x] AC3: Asking for a loan's remaining balance returns the same figure as the screen.
- [x] AC4: A draft with only part of the terms asks for the missing ones instead of saving.

## Inputs
- `tickets/borrowing-terms/spec.md`
- `docs/adr/0004-derived-values-computed-not-stored.md`
- `docs/adr/0007-loan-interest-inside-the-borrowing.md`
- `GLOSSARY.md` (Loan terms, Suggested payment, Remaining balance)

## Evidence
- Commits: c6f53aa
- PR: not merged (local commit c6f53aa on branch claude/borrowing-terms-02-662ac8)
- Tests: `test/chat-borrowings.test.ts`, four tests named `borrowing-terms/05#AC1`..`#AC4`. `cd notable-finance-app && npx vitest run test/chat-borrowings.test.ts` → 12 passed. Full `npx vitest run` → 50 files passed, 1 skipped; 455 tests passed, 7 skipped. `npm run typecheck`: node config clean; web config fails with 1 error in another session's file, `src/renderer/src/components/pages/borrowing-terms-fixtures.tsx(56,26) TS2345 HTMLElement not assignable to string` (not a 05 file; not touched). No e2e run.
- Review: `code-review` against HEAD (uncommitted) of tickets 02-06 together. Fixed: (1) push fallback left loan terms marked synced, so a later pull could wipe them (02); (2) main-process validation for Period count, the Period count/Frequency pair and the loan link (02); (3) editing a repayment silently unlinked it when its loan was not in the picker (03/04); (4) Record repayment prefilled more than the remaining balance (04). Noted, not changed: a link made in Notion to a loan on a different Borrow account is counted twice in the panel; the missing-property fallback match was tightened rather than removed.
- Docs updated: wiki/desktop/borrowings.md, wiki/shared/notion-field-mapping.md, wiki/desktop/local-data-schema.md, notable-finance-app/CHANGELOG.md (written under ticket 06)

## Progress log
### 2026-11-21 claude
- Did: Created from the spec at the user's approval of the breakdown.
- Next: Claim after 02 and extend the chat borrowing tools and tests.

### 2026-11-21 claude
- Did: Claimed (cook only). Reading chat borrowing tools and 02's shared math.
- Next: Extend write/read tools, drafts, router and confirm card.

### 2026-11-21 claude (cook)
- Did (all under `notable-finance-app/src/main/chat/`, nothing committed, no tests run per cook-only):
  - `tools/write-tools.ts`: `proposeCreateBorrowing` accepts `interest`, `paymentFrequency`, `periodCount` (borrowed) and `loan` (repayment; name or id, only loans with terms on that Borrow account). Missing-field rules: Frequency without Period count and vice versa, invalid frequency, non-whole/≤0 Period count, negative Interest, unknown or ambiguous loan all go into `missingRequired` so the draft cannot be approved (AC4). Interest alone is allowed. Payload carries `interest`, `paymentFrequency`, `periodCount`, `linkedBorrowingId`; `toCreateIncomeInput` passes them to `createIncome` (AC1, AC2). Card edits round-trip because the validator re-reads the payload keys.
  - Read-only computed values: draft `computedPreview` plus the `display.note` line (Total owed, Suggested payment; on a linked repayment, Pays <loan> and Remaining balance before → after). Computed with `computeLoanSummary`; never in the payload.
  - Repayment with loans-with-terms on the Borrow account but no `loan` gives a warning, not a block (unlinked repayments stay valid per spec).
  - `tools/read-tools.ts`: `getBorrowingsSummary` now uses `stillOwedForBorrowAccount` (matches the panel) and lists `loans` with summaries; new `getLoanSummary` (AC3, same `computeLoanSummary` as the screen); `queryIncomes` rows include terms/link when set; `explainAppTopic("borrowings")` text updated.
  - `tools/registry.ts`: new `getLoanSummary` tool and schema; `proposeCreateBorrowing` schema/description extended. `skills/router.ts`: workflow-borrowings prompt covers terms, asking for the missing half, linking, and reporting balances from the tool.
- Decisions: repayment link is by loan name or id, not auto-picked; terms on a repayment and a link on a Borrowed row are ignored with a warning. `computedPreview` is also set so the renderer can show it structurally; the card works today from `display.note` alone (renderer untouched).
- Verified: `tsc --noEmit -p tsconfig.node.json` clean. No tests written or run (cook-only).
- For 04/06: tests should extend `test/chat-borrowings.test.ts` (its repo mock only stubs `listAccounts`/`listIncomeCategories`; the new code also calls `repo.listIncomes({view:'borrowings'})`, so add that to the mock). `getBorrowingsSummary` result gained `loans`. The renderer chat card may later read `draft.computedPreview` (keys: totalOwed, suggestedPayment, remainingBalance, remainingBalanceBefore, loan).
- No problems found in ticket 02's work.

### 2026-11-21 claude (test)
- Did: Added AC1-AC4 tests to `test/chat-borrowings.test.ts` (mock `listIncomes` now reads a `vi.hoisted` store so tests can set loan rows; ticket-06's `listIncomes` stub was replaced by it). Ticked AC1-AC4 after they passed. No bug found in 05 code.
- Test notes: AC3 compares `getLoanSummary` and `getBorrowingsSummary` with `computeLoanSummary` on the same rows (including a deleted and an unlinked repayment). A newer draft in the same thread supersedes an older one, so card edits in tests run before the next propose.
- Open: web typecheck error above belongs to the renderer test fixture owner.

### 2026-11-21 claude
- Did: Served: c6f53aa. Modifiers run: test, review, serve (review ran once over tickets 02-06 together; the user accepted closing). Playwright `e2e/borrowing-terms.spec.ts` re-run after the review fixes: 1 passed; unit suite under Electron's Node: 54 files, 503 tests passed; typecheck clean. Commit made on branch claude/borrowing-terms-02-662ac8, not merged.
- Docs to check: GLOSSARY.md (Loan terms, Suggested payment, Remaining balance exist only in the main checkout), docs/adr/0007 (same).
