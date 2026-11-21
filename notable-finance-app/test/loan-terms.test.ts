import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Storage + Notion seam for borrowing-terms/02 (node:sqlite, so it runs under plain Node).
const state = vi.hoisted(() => ({
  db: null as unknown as DatabaseSync,
  incomePages: [] as Record<string, unknown>[]
}))
const api = vi.hoisted(() => ({
  queryDatabase: vi.fn(),
  updatePage: vi.fn(async (id: string, _properties: Record<string, unknown>) => ({ id })),
  createPage: vi.fn(async (_db: string, _properties: Record<string, unknown>) => ({ id: 'created-page' }))
}))
vi.mock('../src/main/db', () => ({ getSqlite: () => state.db }))
vi.mock('../src/main/notion/service', () => ({ client: () => api }))
vi.mock('../src/main/notion/mapping-store', () => ({ getMapping: () => ({ incomes: 'income-db' }) }))
vi.mock('../src/main/sync/status', () => ({ isRunning: () => false, setRunning: vi.fn(), emitStatus: vi.fn(), syncStatus: () => ({ connected: true, mapped: true }) }))
vi.mock('../src/main/windows', () => ({ broadcast: vi.fn() }))
vi.mock('../src/main/services/history', () => ({ recordActivity: vi.fn() }))
vi.mock('../src/main/services/page-content', () => ({ replaceNotionPageContent: vi.fn() }))

import { pullAll } from '../src/main/sync/pull'
import { pushAll } from '../src/main/sync/push'
import { createIncome, getIncome, listIncomes, softDeleteIncome, updateIncome } from '../src/main/db/repositories'
import { incomeWritableFromRow } from '../src/main/sync/writable'
import { incomeDtoToProperties } from '../src/main/notion/property-mapper'
import { pageToIncomeFields } from '../src/main/notion/page-extractors'
import { compareSchema, EXPECTED_SCHEMA } from '../src/main/notion/schema-spec'
import { NotionApiError } from '../src/main/notion/client'
import {
  computeLoanSummary,
  hasLoanTerms,
  isLoan,
  stillOwedForBorrowAccount
} from '../src/shared/borrowings'
import { income } from './factories'

const folder = join(process.cwd(), 'src/main/db/migrations')
const journal = JSON.parse(readFileSync(join(folder, 'meta/_journal.json'), 'utf8')) as { entries: { tag: string }[] }
const sql = (tag: string): string => readFileSync(join(folder, `${tag}.sql`), 'utf8')
const migrate = (db: DatabaseSync, tags: string[]): void => {
  for (const tag of tags) db.exec(sql(tag).replaceAll('--> statement-breakpoint', ''))
}
const allTags = journal.entries.map((e) => e.tag)

const title = (s: string) => ({ type: 'title', title: [{ plain_text: s }] })
const num = (n: number | null) => ({ type: 'number', number: n })
const sel = (name: string | null) => ({ type: 'select', select: name ? { name } : null })
const rel = (...ids: string[]) => ({ type: 'relation', relation: ids.map((id) => ({ id })) })
const incomePage = (id: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  id,
  last_edited_time: '2026-11-01T00:00:00.000Z',
  properties: { Name: title(id), 'Gross Income': num(-150000), Date: { type: 'date', date: { start: '2026-11-01' } }, ...extra }
})
const row = (id: string): Record<string, unknown> =>
  state.db.prepare('SELECT * FROM incomes WHERE id = ?').get(id) as Record<string, unknown>

beforeEach(() => {
  state.db?.close()
  state.db = new DatabaseSync(':memory:')
  migrate(state.db, allTags)
  api.updatePage.mockReset().mockImplementation(async (id: string) => ({ id }))
  api.createPage.mockReset().mockImplementation(async () => ({ id: 'created-page' }))
  api.queryDatabase.mockImplementation(async () => state.incomePages)
  state.incomePages = []
  // A Borrow account (Auxiliary, name says debt/loan) and a bank, for links that must point at a Borrowed row.
  for (const [id, name, type] of [['debt', 'Debt/Loan', 'Auxiliary'], ['bank', 'Bank', 'Cash']]) {
    state.db.prepare('INSERT INTO accounts (id, notion_page_id, account_name, account_type, created_at) VALUES (?, ?, ?, ?, 0)').run(id, `n-${id}`, name, type)
  }
})
afterAll(() => state.db.close())

