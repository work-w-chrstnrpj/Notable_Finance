# Desktop Architecture (Technical Design)

The technical design for **Notable Finance App**, the local-first Electron desktop client. This is the desktop analog of the web app's TDD.

## Goals

- **Local-first:** local SQLite is the working source of truth; the app is fully usable offline.
- **Real-time derived values:** balances/budgets recompute locally on every edit, before any sync.
- **Same business logic as the web app:** domain/reporting logic is copied from `notable-finance-web/service`, not re-invented.
- **Bring-your-own-Notion:** no workspace details hardcoded; configured at first run.
- **Cross-platform:** macOS, Linux, Windows.

## Technology choices

| Concern | Choice | Rationale |
| --- | --- | --- |
| Shell / build | Electron + `electron-vite` + `electron-builder` | Fast HMR, TS-native, clean main/preload/renderer split, cross-platform packaging |
| Local DB | `better-sqlite3` (synchronous, in main process) | Embedded, fast, no server; ideal for offline-first |
| ORM / migrations | `drizzle-orm` | Lightweight, TS-first, explicit migration files |
| Notion client | `@notionhq/client` (in main process) | Reused adapter logic from the web service |
| Token storage | Electron `safeStorage` (OS keychain) | Never store the Notion token in plaintext |
| Renderer | React (components ported from the web app) | Reuse presentational UI |
| IPC | `contextBridge` + preload, typed channels | Renderer stays sandboxed; never touches SQLite or Notion directly |
| Monorepo | pnpm workspaces | Good support for shared packages; desktop copies domain logic for now (web left untouched) |

## Process model

```
┌───────────────────────────── Electron ─────────────────────────────┐
│                                                                     │
│  Renderer (React UI)      Preload (contextBridge)     Main process  │
│  ─ multi-window           ─ typed, allow-listed  ─ SQLite (better-  │
│  ─ no Node/SQLite/        │  IPC surface only         sqlite3)      │
│    Notion access          │                     ─ Sync engine       │
│  ─ calls window.api.*  ───┼──────────────────►  ─ Notion adapter    │
│    over IPC               │                     ─ Domain/reporting   │
│  ◄────────── events ──────┼─────────────────────  logic (copied)    │
│    (sync status, etc.)    │                     ─ Keychain token     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                      │  bidirectional sync (pull/push)
                                      ▼
                                   Notion  (mirror / backup)
```

- **Main process** owns all data and side effects: the SQLite database, the sync engine, the Notion adapter, the domain/reporting logic, and the encrypted Notion token. It is the only place with filesystem, database, and network access.
- **Preload** exposes a **typed, allow-listed** API (`window.api.*`) via `contextBridge`. `contextIsolation` is on and `nodeIntegration` is off. See [`ipc-contract.md`](ipc-contract.md).
- **Renderer** is the React UI. It has no direct access to SQLite, Notion, or Node APIs — it calls `window.api.*` and subscribes to events. Supports **multiple windows** and **in-window tabs** (each tab is a section view); all windows/tabs talk to the single main-process data owner so data stays live.

## Layered structure (main process)

```
main/
├── db/            SQLite connection, drizzle schema, migrations
├── domain/        copied finance logic: validation, mapping, reporting/derivations
├── notion/        Notion adapter: client factory, property mapper, query, mutation
├── sync/          reconcile engine, conflict detection, mutation queue, cursors
├── config/        app settings (sync mode/interval), keychain token access
├── ipc/           IPC handlers registered per channel
└── windows/       BrowserWindow lifecycle, multi-window management
```

## Data flow

**Local write (instant):**
1. Renderer calls `window.api.expenses.create(dto)`.
2. Main validates (copied domain logic), writes to SQLite with `sync_state = 'dirty'` and a local UUID.
3. Main recomputes affected derived values (balances, budgets) from SQLite.
4. Main returns the record + emits an update event; renderer re-renders with a "not yet synced" badge.

**Sync (manual or interval):** see [`sync-and-conflict-design.md`](sync-and-conflict-design.md). Push dirty records → pull remote changes since cursor → reconcile → prompt on true conflict → refresh derived values.

## Key architectural rules

- **Derived values are computed, never persisted as truth.** Balances/budgets are always recomputed from current SQLite records. See [`local-data-schema.md`](local-data-schema.md#derived-values-are-computed-not-stored).
- **Only writable fields are pushed** to Notion (see [`../shared/notion-field-mapping.md`](../shared/notion-field-mapping.md)).
- **The renderer is untrusted-by-design.** All validation and all secrets live in main.
- **Web app is untouched.** Shared logic is copied into `notable-finance-app`; extracting a shared package is a future refactor. See [`shared-core-and-monorepo.md`](shared-core-and-monorepo.md).

## Related documents

- [`sync-and-conflict-design.md`](sync-and-conflict-design.md) · [`local-data-schema.md`](local-data-schema.md) · [`ipc-contract.md`](ipc-contract.md) · [`offline-and-state-model.md`](offline-and-state-model.md) · [`security.md`](security.md) · [`packaging-and-release.md`](packaging-and-release.md)
- Planned Chat copilot (Phase 6): [`chat-agent-design.md`](chat-agent-design.md) · [`chat-skills-and-overlays.md`](chat-skills-and-overlays.md) · checklist in [`development-plan.md`](development-plan.md)
