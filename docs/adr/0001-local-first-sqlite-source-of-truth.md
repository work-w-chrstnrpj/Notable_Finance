# ADR-0001: Local SQLite is the working source of truth

**Status:** accepted (retroactive)
**Date:** 2026-11-16
**Ticket:** onboarding/01
**Input:** `wiki/desktop/desktop-architecture.md` (Goals, Technology choices)
**Supersedes:** None

## Context

The product began as a web app where Notion was the source of truth. Daily encoding needs to work offline and feel instant, and balances and budgets need to recompute on every edit.

## Decision

The Electron app keeps all records in a local SQLite database (`better-sqlite3` with Drizzle ORM and additive migration files). The app reads and writes SQLite first; Notion is reconciled afterwards.

## Alternatives

- Notion as the source of truth with a cache: needs the network for every write, slow, and makes derived values depend on Notion formulas.
- A hosted backend database: adds a server, accounts and hosting cost for a single-user personal tool.

## Consequences

- The app is fully usable offline, and edits are instant.
- A sync engine with conflict handling is required (see ADR-0003).
- Local-only data such as saved UI settings or future local-only tables does not reach Notion and needs its own backup path (`services/backup.ts`).
- Schema changes ship as additive Drizzle migrations in `src/main/db/migrations/`.
