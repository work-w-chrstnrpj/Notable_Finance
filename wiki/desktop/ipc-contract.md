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
| `hardDelete(id)` | `true` (local row removed; Notion page queued for trash/archive on push) |

### `window.api.expenses`
`list(params)`, `create(dto)`, `update(id, dto)`, `softDelete(id)`, `hardDelete(id)` — expense DTO adapts by account/category (credit-card, Pasabuy fields).

### `window.api.expenseScheduler`
`list()`, `create(dto)`, `update(id, dto)`, `softDelete(id)`, `hardDelete(id)`, `generate(id)` (materialize a scheduled expense).

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
| `get(runs?)` | `HistoryData` | Unsynced items (dirty/conflict, incl. soft deletes + pending hard-deletes) derived live, plus `activity_log` events from the last `runs` sync passes (default 2) with status + direction, and last pull/push timestamps. |
| `discardUnsynced(resource, id)` | `true` | Cancel a never-synced create, or restore the last synced state for an unsynced edit/soft-delete/hard-delete (drops Notion-trash intent). |

### `window.api.sync`
| Method | Returns | Notes |
| --- | --- | --- |
| `status()` | `SyncStatus` | mode, interval, last push/pull, dirty count, conflict count, online. |
| `now()` | `SyncNowResult` | Full sync: pull then push. |
| `pull()` | `PullResult` | Notion → App only (incremental). |
| `push()` | `PushResult` | App → Notion only (dirty records). |
| `initialPull()` | `PullResult` | Full pull (onboarding). |
| `setMode({ mode, intervalSeconds })` | `SyncSettings` | `manual` \| `auto`. |
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
`get()`, `update(patch)` — durable UI prefs in SQLite `app_settings` (`ui.settings`):
profile (`displayName`, `avatarDataUrl`), theme, workspace view modes/date/sidebar/FAB/last section,
Income/Expense/Accounts/Monitoring filters, `hardDeleteEnabled`, and Chat flags
(`chatEnabled` default false, `chatPreferAppleReadOnly`, `chatDefaultModel`). Soft delete remains the default;
hard delete removes the local row and archives the Notion page to trash on push. Sync mode/interval
live under `window.api.sync`.

### `window.api.chat` (Phase 6 — Finance Copilot)
Opt-in AI chat. Credentials and delete-all-history work from Settings even when Chat is off.
Thread CRUD and `send` require `chatEnabled`. API keys are encrypted in OS `safeStorage` (never returned).
Overlays change tone only — never amounts, never finance delete, never auto-Approve.
**Apple Intelligence read-only (macOS):** when `chatPreferAppleReadOnly` and a real Foundation Models probe reports `appleAvailable`, ask/summarize skills may run without BYOK (bundled `fm-proxy`). Propose + Approve always require a named API key.

