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
    expect(monthsInRange('Quarterly', '2026-11')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02'])
    expect(monthsBetween('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02'])
    expect(monthsBetween('2026-05', '2026-03')).toEqual([])
  })

  it('covers 1, 4, 6 and 12 months in the four view modes, like the Monitoring date range', () => {
    expect(monthsInRange('Monthly', '2026-05')).toEqual(['2026-05'])
    expect(monthsInRange('Quarterly', '2026-05')).toHaveLength(4)
    expect(monthsInRange('Semi-Annually', '2026-05')).toEqual([
      '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'
    ])
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
    ['Quarterly', 4],
    ['Semi-Annually', 6],
    ['Annually', 12]
  ] as const)('monthly-budget/02#AC4 monthly-budget/03#AC1 %s equals the monthly budget times %i months', (mode, count) => {
    const months = monthsInRange(mode, '2026-03')
    const r = resolveBudgets({ months, categories, snapshots: [], source: 'notion' })
    expect(find(r, 'food')?.budget).toBe(8000 * count)
    expect(find(r, 'transport')?.budget).toBe(2000 * count)
    expect(r.total).toBe(10000 * count)
    expect(r.monthsInRange).toBe(count)
  })

  it('monthly-budget/02#AC4 ignores saved rows entirely', () => {
    const months = monthsInRange('Monthly', '2026-01')
    const r = resolveBudgets({ months, categories, snapshots: [saved('2026-01', 'food', 1)], source: 'notion' })
    expect(find(r, 'food')?.budget).toBe(8000)
    expect(r.monthsCovered).toBe(0)
    expect(find(r, 'food')?.differs).toBe(false)
  })
})

describe('resolveBudgets, source = saved', () => {
  it('monthly-budget/02#AC5 a month with a saved set uses it and a missing category counts as 0', () => {
    const months = monthsInRange('Monthly', '2026-01')
    const r = resolveBudgets({ months, categories, snapshots: [saved('2026-01', 'food', 5000)], source: 'saved' })
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
      source: 'saved'
    })
    // Jan saved, Feb to Apr use Notion.
    expect(find(r, 'food')?.budget).toBe(5000 + 3 * 8000)
    expect(find(r, 'transport')?.budget).toBe(1000 + 3 * 2000)
    expect(r.monthsCovered).toBe(1)
    expect(r.monthsInRange).toBe(4)
  })

  it('monthly-budget/02#AC5 an explicit saved 0 stays 0 and is not replaced by the Notion budget', () => {
    const months = monthsInRange('Monthly', '2026-01')
    const r = resolveBudgets({
      months,
      categories,
      snapshots: [saved('2026-01', 'food', 0), saved('2026-01', 'transport', 700)],
      source: 'saved'
    })
    expect(find(r, 'food')?.budget).toBe(0)
  })

  it('monthly-budget/02#AC6 Annually with Food at 5,000 for 5 months and 8,000 for 7 months is 81,000', () => {
    const months = monthsInRange('Annually', '2026-01')
    const snapshots = months.map((m, i) => saved(m, 'food', i < 5 ? 5000 : 8000))
    const r = resolveBudgets({ months, categories, snapshots, source: 'saved' })
    expect(find(r, 'food')?.budget).toBe(5 * 5000 + 7 * 8000)
    expect(r.monthsCovered).toBe(12)
  })

  it('monthly-budget/02#AC7 reports how many months in the range have a saved set', () => {
    const months = monthsInRange('Semi-Annually', '2026-01')
    const snapshots = [saved('2026-01', 'food', 1), saved('2026-03', 'food', 1), saved('2026-09', 'food', 1)]
    const r = resolveBudgets({ months, categories, snapshots, source: 'saved' })
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
      source: 'saved'
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
      source: 'saved'
    })
    expect(find(r, 'food')?.budget).toBe(5000)
    expect(r.perCategory.some((c) => c.removed)).toBe(false)
  })

  it('monthly-budget/03#AC2 later changes to the Notion budget move Notion mode but not a saved month', () => {
    const months = monthsInRange('Monthly', '2026-01')
    const snapshots = [saved('2026-01', 'food', 8000), saved('2026-01', 'transport', 2000)]
    const changed = categories.map((c) => (c.id === 'food' ? { ...c, monthlyBudget: 9500 } : c))
    const savedMode = resolveBudgets({ months, categories: changed, snapshots, source: 'saved' })
    const notionMode = resolveBudgets({ months, categories: changed, snapshots, source: 'notion' })
    expect(find(savedMode, 'food')?.budget).toBe(8000)
    expect(find(notionMode, 'food')?.budget).toBe(9500)
  })

  it('monthly-budget/03#AC8 flags a category whose saved period budget differs from the Notion figure', () => {
    const months = monthsInRange('Monthly', '2026-01')
    const r = resolveBudgets({
      months,
      categories,
      snapshots: [saved('2026-01', 'food', 5000), saved('2026-01', 'transport', 2000)],
      source: 'saved'
    })
    expect(find(r, 'food')).toMatchObject({ differs: true, notionBudget: 8000 })
    expect(find(r, 'transport')?.differs).toBe(false)
  })
})

describe('budgetSourceBadge', () => {
  it('monthly-budget/03#AC3 says which budgets are in use and how much is covered', () => {
    expect(budgetSourceBadge('notion', 0, 4)).toBe('Notion budgets')
    expect(budgetSourceBadge('saved', 4, 4)).toBe('Saved budgets')
    expect(budgetSourceBadge('saved', 3, 4)).toBe('Saved budgets: 3 of 4 months (rest use Notion)')
    expect(budgetSourceBadge('saved', 0, 4)).toBe('No saved budgets, using Notion budgets')
    // A Notion source never claims saved coverage, even if rows exist.
    expect(budgetSourceBadge('notion', 3, 4)).toBe('Notion budgets')
  })
})
