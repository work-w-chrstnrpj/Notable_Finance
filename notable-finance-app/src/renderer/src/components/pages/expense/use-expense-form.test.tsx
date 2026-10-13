// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useExpenseForm } from './use-expense-form'

const options = { activeAccounts: [], expenseCategoryNameById: new Map<string, string>() }
describe('To Pay expense form', () => {
  it('allows an entirely blank planning record', () => {
    const { result } = renderHook(() => useExpenseForm({ ...options, viewMode: 'To pay' }))
    expect(result.current.fieldsRequired).toBe(false)
    expect(result.current.validate()).toBe(true)
    expect(result.current.buildPayload()).toMatchObject({ viewMode: 'To pay', description: '', accountId: '', categoryId: '', purchaseDate: '', datePaid: null, amount: 0 })
  })
  it('allows a name-only edit without supplying account, category, dates or amount', () => {
    const { result } = renderHook(() => useExpenseForm({ ...options, viewMode: 'To pay' }))
    act(() => result.current.setDescriptionInput('Renamed bill'))
    expect(result.current.validate()).toBe(true)
    expect(result.current.buildPayload().description).toBe('Renamed bill')
  })
  it('preserves required fields in normal expense forms', () => {
    const { result } = renderHook(() => useExpenseForm({ ...options, viewMode: 'Monthly' }))
    expect(result.current.fieldsRequired).toBe(true)
    act(() => { expect(result.current.validate()).toBe(false) })
    expect(result.current.shakeFields).toEqual(new Set(['description', 'account', 'category', 'amount']))
  })
})
