// Renderer component tests never touch Electron IPC — they stub `window.api` (the preload
// bridge) entirely. This factory returns a fully-shaped, permissive default (every method
// resolves to an empty/idle success) so any hook a page happens to call "just works" without
// crashing; pass `overrides` to script the specific responses a test cares about.
import { vi } from 'vitest'
// Type-only: never pulls in preload/index.ts's `electron` import at runtime.
import type { PreloadApi } from '../src/preload/index'
import { DEFAULT_SETTINGS } from '../src/renderer/src/lib/ui-settings-context'
import type { ApiResult } from '../src/shared/finance.types'

// Exported for use in test files too: `vi.fn(async () => ({ ok: true, data: X }))` written
// inline often infers `ok: boolean` (widened) rather than the literal `true` the ApiResult
// union needs, depending on how deeply the object sits in the surrounding call — these force
// the correct type every time via the explicit return-type annotation.
export const ok = <T>(data: T): ApiResult<T> => ({ ok: true, data })
export const err = (code: string, message: string): ApiResult<never> => ({ ok: false, error: { code, message } })

/** Deep-ish partial: every leaf method is individually overridable without redeclaring siblings. */
type MockOverrides = {
  [K in keyof PreloadApi]?: PreloadApi[K] extends (...args: never[]) => unknown
    ? PreloadApi[K]
    : Partial<PreloadApi[K]>
}

