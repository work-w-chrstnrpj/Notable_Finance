# Desktop Project Structure

Proposed layout for `notable-finance-app/`. Subject to refinement during scaffolding; the boundaries below are the intent.

```
notable-finance-app/
├── package.json
├── electron.vite.config.ts        # build config (main / preload / renderer)
├── electron-builder.yml           # packaging config (mac/linux/windows)
├── drizzle.config.ts              # migration config
├── src/
│   ├── main/                      # Electron main process — owns all data & side effects
│   │   ├── index.ts               # app bootstrap, window lifecycle
│   │   ├── windows/               # BrowserWindow management (multi-window)
│   │   ├── db/                    # SQLite connection, drizzle schema, migrations/
│   │   ├── domain/                # COPIED finance logic: validation, mapping, reporting/derivations
│   │   ├── notion/                # Notion adapter: client factory, property mapper, query, mutation
│   │   ├── sync/                  # reconcile engine, three-way merge, conflict, mutation queue, cursors
│   │   ├── config/                # app settings + keychain token access (safeStorage)
│   │   └── ipc/                   # ipcMain.handle registrations per namespace
│   ├── preload/                   # contextBridge: typed, allow-listed window.api
│   │   └── index.ts
│   ├── renderer/                  # React UI (components ported from the web app)
│   │   ├── main.tsx
│   │   ├── pages/                 # Dashboard, Accounts, Income, Expense, Monitoring, Transfer, CC Payment, Alkansya, Receivables
│   │   ├── components/            # ported presentational components + sync-status/conflict UI
│   │   └── lib/                   # window.api client wrapper, query hooks
│   └── shared/                    # types shared across main/preload/renderer (DTOs copied from web)
├── e2e/                           # Playwright + Electron end-to-end tests
└── test/                          # unit/integration tests (sync, domain, db)
```

## Boundary intent

- **main** is the only place with filesystem, SQLite, network, and secret access.
- **preload** is the sole bridge; it exposes exactly the [`ipc-contract.md`](ipc-contract.md) surface.
- **renderer** is untrusted UI: no Node, no direct DB/Notion access.
- **shared** holds DTOs/types kept contract-compatible with the web app.

## Monorepo placement

`notable-finance-app/` sits beside `notable-finance-web/` under the repo root, managed with **pnpm workspaces**. Shared domain logic is **copied** into `src/main/domain` for now (web left untouched); extracting a shared package is a future step. See [`shared-core-and-monorepo.md`](shared-core-and-monorepo.md).
