# ADR-0011: Reference data is created and removed in Notion only; the app only reads it

**Status:** accepted
**Date:** 2026-11-24
**Ticket:** none yet (decided in a grill session; tickets follow)
**Input:** grill session of 2026-11-24 (Accounts cards view)
**Supersedes:** None (restates and widens the read-only half of ADR-0005, and applies to the Custom monthly budget database from ADR-0010)

## Context

ADR-0005 made accounts, income categories and expense categories read-only in the app, and ADR-0010 made the Custom monthly budget database editable only in Notion. The rule is scattered, and a new feature (the Accounts cards view, which wants a per-account color and a payment network) raised the question of where such per-account choices are made. A Notion deletion of an account was also found not to reach the app, because only incomes and expenses are checked for removal.

## Decision

**Accounts, expense categories, income categories and the Custom monthly budget database (its rows, formerly "saved budgets") are reference data. They are created, renamed, edited and removed in Notion only.** The app has no way to create, edit or delete them, and never writes them to Notion. The only exception already allowed is ADR-0009's "Add missing columns" on the Custom monthly budget database.

- **Everything shown about an account that Notion holds stays in Notion** (name, type, payment network, limits, billing and due days, inactive). The app reads it on every sync.
- **Display-only choices made in the app are local preferences, not reference data.** The card color of an account and the card finish are chosen in Settings, stored locally with the other UI settings (`ui.settings`), never written to Notion. An account with no chosen color gets an automatic one: the first color in a fixed palette, starting from a hash of its name, that no other card is using. The pick is saved the first time the account is seen, so it never changes later when other cards are recolored.
- **A removal in Notion must be reflected in the app.** When a reference row is trashed or archived in Notion, the next sync marks it removed locally. It is hidden from lists and pickers but never hard-deleted, because past incomes, expenses and transfers still point at it and keep their history. The same applies to a category and to a Custom monthly budget row (the cache is replaced from Notion on every pull, per ADR-0010).

## Alternatives

- Let the app create accounts and categories and push them to Notion: needs a second write path and conflict rules for structural data (already rejected in ADR-0005).
- Store card color as a Notion property: keeps colors in sync across devices, but needs a Notion schema change, and it is a pure display choice that does not belong in the finance database.
- Hard-delete a local row when Notion removes it: breaks the links from existing records.

## Consequences

- One place to look for "can the app create or delete this?": no.
- The Accounts cards view has no "add account" or "delete account" action. Prototype controls for those are dropped.
- Card colors and the card finish do not follow the user to a second computer; they travel only with a backup of the local database (there is no Settings export today).
- The reference pull must add a presence check (like the one for incomes and expenses) so removed accounts and categories are detected, and the data model needs a "removed from Notion" marker distinct from Notion's own Inactive flag. This is a bug today: deleting an account in Notion leaves it visible in the app.
- Glossary and `wiki/desktop/` pages that describe accounts as editable or that omit removal must be updated when that ships.
