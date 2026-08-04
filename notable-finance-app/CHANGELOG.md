# Changelog

All notable changes to the **Notable Finance desktop app** are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-08-05

**No functional changes.** This release is a complete internal restructuring of the
desktop app. Every user-visible behaviour — what renders, what is written to SQLite, and
what is pushed to Notion — is unchanged by design. The major version marks the scale of
the architectural change, not a break in behaviour or data format. Existing local
databases, backups and Notion connections continue to work untouched.

Full plan and per-phase notes: [`wiki/desktop/refactor_development_plan.md`](../wiki/desktop/refactor_development_plan.md).

### Added

- **Lint gate.** ESLint with `typescript-eslint`, `eslint-plugin-react-hooks` and
  `eslint-plugin-react`. Errors block CI (`no-unused-vars`, `no-unreachable`,
  `no-dupe-class-members`, `react-hooks/rules-of-hooks`,
  `@typescript-eslint/no-floating-promises`); `exhaustive-deps`, `max-lines` and
  `complexity` run as warnings. Previously the project had no linter at all.
- **Renderer test coverage.** Component tests for the pages where domain rules meet the
  user — all 9 Expense view modes, Income view modes, Workflow sections, the optimistic
  save success/failure paths, bulk actions, mass edit, and the search toggle. The suite
  went from 217 main-process tests to **251 tests across 30 files**.
- **CI enforcement.** `.github/workflows/desktop-ci.yml` runs typecheck, lint and the unit
  suite on every push and pull request touching the app.
- **Shared record-page engine** (`renderer/src/features/records/`): `use-record-selection`,
  `use-persisted-filters`, `use-record-search`, `use-optimistic-records`,
  `use-bulk-actions` and `receipt` — each extracted from two or more existing identical
  implementations.
- **`shared/ipc-channels.ts`**: an 86-entry channel map imported by both the main-process
  registrars and the preload bridge, so a channel typo is now a compile error instead of a
  runtime "no handler registered".

### Changed

- **Pages decomposed into directories.** `expense.tsx` (1975 LOC) → `expense/` across 8
  files with a 733-line composition root; `income.tsx` 910 → 544; `workflow.tsx` 653 → 522;
  `chat.tsx` 1491 → `chat/` across 6 files; `settings-modals.tsx` 1079 → one file per
  modal; `fab/index.tsx` 741 → 5 files. Expense view-mode selection moved from a 4-deep
  ternary chain to a table-config lookup.
- **Triplicated record workflow unified.** Filter persistence, fuzzy search, row selection,
  optimistic save, bulk actions and receipt construction had three to four independent
  copies across Income, Expense and Workflow. They now share one implementation each.
  Deliberate per-page differences are parameterised rather than unified — Income and
  Workflow simply do not pass `onPrint`/`onCover`, so those actions stay Expense-only.
- **IPC surface split.** `registerIpc()` (654 LOC, ~80 handlers) became six per-domain
  registrars behind a 22-line composition root. Channel strings and handler bodies are
  byte-identical to the originals.
- **Domain types deduplicated.** The 8 enums defined in both `shared/finance.types.ts` and
  `renderer/src/types/finance.ts` now re-export from the shared file. All 8 `as never`
  casts at the IPC boundary were replaced with correctly typed calls.
- **Stylesheet scoped.** The 11,030-line single `globals.css` became a 108-line `@import`
  list over `base/`, `layout/`, `components/` and `pages/`, plus 11 component-local CSS
  Modules. 2,738 lines of byte-identical duplicate CSS left behind by a past redesign were
  removed.

### Fixed

- **Dead code shipping in `income.tsx`**: `handleIncomeViewModeChange` was declared four
  times, three of them unreachable copies pasted into unrelated function bodies by a
  botched find/replace. It compiled, so nothing caught it. The lint gate now would.
- **Search toggle left a stale query.** The `view.search` keyboard shortcut toggled search
  without clearing the query while the toolbar button cleared it, so closing search via
  the keyboard left a query that silently re-applied on reopen. Both paths now clear.
  (The one intentional behaviour change in this release, made with explicit approval and
  pinned by a regression test.)
- **Unstyled sidebar badge.** `layout/index.tsx` referenced a CSS Module class the module
  never defined, so the nav badge rendered with `class="undefined"`.
- **Silently dead style rules.** 31 global rules referencing now-hashed CSS Module classes,
  and five `@keyframes` animations whose names no longer resolved, were restored.
- **Flaky e2e suite.** Two real bugs, not test noise: the dev seed script never set
  `notion_page_id`, so every account picker (which filters to Notion-synced rows) hid the
  seeded data; and a hardcoded date in the shortcut spec aged out of the Expense page's
  default current-month view.
