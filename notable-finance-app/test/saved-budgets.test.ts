// Budget resolution seam (spec: tickets/monthly-budget/spec.md, "Testing Decisions", seam 1).
// Pure shared functions, so these run on plain Node. Test names carry the ticket and criterion.
import { describe, expect, it } from 'vitest'
import {
  addMonths,
  budgetSourceBadge,
  isValidMonth,
  monthsBetween,
  monthsInRange,
  resolveBudgets,
  roundBudget,
  type BudgetCategoryInput,
  type SavedBudgetRow
} from '../src/shared/saved-budgets'
import { viewPeriodKey } from '../src/shared/budget-periods'

const categories: BudgetCategoryInput[] = [
  { id: 'food', name: 'Food', monthlyBudget: 8000 },
  { id: 'transport', name: 'Transport', monthlyBudget: 2000 }
]

function saved(month: string, categoryId: string, budget: number, categoryName = categoryId): SavedBudgetRow {
  return { id: `${month}-${categoryId}`, month, categoryId, categoryName, budget, createdAt: 1, updatedAt: 1 }
}

const find = (r: ReturnType<typeof resolveBudgets>, id: string) => r.perCategory.find((c) => c.categoryId === id)

describe('month helpers', () => {
  it('monthly-budget/02#AC7 builds the month list with calendar arithmetic across a year boundary', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(monthsInRange('Quarterly', '2026-11')).toEqual(['2026-10', '2026-11', '2026-12'])
    expect(monthsBetween('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02'])
    expect(monthsBetween('2026-05', '2026-03')).toEqual([])
  })

  it('calendar-periods/05#AC2 covers 1, 3, 6 and 12 months as fixed calendar periods, whichever month is selected', () => {
    expect(monthsInRange('Monthly', '2026-05')).toEqual(['2026-05'])
    expect(monthsInRange('Quarterly', '2026-05')).toEqual(['2026-04', '2026-05', '2026-06'])
    expect(monthsInRange('Quarterly', '2026-04')).toEqual(monthsInRange('Quarterly', '2026-06'))
    expect(monthsInRange('Quarterly', '2026-01')).toEqual(['2026-01', '2026-02', '2026-03'])
    expect(monthsInRange('Quarterly', '2026-12')).toEqual(['2026-10', '2026-11', '2026-12'])
    expect(monthsInRange('Semi-Annually', '2026-05')).toEqual([
      '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'
    ])
    expect(monthsInRange('Semi-Annually', '2026-11')).toEqual([
      '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'
    ])
    expect(monthsInRange('Semi-Annually', '2026-01')).toEqual(monthsInRange('Semi-Annually', '2026-06'))
    const year = monthsInRange('Annually', '2026-05')
    expect(year).toHaveLength(12)
    expect(year[0]).toBe('2026-01')
    expect(year[11]).toBe('2026-12')
  })

  it('monthly-budget/02#AC2 accepts only real YYYY-MM months and rounds budgets to 2 decimals', () => {
    expect(isValidMonth('2026-01')).toBe(true)
    expect(isValidMonth('2026-13')).toBe(false)
    expect(isValidMonth('2026-00')).toBe(false)
    expect(isValidMonth('2026-1')).toBe(false)
    expect(isValidMonth(202601)).toBe(false)
    expect(roundBudget(10.005)).toBe(10.01)
    expect(roundBudget(1234.5678)).toBe(1234.57)
  })
})

describe('resolveBudgets, source = notion', () => {
  it.each([
    ['Monthly', 1],
    ['Quarterly', 3],
    ['Semi-Annually', 6],
    ['Annually', 12]
  ] as const)('monthly-budget/02#AC4 monthly-budget/03#AC1 %s equals the monthly budget times %i months', (mode, count) => {
    const months = monthsInRange(mode, '2026-03')
    const r = resolveBudgets({ months, categories, snapshots: [], source: 'default' })
    expect(find(r, 'food')?.budget).toBe(8000 * count)
    expect(find(r, 'transport')?.budget).toBe(2000 * count)
    expect(r.total).toBe(10000 * count)
    expect(r.monthsInRange).toBe(count)
  })

  it('monthly-budget/02#AC4 ignores saved rows entirely', () => {
    const months = monthsInRange('Monthly', '2026-01')
    const r = resolveBudgets({ months, categories, snapshots: [saved('2026-01', 'food', 1)], source: 'default' })
    expect(find(r, 'food')?.budget).toBe(8000)
    expect(r.monthsCovered).toBe(0)
    expect(find(r, 'food')?.differs).toBe(false)
  })
})

