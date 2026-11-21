// monthly-budget/05#AC3: saved-budget changes leave an operation-log entry with counts only.
import { beforeEach, describe, expect, it, vi } from 'vitest'

const handlers = vi.hoisted(() => new Map<string, (...args: unknown[]) => unknown>())
const logged = vi.hoisted(() => [] as Array<{ action: string; detail: Record<string, unknown> | null | undefined }>)

vi.mock('electron', () => ({ BrowserWindow: { fromWebContents: () => null } }))
vi.mock('../src/main/ipc/handle', () => ({
  handle: (channel: string, fn: (...args: unknown[]) => unknown) => handlers.set(channel, fn)
}))
vi.mock('../src/main/dev-logs/store', () => ({
  logDevOperation: (action: string, _m: string, detail?: Record<string, unknown> | null) =>
    logged.push({ action, detail })
}))
vi.mock('../src/main/db/budgets', () => ({
  listSavedBudgets: () => [],
  replaceBudgetSet: () => ({ saved: 2 }),
  saveBudgetsFromNotion: () => ({ saved: 3 }),
  deleteBudgetSet: () => ({ deleted: 2 })
}))
vi.mock('../src/main/services/budget-files', () => ({
  commitBudgetImport: async () => ({ written: 7, months: 2 }),
  exportBudgetsCsv: async () => ({}),
  previewBudgetImport: async () => ({})
}))

import { IPC_CHANNELS } from '../src/shared/ipc-channels'
import { registerBudgetsIpc } from '../src/main/ipc/budgets'

const call = (channel: string, ...args: unknown[]) => handlers.get(channel)!({}, ...args)

describe('saved budgets activity', () => {
  beforeEach(() => {
    logged.length = 0
    handlers.clear()
    registerBudgetsIpc()
  })

  it('monthly-budget/05#AC3 save, edit, delete and import each log counts only', async () => {
    await call(IPC_CHANNELS.budgetsSaveFromNotion, '2026-02', false)
    await call(IPC_CHANNELS.budgetsSaveSet, '2026-02', [{ categoryId: 'a', categoryName: 'Secret name', budget: 123 }])
    await call(IPC_CHANNELS.budgetsDeleteSet, '2026-02')
    await call(IPC_CHANNELS.budgetsImportCommit, { previewId: 'p', policy: 'overwrite' })

    expect(logged.map((l) => l.action)).toEqual(['budgets:save', 'budgets:save', 'budgets:delete', 'budgets:import'])
    expect(logged[0]!.detail).toEqual({ month: '2026-02', saved: 3 })
    expect(logged[2]!.detail).toEqual({ month: '2026-02', deleted: 2 })
    expect(logged[3]!.detail).toEqual({ written: 7, months: 2 })
    // No row dumps: names and amounts never reach the log.
    expect(JSON.stringify(logged)).not.toContain('Secret name')
    expect(JSON.stringify(logged)).not.toContain('123')
  })
})
