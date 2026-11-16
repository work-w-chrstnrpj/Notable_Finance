# Architecture

> Status: ADOPTED (retroactive, from the existing codebase and `wiki/desktop/`)

Notable Finance is one Electron desktop app, `notable-finance-app/`. Local SQLite is the working source of truth. Notion is a bidirectional mirror. The deep technical design lives in [`wiki/desktop/desktop-architecture.md`](../wiki/desktop/desktop-architecture.md); this page is the one-page map.

## Modules

| Module | Responsibility | Code | ADRs |
|---|---|---|---|
| Main process | Owns all data and side effects: database, sync, Notion, secrets, files | `notable-finance-app/src/main/` | [0001](adr/0001-local-first-sqlite-source-of-truth.md), [0002](adr/0002-main-owns-data-renderer-untrusted.md) |
| DB | SQLite connection, Drizzle schema, additive migrations, repositories | `notable-finance-app/src/main/db/` | 0001 |
| Domain | Validation, mapping, balances, monitoring and report derivations | `notable-finance-app/src/main/domain/` | [0004](adr/0004-derived-values-computed-not-stored.md) |
| Notion adapter | Client, property mapper, page extractors, schema spec, token store | `notable-finance-app/src/main/notion/` | [0003](adr/0003-notion-as-bidirectional-mirror.md) |
| Sync | Pull, push, three-way merge, conflicts, scheduler | `notable-finance-app/src/main/sync/` | 0003 |
| IPC | One registrar per domain behind a single `handle()` primitive | `notable-finance-app/src/main/ipc/` | 0002 |
| Services | Backup and restore, history, reports, page content, discard-unsynced | `notable-finance-app/src/main/services/` | 0001 |
| Chat | AI chat orchestrator, read and write tools, credentials vault | `notable-finance-app/src/main/chat/` | None |
| Record rules | Soft delete for incomes and expenses; accounts and categories are read-only | `notable-finance-app/src/main/domain/`, `notable-finance-app/src/main/notion/` | [0005](adr/0005-soft-delete-and-read-only-reference-data.md) |
| Updater | electron-updater against GitHub Releases | `notable-finance-app/src/main/updater/` | None |
| Preload | The only bridge: an allow-listed `window.api` via `contextBridge` | `notable-finance-app/src/preload/` | 0002 |
| Shared contracts | DTOs, IPC channel names, pure formulas used by both sides | `notable-finance-app/src/shared/` | 0002, 0004 |
| Renderer | React UI: pages, record-page engine, API client, UI settings | `notable-finance-app/src/renderer/src/` | 0002 |

## Data flow

1. **Local write.** The renderer calls `window.api.*`. Main validates, writes SQLite with `sync_state = dirty`, recomputes derived values and returns the record. No network is needed.
2. **Reads and reports.** Dashboard, Monitoring, balances and totals are computed on demand from local rows (`domain/derivations.ts`, `services/reports.ts`). Monitoring's Need/Wants/Savings split is the one value read from Notion on demand and cached for 5 minutes.
3. **Sync** (manual or on an interval): pull from Notion, three-way merge against each record's base snapshot, prompt on true conflicts, push clean dirty records, pull again, refresh the UI.
4. **Backup.** A consistent SQLite snapshot is exported and imported by `services/backup.ts`.

## External systems

| System | Used for | Boundary |
|---|---|---|
| Notion API | Mirror and backup of finance records; reference data (accounts, categories) | Main process only, through `src/main/notion/` |
| GitHub Releases | Installers and auto-update | `src/main/updater/`, `.github/workflows/release-desktop.yml` |
| AI providers (chat) | Optional chat copilot | `src/main/chat/`, keys in the OS-encrypted vault |
| OS keychain (Electron `safeStorage`) | Notion token and chat credentials | `src/main/notion/token-store.ts`, `src/main/chat/credentials-vault.ts` |

## Trust boundaries

- **Renderer to main:** the renderer is untrusted by design. `contextIsolation` is on and `nodeIntegration` is off. Every call crosses the allow-listed preload surface (`src/shared/ipc-channels.ts`), and main validates all input.
- **App to Notion:** only writable fields are pushed. Computed fields (formulas, rollups) are never written. The Notion token never reaches the renderer.
- **Secrets:** tokens and API keys live in `safeStorage` vault files, never in SQLite and never in exports.
- **Backups:** an imported backup from a newer app version is refused.

## Where the rest is documented

`wiki/desktop/` (sync design, local schema, IPC contract, security, packaging, testing), `wiki/shared/` (product specification, Notion field mapping, finance glossary). These remain canonical for their areas; this page and `docs/adr/` link to them and do not replace them.