const loanInput = { name: 'Loan', date: '2026-11-01', grossIncome: -150000, categoryId: 'cat', accountId: 'debt', transactedAccountId: 'bank', interest: 5000, paymentFrequency: 'Monthly' as const, periodCount: 12 }

describe('borrowing-terms/02#AC1 migration', () => {
  it('borrowing-terms/02#AC1 adds four nullable columns and keeps existing rows', () => {
    state.db.close()
    state.db = new DatabaseSync(':memory:')
    migrate(state.db, allTags.filter((t) => t !== '0016_loan_terms'))
    state.db.prepare("INSERT INTO incomes (id, title, gross_income, local_updated_at, created_at) VALUES ('old', 'Salary', 20000, 1, 1)").run()
    const before = (state.db.prepare('PRAGMA table_info(incomes)').all() as Array<{ name: string }>).map((c) => c.name)
    expect(before).not.toContain('interest')

    migrate(state.db, ['0016_loan_terms'])

    const cols = state.db.prepare('PRAGMA table_info(incomes)').all() as Array<{ name: string; notnull: number; dflt_value: unknown }>
    for (const name of ['interest', 'payment_frequency', 'period_count', 'linked_borrowing_id']) {
      const col = cols.find((c) => c.name === name)
      expect(col, name).toBeDefined()
      expect(col!.notnull).toBe(0)
    }
    expect(row('old')).toMatchObject({ title: 'Salary', gross_income: 20000, interest: null, payment_frequency: null, period_count: null, linked_borrowing_id: null })
  })
})

describe('borrowing-terms/02#AC2 round trip', () => {
  it('borrowing-terms/02#AC2 repository stores and returns the four fields', () => {
    const loan = createIncome(loanInput)
    expect(loan).toMatchObject({ interest: 5000, paymentFrequency: 'Monthly', periodCount: 12, linkedBorrowingId: null })
    const repayment = createIncome({ name: 'Pay', date: '2026-12-01', grossIncome: -1000, categoryId: 'cat', linkedBorrowingId: loan.id })
    expect(getIncome(repayment.id).linkedBorrowingId).toBe(loan.id)
    const edited = updateIncome(loan.id, { interest: 6000, periodCount: 10, paymentFrequency: 'Weekly' })
    expect(edited).toMatchObject({ interest: 6000, periodCount: 10, paymentFrequency: 'Weekly' })
    expect(listIncomes().find((r) => r.id === loan.id)?.interest).toBe(6000)
    expect(incomeWritableFromRow(row(loan.id))).toMatchObject({ interest: 6000, paymentFrequency: 'Weekly', periodCount: 10, linkedBorrowingId: null })
  })

  it('borrowing-terms/02#AC2 property mapper writes and extractor reads the Notion properties', () => {
    const props = incomeDtoToProperties({ interest: 5000, paymentFrequency: 'Monthly', periodCount: 12, linkedBorrowingId: 'loan-page' })
    expect(props).toMatchObject({
      Interest: { number: 5000 },
      'Payment Frequency': { select: { name: 'Monthly' } },
      'Period count': { number: 12 },
      'Linked Borrowing': { relation: [{ id: 'loan-page' }] }
    })
    expect(Object.keys(props)).not.toContain('Payments Made')
    const fields = pageToIncomeFields({ id: 'p', properties: { Interest: num(5000), 'Payment Frequency': sel('Monthly'), 'Period count': num(12), 'Linked Borrowing': rel('loan-page') } })
    expect(fields).toMatchObject({ interest: 5000, payment_frequency: 'Monthly', period_count: 12, linked_borrowing_id: 'loan-page' })
  })

  it('borrowing-terms/02#AC2 pull joins the base snapshot, links repayments, and push sends the terms', async () => {
    // Repayment is listed before its loan: the link must still resolve.
    state.incomePages = [
      incomePage('repay-page', { 'Gross Income': num(-1000), 'Linked Borrowing': rel('loan-page') }),
      incomePage('loan-page', { Interest: num(5000), 'Payment Frequency': sel('Monthly'), 'Period count': num(12) })
    ]
    expect((await pullAll(true)).errors).toEqual([])
    const loan = listIncomes().find((r) => r.name === 'loan-page')!
    const repayment = listIncomes().find((r) => r.name === 'repay-page')!
    expect(loan).toMatchObject({ interest: 5000, paymentFrequency: 'Monthly', periodCount: 12 })
    expect(repayment.linkedBorrowingId).toBe(loan.id)
    for (const r of [loan, repayment]) {
      const base = JSON.parse(row(r.id).base_snapshot as string)
      expect(base).toMatchObject({ interest: r.interest, paymentFrequency: r.paymentFrequency, periodCount: r.periodCount, linkedBorrowingId: r.linkedBorrowingId })
    }
    // A clean pulled row is not dirty, so the link fill-in must not look like a local edit.
    expect(row(repayment.id).sync_state).toBe('clean')

    updateIncome(loan.id, { interest: 6000 })
    updateIncome(repayment.id, { name: 'repay-edited' })
    expect((await pushAll()).errors).toEqual([])
    const loanWrite = api.updatePage.mock.calls.find(([id]) => id === 'loan-page')
    expect(loanWrite?.[1]).toMatchObject({ Interest: { number: 6000 }, 'Period count': { number: 12 } })
    const repayWrite = api.updatePage.mock.calls.find(([id]) => id === 'repay-page')
    expect(repayWrite?.[1]).toMatchObject({ 'Linked Borrowing': { relation: [{ id: 'loan-page' }] } })
  })
})

