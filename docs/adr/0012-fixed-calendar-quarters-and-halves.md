# ADR-0012: Quarters and halves are fixed calendar periods in every period picker

**Status:** accepted
**Date:** 2026-11-24
**Ticket:** none yet (decided in a grill session; tickets follow)
**Input:** grill session of 2026-11-24
**Supersedes:** None (replaces the floating Quarterly and Semi-Annually windows in Monitoring, which no earlier ADR recorded)

## Context

Monitoring's Quarterly and Semi-Annually views started at the month the user had selected and ran forward (4 and 6 months), so "Quarterly" was not a quarter and numbers did not line up with the `Q1 2024` and `H1 2025` rows of the Custom monthly budget database (ADR-0010). Income, Expense and the workflow pages had no quarter or half at all, and each page offered a different list of periods.

## Decision

Every page with a calendar period picker offers the same periods: **Daily, Weekly, Monthly, Quarterly, Semi-Annually, Annually and All Records**. Expense keeps its extra status views (CC Transaction, Pasabuy, To pay, To buy, Installments, Unpaid CC) after these. Monitoring keeps its own four (Monthly, Quarterly, Semi-Annually, Annually), since a budget has no daily or weekly meaning.

Quarters and halves are fixed to the calendar year: Q1 is January to March, Q2 April to June, Q3 July to September, Q4 October to December. H1 is January to June and H2 is July to December. Weeks stay Monday to Sunday. Choosing a period shows the one that contains the date the user is on (in November, Quarterly shows Q4 and Semi-Annually shows H2), and the arrows step by one whole period.

## Alternatives

- Keep floating windows from the selected month (today's Monitoring): the numbers depend on which month you happened to pick and never match the budget periods.
- Fiscal years starting in another month: no need today, and it would break the `Q1`/`H1` budget labels.

## Consequences

- Monitoring's Quarterly and Semi-Annually figures change for existing users: they now cover a whole calendar quarter or half, not 4 or 6 months from the picked month.
- A `Q4 2026` or `H2 2026` row in the Custom monthly budget database matches the period on screen exactly (ADR-0010's "most specific row wins" still applies).
- One shared period module must serve every page, so the pickers cannot drift apart again.
- Remembered view choices stay valid; the new modes are additions.
