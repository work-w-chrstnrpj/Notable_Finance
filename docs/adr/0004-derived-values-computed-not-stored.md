# ADR-0004: Derived values are computed, never stored as truth

**Status:** accepted (retroactive)
**Date:** 2026-11-16
**Ticket:** onboarding/01
**Input:** `wiki/desktop/local-data-schema.md` (Derived values are computed, not stored), `wiki/desktop/desktop-architecture.md`
**Supersedes:** None

## Context

Balances, spending, remaining budget and Monitoring totals depend on many records and change on every edit, including edits made offline.

## Decision

Account balances, dashboard figures and Monitoring totals are recomputed from current local rows on demand (`src/main/domain/derivations.ts`, `src/main/services/reports.ts`) and are never persisted as the source of truth. Pure formulas shared with the renderer live in `src/shared/notion-formulas.ts`. Notion's formula and rollup values are not read for these numbers.

## Alternatives

- Store totals and update them incrementally: faster, but stale totals appear after any missed update or sync.
- Read Notion's computed fields: needs the network and ties numbers to Notion's formulas.

## Consequences

- Numbers are always consistent with the records, online or offline.
- Reports cost a pass over the relevant rows on each request.
- Anything that cannot be recomputed from records, such as a past month's budget, needs its own storage (see `wiki/desktop/monthly-budget-snapshots.md`, proposed).