describe('borrowing-terms/02#AC3 empty or missing properties', () => {
  it('borrowing-terms/02#AC3 empty values load as null without error', async () => {
    const fields = pageToIncomeFields({ id: 'p', properties: { Interest: num(null), 'Payment Frequency': sel(null), 'Period count': num(null), 'Linked Borrowing': rel() } })
    expect(fields).toMatchObject({ interest: null, payment_frequency: null, period_count: null, linked_borrowing_id: null })
    state.incomePages = [incomePage('empty-page', { Interest: num(null), 'Payment Frequency': sel(null), 'Period count': num(null), 'Linked Borrowing': rel() })]
    expect((await pullAll(true)).errors).toEqual([])
    expect(listIncomes()[0]).toMatchObject({ interest: null, paymentFrequency: null, periodCount: null, linkedBorrowingId: null })
  })

  it('borrowing-terms/02#AC3 properties absent in Notion load and never wipe local terms', async () => {
    state.incomePages = [incomePage('loan-page')]
    expect((await pullAll(true)).errors).toEqual([])
    const loan = listIncomes()[0]
    expect(loan).toMatchObject({ interest: null, periodCount: null })
    updateIncome(loan.id, { interest: 5000, paymentFrequency: 'Monthly', periodCount: 12 })
    await pushAll()
    // Notion has no loan properties at all (database not set up yet): pull again, terms stay.
    state.incomePages = [{ ...incomePage('loan-page'), last_edited_time: '2026-11-02T00:00:00.000Z' }]
    expect((await pullAll(true)).errors).toEqual([])
    expect(getIncome(loan.id)).toMatchObject({ interest: 5000, paymentFrequency: 'Monthly', periodCount: 12 })
  })

  it('borrowing-terms/02#AC3 sync still works when Notion lacks the properties', async () => {
    state.db.prepare("INSERT INTO income_categories (id, notion_page_id, source, created_at) VALUES ('cat', 'cat-page', 'Borrowed Money', 0)").run()
    // Plain row: the loan properties are not sent at all.
    createIncome({ name: 'Salary', date: '2026-11-01', grossIncome: 100, categoryId: 'cat' })
    expect((await pushAll()).errors).toEqual([])
    const [, plainProps] = api.createPage.mock.calls[0] as [string, Record<string, unknown>]
    for (const name of ['Interest', 'Payment Frequency', 'Period count', 'Linked Borrowing']) expect(plainProps).not.toHaveProperty(name)

    // A loan row against a database without the properties: Notion rejects, push retries without them.
    createIncome(loanInput)
    api.createPage.mockReset()
    api.createPage
      .mockRejectedValueOnce(new NotionApiError('Interest is not a property that exists.', 400, 'validation_error'))
      .mockResolvedValue({ id: 'loan-created' })
    const result = await pushAll()
    expect(result.errors).toEqual([])
    expect(result.failed).toBe(0)
    expect(api.createPage).toHaveBeenCalledTimes(2)
    expect(api.createPage.mock.calls[1][1]).not.toHaveProperty('Interest')
    expect(api.createPage.mock.calls[1][1]).toHaveProperty('Name')
  })

  it('borrowing-terms/02#AC3 a missing loan property is a schema warning, a wrong type is still an error', () => {
    const incomesSpec = EXPECTED_SCHEMA.incomes
    const base: Record<string, { type: string }> = {}
    for (const p of incomesSpec.filter((s) => !['Interest', 'Payment Frequency', 'Period count', 'Linked Borrowing'].includes(s.property))) base[p.property] = { type: p.type }
    expect(compareSchema(incomesSpec, base).errors).toEqual([])
    expect(compareSchema(incomesSpec, { ...base, Interest: { type: 'rich_text' } }).errors.map((e) => e.property)).toEqual(['Interest'])
  })
})

