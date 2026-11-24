# Spec: One calendar period picker, with fixed quarters and halves

**Status:** ready-for-agent
**Owner:** claude

## Problem Statement
Each page offers a different list of periods. Income and the workflow pages have no quarter or half, and Monitoring's Quarterly and Semi-Annually windows start at whatever month is selected and run 4 and 6 months, so they are not real quarters or halves and never line up with the quarter and half rows in the Custom monthly budget database.

## Solution
Every page with a period picker offers Daily, Weekly, Monthly, Quarterly, Semi-Annually, Annually and All Records, in that order (Expense keeps its extra status views after them). Monitoring keeps its own four (Monthly, Quarterly, Semi-Annually, Annually). Quarters and halves are fixed calendar periods (ADR-0012): Q1 Jan to Mar, Q2 Apr to Jun, Q3 Jul to Sep, Q4 Oct to Dec; H1 Jan to Jun, H2 Jul to Dec. The date selector shows "Q4 2026 · Oct – Dec" or "H2 2026 · Jul – Dec" and its arrows step one whole quarter or half.

## User Stories
1. As the owner, I want the same period options on Income, Expense, Transfer, CC Payment, Alkansya, Borrowings and Receivables, so that every page works the same way.
2. As the owner, I want Quarterly to show a real calendar quarter (Q1 Jan to Mar and so on), so that the numbers mean what the label says.
3. As the owner, I want Semi-Annually to show H1 (Jan to Jun) or H2 (Jul to Dec), so that halves are predictable.
4. As the owner, I want switching to Quarterly or Semi-Annually to show the period containing the date I am on, so that November shows Q4 and H2.
5. As the owner, I want the arrows to step one whole quarter or half, so that I can walk through the year.
6. As the owner, I want the selector to read "Q4 2026 · Oct – Dec", so that I always know the exact months.
7. As the owner, I want Expense to keep Pasabuy, CC Transaction, To pay, To buy, Installments and Unpaid CC after the seven periods, so that I lose nothing.
8. As the owner, I want Monitoring to keep Monthly, Quarterly, Semi-Annually and Annually, so that budgets are only compared over meaningful periods.
9. As the owner, I want Monitoring's quarter and half figures to cover exactly the calendar period, so that they match the quarter and half rows I keep in the Custom monthly budget database.
10. As the owner, I want my remembered period choice on each page to keep working after the update, so that nothing resets unexpectedly.
11. As the owner, I want Weekly to stay Monday to Sunday, so that nothing else about the periods changes.
12. As the owner, I want All Records to still mean no date limit, so that it stays the way to see everything.

## Implementation Decisions
- **One shared period module** (the date-range library) gains two units, quarter and half, with their range, step, label (with the month-range hint) and the period-containing-a-date rule; every picker and page uses it. Weeks stay Monday to Sunday.
- **View-mode types** for Income, the workflow pages and Expense gain Quarterly and Semi-Annually (Expense's extra status views are unchanged and stay after the seven). Monitoring's type is unchanged.
- **Saved settings:** stored view modes keep working; the settings coercion accepts the two new values and falls back to Monthly for anything unknown.
- **Pages:** Income, Expense, and the five workflow pages (Transfer, CC Payment, Alkansya, Borrowings, Receivables) show the seven options as one segmented picker in this order. Dashboard stays on one month. Accounts has no period.
- **Monitoring:** its own range and label code is replaced by the shared module; Quarterly and Semi-Annually become fixed calendar periods; the bug where Quarterly spans 4 months disappears. Budget resolution (ADR-0010) is unchanged; a `Q4 2026` or `H2 2026` row now matches the period on screen.
- **Selector label:** "Q4 2026 · Oct – Dec", "H2 2026 · Jul – Dec"; existing labels unchanged.
- **ADRs:** ADR-0010, ADR-0012. Glossary: Calendar period.

## Testing Decisions
Proposed seams:
1. **The shared period module as pure functions:** range, step, label and period-containing-a-date for every unit, including year boundaries and leap years.
2. **The date selector component:** shows the new labels and steps by whole quarters and halves.
3. **Each page through React Testing Library:** the seven options in order (Expense plus its extras), the chosen period filters the records, a remembered choice restores.
4. **Saved-settings coercion** in the main-process settings module: new values accepted, unknown values fall back.
5. **Monitoring through React Testing Library:** Quarterly and Semi-Annually cover the fixed calendar range and the budget comparison uses it.
6. **One end-to-end run (Playwright, separate from `npm test`):** switch to Quarterly on Income and on Monitoring and see the Q label and range.

Good tests assert what the owner sees (labels, which records are listed, which range the figures cover), never CSS classes. Prior art: `date-range.test.ts`, `finance-rules.test.ts`, `search-toggle.test.tsx`, `monitoring-budgets.test.tsx`.

## Inputs
- docs/adr/0012-fixed-calendar-quarters-and-halves.md
- docs/adr/0010-custom-monthly-budget-database-is-source-of-truth.md
- GLOSSARY.md: Calendar period, Budget period

## Out of Scope
- Fiscal years that start in another month.
- A Daily, Weekly or All Records view in Monitoring.
- Changing the Dashboard, which stays on one month.
- Changing how the Custom monthly budget database rows are parsed or split.

## Further Notes
- Monitoring's Quarterly and Semi-Annually numbers will change for existing data (they now cover whole calendar periods); say so in the release notes.
