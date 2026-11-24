// Saved Budgets Notion mirror (ADR-0008) against a fake Notion client and a temporary SQLite database.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { rmSync } from 'node:fs'

const state = vi.hoisted(() => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { mkdtempSync } = require('node:fs') as typeof import('node:fs')
  const { tmpdir } = require('node:os') as typeof import('node:os')
  const { join: j } = require('node:path') as typeof import('node:path')
  /* eslint-enable @typescript-eslint/no-require-imports */
  return { dir: mkdtempSync(j(tmpdir(), 'nf-mirror-test-')) }
})

vi.mock('electron', () => ({
  app: { getPath: () => state.dir, getAppPath: () => process.cwd(), isPackaged: false, getVersion: () => '3.0.0' },
  dialog: {}
}))

const sqliteUsable = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3') as typeof import('better-sqlite3').default
    new Database(':memory:').close()
    return true
  } catch {
    return false
  }
})()
const dbDescribe = sqliteUsable ? describe : describe.skip
const dbBeforeAll = sqliteUsable ? beforeAll : () => {}
const dbBeforeEach = sqliteUsable ? beforeEach : () => {}

import { closeDatabase, getSqlite, initDatabase } from '../src/main/db'
import { listSavedBudgets, replaceAllSavedBudgets } from '../src/main/db/budgets'
import {
  addMissingColumns,
  checkSavedBudgetsDatabase,
  getMirrorStatus,
  syncCustomBudgets,
  type MirrorClient
} from '../src/main/notion/saved-budgets-mirror'
import { saveMapping } from '../src/main/notion/mapping-store'
import { NotionApiError } from '../src/main/notion/client'
import { formatBudgetMonthTitle, parseBudgetPeriod, splitAmountEvenly } from '../src/shared/budget-periods'

type FakePage = { id: string; last_edited_time: string; in_trash?: boolean; properties: Record<string, unknown> }

class FakeNotion {
  schema: Record<string, { type: string }> = { Name: { type: 'title' } }
  pages: FakePage[] = []
  databaseGone = false

  getDatabase = vi.fn(async (id: string) => {
    if (this.databaseGone) throw new NotionApiError('gone', 404, 'object_not_found')
    return { id }
  })
  getDataSourceSchema = vi.fn(async () => ({ properties: this.schema }))
  addDataSourceProperties = vi.fn(async (_id: string, props: Record<string, unknown>) => {
    for (const name of Object.keys(props)) this.schema[name] = { type: 'number' }
  })
  queryDatabase = vi.fn(async () => this.pages)
  /** A page typed by hand in Notion. */
  addHandmade(title: string, values: Record<string, number>, editedAt = Date.now() + 60_000): FakePage {
    const props: Record<string, unknown> = { Name: { type: 'title', title: [{ plain_text: title }] } }
    for (const [k, v] of Object.entries(values)) props[k] = { type: 'number', number: v }
    const page = { id: `hand-${this.pages.length + 1}`, last_edited_time: new Date(editedAt).toISOString(), properties: props }
    this.pages.push(page)
    return page
  }
  asClient = () => this as unknown as MirrorClient
}

describe('budget periods (saved-budgets-notion/01)', () => {
  it('saved-budgets-notion/01#AC1 a month title returns that month', () => {
    expect(parseBudgetPeriod('Jan 2025')).toEqual({ ok: true, period: { kind: 'month', months: ['2025-01'] } })
    expect(formatBudgetMonthTitle('2025-01')).toBe('Jan 2025')
  })
  it('saved-budgets-notion/01#AC2 saved-budgets-notion/01#AC3 quarter, half and year titles return their months', () => {
    const q = parseBudgetPeriod('Q1 2024')
    expect(q.ok && q.period.months).toEqual(['2024-01', '2024-02', '2024-03'])
    const h = parseBudgetPeriod('H2 2025')
    expect(h.ok && h.period.months).toEqual(['2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'])
    const y = parseBudgetPeriod('2026')
    expect(y.ok && y.period.months).toHaveLength(12)
  })
  it('saved-budgets-notion/01#AC4 an even split adds back to the total', () => {
    const parts = splitAmountEvenly(1000, 3)
    expect(parts).toEqual([333.33, 333.33, 333.34])
    expect(Math.round(parts.reduce((a, b) => a + b, 0) * 100)).toBe(100000)
  })
  it('saved-budgets-notion/01#AC5 an unrecognized title is rejected with a reason', () => {
    const r = parseBudgetPeriod('Totals')
    expect(r.ok).toBe(false)
    expect(parseBudgetPeriod('Q5 2024').ok).toBe(false)
  })
  it('saved-budgets-notion/01#AC6 titles are case-insensitive and tolerate extra spaces', () => {
    expect(parseBudgetPeriod('  q3   2025 ').ok).toBe(true)
    expect(parseBudgetPeriod('JANUARY 2025').ok).toBe(true)
  })
})

