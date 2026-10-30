import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const state = vi.hoisted(() => ({ db: null as unknown as DatabaseSync }))
// Use the same real SQL as production, with a transaction adapter for node:sqlite.
vi.mock('../src/main/db', () => ({ getSqlite: () => ({
  prepare: (sql: string) => state.db.prepare(sql),
  transaction: (fn: () => unknown) => () => {
    state.db.exec('BEGIN IMMEDIATE')
    try { const result = fn(); state.db.exec('COMMIT'); return result }
    catch (err) { state.db.exec('ROLLBACK'); throw err }
  }
}) }))
vi.mock('../src/main/notion/service', () => ({ client: () => api }))
vi.mock('../src/main/notion/mapping-store', () => ({ getMapping: () => ({ incomes: 'income-db' }) }))
vi.mock('../src/main/sync/status', () => ({ isRunning: () => false, setRunning: vi.fn(), emitStatus: vi.fn(), syncStatus: () => ({ connected: true, mapped: true }) }))
vi.mock('../src/main/windows', () => ({ broadcast: vi.fn() }))
vi.mock('../src/main/services/history', () => ({ recordActivity: vi.fn() }))
vi.mock('../src/main/services/page-content', () => ({ replaceNotionPageContent: vi.fn() }))
const api = vi.hoisted(() => ({ queryDatabase: vi.fn(async () => [] as Record<string, unknown>[]),
  updatePage: vi.fn(async () => ({ id: 'loan-page' })), createPage: vi.fn(async () => ({ id: 'loan-page' })) }))

import { createIncome, updateIncome, getIncome, listIncomes, listAccounts, listIncomeCategories,
  reclassifyMoneyLent, repayMoneyLent } from '../src/main/db/repositories'
import { dashboard, monitoring } from '../src/main/services/reports'
import { pushAll } from '../src/main/sync/push'
import { pullAll } from '../src/main/sync/pull'
import { receivableAmount } from '../src/shared/money-lent'

beforeEach(() => {
  state.db?.close(); state.db = new DatabaseSync(':memory:')
  const folder = join(process.cwd(), 'src/main/db/migrations')
  const journal = JSON.parse(readFileSync(join(folder, 'meta/_journal.json'), 'utf8')) as { entries: { tag: string }[] }
  for (const entry of journal.entries) state.db.exec(readFileSync(join(folder, `${entry.tag}.sql`), 'utf8'))
  for (const id of ['a', 'b']) state.db.prepare("INSERT INTO accounts (id, notion_page_id, account_name, account_type, created_at) VALUES (?, ?, ?, 'Cash', 0)").run(id, `notion-${id}`, id)
  for (const [id, name] of [['loan', 'Money Lent'], ['savings', 'Savings'], ['transfer', 'Transfer'], ['salary', 'Salary']]) {
    state.db.prepare('INSERT INTO income_categories (id, notion_page_id, source, created_at) VALUES (?, ?, ?, 0)').run(id, `notion-${id}`, name)
  }
  state.db.prepare("UPDATE income_categories SET auxiliary = 1 WHERE id IN ('savings', 'transfer')").run()
  api.createPage.mockClear(); api.updatePage.mockClear(); api.queryDatabase.mockReset(); api.queryDatabase.mockResolvedValue([])
})
afterAll(() => state.db.close())

function loan(amount = 1000) {
  return createIncome({ view: 'moneyLent', name: 'Ana loan', date: '2026-10-20', grossIncome: amount, accountId: 'a', notes: 'Keep this note' })
}
function repay(id: string, account = 'a') {
  return repayMoneyLent(id, { receivingAccountId: account, date: '2026-10-30', expectedAmount: 1000, expectedSourceAccountId: 'a' })
}
function balances() { return listAccounts().map((account) => account.currentBalance) }
function remotePage(properties: Record<string, unknown>) {
  return { id: 'loan-page', last_edited_time: '2026-10-30T00:00:00.000Z', properties }
}

