// Saved budgets: per-month copies of each expense category's budget (local only, ADR-0006).
// Pure functions shared by the renderer and the main process so both compute identical numbers.
// Spec: wiki/desktop/monthly-budget-snapshots.md (sections 5 and 7).

export type BudgetSource = 'notion' | 'saved'

export const BUDGET_SOURCES: readonly BudgetSource[] = ['notion', 'saved']

/** Same four modes as the Monitoring view-mode control. */
export type BudgetViewMode = 'Monthly' | 'Quarterly' | 'Semi-Annually' | 'Annually'

/** One saved budget: a month, an expense category and its budget. */
export interface SavedBudgetRow {
  id: string
  /** 'YYYY-MM' */
  month: string
  categoryId: string
  /** Category name when the row was saved; kept so renamed or removed categories stay readable. */
  categoryName: string
  budget: number
  createdAt: number
  updatedAt: number
}

/** The slice of an expense category that budget resolution needs. */
export interface BudgetCategoryInput {
  id: string
  name: string
  monthlyBudget: number
}

export interface ResolvedBudgetCategory {
  /** Current category id, or the saved row's category id for a category that no longer exists. */
  categoryId: string
  name: string
  /** Budget for the whole range (sum over the months). */
  budget: number
  /** What the Notion source would give for the whole range: monthlyBudget × months. 0 for a removed category. */
  notionBudget: number
  /** True when the saved period budget differs from the Notion figure. */
  differs: boolean
  /** True when the category is not in the current category list (only seen in saved rows). */
  removed: boolean
}

export interface ResolvedBudgets {
  perCategory: ResolvedBudgetCategory[]
  total: number
  /** Months in the range that have a saved set. Always 0 for the Notion source. */
  monthsCovered: number
  monthsInRange: number
  months: string[]
}

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/

/** True for a real calendar month in `YYYY-MM` form (month 01–12). */
export function isValidMonth(value: unknown): value is string {
  return typeof value === 'string' && MONTH_PATTERN.test(value)
}