export function createMockWindowApi(overrides: MockOverrides = {}): PreloadApi {
  const base: PreloadApi = {
    versions: { electron: 'test', chrome: 'test', node: 'test' },
    ping: vi.fn(async () => ok('pong' as const)),
    health: vi.fn(async () => ok({ dbPath: ':memory:', tables: [] })),

    accounts: {
      list: vi.fn(async () => ok([]))
    },
    categories: {
      income: vi.fn(async () => ok([])),
      expense: vi.fn(async () => ok([]))
    },
    incomes: {
      list: vi.fn(async () => ok([])),
      get: vi.fn(async () => (err('E_NOT_FOUND', 'not found'))),
      create: vi.fn(async () => (err('E_UNMOCKED', 'incomes.create not mocked'))),
      update: vi.fn(async () => (err('E_UNMOCKED', 'incomes.update not mocked'))),
      softDelete: vi.fn(async () => (err('E_UNMOCKED', 'incomes.softDelete not mocked'))),
      hardDelete: vi.fn(async () => ok(true as const))
    },
    expenses: {
      list: vi.fn(async () => ok([])),
      listForCCCoverage: vi.fn(async () => ok([])),
      create: vi.fn(async () => (err('E_UNMOCKED', 'expenses.create not mocked'))),
      update: vi.fn(async () => (err('E_UNMOCKED', 'expenses.update not mocked'))),
      softDelete: vi.fn(async () => (err('E_UNMOCKED', 'expenses.softDelete not mocked'))),
      hardDelete: vi.fn(async () => ok(true as const))
    },
    expenseScheduler: {
      list: vi.fn(async () => ok([])),
      create: vi.fn(async () => (err('E_UNMOCKED', 'expenseScheduler.create not mocked'))),
      update: vi.fn(async () => (err('E_UNMOCKED', 'expenseScheduler.update not mocked'))),
      softDelete: vi.fn(async () => (err('E_UNMOCKED', 'expenseScheduler.softDelete not mocked'))),
      hardDelete: vi.fn(async () => ok(true as const)),
      generate: vi.fn(async () => (err('E_UNMOCKED', 'expenseScheduler.generate not mocked')))
    },
    reports: {
      dashboard: vi.fn(async () => (err('E_UNMOCKED', 'reports.dashboard not mocked'))),
      monthlyMonitoring: vi.fn(async () => (err('E_UNMOCKED', 'reports.monthlyMonitoring not mocked'))),
      monitoringSplit: vi.fn(async () => (err('E_UNMOCKED', 'reports.monitoringSplit not mocked')))
    },
    history: {
      get: vi.fn(async () => ok({ unsynced: [], recent: [], lastPullAt: null, lastPushAt: null })),
      discardUnsynced: vi.fn(async () => ok(true as const)),
      getItemDetail: vi.fn(async () => ok(null))
    },
    windows: {
      new: vi.fn(async () => ok(true as const))
    },
    notion: {
      connect: vi.fn(async () => (err('E_UNMOCKED', 'notion.connect not mocked'))),
      isConnected: vi.fn(async () => ok(false)),
      disconnect: vi.fn(async () => ok(true as const)),
      discoverDatabases: vi.fn(async () => ok([])),
      getMapping: vi.fn(async () => ok({})),
      saveMapping: vi.fn(async () => ok(true as const)),
      verifySchema: vi.fn(async () => (err('E_UNMOCKED', 'notion.verifySchema not mocked')))
    },
    sync: {
      status: vi.fn(async () =>
        ok({
          connected: false,
          mapped: false,
          online: true,
          running: false,
          mode: 'manual' as const,
          intervalSeconds: 0,
          dirtyCount: 0,
          conflictCount: 0,
          lastPushAt: null,
          lastPullAt: null,
          lastError: null
        })
      ),
      now: vi.fn(async () => (err('E_UNMOCKED', 'sync.now not mocked'))),
      pull: vi.fn(async () => (err('E_UNMOCKED', 'sync.pull not mocked'))),
      push: vi.fn(async () => (err('E_UNMOCKED', 'sync.push not mocked'))),
      initialPull: vi.fn(async () => (err('E_UNMOCKED', 'sync.initialPull not mocked'))),
      reset: vi.fn(async () => (err('E_UNMOCKED', 'sync.reset not mocked'))),
      getSettings: vi.fn(async () => (err('E_UNMOCKED', 'sync.getSettings not mocked'))),
      setMode: vi.fn(async () => (err('E_UNMOCKED', 'sync.setMode not mocked'))),
      listConflicts: vi.fn(async () => ok([])),
      resolveConflict: vi.fn(async () => ok([])),
      resolveAllConflicts: vi.fn(async () => ok([]))
    },
    settings: {
      get: vi.fn(async () => ok(DEFAULT_SETTINGS)),
      update: vi.fn(async (patch) => ok({ ...DEFAULT_SETTINGS, ...patch }))
    },
    chat: {
      status: vi.fn(async () => (err('E_UNMOCKED', 'chat.status not mocked'))),
      providers: vi.fn(async () => ok([])),
      models: vi.fn(async () => ok([])),
      isAppleOs: vi.fn(async () => ok(false)),
      listCredentials: vi.fn(async () => ok([])),
      createCredential: vi.fn(async () => (err('E_UNMOCKED', 'chat.createCredential not mocked'))),
      updateCredential: vi.fn(async () => (err('E_UNMOCKED', 'chat.updateCredential not mocked'))),
      setDefaultCredential: vi.fn(async () => (err('E_UNMOCKED', 'chat.setDefaultCredential not mocked'))),
      deleteCredential: vi.fn(async () => ok(true as const)),
      listThreads: vi.fn(async () => ok([])),
      getThread: vi.fn(async () => (err('E_NOT_FOUND', 'not found'))),
      createThread: vi.fn(async () => (err('E_UNMOCKED', 'chat.createThread not mocked'))),
      updateThread: vi.fn(async () => (err('E_UNMOCKED', 'chat.updateThread not mocked'))),
      deleteThread: vi.fn(async () => ok(true as const)),
      deleteAllThreads: vi.fn(async () => ok(true as const)),
      listMessages: vi.fn(async () => ok([])),
      send: vi.fn(async () => (err('E_UNMOCKED', 'chat.send not mocked'))),
      listDrafts: vi.fn(async () => ok([])),
      confirmDraft: vi.fn(async () => (err('E_UNMOCKED', 'chat.confirmDraft not mocked'))),
      cancelDraft: vi.fn(async () => (err('E_UNMOCKED', 'chat.cancelDraft not mocked'))),
      updateDraft: vi.fn(async () => (err('E_UNMOCKED', 'chat.updateDraft not mocked'))),
      remoteModels: vi.fn(async () => ok([])),
      detectProvider: vi.fn(async () => ok(null)),
      overlays: vi.fn(async () => ok([]))
    },
    devLogs: {
      list: vi.fn(async () => ok([])),
      clear: vi.fn(async () => ok(0)),
      append: vi.fn(async () => ok(null))
    },
    on: vi.fn(() => () => {}),
    updater: {
      check: vi.fn(async () => (err('E_UNMOCKED', 'updater.check not mocked'))),
      status: vi.fn(async () => ok({ updateDownloaded: false })),
      install: vi.fn(async () => (err('E_UNMOCKED', 'updater.install not mocked')))
    },
    backup: {
      export: vi.fn(async () => (err('E_UNMOCKED', 'backup.export not mocked'))),
      inspect: vi.fn(async () => (err('E_UNMOCKED', 'backup.inspect not mocked'))),
      import: vi.fn(async () => (err('E_UNMOCKED', 'backup.import not mocked')))
    },
    pageContent: {
      get: vi.fn(async () => (err('E_UNMOCKED', 'pageContent.get not mocked'))),
      save: vi.fn(async () => (err('E_UNMOCKED', 'pageContent.save not mocked'))),
      clear: vi.fn(async () => (err('E_UNMOCKED', 'pageContent.clear not mocked')))
    }
  }

  for (const key of Object.keys(overrides) as Array<keyof PreloadApi>) {
    const value = overrides[key]
    if (typeof base[key] === 'function') {
      // @ts-expect-error — narrowed per-key above; TS can't see the correlation through Object.keys.
      base[key] = value
    } else {
      Object.assign(base[key] as object, value as object)
    }
  }

  return base
}

/** Installs the mock on `window.api` for the current test file. Call once, e.g. in beforeEach. */
export function installMockWindowApi(overrides: MockOverrides = {}): PreloadApi {
  const mock = createMockWindowApi(overrides)
  ;(window as unknown as { api: PreloadApi }).api = mock
  return mock
}
