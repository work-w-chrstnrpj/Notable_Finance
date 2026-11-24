// CSV writing for the cached custom budgets (custom-budget/03: import and parsing were removed).
import { describe, expect, it } from 'vitest'
import { formatBudgetCsv } from '../src/main/services/budget-csv'

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
  })
})
