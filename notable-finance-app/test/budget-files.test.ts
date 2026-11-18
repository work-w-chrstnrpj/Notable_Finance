// CSV export and import through the file dialogs, with a temporary database (spec seam 3, DB part).
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
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
import { listSavedBudgets, replaceBudgetSet } from '../src/main/db/budgets'
import {
  buildExportRows,
  commitBudgetImport,
  exportBudgetsCsv,
  previewBudgetImport
} from '../src/main/services/budget-files'

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
  insert.run('drinks', 'n-drinks', 'Food, "Drinks"', 300, 0)
  insert.run('transport', 'n-transport', 'Transport', 2000, 0)
  insert.run('aux', 'n-aux', 'Transfer', 0, 1)
  state.savePath = join(state.dir, 'out.csv')
  state.openPath = join(state.dir, 'in.csv')
})

const csv = (rows: string[]) => `\uFEFFMonth,Category,Budget\r\n${rows.join('\r\n')}\r\n`

dbDescribe('monthly-budget/04 export', () => {
  dbIt('monthly-budget/04#AC1 writes the file the save dialog chose: BOM, header, CRLF, sorted by month then category', async () => {
    replaceBudgetSet('2026-02', [{ categoryId: 'food', categoryName: 'Food', budget: 7 }])
    replaceBudgetSet('2026-01', [
      { categoryId: 'transport', categoryName: 'Transport', budget: 2 },
      { categoryId: 'food', categoryName: 'Food', budget: 1 }
    ])
    const out = await exportBudgetsCsv({ kind: 'saved' })
    expect(out).toMatchObject({ canceled: false, rows: 3 })
    const text = readFileSync(state.savePath!, 'utf8')
    expect(text).toBe('\uFEFFMonth,Category,Budget\r\n2026-01,Food,1\r\n2026-01,Transport,2\r\n2026-02,Food,7\r\n')
  })

  dbIt('monthly-budget/04#AC1 writes nothing when the user closes the save dialog', async () => {
    state.savePath = null
    expect(await exportBudgetsCsv({ kind: 'saved' })).toEqual({ canceled: true })
  })

  dbIt('monthly-budget/04#AC2 exports all saved months or only the months in a range', async () => {
    for (const m of ['2026-01', '2026-02', '2026-03']) {
      replaceBudgetSet(m, [{ categoryId: 'food', categoryName: 'Food', budget: 1 }])
    }
    expect(buildExportRows({ kind: 'saved' })).toHaveLength(3)
    expect(buildExportRows({ kind: 'saved', fromMonth: '2026-02', toMonth: '2026-03' }).map((r) => r.month)).toEqual([
      '2026-02',
      '2026-03'
    ])
    expect(() => buildExportRows({ kind: 'saved', fromMonth: '2026-02' })).toThrow(/both/)
  })

  dbIt('monthly-budget/04#AC2 the template has one row per month and Monitoring category, prefilled with Notion budgets', () => {
    const rows = buildExportRows({ kind: 'template', fromMonth: '2026-01', toMonth: '2026-02' })
    // 2 months x 3 non-auxiliary categories; the auxiliary one is left out.
    expect(rows).toHaveLength(6)
    expect(rows.filter((r) => r.month === '2026-01').map((r) => [r.category, r.budget])).toEqual(
      expect.arrayContaining([
        ['Food', 8000],
        ['Transport', 2000],
        ['Food, "Drinks"', 300]
      ])
    )
    expect(() => buildExportRows({ kind: 'template', fromMonth: '2026-05', toMonth: '2026-01' })).toThrow(/not be before/)
    expect(() => buildExportRows({ kind: 'template', fromMonth: '2026-01' })).toThrow(/from and a to/)
  })

  dbIt('monthly-budget/04#AC3 export then import into an empty set reproduces identical rows', async () => {
    replaceBudgetSet('2026-01', [
      { categoryId: 'food', categoryName: 'Food', budget: 5000 },
      { categoryId: 'drinks', categoryName: 'Food, "Drinks"', budget: 250.5 }
    ])
    replaceBudgetSet('2026-02', [{ categoryId: 'transport', categoryName: 'Transport', budget: 0 }])
    const before = listSavedBudgets().map(({ month, categoryId, categoryName, budget }) => ({ month, categoryId, categoryName, budget }))
    await exportBudgetsCsv({ kind: 'saved' })

    getSqlite().exec('DELETE FROM monthly_budget_snapshots')
    state.openPath = state.savePath
    const preview = await previewBudgetImport({ policy: 'overwrite' })
    expect(preview).toMatchObject({ writable: 3, counts: { new: 3, invalid: 0 } })
    commitBudgetImport({ previewId: preview!.previewId, policy: 'overwrite' })
    const after = listSavedBudgets().map(({ month, categoryId, categoryName, budget }) => ({ month, categoryId, categoryName, budget }))
    expect(after).toEqual(before)
  })

  dbIt('monthly-budget/04#AC3 the template imports without errors', async () => {
    await exportBudgetsCsv({ kind: 'template', fromMonth: '2026-01', toMonth: '2026-03' })
    state.openPath = state.savePath
    const preview = await previewBudgetImport({ policy: 'overwrite' })
    expect(preview!.counts).toMatchObject({ invalid: 0, new: 9 })
  })
})

