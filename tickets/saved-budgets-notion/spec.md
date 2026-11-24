# Spec: Saved Budgets Notion mirror

**Status:** ready-for-agent
**Owner:** work-w-chrstnrpj

## Problem Statement

Saved budgets exist only on one computer (ADR-0006). The owner cannot see or edit them in Notion, and loses them if the computer or the database file is lost. Backups and CSV export help, but they are manual.

## Solution

An optional, off-by-default Settings toggle mirrors saved budgets to a dedicated Notion database, the **Saved Budgets database**. One row per **budget period**, one Number column per expense category. The app creates the database, keeps its columns in step with the expense categories, pushes monthly rows, and pulls edits made in Notion. Local SQLite stays the source of truth. Decision record: [ADR-0008](../../docs/adr/0008-saved-budgets-optional-notion-mirror.md).

## User Stories

1. As a user, I want to switch the Notion mirror on in Settings, so that my saved budgets are also in Notion.
2. As a user, I want it off by default, so that nothing changes for me until I choose it.
3. As a user, I want to pick the Notion parent page for the new database, so that it lands where I want.
4. As a user, I want the app to create "Notable Finance: Saved Budgets" for me, so that I do not build it by hand.
5. As a user, I want the app to reuse an existing database with that title under my parent page, so that reinstalling or switching devices never makes a duplicate.
6. As a user, I want only one such database per user, so that there is no confusion about where my budgets are.
7. As a user, I want each row titled by period (`Jan 2025`), so that I can read it in Notion.
8. As a user, I want one Number column per expense category, so that I can edit budgets in Notion like a grid.
9. As a user, I want the app to notice a missing category column and add it, so that a new category never breaks the mirror.
10. As a user, I want auxiliary categories left out, so that Monitoring and Notion list the same categories.
11. As a user, I want a renamed category to get a new column without anything being deleted, so that old data is never lost.
12. As a user, I want columns that match no category ignored, so that my own extra columns are safe.
13. As a user, I want a confirmation with counts before the first backfill, so that I know what will be written.
14. As a user, I want existing saved months pushed once on first enable, so that Notion starts complete.
15. As a user, I want edits to a month in Notion to arrive locally on the next sync, so that both places agree.
16. As a user, I want quarter, half and year rows (`Q1 2024`, `H1 2025`, `2026`) I add by hand accepted, split evenly across their months, so that I can seed old history quickly.
17. As a user, I want those split rows to fill only months with no saved budget, so that they never overwrite what I saved.
18. As a user, I want those imported rows never re-pushed in another shape, so that my hand-made rows are not rewritten.
19. As a user, I want the newest edit to win per month and category, so that sync needs no manual resolving.
20. As a user, I want an overwritten value logged in activity, so that I can see what changed and recover it.
21. As a user, I want archiving or deleting a Notion row never to delete local data, so that a mistake in Notion is not destructive.
22. As a user, I want a clear "database missing, recreate?" message if it is deleted in Notion, so that nothing is recreated silently.
23. As a user, I want to turn the toggle off and keep both the Notion database and local data, so that switching off is safe.
24. As a user, I want sync reset, discard-unsynced and Notion re-pull never to wipe my local saved budgets, so that this stays safe.
25. As a user, I want the feature to work with my own Notion workspace and token, so that it stays bring-your-own-Notion.
26. As a user, I want failures (no token, no access to the parent page, rate limits) shown as plain messages, so that I know what to fix.

## Implementation Decisions

- **Notion client:** gains two calls, create a database under a page and add or update columns on it (the client has neither today). Both must work with the data-source model already used by `resolveDataSourceId` and `getDataSourceSchema`.
- **Mapping:** the Saved Budgets database id and the parent page id are stored in the mapping (`app_settings`), next to `monthlyMonitoring`, never hardcoded. The id is tied to the connected workspace; a token change triggers the search-before-create step.
- **Settings:** one toggle plus a parent-page picker in the Notion settings area, backed by the existing settings store. Default off. State shown: off, on, database missing.
- **Sync step:** a separate step run after normal sync, outside the record sync engine (saved budgets stay a non-sync table, per ADR-0006's local-table rule). Order: ensure database, ensure columns, push changed monthly rows, pull newer Notion rows. Skipped entirely when the toggle is off or Notion is unmapped or offline.
- **Conflict rule:** per month and category, compare Notion `last_edited_time` with the local `updated_at`; the newer wins; the overwritten value is written to the activity log.
- **Period parsing:** titles accepted on pull: month (`Jan 2025`), quarter (`Q1 2024`), half (`H1 2025`), year (`2026`). Anything else is skipped with a logged reason. Non-month rows are split evenly (2 decimals, rounding remainder to the last month) and only fill months with no saved budget.
- **Backfill:** first enable shows a confirm with counts (months, categories), then pushes all months once.
- **Docs:** update `wiki/desktop/monthly-budget-snapshots.md` and `wiki/desktop/local-data-schema.md`, which currently say "no Notion mirror"; add a Notion field-mapping entry. Chat parity is not needed unless a chat tool already exposes saved budgets.
- **Schema:** no change to `monthly_budget_snapshots`. Mirror bookkeeping (last pushed time per month) may need a small settings entry, but not a new sync table.
- **Terms and ADRs:** uses **Saved budget**, **Budget period** and **Saved Budgets database** from `GLOSSARY.md`; ADR-0008 supersedes ADR-0006; ADR-0001 (local source of truth) and ADR-0003 (Notion as mirror) still apply.

## Testing Decisions

Proposed seams (to confirm):

1. **Period parser and splitter**, a pure function: label in, months and amounts out. Highest value, cheapest to test.
2. **Mirror sync step** at its function boundary with a faked `NotionClient`: ensure database, add missing column, push changed rows, pull newer rows, newest-wins and logging, archive does not delete, toggle off skips everything.
3. **IPC and settings** for the toggle, parent page and status states.
4. **One renderer test** for the Settings toggle and the backfill confirm.
5. **One Playwright e2e** for toggle-on against a fake Notion server, run separately because `npm test` does not include e2e.

Good tests here check behavior through those interfaces, not internals. Prior art: `monitoring-budgets.test.tsx`, the saved-budgets data-layer tests from `monthly-budget/02`, and the Notion client fakes used by the sync tests.

## Inputs

`wiki/desktop/monthly-budget-snapshots.md`, `wiki/shared/notion-field-mapping.md`. No `docs/inputs` documents.

## Out of Scope

- Native storage of quarter, half or year budgets locally.
- A three-way merge or the Conflict screen for budgets.
- Deleting or renaming Notion columns.
- Mirroring anything else (Monitoring split, categories, records).
- Mobile.
- Changing how Monitoring resolves its Budget source.

## Further Notes

- Because this reverses ADR-0006, the reset confirmation and export hints should stay accurate: with the mirror off, export is still the way to protect saved budgets.
- Items 1 and 2 of the original request (table surface and column widths) are separate tickets, not part of this spec.