describe('resolveBudgets, source = saved', () => {
  it('monthly-budget/02#AC5 a month with a saved set uses it and a missing category counts as 0', () => {
    const months = monthsInRange('Monthly', '2026-01')
    const r = resolveBudgets({ months, categories, snapshots: [saved('2026-01', 'food', 5000)], source: 'custom' })
    expect(find(r, 'food')?.budget).toBe(5000)
    expect(find(r, 'transport')?.budget).toBe(0)
    expect(r.monthsCovered).toBe(1)
  })

  it('monthly-budget/02#AC5 a month without a saved set falls back to Notion budgets', () => {
    const months = monthsInRange('Quarterly', '2026-01')
    const r = resolveBudgets({
      months,
      categories,
      snapshots: [saved('2026-01', 'food', 5000), saved('2026-01', 'transport', 1000)],
      source: 'custom'
    })
    // Jan saved, Feb and Mar (the rest of Q1) use Notion.
    expect(find(r, 'food')?.budget).toBe(5000 + 2 * 8000)
    expect(find(r, 'transport')?.budget).toBe(1000 + 2 * 2000)
    expect(r.monthsCovered).toBe(1)
    expect(r.monthsInRange).toBe(3)
  })

  it('monthly-budget/02#AC5 an explicit saved 0 stays 0 and is not replaced by the Notion budget', () => {
    const months = monthsInRange('Monthly', '2026-01')
    const r = resolveBudgets({
      months,
      categories,
      snapshots: [saved('2026-01', 'food', 0), saved('2026-01', 'transport', 700)],
      source: 'custom'
    })
    expect(find(r, 'food')?.budget).toBe(0)
  })

  it('monthly-budget/02#AC6 Annually with Food at 5,000 for 5 months and 8,000 for 7 months is 81,000', () => {
    const months = monthsInRange('Annually', '2026-01')
    const snapshots = months.map((m, i) => saved(m, 'food', i < 5 ? 5000 : 8000))
    const r = resolveBudgets({ months, categories, snapshots, source: 'custom' })
    expect(find(r, 'food')?.budget).toBe(5 * 5000 + 7 * 8000)
    expect(r.monthsCovered).toBe(12)
  })

  it('monthly-budget/02#AC7 reports how many months in the range have a saved set', () => {
    const months = monthsInRange('Semi-Annually', '2026-01')
    const snapshots = [saved('2026-01', 'food', 1), saved('2026-03', 'food', 1), saved('2026-09', 'food', 1)]
    const r = resolveBudgets({ months, categories, snapshots, source: 'custom' })
    // 2026-09 is outside Jan to Jun, so it does not count.
    expect(r.monthsCovered).toBe(2)
    expect(r.monthsInRange).toBe(6)
  })

  it('monthly-budget/02#AC7 includes a category that only appears in saved rows, with its stored name', () => {
    const months = monthsInRange('Monthly', '2026-01')
    const r = resolveBudgets({
      months,
      categories,
      snapshots: [saved('2026-01', 'old-id', 1200, 'Gym')],
      source: 'custom'
    })
    const gym = r.perCategory.find((c) => c.name === 'Gym')
    expect(gym).toMatchObject({ budget: 1200, removed: true, notionBudget: 0 })
    expect(r.total).toBe(1200)
  })

  it('keeps saved budgets for a category whose id changed after a Notion re-pull, matching by name', () => {
    const months = monthsInRange('Monthly', '2026-01')
    const r = resolveBudgets({
      months,
      categories,
      snapshots: [saved('2026-01', 'old-food-id', 5000, ' food ')],
      source: 'custom'
    })
    expect(find(r, 'food')?.budget).toBe(5000)
    expect(r.perCategory.some((c) => c.removed)).toBe(false)
  })

  it('monthly-budget/03#AC2 later changes to the Notion budget move Notion mode but not a saved month', () => {
    const months = monthsInRange('Monthly', '2026-01')
    const snapshots = [saved('2026-01', 'food', 8000), saved('2026-01', 'transport', 2000)]
    const changed = categories.map((c) => (c.id === 'food' ? { ...c, monthlyBudget: 9500 } : c))
    const savedMode = resolveBudgets({ months, categories: changed, snapshots, source: 'custom' })
    const notionMode = resolveBudgets({ months, categories: changed, snapshots, source: 'default' })
    expect(find(savedMode, 'food')?.budget).toBe(8000)
    expect(find(notionMode, 'food')?.budget).toBe(9500)
  })

  it('flags a category whose saved period budget differs from the Notion figure', () => {
    const months = monthsInRange('Monthly', '2026-01')
    const r = resolveBudgets({
      months,
      categories,
      snapshots: [saved('2026-01', 'food', 5000), saved('2026-01', 'transport', 2000)],
      source: 'custom'
    })
    expect(find(r, 'food')).toMatchObject({ differs: true, notionBudget: 8000 })
    expect(find(r, 'transport')?.differs).toBe(false)
  })
})