dbDescribe('monthly-budget/04 import', () => {
  dbIt('monthly-budget/04#AC5 shows a preview that lists invalid rows first and writes nothing yet', async () => {
    writeFileSync(state.openPath!, csv(['2026-01,Food,100', '2026-01,Nope,5', '2026-13,Food,5']), 'utf8')
    const preview = await previewBudgetImport({ policy: 'overwrite' })
    expect(preview).toMatchObject({ fileName: 'in.csv', writable: 1, truncated: false })
    expect(preview!.rows.map((r) => r.status)).toEqual(['invalid', 'invalid', 'new'])
    expect(listSavedBudgets()).toHaveLength(0)
  })

  dbIt('monthly-budget/04#AC6 valid rows still import when other rows are invalid', async () => {
    writeFileSync(state.openPath!, csv(['2026-01,Food,100', '2026-01,Nope,5']), 'utf8')
    const preview = await previewBudgetImport({ policy: 'overwrite' })
    expect(commitBudgetImport({ previewId: preview!.previewId, policy: 'overwrite' })).toEqual({ written: 1, months: 1 })
    expect(listSavedBudgets().map((r) => [r.month, r.categoryName, r.budget])).toEqual([['2026-01', 'Food', 100]])
  })

  dbIt('monthly-budget/04#AC7 switching the policy re-checks the same file without reopening the dialog', async () => {
    replaceBudgetSet('2026-01', [{ categoryId: 'transport', categoryName: 'Transport', budget: 9 }])
    writeFileSync(state.openPath!, csv(['2026-01,Food,100', '2026-02,Food,100']), 'utf8')
    const first = await previewBudgetImport({ policy: 'overwrite' })
    expect(first!.writable).toBe(2)
    state.openPath = null // a second dialog would now be canceled
    const second = await previewBudgetImport({ previewId: first!.previewId, policy: 'skip-existing-months' })
    expect(second).toMatchObject({ previewId: first!.previewId, writable: 1, counts: { skipped: 1, new: 1 } })
    commitBudgetImport({ previewId: first!.previewId, policy: 'skip-existing-months' })
    // January kept its own set and only February was added.
    expect(listSavedBudgets().map((r) => `${r.month}:${r.categoryId}`)).toEqual(['2026-01:transport', '2026-02:food'])
  })

  dbIt('monthly-budget/04#AC7 overwrite changes matching rows and keeps the others in that month', async () => {
    replaceBudgetSet('2026-01', [
      { categoryId: 'food', categoryName: 'Food', budget: 1 },
      { categoryId: 'transport', categoryName: 'Transport', budget: 2 }
    ])
    writeFileSync(state.openPath!, csv(['2026-01,Food,100']), 'utf8')
    const preview = await previewBudgetImport({ policy: 'overwrite' })
    commitBudgetImport({ previewId: preview!.previewId, policy: 'overwrite' })
    expect(listSavedBudgets().map((r) => [r.categoryId, r.budget])).toEqual([
      ['food', 100],
      ['transport', 2]
    ])
  })

  dbIt('monthly-budget/04#AC8 refuses to commit when there are no valid rows', async () => {
    writeFileSync(state.openPath!, csv(['2026-01,Nope,5']), 'utf8')
    const preview = await previewBudgetImport({ policy: 'overwrite' })
    expect(preview!.writable).toBe(0)
    expect(() => commitBudgetImport({ previewId: preview!.previewId, policy: 'overwrite' })).toThrow(/no valid rows/)
  })

  dbIt('monthly-budget/04#AC8 rejects a file over 5 MB', async () => {
    writeFileSync(state.openPath!, 'Month,Category,Budget\r\n' + 'x'.repeat(5 * 1024 * 1024 + 1), 'utf8')
    await expect(previewBudgetImport({ policy: 'overwrite' })).rejects.toThrow(/larger than 5 MB/)
  })

  dbIt('monthly-budget/04#AC8 returns null when the user closes the open dialog', async () => {
    state.openPath = null
    expect(await previewBudgetImport({ policy: 'overwrite' })).toBeNull()
  })

  dbIt('monthly-budget/04#AC10 commit takes only a preview id and policy, so the renderer never sends rows back', async () => {
    writeFileSync(state.openPath!, csv(['2026-01,Food,100']), 'utf8')
    const preview = await previewBudgetImport({ policy: 'overwrite' })
    // Extra "rows" smuggled into the call are ignored; only the previewed file is written.
    const smuggled = { previewId: preview!.previewId, policy: 'overwrite', rows: [{ month: '2026-01', categoryId: 'food', budget: 999999 }] }
    commitBudgetImport(smuggled as Parameters<typeof commitBudgetImport>[0])
    expect(listSavedBudgets()[0]!.budget).toBe(100)
    // The id is single-use: a second commit has nothing to write.
    expect(() => commitBudgetImport({ previewId: preview!.previewId, policy: 'overwrite' })).toThrow(/expired/)
    expect(() => commitBudgetImport({ previewId: 'made-up', policy: 'overwrite' })).toThrow(/expired/)
  })

  dbIt('monthly-budget/04#AC9 a failed commit writes none of the file', async () => {
    writeFileSync(state.openPath!, csv(['2026-01,Food,100', '2026-02,Transport,50']), 'utf8')
    const preview = await previewBudgetImport({ policy: 'overwrite' })
    // Make the second write fail inside the transaction.
    getSqlite().exec(
      `CREATE TRIGGER fail_second BEFORE INSERT ON monthly_budget_snapshots WHEN NEW.month = '2026-02' BEGIN SELECT RAISE(ABORT, 'boom'); END;`
    )
    try {
      expect(() => commitBudgetImport({ previewId: preview!.previewId, policy: 'overwrite' })).toThrow(/boom/)
    } finally {
      getSqlite().exec('DROP TRIGGER fail_second')
    }
    expect(listSavedBudgets()).toHaveLength(0)
  })
})
