# Spec: Saved budgets for Monthly Monitoring

**Status:** ready-for-agent
**Owner:** claude

## Problem Statement
Monitoring judges every month against each expense category's current Monthly Budget from Notion. When a budget changes, past months are re-judged against the new figure, so history is rewritten. Example: Food was ₱5,000 until May and ₱8,000 from June, yet January shows its remaining against ₱8,000. The user cannot see how they really did against the budget that applied at the time.

## Solution
The user keeps **Saved budgets**: a local-only, per-month copy of each expense category's budget. Monitoring gets a **Budget source** toggle (Notion | Saved). In Saved mode each month is judged against its own saved budgets, and months with no saved budgets fall back to Notion's current budgets, with a badge that says how many months are covered. The user can save the current Notion budgets into a month, edit a month's budgets, and import or export them as CSV. Nothing changes in Notion. With the source on Notion (the default) every number is identical to today.

Full design: `wiki/desktop/monthly-budget-snapshots.md`. Decision record: `docs/adr/0006-saved-budgets-local-only.md`.

## User Stories
1. As a user, I want past months judged against the budget that applied then, so that my history does not change when I change a budget.
2. As a user, I want to switch Monitoring between Notion and Saved budgets, so that I can compare both views.
3. As a user, I want Notion to stay the default source, so that nothing changes until I opt in.
4. As a user, I want my source choice remembered across restarts, so that I do not re-select it every time.
5. As a user, I want to save today's Notion budgets into any month (past, current or future), so that I can freeze them without retyping.
6. As a user, I want to be asked before replacing a month that already has saved budgets, so that I do not overwrite them by accident.
7. As a user, I want to edit a month's saved budgets category by category, with today's Notion budget shown beside each, so that I can correct or backfill them.
8. As a user, I want invalid budget inputs rejected with clear error text, so that I cannot save bad numbers.
9. As a user, I want a "Fill from Notion" button in the editor, so that I can start from current budgets and adjust.
10. As a user, I want to delete a month's saved budgets with a confirmation, so that the month goes back to using Notion budgets.
11. As a user, I want Saved mode to work in Monthly, Quarterly, Semi-Annually and Annually views, so that every range uses the right per-month budgets.
12. As a user, I want a month with no saved budgets to fall back to Notion budgets, so that partial history still gives a full picture.
13. As a user, I want a category missing from a saved month to count as 0 for that month, so that new categories do not distort old months.
14. As a user, I want a badge saying how many months in the range use saved budgets, so that I know which numbers are saved and which are Notion.
15. As a user, I want to see the Notion figure beside a category whose saved period budget differs, so that I notice the change.
16. As a user, I want renamed or removed categories to keep their old name and budget in old months, so that history stays readable.
17. As a user, I want to export my saved budgets (all, or the current range) to CSV, so that I have a copy I can open in Excel.
18. As a user, I want to export a template prefilled with Notion budgets for a range of months, so that I can backfill history in a spreadsheet.
19. As a user, I want to import a CSV of budgets and see a preview of new, changed, unchanged and invalid rows first, so that I know what will happen.
20. As a user, I want invalid rows listed with a reason and skipped, so that one bad row does not block the rest.
21. As a user, I want to choose to overwrite matching rows or skip months that already have saved budgets, so that I control what an import touches.
22. As a user, I want an import to be all-or-nothing, so that a failure never leaves half a file applied.
23. As a user, I want saved budgets included in database backups, and old backups to restore cleanly, so that I do not lose them.
24. As a user, I want sync, Notion re-pull and discard-unsynced to leave saved budgets alone, so that they never vanish.
25. As a user, I want a full local reset to warn me to export saved budgets first, so that I do not lose them unknowingly.
26. As a user, I want the feature to work offline and without a Notion token, so that it never depends on the network.
27. As a user, I want the chat assistant to report budgets on the Notion source by default, so that its answers do not silently change.

