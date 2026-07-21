# Onboarding & Notion Connect

The desktop app is **bring-your-own-Notion**: single-user per installation, but not hardcoded to one workspace. On first run the user connects their own Notion integration and maps/verifies their databases. This is what makes the app shareable to other people using their own Notion.

## First-run flow

```
1. Welcome
2. Connect Notion        → user pastes their Notion integration token
3. Discover databases    → app lists databases the integration can access
4. Map databases         → user maps Accounts / Incomes / Expenses / Categories /
                           Scheduler / Monthly Monitoring to their databases
5. Verify schema         → app checks each mapped db has the expected fields/types
6. Initial pull          → app populates local SQLite from Notion
7. Ready                 → app opens; fully local from here on
```

Notion connection is **required at first run** — the app cannot function without a mapped workspace. After onboarding, normal operation is fully local/offline; the connection is used only during sync.

## Token handling

- The token is entered once and sent into the main process via `window.api.notion.connect(token)`.
- Main stores it encrypted with Electron **`safeStorage`** (OS keychain). It is **never** written to SQLite, never logged, and never returned to the renderer.
- See [`security.md`](security.md).

## Database discovery & mapping

- `window.api.notion.discoverDatabases()` returns databases the integration can read.
- The user maps each app resource to one of their databases. The mapping (database ids + per-field property names) is stored in `app_settings` / a mapping table — **not** as source constants.
- This mirrors the web app's `notion-connect` flow and the field taxonomy in [`../shared/notion-field-mapping.md`](../shared/notion-field-mapping.md).

## Schema verification

- `window.api.notion.verifySchema()` compares each mapped database's properties against the expected set (names, types, whether a field is a formula/rollup/relation).
- Produces a **drift report**: missing fields, type mismatches, unmapped required fields. Reuses the web app's schema-drift logic.
- The user can re-run verification any time from settings (e.g. after changing their Notion structure).

## Re-onboarding / multiple workspaces

- One active workspace per installation. Switching workspaces re-runs mapping + verification and re-initializes the local store.
- Because nothing is hardcoded, a second person can install the app and connect a differently-structured Notion, as long as it satisfies schema verification.

## Related

- [`security.md`](security.md) · [`ipc-contract.md`](ipc-contract.md) · [`../shared/notion-field-mapping.md`](../shared/notion-field-mapping.md)
