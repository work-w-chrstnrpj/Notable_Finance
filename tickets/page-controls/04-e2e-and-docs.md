# 04: End-to-end check and docs for the hide toggles

**Type:** automation
**Status:** in-progress
**Blocked by:** page-controls/02, page-controls/03
**Owner:** claude

## What to build
An end-to-end run that hides the period picker and the view switches on one page and sees only the title and the table. Docs are updated: the desktop wiki pages that describe page headers and toolbars, and the CHANGELOG.

## Acceptance criteria
- [x] AC1: The end-to-end run hides the period picker on Income and the period and view controls on Accounts and sees them go and come back.
- [x] AC2: The existing end-to-end suite passes, with only visible-wording changes updated and logged.
- [x] AC3: The wiki pages describing page toolbars match what shipped, and the CHANGELOG has an entry.

## Inputs
- tickets/page-controls/spec.md

## Evidence
- Commits:
- PR:
- Tests: `npm run test:e2e` (builds first): 55 passed, including the 2 new tests in `e2e/page-controls.spec.ts` (`page-controls/04#AC1`); no existing spec needed a wording change. `npx vitest run`: 79 files passed, 778 tests passed, 36 skipped; `npm run typecheck` clean.
- Review:
- Docs updated: `wiki/desktop/ui-ux-redesign.md` (new section 'Hiding page controls'), `notable-finance-app/CHANGELOG.md` (Unreleased, Added).

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the owner approved the design ("Yes to all, build").
- Next: Pick up when unblocked.
### 2026-11-24 claude
- Did: Claimed the ticket; writing e2e/page-controls.spec.ts, then docs and CHANGELOG.
- Next: run the e2e suite.
- Did: Added `e2e/page-controls.spec.ts` (Income hides and restores its period bar; Accounts hides and restores the period tabs, the view switches and the filter row, each by its own icon). Ran the whole e2e suite: 55 passed. Updated the wiki toolbar section and the CHANGELOG. AC1 covers hide-and-restore of the controls; the title-and-table-only state is asserted by the heading remaining while every control is gone.
- Not done: no light/dark visual check (tracked on tickets 01 to 03).