- **e2e selectors broken by the CSS Modules migration.** Hashing `nav__item`, `nav__title`,
  `topbar` and `filter-dropdown*` into modules made every literal `.nav__item`-style
  Playwright selector match nothing — 20 of 34 specs failed. Caught during release
  verification, because the CSS phase was signed off on typecheck + lint + unit tests +
  build without ever running the e2e gate. The app itself was never affected: the hashed
  class is applied consistently in both the stylesheet and the markup. Fixed in the specs
  only. Suite is back to **34/34**.

### Known limitations

- `expense/index.tsx` (733), `monitoring.tsx` (712), `history.tsx` (700) and
  `chat/index.tsx` (611) remain above the plan's 400/500 LOC targets. What is left in each
  is page orchestration with a 20+ identifier dependency surface; extracting it would
  produce hooks with 20-field config objects — worse to read than the linear composition
  that exists now. `monitoring.tsx` and `history.tsx` were never in the phase scope.
- The Unpaid Pasabuy footer still emits 9 cells against 8 headers. Reproduced verbatim
  during the refactor and ticketed separately, per the behaviour-preserving rule.

## [1.2.0] - 2026-08-01

### Added
- Design presets: six selectable UI themes — Default (clean & familiar), HIG
  (liquid glass), Material (Material You), Atlas (enterprise structured), Carbon
  (enterprise precise) and Fluent (modern Windows) — each with its own surfaces,
  radii, blur and motion treatment, picked from preset cards in Theme settings
- Backup & Restore in Settings: export a consistent SQLite snapshot of all local
  data (incomes, expenses, accounts, budgets, chat history) to a single file, and
  import it back. Works offline — no Notion connection required. Chat API keys
  stay in the OS keychain and are never exported
- Backup files are stamped with app version, export time, and record counts;
  imports from a newer app version are refused until the app is updated
- Online state badge in the TopBar (green Online / red Offline), same treatment
  as the offline indicator
- Chat: dynamic display-only greeting in the empty state — time-of-day greeting
  plus the user's first name and a daily rotating finance prompt line
- Chat: AI can now answer year-level questions ("total expense for 2026") via a
  new year parameter on queryIncomes/queryExpenses (expands to the full year range)
- Chat: "financial insight / insights / monthly highlights" phrases route to the
  Monitoring summary skill; "insight" added to the ask-data vocabulary
- Chat: data digest memory — headline totals from read tools are stored with each
  assistant turn and replayed on the next few turns, so follow-ups like "what
  about June?" have grounding without replaying raw tool transcripts
- Chat: richer system prompt — app overview (local-first, Notion mirror), money
  formulas (total expense = amount + interest, net income, available budget),
  date/period guidance, and a note that practical personal-finance tips are welcome
- Topic guard lexicon: "tipid tips" / generic finance tips no longer blocked;
  added common Taglish finance words (pera, gastos, kita, utang, sahod, ipon, …)
  and food/groceries/restaurant spending terms

### Fixed
- Form modals could not be scrolled with a mouse wheel or trackpad; only dragging
  the scrollbar worked, which disguised this as a layout problem. Both faces of
  the flippable modal share a single grid cell, and while `backface-visibility:
  hidden` stops the away-facing face from being painted, Chromium still routed
  wheel/scroll hit-testing to it — and because that face's body is not
  scrollable, the gesture was swallowed. The away-facing face is now removed
  from hit-testing, so every overflowing form modal scrolls normally
- Accounts table rows were not clickable (table view) — recordIds were missing,
  so row clicks never opened the account detail modal
- Expense page crash "Expense failed to render text.trim is not a function" when
  a Notion page contained a callout — the callout regex replace callback bound
  the numeric offset to the text variable; now bound to the actual capture group
- CC Transaction / Pasabuy sections no longer hide while any of their fields still
  has content after switching to a non-CC account / non-Pasabuy category; they
  hide again only once every related field is cleared
- Topic guard now allows "give me a random tipid tips" and similar generic
  personal-finance advice questions

### Changed
- Color picker: larger preview swatch, explicit open and disabled states, a
  dropdown caret, and a raised z-index so the panel renders above modals
- App version bumped to 1.2.0

## [1.1.1] - 2026-07-30

### Added
- Page Content panel: edit a record's Notion page body as Markdown with live preview,
  local-first save, and push-to-Notion on next sync
- Cover Expense → Bulk CC Payment workflow in expense page

### Changed
- Page Content button layout: buttons downsized, pushed to bottom of modal,
  status bar collapsed to a single compact row
