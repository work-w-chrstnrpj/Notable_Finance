# IPC Contract (Renderer ↔ Main)

The desktop app's internal "API". Because the renderer has no direct access to SQLite, Notion, or Node, every data operation crosses the process boundary through a **typed, allow-listed** IPC surface exposed by the preload script as `window.api`.

This is the desktop analog of the web app's HTTP API specification.

## Boundary rules

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` on every window.
- The preload uses `contextBridge.exposeInMainWorld('api', …)`. Only the channels below are exposed.
- **All validation happens in main.** The renderer is untrusted; it cannot bypass validation or reach secrets.
- Two shapes: **request/response** (`ipcRenderer.invoke` → `ipcMain.handle`) and **events** (main → renderer via `webContents.send`).
- Every response uses a discriminated result: `{ ok: true, data } | { ok: false, error: { code, message, details? } }` (mirrors the web `ApiResult`).

## Namespaces (request/response)

### `window.api.accounts`
| Method | Returns | Notes |
| --- | --- | --- |
| `list(params?)` | `Account[]` | Active by default; `current_balance`/`available_limit` are computed in main. |
| `get(id)` | `Account` | |

Accounts/categories are read-only reference — no create/update/delete.

### `window.api.incomes` / `window.api.transactions`
| Method | Returns |
| --- | --- |
| `list(params)` | `IncomeRecord[]` (scoped by view/month) |
| `create(dto)` | `IncomeRecord` (instant local write, `dirty`) |
| `update(id, dto)` | `IncomeRecord` |
| `softDelete(id)` | `IncomeRecord` (title rewrite + amount cleared) |

### `window.api.expenses`
`list(params)`, `create(dto)`, `update(id, dto)`, `softDelete(id)` — expense DTO adapts by account/category (credit-card, Pasabuy fields).

### `window.api.expenseScheduler`
`list()`, `create(dto)`, `update(id, dto)`, `softDelete(id)`, `generate(id)` (materialize a scheduled expense).

### `window.api.reports`
| Method | Returns | Notes |
| --- | --- | --- |
| `dashboard(month)` | `DashboardSummary` | Computed locally from scoped records. |
| `monthlyMonitoring(month)` | `MonthlyMonitoring` | Computed locally. |

### `window.api.categories`
`incomeCategories(params)`, `expenseCategories(params)` — read-only selectors.

### `window.api.history`
| Method | Returns | Notes |
| --- | --- | --- |
| `get(runs?)` | `HistoryData` | Unsynced items (dirty/conflict, incl. soft deletes) derived live, plus `activity_log` events from the last `runs` sync passes (default 2) with status + direction, and last pull/push timestamps. |

### `window.api.sync`
| Method | Returns | Notes |
| --- | --- | --- |
| `status()` | `SyncStatus` | mode, interval, last push/pull, dirty count, conflict count, online. |
| `now()` | `SyncResult` | Trigger a manual push+pull pass. |
| `setMode({ mode, intervalSeconds })` | `SyncStatus` | `manual` \| `auto`. |
| `listConflicts()` | `Conflict[]` | Unresolved conflicts. |
| `resolveConflict(id, resolution)` | `Conflict` | `resolution`: per-field `local`/`remote` choices, or `keepLocal`/`keepRemote`. |

### `window.api.notion` (onboarding)
| Method | Returns | Notes |
| --- | --- | --- |
| `connect(token)` | `ConnectResult` | Token stored via keychain; never returned to renderer. |
| `isConnected()` | `boolean` | |
| `discoverDatabases()` | `DiscoveredDb[]` | For mapping during onboarding. |
| `verifySchema()` | `SchemaReport` | Drift report against expected fields. |
| `saveMapping(mapping)` | `void` | Persist per-workspace db/property mapping. |

### `window.api.settings`
`get()`, `update(patch)` — sync mode/interval, window prefs, theme. Never touches the token.

## Events (main → renderer)

| Channel | Payload | When |
| --- | --- | --- |
| `records:changed` | `{ resource, ids }` | After a local write or a pull applies changes → renderer refetches. |
| `sync:status` | `SyncStatus` | Sync starts/progresses/ends; online/offline changes. |
| `sync:conflict` | `Conflict[]` | A pull produced true conflicts needing resolution. |
| `derived:updated` | `{ accounts?, categories? }` | Derived values recomputed → live balances/budgets. |

Renderer subscribes via `window.api.on(channel, handler)` and unsubscribes on unmount.

## Type sources

DTOs (`Account`, `IncomeRecord`, `ExpenseRecord`, `DashboardSummary`, `SyncStatus`, …) are copied from the web app's `notable-finance-web/application/src/types/finance.ts` and `notable-finance-web/service/src/common/finance.types.ts` into the shared desktop types, keeping the two apps contract-compatible. See [`shared-core-and-monorepo.md`](shared-core-and-monorepo.md).

## Security notes

- The Notion **token is never sent to the renderer** — `connect(token)` sends it *into* main once, where it is encrypted; no getter returns it.
- Channels are explicitly allow-listed in preload; the renderer cannot invoke arbitrary channels.
- See [`security.md`](security.md).
