# 02: Settings toggle and Saved Budgets database setup

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
In Settings the user can switch the Saved Budgets mirror on, off by default, and pick the Notion parent page. When switched on, the app finds a database titled Notable Finance: Saved Budgets under that parent and reuses it, or creates it. Its id is remembered per connected workspace. If the database later disappears, Settings says so and offers to recreate it, never doing it silently. The Notion client gains the create-database and add-column calls this needs.

## Acceptance criteria
- [x] AC1: The toggle is off by default and nothing touches Notion while it is off.
- [x] AC2: The user picks a parent page, and the choice is stored in the mapping, not hardcoded.
- [x] AC3: Switching on creates the database when none exists under that parent, with a title column.
- [x] AC4: Switching on, or changing the token, reuses an existing database with that title under that parent instead of creating a duplicate.
- [ ] AC5: The Notion client can create a database under a page and add Number columns to it.
- [x] AC6: A deleted or archived database shows a database missing status with a recreate action, and is not recreated automatically.
- [ ] AC7: Missing token, no access to the parent page and rate limits show plain messages.
- [x] AC8: Turning the toggle off stops all Notion calls for the feature and keeps the Notion database and local data.

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
- Did: Cooked. Added create-database, add-columns and page-search calls to the Notion client, a mirror module (create or reuse by title, missing database state, parent change), IPC and a Settings panel with the toggle and parent-page search. AC5 (real Notion API calls) and AC7 (plain error messages) are not proven: tests use a fake client and the calls were never run against real Notion.
- Next: /cook-a-ticket [serve] to commit and close once you have tried it.
