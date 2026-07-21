import { describe, it, expect } from 'vitest'
import {
  validateCreateExpense,
  validateCreateIncome,
  validateUpdateIncome,
  ValidationError
} from '../src/main/domain/validation'

describe('validateCreateIncome', () => {
  const valid = { name: 'Salary', date: '2026-07-01', grossIncome: 100, categoryId: 'c1' }

  it('accepts a valid input', () => {
    expect(() => validateCreateIncome(valid)).not.toThrow()
  })

  it('rejects empty name, bad date, non-finite amount, missing category', () => {
    expect(() => validateCreateIncome({ ...valid, name: ' ' })).toThrow(ValidationError)
    expect(() => validateCreateIncome({ ...valid, date: '07/01/2026' })).toThrow(ValidationError)
    expect(() => validateCreateIncome({ ...valid, grossIncome: NaN })).toThrow(ValidationError)
    expect(() => validateCreateIncome({ ...valid, categoryId: '' })).toThrow(ValidationError)
  })
})

describe('validateUpdateIncome', () => {
  it('only validates provided fields', () => {
    expect(() => validateUpdateIncome({})).not.toThrow()
    expect(() => validateUpdateIncome({ grossIncome: 50 })).not.toThrow()
    expect(() => validateUpdateIncome({ grossIncome: Infinity })).toThrow(ValidationError)
  })
})

describe('validateCreateExpense', () => {
  const valid = {
    description: 'Groceries',
    purchaseDate: '2026-07-10',
    amount: 250,
    accountId: 'a1',
    categoryId: 'food'
  }

  it('accepts a valid input and null datePaid', () => {
    expect(() => validateCreateExpense({ ...valid, datePaid: null })).not.toThrow()
  })

  it('rejects missing account/category and bad datePaid', () => {
    expect(() => validateCreateExpense({ ...valid, accountId: '' })).toThrow(ValidationError)
    expect(() => validateCreateExpense({ ...valid, categoryId: '' })).toThrow(ValidationError)
    expect(() => validateCreateExpense({ ...valid, datePaid: 'soon' })).toThrow(ValidationError)
  })
})
