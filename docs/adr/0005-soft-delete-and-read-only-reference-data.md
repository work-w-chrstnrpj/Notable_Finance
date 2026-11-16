# ADR-0005: Soft delete for records and read-only reference data

**Status:** accepted (retroactive)
**Date:** 2026-11-16
**Ticket:** onboarding/01
**Input:** `AGENTS.md` (Product Rules), `README.md` (Core rules), `wiki/shared/product-specification.md`
**Supersedes:** None

## Context

Records must stay in step with Notion, where deletions would be hard to merge and easy to lose. Accounts and categories are structural data that the owner maintains in Notion.

## Decision

Incomes and expenses are soft-deleted: the title is rewritten to include `[Deleted: Amount]` and the amount is cleared (hard delete is an opt-in setting for specific cases). Accounts, income categories and expense categories are read-only in the app, with no delete endpoint; they are maintained in Notion and pulled into local reference tables.

## Alternatives

- Hard delete everywhere: breaks three-way merge and loses audit history.
- Editable reference data in the app: needs a second write path and conflict rules for structural data.

## Consequences

- Deleted records still sync as ordinary updates and can be reviewed.
- Reports and balances must filter deleted rows consistently.
- Creating or renaming accounts and categories happens in Notion, then a sync.
