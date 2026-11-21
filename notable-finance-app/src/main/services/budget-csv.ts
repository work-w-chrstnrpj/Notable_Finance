// CSV format and import classification for saved budgets (ADR-0006).
// Pure functions: no file, dialog or database access, so they run the same in tests and in main.
// Format: `Month,Category,Budget`, UTF-8 with BOM, CRLF, RFC 4180 quoting.
// Spec: wiki/desktop/monthly-budget-snapshots.md (section 8).
import { ValidationError } from '../domain/validation'
import { isValidMonth, roundBudget, type SavedBudgetRow } from '../../shared/saved-budgets'
import type {
  BudgetImportPolicy,
  BudgetImportRowPreview,
  BudgetImportRowStatus
} from '../../shared/finance.types'

export const CSV_BOM = '\uFEFF'
export const CSV_HEADER = ['Month', 'Category', 'Budget'] as const
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024
export const MAX_IMPORT_ROWS = 20_000

// ── writing ─────────────────────────────────────────────────────────────────

function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) || value !== value.trim() ? `"${value.replace(/"/g, '""')}"` : value
}

/** `Month,Category,Budget` with a BOM so Excel opens it as UTF-8, CRLF line endings, trailing CRLF. */
export function formatBudgetCsv(rows: Array<{ month: string; category: string; budget: number }>): string {
  const lines = [CSV_HEADER.join(',')]
  for (const row of rows) {
    lines.push([escapeCell(row.month), escapeCell(row.category), String(roundBudget(row.budget))].join(','))
  }
  return `${CSV_BOM}${lines.join('\r\n')}\r\n`
}

// ── reading ─────────────────────────────────────────────────────────────────

/** RFC 4180 reader: quoted cells, doubled quotes, commas and newlines inside quotes, CRLF or LF. */
export function parseCsv(input: string): string[][] {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false
  let i = 0
  while (i < text.length) {
    const ch = text[i]!
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i += 2
          continue
        }
        inQuotes = false
      } else cell += ch
      i += 1
      continue
    }
    if (ch === '"') inQuotes = true
    else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\r' || ch === '\n') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += ch
    i += 1
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

/** `5,000.00`, `₱5,000` and ` 5000 ` all read as a number. Returns a reason when it cannot. */
export function parseBudgetAmount(raw: string): { value: number } | { error: string } {
  const text = raw.trim()
  if (text === '') return { error: 'Budget is empty' }
  const cleaned = text.replace(/[₱\s,]/g, '')
  if (cleaned.startsWith('-')) return { error: 'Budget cannot be negative' }
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return { error: `Budget "${text}" is not a number` }
  const value = Number(cleaned)
  if (!Number.isFinite(value)) return { error: `Budget "${text}" is not a number` }
  return { value: roundBudget(value) }
}

/** `YYYY-MM`, or a full `YYYY-MM-DD` date truncated to its month. Null when it is not a real month. */
export function parseMonthCell(raw: string): string | null {
  const text = raw.trim()
  const month = /^\d{4}-\d{2}-\d{2}$/.test(text) ? text.slice(0, 7) : text
  return isValidMonth(month) ? month : null
}

export interface ParsedBudgetLine {
  /** 1-based line number in the file (the header is line 1). */
  line: number
  month: string
  category: string
  budget: string
}

/** Find the Month, Category and Budget columns (case-insensitive, any order, extras ignored). */
export function parseBudgetCsv(text: string): ParsedBudgetLine[] {
  const rows = parseCsv(text)
  const header = rows[0]?.map((h) => h.trim().toLowerCase())
  if (!header) throw new ValidationError('The file is empty')
  const col = (name: string) => header.indexOf(name)
  const monthCol = col('month')
  const categoryCol = col('category')
  const budgetCol = col('budget')
  if (monthCol < 0 || categoryCol < 0 || budgetCol < 0) {
    throw new ValidationError('The file needs Month, Category and Budget columns')
  }
  const lines: ParsedBudgetLine[] = []
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i]!
    // A fully blank line is not a row.
    if (cells.every((c) => c.trim() === '')) continue
    lines.push({
      line: i + 1,
      month: cells[monthCol] ?? '',
      category: cells[categoryCol] ?? '',
      budget: cells[budgetCol] ?? ''
    })
  }
  if (lines.length > MAX_IMPORT_ROWS) {
    throw new ValidationError(`The file has ${lines.length} rows; the limit is ${MAX_IMPORT_ROWS}`)
  }
  return lines
}

// ── classification ──────────────────────────────────────────────────────────

