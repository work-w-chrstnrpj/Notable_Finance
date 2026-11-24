# Spec: Hide the period picker and the view switches on every page

**Status:** ready-for-agent
**Owner:** claude

## Problem Statement
Each page stacks a header, a period picker, view switches and filters above its table. Only the filters can be hidden today (the filter icon), so on a small window or when the owner just wants to read the table, the controls take most of the screen.

## Solution
Two new icons sit in the header before the existing filter icon: one hides the period picker (the Daily / Weekly / … bar, the Accounts tabs, Monitoring's Monthly … Annually bar) and one hides the other view switches (Table | Cards | Wallet, Default | Custom, Annual Table | Chart). With both and the filter icon off, only the header title and the table remain. Hidden controls keep working: the chosen period, view and budget source stay in effect. Each page remembers what the owner hid and starts with everything shown.

## User Stories
1. As the owner, I want an icon that hides the period picker, so that I can reclaim the space.
2. As the owner, I want an icon that hides the view switches (Cards, Wallet, Default, Custom, Table, Chart), so that the page shows only what I need.
3. As the owner, I want the header icons in the order Period, Views, Filters, Search, New, so that they sit together.
4. As the owner, I want the icons highlighted while their controls are shown, like the filter icon, so that their state is obvious.
5. As the owner, I want hidden controls to keep applying (my chosen period, view and budget source), so that hiding never changes my numbers.
6. As the owner, I want the top date bar to stay as it is, so that I can still step the period when the picker is hidden.
7. As the owner, I want each page to remember what I hid after a restart, so that I do not redo it.
8. As the owner, I want everything shown by default, so that nothing changes until I choose.
9. As the owner, I want the same two icons on Income, Expense, Transfer, CC Payment, Alkansya, Borrowings, Receivables, Accounts and Monitoring, so that every page behaves the same.
10. As the owner, I want the views icon only on pages that have such a switch, so that I never see an icon that does nothing.
11. As the owner, I want it to look right in light and dark themes.

## Implementation Decisions
- **One shared piece:** two header toggle icons built like the existing filter toggle (same style and highlighted-when-shown state), a calendar icon for the period picker and a layout icon for the view switches, both with the labels "Hide period picker" / "Show period picker" and "Hide view switches" / "Show view switches" (accessible names), and no keyboard shortcut for now.
- **Saved state:** one per-page record in the saved UI settings (period hidden, views hidden), defaulting to shown, tolerant of older settings; read and written through the existing UI settings plumbing.
- **Header order:** Period, Views, Filters, Search, then the New button, on every page that has a New button or a filter icon.
- **Scope per page:** the period toggle hides the page's period or scope bar (including Expense's extra status views, which live in the same bar, and Accounts' All Accounts / Accounts / Credit Accounts tabs). The views toggle hides Table | Cards | Wallet (Accounts), Default | Custom (Monitoring) and the Annual Table | Chart switch (Income and Expense when Annually is chosen). A page with no such switch shows no views icon.
- **Not hidden:** the top date bar, the table, the header title and Add/New actions.
- **Hidden controls still apply:** the selected period, view mode and budget source stay in effect while their controls are hidden.

## Testing Decisions
Proposed seams: (1) the shared toggle component and the saved per-page state (defaults, round trip, unknown values); (2) each page through React Testing Library (icons present in order, hiding removes the bar and keeps its effect, remembered after reload); (3) one end-to-end run (Playwright, separate from `npm test`) hiding the controls on one page. Tests assert what the owner sees (which controls are present, which records or figures are shown), never CSS classes.

## Inputs
- The existing filter toggle on Income, Expense, Workflow and Accounts (the pattern)
- docs/adr/0012-fixed-calendar-quarters-and-halves.md (the period picker)

## Out of Scope
- Keyboard shortcuts for the new icons.
- Hiding the top date bar, the table, the title, or action buttons.
- Showing the active view's name next to the title when the period bar is hidden (can be added if wanted).
