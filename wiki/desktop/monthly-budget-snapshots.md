# Monthly budget snapshots (saved budgets)

Status: **specification with decisions settled on 2026-11-16 (section 16), not implemented.** Desktop-only, local-only feature. Tickets: `tickets/monthly-budget/`. Decision record: [ADR-0006](../../docs/adr/0006-saved-budgets-local-only.md). It adds no Notion property, no Notion database change and no sync behavior.

## 1. Problem

Monitoring compares spending to each expense category's *current* `monthlyBudget` (from Notion). Budgets change over time, so a past month is judged against today's budget instead of the budget that applied then. Example: Food was ₱5,000 until May and ₱8,000 from June; January currently shows "remaining" against ₱8,000.

## 2. Goal and non-goals

Goal: let the user keep a per-month copy of category budgets in the local database and choose, on Monitoring, whether to use Notion's current budgets or the saved ones, in every view mode (Monthly, Quarterly, Semi-Annually, Annually). Saved budgets can be edited in the app and imported/exported as CSV.

Non-goals:

- No Notion schema changes, no new Notion database, no push or pull of saved budgets.
- No stored income/expense totals. Totals and spending stay computed from records.
- No free-form date ranges per saved budget. One saved set per calendar month.
- No change to existing Monitoring behavior while the source is **Notion** (the default).
- No change to the Need/Wants/Savings split, which is still read from the Notion "Total Monthly Monitoring" row and applies the current values to every month. There is no per-month split.

## 3. Terms

| Term | Meaning |
| --- | --- |
| Notion budget | `expense_categories.monthly_budget`, as pulled from Notion. Editable only in Notion. |
| Saved budget | A row in `monthly_budget_snapshots` for one month and one category. Editable only in the app. The UI says "Saved budgets"; `monthly_budget_snapshots` is only the internal table name. |
| Saved set | All saved budget rows for one month. A month "has a saved set" when it has at least one row. |
| Budget source | The Monitoring toggle: `notion` or `saved`. |

## 4. Local data model

New migration `0015_monthly_budget_snapshots.sql` (additive, drizzle journal entry `0015`). New table, local only:

```text
monthly_budget_snapshots
  id             text primary key        -- local UUID
  month          text not null           -- 'YYYY-MM'
  category_id    text not null           -- expense_categories.id (local id)
  category_name  text not null           -- name at the time it was saved
  budget         real not null           -- >= 0, finite
  created_at     integer not null        -- ms
  updated_at     integer not null        -- ms
  unique (month, category_id)
  index on (month)
```

Rules:

- Not a sync table: no `notion_page_id`, `sync_state`, `base_snapshot`, or `deleted` columns. Deleting a saved set is a hard delete.
- `category_name` is stored so a renamed or removed category still shows its old name in old months. The live name is used when the category still exists.
- Rows for a category that no longer exists in `expense_categories` are kept and still counted in totals.
- No foreign key to `expense_categories`, because reference caches are replaced on pull.
- Validation (`domain/validation.ts`): `month` matches `YYYY-MM` with month 01–12; `budget` is a finite number ≥ 0, rounded to 2 decimals.
- Sync reset, discard-unsynced and Notion re-pull must not touch this table. Implementation must verify each of those code paths. A full local database reset still removes it; the reset confirmation should mention exporting saved budgets first.

## 5. Budget resolution (the one rule that matters)

A pure function in `src/shared/` (same pattern as `notion-formulas.ts`) so the renderer and main process compute identical numbers:

```text
resolveBudgets({ months, categories, snapshots, source }) ->
  {
    perCategory: [{ categoryId, name, budget }],
    total,
    monthsCovered,        // months in range that have a saved set
    monthsInRange
  }
```

Month list = every calendar month in the Monitoring range (section 7).

**source = notion** (unchanged behavior): `budget = category.monthlyBudget × monthsInRange`.

**source = saved**: for each month in the range:

1. The month has a saved set: each category's budget for that month is its saved row, or **0** if it has no row (the category did not exist or was not budgeted then).
2. The month has no saved set: fall back to each category's Notion budget for that month.

The period budget for a category is the sum over the months. Spending is always actual and is never scaled, as today. Remaining = period budget − spending.

Categories shown: the union of current categories and categories that appear in any in-range saved row.

## 6. Monitoring UI

### 6.1 Budget source toggle

Segmented control **Budget source: Notion | Saved** in the Monitoring header, beside the view-mode control. The choice is persisted in UI settings (`settings/ui.ts`, new key `monitoringBudgetSource`, default `notion`, validated to those two values).

### 6.2 Status badge

Shown next to the range label:

| State | Badge |
| --- | --- |
| Source = Notion | "Notion budgets" |
| Source = Saved, every month in range has a saved set | "Saved budgets" |
| Source = Saved, some months have sets | "Saved budgets: 3 of 4 months (rest use Notion)" |
| Source = Saved, none have sets | "No saved budgets, using Notion budgets" |

### 6.3 Actions (visible only when source = Saved)

