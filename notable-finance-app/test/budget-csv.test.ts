// CSV parse, preview and classification seam (spec: tickets/monthly-budget/spec.md, seam 3, pure part).
// The file dialogs and the atomic commit are covered in budget-files.test.ts.
import { describe, expect, it } from 'vitest'
import {
  classifyImport,
  formatBudgetCsv,
  MAX_IMPORT_ROWS,
  parseBudgetAmount,
  parseBudgetCsv,
  parseCsv,
  parseMonthCell
} from '../src/main/services/budget-csv'
import type { SavedBudgetRow } from '../src/shared/saved-budgets'

const categories = [
  { id: 'food', name: 'Food' },
  { id: 'drinks', name: 'Food, "Drinks"' },
  { id: 'transport', name: 'Transport' }
]

function row(month: string, categoryId: string, budget: number, categoryName = categoryId): SavedBudgetRow {
  return { id: `${month}-${categoryId}`, month, categoryId, categoryName, budget, createdAt: 1, updatedAt: 1 }
}

const run = (csv: string, existing: SavedBudgetRow[] = [], policy: 'overwrite' | 'skip-existing-months' = 'overwrite') =>
  classifyImport(parseBudgetCsv(csv), categories, existing, policy)

describe('formatBudgetCsv', () => {
  it('monthly-budget/04#AC1 writes a BOM, the Month,Category,Budget header, CRLF line endings and a trailing CRLF', () => {
    const text = formatBudgetCsv([
      { month: '2026-01', category: 'Food', budget: 5000 },
      { month: '2026-02', category: 'Transport', budget: 1999.5 }
    ])
    expect(text.charCodeAt(0)).toBe(0xfeff)
    expect(text.slice(1)).toBe('Month,Category,Budget\r\n2026-01,Food,5000\r\n2026-02,Transport,1999.5\r\n')
    // No bare LF anywhere.
    expect(text.replace(/\r\n/g, '')).not.toMatch(/\n/)
  })

  it('monthly-budget/04#AC1 quotes names that contain commas, quotes or line breaks (RFC 4180)', () => {
    const text = formatBudgetCsv([{ month: '2026-01', category: 'Food, "Drinks"', budget: 10 }])
    expect(text).toContain('2026-01,"Food, ""Drinks""",10')
    expect(parseCsv(text)[1]).toEqual(['2026-01', 'Food, "Drinks"', '10'])
  })
})

describe('parseCsv / parseBudgetCsv', () => {
  it('reads CRLF and LF files, a BOM, quoted commas, doubled quotes and a missing final newline', () => {
    expect(parseCsv('\uFEFFa,b\r\n"x, y","say ""hi"""\n1,2')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
      ['1', '2']
    ])
  })

  it('monthly-budget/04#AC4 matches headers case-insensitively, in any order, and ignores extra columns', () => {
    const lines = parseBudgetCsv('Notes,BUDGET,category,Month\r\nx,100,Food,2026-01\r\n')
    expect(lines).toEqual([{ line: 2, month: '2026-01', category: 'Food', budget: '100' }])
  })

  it('rejects a file without the three columns, and an empty file', () => {
    expect(() => parseBudgetCsv('Month,Category\r\n2026-01,Food')).toThrow(/Month, Category and Budget/)
    expect(() => parseBudgetCsv('')).toThrow(/empty/)
  })

  it('skips fully blank lines and keeps real line numbers', () => {
    const lines = parseBudgetCsv('Month,Category,Budget\r\n\r\n2026-01,Food,1\r\n')
    expect(lines.map((l) => l.line)).toEqual([3])
  })

  it('monthly-budget/04#AC8 rejects a file over the row limit', () => {
    const body = Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => `2026-01,Food ${i},1`).join('\r\n')
    expect(() => parseBudgetCsv(`Month,Category,Budget\r\n${body}`)).toThrow(/limit/)
  })
})

describe('amount and month cells', () => {
  it('monthly-budget/04#AC4 tolerates the peso sign, spaces and thousands commas', () => {
    expect(parseBudgetAmount('₱5,000.00')).toEqual({ value: 5000 })
    expect(parseBudgetAmount(' 1 234.5 ')).toEqual({ value: 1234.5 })
    expect(parseBudgetAmount('0')).toEqual({ value: 0 })
  })

  it('monthly-budget/04#AC5 rejects empty, negative and non-numeric budgets with a reason', () => {
    expect(parseBudgetAmount('')).toEqual({ error: 'Budget is empty' })
    expect(parseBudgetAmount('-5')).toEqual({ error: 'Budget cannot be negative' })
    expect(parseBudgetAmount('abc')).toHaveProperty('error')
    expect(parseBudgetAmount('1e3')).toHaveProperty('error')
  })

  it('monthly-budget/04#AC4 reads YYYY-MM or truncates YYYY-MM-DD, and rejects other months', () => {
    expect(parseMonthCell('2026-01')).toBe('2026-01')
    expect(parseMonthCell(' 2026-03-15 ')).toBe('2026-03')
    expect(parseMonthCell('2026-13')).toBeNull()
    expect(parseMonthCell('Jan 2026')).toBeNull()
  })
})

