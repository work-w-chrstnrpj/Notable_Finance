import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const state = vi.hoisted(() => ({
  db: null as unknown as DatabaseSync,
  pages: [] as Record<string, unknown>[],
  incomePages: [] as Record<string, unknown>[]
}))
const api = vi.hoisted(() => ({
  queryDatabase: vi.fn(),
  updatePage: vi.fn(async (id: string, _properties: Record<string, unknown>) => ({ id })),
  createPage: vi.fn(async () => ({ id: 'created-page' }))
}))
vi.mock('../src/main/db', () => ({ getSqlite: () => state.db }))
vi.mock('../src/main/notion/service', () => ({ client: () => api }))
vi.mock('../src/main/notion/mapping-store', () => ({
  getMapping: () => ({ expenses: 'expense-db', ...(state.incomePages.length && { incomes: 'income-db' }) })
}))
vi.mock('../src/main/sync/status', () => ({ isRunning: () => false, setRunning: vi.fn(), emitStatus: vi.fn(), syncStatus: () => ({ connected: true, mapped: true }) }))
vi.mock('../src/main/windows', () => ({ broadcast: vi.fn() }))
vi.mock('../src/main/services/history', () => ({ recordActivity: vi.fn() }))
vi.mock('../src/main/services/page-content', () => ({ replaceNotionPageContent: vi.fn() }))

import { pullAll } from '../src/main/sync/pull'
import { pushAll } from '../src/main/sync/push'
import { hardDeleteExpense, createExpense, getExpense, listExpenses, listIncomes, updateExpense, updateIncome } from '../src/main/db/repositories'

import { discardUnsynced } from '../src/main/services/discard-unsynced'

function page(account = false): Record<string, unknown> {
  return { id: 'expense-page', last_edited_time: '2026-10-13T00:00:00.000Z', properties: {
    'Purchase description': { type: 'title', title: [{ plain_text: 'To pay bill' }] },
    Accounts: { type: 'relation', relation: account ? [{ id: 'notion-account' }] : [] }
  } }
}

beforeEach(() => {
  state.db?.close(); state.db = new DatabaseSync(':memory:')
  const folder = join(process.cwd(), 'src/main/db/migrations')
  const journal = JSON.parse(readFileSync(join(folder, 'meta/_journal.json'), 'utf8')) as { entries: { tag: string }[] }
  for (const entry of journal.entries) state.db.exec(readFileSync(join(folder, `${entry.tag}.sql`), 'utf8'))
  state.db.prepare("INSERT INTO accounts (id, notion_page_id, account_name, account_type, created_at) VALUES ('local-account', 'notion-account', 'Cash', 'Cash', 0)").run()
  api.updatePage.mockClear(); api.createPage.mockClear()
  api.queryDatabase.mockImplementation(async (dbId: string) => dbId === 'income-db' ? state.incomePages : state.pages)
  state.pages = [page()]
  state.incomePages = []
})
afterAll(() => state.db.close())

it('pushes another receipt without an expense edit overwriting the two-way relation', async () => {
  const expensePage = page(true)
  Object.assign(expensePage.properties as object, {
    'CC Link Payment Receipt': { type: 'relation', relation: [{ id: 'first-payment' }] }
  })
  state.pages = [expensePage, { ...page(true), id: 'other-expense' }]
  state.incomePages = [
    { id: 'first-payment', properties: { 'CC Payment Covered': { relation: [{ id: 'expense-page' }] } } },
    { id: 'second-payment', properties: { 'CC Payment Covered': { relation: [{ id: 'other-expense' }] } } }
  ]
  expect((await pullAll(true)).errors).toEqual([])
  const expense = listExpenses().find((record) => record.ccLinkPaymentReceiptId)!
  const first = listIncomes().find((payment) => payment.id === expense.ccLinkPaymentReceiptId)!
  const second = listIncomes().find((payment) => payment.id !== first.id)!
  expect(first.ccPaymentCoveredIds).toEqual([expense.id])
  updateIncome(second.id, { addCcPaymentCoveredIds: [expense.id] })
  const retried = updateIncome(second.id, { addCcPaymentCoveredIds: [expense.id] })
  expect(retried.ccPaymentCoveredIds).toEqual([second.ccPaymentCoveredIds![0], expense.id])
  updateExpense(expense.id, { description: 'Updated expense' })

  expect((await pushAll()).errors).toEqual([])
  expect(api.updatePage).toHaveBeenCalledWith('second-payment', expect.objectContaining({
    'CC Payment Covered': { relation: [{ id: 'other-expense' }, { id: 'expense-page' }] }
  }), expect.anything())
  const expenseWrite = api.updatePage.mock.calls.find(([id]) => id === 'expense-page')
  expect(expenseWrite?.[1]).toEqual(expect.objectContaining({
    'Purchase description': { title: [{ text: { content: 'Updated expense' } }] }
  }))
  expect(expenseWrite?.[1]).not.toHaveProperty('CC Link Payment Receipt')
})

describe('incomplete To Pay expenses', () => {
  it('imports an expense with no account, category, dates, or amount into To Pay', async () => {
    const result = await pullAll(true)
    expect(result.errors).toEqual([])
    expect(result.inserted).toBe(1)
    const records = listExpenses({ expenseViewMode: 'To pay' })
    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({ accountId: '', categoryId: '', purchaseDate: '', datePaid: null, amount: 0 })
  })

  it('clears the Notion account and preserves a local rename through pull then push', async () => {
    state.pages = [page(true)]
    expect((await pullAll(true)).errors).toEqual([])
    const id = listExpenses()[0].id
    expect(getExpense(id).accountId).toBe('local-account')
    state.pages = [page()]
    updateExpense(id, { description: 'Renamed bill' })
    const result = await pullAll(true)
    expect(result.errors).toEqual([])
    expect(result.autoMerged).toBe(1)
    expect(getExpense(id)).toMatchObject({ accountId: '', description: 'Renamed bill' })
    expect((await pushAll()).errors).toEqual([])
    expect(api.updatePage).toHaveBeenCalledWith('expense-page', expect.objectContaining({
      Accounts: { relation: [] }, 'Purchase description': { title: [{ text: { content: 'Renamed bill' } }] }
    }), expect.anything())
    expect(getExpense(id).syncState).toBe('clean')
  })

  it('restores a hard-deleted incomplete expense without losing BNPL adjustment', async () => {
    expect((await pullAll(true)).errors).toEqual([])
    const id = listExpenses()[0].id
    hardDeleteExpense(id)
    discardUnsynced('expenses', id)
    expect(getExpense(id)).toMatchObject({ accountId: '', datePaid: null, bnplAdjustment: null })
  })

  it('creates and edits an entirely blank To Pay record and pushes null dates/relations', async () => {
    const record = createExpense({ viewMode: 'To pay', description: '', purchaseDate: '', amount: 0, accountId: '', categoryId: '' })
    updateExpense(record.id, { viewMode: 'To pay', description: '', purchaseDate: '', accountId: '', categoryId: '' })
    expect((await pushAll()).errors).toEqual([])
    expect(api.createPage).toHaveBeenCalledWith('expense-db', expect.objectContaining({
      Accounts: { relation: [] }, 'Purchase Date': { date: null }
    }), expect.anything())
  })
})