- **Save budgets for this month**: copies today's Notion budgets for every expense category into the saved set of a chosen month (defaults to the anchor month). Allowed for any month, past, current or future. If the month already has a saved set, ask "Replace the saved budgets for <Month Year>?" before writing.
- **Edit budgets**: opens a modal with a month picker (defaults to the anchor month, limited to months in the current range) and one row per category: name, saved budget input, and the current Notion budget as a muted reference. Buttons: **Fill from Notion**, **Delete saved budgets for this month**, **Save**, **Cancel**. Save writes the whole set in one transaction. Inputs follow existing form validation (error text, shake on invalid).
- **Import / Export**: section 8.

### 6.4 Differs-from-Notion hint

In Saved mode, a category row whose period budget differs from `monthlyBudget × months` shows the Notion figure as a small muted line.

### 6.5 Zero filters and summaries

The existing zero filters (`hide-both`, `hide-budget`, `hide-spending`) and the budget, spending and remaining totals use the resolved budgets instead of `monthlyBudget × periodMultiplier`. Income cards and the Need/Wants/Savings split are unchanged.

## 7. View modes

The existing range logic in `monitoring.tsx` (`computeMonitoringRange`) is kept as is. Only the budget calculation changes.

| View mode | Months in range (from the selected month) |
| --- | --- |
| Monthly | The selected month (1) |
| Quarterly | The selected month plus the next 3 (4 months, existing behavior) |
| Semi-Annually | The selected month plus the next 5 (6 months) |
| Annually | January to December of the selected year (12) |

`periodMultiplier` is replaced by the month list. In Notion mode the result is identical to today. Note: "Quarterly" is currently 4 months, not 3. That is existing behavior and out of scope here; see Open questions.

## 8. CSV import and export

### 8.1 Format

UTF-8 with BOM (so Excel opens it correctly), CRLF line endings, RFC 4180 quoting. One header row, long format:

```csv
Month,Category,Budget
2026-01,Food,5000
2026-01,Transport,2000
2026-02,Food,5000
```

- `Month`: `YYYY-MM` (a full `YYYY-MM-DD` date is also accepted and truncated to its month).
- `Category`: the expense category name. Matched against current categories by trimmed, case-insensitive name. If two categories share a name the row is an error. If no current category matches, the row falls back to a saved row of the same `category_name` for that month, otherwise it is an error.
- `Budget`: a number. `₱`, spaces and thousands commas are tolerated on import (`₱5,000.00` is read as 5000). Negative, empty or non-numeric values are errors.
- Header names are matched case-insensitively. Extra columns are ignored. Row order is irrelevant.

### 8.2 Export

Entry points (in the Monitoring budget actions menu):

1. **Export saved budgets**: all saved rows, or only months in the current range (user chooses). Sorted by month, then category. File name `notable-finance-budgets-YYYY-MM-DD.csv`, saved via the system save dialog (main process, like database backup).
2. **Export budget template**: for a chosen month range, one row per month and category prefilled with today's Notion budgets. Meant for backfilling in a spreadsheet and importing back.

### 8.3 Import

Flow: choose file, validate in main, show a preview, confirm, commit.

- **Preview** counts rows as new, changed, unchanged, or invalid, with a table of invalid rows and the reason (unknown category, ambiguous name, bad month, bad budget, duplicate month and category within the file; the last occurrence wins and the earlier one is flagged).
- **Conflict policy** for months that already have a saved set, chosen in the preview: **Overwrite matching rows** (default; rows not in the file stay) or **Skip months that already have saved budgets**. There is no "replace the whole month" policy in v1; use Delete in Edit budgets for that.
- Invalid rows are skipped and listed; the user can still import the valid rows. Import is disabled when there are no valid rows.
- Commit is a single SQLite transaction. Either all valid rows are written or none.
- Import never creates categories and never writes to Notion.
- A file over 5 MB or over 20,000 rows is rejected with a message.

## 9. IPC and process boundaries

Main owns data and side effects; the renderer only calls the allow-listed `window.api`. New channels in `shared/ipc-channels.ts` (names indicative):

| Channel | Purpose |
| --- | --- |
| `budgets:list` | Saved rows for a month range |
| `budgets:saveFromNotion` | Copy current Notion budgets into a month's set (with replace flag) |
| `budgets:saveSet` | Replace one month's set with the edited rows |
| `budgets:deleteSet` | Delete one month's set |
| `budgets:exportCsv` | Write saved budgets or a template to a file chosen via save dialog |
| `budgets:importPreview` | Open a file via dialog, parse, validate, return the preview |
| `budgets:importCommit` | Commit a previewed import with the chosen conflict policy |

All results use the existing `ApiResult` envelope. DTOs live in `shared/finance.types.ts`. File paths and dialogs stay in main. The preview holds the parsed rows in main between preview and commit, keyed by an id, so the renderer never sends raw rows back.

## 10. Backup, history and chat

