import { describe, it, expect } from 'vitest'
import {
  grossPrice,
  installmentAmount,
  paidAmount,
  remainingBalance,
  pasabuyReceivedAmount,
  pasabuyerBalance,
  transactionAmount,
  isTransactionCategory,
  round2
} from '../src/main/domain/notion-formulas'
import { expense, income } from './factories'

describe('Gross Price = amount + interest', () => {
  it('sums amount and interest', () => {
    expect(grossPrice({ amount: 1000, interest: 50 })).toBe(1050)
  })
})

describe('Installment Amount = GrossPrice / periodCount', () => {
  it('splits gross price across periods', () => {
    expect(installmentAmount(expense({ amount: 1200, interest: 0, periodCount: 3 }))).toBe(400)
  })
  it('period 1 → the full gross price', () => {
    expect(installmentAmount(expense({ amount: 500, interest: 20, periodCount: 1 }))).toBe(520)
  })
  it('no period count → null', () => {
    expect(installmentAmount(expense({ amount: 500, periodCount: null }))).toBeNull()
  })
})

describe('Paid Amount / Remaining Balance', () => {
  const e = expense({ amount: 1200, interest: 0, periodCount: 3, paidPeriod: 2, paymentStatus: 'Installment' })
  it('paid = installment × paidPeriod', () => {
    expect(paidAmount(e)).toBe(800) // 400 × 2
  })
  it('remaining = grossPrice − paid', () => {
    expect(remainingBalance(e)).toBe(400) // 1200 − 800
  })
})

describe('Pasabuy Received Amount', () => {
  it('= installmentAmount × pasabuyPaidPeriod when pasabuy category + receiver', () => {
    const e = expense({ amount: 900, interest: 0, periodCount: 3, pasabuyPaidPeriod: 2, pasabuyAccountReceiverId: 'acc' })
    expect(pasabuyReceivedAmount(e, 'Pasabuy')).toBe(600) // 300 × 2
  })
  it('0 when not a pasabuy category', () => {
    const e = expense({ amount: 900, periodCount: 3, pasabuyPaidPeriod: 2, pasabuyAccountReceiverId: 'acc' })
    expect(pasabuyReceivedAmount(e, 'Food')).toBe(0)
  })
  it('0 when no receiver account', () => {
    const e = expense({ amount: 900, periodCount: 3, pasabuyPaidPeriod: 2, pasabuyAccountReceiverId: null })
    expect(pasabuyReceivedAmount(e, 'Pasabuy')).toBe(0)
  })

  // Regression: non-even installment × paidPeriod must NOT double-round. Notion keeps the
  // installment at full precision (25000/6 = 4166.6667) and only rounds at the balance, so
  // Pasabuy Received is 8333.3333 → 8333.33, not round(4166.67 × 2) = 8333.34 (±0.01 drift).
  it('carries full precision (no intermediate rounding) for non-even installments', () => {
    const e = expense({ amount: 25000, interest: 0, periodCount: 6, pasabuyPaidPeriod: 2, pasabuyAccountReceiverId: 'acc' })
    expect(installmentAmount(e)).toBeCloseTo(4166.6667, 4)
    expect(pasabuyReceivedAmount(e, 'Pasabuy')).toBeCloseTo(8333.3333, 4)
    // rounded for display/aggregation → 8333.33 (the Notion value), never 8333.34
    expect(round2(pasabuyReceivedAmount(e, 'Pasabuy'))).toBe(8333.33)
  })
})

describe('Pasabuyer Balance (the Unpaid-Pasabuy view value)', () => {
  it('= amount − received; non-zero for partially received', () => {
    const e = expense({
      amount: 900, interest: 0, periodCount: 3, pasabuyPaidPeriod: 1,
      pasabuyStatus: 'Payment partially received', pasabuyAccountReceiverId: 'acc'
    })
    // received = installment(300) × 1 = 300 → balance = 900 − 300 = 600
    expect(pasabuyerBalance(e, 'Pasabuy')).toBe(600)
  })
  it('0 when fully received', () => {
    const e = expense({ amount: 900, periodCount: 3, pasabuyStatus: 'Payment fully received' })
    expect(pasabuyerBalance(e, 'Pasabuy')).toBe(0)
  })
  it('null (not applicable) for a non-pasabuy expense', () => {
    const e = expense({ amount: 900, pasabuyStatus: null })
    expect(pasabuyerBalance(e, 'Food')).toBeNull()
  })
})

describe('Transaction Amount = −gross for transacted workflow categories', () => {
  it('is negative gross for Transfer with a transacted account', () => {
    const i = income({ grossIncome: 500, transactedAccountId: 'acc' })
    expect(transactionAmount(i, 'Transfer')).toBe(-500)
    expect(transactionAmount(i, 'Credit Card Payment')).toBe(-500)
    expect(transactionAmount(i, 'Debit Payment')).toBe(-500)
  })
  it('is 0 for a normal category', () => {
    expect(transactionAmount(income({ grossIncome: 500, transactedAccountId: 'acc' }), 'Salary')).toBe(0)
  })
  it('is 0 when there is no transacted account', () => {
    expect(transactionAmount(income({ grossIncome: 500, transactedAccountId: null }), 'Transfer')).toBe(0)
  })
  it('category matcher is case-insensitive substring', () => {
    expect(isTransactionCategory('credit card payment')).toBe(true)
    expect(isTransactionCategory('Groceries')).toBe(false)
  })
})
