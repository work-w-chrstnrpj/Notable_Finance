import { describe, it, expect } from 'vitest'
import {
  expenseDtoToProperties,
  incomeDtoToProperties,
  NOTION_PROPERTY_NAMES
} from '../src/main/notion/property-mapper'
import { compareSchema, EXPECTED_SCHEMA } from '../src/main/notion/schema-spec'

describe('incomeDtoToProperties', () => {
  it('builds writable properties only for present fields', () => {
    const props = incomeDtoToProperties({
      name: 'Salary',
      date: '2026-07-01',
      grossIncome: 1000,
      accountId: 'notion-acc-1',
      categoryId: 'notion-cat-1'
    })
    expect(props[NOTION_PROPERTY_NAMES.incomes.name]).toEqual({
      title: [{ text: { content: 'Salary' } }]
    })
    expect(props[NOTION_PROPERTY_NAMES.incomes.date]).toEqual({ date: { start: '2026-07-01' } })
    expect(props[NOTION_PROPERTY_NAMES.incomes.grossIncome]).toEqual({ number: 1000 })
    expect(props[NOTION_PROPERTY_NAMES.incomes.accountId]).toEqual({
      relation: [{ id: 'notion-acc-1' }]
    })
    // absent fields are not emitted (PATCH must not clobber)
    expect(props[NOTION_PROPERTY_NAMES.incomes.capitalExpenditure]).toBeUndefined()
    // computed fields never appear
    expect(Object.keys(props)).not.toContain('Net Income')
  })

  it('null relation becomes an empty relation array', () => {
    const props = incomeDtoToProperties({ accountId: null })
    expect(props[NOTION_PROPERTY_NAMES.incomes.accountId]).toEqual({ relation: [] })
  })
})

describe('expenseDtoToProperties', () => {
  it('maps the full writable expense surface', () => {
    const props = expenseDtoToProperties({
      description: 'Groceries',
      purchaseDate: '2026-07-10',
      datePaid: null,
      amount: 250,
      interest: 5,
      accountId: 'na',
      categoryId: 'nc',
      paymentStatus: 'Unpaid',
      pasabuyer: 'Ana'
    })
    expect(props[NOTION_PROPERTY_NAMES.expenses.description]).toEqual({
      title: [{ text: { content: 'Groceries' } }]
    })
    expect(props[NOTION_PROPERTY_NAMES.expenses.datePaid]).toEqual({ date: null })
    expect(props[NOTION_PROPERTY_NAMES.expenses.paymentStatus]).toEqual({
      select: { name: 'Unpaid' }
    })
    expect(props[NOTION_PROPERTY_NAMES.expenses.pasabuyer]).toEqual({ select: { name: 'Ana' } })
    // pasabuyBalance is computed — no builder must ever emit it
    expect(props[NOTION_PROPERTY_NAMES.expenses.pasabuyBalance]).toBeUndefined()
  })
})

describe('compareSchema', () => {
  const expected = EXPECTED_SCHEMA.incomes

  const fullActual = Object.fromEntries(
    expected.map((p) => [p.property, { type: p.type }])
  )

  it('passes when every expected property matches', () => {
    const { errors, warnings } = compareSchema(expected, fullActual)
    expect(errors).toEqual([])
    expect(warnings).toEqual([])
  })

  it('reports a missing writable property as an error', () => {
    const actual = { ...fullActual }
    delete actual[NOTION_PROPERTY_NAMES.incomes.grossIncome]
    const { errors } = compareSchema(expected, actual)
    expect(errors).toEqual([
      {
        property: NOTION_PROPERTY_NAMES.incomes.grossIncome,
        expectedType: 'number',
        actualType: null
      }
    ])
  })

  it('reports a type mismatch as an error for writable fields', () => {
    const actual = {
      ...fullActual,
      [NOTION_PROPERTY_NAMES.incomes.date]: { type: 'rich_text' }
    }
    const { errors } = compareSchema(expected, actual)
    expect(errors).toContainEqual({
      property: NOTION_PROPERTY_NAMES.incomes.date,
      expectedType: 'date',
      actualType: 'rich_text'
    })
  })

  it('reports missing computed properties as warnings, not errors', () => {
    const accountsExpected = EXPECTED_SCHEMA.accounts
    const actual = Object.fromEntries(
      accountsExpected.filter((p) => p.kind === 'writable').map((p) => [p.property, { type: p.type }])
    )
    const { errors, warnings } = compareSchema(accountsExpected, actual)
    expect(errors).toEqual([])
    expect(warnings.length).toBe(accountsExpected.filter((p) => p.kind === 'computed').length)
  })
})
