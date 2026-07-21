# Changelog

All notable changes to the **Notable Finance desktop app** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_Nothing yet._

## [0.1.0] - 2026-07-21

First offline-first desktop release — a local-first Electron app that mirrors the web app's
finance workspace, works fully offline, and syncs bidirectionally with Notion. Personal /
unsigned build.

### Added

- **Phase 0 — Scaffold.** pnpm workspace + electron-vite (main/preload/renderer) with HMR;
  better-sqlite3 + drizzle migrations run on start (local DB in `userData`); finance DTOs +
  local derivations copied from the web app; typed contextBridge IPC skeleton.
- **Phase 1 — Offline app.** Local CRUD for incomes/expenses/scheduler (instant writes marked
  `dirty`, soft-delete via title rewrite, mutation-queue journal); balances/budgets/net/monthly
  derived live from SQLite; nine sections (Dashboard, Accounts, Income, Expense, Monitoring,
  Transfer, CC Payment, Alkansya, Receivables) with the web app's view semantics; multi-window
  with cross-window event fan-out.
- **Phase 2 — Notion connect + push.** Bring-your-own-Notion onboarding: token validated then
  encrypted with `safeStorage` (OS keychain), database discovery + mapping, schema-drift
  verification; push of dirty records (writable fields only) with local→Notion relation
  translation, idempotent updates, ~3 req/s throttle and 429 backoff.
- **Phase 3 — Pull.** Initial + incremental pull (`last_edited_time` cursor in `sync_meta`);
  reference caches (accounts/categories) refresh on pull; Notion relation ids translated to
  local ids.
- **Phase 4 — Reconcile + conflict.** Three-way merge (base/local/remote) — disjoint edits
  auto-merge, same-field overlaps become conflicts logged for a resolver (keep-mine /
  keep-Notion / per-field); reconcile runs before push so remote edits are never clobbered;
  manual + auto (interval) sync modes; global status chip + per-record dirty/conflict badges;
  crash-durable mutation queue.
- **Phase 5 — Packaging.** electron-builder targets for macOS (`.dmg`/`.zip`), Linux
  (`AppImage`), and Windows (NSIS), with `better-sqlite3` rebuilt for the packaged Electron ABI
  and migrations bundled as resources; Playwright + Electron end-to-end suite.

### Security

- Notion token is never written to SQLite, never logged, and never returned to the renderer.
- Every window runs with `contextIsolation`, `sandbox`, and `nodeIntegration: false`; all
  validation happens in the main process.

### Notes

- **Unsigned:** on macOS, right-click → Open once to pass Gatekeeper. Code-signing +
  notarization and auto-update are future work (see `wiki/desktop/packaging-and-release.md`).
- Sync was verified end-to-end against a mock Notion API; the first run against a real
  workspace happens when you connect your own integration token in the Sync section.

[Unreleased]: https://example.com/notable-finance/compare/v0.1.0...HEAD
[0.1.0]: https://example.com/notable-finance/releases/tag/v0.1.0
