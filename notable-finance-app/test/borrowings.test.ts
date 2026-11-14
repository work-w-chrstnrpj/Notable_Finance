import { describe, it, expect } from 'vitest'
import { computeAccountBalance, monthlyMonitoring } from '../src/main/domain/derivations'
import { borrowingKind, isPlaceholderAccount, totalOutstanding } from '../src/shared/borrowings'
import { account, income, incomeCategory } from './factories'

const ctx = {
  incomeCategoryName: (id: string) => (id === 'cat-borrow' ? 'Borrowed Money' : undefined),
  expenseCategoryName: () => undefined
}
const bank = account({ id: 'bank', type: 'Digital Bank' })
const borrow = account({ id: 'borrow', type: 'Auxiliary' })
const placeholders = new Set(['borrow'])

// Borrowed 1,000 into the bank, then repaid 400 from the bank.
const borrowed = income({ id: 'b1', categoryId: 'cat-borrow', accountId: 'borrow', transactedAccountId: 'bank', grossIncome: -1000 })
const repaid = income({ id: 'r1', categoryId: 'cat-borrow', accountId: 'bank', transactedAccountId: 'borrow', grossIncome: -400 })

describe('Borrowings (Borrowed Money category)', () => {
  it('credits the receiving account and debits the placeholder when borrowing', () => {
    expect(computeAccountBalance(bank, [borrowed], [], ctx).currentBalance).toBe(1000)
    expect(computeAccountBalance(borrow, [borrowed], [], ctx).currentBalance).toBe(-1000)
  })

  it('a repayment moves money from the paying account back to the placeholder', () => {
    expect(computeAccountBalance(bank, [borrowed, repaid], [], ctx).currentBalance).toBe(600)
    expect(computeAccountBalance(borrow, [borrowed, repaid], [], ctx).currentBalance).toBe(-600)
  })

  it('derives kind from the placeholder side and totals what is still owed', () => {
    expect(borrowingKind(borrowed, placeholders)).toBe('borrowed')
    expect(borrowingKind(repaid, placeholders)).toBe('repayment')
    expect(totalOutstanding([borrowed, repaid, { ...repaid, id: 'r2', deleted: true }], placeholders)).toBe(600)
  })

  it('only Auxiliary accounts named borrow* count as Borrow accounts', () => {
    expect(isPlaceholderAccount({ type: 'Auxiliary', name: 'Borrowed Money' })).toBe(true)
    expect(isPlaceholderAccount({ type: 'Auxiliary', name: 'Debt/Loan' })).toBe(true)
    expect(isPlaceholderAccount({ type: 'Auxiliary', name: 'Auxiliary & Rewards' })).toBe(false)
    expect(isPlaceholderAccount({ type: 'Cash', name: 'Borrowed cash' })).toBe(false)
  })

  it('stays out of monthly income reporting', () => {
    const categories = [incomeCategory({ id: 'cat-borrow', source: 'Borrowed Money' })]
    const result = monthlyMonitoring('2026-11', { incomes: [{ ...borrowed, date: '2026-11-05' }, { ...repaid, date: '2026-11-06' }], expenses: [], expenseCategories: [], incomeCategories: categories } as never)
    expect(result.monthlyGrossIncome).toBe(0)
  })
})
