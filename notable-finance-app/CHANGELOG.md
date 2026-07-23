# Changelog

All notable changes to the **Notable Finance desktop app** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Notion archive/trash no longer sticks Unsynced** — if Notion deletes/archives an
  income/expense page, sync soft-deletes locally and marks it clean (push no longer loops
  on “Can't edit block that is archived”). A full presence pass on pull catches Notion-only
  trash even when the local row was still live.
- **Accounts list (non-credit)** — Card and Table views no longer show **Total Cash Inflow** /
  **Total Cash Outflow**. Credit cards still show Payment Made / Purchase Expenses.
- **Account detail modal** — Balances now also include derived **Total Pasabuy** and
  **Total CC, Debt & Transfer** (same local formula terms as Current Balance).

### Added

- **Mass edit for selected Income/Expense rows** — the bulk toolbar now includes **Edit**.
  It opens a modal where you can (+) add one or more writable fields (inputs, dropdowns,
  dates — not formulas, and not Name / Purchase description), set each new value, and
  apply the same patch to every selected row via `bulkUpdate`.
- **Notion page icons on push** — every create/update to Notion now sets a native page
  icon (API `type: "icon"`) so rows are visually typed in the Notion DB:
  - Expense (non-Pasabuy) → arrow down circle / red
  - Expense (Pasabuy) → vitruvian man circle / yellow
  - Income (normal) → arrow up circle / green
  - Transfer → arrow left right circle / yellow
  - Credit Card Payment → credit card / red
  - Receivable (no account) → delivery truck profile / blue
  Requires Notion-Version `2026-03-11` (bumped from `2022-06-28`) for native icons.
- **History section** — a new sidebar page (System group) that surfaces the local-first
  sync journal:
  - **Unsynced Items**: local changes not yet on Notion (`sync_state` dirty/conflict),
    **including soft-deleted records**, each tagged Created / Updated / Deleted, with a
    Conflict badge and "never sent to Notion" hint where relevant.
  - **Recently Synced**: a sortable **table** (matching the other views) with columns
    Status / Record / Type / Direction / When. It shows only the **last two sync passes**
    (the current sync and the one immediately before it), each row tagged with its status
    (Created / Updated / Deleted) and **direction** — `Notion DB → App` (pull) or
    `App → Notion DB` (push).
  - Backed by a new durable `activity_log` table (migrations `0003_reflective_angel` +
    `0004_massive_maximus`) that the pull and push engines append to on every applied
    record. Each event carries a `run_id` so History can group by sync pass; one `syncNow`
    (pull + push) shares a single run id. Unlike `mutation_queue` (cleared on push), the
    feed persists (capped to the newest 1000 rows) but the UI only surfaces the last two
    runs. Exposed via a new `history:get` IPC channel.
  - The old empty **Activity Log** placeholder on the Sync page was removed (History
    replaces it).
- **Sync sidebar conflict badge** — a live red number on the Sync nav item showing how
  many records need conflict resolution. Seeds from `sync.status().conflictCount` and
  updates on every `sync:status` broadcast (including after resolve). Resolution stays
  on the Sync page; the badge just surfaces that work is waiting.

### Changed

- **Redesigned the "Local-First Sync (Desktop)" panel** on the Sync page — it was
  cramped and misaligned (the auto-sync checkbox, interval field, and "seconds" label
  stacked awkwardly because `.action-list` is a grid). It now uses the standard
  `settings-row` layout with a proper toggle switch for auto-sync and an inline
  "every N sec" interval, and conflicts render as clean cards (field label · Mine/Notion
  values · per-field and bulk resolve actions) instead of overflowing rows.
- **Pinned `better-sqlite3` to 12.11.1 and Electron to 42.x** so packaging works without a
  local MSVC toolchain: the better-sqlite3 13.x releases currently ship **no prebuilt
  binaries**, and no npm-published version has a prebuild for Electron 43's ABI (v148).
  12.11.1 provides prebuilds for Electron 42 (ABI v146) and Node 24 (ABI v137). Revisit once
  13.x prebuilds are published.

### Fixed

- **Account & expense computations now match the Notion formulas exactly** (decoded from the
  workspace schema, replacing earlier guesses):
  - **Current Balance** is one unified formula for every account type — `ΣGrossIncome −
    (ΣExpenseAmount + ΣInterest) + ΣPasabuyReceived + ΣTransactionAmount` — with **no Starting
    Balance**, using **gross** (not net) income, and each term aggregated by the correct
    relation (`accountId`, `transactedAccountId`, `pasabuyAccountReceiverId`). Fixes the wrong
    dashboard Total Cash Flow.
  - **Available Limit** = `creditLimit>0 ? min(creditLimit + currentBalance, creditLimit) : —`.
  - Accounts now expose **Total Cash Inflow / Outflow** (labelled "Payment / Purchase Made" for
    credit accounts).
  - **Pasabuyer Balance** in the Unpaid-Pasabuy view is now computed (`amount − installment ×
    pasabuyPaidPeriod`; 0 when fully received) instead of always ₱0.00, and that column is
    relabelled "Pasabuyer Balance". Gross Price / Installment / Paid / Received amounts are
    ported verbatim from the Notion formulas.
  - **QR Code** now syncs AND works fully offline: the account property is "Qr Code" (not
    "QR Code" — the old name never matched). During pull the QR image **bytes are downloaded
    and cached as a `data:` URI** (new `qr_code` column), rather than storing Notion's signed
    file URL which expires in ~1h and breaks offline. Already-cached QRs are skipped on
    re-pull; download failures are non-fatal (offline-safe). Backfills existing accounts on
    the next full "Pull from Notion".

### Changed

- **Renderer aligned 1:1 with the web app.** The desktop UI is now the web renderer ported
  verbatim (workspace shell with Sidebar + TopBar, date-range selector and view modes,
  Dashboard with charts/trends/breakdowns, Accounts card/table views, full Income/Expense
  pages, Workflow pages, Monthly Monitoring, **Settings** with theme customization and FAB
  toggle, quick-action FAB, light/dark theme, toasts, error boundaries) over an IPC-backed
  `api-client` with the same interface as the web's HTTP client. Backend list filtering
  (Daily/Weekly/Annual ranges; Unpaid Pasabuy / To pay / To buy / Installments / Unpaid CC
  expense views) is copied from the web query service, so outputs match view-for-view.
- Desktop-only additions are isolated: a "Local-First Sync" panel on the Sync page (initial
  pull, auto-sync interval, three-way-merge conflict resolver) and a hash router + local-user
  auth stub replacing Next.js routing/login (the desktop is single-user; account management
  is intentionally dropped).

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
