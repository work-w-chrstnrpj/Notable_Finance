// CSV export of the read-only custom budget cache through the save dialog, with a temporary database. Import was removed (custom-budget/03).
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const state = vi.hoisted(() => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { mkdtempSync } = require('node:fs') as typeof import('node:fs')
  const { tmpdir } = require('node:os') as typeof import('node:os')
  const { join: j } = require('node:path') as typeof import('node:path')
  /* eslint-enable @typescript-eslint/no-require-imports */
  return {
    dir: mkdtempSync(j(tmpdir(), 'nf-budget-files-test-')),
    savePath: '' as string | null,
    openPath: '' as string | null
  }
})

vi.mock('electron', () => ({
  app: { getPath: () => state.dir, getAppPath: () => process.cwd(), isPackaged: false, getVersion: () => '3.0.0' },
  dialog: {
    showSaveDialog: vi.fn(async () => ({ canceled: !state.savePath, filePath: state.savePath ?? undefined })),
    showOpenDialog: vi.fn(async () => ({
      canceled: !state.openPath,
      filePaths: state.openPath ? [state.openPath] : []
    }))
  }
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
import { replaceAllSavedBudgets } from '../src/main/db/budgets'
import { buildExportRows, exportBudgetsCsv } from '../src/main/services/budget-files'

dbBeforeAll(() => {
  initDatabase()
})

afterAll(() => {
  if (sqliteUsable) closeDatabase()
  rmSync(state.dir, { recursive: true, force: true })
})

dbBeforeEach(() => {
  const sqlite = getSqlite()
  sqlite.exec('DELETE FROM monthly_budget_snapshots; DELETE FROM expense_categories;')
  const insert = sqlite.prepare(
    'INSERT INTO expense_categories (id, notion_page_id, name, monthly_budget, auxiliary, created_at) VALUES (?, ?, ?, ?, ?, 1)'
  )
  insert.run('food', 'n-food', 'Food', 8000, 0)
  insert.run('transport', 'n-transport', 'Transport', 2000, 0)
  state.savePath = join(state.dir, 'out.csv')
})

const row = (month: string, categoryId: string, categoryName: string, budget: number) => ({ month, categoryId, categoryName, budget })

dbDescribe('custom-budget/03 export', () => {
  dbIt('custom-budget/03#AC2 writes the cached budgets to the file the save dialog chose: BOM, header, CRLF, sorted by month then category', async () => {
    replaceAllSavedBudgets([row('2026-02', 'food', 'Food', 7), row('2026-01', 'transport', 'Transport', 2), row('2026-01', 'food', 'Food', 1)])
    const out = await exportBudgetsCsv({ kind: 'saved' })
    expect(out).toMatchObject({ canceled: false, rows: 3 })
    const text = readFileSync(state.savePath!, 'utf8')
    expect(text).toBe('\uFEFFMonth,Category,Budget\r\n2026-01,Food,1\r\n2026-01,Transport,2\r\n2026-02,Food,7\r\n')
  })

  dbIt('custom-budget/03#AC2 writes nothing when the user closes the save dialog', async () => {
    state.savePath = null
    expect(await exportBudgetsCsv({ kind: 'saved' })).toEqual({ canceled: true })
  })

  dbIt('custom-budget/03#AC2 exports all cached months or only the months in a range', () => {
    replaceAllSavedBudgets(['2026-01', '2026-02', '2026-03'].map((m) => row(m, 'food', 'Food', 1)))
    expect(buildExportRows({ kind: 'saved' })).toHaveLength(3)
    expect(buildExportRows({ kind: 'saved', fromMonth: '2026-02', toMonth: '2026-03' }).map((r) => r.month)).toEqual(['2026-02', '2026-03'])
    expect(() => buildExportRows({ kind: 'saved', fromMonth: '2026-02' })).toThrow(/both/)
  })

  dbIt('custom-budget/03#AC1 there is no import and no template export any more', async () => {
    const files = await import('../src/main/services/budget-files')
    expect(Object.keys(files)).toEqual(expect.not.arrayContaining(['previewBudgetImport', 'commitBudgetImport']))
    expect(() => buildExportRows({ kind: 'template' } as never)).toThrow()
  })
})
