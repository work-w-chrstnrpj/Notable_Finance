# ADR-0008: Saved budgets get an optional Notion mirror

**Status:** accepted (partly superseded by ADR-0009: the user creates the database; and by ADR-0010: Notion is the source of truth and local editing is removed)
**Date:** 2026-11-23
**Ticket:** none yet (decided in a grill session; tickets follow)
**Input:** grill session of 2026-11-23
**Supersedes:** ADR-0006

## Context

ADR-0006 kept saved budgets local-only and rejected a separate Notion database to ship faster, noting a mirror could be added later without changing how the app resolves budgets. The owner now wants saved budgets visible and editable in Notion, and recoverable if the computer is lost.

## Decision

Local SQLite (`monthly_budget_snapshots`) stays the source of truth for saved budgets (ADR-0001). Notion gets an optional mirror: one dedicated database, off by default, switched on in Settings.

- **Database:** titled "Notable Finance: Saved Budgets", created by the app under a parent page the user picks. One per user. Its id is stored in the mapping, tied to the connected Notion workspace. Before creating, the app searches for that title under that parent and reuses it. If the stored database is gone or archived, the feature reports it and does not recreate it silently.
- **Rows:** the title is the period label (`Jan 2025`, `2026`, `Q1 2024`, `H1 2025`). Each expense category is a Number column.
- **Missing columns:** before each push the app checks the columns against the current non-auxiliary expense categories and adds missing ones. It never deletes or renames columns; a renamed category becomes a new column. Columns that match no category are ignored.
- **Push:** monthly rows only, titled `Jan 2025`.
- **Pull:** period rows (quarter, half, year) are accepted by splitting amounts evenly across their months, only for months with no saved budget yet. Imported rows are never re-pushed in another shape.
- **Conflicts:** a separate small step after normal sync, not part of the record sync engine. The newest edit wins per month and category (Notion `last_edited_time` against local `updated_at`); the overwritten value is logged in activity. Archiving or deleting a Notion row never deletes local data.
- **First enable:** a one-time backfill of all existing saved months, after a confirmation showing the counts. Turning the toggle off stops sync only; the Notion database and local data stay.

## Alternatives

- Keep ADR-0006 (local only): no Notion work, but no visibility and no protection from losing the computer.
- Native period storage (store quarters and years as such): lossless, but needs a schema change and Monitoring changes.
- Full three-way merge with the Conflict screen: consistent with records, but heavy for a number grid.
- Per-category rows, or a text field on each Monthly Monitoring page: rejected in ADR-0006 and still worse for editing.

## Consequences

- Saved budgets are no longer lost with the computer when the mirror is on.
- `NotionClient` gains create-database and add-column calls, and a Settings toggle.
- Sync reset, discard-unsynced and Notion re-pull still must not wipe the local table. A re-pull of the mirror can only fill months with no saved budget.
- Quarter, half and year rows lose their original period shape once split into months.
- Docs that say "no Notion mirror" (`wiki/desktop/monthly-budget-snapshots.md`, `wiki/desktop/local-data-schema.md`) must be updated when this ships.
