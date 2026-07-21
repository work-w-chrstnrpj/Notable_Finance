# Notable Finance App (Desktop)

Offline-first desktop version of Notable Finance, built with Electron.

Unlike `notable-finance-web/` (where Notion is the source of truth), this app keeps
its **own local SQLite database** as the working store and syncs **bidirectionally**
with Notion in the background. It is the smooth, offline-capable daily driver; the web
app remains the on-the-go, cloud-backed client.

## Planned architecture

- **Main process** — owns the data: SQLite + sync engine + Notion adapter. Holds the
  Notion token encrypted via Electron `safeStorage` (OS keychain).
- **Renderer** — React UI, reusing presentational components from the web app, talking
  to main over typed IPC. Never touches Notion or SQLite directly.
- **Sync** — bidirectional reconcile against Notion using a **three-way merge**
  (base snapshot / local / remote) at the **field level**: disjoint edits auto-merge,
  only true same-field conflicts prompt the user and are logged. Notion's
  minute-rounded `last_edited_time` is treated as a coarse "did anything change" hint,
  never as a winner-picking clock. Soft-deletes propagate as title rewrites.

## Status

**Phases 0–1 complete** (2026-07-21) — the app is a fully usable **offline daily driver**:

- **Phase 0** — electron-vite scaffold with HMR; better-sqlite3 + drizzle migrations in
  `userData`; finance DTOs + local derivations; typed IPC skeleton.
- **1.1** — full SQLite schema incl. sync bookkeeping and pasabuy columns (migration 0001).
- **1.2** — local CRUD for incomes/expenses/scheduler: instant writes marked `dirty`,
  mutation-queue journal, soft-delete via title rewrite, validation in main.
- **1.3** — balances/budgets/net/monthly computed live from SQLite on every edit
  (golden-checked at runtime; 27 unit tests).
- **1.4** — all nine sections render from local data: Dashboard, Accounts, Income, Expense
  (+ scheduler panel), Monitoring, Transfer, CC Payment, Alkansya, Receivables — using the
  web app's view semantics (fixed workflow categories; receivables = no receiving account;
  Income view excludes auxiliary categories).
- **1.5** — multi-window (File → New Window, Cmd/Ctrl+N): every data change broadcasts
  `records:changed` / `derived:updated` to all windows, which refetch — windows stay consistent.

**Phase 2 complete** (2026-07-21) — Notion onboarding + push, in the new **Sync** section:

- **2.1** — Connect with your integration token (validated, then encrypted via `safeStorage`
  into the OS keychain; never in SQLite, never returned to the renderer). Discover databases
  and map each resource; mapping persists in `app_settings`.
- **2.2** — Schema verification produces a drift report per resource: missing/mismatched
  writable properties are errors, computed ones warnings.
- **2.3** — Push sends dirty records (writable fields only): create stores the returned page
  id, update patches it (idempotent), soft-deletes travel as title rewrites; ~3 req/s throttle
  with 429 backoff; local→Notion relation ids translated, unlinked ones skipped until pull.

Phase 2 was verified end-to-end against a mock Notion API (connect → discover → map → verify
→ push with injected 429). First run against a real workspace happens when you connect your
own integration token in the Sync section. Next: Phase 3 (pull).

See [`../wiki/desktop/development-plan.md`](../wiki/desktop/development-plan.md) and the progress
tracker at [`../wiki/desktop/desktop-development-plan.xlsx`](../wiki/desktop/desktop-development-plan.xlsx).

## Run it

```bash
pnpm install                              # from the repo root (approves native builds at the gate)
pnpm --filter notable-finance-app rebuild # compile better-sqlite3 for Electron's ABI
pnpm --filter notable-finance-app dev     # boots the window with HMR
pnpm --filter notable-finance-app seed    # OPTIONAL: seed dev accounts/categories (run app once first)
pnpm --filter notable-finance-app test    # run the unit tests
```

Accounts and categories are **read-only reference data** (maintained in Notion, pulled in
Phase 3). Until then, `seed` provides a realistic local set so the forms and reports have
accounts/categories to work with.

## Proposed layout (subject to change)

```
notable-finance-app/
├── src/
│   ├── main/        # Electron main: SQLite, sync engine, Notion adapter, IPC handlers
│   ├── preload/     # contextBridge — typed IPC surface
│   └── renderer/    # React UI
├── package.json
└── electron.vite.config.ts
```
