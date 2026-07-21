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

**Phase 0 complete** (2026-07-21):

- **0.1** — pnpm workspace + electron-vite scaffold; window boots with Vite HMR.
- **0.2** — better-sqlite3 (rebuilt for Electron) + drizzle; migrations run on start, creating
  the local DB in `userData`.
- **0.3** — finance DTOs, resource helpers, and local derivations copied/implemented in
  `src/shared` + `src/main/domain`; 16 derivation unit tests pass.
- **0.4** — contextBridge preload + `ipcMain.handle` skeleton (`app:ping`, `db:health`) using
  the `ApiResult` envelope; renderer↔main roundtrip verified.

Build, typecheck, and tests are clean. Next: Phase 1 (offline CRUD + ported pages). See
[`../wiki/desktop/development-plan.md`](../wiki/desktop/development-plan.md) and the progress
tracker at [`../wiki/desktop/desktop-development-plan.xlsx`](../wiki/desktop/desktop-development-plan.xlsx).

## Run it

```bash
pnpm install                              # from the repo root (approves native builds at the gate)
pnpm --filter notable-finance-app rebuild # compile better-sqlite3 for Electron's ABI
pnpm --filter notable-finance-app dev     # boots the window with HMR
pnpm --filter notable-finance-app test    # run the derivation unit tests
```

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
