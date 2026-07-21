import { describe, it, expect } from 'vitest'
import {
  filterExpensesByQuery,
  filterIncomeByQuery,
  normalizeExpenseViewMode,
  type ExpenseFilterContext
} from '../src/main/domain/query-filters'
import { expense, income } from './factories'

// Parity tests for the filter semantics COPIED from the web notion-query.service.

const ctx: ExpenseFilterContext = {
  creditAccountIds: new Set(['cc']),
  pasabuyCategoryIds: new Set(['pasabuy']),
  pasabuyCategoryId: 'pasabuy'
}

describe('normalizeExpenseViewMode', () => {
  it('maps the web UI labels to canonical modes', () => {
    expect(normalizeExpenseViewMode('Unpaid Pasabuy')).toBe('unpaidPasabuy')
    expect(normalizeExpenseViewMode('To pay')).toBe('toPay')
    expect(normalizeExpenseViewMode('To buy')).toBe('toBuy')
    expect(normalizeExpenseViewMode('Installments')).toBe('installments')
    expect(normalizeExpenseViewMode('Unpaid CC')).toBe('ccTransactions')
    expect(normalizeExpenseViewMode(undefined)).toBe('monthly')
  })
})

describe('filterIncomeByQuery', () => {
  const records = [
    income({ id: 'a', date: '2026-07-01' }),
    income({ id: 'b', date: '2026-07-15' }),
    income({ id: 'c', date: '2026-08-02' })
  ]

  it('explicit range wins over month', () => {
    const out = filterIncomeByQuery(records, {
      month: '2026-08',
      rangeStart: '2026-07-10',
      rangeEnd: '2026-07-31'
    })
    expect(out.map((r) => r.id)).toEqual(['b'])
  })

  it('falls back to month prefix', () => {
    expect(filterIncomeByQuery(records, { month: '2026-07' }).map((r) => r.id)).toEqual(['a', 'b'])
  })
})

describe('filterExpensesByQuery view modes', () => {
  it('toPay: unpaid, non-installment, not a Buy: item', () => {
    const records = [
      expense({ id: 'pay', datePaid: null, paymentStatus: 'Unpaid' }),
      expense({ id: 'paid', datePaid: '2026-07-01' }),
      expense({ id: 'inst', datePaid: null, paymentStatus: 'Installment' }),
      expense({ id: 'buy', datePaid: null, description: 'Buy: new monitor' })
    ]
    const out = filterExpensesByQuery(records, { expenseViewMode: 'To pay' }, ctx)
    expect(out.map((r) => r.id)).toEqual(['pay'])
  })

  it('toBuy: only Buy:-prefixed descriptions', () => {
    const records = [
      expense({ id: 'buy', description: 'Buy: new monitor' }),
      expense({ id: 'normal' })
    ]
    const out = filterExpensesByQuery(records, { expenseViewMode: 'To buy' }, ctx)
    expect(out.map((r) => r.id)).toEqual(['buy'])
  })

  it('installments: installment status on credit-like accounts only', () => {
    const records = [
      expense({ id: 'ok', paymentStatus: 'Installment', accountId: 'cc' }),
      expense({ id: 'cash-inst', paymentStatus: 'Installment', accountId: 'cash' }),
      expense({ id: 'cc-paid', paymentStatus: 'Paid', accountId: 'cc' })
    ]
    const out = filterExpensesByQuery(records, { expenseViewMode: 'Installments' }, ctx)
    expect(out.map((r) => r.id)).toEqual(['ok'])
  })

  it('ccTransactions: outstanding credit items, excluding installments', () => {
    const records = [
      expense({ id: 'unpaid-cc', accountId: 'cc', datePaid: null, paymentStatus: 'Unpaid', amount: 100 }),
      // fully paid via periods → remaining 0 and datePaid set → excluded
      expense({ id: 'done-cc', accountId: 'cc', datePaid: '2026-07-01', paymentStatus: 'Paid', amount: 100, periodCount: 2, paidPeriod: 2 }),
      expense({ id: 'cash', accountId: 'cash', datePaid: null, paymentStatus: 'Unpaid' }),
      expense({ id: 'inst', accountId: 'cc', paymentStatus: 'Installment' })
    ]
    const out = filterExpensesByQuery(records, { expenseViewMode: 'Unpaid CC' }, ctx)
    expect(out.map((r) => r.id)).toEqual(['unpaid-cc'])
  })

  it('unpaidPasabuy: pasabuy category with pending payment signals', () => {
    const records = [
      expense({ id: 'pending', categoryId: 'pasabuy', pasabuyStatus: 'Payment not yet receive' }),
      expense({ id: 'full', categoryId: 'pasabuy', pasabuyStatus: 'Payment fully received', pasabuyPaidPeriod: 1 }),
      expense({ id: 'other-cat', categoryId: 'food', pasabuyStatus: 'Payment not yet receive' })
    ]
    const out = filterExpensesByQuery(records, { expenseViewMode: 'Unpaid Pasabuy' }, ctx)
    expect(out.map((r) => r.id)).toEqual(['pending'])
  })

  it('withoutPasabuy category filter excludes the Pasabuy category', () => {
    const records = [
      expense({ id: 'food', categoryId: 'food', purchaseDate: '2026-07-01' }),
      expense({ id: 'pb', categoryId: 'pasabuy', purchaseDate: '2026-07-02' })
    ]
    const out = filterExpensesByQuery(
      records,
      { month: '2026-07', categoryId: '__without-pasabuy' },
      ctx
    )
    expect(out.map((r) => r.id)).toEqual(['food'])
  })

  it('calendar mode uses range over month', () => {
    const records = [
      expense({ id: 'in', purchaseDate: '2026-07-10' }),
      expense({ id: 'out', purchaseDate: '2026-07-25' })
    ]
    const out = filterExpensesByQuery(
      records,
      { expenseViewMode: 'Weekly', rangeStart: '2026-07-07', rangeEnd: '2026-07-13' },
      ctx
    )
    expect(out.map((r) => r.id)).toEqual(['in'])
  })
})
