import { describe, it, expect } from 'vitest'
import {
  netIncome,
  computeAccountBalance,
  computeAccountBalances,
  categorySpending,
  dashboardSummary,
  monthlyMonitoring
} from '../src/main/domain/derivations'
import { account, income, expense, expenseCategory, incomeCategory } from './factories'

describe('netIncome', () => {
  it('is gross minus capital expenditure', () => {
    expect(netIncome({ grossIncome: 500, capitalExpenditure: 120 })).toBe(380)
  })
})

describe('computeAccountBalance — non-credit', () => {
  it('starting + net income − (amount + interest)', () => {
    const acc = account({ id: 'cash', type: 'Cash', startingBalance: 1000 })
    const incomes = [
      income({ id: 'i1', accountId: 'cash', grossIncome: 500, capitalExpenditure: 100 }) // net 400
    ]
    const expenses = [
      expense({ id: 'e1', accountId: 'cash', amount: 50, interest: 10 }) // out 60
    ]
    const bal = computeAccountBalance(acc, incomes, expenses)
    expect(bal.currentBalance).toBe(1340) // 1000 + 400 - 60
    expect(bal.availableLimit).toBeNull()
  })

  it('excludes soft-deleted records', () => {
    const acc = account({ id: 'cash', startingBalance: 100 })
    const incomes = [income({ id: 'i1', accountId: 'cash', grossIncome: 50, deleted: true })]
    const expenses = [expense({ id: 'e1', accountId: 'cash', amount: 30, deleted: true })]
    expect(computeAccountBalance(acc, incomes, expenses).currentBalance).toBe(100)
  })

  it('ignores records belonging to other accounts', () => {
    const acc = account({ id: 'cash', startingBalance: 0 })
    const expenses = [expense({ id: 'e1', accountId: 'other', amount: 999 })]
    expect(computeAccountBalance(acc, [], expenses).currentBalance).toBe(0)
  })
})

describe('computeAccountBalance — credit-like', () => {
  it('signed outstanding and available limit', () => {
    const card = account({ id: 'cc', type: 'Credit Account', creditLimit: 1000 })
    const expenses = [
      expense({ id: 'e1', accountId: 'cc', amount: 300, interest: 20 }) // charges 300 + interest 20
    ]
    const incomes = [
      income({ id: 'p1', accountId: 'cc', grossIncome: 100, capitalExpenditure: 0 }) // payment 100
    ]
    const bal = computeAccountBalance(card, incomes, expenses)
    // outstanding = 300 + 20 - 100 = 220
    expect(bal.currentBalance).toBe(-220)
    expect(bal.availableLimit).toBe(780) // 1000 - 220
  })

  it('null credit limit yields null available limit', () => {
    const card = account({ id: 'cc', type: 'e-Credit', creditLimit: null })
    const bal = computeAccountBalance(card, [], [expense({ accountId: 'cc', amount: 40 })])
    expect(bal.currentBalance).toBe(-40)
    expect(bal.availableLimit).toBeNull()
  })
})

describe('computeAccountBalances', () => {
  it('returns a map keyed by account id', () => {
    const accounts = [
      account({ id: 'a', startingBalance: 10 }),
      account({ id: 'b', startingBalance: 20 })
    ]
    const map = computeAccountBalances(accounts, [], [])
    expect(map.get('a')?.currentBalance).toBe(10)
    expect(map.get('b')?.currentBalance).toBe(20)
  })
})

describe('categorySpending', () => {
  it('sums amount + interest for the category', () => {
    const expenses = [
      expense({ id: 'e1', categoryId: 'food', amount: 100, interest: 5 }),
      expense({ id: 'e2', categoryId: 'food', amount: 50, interest: 0 }),
      expense({ id: 'e3', categoryId: 'transport', amount: 999 })
    ]
    expect(categorySpending('food', expenses)).toBe(155)
  })
})

