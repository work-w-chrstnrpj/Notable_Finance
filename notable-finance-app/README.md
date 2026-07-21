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

Scaffolding not started. See the design write-up in the wiki for the full plan.

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
