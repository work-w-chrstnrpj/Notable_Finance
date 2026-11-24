// Custom budgets: CSV export of the read-only cache with a native save dialog (ADR-0010).
// Dialogs and file paths stay in main. CSV import was removed: budgets are edited in Notion. Nothing here calls Notion.
import { dialog, type BrowserWindow } from 'electron'
import { writeFileSync } from 'node:fs'
import { budgetCategories, listSavedBudgets } from '../db/budgets'
import { ValidationError } from '../domain/validation'
import { formatBudgetCsv } from './budget-csv'
import type { BudgetExportRequest, BudgetExportResult } from '../../shared/finance.types'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

// ── export ──────────────────────────────────────────────────────────────────

/** Build the CSV rows for an export request. */
export function buildExportRows(req: BudgetExportRequest): Array<{ month: string; category: string; budget: number }> {
  const categories = budgetCategories()
  if (req.kind !== 'saved') throw new ValidationError('kind must be saved')
  if ((req.fromMonth === undefined) !== (req.toMonth === undefined)) {
    throw new ValidationError('Give both a from and a to month, or neither for every saved month')
  }
  const liveNameById = new Map(categories.map((c) => [c.id, c.name]))
  return listSavedBudgets(req.fromMonth, req.toMonth)
    .map((row) => ({
      month: row.month,
      // Use today's name when the category still exists.
      category: liveNameById.get(row.categoryId) ?? row.categoryName,
      budget: row.budget
    }))
    .sort((a, b) => a.month.localeCompare(b.month) || a.category.localeCompare(b.category, undefined, { sensitivity: 'base' }))
}

export async function exportBudgetsCsv(
  req: BudgetExportRequest,
  win?: BrowserWindow | null
): Promise<BudgetExportResult> {
  const rows = buildExportRows(req)
  const defaultName = `notable-finance-budgets-${today()}.csv`
  const options = {
    title: 'Export custom budgets',
    defaultPath: defaultName,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  }
  const out = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options)
  if (out.canceled || !out.filePath) return { canceled: true }
  writeFileSync(out.filePath, formatBudgetCsv(rows), 'utf8')
  return { canceled: false, path: out.filePath, rows: rows.length }
}
