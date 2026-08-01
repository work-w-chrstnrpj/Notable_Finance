import { ipcMain } from 'electron'
import type {
  ApiResult,
  CreateExpenseInput,
  CreateIncomeInput,
  CreateSchedulerInput,
  HealthData,
  IncomeListParams,
  ExpenseListParams,
  UpdateExpenseInput,
  UpdateIncomeInput,
  UpdateSchedulerInput,
  PageContentResource
} from '../../shared/finance.types'
import { getDbPath, listTables } from '../db'
import * as repo from '../db/repositories'
import * as reports from '../services/reports'
import * as pageContent from '../services/page-content'
import { exportBackup, importBackup, inspectBackup } from '../services/backup'
import { getHistory, getItemDetail } from '../services/history'
import { discardUnsynced } from '../services/discard-unsynced'
import * as notion from '../notion/service'
import { getMapping, saveMapping } from '../notion/mapping-store'
import { fetchMonitoringSplit } from '../notion/monitoring-split'
import {
  getSyncSettings,
  listConflicts,
  pullAll,
  pushAll,
  resetDatabase,
  resolveAllConflicts,
  resolveConflict,
  setSyncSettings,
  syncNow,
  syncStatus
} from '../sync'
import { reschedule } from '../sync/scheduler'
import { broadcast, createWindow } from '../windows'
import { ValidationError } from '../domain/validation'
import type {
  ConflictResolution,
  NotionMapping,
  SyncSettings
} from '../../shared/finance.types'
import { getUiSettings, setUiSettings } from '../settings/ui'
import * as chat from '../chat'
import {
  CHAT_CURATED_MODELS,
  listChatProviders,
  modelsForProvider,
  providerPresetFromBaseUrl
} from '../chat/models'
import {
  appendDevLog,
  clearDevLogs,
  listDevLogs,
  logDevOperation,
  summarizeForDevLog
} from '../dev-logs/store'
import type { DevLogKind } from '../../shared/finance.types'
import { checkForUpdatesNow, isUpdateDownloaded, installUpdate } from '../updater'

// IPC surface per wiki/desktop/ipc-contract.md. Every response is the discriminated
// ApiResult envelope; all validation happens here in main (renderer is untrusted).
// Writes broadcast records:changed + derived:updated to ALL windows (Phase 1.5).

const SKIP_DEV_LOG_CHANNELS = new Set([
  'devLogs:list',
  'devLogs:clear',
  'devLogs:append',
  'app:ping',
  'settings:get'
])

async function result<T>(fn: () => T | Promise<T>): Promise<ApiResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (error) {
    return {
      ok: false,
      error: {
        code: error instanceof ValidationError ? error.code : 'E_IPC_HANDLER',
        message: error instanceof Error ? error.message : String(error)
      }
    }
  }
}

function changed(resource: 'incomes' | 'expenses' | 'expenseScheduler', ids: string[]): void {
  broadcast('records:changed', { resource, ids })
  broadcast('derived:updated', {})
  broadcast('sync:status', syncStatus())
  logDevOperation('records:changed', `Broadcast ${resource}`, { resource, ids })
}

function installDevLogIpcWrapper(): void {
  const originalHandle = ipcMain.handle.bind(ipcMain)
  ipcMain.handle = ((channel: string, listener: (...args: unknown[]) => unknown) => {
    return originalHandle(channel, async (event, ...args) => {
      if (SKIP_DEV_LOG_CHANNELS.has(channel)) {
        return listener(event, ...args)
      }
      const started = Date.now()
      try {
        const out = await listener(event, ...args)
        const ok =
          out && typeof out === 'object' && 'ok' in (out as object)
            ? Boolean((out as ApiResult<unknown>).ok)
            : true
        if (!ok) {
          appendDevLog({
            kind: 'api',
            source: 'main',
            action: channel,
            message: `IPC ${channel} failed`,
            detail: {
              args: summarizeForDevLog(args)
            } as Record<string, unknown>,
            durationMs: Date.now() - started,
            ok: false
          })
        }
        return out
      } catch (error) {
        appendDevLog({
          kind: 'api',
          source: 'main',
          action: channel,
          message: `IPC ${channel} threw`,
          detail: {
            args: summarizeForDevLog(args),
            error: error instanceof Error ? error.message : String(error)
          } as Record<string, unknown>,
          durationMs: Date.now() - started,
          ok: false
        })
        throw error
      }
    })
  }) as typeof ipcMain.handle
}

