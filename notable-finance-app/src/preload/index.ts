import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type {
  UpdaterCheckResult,
  BackupExportResult,
  BackupImportResult,
  BackupInspectResult,
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
  PageContentDto,
  PageContentResource,
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
import { IPC_CHANNELS } from '../shared/ipc-channels'

// Preload — the ONLY bridge between the sandboxed renderer and main. Channels are
// explicitly allow-listed here; the renderer cannot invoke arbitrary channels.
// Mirrors wiki/desktop/ipc-contract.md. Request/response channel strings come from
// IPC_CHANNELS (refactor_development_plan.md Phase 7.2, fixes F8) so a typo or rename
// is a compile error here and in main/ipc/*, not a runtime "no handler registered".

const EVENT_CHANNELS: EventChannel[] = [
  'records:changed',
  'derived:updated',
  'sync:status',
  'tabs:command',
  'devLogs:entry',
  'shortcut:menu',
  'updater:progress',
  'updater:manual-download'
]

const api = {
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  },
  ping: (): Promise<ApiResult<'pong'>> => ipcRenderer.invoke(IPC_CHANNELS.appPing),
  health: (): Promise<ApiResult<HealthData>> => ipcRenderer.invoke(IPC_CHANNELS.dbHealth),

  accounts: {
    list: (params?: { includeInactive?: boolean }): Promise<ApiResult<AccountDto[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.accountsList, params)
  },

  categories: {
    income: (): Promise<ApiResult<IncomeCategoryOption[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.categoriesIncome),
    expense: (): Promise<ApiResult<ExpenseCategoryOption[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.categoriesExpense)
  },

  incomes: {
    list: (params?: IncomeListParams): Promise<ApiResult<IncomeRecordDto[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.incomesList, params),
    get: (id: string): Promise<ApiResult<IncomeRecordDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.incomesGet, id),
    create: (input: CreateIncomeInput): Promise<ApiResult<IncomeRecordDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.incomesCreate, input),
    update: (id: string, patch: UpdateIncomeInput): Promise<ApiResult<IncomeRecordDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.incomesUpdate, id, patch),
    softDelete: (id: string): Promise<ApiResult<IncomeRecordDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.incomesSoftDelete, id),
    hardDelete: (id: string): Promise<ApiResult<true>> =>
      ipcRenderer.invoke(IPC_CHANNELS.incomesHardDelete, id)
  },

  expenses: {
    list: (params?: ExpenseListParams): Promise<ApiResult<ExpenseRecordDto[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.expensesList, params),
    listForCCCoverage: (): Promise<ApiResult<ExpenseRecordDto[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.expensesListForCCCoverage),
    create: (input: CreateExpenseInput): Promise<ApiResult<ExpenseRecordDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.expensesCreate, input),
    update: (id: string, patch: UpdateExpenseInput): Promise<ApiResult<ExpenseRecordDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.expensesUpdate, id, patch),
    softDelete: (id: string): Promise<ApiResult<ExpenseRecordDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.expensesSoftDelete, id),
    hardDelete: (id: string): Promise<ApiResult<true>> =>
      ipcRenderer.invoke(IPC_CHANNELS.expensesHardDelete, id)
  },

  expenseScheduler: {
    list: (): Promise<ApiResult<SchedulerRecordDto[]>> => ipcRenderer.invoke(IPC_CHANNELS.schedulerList),
    create: (input: CreateSchedulerInput): Promise<ApiResult<SchedulerRecordDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.schedulerCreate, input),
    update: (id: string, patch: UpdateSchedulerInput): Promise<ApiResult<SchedulerRecordDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.schedulerUpdate, id, patch),
    softDelete: (id: string): Promise<ApiResult<SchedulerRecordDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.schedulerSoftDelete, id),
    hardDelete: (id: string): Promise<ApiResult<true>> =>
      ipcRenderer.invoke(IPC_CHANNELS.schedulerHardDelete, id),
    generate: (id: string): Promise<ApiResult<ExpenseRecordDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.schedulerGenerate, id)
  },

  reports: {
    dashboard: (month: string): Promise<ApiResult<DashboardSummary>> =>
      ipcRenderer.invoke(IPC_CHANNELS.reportsDashboard, month),
    monthlyMonitoring: (month: string): Promise<ApiResult<MonthlyMonitoringDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.reportsMonthlyMonitoring, month),
    monitoringSplit: (opts?: {
      forceRefresh?: boolean
    }): Promise<ApiResult<MonitoringSplitDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.reportsMonitoringSplit, opts)
  },

  history: {
    /** Returns unsynced items + events from the last `runs` sync passes (default 2). */
    get: (runs?: number): Promise<ApiResult<HistoryData>> =>
      ipcRenderer.invoke(IPC_CHANNELS.historyGet, runs),
    /** Cancel a never-synced create, or restore the last synced state for an unsynced edit/delete. */
    discardUnsynced: (
      resource: 'incomes' | 'expenses',
      recordId: string
    ): Promise<ApiResult<true>> => ipcRenderer.invoke(IPC_CHANNELS.historyDiscardUnsynced, resource, recordId),
    /** Returns the full writable payload for a synced or unsynced record (for read-only form modals). */
    getItemDetail: (
      resource: 'incomes' | 'expenses',
      recordId: string
    ): Promise<ApiResult<Record<string, unknown> | null>> =>
      ipcRenderer.invoke(IPC_CHANNELS.historyGetItemDetail, resource, recordId)
  },

  windows: {
    new: (): Promise<ApiResult<true>> => ipcRenderer.invoke(IPC_CHANNELS.windowsNew)
  },

  notion: {
    /** Sends the token INTO main (encrypted there). Nothing ever returns it. */
    connect: (token: string): Promise<ApiResult<ConnectResult>> =>
      ipcRenderer.invoke(IPC_CHANNELS.notionConnect, token),
    isConnected: (): Promise<ApiResult<boolean>> => ipcRenderer.invoke(IPC_CHANNELS.notionIsConnected),
    disconnect: (): Promise<ApiResult<true>> => ipcRenderer.invoke(IPC_CHANNELS.notionDisconnect),
    discoverDatabases: (): Promise<ApiResult<DiscoveredDb[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.notionDiscoverDatabases),
    getMapping: (): Promise<ApiResult<NotionMapping>> => ipcRenderer.invoke(IPC_CHANNELS.notionGetMapping),
    saveMapping: (mapping: NotionMapping): Promise<ApiResult<true>> =>
      ipcRenderer.invoke(IPC_CHANNELS.notionSaveMapping, mapping),
    verifySchema: (): Promise<ApiResult<SchemaReport>> => ipcRenderer.invoke(IPC_CHANNELS.notionVerifySchema)
  },

  sync: {
    status: (): Promise<ApiResult<SyncStatus>> => ipcRenderer.invoke(IPC_CHANNELS.syncStatus),
    /** Reconcile (pull) then push. */
    now: (since?: string): Promise<ApiResult<SyncNowResult>> => ipcRenderer.invoke(IPC_CHANNELS.syncNow, since),
    /** Notion → App only (incremental). */
    pull: (since?: string): Promise<ApiResult<PullResult>> => ipcRenderer.invoke(IPC_CHANNELS.syncPull, since),
    /** App → Notion only (dirty records). */
    push: (): Promise<ApiResult<PushResult>> => ipcRenderer.invoke(IPC_CHANNELS.syncPush),
    /** Full pull from Notion (onboarding / first sync). */
    initialPull: (): Promise<ApiResult<PullResult>> => ipcRenderer.invoke(IPC_CHANNELS.syncInitialPull),
    /** Wipe all local finance data and re-pull from Notion. */
    reset: (): Promise<ApiResult<PullResult>> => ipcRenderer.invoke(IPC_CHANNELS.syncReset),
    getSettings: (): Promise<ApiResult<SyncSettings>> => ipcRenderer.invoke(IPC_CHANNELS.syncGetSettings),
    setMode: (patch: Partial<SyncSettings>): Promise<ApiResult<SyncSettings>> =>
      ipcRenderer.invoke(IPC_CHANNELS.syncSetMode, patch),
    listConflicts: (): Promise<ApiResult<ConflictGroup[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.syncListConflicts),
    resolveConflict: (
      table: 'incomes' | 'expenses',
      id: string,
      resolution: ConflictResolution
    ): Promise<ApiResult<ConflictGroup[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.syncResolveConflict, table, id, resolution),
    resolveAllConflicts: (
      resolution: 'local' | 'remote'
    ): Promise<ApiResult<ConflictGroup[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.syncResolveAllConflicts, resolution)
  },

  settings: {
    get: (): Promise<ApiResult<UiSettings>> => ipcRenderer.invoke(IPC_CHANNELS.settingsGet),
    update: (patch: Partial<UiSettings>): Promise<ApiResult<UiSettings>> =>
      ipcRenderer.invoke(IPC_CHANNELS.settingsUpdate, patch)
  },

  chat: {
    status: (opts?: { forceRefresh?: boolean }): Promise<ApiResult<ChatStatusDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.chatStatus, opts),
    providers: (): Promise<ApiResult<ChatProviderCatalogDto[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.chatProviders),
    models: (
      credentialId?: string | null
    ): Promise<ApiResult<Array<{ id: string; label: string; free?: boolean }>>> =>
      ipcRenderer.invoke(IPC_CHANNELS.chatModels, credentialId),
    isAppleOs: (): Promise<ApiResult<boolean>> => ipcRenderer.invoke(IPC_CHANNELS.chatIsAppleOs),
    listCredentials: (): Promise<ApiResult<ChatCredentialDto[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.chatListCredentials),
    createCredential: (
      name: string,
      apiKey: string,
      opts?: { baseUrl?: string | null; providerId?: string | null }
    ): Promise<ApiResult<ChatCredentialDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.chatCreateCredential, name, apiKey, opts),
    updateCredential: (
      id: string,
      patch: { name?: string; apiKey?: string; baseUrl?: string | null; providerId?: string | null }
    ): Promise<ApiResult<ChatCredentialDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.chatUpdateCredential, id, patch),
    setDefaultCredential: (id: string): Promise<ApiResult<ChatCredentialDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.chatSetDefaultCredential, id),
    deleteCredential: (id: string): Promise<ApiResult<true>> =>
      ipcRenderer.invoke(IPC_CHANNELS.chatDeleteCredential, id),
    listThreads: (): Promise<ApiResult<ChatThreadDto[]>> => ipcRenderer.invoke(IPC_CHANNELS.chatListThreads),
    getThread: (id: string): Promise<ApiResult<ChatThreadDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.chatGetThread, id),
    createThread: (input?: {
      title?: string
      credentialId?: string | null
      modelId?: string | null
      overlay?: string
    }): Promise<ApiResult<ChatThreadDto>> => ipcRenderer.invoke(IPC_CHANNELS.chatCreateThread, input),
    updateThread: (
      id: string,
      patch: {
        title?: string
        credentialId?: string | null
        modelId?: string | null
        overlay?: string
      }
    ): Promise<ApiResult<ChatThreadDto>> => ipcRenderer.invoke(IPC_CHANNELS.chatUpdateThread, id, patch),
    deleteThread: (id: string): Promise<ApiResult<true>> =>
      ipcRenderer.invoke(IPC_CHANNELS.chatDeleteThread, id),
    deleteAllThreads: (): Promise<ApiResult<true>> => ipcRenderer.invoke(IPC_CHANNELS.chatDeleteAllThreads),
    listMessages: (threadId: string): Promise<ApiResult<ChatMessageDto[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.chatListMessages, threadId),
    send: (input: {
      threadId?: string | null
      content: string
      credentialId?: string | null
      modelId?: string | null
      overlay?: ChatOverlayId | null
    }): Promise<ApiResult<ChatSendResult>> => ipcRenderer.invoke(IPC_CHANNELS.chatSend, input),
    listDrafts: (threadId?: string): Promise<ApiResult<ChatDraftDto[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.chatListDrafts, threadId),
    confirmDraft: (draftId: string): Promise<ApiResult<ChatConfirmResult>> =>
      ipcRenderer.invoke(IPC_CHANNELS.chatConfirmDraft, draftId),
    cancelDraft: (
      draftId: string
    ): Promise<
      ApiResult<ChatDraftDto & { quip?: string; assistantMessage?: ChatMessageDto | null }>
    > => ipcRenderer.invoke(IPC_CHANNELS.chatCancelDraft, draftId),
    updateDraft: (
      draftId: string,
      edits: Record<string, unknown>
    ): Promise<ApiResult<ChatDraftDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.chatUpdateDraft, draftId, edits),
    remoteModels: (
      credentialId: string
    ): Promise<ApiResult<Array<{ id: string; label: string; free?: boolean }>>> =>
      ipcRenderer.invoke(IPC_CHANNELS.chatRemoteModels, credentialId),
    detectProvider: (apiKey: string): Promise<ApiResult<string | null>> =>
      ipcRenderer.invoke(IPC_CHANNELS.chatDetectProvider, apiKey),
    overlays: (): Promise<
      ApiResult<Array<{ id: ChatOverlayId; slash: string; label: string; hint: string }>>
    > => ipcRenderer.invoke(IPC_CHANNELS.chatOverlays)
  },

  devLogs: {
    list: (limit?: number): Promise<ApiResult<DevLogEntry[]>> =>
      ipcRenderer.invoke(IPC_CHANNELS.devLogsList, limit),
    clear: (): Promise<ApiResult<number>> => ipcRenderer.invoke(IPC_CHANNELS.devLogsClear),
    append: (input: {
      kind: DevLogKind
      action: string
      message: string
      detail?: Record<string, unknown> | null
      ok?: boolean | null
    }): Promise<ApiResult<DevLogEntry | null>> => ipcRenderer.invoke(IPC_CHANNELS.devLogsAppend, input)
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
      ipcRenderer.invoke(IPC_CHANNELS.updaterCheck),
    status: (): Promise<ApiResult<{ updateDownloaded: boolean }>> =>
      ipcRenderer.invoke(IPC_CHANNELS.updaterStatus),
    install: (): Promise<ApiResult<true>> =>
      ipcRenderer.invoke(IPC_CHANNELS.updaterInstall)
  },

  /** Local database backup / restore. Import swaps the live file — reload the window after. */
  backup: {
    export: (opts?: { path?: string }): Promise<ApiResult<BackupExportResult>> =>
      ipcRenderer.invoke(IPC_CHANNELS.backupExport, opts),
    inspect: (opts?: { path?: string }): Promise<ApiResult<BackupInspectResult>> =>
      ipcRenderer.invoke(IPC_CHANNELS.backupInspect, opts),
    import: (path: string): Promise<ApiResult<BackupImportResult>> =>
      ipcRenderer.invoke(IPC_CHANNELS.backupImport, path)
  },

  /** Page Content — a record's Notion page body (block children), edited local-first as Markdown. */
  pageContent: {
    get: (resource: PageContentResource, id: string): Promise<ApiResult<PageContentDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.pageContentGet, resource, id),
    save: (
      resource: PageContentResource,
      id: string,
      markdown: string
    ): Promise<ApiResult<PageContentDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.pageContentSave, resource, id, markdown),
    clear: (resource: PageContentResource, id: string): Promise<ApiResult<PageContentDto>> =>
      ipcRenderer.invoke(IPC_CHANNELS.pageContentClear, resource, id)
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
