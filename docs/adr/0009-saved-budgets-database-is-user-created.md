# ADR-0009: The Saved Budgets database is created by the user; the app stores its ID

**Status:** accepted (partly superseded by ADR-0010: no mirror switch and no newest-edit-wins; the user-created database and ID stay)
**Date:** 2026-11-24
**Ticket:** saved-budgets-notion/06
**Input:** grill session of 2026-11-24
**Supersedes:** ADR-0008 (only where it says the app creates the database)

## Context

ADR-0008 had the app create the "Notable Finance: Saved Budgets" database under a parent page the user picks, and find it again by title. The owner intended something simpler and consistent with the other databases: they create the database in Notion themselves and give the app its ID.

## Decision

The user creates the Saved Budgets database in Notion and shares it with the integration. Its ID is saved in Notion Configuration, next to the other database IDs, stored locally and included in that dialog's Import and Export. The app never creates the database and does not search for it by title or ask for a parent page.

- **Check on save:** the app fetches the database and says in plain words when it cannot see it (not shared, wrong ID) or when it has no title column. Verify Schema includes it.
- **Toggle:** the Saved budgets mirror toggle stays, off by default, and can be switched on only when an ID is saved. The first switch-on still shows the month and category counts before anything is pushed.
- **Missing category columns:** the app does not add them silently. Settings lists the missing columns and offers an "Add missing columns" button. Until they exist, those categories are skipped, never guessed. Columns are never deleted or renamed, and columns matching no category are ignored.
- **A removed or unshared database:** Settings reports it; nothing is recreated.

Everything else in ADR-0008 stands: local SQLite is the source of truth, months are pushed as `Jan 2025`, quarter, half and year rows are split evenly across months that have no saved budget, the newest edit wins per month and category, and archiving a Notion row never deletes local data.

## Alternatives

- Keep ADR-0008 (the app creates the database): less setup for the user, but it needs a parent page, a title search and recreate logic, and it does not match how every other database is configured.
- Add missing columns automatically: fewer steps, but it changes a database the user owns without asking.

## Consequences

- The parent-page search, create, reuse and recreate code and screens are removed.
- The user does one manual step: create the database and paste its ID.
- A database the app created earlier under ADR-0008 stays in Notion untouched; the user can delete it.
- Docs that describe the app creating the database must be updated when this ships.