| Method | Returns | Notes |
| --- | --- | --- |
| `status(opts?)` | `ChatStatusDto` | Enabled flag, credential count, BYOK readiness, Apple probe (`appleAvailable`, `appleStatus`, `appleStatusLabel`, `appleDetail`, `appleReasonCode`, `canUseAppleReadOnly`). Optional `{ forceRefresh: true }` re-runs compatibility. |
| `providers()` | `ChatProviderCatalogDto[]` | Catalog of Gemini / Groq / Cerebras / OpenRouter / OpenCode / Mistral / Claude / OpenAI / Custom with free-tier model lists. |
| `models(credentialId?)` | `{ id, label, free? }[]` | Models for the credential’s provider (or full curated list). |
| `overlays()` | `{ id, slash, label, hint }[]` | Slash persona catalog (`/default`…`/quiet`). |
| `isAppleOs()` | `boolean` | Show Mac-only Configure AI controls. |
| `listCredentials()` / `createCredential(name, apiKey, opts?)` / `updateCredential(id, patch)` / `setDefaultCredential(id)` / `deleteCredential(id)` | credential DTOs / `true` | Name + API Key + optional `baseUrl` (OpenAI default, Gemini Google OpenAI-compat host, or custom). Fingerprint last-4 in DTO. |
| `listThreads()` / `getThread(id)` / `createThread(input?)` / `updateThread(id, patch)` / `deleteThread(id)` | thread DTOs / `true` | Requires Chat enabled. Thread `overlay` persists slash mode. |
| `deleteAllThreads()` | `true` | Clears conversation history only (not finance records). Allowed when Chat is off. |
| `listMessages(threadId)` | `ChatMessageDto[]` | Requires Chat enabled. |
| `send({ threadId?, content, credentialId?, modelId?, overlay? })` | `ChatSendResult` | BYOK agent loop **or** Apple FM read-only turn for ask skills (tools → prompt → on-device summarize). Slash tokens / `overlay` set persona. Returns optional `drafts[]` for confirm cards. Finance delete refused. Write skills without BYOK error with “Select an API credential for writes.” |
| `listDrafts(threadId?)` | `ChatDraftDto[]` | Pending `needs_input` / `ready` drafts. |
| `updateDraft(draftId, edits)` | `ChatDraftDto` | Applies user edits from the confirm card, re-runs the original `propose*` validator in place (same id), and re-derives `missingRequired` / `status`. `edits` uses unified keys (`name`, `amount`, `date`, `accountId`, `categoryId`, `transactedAccountId`, plus expense/CC/Pasabuy fields); the validator maps them per resource. Rejects `applied` / `cancelled` drafts and non-editable kinds. |
| `confirmDraft(draftId)` | `ChatConfirmResult` | Applies create/update when draft is complete **and** at least one BYOK credential exists; optional `quip`; broadcasts `records:changed`. Rejects incomplete / Apple-only / delete. |
| `cancelDraft(draftId)` | `ChatDraftDto & { quip? }` | Discards draft; no finance write; optional cancel ack. |

### `window.api.devLogs` (Dev Mode)
In-memory debug ring buffer (max 500). **Never persisted to SQLite.** Cleared on app quit or when `devModeEnabled` turns off. Logging is active only while Settings → Developer → Dev Mode is on.

| Method | Returns | Notes |
| --- | --- | --- |
| `list(limit?)` | `DevLogEntry[]` | Newest retained entries (clicks, IPC/api, operations, system). |
| `clear()` | `number` | Empties the buffer; returns prior count. |
| `append({ kind, action, message, detail?, ok? })` | `DevLogEntry \| null` | Renderer-originated click/nav/operation logs. No-ops when Dev Mode is off. Secrets redacted. |

Event: `devLogs:entry` — live stream of each new `DevLogEntry` to all windows.

## Events (main → renderer)

| Channel | Payload | When |
| --- | --- | --- |
| `records:changed` | `{ resource, ids }` | After a local write or a pull applies changes → renderer refetches. |
| `sync:status` | `SyncStatus` | Sync starts/progresses/ends; online/offline changes. |
| `sync:conflict` | `Conflict[]` | A pull produced true conflicts needing resolution. |
| `derived:updated` | `{ accounts?, categories? }` | Derived values recomputed → live balances/budgets. |
| `tabs:command` | `{ action: 'new' \| 'close' \| 'next' \| 'prev' }` | Focused window only — File/Window menu accelerators for in-window tabs. |
| `devLogs:entry` | `DevLogEntry` | Dev Mode — each new in-memory log line (all windows). |

Renderer subscribes via `window.api.on(channel, handler)` and unsubscribes on unmount.

## Type sources

DTOs (`Account`, `IncomeRecord`, `ExpenseRecord`, `DashboardSummary`, `SyncStatus`, …) are copied from the web app's `notable-finance-web/application/src/types/finance.ts` and `notable-finance-web/service/src/common/finance.types.ts` into the shared desktop types, keeping the two apps contract-compatible. See [`shared-core-and-monorepo.md`](shared-core-and-monorepo.md).

## Security notes

- The Notion **token is never sent to the renderer** — `connect(token)` sends it *into* main once, where it is encrypted; no getter returns it.
- Channels are explicitly allow-listed in preload; the renderer cannot invoke arbitrary channels.
- See [`security.md`](security.md).
