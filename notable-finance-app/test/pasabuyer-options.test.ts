import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { DatabaseSync } from 'node:sqlite'

const state = vi.hoisted(() => ({ db: null as unknown as DatabaseSync, databaseId: 'expenses-a', connected: true }))
const schema = vi.hoisted(() => vi.fn())
vi.mock('../src/main/db', () => ({ getSqlite: () => state.db }))
vi.mock('../src/main/notion/mapping-store', () => ({ getMapping: () => ({ expenses: state.databaseId }) }))
vi.mock('../src/main/notion/service', () => ({ client: () => ({ getDataSourceSchema: schema }), isConnected: () => state.connected }))
import { listPasabuyerOptions } from '../src/main/notion/pasabuyer-options'

const response = (names: string[]) => ({ properties: { Pasabuyer: { type: 'select', select: { options: names.map(name => ({ name })) } } } })
beforeEach(() => {
  state.db?.close()
  state.db = new DatabaseSync(':memory:')
  state.db.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT)')
  state.databaseId = 'expenses-a'; state.connected = true
  schema.mockReset()
})
afterAll(() => state.db.close())

describe('workspace Pasabuyer schema choices', () => {
  it('loads even unused choices and preserves exact labels/order', async () => {
    schema.mockResolvedValue(response(['New Buyer', 'Household 🏠', '22-H']))
    expect(await listPasabuyerOptions()).toEqual(['New Buyer', 'Household 🏠', '22-H'])
    expect(schema).toHaveBeenCalledWith('expenses-a')
  })
  it('replaces renamed/removed choices, including an intentionally empty list', async () => {
    schema.mockResolvedValueOnce(response(['Old'])).mockResolvedValueOnce(response(['Renamed', 'Added'])).mockResolvedValueOnce(response([]))
    expect(await listPasabuyerOptions()).toEqual(['Old'])
    expect(await listPasabuyerOptions()).toEqual(['Renamed', 'Added'])
    expect(await listPasabuyerOptions()).toEqual([])
    schema.mockRejectedValue(new Error('offline'))
    expect(await listPasabuyerOptions()).toEqual([])
  })
  it('retains durable cached choices on network failure and while disconnected', async () => {
    schema.mockResolvedValue(response(['Cached']))
    await listPasabuyerOptions()
    schema.mockRejectedValue(new Error('offline'))
    expect(await listPasabuyerOptions()).toEqual(['Cached'])
    state.connected = false
    expect(await listPasabuyerOptions()).toEqual(['Cached'])
  })
  it('does not leak choices across remapped Expense databases', async () => {
    schema.mockResolvedValue(response(['Workspace A']))
    await listPasabuyerOptions()
    state.databaseId = 'expenses-b'
    schema.mockRejectedValue(new Error('offline'))
    await expect(listPasabuyerOptions()).rejects.toThrow('offline')
  })
  it('does not erase the cache when the property is missing or has the wrong type', async () => {
    schema.mockResolvedValueOnce(response(['Keep'])).mockResolvedValueOnce({ properties: { Pasabuyer: { type: 'rich_text' } } })
    await listPasabuyerOptions()
    expect(await listPasabuyerOptions()).toEqual(['Keep'])
  })
  it('returns no invented choices when unmapped', async () => {
    state.databaseId = ''
    expect(await listPasabuyerOptions()).toEqual([])
    expect(schema).not.toHaveBeenCalled()
  })
})