export interface ImportCategory {
  id: string
  name: string
}

/** A row that will be written when the import is committed. */
export interface ImportWrite {
  month: string
  categoryId: string
  categoryName: string
  budget: number
}

export interface ClassifiedImport {
  rows: BudgetImportRowPreview[]
  writes: ImportWrite[]
  counts: Record<BudgetImportRowStatus, number>
}

const key = (month: string, categoryId: string) => `${month}|${categoryId}`
const norm = (value: string) => value.trim().toLowerCase()

/**
 * Check every parsed line and say what an import would do with it.
 *
 * - A category is matched by trimmed, case-insensitive name against the current categories.
 *   Two current categories with the same name make the row an error. With no match, a saved row
 *   of the same name in that month is used; otherwise the row is an error. Import never creates a category.
 * - The same month and category twice in one file: the last row wins, the earlier is invalid.
 * - policy 'skip-existing-months': rows for a month that already has a saved set are skipped.
 */
export function classifyImport(
  lines: ParsedBudgetLine[],
  categories: ImportCategory[],
  existing: SavedBudgetRow[],
  policy: BudgetImportPolicy
): ClassifiedImport {
  const byName = new Map<string, ImportCategory[]>()
  for (const c of categories) {
    const list = byName.get(norm(c.name))
    if (list) list.push(c)
    else byName.set(norm(c.name), [c])
  }
  const existingByKey = new Map(existing.map((r) => [key(r.month, r.categoryId), r]))
  const savedByMonthName = new Map(existing.map((r) => [`${r.month}|${norm(r.categoryName)}`, r]))
  const monthsWithSet = new Set(existing.map((r) => r.month))

  interface Resolved {
    preview: BudgetImportRowPreview
    target?: ImportWrite
  }
  const resolved: Resolved[] = lines.map((line) => {
    const base = { line: line.line, month: line.month.trim(), category: line.category.trim() }
    const invalid = (reason: string, budget: number | null = null): Resolved => ({
      preview: { ...base, budget, status: 'invalid', reason }
    })
    const month = parseMonthCell(line.month)
    if (!month) return invalid(`Month "${line.month.trim()}" is not a real month (use YYYY-MM)`)
    if (base.category === '') return invalid('Category is empty')
    const amount = parseBudgetAmount(line.budget)
    if ('error' in amount) return invalid(amount.error)

    const matches = byName.get(norm(base.category)) ?? []
    let category: ImportCategory | undefined
    if (matches.length > 1) return invalid(`More than one category is named "${base.category}"`, amount.value)
    if (matches.length === 1) category = matches[0]
    else {
      const saved = savedByMonthName.get(`${month}|${norm(base.category)}`)
      if (saved) category = { id: saved.categoryId, name: saved.categoryName }
    }
    if (!category) return invalid(`Unknown category "${base.category}"`, amount.value)

    return {
      preview: { ...base, month, budget: amount.value, status: 'new' },
      target: { month, categoryId: category.id, categoryName: category.name, budget: amount.value }
    }
  })

  // The last occurrence of a month and category wins; earlier ones are flagged.
  const lastIndex = new Map<string, number>()
  resolved.forEach((r, index) => {
    if (r.target) lastIndex.set(key(r.target.month, r.target.categoryId), index)
  })

  const writes: ImportWrite[] = []
  resolved.forEach((r, index) => {
    if (!r.target) return
    const k = key(r.target.month, r.target.categoryId)
    if (lastIndex.get(k) !== index) {
      const winner = resolved[lastIndex.get(k)!]!.preview.line
      r.preview.status = 'invalid'
      r.preview.reason = `Duplicate month and category; line ${winner} is used instead`
      return
    }
    if (policy === 'skip-existing-months' && monthsWithSet.has(r.target.month)) {
      r.preview.status = 'skipped'
      r.preview.reason = 'This month already has saved budgets'
      return
    }
    const current = existingByKey.get(k)
    if (!current) {
      r.preview.status = 'new'
      writes.push(r.target)
    } else if (current.budget === r.target.budget) {
      r.preview.status = 'unchanged'
    } else {
      r.preview.status = 'changed'
      r.preview.previousBudget = current.budget
      writes.push(r.target)
    }
  })

  const counts: Record<BudgetImportRowStatus, number> = { new: 0, changed: 0, unchanged: 0, skipped: 0, invalid: 0 }
  for (const r of resolved) counts[r.preview.status] += 1
  return { rows: resolved.map((r) => r.preview), writes, counts }
}
