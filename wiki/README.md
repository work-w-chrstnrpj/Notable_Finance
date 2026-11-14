# Notable Finance — Documentation

Notable Finance is a **local-first Electron desktop app**: local SQLite is the working source of truth and Notion is a bidirectional mirror/backup. It works fully offline and reconciles with the user's Notion workspace in the background. (An earlier web app was removed; this wiki covers the desktop app only.)

## Zones

- **[`shared/`](shared/)** — product intent, the finance domain glossary, and the canonical Notion field mapping (which fields are writable vs computed).
- **[`desktop/`](desktop/)** — architecture, sync engine, local schema, IPC, offline behavior, onboarding, packaging, security, testing, plan, Borrowings, Money Lent.

## Reading order

1. [`shared/product-specification.md`](shared/product-specification.md) — what the app does.
2. [`desktop/desktop-architecture.md`](desktop/desktop-architecture.md) — the Electron process model and technical design.
3. [`desktop/sync-and-conflict-design.md`](desktop/sync-and-conflict-design.md) — the reconcile + conflict engine.
4. [`desktop/local-data-schema.md`](desktop/local-data-schema.md) — SQLite tables and sync columns.
5. [`desktop/ipc-contract.md`](desktop/ipc-contract.md) — the main↔renderer contract.
6. The remaining desktop docs for offline behavior, onboarding, packaging, security, testing, and the plan.