describe('borrowing-terms/02#AC4-AC7 loan math', () => {
  const loan = income({ id: 'L', grossIncome: -150000, interest: 5000, paymentFrequency: 'Monthly', periodCount: 12 })
  const pay = (id: string, amount: number, linked: string | null, deleted = false) =>
    income({ id, grossIncome: -amount, linkedBorrowingId: linked, deleted })

  it('borrowing-terms/02#AC4 150,000 + 5,000 interest over 12 periods owes 155,000, suggested 12,916.67', () => {
    const s = computeLoanSummary(loan, [])
    expect(s).toMatchObject({ principal: 150000, interest: 5000, totalOwed: 155000, suggestedPayment: 12916.67, remainingBalance: 155000 })
  })

  it('borrowing-terms/02#AC5 paid amount and payments made count only linked, non-deleted repayments', () => {
    const s = computeLoanSummary(loan, [
      pay('a', 12916.67, 'L'),
      pay('b', 5000, 'L'),
      pay('c', 700, null), // unlinked
      pay('d', 900, 'OTHER'), // another loan
      pay('e', 400, 'L', true) // deleted
    ])
    expect(s.paidAmount).toBe(17916.67)
    expect(s.paymentsMade).toBe(2)
  })

  it('borrowing-terms/02#AC6 remaining balance is total owed minus paid and never below 0', () => {
    expect(computeLoanSummary(loan, [pay('a', 12916.67, 'L')]).remainingBalance).toBe(142083.33)
    expect(computeLoanSummary(loan, [pay('a', 155000, 'L')]).remainingBalance).toBe(0)
    expect(computeLoanSummary(loan, [pay('a', 200000, 'L')]).remainingBalance).toBe(0)
  })

  it('borrowing-terms/02#AC7 no terms or an invalid period count has no suggested payment and is otherwise unchanged', () => {
    const plain = income({ id: 'L', grossIncome: -1000 })
    expect(hasLoanTerms(plain)).toBe(false)
    expect(computeLoanSummary(plain, [pay('a', 300, 'L')])).toMatchObject({ suggestedPayment: null, totalOwed: 1000, paidAmount: 300, remainingBalance: 700 })
    for (const periodCount of [0, -3, 2.5, null]) {
      expect(computeLoanSummary({ ...loan, periodCount }, []).suggestedPayment, String(periodCount)).toBeNull()
    }
    expect(computeLoanSummary({ ...loan, periodCount: 0 }, [pay('a', 5000, 'L')])).toMatchObject({ totalOwed: 155000, remainingBalance: 150000 })
  })
})

