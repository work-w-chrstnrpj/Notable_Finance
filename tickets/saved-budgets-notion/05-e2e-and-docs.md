# 05: End-to-end check and docs for the Saved Budgets mirror

**Type:** automation
**Status:** in-progress
**Blocked by:** 04
**Owner:** claude

## What to build
One end-to-end run proves the mirror works from the Settings toggle to rows in a fake Notion, and the docs that said saved budgets are local only are brought in line.

## Acceptance criteria
- [ ] AC1: An end-to-end test turns the mirror on, confirms the backfill and finds the pushed rows in the fake Notion.
- [ ] AC2: The same test edits a row in the fake Notion and sees the new value locally after sync.
- [x] AC3: wiki/desktop/monthly-budget-snapshots.md and wiki/desktop/local-data-schema.md no longer say there is no Notion mirror and describe the toggle.
- [x] AC4: The Notion field-mapping doc lists the Saved Budgets database and its columns.
- [x] AC5: The reset confirmation and export hint still read correctly for both mirror states.

## Inputs
- Spec: tickets/saved-budgets-notion/spec.md
- ADR-0008 (supersedes ADR-0006)
- GLOSSARY.md: Saved budget, Budget period, Saved Budgets database
- Playwright runs separately from npm test

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
- Did: Cooked docs only. Updated the monthly budgets wiki (new section 17), the local data schema, the IPC contract heading, the Notion field mapping and the reset confirmation text. AC1 and AC2 (the end-to-end test against a fake Notion server) are not done: the Electron end-to-end setup has no fake Notion server and needs a stored token, so it needs its own pass.
- Next: /cook-a-ticket [serve] to commit and close once you have tried it.