- App icon updated to new logo (1024×1024, resized from 1250×1250 source)
- Favicon added to renderer HTML

### Fixed
- Unsigned macOS auto-update no longer shows error toast — gracefully falls back
  to a manual download link pointing to the latest GitHub Release
- `EventChannel` type missing `updater:manual-download` — channel is now recognized
  across preload, settings, and main process
- `form-modals.tsx` missing `onInfo` prop and `Info` import — page content button
  now renders correctly on record modals
- `updater/index.ts` referencing `autoUpdater.availableVersion` which does not exist
  on `electron-updater` v6 — replaced with locally cached version from `update-available` event
- `remark-gfm` / `rehype-raw` not declared as dependencies — properly added to package.json
- Product name changed from `Notable Finance` to `Notable-Finance` (hyphenated) to
  match expected artifact naming in electron-builder outputs

## [1.1.0] - 2026-07-29

### Added
- Database migration 0009: adds `payload` column to `activity_log` for full record payloads in history
- History page: record detail modals with read-only form views and old→new diff display for unsynced and synced items
- Push/Cancel Unsynced bulk actions in History page for managing pending changes directly from history
- Pending edit system (`pending-edit.ts`) for History→page auto-open edit modal navigation
- Sync conflict display now distinguishes null (∅ empty) vs `""` blank vs literal values
- Server-side FK resolution for conflict modal (account/category UUIDs → display names)
- Source account excluded from Transfer account dropdown
- Transfer record name prefill ("Transfer") and auto-negated grossIncome
- CC Payment record name prefill ("CC Payment —")
- Receipt font independently configurable via `receiptFont` in UiFontSettings (default "Instrument Serif")
- Expense form validation: Account & Category required with red * and shake animation
- Position-based → ID-based (UUID) refactor across data-table, income, expense, workflow, accounts pages
- Cover the expense feature: mass linking of CC expenses to CC Payment receipts via CoverExpensesModal
- Unpaid Pasabuy view: Account column added between Name and Pasabuyer Balance
- Bulk toolbar repositioned to prevent overlap with side nav
- CoverExpensesModal UI refinement: custom radio indicators, tighter rows, + New ghost button
- "Mass Edit" → "Bulk Edit" rename across expense and income pages
- Bulk Edit modal preset quick-action buttons: Bulk CC Pay and Bulk Pasabuy
- Toast notification system replacing inline save notices across expense, income, history, and finance-workspace pages
- Sync success/failure toasts in finance-workspace (push, pull, full sync)
- `receiptFont` CSS variable (`--font-receipt`) applied on receipt div
- `ItemDetail` IPC handler for full record payload retrieval

### Changed
- Sync conflict `fmt()` shows null→(∅ empty), ""→("" blank), and literal values
- Account balance computation uses raw sums with single final rounding to prevent ±0.01 drift
- `transactionAmount()` removes intermediate rounding for correctness
- Filter state fully reset when switching Daily/Weekly/Monthly view mode (expense + income)
- `selectedIds`/`disabledIds` changed from `Set<number>` to `Set<string>` (UUIDs)
- Position-based row lookups replaced with ID-based `.find()` / `.filter()` throughout
- Bulk toolbar centering changed to `margin: 0 auto; width: fit-content`

## [1.0.0] - 2026-07-27

Initial desktop release — a local-first Electron app that mirrors the web app's finance
workspace, works fully offline, and syncs bidirectionally with Notion.

### Architecture

- **Local-first:** all data lives in a local SQLite database (`better-sqlite3` + Drizzle ORM).
  Reads are instant; writes are committed locally first, then synced to Notion in the background.
- **Nine finance sections:** Dashboard, Accounts, Income, Expense, Monthly Monitoring,
  Transfer, Credit Card Payment, Alkansya, and Receivables — matching the web app's view
  semantics.
- **Bidirectional Notion sync:** pull (initial + incremental via `last_edited_time` cursor),
  push (dirty records only, writable fields, ~3 req/s throttle with 429 backoff), and
  three-way merge with per-field conflict resolution.
- **Renderer ported from the web app** (React 19, TanStack Query, Recharts) over an IPC-backed
  `api-client` with the same interface as the web's HTTP client.

### Added — Core

- **Full finance UI** with workspace shell (Sidebar + TopBar), date-range selector, view modes,
  light/dark theme, toasts, error boundaries, and quick-action FAB.
- **Dashboard** with charts, trends, and breakdowns matching the web app.
- **Accounts** card and table views with Current Balance, Available Limit, Total Cash
  Inflow/Outflow, Total Pasabuy, and Total CC/Debt/Transfer computations — all matching the
  Notion formulas exactly.