describe('borrowing-terms/02#AC8 still owed for a Borrow account', () => {
  it('borrowing-terms/02#AC8 adds remaining balance of loans with terms to the balance-based amount for the rest', () => {
    const loan = income({ id: 'L', accountId: 'B', grossIncome: -150000, interest: 5000, periodCount: 12 })
    const plain = income({ id: 'P', accountId: 'B', grossIncome: -1000 })
    const paid = income({ id: 'r1', accountId: 'bank', transactedAccountId: 'B', grossIncome: -12916.67, linkedBorrowingId: 'L' })
    const unlinked = income({ id: 'r2', accountId: 'bank', transactedAccountId: 'B', grossIncome: -500 })
    const deleted = income({ id: 'r3', accountId: 'bank', transactedAccountId: 'B', grossIncome: -999, linkedBorrowingId: 'L', deleted: true })
    // The account balance counts both borrowings and the live repayments: 150,000 + 1,000 − 12,916.67 − 500.
    const balanceOwed = 150000 + 1000 - 12916.67 - 500
    // 142,083.33 remaining on the loan + (1,000 − 500) on the plain borrowing.
    expect(stillOwedForBorrowAccount('B', balanceOwed, [loan, plain, paid, unlinked, deleted])).toBe(142583.33)
    // A borrowing without terms alone is exactly the old balance-based amount.
    expect(stillOwedForBorrowAccount('B', 500, [plain, unlinked])).toBe(500)
    // Overpaying a loan with terms never makes it negative.
    const over = income({ id: 'r4', accountId: 'bank', transactedAccountId: 'B', grossIncome: -200000, linkedBorrowingId: 'L' })
    expect(stillOwedForBorrowAccount('B', 150000 - 200000, [loan, over])).toBe(0)
  })
})


const withCategory = (): void => {
  state.db.prepare("INSERT INTO income_categories (id, notion_page_id, source, created_at) VALUES ('cat', 'cat-page', 'Borrowed Money', 0)").run()
}
const missingInterest = (): NotionApiError => new NotionApiError('Interest is not a property that exists.', 400, 'validation_error')
const emptyLoanProps = {
  Interest: num(null), 'Payment Frequency': sel(null), 'Period count': num(null), 'Linked Borrowing': rel()
}

describe('borrowing-terms/02#sync-fallback terms pushed through the fallback are not claimed as synced', () => {
  it('borrowing-terms/02#sync-fallback terms survive an empty pull after the properties are added and are pushed next sync', async () => {
    withCategory()
    const loan = createIncome(loanInput)
    api.createPage.mockReset()
    api.createPage.mockRejectedValueOnce(missingInterest()).mockResolvedValue({ id: 'loan-created' })
    expect((await pushAll()).errors).toEqual([])
    // The row reached Notion without its terms: it must not claim they were synced.
    expect(JSON.parse(row(loan.id).base_snapshot as string)).toMatchObject({ interest: null, paymentFrequency: null, periodCount: null })
    expect(row(loan.id).sync_state).toBe('dirty')

    // The owner adds the (empty) properties in Notion; the next pull must not wipe local terms.
    state.incomePages = [{ ...incomePage('loan-created', emptyLoanProps), last_edited_time: '2026-11-05T00:00:00.000Z' }]
    expect((await pullAll(true)).errors).toEqual([])
    expect(getIncome(loan.id)).toMatchObject({ interest: 5000, paymentFrequency: 'Monthly', periodCount: 12 })

    // And the terms are pushed on the next sync, after which the row is clean with an honest base.
    api.updatePage.mockClear()
    expect((await pushAll()).errors).toEqual([])
    expect(api.updatePage).toHaveBeenCalledWith('loan-created', expect.objectContaining({ Interest: { number: 5000 }, 'Period count': { number: 12 } }), expect.anything())
    expect(row(loan.id).sync_state).toBe('clean')
    expect(JSON.parse(row(loan.id).base_snapshot as string)).toMatchObject({ interest: 5000, paymentFrequency: 'Monthly', periodCount: 12 })
  })

  it('borrowing-terms/02#sync-fallback a row with no loan terms stays clean after the fallback', async () => {
    withCategory()
    const plain = createIncome({ name: 'Plain', date: '2026-11-01', grossIncome: 10, categoryId: 'cat' })
    expect((await pushAll()).errors).toEqual([])
    expect(row(plain.id).sync_state).toBe('clean')
  })

  it('borrowing-terms/02#sync-fallback only retries on Notion\'s missing-property message', async () => {
    withCategory()
    createIncome(loanInput)
    api.createPage.mockReset()
    api.createPage.mockRejectedValue(new NotionApiError('Interest must be greater than 0 (number).', 400, 'validation_error'))
    const result = await pushAll()
    expect(api.createPage).toHaveBeenCalledTimes(1)
    expect(result.failed).toBe(1)
    // A different property that is missing is not a loan property: no loan-property retry either.
    api.createPage.mockReset()
    api.createPage.mockRejectedValue(new NotionApiError('Gross Income is not a property that exists.', 400, 'validation_error'))
    await pushAll()
    expect(api.createPage).toHaveBeenCalledTimes(1)
  })
})

