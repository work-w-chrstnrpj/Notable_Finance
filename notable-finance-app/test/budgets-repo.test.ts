// Saved-budgets repository on a temporary SQLite database (spec seam 2).
// Same Electron mock and "skip when the native binding does not match" pattern as backup.test.ts.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync, readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const state = vi.hoisted(() => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { mkdtempSync } = require('node:fs') as typeof import('node:fs')
  const { tmpdir } = require('node:os') as typeof import('node:os')
  const { join: j } = require('node:path') as typeof import('node:path')
  /* eslint-enable @typescript-eslint/no-require-imports */
  return { dir: mkdtempSync(j(tmpdir(), 'nf-budgets-test-')) }
})

vi.mock('electron', () => ({
  app: {
    getPath: () => state.dir,
    getAppPath: () => process.cwd(),
    isPackaged: false,
    getVersion: () => '3.0.0'
  },
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

const dbIt = sqliteUsable ? it : it.skip
const dbDescribe = sqliteUsable ? describe : describe.skip
const dbBeforeAll = sqliteUsable ? beforeAll : () => {}
const dbBeforeEach = sqliteUsable ? beforeEach : () => {}

import { closeDatabase, getSqlite, initDatabase } from '../src/main/db'
import {
  deleteBudgetSet,
  listSavedBudgets,
  replaceBudgetSet,
  saveBudgetsFromNotion,
  upsertBudgetRows
} from '../src/main/db/budgets'
import { resolveBudgets, monthsInRange } from '../src/shared/saved-budgets'
import { getUiSettings, setUiSettings } from '../src/main/settings/ui'

function seedCategories() {
  const sqlite = getSqlite()
  sqlite.exec('DELETE FROM expense_categories')
  const insert = sqlite.prepare(
    'INSERT INTO expense_categories (id, notion_page_id, name, monthly_budget, auxiliary, created_at) VALUES (?, ?, ?, ?, ?, 1)'
  )
  insert.run('food', 'n-food', 'Food', 8000, 0)
  insert.run('transport', 'n-transport', 'Transport', 2000, 0)
  insert.run('aux', 'n-aux', 'Transfer', 0, 1)
}

dbBeforeAll(() => {
  initDatabase()
})

afterAll(() => {
  if (sqliteUsable) closeDatabase()
  rmSync(state.dir, { recursive: true, force: true })
})

dbBeforeEach(() => {
  getSqlite().exec('DELETE FROM monthly_budget_snapshots')
  seedCategories()
})

dbDescribe('monthly-budget/02 migration', () => {
  dbIt('monthly-budget/02#AC1 the migration creates the table, unique per month and category', () => {
    const sqlite = getSqlite()
    const table = sqlite
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'monthly_budget_snapshots'")
      .get()
    expect(table).toBeTruthy()
    replaceBudgetSet('2026-01', [{ categoryId: 'food', categoryName: 'Food', budget: 1 }])
    expect(() =>
      sqlite
        .prepare(
          "INSERT INTO monthly_budget_snapshots (id, month, category_id, category_name, budget, created_at, updated_at) VALUES ('dup', '2026-01', 'food', 'Food', 2, 1, 1)"
        )
        .run()
    ).toThrow(/UNIQUE/)
  })

  dbIt('monthly-budget/02#AC1 an existing database upgrades without losing data', async () => {
    // Build a database with migrations 0000..0014 only, add data, then apply every migration.
    const { default: Database } = await import('better-sqlite3')
    const { drizzle } = await import('drizzle-orm/better-sqlite3')
    const { migrate } = await import('drizzle-orm/better-sqlite3/migrator')
    const { cpSync, mkdirSync, writeFileSync } = await import('node:fs')
    const source = join(process.cwd(), 'src/main/db/migrations')
    const older = join(state.dir, 'migrations-before-0015')
    mkdirSync(older, { recursive: true })
    cpSync(source, older, { recursive: true })
    rmSync(join(older, '0015_monthly_budget_snapshots.sql'))
    // Later migrations (0016 loan terms) sort after 0015; leave them out too so the old database is truly 0000..0014.
    rmSync(join(older, '0016_loan_terms.sql'))
    const journalPath = join(older, 'meta/_journal.json')
    const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as { entries: Array<{ tag: string }> }
    journal.entries = journal.entries.filter((e) => e.tag !== '0015_monthly_budget_snapshots' && e.tag !== '0016_loan_terms')
    writeFileSync(journalPath, JSON.stringify(journal))

    const file = join(state.dir, 'upgrade.sqlite')
    const conn = new Database(file)
    migrate(drizzle(conn), { migrationsFolder: older })
    expect(conn.prepare("SELECT 1 FROM sqlite_master WHERE name = 'monthly_budget_snapshots'").get()).toBeUndefined()
    conn
      .prepare('INSERT INTO expenses (id, title, amount, interest, local_updated_at, created_at) VALUES (?, ?, ?, 0, 1, 1)')
      .run('exp-1', 'Lunch', 250)

    migrate(drizzle(conn), { migrationsFolder: source })
    expect(conn.prepare("SELECT 1 FROM sqlite_master WHERE name = 'monthly_budget_snapshots'").get()).toBeTruthy()
    expect(conn.prepare('SELECT title, amount FROM expenses WHERE id = ?').get('exp-1')).toEqual({
      title: 'Lunch',
      amount: 250
    })
    conn.close()
  })
})

dbDescribe('monthly-budget/02 saving', () => {
  dbIt('monthly-budget/02#AC2 rejects a month that is not a real YYYY-MM', () => {
    const rows = [{ categoryId: 'food', categoryName: 'Food', budget: 1 }]
    for (const bad of ['2026-13', '2026-00', '2026-1', 'January', '']) {
      expect(() => replaceBudgetSet(bad, rows)).toThrow(/real month/)
    }
    expect(listSavedBudgets()).toHaveLength(0)
  })

  dbIt('monthly-budget/02#AC2 rejects a negative or non-finite budget and saves nothing', () => {
    for (const budget of [-1, Number.NaN, Number.POSITIVE_INFINITY, '5' as unknown as number]) {
      expect(() => replaceBudgetSet('2026-01', [{ categoryId: 'food', categoryName: 'Food', budget }])).toThrow()
    }
    expect(listSavedBudgets()).toHaveLength(0)
  })

  dbIt('monthly-budget/02#AC2 rounds budgets to 2 decimals', () => {
    replaceBudgetSet('2026-01', [{ categoryId: 'food', categoryName: 'Food', budget: 10.005 }])
    expect(listSavedBudgets('2026-01', '2026-01')[0]!.budget).toBe(10.01)
  })

  dbIt('monthly-budget/02#AC3 copies the Notion budgets of the Monitoring categories into a month', () => {
    const out = saveBudgetsFromNotion('2026-03', false)
    // The auxiliary category is not one Monitoring shows, so it is not copied.
    expect(out.saved).toBe(2)
    expect(listSavedBudgets('2026-03', '2026-03').map((r) => [r.categoryName, r.budget])).toEqual([
      ['Food', 8000],
      ['Transport', 2000]
    ])
  })

  dbIt('monthly-budget/02#AC3 asks to replace when the month already has a set', () => {
    saveBudgetsFromNotion('2026-03', false)
    expect(() => saveBudgetsFromNotion('2026-03', false)).toThrow(/already exist/)
    expect(saveBudgetsFromNotion('2026-03', true).saved).toBe(2)
  })

  dbIt('monthly-budget/02#AC3 replaces a month in one transaction: a bad row leaves the old set untouched', () => {
    replaceBudgetSet('2026-01', [{ categoryId: 'food', categoryName: 'Food', budget: 5000 }])
    expect(() =>
      replaceBudgetSet('2026-01', [
        { categoryId: 'food', categoryName: 'Food', budget: 1 },
        { categoryId: 'transport', categoryName: 'Transport', budget: -1 }
      ])
    ).toThrow()
    expect(listSavedBudgets('2026-01', '2026-01').map((r) => r.budget)).toEqual([5000])
  })

  dbIt('monthly-budget/02#AC3 deletes a month and lists rows for a range only', () => {
    replaceBudgetSet('2026-01', [{ categoryId: 'food', categoryName: 'Food', budget: 1 }])
    replaceBudgetSet('2026-02', [{ categoryId: 'food', categoryName: 'Food', budget: 2 }])
    replaceBudgetSet('2026-05', [{ categoryId: 'food', categoryName: 'Food', budget: 5 }])
    expect(listSavedBudgets('2026-02', '2026-04').map((r) => r.month)).toEqual(['2026-02'])
    expect(listSavedBudgets().map((r) => r.month)).toEqual(['2026-01', '2026-02', '2026-05'])
    expect(deleteBudgetSet('2026-02')).toEqual({ deleted: 1 })
    expect(listSavedBudgets().map((r) => r.month)).toEqual(['2026-01', '2026-05'])
  })

  dbIt('monthly-budget/04#AC9 a bulk upsert is atomic: one bad row writes nothing', () => {
    expect(() =>
      upsertBudgetRows([
        { month: '2026-01', categoryId: 'food', categoryName: 'Food', budget: 1 },
        { month: '2026-02', categoryId: 'food', categoryName: 'Food', budget: -5 }
      ])
    ).toThrow()
    expect(listSavedBudgets()).toHaveLength(0)
  })

  dbIt('a bulk upsert updates a matching row in place and keeps its id and created_at', () => {
    upsertBudgetRows([{ month: '2026-01', categoryId: 'food', categoryName: 'Food', budget: 1 }])
    const before = listSavedBudgets()[0]!
    upsertBudgetRows([{ month: '2026-01', categoryId: 'food', categoryName: 'Food', budget: 2 }])
    const after = listSavedBudgets()
    expect(after).toHaveLength(1)
    expect(after[0]).toMatchObject({ id: before.id, createdAt: before.createdAt, budget: 2 })
  })
})

dbDescribe('monthly-budget/02 budget source setting', () => {
  dbIt('monthly-budget/02#AC9 monthly-budget/03#AC10 the chosen source persists across a restart of the database', () => {
    expect(getUiSettings().monitoringBudgetSource).toBe('notion')
    setUiSettings({ monitoringBudgetSource: 'saved' })
    closeDatabase()
    initDatabase() // same file, like an app restart
    expect(getUiSettings().monitoringBudgetSource).toBe('saved')
    // Other settings patches do not reset it.
    setUiSettings({ hardDeleteEnabled: false })
    expect(getUiSettings().monitoringBudgetSource).toBe('saved')
    setUiSettings({ monitoringBudgetSource: 'notion' })
    expect(getUiSettings().monitoringBudgetSource).toBe('notion')
  })
})

dbDescribe('monthly-budget/02 protection from sync', () => {
  dbIt('monthly-budget/02#AC8 a Notion re-pull that replaces the category cache leaves saved rows in place', () => {
    replaceBudgetSet('2026-01', [
      { categoryId: 'food', categoryName: 'Food', budget: 5000 },
      { categoryId: 'transport', categoryName: 'Transport', budget: 1000 }
    ])
    // What reset + pull does to the reference cache: wipe, then re-insert with new local ids.
    const sqlite = getSqlite()
    sqlite.exec('DELETE FROM expense_categories')
    sqlite
      .prepare('INSERT INTO expense_categories (id, notion_page_id, name, monthly_budget, auxiliary, created_at) VALUES (?, ?, ?, ?, 0, 1)')
      .run('food-NEW', 'n-food', 'Food', 8000)
    expect(listSavedBudgets()).toHaveLength(2)

    // The saved rows still resolve against the new category by name; Transport (gone) is kept too.
    const months = monthsInRange('Monthly', '2026-01')
    const r = resolveBudgets({
      months,
      categories: [{ id: 'food-NEW', name: 'Food', monthlyBudget: 8000 }],
      snapshots: listSavedBudgets('2026-01', '2026-01'),
      source: 'saved'
    })
    expect(r.perCategory.find((c) => c.categoryId === 'food-NEW')?.budget).toBe(5000)
    expect(r.perCategory.find((c) => c.name === 'Transport')?.budget).toBe(1000)
  })

  it('monthly-budget/02#AC8 the sync reset, discard-unsynced and pull code never name the saved-budgets table', () => {
    const root = join(process.cwd(), 'src/main')
    const files = [
      ...readdirSync(join(root, 'sync')).map((f) => join(root, 'sync', f)),
      join(root, 'services/discard-unsynced.ts')
    ].filter((f) => f.endsWith('.ts'))
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(/monthly_budget_snapshots/)
    }
    // The reset wipes an explicit list of tables, so a table that is not listed is never wiped.
    const reset = readFileSync(join(root, 'sync/reset.ts'), 'utf8')
    expect(reset).toMatch(/const TABLES_TO_CLEAR = \[/)
  })

  it('monthly-budget/02#AC10 monthly-budget/04#AC11 no saved-budget code imports or calls Notion', () => {
    const root = join(process.cwd(), 'src/main')
    const files = ['db/budgets.ts', 'services/budget-csv.ts', 'services/budget-files.ts', 'ipc/budgets.ts']
    for (const file of files) {
      const text = readFileSync(join(root, file), 'utf8')
      expect(text, file).not.toMatch(/from ['"][^'"]*(notion|sync)[^'"]*['"]/i)
      expect(text, file).not.toMatch(/fetch\(|notion\.com/i)
    }
  })
})
