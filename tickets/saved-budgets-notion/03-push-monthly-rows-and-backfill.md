# 03: Push monthly rows with column check and first backfill

**Type:** dev
**Status:** in-progress
**Blocked by:** 02
**Owner:** claude

## What to build
With the mirror on, each sync makes sure the database has one Number column per current non-auxiliary expense category, then pushes changed saved months as rows titled like Jan 2025. The first time it is switched on, the user sees a confirmation with the number of months and categories, and all existing saved months are pushed once.

## Acceptance criteria
- [x] AC1: Before each push, categories without a column get a new Number column; nothing is deleted or renamed.
- [x] AC2: Auxiliary categories get no column, and columns that match no category are ignored.
- [x] AC3: A renamed category gets a new column and the old column stays.
- [x] AC4: Each saved month becomes one row titled Mon YYYY with its category budgets, and changed months are updated, not duplicated.
- [ ] AC5: The first enable shows a confirmation with month and category counts, and nothing is written until confirmed.
- [x] AC6: After confirming, all existing saved months are pushed once.
- [ ] AC7: The step is skipped when the toggle is off, Notion is unmapped, or the app is offline.

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
- Did: Cooked. The mirror ensures category columns, then pushes changed months as rows titled Mon YYYY and adopts a hand-made row with the same title. AC5 (the confirm dialog with counts) is built in Settings but has no test. AC7 is only tested for the toggle-off case.
- Next: /cook-a-ticket [serve] to commit and close once you have tried it.
