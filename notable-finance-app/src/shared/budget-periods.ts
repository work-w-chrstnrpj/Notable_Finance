// Budget periods for the Saved Budgets Notion database (ADR-0008): the title of a row names a
// month (`Jan 2025`), a quarter (`Q1 2024`), a half (`H1 2025`) or a year (`2026`). Pure functions
// shared by main and renderer. The app pushes months only; other periods are split across months on pull.
import { addMonths, isValidMonth } from './saved-budgets'

export type BudgetPeriodKind = 'month' | 'quarter' | 'half' | 'year'

export interface ParsedBudgetPeriod {
  kind: BudgetPeriodKind
  /** Every month the period covers, as `YYYY-MM`, in order. */
  months: string[]
}

export type BudgetPeriodParse =
  | { ok: true; period: ParsedBudgetPeriod }
  | { ok: false; reason: string }

const MONTH_NAMES = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december'
]

const SHORT_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const pad = (n: number) => String(n).padStart(2, '0')

function monthsFrom(year: number, firstMonth: number, count: number): string[] {
  const start = `${String(year).padStart(4, '0')}-${pad(firstMonth)}`
  return Array.from({ length: count }, (_, i) => addMonths(start, i))
}

/** The title a quarter, half or year row is cached under: `Q1 2026`, `H1 2026`, `2026`. Months have none. */
export function budgetPeriodKey(kind: BudgetPeriodKind, months: string[]): string | null {
  if (kind === 'month' || months.length === 0) return null
  const year = months[0].slice(0, 4)
  const first = Number(months[0].slice(5, 7))
  if (kind === 'year') return year
  return kind === 'quarter' ? `Q${Math.ceil(first / 3)} ${year}` : `H${Math.ceil(first / 6)} ${year}`
}

/** The row a Monitoring view looks for: its calendar quarter, half or year. Monthly has none. */
export function viewPeriodKey(mode: 'Monthly' | 'Quarterly' | 'Semi-Annually' | 'Annually', months: string[]): string | null {
  const kind = mode === 'Quarterly' ? 'quarter' : mode === 'Semi-Annually' ? 'half' : mode === 'Annually' ? 'year' : 'month'
  return budgetPeriodKey(kind, months)
}

/** Read a row title. Unrecognized titles are rejected with a reason, never guessed. */
export function parseBudgetPeriod(title: string): BudgetPeriodParse {
  const text = title.trim().replace(/\s+/g, ' ')
  if (!text) return { ok: false, reason: 'Empty title' }

  let m = /^(\d{4})$/.exec(text)
  if (m) {
    const months = monthsFrom(Number(m[1]), 1, 12)
    return isValidMonth(months[0]) ? { ok: true, period: { kind: 'year', months } } : { ok: false, reason: `Invalid year "${text}"` }
  }

  m = /^q([1-4]) (\d{4})$/i.exec(text)
  if (m) {
    return { ok: true, period: { kind: 'quarter', months: monthsFrom(Number(m[2]), (Number(m[1]) - 1) * 3 + 1, 3) } }
  }

  m = /^h([12]) (\d{4})$/i.exec(text)
  if (m) {
    return { ok: true, period: { kind: 'half', months: monthsFrom(Number(m[2]), (Number(m[1]) - 1) * 6 + 1, 6) } }
  }

  m = /^([a-z]+)\.? (\d{4})$/i.exec(text)
  if (m) {
    const name = m[1].toLowerCase()
    const index = name.length >= 3 ? MONTH_NAMES.findIndex((full) => full.startsWith(name)) : -1
    if (index >= 0) {
      return { ok: true, period: { kind: 'month', months: monthsFrom(Number(m[2]), index + 1, 1) } }
    }
  }

  return { ok: false, reason: `"${title.trim()}" is not a month, quarter, half or year` }
}

/** `2025-01` → `Jan 2025`: the title the app gives a month row. */
export function formatBudgetMonthTitle(month: string): string {
  if (!isValidMonth(month)) throw new Error(`Invalid month: ${month}`)
  return `${SHORT_NAMES[Number(month.slice(5)) - 1]} ${month.slice(0, 4)}`
}

/** Split an amount evenly to 2 decimals; the rounding remainder goes to the last part, so the parts add back to the total. */
export function splitAmountEvenly(total: number, parts: number): number[] {
  if (!Number.isInteger(parts) || parts < 1) throw new Error('parts must be a positive integer')
  const cents = Math.round(total * 100)
  const base = Math.floor(cents / parts)
  const out = Array.from({ length: parts }, () => base / 100)
  out[parts - 1] = (cents - base * (parts - 1)) / 100
  return out
}
