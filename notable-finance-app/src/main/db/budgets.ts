// Saved budgets repository (ADR-0006): per-month copies of expense category budgets.
// Local only. Not a sync table, so nothing here touches Notion, the mutation queue or base snapshots.
// Sync reset, discard-unsynced and Notion re-pull never reference this table.
import { randomUUID } from 'node:crypto'
import { getSqlite } from './index'
import { listExpenseCategories } from './repositories'
import { assertBudgetAmount, assertSavedBudgetMonth } from '../domain/validation'
import { roundBudget, type SavedBudgetRow } from '../../shared/saved-budgets'

interface SnapshotDbRow {
  id: string
  month: string
  category_id: string
  category_name: string
  budget: number
  created_at: number
  updated_at: number
}

function mapRow(r: SnapshotDbRow): SavedBudgetRow {
  return {
    id: r.id,
    month: r.month,
    categoryId: r.category_id,
    categoryName: r.category_name,
    budget: r.budget,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  }
}

/** Saved rows for months from `fromMonth` to `toMonth` inclusive; no bounds returns every saved month. */
export function listSavedBudgets(fromMonth?: string, toMonth?: string): SavedBudgetRow[] {
  if (fromMonth !== undefined) assertSavedBudgetMonth(fromMonth, 'fromMonth')
  if (toMonth !== undefined) assertSavedBudgetMonth(toMonth, 'toMonth')
  const rows = getSqlite()
    .prepare(
      `SELECT id, month, category_id, category_name, budget, created_at, updated_at
       FROM monthly_budget_snapshots
       WHERE (? IS NULL OR month >= ?) AND (? IS NULL OR month <= ?)
       ORDER BY month, category_name COLLATE NOCASE`
    )
    .all(fromMonth ?? null, fromMonth ?? null, toMonth ?? null, toMonth ?? null) as SnapshotDbRow[]
  return rows.map(mapRow)
}

/** The categories Monitoring lists: current expense categories that are not auxiliary. */
export function budgetCategories(): Array<{ id: string; name: string; monthlyBudget: number }> {
  return listExpenseCategories()
    .filter((c) => !c.auxiliary)
    .map((c) => ({ id: c.id, name: c.name, monthlyBudget: c.monthlyBudget }))
}

/**
 * Replace the whole local cache of the Custom monthly budget database with `rows` in one transaction
 * (ADR-0010). Either every row is written or none; an empty list empties the cache.
 */
export function replaceAllSavedBudgets(
  rows: Array<{ month: string; categoryId: string; categoryName: string; budget: number }>
): { written: number; months: number } {
  const clean = rows.map((row) => {
    assertSavedBudgetMonth(row.month)
    assertBudgetAmount(row.budget, `Budget for ${row.categoryName}`)
    return { ...row, budget: roundBudget(row.budget) }
  })
  const sqlite = getSqlite()
  const now = Date.now()
  sqlite.transaction(() => {
    sqlite.prepare('DELETE FROM monthly_budget_snapshots').run()
    const insert = sqlite.prepare(
      `INSERT INTO monthly_budget_snapshots
         (id, month, category_id, category_name, budget, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    for (const row of clean) {
      insert.run(randomUUID(), row.month, row.categoryId, row.categoryName, row.budget, now, now)
    }
  })()
  return { written: clean.length, months: new Set(clean.map((r) => r.month)).size }
}
