import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type {
  UpdaterCheckResult,
  AccountDto,
  ApiResult,
  ChatCredentialDto,
  ChatConfirmResult,
  ChatDraftDto,
  ChatMessageDto,
  ChatOverlayId,
  ChatProviderCatalogDto,
  ChatSendResult,
  ChatStatusDto,
  ChatThreadDto,
  ConflictGroup,
  ConflictResolution,
  ConnectResult,
  CreateExpenseInput,
  CreateIncomeInput,
  CreateSchedulerInput,
  DashboardSummary,
  DevLogEntry,
  DevLogKind,
  DiscoveredDb,
  EventChannel,
  ExpenseCategoryOption,
  ExpenseRecordDto,
  HealthData,
  HistoryData,
  IncomeCategoryOption,
  IncomeListParams,
  IncomeRecordDto,
  ExpenseListParams,
  MonthlyMonitoringDto,
  MonitoringSplitDto,
  NotionMapping,
  PullResult,
  PushResult,
  SchedulerRecordDto,
  SchemaReport,
  SyncNowResult,
  SyncSettings,
  SyncStatus,
  UpdateExpenseInput,
  UpdateIncomeInput,
  UpdateSchedulerInput,
  UiSettings
} from '../shared/finance.types'

// Preload — the ONLY bridge between the sandboxed renderer and main. Channels are
// explicitly allow-listed here; the renderer cannot invoke arbitrary channels.
// Mirrors wiki/desktop/ipc-contract.md.

const EVENT_CHANNELS: EventChannel[] = [
  'records:changed',
  'derived:updated',
  'sync:status',
  'tabs:command',
  'devLogs:entry',
  'shortcut:menu',
  'updater:progress'
]