describe('Money Lent lifecycle', () => {
  it('deducts once, shows a positive receivable, and excludes loans from normal income and reports', () => {
    const record = loan()
    expect(record.grossIncome).toBe(-1000)
    expect(balances()).toEqual([-1000, 0])
    expect(listIncomes({ view: 'receivables' }).map((r) => r.id)).toEqual([record.id])
    expect(receivableAmount(record, 'Money Lent')).toBe(1000)
    expect(listIncomes()).toEqual([])
    expect(listIncomeCategories().find((c) => c.id === 'loan')?.auxiliary).toBe(true)
    expect(dashboard('2026-10')).toMatchObject({ totalIncome: 0, totalCashFlow: -1000 })
    expect(monitoring('2026-10')).toMatchObject({ monthlyIncome: 0, monthlyGrossIncome: 0 })
  })

  it('soft-deletes on repayment to the original account and rejects repeated repayment', () => {
    const record = loan()
    expect(repay(record.id)).toMatchObject({ id: record.id, grossIncome: 0, deleted: true, syncState: 'dirty' })
    expect(balances()).toEqual([0, 0])
    expect(listIncomes({ view: 'receivables' })).toEqual([])
    expect(() => repay(record.id)).toThrow('not an outstanding')
    expect(state.db.prepare('SELECT COUNT(*) AS n FROM incomes').get()).toEqual({ n: 1 })
  })

  it('converts in place into a negative-source Transfer and preserves notes, identity, and deduction', () => {
    const record = loan()
    state.db.prepare("UPDATE incomes SET notion_page_id = 'existing-page' WHERE id = ?").run(record.id)
    expect(repay(record.id, 'b')).toMatchObject({ id: record.id, accountId: 'a', transactedAccountId: 'b',
      grossIncome: -1000, categoryId: 'transfer', date: '2026-10-30' })
    expect(balances()).toEqual([-1000, 1000])
    expect(dashboard('2026-10').totalIncome).toBe(0)
    expect(monitoring('2026-10').monthlyIncome).toBe(0)
    expect(listIncomes({ view: 'receivables' })).toEqual([])
    expect(listIncomes({ view: 'transfers' })).toHaveLength(1)
    expect(state.db.prepare('SELECT notion_page_id, is_transaction, notes FROM incomes WHERE id = ?').get(record.id))
      .toMatchObject({ notion_page_id: 'existing-page', is_transaction: 1, notes: 'Keep this note\nMoney Lent: lent 2026-10-20; fully repaid 2026-10-30.' })
    expect(() => repay(record.id, 'b')).toThrow('not an outstanding')
  })

  it('reclassifies an explicitly selected Savings record without changing its balance or date', () => {
    const savings = createIncome({ name: 'Ana', date: '2026-10-20', grossIncome: -1000, accountId: 'a', categoryId: 'savings' })
    expect(reclassifyMoneyLent(savings.id)).toMatchObject({ categoryId: 'loan', grossIncome: -1000, date: savings.date })
    expect(balances()).toEqual([-1000, 0])
    expect(listIncomes({ view: 'alkansya' })).toEqual([])
    expect(listIncomes({ view: 'receivables' })).toHaveLength(1)
    expect(() => reclassifyMoneyLent(savings.id)).toThrow('Only an outstanding')
  })

  it('keeps legacy no-account receivables and does not treat all negative savings as loans', () => {
    createIncome({ name: 'Unassigned', date: '2026-10-20', grossIncome: 20, categoryId: 'salary' })
    createIncome({ name: 'Reserve', date: '2026-10-20', grossIncome: -50, categoryId: 'savings', accountId: 'a' })
    expect(listIncomes({ view: 'receivables' }).map((r) => r.name)).toEqual(['Unassigned'])
    expect(receivableAmount({ ...loan(), categoryId: 'salary', grossIncome: -10 }, 'Salary')).toBe(-10)
  })

  it('preserves category and amount validation for edits and rejects invalid settlement and stale previews', () => {
    const record = loan()
    expect(updateIncome(record.id, { grossIncome: 500 }).grossIncome).toBe(-500)
    expect(() => repay(record.id, 'b')).toThrow('loan changed')
    updateIncome(record.id, { grossIncome: -1000 })
    expect(() => updateIncome(record.id, { categoryId: 'transfer' })).toThrow('Record repayment')
    expect(() => updateIncome(record.id, { capitalExpenditure: 10 })).toThrow('capital expenditure')
    expect(() => repay(record.id, 'missing')).toThrow('active non-credit')
    expect(() => repayMoneyLent(record.id, { receivingAccountId: 'b', date: '2026-10-01', expectedAmount: 1000, expectedSourceAccountId: 'a' })).toThrow('before the date lent')
    state.db.prepare("UPDATE accounts SET account_type = 'Credit Account' WHERE id = 'b'").run()
    expect(() => repay(record.id, 'b')).toThrow('active non-credit')
    state.db.prepare("UPDATE incomes SET sync_state = 'conflict' WHERE id = ?").run(record.id)
    expect(() => repay(record.id)).toThrow('not an outstanding')
    expect(balances()).toEqual([-1000, 0])
  })

  it('fails clearly with no mutation when the required category is missing', () => {
    state.db.prepare("DELETE FROM income_categories WHERE id = 'loan'").run()
    expect(() => loan()).toThrow('Create exactly one "Money Lent"')
    expect(state.db.prepare('SELECT COUNT(*) AS n FROM incomes').get()).toEqual({ n: 0 })
  })

  it('rolls back the record and journal if journaling settlement fails', () => {
    const record = loan()
    state.db.exec("CREATE TRIGGER reject_journal BEFORE INSERT ON mutation_queue BEGIN SELECT RAISE(ABORT, 'journal failed'); END")
    expect(() => repay(record.id, 'b')).toThrow('journal failed')
    expect(getIncome(record.id)).toMatchObject({ categoryId: 'loan', transactedAccountId: null })
    expect(balances()).toEqual([-1000, 0])
  })

  it.each(['a', 'b'])('syncs offline repayment into %s using the same Notion page and survives pull', async (account) => {
    const record = loan()
    expect((await pushAll()).errors).toEqual([])
    expect(api.createPage).toHaveBeenCalledTimes(1)
    repay(record.id, account)
    expect((await pushAll()).errors).toEqual([])
    expect(api.createPage).toHaveBeenCalledTimes(1)
    const properties = api.updatePage.mock.calls.at(-1)![1] as Record<string, unknown>
    expect(properties).toMatchObject({
      'Gross Income': { number: account === 'a' ? 0 : -1000 },
      Accounts: { relation: [{ id: 'notion-a' }] },
      'Transacted Account': { relation: account === 'a' ? [] : [{ id: 'notion-b' }] },
      Categories: { relation: [{ id: account === 'a' ? 'notion-loan' : 'notion-transfer' }] }
    })
    api.queryDatabase.mockResolvedValue([remotePage(properties)])
    expect((await pullAll(true)).errors).toEqual([])
    expect(getIncome(record.id).syncState).toBe('clean')
    expect(listIncomes({ view: 'receivables' })).toEqual([])
    expect(balances()).toEqual(account === 'a' ? [0, 0] : [-1000, 1000])
  })
})