describe('classifyImport', () => {
  it('monthly-budget/04#AC4 matches categories by trimmed, case-insensitive name', () => {
    const r = run('Month,Category,Budget\r\n2026-01,  food ,100\r\n')
    expect(r.writes).toEqual([{ month: '2026-01', categoryId: 'food', categoryName: 'Food', budget: 100 }])
  })

  it('monthly-budget/04#AC5 flags unknown categories, ambiguous names, bad months and bad budgets, each with a reason', () => {
    const ambiguous = classifyImport(
      parseBudgetCsv('Month,Category,Budget\r\n2026-01,Food,1\r\n'),
      [...categories, { id: 'food2', name: 'food' }],
      [],
      'overwrite'
    )
    expect(ambiguous.rows[0]).toMatchObject({ status: 'invalid' })
    expect(ambiguous.rows[0]!.reason).toMatch(/More than one category/)

    const r = run(
      'Month,Category,Budget\r\n2026-01,Nope,5\r\n2026-13,Food,5\r\n2026-01,Food,-5\r\n2026-01,,5\r\n'
    )
    expect(r.counts.invalid).toBe(4)
    expect(r.rows.map((x) => x.reason)).toEqual([
      'Unknown category "Nope"',
      expect.stringMatching(/not a real month/),
      'Budget cannot be negative',
      'Category is empty'
    ])
    expect(r.writes).toEqual([])
  })

  it('monthly-budget/04#AC5 flags a duplicate month and category within the file; the last row wins', () => {
    const r = run('Month,Category,Budget\r\n2026-01,Food,100\r\n2026-01,Food,200\r\n')
    expect(r.rows[0]).toMatchObject({ status: 'invalid' })
    expect(r.rows[0]!.reason).toMatch(/line 3/)
    expect(r.rows[1]).toMatchObject({ status: 'new' })
    expect(r.writes).toEqual([{ month: '2026-01', categoryId: 'food', categoryName: 'Food', budget: 200 }])
  })

  it('monthly-budget/04#AC5 counts new, changed and unchanged rows against what is saved', () => {
    const existing = [row('2026-01', 'food', 100), row('2026-01', 'transport', 50)]
    const r = run('Month,Category,Budget\r\n2026-01,Food,100\r\n2026-01,Transport,75\r\n2026-02,Food,10\r\n', existing)
    expect(r.counts).toEqual({ new: 1, changed: 1, unchanged: 1, skipped: 0, invalid: 0 })
    expect(r.rows[1]).toMatchObject({ status: 'changed', previousBudget: 50 })
    // Unchanged rows are not written.
    expect(r.writes.map((w) => w.categoryId)).toEqual(['transport', 'food'])
  })

  it('monthly-budget/04#AC6 never creates a category; an unmatched row is skipped and valid rows still import', () => {
    const r = run('Month,Category,Budget\r\n2026-01,Brand New,5\r\n2026-01,Food,6\r\n')
    expect(r.counts).toMatchObject({ invalid: 1, new: 1 })
    expect(r.writes).toHaveLength(1)
    expect(r.writes[0]!.categoryId).toBe('food')
  })

  it('monthly-budget/04#AC6 falls back to a saved row of the same name for a removed category', () => {
    const existing = [row('2026-01', 'gone-id', 900, 'Gym')]
    const r = run('Month,Category,Budget\r\n2026-01,gym,950\r\n', existing)
    expect(r.rows[0]).toMatchObject({ status: 'changed', previousBudget: 900 })
    expect(r.writes[0]).toMatchObject({ categoryId: 'gone-id', categoryName: 'Gym', budget: 950 })
  })

  it('monthly-budget/04#AC7 overwrite keeps rows that are not in the file; skip leaves months that already have a set alone', () => {
    const existing = [row('2026-01', 'food', 100)]
    const csv = 'Month,Category,Budget\r\n2026-01,Transport,75\r\n2026-02,Food,10\r\n'
    const overwrite = run(csv, existing, 'overwrite')
    expect(overwrite.writes.map((w) => `${w.month}:${w.categoryId}`)).toEqual(['2026-01:transport', '2026-02:food'])

    const skip = run(csv, existing, 'skip-existing-months')
    expect(skip.counts).toMatchObject({ skipped: 1, new: 1 })
    expect(skip.rows[0]).toMatchObject({ status: 'skipped', reason: 'This month already has saved budgets' })
    expect(skip.writes.map((w) => `${w.month}:${w.categoryId}`)).toEqual(['2026-02:food'])
  })

  it('monthly-budget/04#AC8 reports zero writable rows for a file with only invalid rows', () => {
    expect(run('Month,Category,Budget\r\nx,y,z\r\n').writes).toHaveLength(0)
  })
})