describe('budgetSourceBadge', () => {
  it('monthly-budget/03#AC3 says which budgets are in use and how much is covered', () => {
    expect(budgetSourceBadge('default', 0, 4)).toBe('Default budgets')
    expect(budgetSourceBadge('custom', 4, 4)).toBe('Custom budgets')
    expect(budgetSourceBadge('custom', 3, 4)).toBe('Custom budgets: 3 of 4 months')
    expect(budgetSourceBadge('custom', 0, 4)).toBe('No custom budget')
    // A Notion source never claims saved coverage, even if rows exist.
    expect(budgetSourceBadge('default', 3, 4)).toBe('Default budgets')
  })
})

describe('expense-views/02 a quarter, half or year view looks for its own row first', () => {
  const months = monthsInRange('Semi-Annually', '2026-03')
  const h1 = [
    { period: 'H1 2026', categoryId: 'food', categoryName: 'Food', budget: 40000 },
    { period: 'Q1 2026', categoryId: 'food', categoryName: 'Food', budget: 1 }
  ]
  const monthRows = months.map((m) => saved(m, 'food', 5000))

  it('uses the H1 row as written, not the months added up', () => {
    const r = resolveBudgets({ months, categories, snapshots: monthRows, source: 'custom', periodRows: h1, periodKey: 'H1 2026' })
    expect(find(r, 'food')?.budget).toBe(40000)
    expect(r.usedPeriodRow).toBe(true)
  })

  it('a category the H1 row leaves out adds up its months', () => {
    const r = resolveBudgets({ months, categories, snapshots: [], source: 'custom', periodRows: h1, periodKey: 'H1 2026' })
    expect(find(r, 'transport')?.budget).toBe(2000 * 6)
  })

  it('adds the monthly budgets when there is no H1 row, and the badge says so', () => {
    const r = resolveBudgets({ months, categories, snapshots: monthRows, source: 'custom', periodRows: [], periodKey: 'H1 2026' })
    expect(find(r, 'food')?.budget).toBe(30000)
    expect(r.usedPeriodRow).toBe(false)
    expect(budgetSourceBadge('custom', r.monthsCovered, r.monthsInRange, r)).toBe(
      'H1 2026 not found: adding Jan–Jun monthly budgets'
    )
  })

  it('names the row when it is used', () => {
    const r = resolveBudgets({ months, categories, snapshots: [], source: 'custom', periodRows: h1, periodKey: 'H1 2026' })
    expect(budgetSourceBadge('custom', r.monthsCovered, r.monthsInRange, r)).toBe('Custom budgets: H1 2026')
  })

  it('the Notion source and the Monthly view never look for a period row', () => {
    const d = resolveBudgets({ months, categories, snapshots: [], source: 'default', periodRows: h1, periodKey: 'H1 2026' })
    expect(find(d, 'food')?.budget).toBe(8000 * 6)
    expect(d.periodKey).toBeNull()
    const m = resolveBudgets({ months: ['2026-01'], categories, snapshots: [], source: 'custom', periodRows: h1, periodKey: null })
    expect(m.usedPeriodRow).toBe(false)
  })

  it('names the row each view looks for', () => {
    expect(viewPeriodKey('Quarterly', monthsInRange('Quarterly', '2026-05'))).toBe('Q2 2026')
    expect(viewPeriodKey('Semi-Annually', monthsInRange('Semi-Annually', '2026-08'))).toBe('H2 2026')
    expect(viewPeriodKey('Annually', monthsInRange('Annually', '2026-08'))).toBe('2026')
    expect(viewPeriodKey('Monthly', ['2026-08'])).toBeNull()
  })
})
