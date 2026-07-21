import { describe, it, expect } from 'vitest'
import {
  isDeletedTitle,
  pageToAccountFields,
  pageToExpenseFields,
  pageToIncomeCategoryFields,
  pageToIncomeFields
} from '../src/main/notion/page-extractors'

// Notion page fixtures (shape as returned by the API).
const title = (s: string) => ({ title: [{ plain_text: s }] })
const num = (n: number) => ({ number: n })
const sel = (name: string) => ({ select: { name } })
const chk = (b: boolean) => ({ checkbox: b })
const date = (s: string) => ({ date: { start: s } })
const rel = (id: string) => ({ relation: [{ id }] })

describe('pageToAccountFields', () => {
  it('extracts writable account inputs', () => {
    const page = {
      id: 'acc-page',
      properties: {
        'Account Name': title('BPI Savings'),
        'Account Type': sel('Savings'),
        'Starting Balance': num(20000),
        'Credit Limit': { number: null },
        Inactive: chk(false)
      }
    }
    const f = pageToAccountFields(page)
    expect(f.account_name).toBe('BPI Savings')
    expect(f.account_type).toBe('Savings')
    expect(f.starting_balance).toBe(20000)
    expect(f.credit_limit).toBeNull()
    expect(f.inactive).toBe(0)
  })

  it('defaults type to Cash and balance to 0 when absent', () => {
    const f = pageToAccountFields({ id: 'x', properties: {} })
    expect(f.account_type).toBe('Cash')
    expect(f.starting_balance).toBe(0)
  })
})

describe('pageToIncomeCategoryFields', () => {
  it('forces workflow categories to auxiliary even if the checkbox is unchecked', () => {
    const savings = pageToIncomeCategoryFields({
      id: 'c1',
      properties: { 'Source of Income': title('Savings'), Auxiliary: chk(false) }
    })
    expect(savings.auxiliary).toBe(1)
    const salary = pageToIncomeCategoryFields({
      id: 'c2',
      properties: { 'Source of Income': title('Salary'), Auxiliary: chk(false) }
    })
    expect(salary.auxiliary).toBe(0)
  })
})

describe('pageToIncomeFields', () => {
  it('returns Notion relation ids and flags transactions', () => {
    const f = pageToIncomeFields({
      id: 'i1',
      properties: {
        Name: title('Payroll'),
        Date: date('2026-07-01'),
        'Gross Income': num(50000),
        Accounts: rel('acc-notion'),
        Categories: rel('cat-notion'),
        'Transacted Account': rel('acc2-notion')
      }
    })
    expect(f.title).toBe('Payroll')
    expect(f.account_id).toBe('acc-notion')
    expect(f.category_id).toBe('cat-notion')
    expect(f.transacted_account_id).toBe('acc2-notion')
    expect(f.is_transaction).toBe(1)
  })

  it('is_transaction is 0 for a plain income', () => {
    const f = pageToIncomeFields({
      id: 'i2',
      properties: { Name: title('Gift'), 'Gross Income': num(100) }
    })
    expect(f.is_transaction).toBe(0)
    expect(f.account_id).toBeNull()
  })
})

describe('pageToExpenseFields', () => {
  it('extracts pasabuy + payment fields', () => {
    const f = pageToExpenseFields({
      id: 'e1',
      properties: {
        'Purchase description': title('Groceries'),
        'Purchase Date': date('2026-07-10'),
        'Expense Amount': num(250),
        Interest: num(5),
        Accounts: rel('acc-notion'),
        Categories: rel('cat-notion'),
        'Payment Status': sel('Unpaid'),
        Pasabuyer: sel('Ana')
      }
    })
    expect(f.title).toBe('Groceries')
    expect(f.amount).toBe(250)
    expect(f.interest).toBe(5)
    expect(f.payment_status).toBe('Unpaid')
    expect(f.pasabuyer).toBe('Ana')
    expect(f.date_paid).toBeNull()
  })
})

describe('isDeletedTitle', () => {
  it('detects the soft-delete title convention', () => {
    expect(isDeletedTitle('[Deleted: Old expense]')).toBe(true)
    expect(isDeletedTitle('Groceries')).toBe(false)
  })
})
