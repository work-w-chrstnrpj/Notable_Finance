# 06: End-to-end check and docs for loan terms

**Type:** dev
**Status:** in-progress
**Blocked by:** 01, 03, 04, 05
**Owner:** unassigned

## What to build
A Playwright check proves the whole flow, and the docs describe loan terms. Playwright runs separately from the normal test command, so this ticket runs it explicitly.

## Acceptance criteria
- [x] AC1: A Playwright test creates a 150,000 loan with 5,000 interest over 12 months, records one 12,916.67 linked repayment, and sees 142,083.33 remaining.
- [x] AC2: The Playwright test is run and its result recorded as evidence, separately from the unit test run.
- [x] AC3: The borrowings, Notion field-mapping and local-schema pages and the CHANGELOG describe loan terms, the Notion properties and the computed balances.
- [ ] AC4: The drift check reports no doc drift for these changes.

## Inputs
- `tickets/borrowing-terms/spec.md`
- `docs/adr/0004-derived-values-computed-not-stored.md`
- `docs/adr/0007-loan-interest-inside-the-borrowing.md`
- `GLOSSARY.md` (Loan terms, Suggested payment, Remaining balance)

## Evidence
- Commits: c6f53aa
- PR: not merged (local commit c6f53aa on branch claude/borrowing-terms-02-662ac8)
- Tests (Playwright, run separately from unit tests, from `notable-finance-app/`): `npx electron-vite build && npx playwright test e2e/borrowing-terms.spec.ts` → 1 passed (creates 150,000 / 5,000 / Monthly / 12, records one prefilled linked 12,916.67 repayment, sees 142,083.33 remaining in table and modal). Re-run after the final fix: 1 passed. The spec passed on its first run with no change.
- Tests (unit): `npx vitest run` (plain Node) → 50 files passed, 1 skipped; 451 tests passed, 7 skipped (SQLite-backed, binding targets Electron). `ELECTRON_RUN_AS_NODE=1 ./node_modules/electron/dist/Electron.app/Contents/MacOS/Electron node_modules/vitest/vitest.mjs run` → 51 files, 458 tests, all passed, none skipped. First run had 3 failures in `test/chat-borrowings.test.ts` (ticket 05's test): its repositories mock lacked `listIncomes`, which 05's loan lookups call ("Database not initialised"). Fixed by adding `listIncomes: () => []` to the mock; no source change.
- Typecheck: `npm run typecheck` clean. Lint: `npm run lint` 0 errors, 114 warnings (max-lines etc.).
- Drift: AC4 NOT proven. `node .ai/cli/bin/cli.mjs drift` does not exist in this worktree (the CLI is only in the main checkout) and drift only reads committed diffs. Run in a throwaway clone with the working changes committed there (`drift --since f340e6c`): it listed all 31 changed files as "no map covers" and suggested `docs/testing/test-specification.md`, `docs/api/api-specification.md`, `docs/database/data-model.md`, which do not exist in this repo. So it reports nothing it can mark clean; a human needs to decide if that output counts. Nothing was marked (`--mark` not run).
- Review: `code-review` against HEAD (uncommitted) of tickets 02-06 together. Fixed: (1) push fallback left loan terms marked synced, so a later pull could wipe them (02); (2) main-process validation for Period count, the Period count/Frequency pair and the loan link (02); (3) editing a repayment silently unlinked it when its loan was not in the picker (03/04); (4) Record repayment prefilled more than the remaining balance (04). Noted, not changed: a link made in Notion to a loan on a different Borrow account is counted twice in the panel; the missing-property fallback match was tightened rather than removed.
- Docs updated:

## Progress log
### 2026-11-21 claude
- Did: Created from the spec at the user's approval of the breakdown.
- Next: Claim after the other tickets are done.

### 2026-11-21 claude (cook-only)
- Did: Wrote `notable-finance-app/e2e/borrowing-terms.spec.ts` (isolated temp user-data dir seeded with a Bank account, a `Debt/Loan` Auxiliary account and the Borrowed Money category; creates the 150,000 / 5,000 / Monthly / 12 loan, opens it, records the prefilled 12,916.67 linked repayment, expects 142,083.33 remaining in the table and modal). Updated docs: `wiki/desktop/borrowings.md`, `wiki/shared/notion-field-mapping.md`, `wiki/desktop/local-data-schema.md`, `notable-finance-app/CHANGELOG.md` (new Unreleased section). Not run; selectors were written against the code without running (labels via `getByLabel`, Loan and Payment Frequency are native selects), so expect to adjust on the first run.
- Command to run later (from `notable-finance-app/`): `npx electron-vite build && npx playwright test e2e/borrowing-terms.spec.ts` (or `npm run test:e2e -- e2e/borrowing-terms.spec.ts`).
- Not done: AC2 (run and record), AC4 (drift check `node .ai/cli/bin/cli.mjs drift`), ticket 01 untouched. This worktree has no `GLOSSARY.md` (it exists only in the main checkout), so the three glossary terms were not added here.

### 2026-11-21 claude (test)
- Did: Ran the Playwright spec (passed), full unit suite in both Node modes, typecheck, lint and drift; results in Evidence. Fixed ticket 05's `test/chat-borrowings.test.ts` mock (test-only). Ticked AC1, AC2, AC3; AC4 left open (see Evidence, Drift). Ticket 01 untouched. Nothing committed.

### 2026-11-21 claude
- Did: Code, tests and docs for 02-06 committed as c6f53aa. NOT closed: AC4 (drift check) is not proven, see Evidence. Playwright re-run after review fixes: 1 passed.
- Next: decide whether the drift output counts, or run drift in the main checkout after the branch is merged.