- **Backup**: the SQLite backup already copies the whole file, so the table is included. Add `monthly_budget_snapshots` to `COUNTED_TABLES` in `services/backup.ts`. An older backup without the table must restore cleanly (additive migration creates it).
- **Activity log**: record save, edit, delete and import as activity entries (counts only, no row dumps).
- **Chat**: deferred to the last phase (decided 2026-11-16). The chat read tool that reports budgets (`chat/tools/read-tools.ts`) and `reports.monitoring` get an optional budget-source argument that defaults to `notion`, so existing answers do not change. Write tools for saved budgets are not added.

## 11. Edge cases

- Month with a saved set where a new category was added later: the new category has budget 0 for that month (section 5).
- Category deleted or renamed in Notion after saving: the saved row keeps its stored name and still counts.
- All saved rows for a month deleted: the month goes back to "no saved set" and falls back to Notion budgets.
- Deleting a saved set asks a normal confirm ("Delete saved budgets for <Month Year>?") for every month, including the current one. No extra warning.
- Saved budget of 0: a valid explicit zero, distinct from "no row".
- Month in the future: allowed to save.
- Range crosses a year boundary: month list is built with calendar arithmetic, not string math.
- Import file with a month that has no spending: still imported.
- Offline or no Notion token: feature works fully; it depends only on local data.
- Two devices: saved budgets do not sync. Use export and import to move them.

## 12. Backward compatibility

- Default source is Notion, which reproduces today's numbers exactly.
- A user who never saves a set sees only the new toggle (and the "No saved budgets" badge if they switch it on).
- Downgrading the app leaves an unknown table that older versions ignore.

## 13. Acceptance criteria

1. With source = Notion, Monitoring numbers are identical to the current release in all four view modes.
2. Saving budgets for January 2026 and then changing Food's Notion budget leaves January's Saved-mode remaining unchanged and Notion-mode remaining updated.
3. In Saved mode, an Annually view with Food saved at 5,000 for 5 months and 8,000 for 7 months shows a Food budget of 81,000.
4. In Saved mode, a range with a missing month shows the partial-coverage badge and uses Notion budgets for that month only.
5. A category absent from a month's saved set shows budget 0 for that month.
6. Edit budgets saves atomically; invalid input blocks save and shows error text.
7. Export then import into an empty set reproduces identical rows (round trip). The template export imports without errors.
8. Import preview reports unknown categories, ambiguous names, bad months and bad budgets; valid rows still import; the commit is atomic.
9. Sync, Notion re-pull and discard-unsynced never change or delete saved rows.
10. A database backup then restore preserves saved rows; restoring a pre-feature backup works and shows no saved sets.
11. The budget-source choice persists across restarts.
12. No Notion API call is made by any budget-snapshot action.

## 14. Test plan

- Vitest (main): migration SQL in an isolated SQLite; save, replace, delete; unique constraint; validation; CSV parse and format round trip; quoting of names containing commas and quotes; BOM; preview classification; atomic commit rollback on error; sync reset and discard leave the table intact; backup restore.
- Vitest (shared): `resolveBudgets` for all four modes, partial coverage, new category, removed category, year boundary, explicit zero.
- Renderer (React Testing Library): toggle and persistence, badges, Edit budgets modal validation, replace confirmation, import preview states.
- Playwright (separate from `npm test`): switch source, save budgets, edit one, export, import, and confirm Monitoring figures. Update any existing e2e that asserts Monitoring text.

## 15. Rollout phases

1. Migration, repository functions, `resolveBudgets`, IPC `list/saveFromNotion/saveSet/deleteSet`, settings key. Unit tests.
2. Monitoring toggle, badges, Save and Edit actions, resolved-budget wiring across all view modes.
3. CSV export (saved and template), import preview and commit.
4. Backup counts, activity log, chat read parity, docs and changelog.

Docs to update when implementing: `wiki/desktop/local-data-schema.md`, `wiki/desktop/ipc-contract.md`, `wiki/shared/product-specification.md`, `notable-finance-app/CHANGELOG.md`, and the repository map in `AGENTS.md` if structure changes.

## 16. Decisions (resolved 2026-11-16)

Settled while grilling the feature. No open questions remain.

1. **UI name:** "Saved budgets". The table stays `monthly_budget_snapshots` internally.
2. **Quarterly length:** stays 4 months (and Semi-Annually 6). Changing Quarterly to 3 months is a separate ticket, because it would alter Notion-mode numbers.
3. **Categories:** Edit budgets and CSV use the same category list Monitoring shows, including auxiliary ones such as Pasabuy.
4. **CSV import:** overwrite matching rows by default, with a "Skip months that already have saved budgets" option. No whole-month replace policy; use Delete in Edit budgets.
5. **Saving a month:** allowed for the current and future months, with a replace confirmation.
6. **Missing categories:** in a month that has a saved set, a category with no row has budget 0.
7. **Delete:** a normal confirm for every month.
8. **Chat:** deferred to the last phase; defaults to Notion budgets.
9. **Split:** the Need/Wants/Savings split stays current-only for every month.
10. **Tickets:** four tickets under `tickets/monthly-budget/`, one per rollout phase in section 15.
11. **Storage:** local only, no Notion mirror ([ADR-0006](../../docs/adr/0006-saved-budgets-local-only.md)).
