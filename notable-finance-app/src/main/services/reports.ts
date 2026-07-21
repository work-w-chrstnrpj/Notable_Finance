// Reports (Phase 1.3): the Phase 0.3 derivation functions applied to live SQLite rows.
// Derived values are computed on demand, never persisted (local-data-schema.md).
import type { DashboardSummary, MonthlyMonitoringDto } from '../../shared/finance.types'
import { dashboardSummary, monthlyMonitoring } from '../domain/derivations'
import { assertMonth } from '../domain/validation'
import { financeSnapshot, listExpenseCategories, listIncomeCategories } from '../db/repositories'

export function dashboard(month: string): DashboardSummary {
  assertMonth(month)
  return dashboardSummary(month, financeSnapshot())
}

export function monitoring(month: string): MonthlyMonitoringDto {
  assertMonth(month)
  const snap = financeSnapshot()
  return monthlyMonitoring(month, {
    incomes: snap.incomes,
    expenses: snap.expenses,
    // Options → the DTO shape the derivation expects (only id/name/source/budget are read).
    expenseCategories: listExpenseCategories().map((c) => ({
      id: c.id,
      name: c.name,
      monthlyBudget: c.monthlyBudget,
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
