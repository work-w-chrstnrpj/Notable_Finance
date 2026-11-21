# ADR-0003: Notion is a bidirectional mirror with three-way merge

**Status:** accepted (retroactive)
**Date:** 2026-11-16
**Ticket:** onboarding/01
**Input:** `wiki/desktop/sync-and-conflict-design.md`, `wiki/shared/notion-field-mapping.md`
**Supersedes:** None

## Context

The owner's finance workspace already lives in Notion and is also edited there. The desktop app must coexist with those edits without losing either side's changes.

## Decision

Sync runs pull, then push, then pull. Each writable record keeps a base snapshot of its last synced state, and changes are reconciled with a three-way merge. True conflicts are stored and shown to the user. Only writable fields are pushed; computed Notion fields (formulas, rollups, reverse relations) are never written. Accounts and categories are read-only reference data pulled from Notion.

## Alternatives

- Last write wins: simple but silently loses edits.
- One-way export to Notion: loses edits made in Notion.

## Consequences

- Each synced table carries sync bookkeeping columns (`sync_state`, `base_snapshot`, `notion_page_id`).
- The live Notion schema must match `src/main/notion/schema-spec.ts`; writable drift blocks push.
- Notion property labels are preserved exactly, even when awkward.
- Local-only data is never a sync concern unless explicitly mapped.
