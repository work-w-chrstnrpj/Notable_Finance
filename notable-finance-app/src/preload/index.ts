import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type {
  AccountDto,
  ApiResult,
  ConflictGroup,
  ConflictResolution,
  ConnectResult,
  CreateExpenseInput,
  CreateIncomeInput,
  CreateSchedulerInput,
  DashboardSummary,
  DiscoveredDb,
  EventChannel,
  ExpenseCategoryOption,
  ExpenseRecordDto,
  HealthData,
  IncomeCategoryOption,
  IncomeListParams,
  IncomeRecordDto,
  ListRecordsParams,
  MonthlyMonitoringDto,
  NotionMapping,
  PullResult,
  SchedulerRecordDto,
  SchemaReport,
  SyncNowResult,
  SyncSettings,
  SyncStatus,
  UpdateExpenseInput,
  UpdateIncomeInput,
  UpdateSchedulerInput
} from '../shared/finance.types'

// Preload — the ONLY bridge between the sandboxed renderer and main. Channels are
// explicitly allow-listed here; the renderer cannot invoke arbitrary channels.
// Mirrors wiki/desktop/ipc-contract.md.

const EVENT_CHANNELS: EventChannel[] = ['records:changed', 'derived:updated', 'sync:status']

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
    create: (input: CreateIncomeInput): Promise<ApiResult<IncomeRecordDto>> =>
      ipcRenderer.invoke('incomes:create', input),
    update: (id: string, patch: UpdateIncomeInput): Promise<ApiResult<IncomeRecordDto>> =>
      ipcRenderer.invoke('incomes:update', id, patch),
    softDelete: (id: string): Promise<ApiResult<IncomeRecordDto>> =>
      ipcRenderer.invoke('incomes:softDelete', id)
  },

  expenses: {
    list: (params?: ListRecordsParams): Promise<ApiResult<ExpenseRecordDto[]>> =>
      ipcRenderer.invoke('expenses:list', params),
    create: (input: CreateExpenseInput): Promise<ApiResult<ExpenseRecordDto>> =>
      ipcRenderer.invoke('expenses:create', input),
    update: (id: string, patch: UpdateExpenseInput): Promise<ApiResult<ExpenseRecordDto>> =>
      ipcRenderer.invoke('expenses:update', id, patch),
    softDelete: (id: string): Promise<ApiResult<ExpenseRecordDto>> =>
      ipcRenderer.invoke('expenses:softDelete', id)
  },

  expenseScheduler: {
    list: (): Promise<ApiResult<SchedulerRecordDto[]>> => ipcRenderer.invoke('scheduler:list'),
    create: (input: CreateSchedulerInput): Promise<ApiResult<SchedulerRecordDto>> =>
      ipcRenderer.invoke('scheduler:create', input),
    update: (id: string, patch: UpdateSchedulerInput): Promise<ApiResult<SchedulerRecordDto>> =>
      ipcRenderer.invoke('scheduler:update', id, patch),
    softDelete: (id: string): Promise<ApiResult<SchedulerRecordDto>> =>
      ipcRenderer.invoke('scheduler:softDelete', id),
    generate: (id: string): Promise<ApiResult<ExpenseRecordDto>> =>
      ipcRenderer.invoke('scheduler:generate', id)
  },

  reports: {
    dashboard: (month: string): Promise<ApiResult<DashboardSummary>> =>
      ipcRenderer.invoke('reports:dashboard', month),
    monthlyMonitoring: (month: string): Promise<ApiResult<MonthlyMonitoringDto>> =>
      ipcRenderer.invoke('reports:monthlyMonitoring', month)
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
    now: (): Promise<ApiResult<SyncNowResult>> => ipcRenderer.invoke('sync:now'),
    /** Full pull from Notion (onboarding / first sync). */
    initialPull: (): Promise<ApiResult<PullResult>> => ipcRenderer.invoke('sync:initialPull'),
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
      ipcRenderer.invoke('sync:resolveConflict', table, id, resolution)
  },

  /**
   * Subscribe to a main→renderer event. Returns an unsubscribe function
   * (call it on unmount). Only the allow-listed event channels work.
   * Payload shape per channel: records:changed → RecordsChangedEvent,
   * sync:status → SyncStatus, derived:updated → {}.
   */
  on: (channel: EventChannel, handler: (payload: unknown) => void): (() => void) => {
    if (!EVENT_CHANNELS.includes(channel)) {
      throw new Error(`Unknown event channel: ${channel}`)
    }
    const listener = (_e: IpcRendererEvent, payload: unknown): void => handler(payload)
    ipcRenderer.on(channel, listener)
    return () => ipcRenderer.removeListener(channel, listener)
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
