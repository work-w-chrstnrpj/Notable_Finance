// Reports (Phase 1.3): the Phase 0.3 derivation functions applied to live SQLite rows.
// Derived values are computed on demand, never persisted (local-data-schema.md).
import type { DashboardSummary, MonthlyMonitoringDto } from '../../shared/finance.types'
import { dashboardSummary, monthlyMonitoring } from '../domain/derivations'
import { assertMonth } from '../domain/validation'
import { resolveBudgets, type BudgetSource } from '../../shared/saved-budgets'
import { listSavedBudgets } from '../db/budgets'
import { balanceContext, financeSnapshot, listExpenseCategories, listIncomeCategories } from '../db/repositories'

export function dashboard(month: string): DashboardSummary {
  assertMonth(month)
  const pasabuyCategoryIds = new Set(
    listExpenseCategories().filter((category) => /pasabuy/i.test(category.name)).map((category) => category.id)
  )
  const auxiliaryIncomeIds = new Set(listIncomeCategories().filter((category) => category.auxiliary).map((category) => category.id))
  return dashboardSummary(month, financeSnapshot(), balanceContext(), pasabuyCategoryIds, auxiliaryIncomeIds)
}

/**
 * Monthly Monitoring for a month. `source` picks the budgets (ADR-0006): 'default' (the
 * category's own monthly budget) or 'custom' (that month's Custom monthly budget, else Default).
 */
export function monitoring(month: string, source: BudgetSource = 'default'): MonthlyMonitoringDto {
  assertMonth(month)
  const snap = financeSnapshot()
  const categories = listExpenseCategories()
  const budgetById = new Map<string, number>()
  if (source === 'custom') {
    const resolved = resolveBudgets({
      months: [month],
      categories: categories.map((c) => ({ id: c.id, name: c.name, monthlyBudget: c.monthlyBudget })),
      snapshots: listSavedBudgets(month, month),
      source: 'custom'
    })
    for (const c of resolved.perCategory) if (!c.removed) budgetById.set(c.categoryId, c.budget)
  }
  return monthlyMonitoring(month, {
    incomes: snap.incomes,
    expenses: snap.expenses,
    // Options → the DTO shape the derivation expects (only id/name/source/budget are read).
    expenseCategories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      monthlyBudget: budgetById.get(c.id) ?? c.monthlyBudget,
      upcomingBudget: 0,
      auxiliary: c.auxiliary ? ('Yes' as const) : ('No' as const),
      spending: 0,
      remaining: 0,
      overview: '',
      totalOverview: 0
    })),
    incomeCategories: listIncomeCategories().map((c) => ({
      id: c.id,
      source: c.source,
      auxiliary: c.auxiliary,
      monthlyEarnings: 0,
      monthlyExpenditure: 0,
      monthlyGross: 0,
      earningPercentage: 0
    }))
  })
}