dbDescribe('Custom monthly budget sync (custom-budget/02)', () => {
  dbBeforeAll(() => initDatabase())
  afterAll(() => {
    if (sqliteUsable) closeDatabase()
    rmSync(state.dir, { recursive: true, force: true })
  })
  dbBeforeEach(() => {
    const sqlite = getSqlite()
    sqlite.exec('DELETE FROM monthly_budget_snapshots; DELETE FROM expense_categories; DELETE FROM app_settings')
    const insert = sqlite.prepare(
      'INSERT INTO expense_categories (id, notion_page_id, name, monthly_budget, auxiliary, created_at) VALUES (?, ?, ?, ?, ?, 1)'
    )
    insert.run('food', 'n-food', 'Food', 8000, 0)
    insert.run('transport', 'n-transport', 'Transport', 2000, 0)
    insert.run('aux', 'n-aux', 'Transfer', 0, 1)
  })

  const seedMonth = (month: string, food: number, transport: number) =>
    replaceAllSavedBudgets([
      { month, categoryId: 'food', categoryName: 'Food', budget: food },
      { month, categoryId: 'transport', categoryName: 'Transport', budget: transport }
    ])
  const budget = (month: string, categoryId: string) => listSavedBudgets().find((r) => r.month === month && r.categoryId === categoryId)?.budget
  /** A fake database that already has both category columns, with its ID saved like Notion Configuration does. */
  const readyDatabase = () => {
    const fake = new FakeNotion()
    fake.schema = { Name: { type: 'title' }, Food: { type: 'number' }, Transport: { type: 'number' } }
    saveMapping({ savedBudgets: 'db-1' })
    return fake
  }

  it('custom-budget/02#AC1 with an ID saved, a sync replaces the local cache with the Notion rows', async () => {
    const fake = readyDatabase()
    fake.addHandmade('Jan 2026', { Food: 500, Transport: 100 })
    fake.addHandmade('Feb 2026', { Food: 600, Transport: 150 })
    const run = await syncCustomBudgets({ client: fake.asClient() })
    expect(run.skipped).toBeNull()
    expect(run.cachedMonths).toBe(2)
    expect(budget('2026-01', 'food')).toBe(500)
    expect(budget('2026-02', 'transport')).toBe(150)
  })

  it('custom-budget/02#AC4 an edit made in Notion always replaces the cached value, even an older one', async () => {
    const fake = readyDatabase()
    seedMonth('2025-01', 100, 50)
    const row = fake.addHandmade('Jan 2025', { Food: 999, Transport: 50 })
    row.last_edited_time = new Date(Date.now() - 3_600_000).toISOString() // an older edit still wins
    await syncCustomBudgets({ client: fake.asClient() })
    expect(budget('2025-01', 'food')).toBe(999)
  })

  it('custom-budget/02#AC5 the month row wins over quarter, half and year rows', async () => {
    const fake = readyDatabase()
    fake.addHandmade('2026', { Food: 1200, Transport: 1200 })
    fake.addHandmade('H1 2026', { Food: 600, Transport: 600 })
    fake.addHandmade('Q1 2026', { Food: 300, Transport: 300 })
    fake.addHandmade('Jan 2026', { Food: 7, Transport: 7 })
    await syncCustomBudgets({ client: fake.asClient() })
    expect(budget('2026-01', 'food')).toBe(7) // month
    expect(budget('2026-02', 'food')).toBe(100) // quarter 300 / 3
    expect(budget('2026-05', 'food')).toBe(100) // half 600 / 6
    expect(budget('2026-09', 'food')).toBe(100) // year 1200 / 12
  })

  it('custom-budget/02#AC6 a quarter row is split evenly and adds back to the total', async () => {
    const fake = readyDatabase()
    fake.addHandmade('Q1 2024', { Food: 1000, Transport: 90 })
    await syncCustomBudgets({ client: fake.asClient() })
    const food = ['2024-01', '2024-02', '2024-03'].map((m) => budget(m, 'food') ?? 0)
    expect(food).toEqual([333.33, 333.33, 333.34])
    expect(Math.round(food.reduce((a, b) => a + b, 0) * 100)).toBe(100000)
  })

  it('custom-budget/02#AC7 a month with no row is not in the cache, and a category with no column is skipped', async () => {
    const fake = readyDatabase()
    delete fake.schema.Transport
    fake.addHandmade('Jan 2026', { Food: 500, Transport: 100 })
    const run = await syncCustomBudgets({ client: fake.asClient() })
    expect(run.missingColumns).toEqual(['Transport'])
    expect(budget('2026-02', 'food')).toBeUndefined()
    expect(budget('2026-01', 'transport')).toBeUndefined()
    expect(fake.addDataSourceProperties).not.toHaveBeenCalled()
  })

  it('custom-budget/02#AC8 there is no mirror switch and no newest-edit-wins state in the status', () => {
    const status = getMirrorStatus() as unknown as Record<string, unknown>
    expect(status).not.toHaveProperty('enabled')
    expect(status).not.toHaveProperty('overwrites')
  })

  it('saved-budgets-notion/06#AC2 a saved ID is checked and problems are explained', async () => {
    const fake = new FakeNotion()
    expect((await checkSavedBudgetsDatabase('db-1', fake.asClient())).ok).toBe(true)
    fake.schema = { Food: { type: 'number' } }
    expect((await checkSavedBudgetsDatabase('db-1', fake.asClient())).message).toMatch(/title column/)
    fake.databaseGone = true
    expect((await checkSavedBudgetsDatabase('db-1', fake.asClient())).message).toMatch(/share the database/)
  })

  it('saved-budgets-notion/06#AC7 a removed database is reported and nothing is recreated', async () => {
    const fake = readyDatabase()
    fake.databaseGone = true
    const run = await syncCustomBudgets({ client: fake.asClient() })
    expect(run.skipped).toMatch(/missing/)
    expect(getMirrorStatus().databaseMissing).toBe(true)
    expect(fake.addDataSourceProperties).not.toHaveBeenCalled()
  })

  it('saved-budgets-notion/06#AC5 saved-budgets-notion/06#AC6 the Add missing columns action adds Number columns only', async () => {
    const fake = readyDatabase()
    delete fake.schema.Transport
    fake.schema.Extra = { type: 'number' }
    getSqlite().prepare('INSERT INTO expense_categories (id, notion_page_id, name, monthly_budget, auxiliary, created_at) VALUES (?, ?, ?, ?, 0, 1)').run('fun', 'n-fun', 'Fun', 0)
    const out = await addMissingColumns(fake.asClient())
    expect(out.added).toBe(2)
    expect(Object.keys(fake.schema).sort()).toEqual(['Extra', 'Food', 'Fun', 'Name', 'Transport'])
    expect(out.status.missingColumns).toEqual([])
  })

  it('custom-budget/02 an unrecognized title is skipped and a trashed row is ignored', async () => {
    const fake = readyDatabase()
    fake.addHandmade('Totals', { Food: 1 })
    const trashed = fake.addHandmade('Jan 2026', { Food: 500, Transport: 100 })
    trashed.in_trash = true
    await syncCustomBudgets({ client: fake.asClient() })
    expect(listSavedBudgets()).toHaveLength(0)
  })
})
