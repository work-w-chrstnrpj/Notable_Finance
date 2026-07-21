# Notable Finance — Documentation

Notable Finance ships as **two applications that share the same finance domain and business logic**, differing only in how they store and sync data:

| App | Store / source of truth | Excels at | Docs |
| --- | --- | --- | --- |
| **Notable Finance Web** (`notable-finance-web/`) | Notion is the source of truth; PostgreSQL holds minimal metadata | On-the-go, cloud-backed access | [`web/`](web/) |
| **Notable Finance App** (`notable-finance-app/`) | Local SQLite is the working source of truth; Notion is a bidirectional mirror/backup | Smoothness, offline mode, daily driving | [`desktop/`](desktop/) |

Both apps encode, view, validate, and sync the same records (Accounts, Income, Expense, Transactions, Scheduler, Monthly Monitoring) against a user's Notion workspace. The **desktop app is local-first**: it inverts the source of truth to a local SQLite database so it works fully offline, and reconciles with Notion in the background.

## Zones

This wiki is organized into three zones so the identical parts are documented once:

- **[`shared/`](shared/)** — one source of truth for both apps: product intent, finance domain glossary, and the canonical Notion field mapping (which fields are writable vs computed).
- **[`desktop/`](desktop/)** — everything specific to the local-first Electron app (architecture, sync engine, local schema, IPC, offline behavior, onboarding, packaging, security, testing, plan).
- **[`web/`](web/)** — the existing web app's docs, relocated into this wiki as the web zone, canonical for web-specific concerns (HTTP API, Vercel/Render deployment, its development plan).

## Reading order for the desktop app

1. [`shared/product-specification.md`](shared/product-specification.md) — what the app does (parity + desktop deltas).
2. [`desktop/desktop-architecture.md`](desktop/desktop-architecture.md) — the Electron process model and technical design.
3. [`desktop/sync-and-conflict-design.md`](desktop/sync-and-conflict-design.md) — the heart of the app: the reconcile + conflict engine.
4. [`desktop/local-data-schema.md`](desktop/local-data-schema.md) — SQLite tables and sync columns.
5. [`desktop/ipc-contract.md`](desktop/ipc-contract.md) — the main↔renderer contract (the desktop "API").
6. The remaining desktop docs for offline behavior, onboarding, packaging, security, testing, and the plan.
