# ADR-0006: Saved budgets are local-only, with no Notion mirror

**Status:** accepted
**Date:** 2026-11-16
**Ticket:** monthly-budget/01
**Input:** `wiki/desktop/monthly-budget-snapshots.md` (sections 2 and 16)
**Supersedes:** None

## Context

Monitoring judges a past month against today's Notion category budget, so changing a budget rewrites history. A past month's budget cannot be recomputed from records (see ADR-0004), so it needs its own storage. Notion already holds the live budgets, and the owner considered mirroring the saved ones there too.

## Decision

Saved budgets live only in the local SQLite database (`monthly_budget_snapshots`). They are not pushed to or pulled from Notion, and the Notion schema is unchanged. Monitoring gets a Notion | Saved budget source toggle, and saved budgets move between devices or backups through CSV import and export and the existing database backup.

## Alternatives

- New columns per category on the Notion Monthly Monitoring database: needs a schema change for every new or renamed category and leaves empty columns for old months.
- A text field of budgets on each Notion monthly page: no schema churn, but budgets are not editable cells, and it adds sync work.
- A separate Notion database, one row per month and category: the cleanest in Notion, but a new database to set up, sync and keep consistent.

## Consequences

- No Notion changes and no new sync work, so the feature ships faster and Notion-mode numbers stay identical.
- Saved budgets do not appear in Notion and do not sync between devices; export and import (and database backup) are the way to move or protect them.
- A full local database reset removes them, so the reset confirmation must point to export.
- Sync reset, discard-unsynced and Notion re-pull must never touch the table.
- If a Notion mirror is wanted later, it can be added on top of this table without changing how the app resolves budgets. Revisit then with a superseding ADR.
