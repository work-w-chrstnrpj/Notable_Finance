// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { createMockWindowApi, ok, err } from '../../../../test/mock-window-api'
import { syncApi } from './api-client'

const pull = { referenceUpserted: 0, inserted: 0, updated: 0, autoMerged: 0, conflicts: 0, pushPending: 0, cursor: null, errors: [] as string[] }
const push = { pushed: 0, created: 0, updated: 0, failed: 0, skipped: 0, errors: [] as string[] }

describe('sync outcome reporting', () => {
  it('reports pull errors inside an otherwise successful IPC envelope', async () => {
    window.api = createMockWindowApi({ sync: { pull: vi.fn(async () => ok({ ...pull, errors: ['28 values for 27 columns'] })) } })
    expect(await syncApi.pullOnly()).toMatchObject({ success: false, error: { code: 'E_SYNC', message: '28 values for 27 columns' } })
  })
  it('reports push failures and skipped unmapped relations', async () => {
    window.api = createMockWindowApi({ sync: { push: vi.fn(async () => ok({ ...push, skipped: 1, errors: ['relation is not mapped'] })) } })
    expect(await syncApi.pushOnly()).toMatchObject({ success: false, error: { message: 'relation is not mapped' } })
  })
  it('reports errors from either full-sync phase', async () => {
    window.api = createMockWindowApi({ sync: { now: vi.fn(async () => ok({ pull: { ...pull, errors: ['pull failed'] }, push: { ...push, errors: ['push failed'] } })) } })
    expect(await syncApi.fullSync()).toMatchObject({ success: false, error: { message: 'pull failed; push failed' } })
  })
  it('retains success for completed sync and failure for rejected IPC requests', async () => {
    window.api = createMockWindowApi({ sync: { now: vi.fn(async () => ok({ pull, push })), pull: vi.fn(async () => err('E_IPC', 'offline')) } })
    expect((await syncApi.fullSync()).success).toBe(true)
    expect(await syncApi.pullOnly()).toMatchObject({ success: false, error: { message: 'offline' } })
  })
})
