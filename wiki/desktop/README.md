# Notable Finance App — Desktop Docs

Documentation for the **local-first Electron desktop app**. It has the same features and business logic as the web app but keeps its own local SQLite database as the working source of truth and syncs bidirectionally with Notion.

For shared product intent, the finance glossary, and the canonical Notion field mapping, see [`../shared/`](../shared/).

## Documents

| Doc | Purpose | Priority |
| --- | --- | --- |
| [desktop-architecture.md](desktop-architecture.md) | Electron process model, tech stack, technical design (TDD) | P0 |
| [sync-and-conflict-design.md](sync-and-conflict-design.md) | The reconcile engine: three-way merge, conflict prompt, cadence | P0 |
| [local-data-schema.md](local-data-schema.md) | SQLite tables, sync columns, computed-locally rule, migrations | P0 |
| [ipc-contract.md](ipc-contract.md) | Renderer↔main channels — the desktop "API" | P0 |
| [offline-and-state-model.md](offline-and-state-model.md) | Offline behavior, sync-state badges, stale-data rule | P1 |
| [onboarding-and-notion-connect.md](onboarding-and-notion-connect.md) | Bring-your-own-Notion first run + schema verify | P1 |
| [security.md](security.md) | Token in keychain, process isolation, data at rest | P1 |
| [packaging-and-release.md](packaging-and-release.md) | electron-builder, mac/linux/windows, signing (future) | P1 |
| [project-structure.md](project-structure.md) | Folder layout and boundary intent | P1 |
| [shared-core-and-monorepo.md](shared-core-and-monorepo.md) | Copy-now/extract-later reuse strategy, pnpm workspace | P1 |
| [desktop-testing-strategy.md](desktop-testing-strategy.md) | Sync simulations, offline coverage, Electron e2e | P1 |
| [development-plan.md](development-plan.md) | Phased plan and milestones (~1 week) | — |
| [diagrams.md](diagrams.md) | Context, process, sync, merge, and state diagrams | — |

## Decisions locked (source for all docs)

- **Source of truth:** local SQLite; Notion is a bidirectional mirror/backup.
- **Sync:** instant local write; manual or configurable-interval push+pull; remote edits surface only after a pull.
- **Conflicts:** three-way merge with base snapshot; auto-merge disjoint fields; **prompt** on true same-field conflict; single-user so rare.
- **Computed fields:** never synced; recomputed locally (balances/budgets real-time, offline).
- **Deletes:** soft-delete (title rewrite + clear amount), retained.
- **Retention:** keep all history forever.
- **Multi-workspace:** bring-your-own-Notion; connection required at first run.
- **Platforms:** macOS, Linux, Windows; personal/unsigned now, signing later.
- **At rest:** OS disk encryption; token in OS keychain (safeStorage).
- **UI:** multi-window; never show stale data without a badge.
- **Reuse:** copy web logic into desktop (web untouched); pnpm workspaces.
- **Testing:** full offline + conflict simulations + Electron e2e.