describe('dashboardSummary', () => {
  const accounts = [
    account({ id: 'cash', type: 'Cash', startingBalance: 1000 }),
    account({ id: 'card', type: 'Credit Account', creditLimit: 500 }),
    account({ id: 'old', type: 'Savings', startingBalance: 999, inactive: true })
  ]
  const incomes = [
    income({ id: 'i1', accountId: 'cash', date: '2026-07-05', grossIncome: 800, capitalExpenditure: 100 }),
    income({ id: 'i2', accountId: 'cash', date: '2026-06-30', grossIncome: 500 }) // other month
  ]
  const expenses = [
    expense({ id: 'e1', accountId: 'cash', purchaseDate: '2026-07-08', amount: 200, interest: 0, datePaid: '2026-07-08' }),
    expense({ id: 'e2', accountId: 'card', purchaseDate: '2026-07-09', amount: 150, interest: 10, datePaid: null }),
    expense({ id: 'e3', accountId: 'cash', purchaseDate: '2026-05-01', amount: 77 }) // other month
  ]
  const summary = dashboardSummary('2026-07', { incomes, expenses, accounts })

  it('month-scopes income and expense totals', () => {
    expect(summary.totalIncome).toBe(700) // only i1 net (800-100)
    expect(summary.totalExpense).toBe(360) // e1 200 + e2 (150+10); e3 excluded
    expect(summary.grossMargin).toBe(340)
  })

  it('cash flow uses all-time balances of active non-credit accounts only', () => {
    // cash: 1000 + net income (700 + 500) − (200 + 77) = 1923; card excluded; old inactive excluded
    expect(summary.totalCashFlow).toBe(1923)
  })

  it('counts active accounts and pending (unpaid) month expenses', () => {
    expect(summary.activeAccountCount).toBe(2) // cash + card; old inactive
    expect(summary.pendingExpenseCount).toBe(1) // e2 datePaid null
  })
})

describe('monthlyMonitoring', () => {
  const incomes = [
    income({ id: 'i1', categoryId: 'salary', date: '2026-07-01', grossIncome: 1000, capitalExpenditure: 0 }),
    income({ id: 'i2', categoryId: 'side', date: '2026-07-15', grossIncome: 400, capitalExpenditure: 100 }),
    income({ id: 'i3', categoryId: 'salary', date: '2026-06-01', grossIncome: 9999 }) // other month
  ]
  const expenses = [
    expense({ id: 'e1', categoryId: 'food', purchaseDate: '2026-07-03', amount: 200, interest: 0 }),
    expense({ id: 'e2', categoryId: 'food', purchaseDate: '2026-07-20', amount: 100, interest: 20 }),
    expense({ id: 'e3', categoryId: 'rent', purchaseDate: '2026-07-05', amount: 500, interest: 0 })
  ]
  const expenseCategories = [
    expenseCategory({ id: 'food', name: 'Food', monthlyBudget: 400 }),
    expenseCategory({ id: 'rent', name: 'Rent', monthlyBudget: 500 })
  ]
  const incomeCategories = [
    incomeCategory({ id: 'salary', source: 'Salary' }),
    incomeCategory({ id: 'side', source: 'Side gig' })
  ]
  const m = monthlyMonitoring('2026-07', { incomes, expenses, expenseCategories, incomeCategories })

  it('computes month-scoped income figures', () => {
    expect(m.monthlyGrossIncome).toBe(1400) // 1000 + 400 (i3 excluded)
    expect(m.monthlyIncome).toBe(1300) // net: 1000 + 300
    expect(m.grossMargin).toBe(480) // 1300 - 820
  })

  it('computes month-scoped expense total', () => {
    expect(m.monthlyExpense).toBe(820) // 200 + (100+20) + 500
  })

  it('applies the 50/30/20 split on net monthly income', () => {
    expect(m.forNeeds).toBe(650)
    expect(m.forWants).toBe(390)
    expect(m.forSavings).toBe(260)
  })

  it('builds per-category spending, remaining, and share of total', () => {
    const food = m.expenseCategories.find((c) => c.id === 'food')!
    expect(food.spending).toBe(320) // 200 + 120
    expect(food.remaining).toBe(80) // 400 - 320
    expect(food.totalOverview).toBe(39.02) // 320/820*100
  })

  it('totals income per income category', () => {
    const salary = m.incomeCategories.find((c) => c.id === 'salary')!
    const side = m.incomeCategories.find((c) => c.id === 'side')!
    expect(salary.total).toBe(1000)
    expect(side.total).toBe(300) // 400 - 100 capex
  })
})
