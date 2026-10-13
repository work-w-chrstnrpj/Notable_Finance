import { describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ pull: vi.fn(), push: vi.fn() }))
vi.mock('../src/main/sync/pull', () => ({ pullAll: mocks.pull }))
vi.mock('../src/main/sync/push', () => ({ pushAll: mocks.push }))
vi.mock('../src/main/sync/status', () => ({ syncStatus: vi.fn() }))
vi.mock('../src/main/sync/settings', () => ({ getSyncSettings: vi.fn(), setSyncSettings: vi.fn() }))
vi.mock('../src/main/sync/conflicts', () => ({ listConflicts: vi.fn(), resolveConflict: vi.fn(), resolveAllConflicts: vi.fn() }))
vi.mock('../src/main/sync/reset', () => ({ resetDatabase: vi.fn() }))
import { syncNow } from '../src/main/sync'

describe('full sync ordering', () => {
  it('does not push stale data after a failed pull', async () => {
    mocks.push.mockClear()
    mocks.pull.mockResolvedValue({ errors: ['expense import failed'] })
    const result = await syncNow()
    expect(mocks.push).not.toHaveBeenCalled()
    expect(result.push.pushed).toBe(0)
    expect(result.push.errors[0]).toContain('Push paused')
  })
  it('pushes only after a successful pull', async () => {
    mocks.push.mockClear()
    mocks.pull.mockResolvedValue({ errors: [] })
    mocks.push.mockResolvedValue({ pushed: 1, errors: [] })
    expect((await syncNow()).push.pushed).toBe(1)
    expect(mocks.push).toHaveBeenCalledOnce()
  })
})
