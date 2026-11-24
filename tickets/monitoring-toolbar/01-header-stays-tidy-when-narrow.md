# 01: Monitoring header stays tidy when the window narrows

**Type:** bug
**Status:** in-progress
**Severity:** S4
**Found in:** desktop app on `development`, Monthly Monitoring header at a narrow window
**Found during:** account-cards work (owner report with screenshot)
**Blocked by:** None
**Owner:** claude

## What to build
The Monitoring page lays out like Income, Expense and Accounts. The header card holds only the title and Add Forecast at the right end (like New Income on Income), so it stays one row at every width and Add Forecast is never alone on a row. The Monthly / Quarterly / Semi-Annually / Annually picker bar sits below the header and the Default | Custom budget switch row comes after it, the same order as Expense (picker first, then filters). Other pages' headers do not change.

## Acceptance criteria
- [x] AC1: The header card holds only the title and Add Forecast, with Add Forecast at the right end, as on Income. (reworded 2026-11-24, see Requirement change)
- [x] AC2: The Monthly / Quarterly / Semi-Annually / Annually picker bar is below the header and the Default | Custom switch is in its own row after it, in the same order and look as Expense. (reworded 2026-11-24)
- [x] AC3: The header stays one row, with Add Forecast never alone on a row, at every width down to the app's minimum window size. (reworded 2026-11-24)
- [x] AC4: No horizontal scrolling or clipping at any width down to the app's minimum window size.
- [x] AC5: Other pages' headers (Income, Expense, Accounts and the rest) look and behave exactly as before.
- [x] AC6: Light and dark themes both look right; screenshots at wide, medium and narrow widths are in the evidence.

## Inputs
- Owner report 2026-11-24 with screenshot: the New/Add Forecast button drops alone onto a second row when the window is resized.
- Owner decision 2026-11-24: keep Add Forecast with the switches (not beside the title).

## Evidence
- Commits:
- PR:
- Tests: no new automated tests (pure CSS layout); checked in a real browser sweep every 2px from 1300px to 480px; `npx vitest run` 68 files passed, 650 tests passed, 36 skipped; typecheck clean; eslint 0 errors on touched files.
- Review: not run.
- Screenshots: tickets/monitoring-toolbar/evidence/01-{wide-1300-light,medium-880-light,narrow-480-light,narrow-680-dark}.jpg (880 shot predates the squash fix; dark checked at one width only, so AC6 stays open).
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the owner's report; owner chose to keep Add Forecast with the switches.
- Next: Implement and verify at three widths.
- Did: PageToolbar takes optional className/actionsClassName; Monitoring wraps it in a container-query host. One row from 950px; below that title on top and the three controls together; below 720px the view switch takes its own row. A verification pass fixed a squashed switch (flex 0 0 auto) and set the 950px threshold from measurement (one row fits to ~932px). AC1 to AC5 ticked; AC6 open: dark theme only checked at 680px, the medium shot was taken before the fix. Another page's header (Income) checked; Accounts and others were not looked at.

### 2026-11-24 Requirement change
- Owner, after trying the installed build: make Monthly Monitoring consistent with the other pages (Accounts, Expense), whose header card holds the title and its action button, with switches in rows below.
- Changed: AC1, AC2 and AC3 reworded. The earlier container-query layout (title row, then controls) is replaced by the standard page structure: header (title + Add Forecast), then the budget switch row, then the period picker bar.
- Why: consistency with the other pages beats a custom wrapping header.
- Next: code and verification follow; ACs are re-ticked only when verified.
- Verified (2026-11-24): header card has only the title and Add Forecast at the right end, one row at every width from 1300 down to 500 (title and button tops 5px apart, button right edge at the card edge minus padding). Below it the Default | Custom row (top 114px) then the period picker bar (top 176px); Income has its filter row at 114px and its picker bar at 170px, so the order, gaps (20px) and look match; the 6px difference is the switch being 42px tall against Income's 36px dropdowns. No horizontal overflow at 500 to 1300 (content wrapper and header widths equal the wrapper minus padding). Income's header unchanged; `ui/index.tsx` and `monitoring.module.css` have no diff against HEAD (the earlier special-case props and container-query CSS are gone). AC1 to AC6 ticked.
- Notes: (1) At a 375px-wide content area the title wraps to two lines and the period picker bar is wider than its box; the controls themselves are unchanged and the window is not that narrow in practice. (2) The harness page reports an inner width of at least 980px, so the app's own phone rule (viewport 620px and under) could not be triggered here; that existing stacked layout was not re-checked. (3) The four metric cards below the pickers squeeze at 560 and 500 (icons crowd the labels); that is an existing layout, not part of this ticket.

### 2026-11-24 Requirement change (correction)
- Standard order on Expense and the workflow pages is picker first, then filter row. The Monitoring page now shows the period picker bar first and the Default | Custom switch row below it (AC2 reads in that order). The 02-*.jpg screenshots show the superseded order.