const api = {
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  },
  ping: (): Promise<ApiResult<'pong'>> => ipcRenderer.invoke('app:ping'),
  health: (): Promise<ApiResult<HealthData>> => ipcRenderer.invoke('db:health'),

  accounts: {
    list: (params?: { includeInactive?: boolean }): Promise<ApiResult<AccountDto[]>> =>
      ipcRenderer.invoke('accounts:list', params)
  },

  categories: {
    income: (): Promise<ApiResult<IncomeCategoryOption[]>> =>
      ipcRenderer.invoke('categories:income'),
    expense: (): Promise<ApiResult<ExpenseCategoryOption[]>> =>
      ipcRenderer.invoke('categories:expense')
  },

  incomes: {
    list: (params?: IncomeListParams): Promise<ApiResult<IncomeRecordDto[]>> =>
      ipcRenderer.invoke('incomes:list', params),
    get: (id: string): Promise<ApiResult<IncomeRecordDto>> =>
      ipcRenderer.invoke('incomes:get', id),
    create: (input: CreateIncomeInput): Promise<ApiResult<IncomeRecordDto>> =>
      ipcRenderer.invoke('incomes:create', input),
    update: (id: string, patch: UpdateIncomeInput): Promise<ApiResult<IncomeRecordDto>> =>
      ipcRenderer.invoke('incomes:update', id, patch),
    softDelete: (id: string): Promise<ApiResult<IncomeRecordDto>> =>
      ipcRenderer.invoke('incomes:softDelete', id),
    hardDelete: (id: string): Promise<ApiResult<true>> =>
      ipcRenderer.invoke('incomes:hardDelete', id)
  },

  expenses: {
    list: (params?: ExpenseListParams): Promise<ApiResult<ExpenseRecordDto[]>> =>
      ipcRenderer.invoke('expenses:list', params),
    listForCCCoverage: (): Promise<ApiResult<ExpenseRecordDto[]>> =>
      ipcRenderer.invoke('expenses:listForCCCoverage'),
    create: (input: CreateExpenseInput): Promise<ApiResult<ExpenseRecordDto>> =>
      ipcRenderer.invoke('expenses:create', input),
    update: (id: string, patch: UpdateExpenseInput): Promise<ApiResult<ExpenseRecordDto>> =>
      ipcRenderer.invoke('expenses:update', id, patch),
    softDelete: (id: string): Promise<ApiResult<ExpenseRecordDto>> =>
      ipcRenderer.invoke('expenses:softDelete', id),
    hardDelete: (id: string): Promise<ApiResult<true>> =>
      ipcRenderer.invoke('expenses:hardDelete', id)
  },

  expenseScheduler: {
    list: (): Promise<ApiResult<SchedulerRecordDto[]>> => ipcRenderer.invoke('scheduler:list'),
    create: (input: CreateSchedulerInput): Promise<ApiResult<SchedulerRecordDto>> =>
      ipcRenderer.invoke('scheduler:create', input),
    update: (id: string, patch: UpdateSchedulerInput): Promise<ApiResult<SchedulerRecordDto>> =>
      ipcRenderer.invoke('scheduler:update', id, patch),
    softDelete: (id: string): Promise<ApiResult<SchedulerRecordDto>> =>
      ipcRenderer.invoke('scheduler:softDelete', id),
    hardDelete: (id: string): Promise<ApiResult<true>> =>
      ipcRenderer.invoke('scheduler:hardDelete', id),
    generate: (id: string): Promise<ApiResult<ExpenseRecordDto>> =>
      ipcRenderer.invoke('scheduler:generate', id)
  },

  reports: {
    dashboard: (month: string): Promise<ApiResult<DashboardSummary>> =>
      ipcRenderer.invoke('reports:dashboard', month),
    monthlyMonitoring: (month: string): Promise<ApiResult<MonthlyMonitoringDto>> =>
      ipcRenderer.invoke('reports:monthlyMonitoring', month),
    monitoringSplit: (opts?: {
      forceRefresh?: boolean
    }): Promise<ApiResult<MonitoringSplitDto>> =>
      ipcRenderer.invoke('reports:monitoringSplit', opts)
  },

  history: {
    /** Returns unsynced items + events from the last `runs` sync passes (default 2). */
    get: (runs?: number): Promise<ApiResult<HistoryData>> =>
      ipcRenderer.invoke('history:get', runs),
    /** Cancel a never-synced create, or restore the last synced state for an unsynced edit/delete. */
    discardUnsynced: (
      resource: 'incomes' | 'expenses',
      recordId: string
    ): Promise<ApiResult<true>> => ipcRenderer.invoke('history:discardUnsynced', resource, recordId)
  },

  windows: {
    new: (): Promise<ApiResult<true>> => ipcRenderer.invoke('windows:new')
  },

  notion: {
    /** Sends the token INTO main (encrypted there). Nothing ever returns it. */
    connect: (token: string): Promise<ApiResult<ConnectResult>> =>
      ipcRenderer.invoke('notion:connect', token),
    isConnected: (): Promise<ApiResult<boolean>> => ipcRenderer.invoke('notion:isConnected'),
    disconnect: (): Promise<ApiResult<true>> => ipcRenderer.invoke('notion:disconnect'),
    discoverDatabases: (): Promise<ApiResult<DiscoveredDb[]>> =>
      ipcRenderer.invoke('notion:discoverDatabases'),
    getMapping: (): Promise<ApiResult<NotionMapping>> => ipcRenderer.invoke('notion:getMapping'),
    saveMapping: (mapping: NotionMapping): Promise<ApiResult<true>> =>
      ipcRenderer.invoke('notion:saveMapping', mapping),
    verifySchema: (): Promise<ApiResult<SchemaReport>> => ipcRenderer.invoke('notion:verifySchema')
  },

  sync: {
    status: (): Promise<ApiResult<SyncStatus>> => ipcRenderer.invoke('sync:status'),
    /** Reconcile (pull) then push. */
    now: (since?: string): Promise<ApiResult<SyncNowResult>> => ipcRenderer.invoke('sync:now', since),
    /** Notion → App only (incremental). */
    pull: (since?: string): Promise<ApiResult<PullResult>> => ipcRenderer.invoke('sync:pull', since),
    /** App → Notion only (dirty records). */
    push: (): Promise<ApiResult<PushResult>> => ipcRenderer.invoke('sync:push'),
    /** Full pull from Notion (onboarding / first sync). */
    initialPull: (): Promise<ApiResult<PullResult>> => ipcRenderer.invoke('sync:initialPull'),
    /** Wipe all local finance data and re-pull from Notion. */
    reset: (): Promise<ApiResult<PullResult>> => ipcRenderer.invoke('sync:reset'),
    getSettings: (): Promise<ApiResult<SyncSettings>> => ipcRenderer.invoke('sync:getSettings'),
    setMode: (patch: Partial<SyncSettings>): Promise<ApiResult<SyncSettings>> =>
      ipcRenderer.invoke('sync:setMode', patch),
    listConflicts: (): Promise<ApiResult<ConflictGroup[]>> =>
      ipcRenderer.invoke('sync:listConflicts'),
    resolveConflict: (
      table: 'incomes' | 'expenses',
      id: string,
      resolution: ConflictResolution
    ): Promise<ApiResult<ConflictGroup[]>> =>
      ipcRenderer.invoke('sync:resolveConflict', table, id, resolution),
    resolveAllConflicts: (
      resolution: 'local' | 'remote'
    ): Promise<ApiResult<ConflictGroup[]>> =>
      ipcRenderer.invoke('sync:resolveAllConflicts', resolution)
  },

  settings: {
    get: (): Promise<ApiResult<UiSettings>> => ipcRenderer.invoke('settings:get'),
    update: (patch: Partial<UiSettings>): Promise<ApiResult<UiSettings>> =>
      ipcRenderer.invoke('settings:update', patch)
  },

  chat: {
    status: (opts?: { forceRefresh?: boolean }): Promise<ApiResult<ChatStatusDto>> =>
      ipcRenderer.invoke('chat:status', opts),
    providers: (): Promise<ApiResult<ChatProviderCatalogDto[]>> =>
      ipcRenderer.invoke('chat:providers'),
    models: (
      credentialId?: string | null
    ): Promise<ApiResult<Array<{ id: string; label: string; free?: boolean }>>> =>
      ipcRenderer.invoke('chat:models', credentialId),
    isAppleOs: (): Promise<ApiResult<boolean>> => ipcRenderer.invoke('chat:isAppleOs'),
    listCredentials: (): Promise<ApiResult<ChatCredentialDto[]>> =>
      ipcRenderer.invoke('chat:listCredentials'),
    createCredential: (
      name: string,
      apiKey: string,
      opts?: { baseUrl?: string | null; providerId?: string | null }
    ): Promise<ApiResult<ChatCredentialDto>> =>
      ipcRenderer.invoke('chat:createCredential', name, apiKey, opts),
    updateCredential: (
      id: string,
      patch: { name?: string; apiKey?: string; baseUrl?: string | null; providerId?: string | null }
    ): Promise<ApiResult<ChatCredentialDto>> =>
      ipcRenderer.invoke('chat:updateCredential', id, patch),
    setDefaultCredential: (id: string): Promise<ApiResult<ChatCredentialDto>> =>
      ipcRenderer.invoke('chat:setDefaultCredential', id),
    deleteCredential: (id: string): Promise<ApiResult<true>> =>
      ipcRenderer.invoke('chat:deleteCredential', id),
    listThreads: (): Promise<ApiResult<ChatThreadDto[]>> => ipcRenderer.invoke('chat:listThreads'),
    getThread: (id: string): Promise<ApiResult<ChatThreadDto>> =>
      ipcRenderer.invoke('chat:getThread', id),
    createThread: (input?: {
      title?: string
      credentialId?: string | null
      modelId?: string | null
      overlay?: string
    }): Promise<ApiResult<ChatThreadDto>> => ipcRenderer.invoke('chat:createThread', input),
    updateThread: (
      id: string,
      patch: {
        title?: string
        credentialId?: string | null
        modelId?: string | null
        overlay?: string
      }
    ): Promise<ApiResult<ChatThreadDto>> => ipcRenderer.invoke('chat:updateThread', id, patch),
    deleteThread: (id: string): Promise<ApiResult<true>> =>
      ipcRenderer.invoke('chat:deleteThread', id),
    deleteAllThreads: (): Promise<ApiResult<true>> => ipcRenderer.invoke('chat:deleteAllThreads'),
    listMessages: (threadId: string): Promise<ApiResult<ChatMessageDto[]>> =>
      ipcRenderer.invoke('chat:listMessages', threadId),
    send: (input: {
      threadId?: string | null
      content: string
      credentialId?: string | null
      modelId?: string | null
      overlay?: ChatOverlayId | null
    }): Promise<ApiResult<ChatSendResult>> => ipcRenderer.invoke('chat:send', input),
    listDrafts: (threadId?: string): Promise<ApiResult<ChatDraftDto[]>> =>
      ipcRenderer.invoke('chat:listDrafts', threadId),
    confirmDraft: (draftId: string): Promise<ApiResult<ChatConfirmResult>> =>
      ipcRenderer.invoke('chat:confirmDraft', draftId),
    cancelDraft: (
      draftId: string
    ): Promise<
      ApiResult<ChatDraftDto & { quip?: string; assistantMessage?: ChatMessageDto | null }>
    > => ipcRenderer.invoke('chat:cancelDraft', draftId),
    updateDraft: (
      draftId: string,
      edits: Record<string, unknown>
    ): Promise<ApiResult<ChatDraftDto>> =>
      ipcRenderer.invoke('chat:updateDraft', draftId, edits),
    remoteModels: (
      credentialId: string
    ): Promise<ApiResult<Array<{ id: string; label: string; free?: boolean }>>> =>
      ipcRenderer.invoke('chat:remoteModels', credentialId),
    detectProvider: (apiKey: string): Promise<ApiResult<string | null>> =>
      ipcRenderer.invoke('chat:detectProvider', apiKey),
    overlays: (): Promise<
      ApiResult<Array<{ id: ChatOverlayId; slash: string; label: string; hint: string }>>
    > => ipcRenderer.invoke('chat:overlays')
  },

  devLogs: {
    list: (limit?: number): Promise<ApiResult<DevLogEntry[]>> =>
      ipcRenderer.invoke('devLogs:list', limit),
    clear: (): Promise<ApiResult<number>> => ipcRenderer.invoke('devLogs:clear'),
    append: (input: {
      kind: DevLogKind
      action: string
      message: string
      detail?: Record<string, unknown> | null
      ok?: boolean | null
    }): Promise<ApiResult<DevLogEntry | null>> => ipcRenderer.invoke('devLogs:append', input)
  },

  /**
   * Subscribe to a main→renderer event. Returns an unsubscribe function
   * (call it on unmount). Only the allow-listed event channels work.
   * Payload shape per channel: records:changed → RecordsChangedEvent,
   * sync:status → SyncStatus, derived:updated → {},
   * devLogs:entry → DevLogEntry.
   */
  on: (channel: EventChannel, handler: (payload: unknown) => void): (() => void) => {
    if (!EVENT_CHANNELS.includes(channel)) {
      throw new Error(`Unknown event channel: ${channel}`)
    }
    const listener = (_e: IpcRendererEvent, payload: unknown): void => handler(payload)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
  },

  updater: {
    check: (): Promise<ApiResult<UpdaterCheckResult>> =>
      ipcRenderer.invoke('updater:check'),
    status: (): Promise<ApiResult<{ updateDownloaded: boolean }>> =>
      ipcRenderer.invoke('updater:status'),
    install: (): Promise<ApiResult<true>> =>
      ipcRenderer.invoke('updater:install')
  }
}

// contextIsolation is always on (see src/main/windows/index.ts), so exposeInMainWorld is
// the only path. It throws if isolation is ever disabled — surface that rather than fall back.
try {
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  console.error('Failed to expose preload API:', error)
}

export type PreloadApi = typeof api
