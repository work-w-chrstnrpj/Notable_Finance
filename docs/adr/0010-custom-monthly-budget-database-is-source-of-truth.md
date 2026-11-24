# ADR-0010: The Custom monthly budget database in Notion is the source of truth

**Status:** accepted
**Date:** 2026-11-25
**Ticket:** custom-budget/01, custom-budget/02, custom-budget/03, custom-budget/04
**Input:** grill session of 2026-11-25
**Supersedes:** ADR-0008 and ADR-0009 where they make local SQLite the source of truth for saved budgets and add a newest-edit-wins mirror (ADR-0009's "the user creates the database and saves its ID" stays)

## Context

Saved budgets started local-only (ADR-0006), then got an optional Notion mirror with newest-edit-wins (ADR-0008, ADR-0009). The owner created their own database in Notion (`Saved Budget '24-'26`) and wants to edit budgets there, not inside the app. Two sources that both accept edits are confusing, and "Notion" versus "Saved" in Monitoring no longer describes the choice: both now come from Notion.

## Decision

The user's **Custom monthly budget database** in Notion is the only place saved budgets are edited. Its ID is saved in Notion Configuration (ADR-0009).

- **Monitoring toggle:** **Default** uses each expense category's own monthly budget from the Expense Categories database. **Custom** uses the Custom monthly budget database. Custom is disabled until a database ID is saved. The stored setting values are renamed to match (`default`, `custom`), and a stored `notion` becomes `default` and a stored `saved` becomes `custom`.
- **Local copy:** the app keeps a read-only cache of the Custom database in SQLite (the existing `monthly_budget_snapshots` table), refreshed on each sync, so Monitoring works offline. The cache is never edited in the app and is replaced from Notion on every pull.
- **No in-app editing:** "Save budgets from Notion", editing, replacing or deleting a month's set, CSV import and the mirror on/off switch are removed. CSV export stays as a read-only copy. The Settings area shows the database status, the missing-column list and the "Add missing columns" button.
- **One-time migration, then removed:** the first time a database ID is saved, local saved months that have no row in the Custom database are pushed to it as `Jan 2025` rows. A Notion row is never overwritten. If any push fails the local data is kept and nothing is removed; the cache is replaced from Notion only after the migration succeeds. The migration was temporary: on 2026-11-24 the owner confirmed their budgets are in Notion and the code that sends budgets to Notion was deleted (`custom-budget/04`). The app only ever reads the Custom database from then on.
- **After migration Notion always wins.** The newest-edit-wins rule and the overwritten-values list are removed.
- **Which row applies to a month:** the most specific row wins: month, then quarter, then half, then year. Quarter, half and year rows are split evenly across their months. A month with no row in the Custom database uses the Default budget.

## Alternatives

- Keep local editing with newest-edit-wins (ADR-0008/0009): two places to edit and a rule users must learn.
- Fetch Notion live with no local cache: simplest, but Custom would not work offline, against ADR-0001.
- Delete local data right after the first push: risks data loss if the push is incomplete.

## Consequences

- Budget history is now in the user's Notion. Losing access to the Custom database means Monitoring falls back to Default for months with no cached row until the next successful pull.
- After `custom-budget/04` the app has no way to write to the Custom database except adding missing category columns. The cache table stays, so backups still include it; it is overwritten by the next pull after a restore.
- ADR-0001 still holds for records; for this one dataset Notion is the editable source and SQLite is a cache.
- Docs, the monitoring toggle labels, tests and chat parity that mention "Saved" or local editing must be updated when this ships.
