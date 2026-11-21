// monthly-budget/05#AC5 and #AC6: the monitoring report and chat read tools take an optional
// budget source that defaults to Notion; no chat write tool for saved budgets exists.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { rmSync } from 'node:fs'

const state = vi.hoisted(() => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { mkdtempSync } = require('node:fs') as typeof import('node:fs')
  const { tmpdir } = require('node:os') as typeof import('node:os')
  const { join: j } = require('node:path') as typeof import('node:path')
  /* eslint-enable @typescript-eslint/no-require-imports */
  return { dir: mkdtempSync(j(tmpdir(), 'nf-monitoring-source-')) }
})

vi.mock('electron', () => ({
  app: { getPath: () => state.dir, getAppPath: () => process.cwd(), isPackaged: false, getVersion: () => '1.2.0' },
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
const dbBeforeAll = sqliteUsable ? beforeAll : () => {}
const dbAfterAll = sqliteUsable ? afterAll : () => {}

import { closeDatabase, getSqlite, initDatabase } from '../src/main/db'
import { monitoring } from '../src/main/services/reports'
import { getCategoryBudgetStatus, getMonthlyMonitoringSnapshot } from '../src/main/chat/tools/read-tools'
import { READ_TOOL_DEFINITIONS } from '../src/main/chat/tools/registry'

dbBeforeAll(() => {
  initDatabase()
  getSqlite().exec(`
    INSERT INTO expense_categories (id, notion_page_id, name, monthly_budget, auxiliary, created_at)
    VALUES ('food', 'n-food', 'Food', 8000, 0, 0);
    INSERT INTO monthly_budget_snapshots (id, month, category_id, category_name, budget, created_at, updated_at)
    VALUES ('s1', '2026-03', 'food', 'Food', 5000, 1, 1);
  `)
})
dbAfterAll(() => {
  closeDatabase()
  rmSync(state.dir, { recursive: true, force: true })
})

const food = (r: { expenseCategories: Array<{ id: string; budget: number; remaining: number }> }) =>
  r.expenseCategories.find((c) => c.id === 'food')!

describe('budget source on reports and chat', () => {
  dbIt('monthly-budget/05#AC5 monitoring defaults to Notion budgets and answers do not change', () => {
    expect(food(monitoring('2026-03')).budget).toBe(8000)
    expect(food(monitoring('2026-03', 'notion')).budget).toBe(8000)
    expect(food(getMonthlyMonitoringSnapshot({ month: '2026-03' }) as ReturnType<typeof monitoring>).budget).toBe(8000)
    expect(getCategoryBudgetStatus({ month: '2026-03' }).categories[0]!.budget).toBe(8000)
  })

  dbIt('monthly-budget/05#AC5 asking for saved budgets uses the month saved set, else Notion', () => {
    const saved = monitoring('2026-03', 'saved')
    expect(food(saved).budget).toBe(5000)
    expect(food(saved).remaining).toBe(5000)
    expect(monitoring('2026-04', 'saved').expenseCategories.find((c) => c.id === 'food')!.budget).toBe(8000)
    expect(getCategoryBudgetStatus({ month: '2026-03', budgetSource: 'saved' }).categories[0]!.budget).toBe(5000)
    // Anything but 'saved' is Notion.
    expect(getCategoryBudgetStatus({ month: '2026-03', budgetSource: 'bogus' }).categories[0]!.budget).toBe(8000)
  })

  it('monthly-budget/05#AC6 chat has no tool that writes saved budgets', () => {
    const names = READ_TOOL_DEFINITIONS.map((t) => t.function.name)
    expect(names.some((n) => /savedbudget|saveBudget|budgetSet/i.test(n))).toBe(false)
    const monitoringTool = READ_TOOL_DEFINITIONS.find((t) => t.function.name === 'getMonthlyMonitoringSnapshot')!
    expect(JSON.stringify(monitoringTool)).toContain('budgetSource')
  })
})
