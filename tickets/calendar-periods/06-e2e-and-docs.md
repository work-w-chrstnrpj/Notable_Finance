# 06: End-to-end check and docs for the calendar periods

**Type:** automation
**Status:** in-progress
**Blocked by:** calendar-periods/02, calendar-periods/03, calendar-periods/04, calendar-periods/05
**Owner:** claude

## What to build
An end-to-end run that switches Income to Quarterly and Monitoring to Semi-Annually and sees the fixed range labels. Docs are updated: the desktop wiki pages that list the period options, the Monitoring description, the glossary and the ADR links, and the release note that Monitoring's Quarterly and Semi-Annually figures now cover whole calendar periods.

## Acceptance criteria
- [x] AC1: The end-to-end run switches Income to Quarterly and sees a Q label with its month range.
- [x] AC2: The end-to-end run switches Monitoring to Semi-Annually and sees an H label with its month range.
- [x] AC3: The existing end-to-end suite passes, with only visible-wording changes updated and logged.
- [x] AC4: The wiki pages that list period options and describe Monitoring match what shipped.
- [x] AC5: The release notes call out the changed Monitoring figures.

## Inputs
- tickets/calendar-periods/spec.md
- docs/adr/0012-fixed-calendar-quarters-and-halves.md

## Evidence
- Commits:
- PR:
- Tests: `npm run test:e2e` (builds first, then Playwright against the built Electron app): 53 passed, including new `e2e/calendar-periods.spec.ts` (`calendar-periods/06#AC1` Income Quarterly label, `calendar-periods/06#AC2` Monitoring Semi-Annually label); `npx vitest run` and `npm run typecheck` green (see log).
- Review:
- Docs updated: wiki/desktop/ui-ux-redesign.md, wiki/desktop/monthly-budget-snapshots.md (section 7 and open question 2, marked superseded by ADR-0012), wiki/desktop/chat-agent-design.md, README.md, notable-finance-app/CHANGELOG.md (Unreleased: added and changed entries calling out the changed Monitoring figures); GLOSSARY.md and ADR-0012 already carried the rule.

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the grill session.
- Next: Pick up when unblocked.

### 2026-11-24 claude
- Did: Claimed. Tickets 01 to 05 are done. Reading the e2e patterns and the docs that list period options.
- Next: add the two e2e tests, try to run the suite, update the docs and the changelog.
- Did: Added `e2e/calendar-periods.spec.ts` (two tests; expected labels are computed from today's date by the fixed calendar rule so they never go stale). Ran the whole e2e suite: 53 passed, no existing spec needed a wording update (the CC period spec only selects four values, still present). Updated the docs and the changelog listed under Evidence.
- Left alone: wiki/desktop/refactor-baseline.md and refactor_development_plan.md describe the earlier baseline (historical), so they still list the old four modes.
