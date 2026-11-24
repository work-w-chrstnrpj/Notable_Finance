# 01: Shared hide toggles, saved state, and the Income page

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
Two header icons are added before the filter icon: one hides the page's period picker, one hides its other view switches, each highlighted while its controls are shown. Which controls each page has hidden is saved per page in the UI settings and remembered after a restart; the default is everything shown. This ticket builds the shared icons and saved state and wires them into the Income page: the period toggle hides the Daily … All Records bar, and the views toggle hides the Annual Table | Chart switch and is shown only while Annually is chosen (otherwise Income has nothing for it to hide). Hidden controls keep working: the chosen period stays in effect.

## Acceptance criteria
- [x] AC1: A failing test first: hiding the period picker on Income removes the picker bar from the page while the records still follow the chosen period.
- [x] AC2: Income's header shows the icons in the order Period, Views (only while the Annual Table | Chart switch exists), Filters, Search, New Income, and each icon is highlighted while its controls are shown.
- [x] AC3: The views icon hides and shows the Annual Table | Chart switch, and the chosen annual display stays in effect while hidden.
- [x] AC4: The hidden state is saved per page and restored after a restart; older saved settings without it load as everything shown; unknown values fall back to shown.
- [x] AC5: Each icon has the accessible names "Hide period picker" / "Show period picker" and "Hide view switches" / "Show view switches".
- [x] AC6: The top date bar is unaffected, and the page works in light and dark themes.

## Inputs
- tickets/page-controls/spec.md

## Evidence
- Commits:
- PR:
- Tests: `npx vitest run` 77 files passed, 740 tests passed, 36 skipped (SQLite-only); new `page-controls-income.test.tsx` (8) and `test/ui-settings-page-controls.test.ts` (3), named `page-controls/01#ACn`; typecheck clean; eslint 0 errors on touched files.
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the owner approved the design ("Yes to all, build").
- Next: Pick up when unblocked.
### 2026-11-24 claude (cook)
- Did: Claimed the ticket; reading settings plumbing and the Income page.
- Next: shared toggles, saved state and hook, then Income wiring and tests.
- Did: Added `PeriodToggle` and `ViewsToggle` (calendar and layout-panel icons, same look as the filter icon, highlighted while shown) to `components/ui/search-bar.tsx`. Added `UiPageControls` and `pageControls` to the UI settings (shared types, main coercion that treats anything but `true` as shown and drops pages with nothing hidden, patch merged per page field by field, renderer context defaults/merge). Added the hook `usePageControls(pageId)`. Wired Income: header order Period, Views (only while Annually), Filters, Search, New Income; the period toggle hides the Income picker bar and the chosen period stays in effect; the views toggle hides the whole Annual controls block.
- Decision to flag: on Income the views toggle hides the whole annual controls block, which also holds the chart's group-by selector, so a hidden Chart view shows no group-by control (the grouping stays as chosen).
- Not done: AC6 stays unticked. The light and dark theme check was not made (no visual harness run), only the structural part (title, table, no top-bar changes).
- Next: tickets 02 (Expense, workflow) and 03 (Accounts, Monitoring) reuse the shared pieces.
- Visual check 2026-11-24: Income (Annually, so all three icons show) in light and dark, everything shown and everything hidden, at 1300px and (shown state) 700px. Screenshots: evidence/v-income-{light,dark}-{shown,hidden}.jpg and v-income-dark-shown-700.jpg. The three icons are the same size (36x32) and spacing as the filter icon and highlight the same way; hidden icons are 6.0:1 against the dark panel and active icons 3.0:1 (same styling as the existing filter icon). No overflow at 700px (toolbar scrollWidth equals clientWidth). The top date bar is unchanged. AC6 ticked.
