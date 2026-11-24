# 01: Budget period parser and splitter

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
A pure function that reads a Saved Budgets database row title and says which months it covers, and splits a row's amounts evenly across those months. It is the base for pulling hand-made rows from Notion.

## Acceptance criteria
- [x] AC1: A month title such as Jan 2025 returns that single month.
- [x] AC2: A quarter title such as Q1 2024 returns its three months.
- [x] AC3: A half title such as H1 2025 returns its six months, and a year title such as 2026 returns twelve.
- [x] AC4: Amounts are split evenly to 2 decimals, with the rounding remainder on the last month, so the parts add back to the total.
- [x] AC5: An unrecognized title is rejected with a reason, never guessed.
- [x] AC6: Titles are matched case-insensitively and tolerate extra spaces.

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
- Did: Cooked. Added the period parser and splitter in shared code, with tests for each criterion.
- Next: /cook-a-ticket [serve] to commit and close once you have tried it.
