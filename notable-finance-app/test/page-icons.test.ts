import { describe, it, expect } from 'vitest'
import { iconForExpense, iconForIncome } from '../src/main/notion/page-icons'

describe('iconForIncome', () => {
  it('uses delivery truck for receivables (no account)', () => {
    expect(iconForIncome({ categorySource: 'Salary', accountId: null })).toEqual({
      type: 'icon',
      icon: { name: 'delivery truck profile', color: 'blue' }
    })
  })

  it('uses a redirect arrow for Transfer', () => {
    expect(iconForIncome({ categorySource: 'Transfer', accountId: 'acc-1' })).toEqual({
      type: 'icon',
      icon: { name: 'arrow half left right circle', color: 'yellow' }
    })
  })

  it('uses credit card for Credit Card Payment', () => {
    expect(iconForIncome({ categorySource: 'Credit Card Payment', accountId: 'acc-1' })).toEqual({
      type: 'icon',
      icon: { name: 'credit card', color: 'red' }
    })
  })

  it('uses arrow up for normal income', () => {
    expect(iconForIncome({ categorySource: 'Employment', accountId: 'acc-1' })).toEqual({
      type: 'icon',
      icon: { name: 'arrow up circle', color: 'green' }
    })
  })
})

describe('iconForExpense', () => {
  it('uses vitruvian for Pasabuy category', () => {
    expect(iconForExpense({ categoryName: 'Pasabuy' })).toEqual({
      type: 'icon',
      icon: { name: 'vitruvian man circle', color: 'yellow' }
    })
  })

  it('uses vitruvian when isPasabuy is set even without category name', () => {
    expect(iconForExpense({ categoryName: 'Food', isPasabuy: true })).toEqual({
      type: 'icon',
      icon: { name: 'vitruvian man circle', color: 'yellow' }
    })
  })

  it('uses arrow down for normal expenses', () => {
    expect(iconForExpense({ categoryName: 'Groceries' })).toEqual({
      type: 'icon',
      icon: { name: 'arrow down circle', color: 'red' }
    })
  })
})