- **Income and Expense** pages with full CRUD, view filtering (Daily/Weekly/Annual),
  Unpaid Pasabuy / To pay / To buy / Installments / Unpaid CC expense views.
- **Workflow pages:** Transfer, Credit Card Payment, Alkansya, Receivables.
- **Monthly Monitoring** with mode views.
- **Settings** with theme customization and FAB toggle.
- **Multi-window** with cross-window event fan-out.

### Added — Sync

- **Notion connect onboarding:** bring-your-own integration token, validated then encrypted
  with `safeStorage` (OS keychain), database discovery + mapping, schema-drift verification.
- **Pull:** initial + incremental (`last_edited_time` cursor in `sync_meta`); reference caches
  (accounts/categories) refresh on pull; Notion relation IDs translated to local IDs.
- **Push:** dirty records only (writable fields), local→Notion relation translation,
  idempotent updates, ~3 req/s throttle with 429 backoff.
- **Three-way merge (base/local/remote):** disjoint edits auto-merge, same-field overlaps
  become conflicts with per-field and bulk resolve (keep-mine / keep-Notion).
- **Sync Actions:** Pull / Push / Full buttons replace the old Commit Queue. The top-header
  Sync button runs full sync.
- **Auto-sync:** configurable interval with manual trigger.
- **Crash-durable mutation queue.**

### Added — History & Conflicts

- **History section** (sidebar, System group) surfaces the local-first sync journal:
  - **Unsynced Items:** local changes not yet on Notion (dirty/conflict), including
    soft-deleted records, tagged Created / Updated / Deleted with Conflict badge.
  - **Recently Synced:** sortable table showing the last two sync passes with direction
    (Notion DB → App / App → Notion DB).
  - Backed by a durable `activity_log` table (capped to 1000 rows).
- **Sync sidebar conflict badge:** live red number on the Sync nav item, seeds from
  `sync.status().conflictCount`, updates on every `sync:status` broadcast.

### Added — Bulk Operations

- **Mass edit:** select multiple Income/Expense rows, open a bulk edit modal, apply the
  same field patch to all selected rows.
- **Notion page icons on push:** every create/update sets a native page icon (arrow up/down,
  credit card, delivery truck) so rows are visually typed in Notion.

### Added — Desktop-only

- **QR Code offline cache:** QR image bytes are downloaded and cached as a `data:` URI during
  pull (Notion signed URLs expire in ~1h). Already-cached QRs are skipped on re-pull.
- **Apple Intelligence Chat:** read-only Apple Foundation Models helper (`fm-proxy`) for Mac
  users with Apple Intelligence enabled.
- **Keyboard shortcuts** across all sections.

### Fixed

- **Account & expense computations** now match Notion formulas exactly:
  - Current Balance = `ΣGrossIncome − (ΣExpenseAmount + ΣInterest) + ΣPasabuyReceived + ΣTransactionAmount`
  - Available Limit, Pasabuyer Balance, Payment/Purchase Made for credit accounts.
- **Notion archive/trash** no longer sticks records as Unsynced — soft-deletes are marked
  clean and push no longer loops on archived blocks.
- **Pull restored** for Notion-Version `2026-03-11` (data-sources API replaces deprecated
  `/v1/databases/.../query` path).
- **QR Code property name** fixed ("Qr Code" vs old "QR Code" — the old name never matched).

### Security

- Notion token is never written to SQLite, never logged, and never returned to the renderer.
- Every window runs with `contextIsolation`, `sandbox`, and `nodeIntegration: false`; all
  validation happens in the main process.
- OS keychain (`safeStorage`) for token encryption.

### Platform Notes

- **macOS:** unsigned build — right-click → Open once to pass Gatekeeper. Universal binary
  (Apple Silicon + Intel).
- **Windows:** NSIS installer, auto-update works fully (silent installer).
- **Linux:** AppImage, works if launched from a writable location.

### Auto-Update

Built-in auto-update via GitHub Releases (`electron-updater`). Checks on startup (~3s delay)
and manual "Check for Updates" in Settings → Updates.

## [0.1.0] - 2026-07-21

Internal development milestone (not publicly released).

[1.1.1]: https://github.com/work-w-chrstnrpj/Notable_Finance/releases/tag/v1.1.1
[1.1.0]: https://github.com/work-w-chrstnrpj/Notable_Finance/releases/tag/v1.1.0
[1.0.0]: https://github.com/work-w-chrstnrpj/Notable_Finance/releases/tag/v1.0.0
[0.1.0]: https://example.com/notable-finance/releases/tag/v0.1.0