/** Round a budget to 2 decimals (money). */
export function roundBudget(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/** Calendar arithmetic on `YYYY-MM`, so year boundaries are handled without string math. */
export function addMonths(month: string, delta: number): string {
  const match = MONTH_PATTERN.exec(month)
  if (!match) throw new Error(`Invalid month: ${month}`)
  const total = Number(match[1]) * 12 + (Number(match[2]) - 1) + delta
  const year = Math.floor(total / 12)
  const m = total - year * 12 + 1
  return `${String(year).padStart(4, '0')}-${String(m).padStart(2, '0')}`
}

/** Every month from `from` to `to`, inclusive. Empty when `to` is before `from`. */
export function monthsBetween(from: string, to: string): string[] {
  if (!isValidMonth(from) || !isValidMonth(to)) return []
  const out: string[] = []
  for (let m = from; m <= to; m = addMonths(m, 1)) out.push(m)
  return out
}

/**
 * Months covered by a Monitoring view from the selected month: Monthly 1, Quarterly 4,
 * Semi-Annually 6 (all starting at the selected month) and Annually Jan–Dec of that year.
 * Matches the Monitoring date range, so budgets and spending always cover the same months.
 */
export function monthsInRange(mode: BudgetViewMode, anchorMonth: string): string[] {
  if (!isValidMonth(anchorMonth)) return []
  if (mode === 'Annually') {
    const year = anchorMonth.slice(0, 4)
    return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
  }
  const length = mode === 'Semi-Annually' ? 6 : mode === 'Quarterly' ? 4 : 1
  return Array.from({ length }, (_, i) => addMonths(anchorMonth, i))
}

const normalizeName = (name: string) => name.trim().toLowerCase()

/**
 * Decide each category's budget for a range of months.
 *
 * - notion: the category's current monthly budget × months in range (today's behaviour).
 * - saved: per month, a month with a saved set uses it (a category missing from the set is 0);
 *   a month without one falls back to the category's Notion budget.
 *
 * A saved row belongs to a current category by id, or by name when the id is gone (a full
 * re-pull from Notion mints new local ids). A row that matches no current category is kept
 * and listed as a removed category, so history is never dropped.
 */
export function resolveBudgets(args: {
  months: string[]
  categories: BudgetCategoryInput[]
  snapshots: SavedBudgetRow[]
  source: BudgetSource
}): ResolvedBudgets {
  const { months, categories, snapshots, source } = args
  const monthCount = months.length

  const byId = new Map(categories.map((c) => [c.id, c]))
  const byName = new Map<string, BudgetCategoryInput>()
  for (const c of categories) {
    const key = normalizeName(c.name)
    if (!byName.has(key)) byName.set(key, c)
  }

  const periodBudget = new Map<string, number>()
  const removedNames = new Map<string, { categoryId: string; name: string }>()
  const add = (key: string, amount: number) => periodBudget.set(key, (periodBudget.get(key) ?? 0) + amount)

  let monthsCovered = 0
  if (source === 'notion') {
    for (const c of categories) add(c.id, c.monthlyBudget * monthCount)
  } else {
    const setsByMonth = new Map<string, SavedBudgetRow[]>()
    for (const row of snapshots) {
      const list = setsByMonth.get(row.month)
      if (list) list.push(row)
      else setsByMonth.set(row.month, [row])
    }
    for (const month of months) {
      const set = setsByMonth.get(month)
      if (!set || set.length === 0) {
        for (const c of categories) add(c.id, c.monthlyBudget)
        continue
      }
      monthsCovered += 1
      // Rows matched by id win over rows matched by name; each category gets one value per month.
      const monthValues = new Map<string, number>()
      const nameMatched: Array<{ key: string; row: SavedBudgetRow }> = []
      for (const row of set) {
        if (byId.has(row.categoryId)) monthValues.set(row.categoryId, row.budget)
        else {
          const current = byName.get(normalizeName(row.categoryName))
          if (current) nameMatched.push({ key: current.id, row })
          else {
            const removedKey = `removed:${normalizeName(row.categoryName)}`
            monthValues.set(removedKey, (monthValues.get(removedKey) ?? 0) + row.budget)
            if (!removedNames.has(removedKey)) {
              removedNames.set(removedKey, { categoryId: row.categoryId, name: row.categoryName })
            }
          }
        }
      }
      for (const { key, row } of nameMatched) if (!monthValues.has(key)) monthValues.set(key, row.budget)
      for (const [key, value] of monthValues) add(key, value)
    }
  }

  const perCategory: ResolvedBudgetCategory[] = categories.map((c) => {
    const budget = roundBudget(periodBudget.get(c.id) ?? 0)
    const notionBudget = roundBudget(c.monthlyBudget * monthCount)
    return {
      categoryId: c.id,
      name: c.name,
      budget,
      notionBudget,
      differs: source === 'saved' && budget !== notionBudget,
      removed: false
    }
  })

  const removed = [...removedNames.entries()]
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .map(([key, info]) => ({
      categoryId: info.categoryId,
      name: info.name,
      budget: roundBudget(periodBudget.get(key) ?? 0),
      notionBudget: 0,
      differs: true,
      removed: true
    }))

  const all = [...perCategory, ...removed]
  return {
    perCategory: all,
    total: roundBudget(all.reduce((sum, c) => sum + c.budget, 0)),
    monthsCovered,
    monthsInRange: monthCount,
    months
  }
}

/** The badge text for the Budget source (spec section 6.2). */
export function budgetSourceBadge(source: BudgetSource, monthsCovered: number, monthsInRange: number): string {
  if (source === 'notion') return 'Notion budgets'
  if (monthsCovered === 0) return 'No budget saved'
  if (monthsCovered >= monthsInRange) return 'Saved budgets'
  return `Saved budgets: ${monthsCovered} of ${monthsInRange} months`
}

// ── Typed budgets and JSON view (Edit budgets) ─────────────────────────────

/** A budget typed in a field: a number of 0 or more with up to 2 decimals. `₱`, spaces and commas are tolerated. */
export function parseBudgetText(value: string): number | null {
  const cleaned = value.replace(/[₱\s,]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  return roundBudget(Number(cleaned))
}

/** One editable budget in the Edit budgets screen: a stable key and the category name shown to the user. */
export interface BudgetJsonEntry {
  key: string
  name: string
}

/** JSON names must be unique, so a repeated name gets " (2)", " (3)" and so on. */
function jsonNames(entries: BudgetJsonEntry[]): Array<{ key: string; name: string }> {
  const seen = new Map<string, number>()
  return entries.map((entry) => {
    const base = entry.name.trim()
    const norm = base.toLowerCase()
    const count = (seen.get(norm) ?? 0) + 1
    seen.set(norm, count)
    return { key: entry.key, name: count === 1 ? base : `${base} (${count})` }
  })
}

/**
 * A month's budgets as JSON: `{ "Food": 5000, "Transport": 2000 }`, category name to budget.
 * It holds no month, so the same text can be pasted into any month. A value that is not a valid
 * number yet (still being typed in the form) is kept as typed so nothing is lost.
 */
export function budgetsToJson(entries: BudgetJsonEntry[], values: Record<string, string>): string {
  const out: Record<string, number | string> = {}
  for (const { key, name } of jsonNames(entries)) {
    const raw = values[key] ?? ''
    out[name] = parseBudgetText(raw) ?? raw
  }
  return JSON.stringify(out, null, 2)
}

export type ParsedBudgetsJson = { values: Record<string, string> } | { errors: string[] }

/**
 * Read budgets back from JSON. Names match categories case-insensitively; a name that matches no
 * category is an error; a category left out keeps its current value (so only the keys present are
 * returned). Each budget must follow the same rule as the form.
 */
export function parseBudgetsJson(text: string, entries: BudgetJsonEntry[]): ParsedBudgetsJson {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (error) {
    return { errors: [`That is not valid JSON: ${error instanceof Error ? error.message : String(error)}`] }
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return { errors: ['Use an object of category name to budget, like { "Food": 5000 }.'] }
  }
  const byName = new Map(jsonNames(entries).map((e) => [e.name.toLowerCase(), e.key]))
  const values: Record<string, string> = {}
  const errors: string[] = []
  const used = new Set<string>()
  for (const [name, raw] of Object.entries(data as Record<string, unknown>)) {
    const key = byName.get(name.trim().toLowerCase())
    if (!key) {
      errors.push(`Unknown category "${name}".`)
      continue
    }
    if (used.has(key)) {
      errors.push(`"${name}" appears more than once.`)
      continue
    }
    used.add(key)
    const amount = typeof raw === 'number' ? (Number.isFinite(raw) ? parseBudgetText(String(raw)) : null) : typeof raw === 'string' ? parseBudgetText(raw) : null
    if (amount === null) errors.push(`The budget for "${name}" must be a number of 0 or more with up to 2 decimals.`)
    else values[key] = String(amount)
  }
  return errors.length > 0 ? { errors: errors.slice(0, 6) } : { values }
}