## Implementation Decisions
- **Storage:** a new local-only SQLite table of saved budgets, one row per month and expense category, unique on (month, category), with the category name stored at save time. It is not a sync table: no Notion page id, sync state, base snapshot or soft-delete column. Deleting a saved set is a hard delete. Added by an additive migration (`0015`). Recorded in ADR-0006.
- **No Notion changes:** no new property, database or API call; saved budgets are never pushed or pulled (ADR-0006).
- **Derived values stay computed (ADR-0004):** only budgets are stored. Spending, income and remaining are always computed from records.
- **One resolution rule, shared:** a pure function in the shared layer decides each category's budget for a range. Notion source: current budget times months in range. Saved source: per month, use the saved set if the month has one (missing category = 0), otherwise the Notion budget. Both the renderer and the main process use it so numbers match.
- **Categories shown:** the same list Monitoring shows (including auxiliary ones such as Pasabuy), plus any category appearing in an in-range saved row.
- **Validation:** month is `YYYY-MM` with month 01-12; budget is a finite number of at least 0, rounded to 2 decimals.
- **Monitoring UI:** Budget source segmented control beside the view-mode control, stored as a UI setting (`monitoringBudgetSource`, default `notion`). Status badge for coverage. Save, Edit, Delete, Import and Export actions are shown only in Saved mode. Zero filters and budget/spending/remaining totals use resolved budgets. Income cards and the Need/Wants/Savings split are unchanged and stay current-only.
- **View modes:** range logic is unchanged (Quarterly stays 4 months, Semi-Annually 6). Only the budget calculation uses the month list. Changing Quarterly to 3 months is a separate ticket.
- **CSV:** `Month,Category,Budget`, UTF-8 with BOM, CRLF, RFC 4180 quoting; tolerant import of `₱` and thousands commas; categories matched by trimmed, case-insensitive name; limits of 5 MB and 20,000 rows. Import is preview then commit, with the parsed rows held in main between the two steps. Commit is one transaction. Import never creates categories.
- **IPC:** new allow-listed `budgets:*` channels (list, saveFromNotion, saveSet, deleteSet, exportCsv, importPreview, importCommit) using the existing result envelope; DTOs in the shared types. Dialogs and file paths stay in main.
- **Protection:** sync reset, discard-unsynced and Notion re-pull must not touch the table. A full local reset removes it, so its confirmation points to export. Backup counts include the table.
- **Chat (last phase):** the chat read tool and the monitoring report get an optional budget source that defaults to Notion. No chat write tools.
- **Delivery:** four tickets, one per phase: (1) data layer, (2) Monitoring UI, (3) CSV import and export, (4) backup, activity log, chat and docs.

## Testing Decisions
Agreed seams (confirmed 2026-11-18):
1. **Budget resolution** (pure shared function): all four view modes, partial coverage, missing category = 0, removed category, year boundary, explicit zero, Notion source identical to today.
2. **Saved-budgets repository on a temporary SQLite database:** migration, save, replace, delete, unique rule, validation, and sync reset / discard-unsynced / re-pull leaving the table intact. Uses the Electron mock and the skip-if-binding-mismatch pattern from `test/backup.test.ts`.
3. **CSV parse, preview and commit in main:** format, BOM, CRLF, quoting, classification of rows, skip-existing-months option, atomic rollback, and export then import round trip.
4. **One Playwright check on Monitoring:** switch source and see figures change. Playwright runs separately from `npm test`, so tickets must name it.

Good tests exercise behaviour through these interfaces, not React internals or IPC wiring. Prior art: `test/derivations.test.ts` (pure formulas), `test/backup.test.ts` (temporary database), `test/ui-settings.test.ts` (settings normalisation), `e2e/` (Playwright).

## Inputs
- `wiki/desktop/monthly-budget-snapshots.md` (design, decisions in section 16)
- `docs/adr/0006-saved-budgets-local-only.md`
- `docs/adr/0004-derived-values-computed-not-stored.md`
- `GLOSSARY.md` (Saved budget, Budget source)
- `tickets/monthly-budget/01-record-decisions.md`

## Out of Scope
- Any Notion schema, database, push or pull of saved budgets.
- Changing Quarterly from 4 months to 3 (separate ticket).
- Per-month Need/Wants/Savings split.
- Free-form date ranges per saved budget.
- Chat write tools for saved budgets.
- Syncing saved budgets between devices (use CSV export and import).

## Further Notes
- Acceptance criteria for the whole feature are in section 13 of the wiki spec and should be split across the four tickets.
- Docs to update when implementing: `wiki/desktop/local-data-schema.md`, `wiki/desktop/ipc-contract.md`, `wiki/shared/product-specification.md`, `notable-finance-app/CHANGELOG.md`, and `AGENTS.md` if the structure changes.
