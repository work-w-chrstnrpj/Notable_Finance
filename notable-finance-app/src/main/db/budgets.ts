// Saved budgets repository (ADR-0006): per-month copies of expense category budgets.
// Local only. Not a sync table, so nothing here touches Notion, the mutation queue or base snapshots.
// Sync reset, discard-unsynced and Notion re-pull never reference this table.
import { randomUUID } from 'node:crypto'
import { getSqlite } from './index'
import { listExpenseCategories } from './repositories'
import { assertBudgetAmount, assertSavedBudgetMonth, ValidationError } from '../domain/validation'
import { roundBudget, type SavedBudgetRow } from '../../shared/saved-budgets'
import type { SavedBudgetInput } from '../../shared/finance.types'

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

export function monthHasSavedBudgets(month: string): boolean {
  const row = getSqlite()
    .prepare('SELECT 1 AS present FROM monthly_budget_snapshots WHERE month = ? LIMIT 1')
    .get(month) as { present: number } | undefined
  return Boolean(row)
}

/** The categories Monitoring lists: current expense categories that are not auxiliary. */
export function budgetCategories(): Array<{ id: string; name: string; monthlyBudget: number }> {
  return listExpenseCategories()
    .filter((c) => !c.auxiliary)
    .map((c) => ({ id: c.id, name: c.name, monthlyBudget: c.monthlyBudget }))
}

function validateRows(rows: SavedBudgetInput[]): SavedBudgetInput[] {
  if (!Array.isArray(rows)) throw new ValidationError('rows must be a list')
  const seen = new Set<string>()
  return rows.map((row, index) => {
    if (!row || typeof row.categoryId !== 'string' || row.categoryId.trim() === '') {
      throw new ValidationError(`Row ${index + 1}: categoryId is required`)
    }
    if (typeof row.categoryName !== 'string' || row.categoryName.trim() === '') {
      throw new ValidationError(`Row ${index + 1}: category name is required`)
    }
    assertBudgetAmount(row.budget, `Budget for ${row.categoryName}`)
    if (seen.has(row.categoryId)) {
      throw new ValidationError(`Row ${index + 1}: ${row.categoryName} appears twice`)
    }
    seen.add(row.categoryId)
    return {
      categoryId: row.categoryId,
      categoryName: row.categoryName.trim(),
      budget: roundBudget(row.budget)
    }
  })
}

/** Replace a month's saved set with `rows` in one transaction. An empty list deletes the set. */
export function replaceBudgetSet(month: string, rows: SavedBudgetInput[]): { saved: number } {
  assertSavedBudgetMonth(month)
  const clean = validateRows(rows)
  const sqlite = getSqlite()
  const now = Date.now()
  const write = sqlite.transaction(() => {
    const createdAtByCategory = new Map(
      (
        sqlite
          .prepare('SELECT category_id, created_at FROM monthly_budget_snapshots WHERE month = ?')
          .all(month) as Array<{ category_id: string; created_at: number }>
      ).map((r) => [r.category_id, r.created_at])
    )
    sqlite.prepare('DELETE FROM monthly_budget_snapshots WHERE month = ?').run(month)
    const insert = sqlite.prepare(
      `INSERT INTO monthly_budget_snapshots
         (id, month, category_id, category_name, budget, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    for (const row of clean) {
      insert.run(randomUUID(), month, row.categoryId, row.categoryName, row.budget, createdAtByCategory.get(row.categoryId) ?? now, now)
    }
  })
  write()
  return { saved: clean.length }
}

/**
 * Copy today's Notion budgets for every Monitoring category into a month's saved set.
 * When the month already has a set, `replace` must be true (the UI asks first).
 */
export function saveBudgetsFromNotion(month: string, replace: boolean): { saved: number } {
  assertSavedBudgetMonth(month)
  if (!replace && monthHasSavedBudgets(month)) {
    throw new ValidationError(`Saved budgets already exist for ${month}. Confirm to replace them.`)
  }
  const rows = budgetCategories().map((c) => ({
    categoryId: c.id,
    categoryName: c.name,
    budget: c.monthlyBudget
  }))
  return replaceBudgetSet(month, rows)
}

/** Hard-delete a month's saved set. The month goes back to using Notion budgets. */
export function deleteBudgetSet(month: string): { deleted: number } {
  assertSavedBudgetMonth(month)
  const info = getSqlite().prepare('DELETE FROM monthly_budget_snapshots WHERE month = ?').run(month)
  return { deleted: info.changes }
}

/**
 * Upsert many rows across months in one transaction (CSV import). Either every row is written
 * or none. Existing rows keep their id and created_at.
 */
export function upsertBudgetRows(
  rows: Array<{ month: string; categoryId: string; categoryName: string; budget: number }>
): { written: number; months: number } {
  const clean = rows.map((row) => {
    assertSavedBudgetMonth(row.month)
    assertBudgetAmount(row.budget, `Budget for ${row.categoryName}`)
    return { ...row, budget: roundBudget(row.budget) }
  })
  const sqlite = getSqlite()
  const now = Date.now()
  const write = sqlite.transaction(() => {
    const upsert = sqlite.prepare(
      `INSERT INTO monthly_budget_snapshots
         (id, month, category_id, category_name, budget, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(month, category_id) DO UPDATE SET
         category_name = excluded.category_name,
         budget = excluded.budget,
         updated_at = excluded.updated_at`
    )
    for (const row of clean) {
      upsert.run(randomUUID(), row.month, row.categoryId, row.categoryName, row.budget, now, now)
    }
  })
  write()
  return { written: clean.length, months: new Set(clean.map((r) => r.month)).size }
}
