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
  if (monthsCovered === 0) return 'No saved budgets, using Notion budgets'
  if (monthsCovered >= monthsInRange) return 'Saved budgets'
  return `Saved budgets: ${monthsCovered} of ${monthsInRange} months (rest use Notion)`
}