export function registerIpc(): void {
  installDevLogIpcWrapper()

  // Dev Mode logs (in-memory only; gated by settings.devModeEnabled inside store).
  ipcMain.handle('devLogs:list', (_e, limit?: number) =>
    result(() => listDevLogs(typeof limit === 'number' ? limit : undefined))
  )
  ipcMain.handle('devLogs:clear', () => result(() => clearDevLogs()))
  ipcMain.handle(
    'devLogs:append',
    (
      _e,
      input: {
        kind: DevLogKind
        action: string
        message: string
        detail?: Record<string, unknown> | null
        ok?: boolean | null
      }
    ) =>
      result(() => {
        const entry = appendDevLog({
          kind: input.kind,
          source: 'renderer',
          action: input.action,
          message: input.message,
          detail: input.detail
            ? (summarizeForDevLog(input.detail) as Record<string, unknown>)
            : null,
          ok: input.ok ?? null
        })
        return entry
      })
  )

  // liveness + local store health (Phase 0.4)
  ipcMain.handle('app:ping', () => result(() => 'pong' as const))
  ipcMain.handle('db:health', () =>
    result<HealthData>(() => ({ dbPath: getDbPath(), tables: listTables() }))
  )

  // accounts (read-only reference; balances computed in main)
  ipcMain.handle('accounts:list', (_e, params?: { includeInactive?: boolean }) =>
    result(() => repo.listAccounts(params?.includeInactive ?? false))
  )

  // categories (read-only selectors)
  ipcMain.handle('categories:income', () => result(() => repo.listIncomeCategories()))
  ipcMain.handle('categories:expense', () => result(() => repo.listExpenseCategories()))

  // incomes + income-backed views
  ipcMain.handle('incomes:list', (_e, params?: IncomeListParams) =>
    result(() => repo.listIncomes(params))
  )
  ipcMain.handle('incomes:get', (_e, id: string) =>
    result(() => repo.getIncome(id))
  )
  ipcMain.handle('incomes:create', (_e, input: CreateIncomeInput) =>
    result(() => {
      const record = repo.createIncome(input)
      changed('incomes', [record.id])
      return record
    })
  )
  ipcMain.handle('incomes:update', (_e, id: string, patch: UpdateIncomeInput) =>
    result(() => {
      const record = repo.updateIncome(id, patch)
      changed('incomes', [id])
      return record
    })
  )
  ipcMain.handle('incomes:softDelete', (_e, id: string) =>
    result(() => {
      const record = repo.softDeleteIncome(id)
      changed('incomes', [id])
      return record
    })
  )
  ipcMain.handle('incomes:hardDelete', (_e, id: string) =>
    result(() => {
      repo.hardDeleteIncome(id)
      changed('incomes', [id])
      return true
    })
  )

  // expenses
  ipcMain.handle('expenses:list', (_e, params?: ExpenseListParams) =>
    result(() => repo.listExpenses(params))
  )
  ipcMain.handle('expenses:listForCCCoverage', () =>
    result(() => repo.listExpensesForCCCoverage())
  )
  ipcMain.handle('expenses:create', (_e, input: CreateExpenseInput) =>
    result(() => {
      const record = repo.createExpense(input)
      changed('expenses', [record.id])
      return record
    })
  )
  ipcMain.handle('expenses:update', (_e, id: string, patch: UpdateExpenseInput) =>
    result(() => {
      const record = repo.updateExpense(id, patch)
      changed('expenses', [id])
      return record
    })
  )
  ipcMain.handle('expenses:softDelete', (_e, id: string) =>
    result(() => {
      const record = repo.softDeleteExpense(id)
      changed('expenses', [id])
      return record
    })
  )
  ipcMain.handle('expenses:hardDelete', (_e, id: string) =>
    result(() => {
      repo.hardDeleteExpense(id)
      changed('expenses', [id])
      return true
    })
  )

  // expense scheduler
  ipcMain.handle('scheduler:list', () => result(() => repo.listScheduler()))
  ipcMain.handle('scheduler:create', (_e, input: CreateSchedulerInput) =>
    result(() => {
      const record = repo.createScheduler(input)
      changed('expenseScheduler', [record.id])
      return record
    })
  )
  ipcMain.handle('scheduler:update', (_e, id: string, patch: UpdateSchedulerInput) =>
    result(() => {
      const record = repo.updateScheduler(id, patch)
      changed('expenseScheduler', [id])
      return record
    })
  )
  ipcMain.handle('scheduler:softDelete', (_e, id: string) =>
    result(() => {
      const record = repo.softDeleteScheduler(id)
      changed('expenseScheduler', [id])
      return record
    })
  )
  ipcMain.handle('scheduler:hardDelete', (_e, id: string) =>
    result(() => {
      repo.hardDeleteScheduler(id)
      changed('expenseScheduler', [id])
      return true
    })
  )
  ipcMain.handle('scheduler:generate', (_e, id: string) =>
    result(() => {
      const expense = repo.generateFromScheduler(id)
      changed('expenses', [expense.id])
      changed('expenseScheduler', [id])
      return expense
    })
  )

  // history (unsynced items + completed sync activity feed)
  ipcMain.handle('history:get', (_e, runs?: number) => result(() => getHistory(runs)))
  ipcMain.handle(
    'history:discardUnsynced',
    (_e, resource: 'incomes' | 'expenses', recordId: string) =>
      result(() => {
        discardUnsynced(resource, recordId)
        changed(resource, [recordId])
        return true
      })
  )
  ipcMain.handle('history:getItemDetail', (_e, resource: 'incomes' | 'expenses', recordId: string) =>
    result(() => getItemDetail(resource, recordId))
  )

  // reports (computed locally, Phase 1.3)
  ipcMain.handle('reports:dashboard', (_e, month: string) =>
    result(() => reports.dashboard(month))
  )
  ipcMain.handle('reports:monthlyMonitoring', (_e, month: string) =>
    result(() => reports.monitoring(month))
  )
  ipcMain.handle('reports:monitoringSplit', (_e, opts?: { forceRefresh?: boolean }) =>
    result(() => fetchMonitoringSplit(opts))
  )

  // windows (Phase 1.5)
  ipcMain.handle('windows:new', () =>
    result(() => {
      createWindow()
      return true as const
    })
  )

  // notion onboarding (Phase 2.1/2.2) — the token goes IN once; nothing returns it.
  ipcMain.handle('notion:connect', (_e, token: string) => result(() => notion.connect(token)))
  ipcMain.handle('notion:isConnected', () => result(() => notion.isConnected()))
  ipcMain.handle('notion:disconnect', () =>
    result(() => {
      notion.disconnect()
      return true as const
    })
  )
  ipcMain.handle('notion:discoverDatabases', () => result(() => notion.discoverDatabases()))
  ipcMain.handle('notion:getMapping', () => result(() => getMapping()))
  ipcMain.handle('notion:saveMapping', (_e, mapping: NotionMapping) =>
    result(() => {
      saveMapping(mapping)
      return true as const
    })
  )
  ipcMain.handle('notion:verifySchema', () => result(() => notion.verifySchema()))

  // sync (Phase 2.3 push + Phase 3 pull + Phase 4 reconcile)
  ipcMain.handle('sync:status', () => result(() => syncStatus()))
  ipcMain.handle('sync:now', (_e, since?: string) => result(() => syncNow(since))) // reconcile (pull) then push
  ipcMain.handle('sync:pull', (_e, since?: string) => result(() => pullAll(false, since))) // Notion → App only
  ipcMain.handle('sync:push', () => result(() => pushAll())) // App → Notion only

  // Local database backup / restore (Phase 7.2) — import swaps the live file,
  // so the renderer reloads its window after a successful import.
  ipcMain.handle('backup:export', (_e, opts?: { path?: string }) =>
    result(() => exportBackup(opts?.path))
  )
  ipcMain.handle('backup:inspect', (_e, opts?: { path?: string }) =>
    result(() => inspectBackup(opts?.path))
  )
  ipcMain.handle('backup:import', (_e, path: string) =>
    result(async () => {
      const out = await importBackup(path)
      if (out.valid) {
        // Fresh data everywhere: records, derived values, sync status.
        broadcast('records:changed', { resource: 'incomes', ids: [] })
        broadcast('records:changed', { resource: 'expenses', ids: [] })
        broadcast('derived:updated', {})
        broadcast('sync:status', syncStatus())
        logDevOperation('backup:import', 'Imported local database backup', {
          path,
          appVersion: out.meta?.appVersion ?? null
        })
      }
      return out
    })
  )

  // Page Content — Notion page body (block children) edited local-first as Markdown.
  ipcMain.handle('pageContent:get', (_e, resource: PageContentResource, id: string) =>
    result(() => pageContent.getPageContent(resource, id))
  )
  ipcMain.handle('pageContent:save', (_e, resource: PageContentResource, id: string, markdown: string) =>
    result(() => pageContent.savePageContent(resource, id, markdown))
  )
  ipcMain.handle('pageContent:clear', (_e, resource: PageContentResource, id: string) =>
    result(() => pageContent.clearPageContent(resource, id))
  )
  ipcMain.handle('sync:initialPull', () => result(() => pullAll(true))) // full pull (onboarding)
  ipcMain.handle('sync:reset', () => result(() => resetDatabase())) // wipe local + re-pull
  ipcMain.handle('sync:getSettings', () => result(() => getSyncSettings()))
  ipcMain.handle('sync:setMode', (_e, patch: Partial<SyncSettings>) =>
    result(() => {
      const settings = setSyncSettings(patch)
      reschedule() // re-arm the auto-sync timer
      broadcast('sync:status', syncStatus())
      return settings
    })
  )

  // conflicts (Phase 4.2)
  ipcMain.handle('sync:listConflicts', () => result(() => listConflicts()))
  ipcMain.handle('sync:resolveAllConflicts', (_e, resolution: 'local' | 'remote') =>
    result(() => {
      const remaining = resolveAllConflicts(resolution)
      broadcast('records:changed', { resource: 'incomes', ids: [] })
      broadcast('records:changed', { resource: 'expenses', ids: [] })
      broadcast('derived:updated', {})
      broadcast('sync:status', syncStatus())
      return remaining
    }))

  ipcMain.handle('sync:resolveConflict', (_e, table: 'incomes' | 'expenses', id: string, resolution: ConflictResolution) =>
    result(() => {
      resolveConflict(table, id, resolution)
      broadcast('records:changed', { resource: table, ids: [id] })
      broadcast('derived:updated', {})
      broadcast('sync:status', syncStatus())
      return listConflicts()
    })
  )

  // UI settings (hard-delete mode, chat flags, etc.)
  ipcMain.handle('settings:get', () => result(() => getUiSettings()))
  ipcMain.handle('settings:update', (_e, patch: Parameters<typeof setUiSettings>[0]) =>
    result(() => setUiSettings(patch))
  )

  // Chat (Phase 6.1) — credentials usable from Settings even when Chat is off;
  // threads + send require chatEnabled (enforced in handlers / orchestrator).
  ipcMain.handle('chat:status', (_e, opts?: { forceRefresh?: boolean }) =>
    result(() => chat.getChatStatus(opts))
  )
  ipcMain.handle('chat:providers', () =>
    result(() =>
      listChatProviders().map((p) => ({
        id: p.id,
        label: p.label,
        keyPlaceholder: p.keyPlaceholder,
        hint: p.hint,
        docsUrl: p.docsUrl,
        defaultModelId: p.defaultModelId,
        needsCustomBaseUrl: p.id === 'custom',
        models: p.models.map((m) => ({ id: m.id, label: m.label, free: m.free }))
      }))
    )
  )
  ipcMain.handle('chat:models', (_e, credentialId?: string | null) =>
    result(() => {
      let providerId: string | null = null
      if (credentialId) {
        const cred = chat.listCredentials().find((c) => c.id === credentialId)
        providerId = cred?.providerId ?? providerPresetFromBaseUrl(cred?.baseUrl ?? null)
      }
      const models = credentialId ? modelsForProvider(providerId) : CHAT_CURATED_MODELS
      return models.map((m) => ({ id: m.id, label: m.label, free: m.free === true }))
    })
  )
  // Live model list straight from the key's own host (GET {base}/models).
  // Renderer falls back to the curated catalogue when this fails.
  ipcMain.handle('chat:remoteModels', (_e, credentialId: string) =>
    result(() => chat.listRemoteModels(credentialId))
  )
  ipcMain.handle('chat:detectProvider', (_e, apiKey: string) =>
    result(() => chat.detectProviderFromKey(apiKey))
  )
  ipcMain.handle('chat:overlays', () => result(() => chat.CHAT_SLASH_OVERLAYS))
  ipcMain.handle('chat:isAppleOs', () => result(() => chat.isAppleOs()))

  ipcMain.handle('chat:listCredentials', () => result(() => chat.listCredentials()))
  ipcMain.handle(
    'chat:createCredential',
    (
      _e,
      name: string,
      apiKey: string,
      opts?: { baseUrl?: string | null; providerId?: string | null }
    ) => result(() => chat.createCredential(name, apiKey, opts))
  )
  ipcMain.handle(
    'chat:updateCredential',
    (
      _e,
      id: string,
      patch: { name?: string; apiKey?: string; baseUrl?: string | null; providerId?: string | null }
    ) => result(() => chat.updateCredential(id, patch))
  )
  ipcMain.handle('chat:setDefaultCredential', (_e, id: string) =>
    result(() => chat.setDefaultCredential(id))
  )
  ipcMain.handle('chat:deleteCredential', (_e, id: string) =>
    result(() => {
      chat.deleteCredential(id)
      return true as const
    })
  )

  ipcMain.handle('chat:listThreads', () =>
    result(() => {
      requireChatEnabled()
      return chat.listThreads()
    })
  )
  ipcMain.handle('chat:getThread', (_e, id: string) =>
    result(() => {
      requireChatEnabled()
      const thread = chat.getThread(id)
      if (!thread) throw new Error('Thread not found')
      return thread
    })
  )
  ipcMain.handle(
    'chat:createThread',
    (
      _e,
      input?: {
        title?: string
        credentialId?: string | null
        modelId?: string | null
        overlay?: string
      }
    ) =>
      result(() => {
        requireChatEnabled()
        return chat.createThread(input)
      })
  )
  ipcMain.handle(
    'chat:updateThread',
    (
      _e,
      id: string,
      patch: {
        title?: string
        credentialId?: string | null
        modelId?: string | null
        overlay?: string
      }
    ) =>
      result(() => {
        requireChatEnabled()
        return chat.updateThread(id, patch)
      })
  )
  ipcMain.handle('chat:deleteThread', (_e, id: string) =>
    result(() => {
      requireChatEnabled()
      chat.deleteThread(id)
      return true as const
    })
  )
  ipcMain.handle('chat:deleteAllThreads', () =>
    result(() => {
      // Allowed from Configure AI even when Chat is off (history cleanup).
      chat.deleteAllThreads()
      return true as const
    })
  )
  ipcMain.handle('chat:listMessages', (_e, threadId: string) =>
    result(() => {
      requireChatEnabled()
      return chat.listMessages(threadId)
    })
  )
  ipcMain.handle(
    'chat:send',
    (
      _e,
      input: {
        threadId?: string | null
        content: string
        credentialId?: string | null
        modelId?: string | null
        overlay?: import('../../shared/finance.types').ChatOverlayId | null
      }
    ) => result(() => chat.sendChatMessage(input))
  )

  ipcMain.handle('chat:listDrafts', (_e, threadId?: string) =>
    result(() => {
      requireChatEnabled()
      return chat.listDrafts(threadId)
    })
  )
  ipcMain.handle('chat:confirmDraft', (_e, draftId: string) =>
    result(() => {
      requireChatEnabled()
      const out = chat.confirmDraft(draftId)
      const { draft, record } = out
      const ids = chat.changedIdsFromResult(draft, record)
      changed(chat.changedResourceFromDraft(draft), ids)
      logDevOperation('chat:confirmDraft', `Approved ${draft.resource} ${draft.action}`, {
        draftId,
        resource: draft.resource,
        action: draft.action,
        ids
      })
      return out
    })
  )
  ipcMain.handle('chat:cancelDraft', (_e, draftId: string) =>
    result(() => {
      requireChatEnabled()
      const cancelled = chat.cancelDraft(draftId)
      logDevOperation('chat:cancelDraft', 'Cancelled draft', { draftId }, true)
      return cancelled
    })
  )
  ipcMain.handle(
    'chat:updateDraft',
    (_e, draftId: string, edits: Record<string, unknown>) =>
      result(() => {
        requireChatEnabled()
        return chat.editDraftFields(draftId, edits ?? {})
      })
  )

  // ── Auto-updater (Phase 5.1) ──────────────────────────────────────
  ipcMain.handle('updater:check', () =>
    result(() => {
      return checkForUpdatesNow()
    })
  )
  ipcMain.handle('updater:status', () =>
    result(() => ({
      updateDownloaded: isUpdateDownloaded()
    }))
  )
  ipcMain.handle('updater:install', () =>
    result(() => {
      const willQuit = installUpdate()
      if (!willQuit) {
        throw new Error('Update is still downloading. Please wait for the download to finish.')
      }
      return true as const
    })
  )
}

function requireChatEnabled(): void {
  if (!getUiSettings().chatEnabled) {
    throw new Error('Chat is disabled. Enable it in Settings → AI / Chat.')
  }
}
