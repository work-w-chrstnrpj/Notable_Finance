// CSV format for exporting the cached custom budgets (ADR-0010). CSV import was removed: budgets are edited in Notion.
// Pure function: no file, dialog or database access, so it runs the same in tests and in main.
// Format: `Month,Category,Budget`, UTF-8 with BOM, CRLF, RFC 4180 quoting.
// Spec: wiki/desktop/monthly-budget-snapshots.md (section 8).
import { roundBudget } from '../../shared/saved-budgets'

export const CSV_BOM = '\uFEFF'
export const CSV_HEADER = ['Month', 'Category', 'Budget'] as const

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
