# Feature: Monthly budget snapshots (saved budgets)

Status: Superseded by `tickets/monthly-budget/` (spec and tickets 01 to 05). Kept for history only; do not work from this file.
Requested: 2026-11-16
Spec: [wiki/desktop/monthly-budget-snapshots.md](../../wiki/desktop/monthly-budget-snapshots.md)

## Summary

Monitoring judges past months against today's Notion category budgets, so changing a budget rewrites history. Add a local-only, per-month copy of category budgets, a Notion | Saved budget source toggle on Monitoring that works in all four view modes, and CSV import/export for those budgets.

## Scope

- New local table `monthly_budget_snapshots` (migration `0015`), one row per month and category. No Notion changes and no sync.
- Budget source toggle on Monitoring (default Notion, so current numbers do not change), with a coverage badge.
- Save budgets for a month from today's Notion budgets, and edit them in a modal.
- Saved-mode budgets in Monthly, Quarterly, Semi-Annually and Annually views, summed per month.
- CSV export (saved budgets and a prefilled template) and CSV import with a preview and an atomic commit.
- Backup counts, activity log entries, and optional chat read parity.

## Out of scope

- Notion schema or sync changes.
- Stored income or expense totals.
- Custom date ranges per saved budget.
- Changing the Quarterly length (currently 4 months).

## Phases

1. Migration, repository functions, shared `resolveBudgets`, IPC for list/save/replace/delete, settings key, unit tests.
2. Monitoring toggle, badges, Save and Edit actions, resolved budgets in all view modes.
3. CSV export and import (preview, conflict policy, atomic commit).
4. Backup counts, activity log, chat read parity, docs and changelog.

## Acceptance criteria

See section 13 of the spec. Headline checks:

- With the source set to Notion, Monitoring matches the current release in all four view modes.
- Changing a Notion budget after saving a month leaves that month's Saved-mode numbers unchanged.
- CSV export then import round-trips identically.
- Sync, re-pull and discard-unsynced never change saved rows.

## Open questions

1. Keep Quarterly at 4 months, or change it to 3 in a separate change?
2. Include auxiliary expense categories (such as Pasabuy) in Edit budgets and exports?
3. Is Overwrite matching rows or Skip existing months enough for import, or is a replace-whole-month option needed?
4. Wording and extra warning when deleting the current month's saved set.

## Notes

- A full local database reset removes saved budgets; the reset confirmation should point to export first.
- Saved budgets do not sync between devices; export and import is the way to move them.
