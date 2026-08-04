# Desktop Project Structure

Actual layout of `notable-finance-app/` as of the v2.0.0 refactor
(see [`refactor_development_plan.md`](refactor_development_plan.md)).

```
notable-finance-app/
├── package.json
├── electron.vite.config.ts        # build config (main / preload / renderer)
├── electron-builder.yml           # packaging config (mac/linux/windows)
├── drizzle.config.ts              # migration config
├── eslint.config.mjs              # lint gate (errors block CI; see refactor plan F4)
├── scripts/                       # seed-dev + the CSS split/verify tooling from Phase 8
├── src/
│   ├── main/                      # Electron main process — owns all data & side effects
│   │   ├── index.ts               # app bootstrap, window lifecycle
│   │   ├── windows/               # BrowserWindow management (multi-window)
│   │   ├── db/                    # SQLite connection, drizzle schema, migrations/
│   │   ├── domain/                # COPIED finance logic: validation, mapping, reporting/derivations
│   │   ├── notion/                # Notion adapter: client factory, property mapper, query, mutation
│   │   ├── sync/                  # reconcile engine, three-way merge, conflict, mutation queue, cursors
│   │   ├── chat/                  # AI chat orchestrator, tools, skills, overlays
│   │   ├── settings/              # app settings + keychain token access (safeStorage)
│   │   ├── updater/ dev-logs/ services/
│   │   └── ipc/                   # one registrar per domain — see below
│   │       ├── index.ts           # 22-line composition root, calls the six registrars
│   │       ├── handle.ts          # the `handle(channel, fn)` primitive (no monkey-patching)
│   │       ├── shared.ts          # result/changed helpers used by every registrar
│   │       └── records.ts · sync.ts · notion.ts · chat.ts · settings.ts · updater.ts
│   ├── preload/                   # contextBridge: typed, allow-listed window.api
│   │   └── index.ts
│   ├── renderer/
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── components/
│   │       │   ├── pages/         # one directory per god-page, index.tsx = composition only
│   │       │   │   ├── expense/   # index + tables/toolbar/form-fields/receipt/cover-modal
│   │       │   │   ├── income/    # index + toolbar/form-fields/mass-edit-fields
│   │       │   │   ├── workflow/  # index + form hook/fields
│   │       │   │   ├── chat/      # index + sidebar/message-stream/composer/draft-card
│   │       │   │   ├── settings-modals/   # one file per modal + barrel index.tsx
│   │       │   │   └── dashboard · accounts · monitoring · history · sync · settings · dev-logs
│   │       │   ├── layout/ ui/ charts/ fab/ export/ shortcuts/
│   │       │   └── finance-workspace.tsx
│   │       ├── features/records/  # shared record-page engine (see below)
│   │       ├── lib/               # window.api client wrapper, query hooks, router, contexts
│   │       ├── types/             # re-exports from @shared — no domain redefinitions
│   │       └── assets/            # globals.css = @import list only; rules live in
│   │                              #   base/ layout/ components/ pages/ + *.module.css
│   └── shared/                    # types + IPC channel constants shared across processes
│       ├── finance.types.ts
│       └── ipc-channels.ts        # single source of truth for request/response channels
├── e2e/                           # Playwright + Electron end-to-end tests
└── test/                          # unit/integration tests (sync, domain, db)
```

## The shared record-page engine

`renderer/src/features/records/` exists because Income, Expense and Workflow each
reimplemented the same mechanisms. Each hook was extracted from **≥2 real call sites** —
none is speculative:

| Module | Responsibility |
|---|---|
| `use-record-selection.ts` | `selectedIds` / `disabledIds` / toggle / select-all |
| `use-persisted-filters.ts` | hydrate filters from settings + debounced write-back |
| `use-record-search.ts` | fuzzy search wiring, parameterised by field extractor |
| `use-optimistic-records.ts` | temp-id → `applyLocal` → commit or rollback (`commit` / `commitMany` / `commitDelete`) |
| `use-bulk-actions.ts` | the bulk-action dispatcher; capabilities gated by omission |
| `receipt.ts` | receipt row/context construction |

Per-page differences are **parameterised, never unified silently** — Income and Workflow
simply don't pass `onPrint`/`onCover`, so they don't get those actions.

## Boundary intent

- **main** is the only place with filesystem, SQLite, network, and secret access.
- **preload** is the sole bridge; it exposes exactly the [`ipc-contract.md`](ipc-contract.md) surface.
- **renderer** is untrusted UI: no Node, no direct DB/Notion access.
- **shared** holds DTOs/types kept contract-compatible with the web app.

## Monorepo placement

`notable-finance-app/` sits beside `notable-finance-web/` under the repo root, managed with **pnpm workspaces**. Shared domain logic is **copied** into `src/main/domain` for now (web left untouched); extracting a shared package is a future step. See [`shared-core-and-monorepo.md`](shared-core-and-monorepo.md).
