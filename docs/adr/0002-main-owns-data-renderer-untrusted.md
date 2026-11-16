# ADR-0002: Main process owns data and side effects; the renderer is untrusted

**Status:** accepted (retroactive)
**Date:** 2026-11-16
**Ticket:** onboarding/01
**Input:** `wiki/desktop/desktop-architecture.md` (Process model, Key architectural rules), `wiki/desktop/ipc-contract.md`, `wiki/desktop/security.md`
**Supersedes:** None

## Context

The app holds financial data and a Notion token. The UI is a React renderer that should never need Node, SQLite or network access.

## Decision

All data, validation, secrets and network calls live in the main process. The renderer reaches them only through an allow-listed `window.api` exposed by the preload script (`contextIsolation` on, `nodeIntegration` off). IPC channel names are defined once in `src/shared/ipc-channels.ts` and DTOs in `src/shared/finance.types.ts`. Handlers register through one `handle()` primitive that returns a typed `ApiResult` envelope.

## Alternatives

- Renderer with direct Node and database access: simpler, but any renderer bug or injected content could read tokens and data.
- Ad hoc IPC channel strings: easy to drift between preload, main and renderer.

## Consequences

- Validation is repeated nowhere; main is the single place that checks input.
- Every new feature needs a channel, a DTO and a preload entry, which is more boilerplate.
- Pure formulas shared by both sides live in `src/shared/` so numbers match everywhere.
