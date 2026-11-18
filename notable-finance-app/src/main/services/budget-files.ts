// Saved budgets: CSV export and import with native file dialogs (ADR-0006).
// Dialogs and file paths stay in main. The parsed import rows are held here between preview
// and commit, so the renderer never sends raw rows back. Nothing here calls Notion.
import { dialog, type BrowserWindow } from 'electron'
import { randomUUID } from 'node:crypto'
import { readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'
import { budgetCategories, listSavedBudgets, upsertBudgetRows } from '../db/budgets'
import { assertSavedBudgetMonth, ValidationError } from '../domain/validation'
import { monthsBetween } from '../../shared/saved-budgets'
import {
  classifyImport,
  formatBudgetCsv,
  MAX_IMPORT_BYTES,
  parseBudgetCsv,
  type ParsedBudgetLine
} from './budget-csv'
import type {
  BudgetExportRequest,
  BudgetExportResult,
  BudgetImportPolicy,
  BudgetImportPreview,
  BudgetImportResult
} from '../../shared/finance.types'

const MAX_TEMPLATE_MONTHS = 120
const MAX_PREVIEW_ROWS = 300
const MAX_PENDING = 5

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function assertPolicy(policy: unknown): asserts policy is BudgetImportPolicy {
  if (policy !== 'overwrite' && policy !== 'skip-existing-months') {
    throw new ValidationError('policy must be overwrite or skip-existing-months')
  }
}

// ── export ──────────────────────────────────────────────────────────────────

/** Build the CSV rows for an export request. */
export function buildExportRows(req: BudgetExportRequest): Array<{ month: string; category: string; budget: number }> {
  const categories = budgetCategories()
  if (req.kind === 'template') {
    if (!req.fromMonth || !req.toMonth) throw new ValidationError('A template needs a from and a to month')
    assertSavedBudgetMonth(req.fromMonth, 'fromMonth')
    assertSavedBudgetMonth(req.toMonth, 'toMonth')
    const months = monthsBetween(req.fromMonth, req.toMonth)
    if (months.length === 0) throw new ValidationError('The to month must not be before the from month')
    if (months.length > MAX_TEMPLATE_MONTHS) {
      throw new ValidationError(`A template covers at most ${MAX_TEMPLATE_MONTHS} months`)
    }
    return months.flatMap((month) =>
      categories.map((c) => ({ month, category: c.name, budget: c.monthlyBudget }))
    )
  }
  if (req.kind !== 'saved') throw new ValidationError('kind must be saved or template')
  if ((req.fromMonth === undefined) !== (req.toMonth === undefined)) {
    throw new ValidationError('Give both a from and a to month, or neither for every saved month')
  }
  const liveNameById = new Map(categories.map((c) => [c.id, c.name]))
  return listSavedBudgets(req.fromMonth, req.toMonth)
    .map((row) => ({
      month: row.month,
      // Use today's name when the category still exists, so the file imports back by name.
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
  const defaultName =
    req.kind === 'template'
      ? `notable-finance-budget-template-${today()}.csv`
      : `notable-finance-budgets-${today()}.csv`
  const options = {
    title: req.kind === 'template' ? 'Export budget template' : 'Export saved budgets',
    defaultPath: defaultName,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  }
  const out = win ? await dialog.showSaveDialog(win, options) : await dialog.showSaveDialog(options)
  if (out.canceled || !out.filePath) return { canceled: true }
  writeFileSync(out.filePath, formatBudgetCsv(rows), 'utf8')
  return { canceled: false, path: out.filePath, rows: rows.length }
}

// ── import ──────────────────────────────────────────────────────────────────

interface PendingImport {
  fileName: string
  lines: ParsedBudgetLine[]
}

const pending = new Map<string, PendingImport>()

function remember(entry: PendingImport): string {
  const id = randomUUID()
  pending.set(id, entry)
  // Keep only the most recent few previews.
  while (pending.size > MAX_PENDING) pending.delete(pending.keys().next().value as string)
  return id
}

function toPreview(previewId: string, entry: PendingImport, policy: BudgetImportPolicy): BudgetImportPreview {
  const result = classifyImport(entry.lines, budgetCategories(), listSavedBudgets(), policy)
  // Show every invalid row first, then the rest, capped so a big file cannot flood the window.
  const ordered = [
    ...result.rows.filter((r) => r.status === 'invalid'),
    ...result.rows.filter((r) => r.status !== 'invalid')
  ]
  return {
    previewId,
    fileName: entry.fileName,
    policy,
    counts: result.counts,
    rows: ordered.slice(0, MAX_PREVIEW_ROWS),
    truncated: ordered.length > MAX_PREVIEW_ROWS,
    writable: result.writes.length
  }
}

/**
 * Step 1 of an import. With no `previewId` it opens a file dialog, reads and validates the file and
 * returns a preview (null when the user cancels). With a `previewId` it re-classifies the same file
 * under another policy, without opening the dialog again.
 */
export async function previewBudgetImport(
  opts: { previewId?: string; policy: BudgetImportPolicy },
  win?: BrowserWindow | null
): Promise<BudgetImportPreview | null> {
  assertPolicy(opts.policy)
  if (opts.previewId) {
    const entry = pending.get(opts.previewId)
    if (!entry) throw new ValidationError('This import preview expired. Choose the file again.')
    return toPreview(opts.previewId, entry, opts.policy)
  }
  const options = {
    title: 'Import saved budgets',
    properties: ['openFile' as const],
    filters: [
      { name: 'CSV', extensions: ['csv'] },
      { name: 'All files', extensions: ['*'] }
    ]
  }
  const out = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options)
  if (out.canceled || out.filePaths.length === 0) return null
  const path = out.filePaths[0]!
  if (statSync(path).size > MAX_IMPORT_BYTES) {
    throw new ValidationError(`The file is larger than ${MAX_IMPORT_BYTES / 1024 / 1024} MB`)
  }
  const lines = parseBudgetCsv(readFileSync(path, 'utf8'))
  const entry: PendingImport = { fileName: basename(path), lines }
  return toPreview(remember(entry), entry, opts.policy)
}

/**
 * Step 2 of an import: write the previewed rows in one transaction (all or nothing).
 * Re-classifies against the current data first, so a stale preview never writes stale decisions.
 */
export function commitBudgetImport(opts: { previewId: string; policy: BudgetImportPolicy }): BudgetImportResult {
  assertPolicy(opts.policy)
  const entry = pending.get(opts.previewId)
  if (!entry) throw new ValidationError('This import preview expired. Choose the file again.')
  const result = classifyImport(entry.lines, budgetCategories(), listSavedBudgets(), opts.policy)
  if (result.writes.length === 0) throw new ValidationError('There are no valid rows to import')
  const written = upsertBudgetRows(result.writes)
  pending.delete(opts.previewId)
  return written
}
