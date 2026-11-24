# 06: Use a Saved Budgets database ID the user creates

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
The user creates the Saved Budgets database in Notion and pastes its ID into Notion Configuration, next to the other database IDs. The app no longer creates, finds by title or recreates the database, and no longer asks for a parent page. Saving the ID checks it and explains problems in plain words. The Saved budgets mirror toggle can be switched on only when an ID is saved. Missing category columns are listed in Settings, and an "Add missing columns" button creates them; until then those categories are skipped.

## Acceptance criteria
- [ ] AC1: Notion Configuration has a Saved Budgets database ID field, saved with the other IDs, and included in that dialog's Import and Export.
- [ ] AC2: Saving an ID the app cannot see, or one whose database has no title column, shows a plain message saying which problem it is; Verify Schema includes the Saved Budgets database.
- [ ] AC3: The mirror toggle is off by default and cannot be switched on while no ID is saved; with an ID, switching on still shows the month and category counts before anything is pushed.
- [ ] AC4: The parent-page search, create, reuse and recreate controls and code are removed, and the app never creates a Notion database.
- [ ] AC5: Missing category columns are listed in Settings and no column is added silently; "Add missing columns" creates them as Number columns, and categories without a column are skipped when pushing and pulling.
- [ ] AC6: Columns are never deleted or renamed, and columns that match no category are ignored.
- [ ] AC7: A database that was removed or unshared shows a plain status in Settings and nothing is recreated.
- [ ] AC8: Pushing monthly rows, pulling with newest edit wins, splitting quarter, half and year rows, and the toggle-off behavior work as before.
- [ ] AC9: The docs that say the app creates the database are updated, and the earlier mirror tests are changed to match.

## Inputs
- docs/adr/0009-saved-budgets-database-is-user-created.md (changes ADR-0008)
- tickets/saved-budgets-notion/spec.md (parts about creating the database are replaced by ADR-0009)
- tickets/saved-budgets-notion/02, 03, 04, 05 (built earlier, still uncommitted)
- Notion Configuration dialog and the Saved budgets mirror settings

## Evidence
- Commits:
- PR:
- Tests:
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Written from the grill session. The user said "yes to all" to five points: ID in Notion Configuration with Import and Export; check on save; show missing columns and add them only on a button press; the rest of the sync behavior unchanged; a short ADR-0009 plus a glossary edit.
- Decisions: ADR-0009 written; ADR-0008 marked partly superseded. If the app created a database earlier, it stays in Notion and the user can delete it.
- Next: /cook-a-ticket saved-budgets-notion/06

### 2026-11-24 claude
- Did: Cooked. Removed everything that created or searched for a database: the parent-page picker, create, reuse and recreate code, and the two Notion client calls (createDatabase, searchPages). The database ID is now a "Saved Budgets (optional)" field in Notion Configuration, saved with the other IDs under the key savedBudgets and carried by that dialog's Import and Export. Saving checks the ID and shows a plain message; Verify Schema now includes it. The Settings mirror switch is disabled until an ID is saved, and the main process refuses to enable without one. Missing category columns are listed with an "Add missing columns" button (Number columns only); categories without a column are skipped on push and pull. A removed or unshared database shows a status and nothing is recreated. Push, pull, newest-edit-wins and the toggle-off behavior are unchanged.
- Tests: rewrote the mirror tests in test/saved-budgets-mirror.test.ts for the ID-based setup (named saved-budgets-notion/06#ACn where they prove a criterion). Full run: typecheck clean, eslint 0 errors, 644 unit tests pass.
- Not proven: the check on save and Add missing columns have never run against real Notion (tests use a fake client); the Notion Configuration field and the switch being disabled have no UI test. No criteria are ticked because this was cooked without the test modifier; AC1 and AC3 (UI parts) need a look in the app.
- Docs updated: wiki monthly budgets section 17, Notion field mapping, local data schema.
- Next: try it with your real database ID, then /cook-a-ticket [serve].