describe('borrowing-terms/02#validation main-process loan rules', () => {
  const base = { name: 'L', date: '2026-11-01', grossIncome: -1000, categoryId: 'cat' }
  const loan = () => createIncome({ ...base, interest: 100, paymentFrequency: 'Monthly', periodCount: 4 })

  it('borrowing-terms/02#validation Period count must be a whole number of at least 1', () => {
    for (const periodCount of [0, -2, 2.5, Number.NaN]) {
      expect(() => createIncome({ ...base, paymentFrequency: 'Monthly', periodCount }), `create ${periodCount}`).toThrow(/periodCount|period count/i)
    }
    const l = loan()
    for (const periodCount of [0, -2, 2.5]) {
      expect(() => updateIncome(l.id, { periodCount }), `update ${periodCount}`).toThrow(/periodCount|period count/i)
    }
    expect(updateIncome(l.id, { periodCount: 6 }).periodCount).toBe(6)
  })

  it('borrowing-terms/02#validation Period count and Payment Frequency come as a pair', () => {
    expect(() => createIncome({ ...base, periodCount: 4 })).toThrow(/payment frequency/i)
    expect(() => createIncome({ ...base, paymentFrequency: 'Monthly' })).toThrow(/period count/i)
    expect(createIncome({ ...base, interest: 50 }).interest).toBe(50) // Interest alone is fine
    expect(createIncome({ ...base, paymentFrequency: null, periodCount: null }).periodCount).toBeNull()
    const l = loan()
    expect(() => updateIncome(l.id, { periodCount: null })).toThrow(/payment frequency|period count/i)
    expect(() => updateIncome(l.id, { paymentFrequency: null })).toThrow(/payment frequency|period count/i)
    expect(updateIncome(l.id, { paymentFrequency: null, periodCount: null })).toMatchObject({ paymentFrequency: null, periodCount: null, interest: 100 })
  })

  it('borrowing-terms/02#validation Interest stays optional and non-negative', () => {
    expect(() => createIncome({ ...base, interest: -1 })).toThrow(/interest/i)
    expect(() => updateIncome(loan().id, { interest: -5 })).toThrow(/interest/i)
    expect(createIncome({ ...base, interest: 0 }).interest).toBe(0)
    expect(createIncome(base).interest).toBeNull()
  })

  it('borrowing-terms/02#validation rows without terms behave as before', () => {
    const plain = createIncome(base)
    expect(plain).toMatchObject({ interest: null, paymentFrequency: null, periodCount: null, linkedBorrowingId: null })
    expect(updateIncome(plain.id, { name: 'Renamed' }).name).toBe('Renamed')
  })
})

