import { describe, it, expect } from 'vitest'
import {
  mapAccount,
  mapExpense,
  mapIncome,
  mapScheduler,
  type ExpenseRow,
  type IncomeRow
} from '../src/main/db/mappers'
import { advanceDate } from '../src/main/domain/schedule'

const incomeRow: IncomeRow = {
  id: 'i1',
  title: 'Salary',
  date: '2026-07-01',
  gross_income: 1000,
  capital_expenditure: 100,
  account_id: 'acc1',
  category_id: 'cat1',
  notes: null,
  is_transaction: 0,
  transacted_account_id: null,
  cc_payment_covered_id: null,
  deleted: 0
}

const expenseRow: ExpenseRow = {
  id: 'e1',
  title: 'Groceries',
  purchase_date: '2026-07-10',
  date_paid: null,
  amount: 250,
  interest: 5,
  account_id: 'acc1',
  category_id: 'food',
  payment_status: null,
  payment_frequency: null,
  period_count: null,
  paid_period: null,
  is_pasabuy: 1,
  pasabuyer: 'Ana',
  pasabuy_status: 'Payment not yet receive',
  pasabuy_date_of_payment: null,
  pasabuy_paid_period: null,
  pasabuy_account_receiver_id: null,
  cc_link_payment_receipt_id: null,
  deleted: 0
}

describe('mapIncome', () => {
  it('maps snake_case row to camelCase DTO', () => {
    const dto = mapIncome(incomeRow)
    expect(dto).toMatchObject({
      id: 'i1',
      name: 'Salary',
      date: '2026-07-01',
      grossIncome: 1000,
      capitalExpenditure: 100,
      accountId: 'acc1',
      categoryId: 'cat1',
      deleted: false
    })
  })
})

describe('mapExpense', () => {
  it('maps pasabuy fields and defaults null payment_status to Unpaid', () => {
    const dto = mapExpense(expenseRow)
    expect(dto.paymentStatus).toBe('Unpaid')
    expect(dto.pasabuyer).toBe('Ana')
    expect(dto.pasabuyStatus).toBe('Payment not yet receive')
    expect(dto.datePaid).toBeNull()
  })
})

describe('mapAccount', () => {
  it('applies the provided derived balance', () => {
    const dto = mapAccount(
      {
        id: 'a1',
        account_name: 'Cash',
        account_type: 'Cash',
        starting_balance: 500,
        credit_limit: null,
        inactive: 0,
        billing_day: null,
        due_day: null,
        annual_fee: null,
        credit_points: null
      },
      { currentBalance: 750, availableLimit: null }
    )
    expect(dto.currentBalance).toBe(750)
    expect(dto.inactive).toBe(false)
  })
})

describe('mapScheduler', () => {
  it('maps active flag to boolean', () => {
    const dto = mapScheduler({
      id: 's1',
      title: 'Rent',
      amount: 12000,
      account_id: 'a1',
      category_id: 'rent',
      frequency: 'Monthly',
      next_run_date: '2026-08-01',
      active: 1,
      deleted: 0
    })
    expect(dto.active).toBe(true)
    expect(dto.frequency).toBe('Monthly')
  })
})

describe('advanceDate', () => {
  it('advances by frequency', () => {
    expect(advanceDate('2026-07-15', 'Daily')).toBe('2026-07-16')
    expect(advanceDate('2026-07-15', 'Weekly')).toBe('2026-07-22')
    expect(advanceDate('2026-07-15', 'Monthly')).toBe('2026-08-15')
    expect(advanceDate('2026-07-15', 'Quarterly')).toBe('2026-10-15')
    expect(advanceDate('2026-07-15', 'Annually')).toBe('2027-07-15')
  })

  it('defaults to monthly and handles year rollover', () => {
    expect(advanceDate('2026-12-15', null)).toBe('2027-01-15')
  })
})
