# 03: Hide toggles on Accounts and Monitoring

**Type:** dev
**Status:** in-progress
**Blocked by:** page-controls/01
**Owner:** unassigned

## What to build
Accounts gets the period toggle (hiding the All Accounts / Accounts / Credit Accounts tabs) and the views toggle (hiding Table | Cards | Wallet), before its filter icon. Monitoring gets the period toggle (hiding the Monthly … Annually bar) and the views toggle (hiding the Default | Custom switch) in its header, before Add Forecast. Hidden controls keep working (scope, view, budget source and period stay in effect) and the state is remembered per page.

## Acceptance criteria
- [x] AC1: Accounts shows the icons Period, Views, Filters in its header; the period toggle hides the scope tabs and the views toggle hides Table | Cards | Wallet; the chosen scope and view stay in effect.
- [x] AC2: Monitoring shows the icons Period, Views before Add Forecast; the period toggle hides the Monthly … Annually bar and the views toggle hides Default | Custom; the chosen period and budget source stay in effect and the figures do not change.
- [x] AC3: With the period and views controls and the filters all hidden, Accounts shows only the header and the table, and Monitoring only the header and its content.
- [x] AC4: Each page remembers its hidden state after a restart and starts with everything shown.
- [x] AC5: Light and dark themes both look right, and a screenshot of each page with everything hidden is in the evidence.

## Inputs
- tickets/page-controls/spec.md
- tickets/page-controls/01-shared-toggles-and-income.md

## Evidence
- Commits:
- PR:
- Tests: `page-controls-accounts-monitoring.test.tsx` 12 tests named `page-controls/03#ACn`; pages suite (29 files, 310 tests) passes; eslint 0 errors on touched files; typecheck clean for my files (other errors came from ticket 02's work in progress).
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the owner approved the design ("Yes to all, build").
- Next: Pick up when unblocked.
### 2026-11-24 claude (cook)
- Did: Accounts header now has Period, Views, Filters icons: period hides the scope tabs, views hides Table | Cards | Wallet, filters hides the dropdown and Hide zero balance; the filter row renders only when it has something to show. Monitoring header has Period, Views before Add Forecast: period hides the Monthly … Annually bar, views hides the Default | Custom row. Chosen scope, view, period and budget source stay in effect; state saved per page via usePageControls (`accounts`, `monitoring`).
- Not done: AC5 (light/dark and screenshots with everything hidden) left unticked: no visual harness was run.
- Visual check 2026-11-24: Accounts and Monitoring in light and dark, shown and hidden (evidence/v-accounts-*.jpg, v-monitoring-*.jpg, v-accounts-table-dark-hidden.jpg, v-accounts-light-shown-700.jpg). With everything hidden: Accounts in Table view shows only the header and the table; in Cards view the summary strip and the cards remain because they are page content. Monitoring shows its header and content. No toolbar overflow at 700px on either page. (The NaN% figures in Monitoring screenshots come from the harness's mock data, not the page.) AC5 ticked.