describe('borrowing-terms/07 two-way loan links', () => {
  const borrowed = (extra: Record<string, unknown> = {}) =>
    createIncome({ name: 'Borrow', date: '2026-11-01', grossIncome: -1000, categoryId: 'cat', accountId: 'debt', transactedAccountId: 'bank', ...extra })
  const repay = (extra: Record<string, unknown> = {}) =>
    createIncome({ name: 'Repay', date: '2026-11-02', grossIncome: -100, categoryId: 'cat', accountId: 'bank', transactedAccountId: 'debt', ...extra })

  it('borrowing-terms/07#AC5 a link may point at any live Borrowed row, with or without terms, and rejects self, a repayment, a deleted or a missing row', () => {
    const plain = borrowed()
    const withTerms = borrowed({ interest: 100, paymentFrequency: 'Monthly', periodCount: 4 })
    expect(repay({ linkedBorrowingId: plain.id }).linkedBorrowingId).toBe(plain.id)
    expect(repay({ linkedBorrowingId: withTerms.id }).linkedBorrowingId).toBe(withTerms.id)
    const r = repay()
    expect(updateIncome(r.id, { linkedBorrowingId: plain.id }).linkedBorrowingId).toBe(plain.id)
    expect(updateIncome(r.id, { linkedBorrowingId: null }).linkedBorrowingId).toBeNull()
    expect(() => updateIncome(plain.id, { linkedBorrowingId: plain.id })).toThrow(/itself/i)
    expect(() => repay({ linkedBorrowingId: r.id })).toThrow(/repayment|borrowed/i)
    expect(() => repay({ linkedBorrowingId: 'missing' })).toThrow(/exist/i)
    const gone = borrowed()
    softDeleteIncome(gone.id)
    expect(() => repay({ linkedBorrowingId: gone.id })).toThrow(/deleted/i)
  })

  it('borrowing-terms/07#AC3 a Borrowed row without terms but with linked repayments is a loan with Interest 0', () => {
    const plain = income({ id: 'P', accountId: 'B', grossIncome: -1000 })
    const pay = (id: string, amount: number, linked: string | null, deleted = false) => income({ id, grossIncome: -amount, linkedBorrowingId: linked, deleted })
    expect(isLoan(plain, [plain])).toBe(false)
    expect(isLoan(plain, [plain, pay('a', 400, 'P', true)])).toBe(false) // a deleted link does not count
    expect(isLoan(plain, [plain, pay('a', 400, 'P')])).toBe(true)
    expect(isLoan(income({ id: 'T', interest: 1 }), [])).toBe(true)
    expect(computeLoanSummary(plain, [pay('a', 400, 'P')])).toMatchObject({ interest: 0, totalOwed: 1000, suggestedPayment: null, paidAmount: 400, paymentsMade: 1, remainingBalance: 600 })
    expect(computeLoanSummary(plain, [pay('a', 1500, 'P')]).remainingBalance).toBe(0)
  })

  it('borrowing-terms/07#AC4 still owed counts a terms-less loan with links once and equals loan balances plus the rest', () => {
    const plain = income({ id: 'P', accountId: 'B', grossIncome: -1000 })
    const other = income({ id: 'O', accountId: 'B', grossIncome: -2000 })
    const linked = income({ id: 'r1', accountId: 'bank', transactedAccountId: 'B', grossIncome: -400, linkedBorrowingId: 'P' })
    const loose = income({ id: 'r2', accountId: 'bank', transactedAccountId: 'B', grossIncome: -100 })
    // Balance-based amount: 1,000 + 2,000 − 400 − 100 = 2,500. Loan P owes 600, O is untouched 2,000, the loose payment −100.
    expect(stillOwedForBorrowAccount('B', 2500, [plain, other, linked, loose])).toBe(2500)
    // Overpaying the linked loan clamps it at 0 instead of going negative.
    const over = income({ id: 'r3', accountId: 'bank', transactedAccountId: 'B', grossIncome: -1500, linkedBorrowingId: 'P' })
    expect(stillOwedForBorrowAccount('B', 1000 - 1500, [plain, over])).toBe(0)
    // With a terms loan in the mix nothing is counted twice.
    const terms = income({ id: 'T', accountId: 'B', grossIncome: -150000, interest: 5000, periodCount: 12 })
    const tp = income({ id: 'r4', accountId: 'bank', transactedAccountId: 'B', grossIncome: -12916.67, linkedBorrowingId: 'T' })
    expect(stillOwedForBorrowAccount('B', 150000 + 1000 - 400 - 12916.67, [terms, plain, linked, tp])).toBe(142083.33 + 600)
  })
})
