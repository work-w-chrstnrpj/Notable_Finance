import { describe, expect, it } from 'vitest'
import {
  accountReminders,
  expenseReminders,
  type DueDate
} from '../src/renderer/src/lib/use-notifications'
import { safeNotificationMessage } from '../src/main/services/notification-errors'
import { account, expense } from './factories'
import type { Account, ExpenseRecord } from '../src/renderer/src/types/finance'

const card = (over: Parameters<typeof account>[0] = {}) =>
  account({ id: 'cc', name: 'Metrobank', type: 'Credit Account', billingDay: 15, dueDay: 10, ...over }) as Account

const dueWindow: DueDate[] = [
  { iso: '2026-07-10', due: 'today' },
  { iso: '2026-07-11', due: 'tomorrow' }
]

describe('accountReminders', () => {
  it('reminds on the credit account due day inside the window', () => {
    const items = accountReminders([card({ currentBalance: -4500 })], dueWindow)
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('account:cc:2026-07-10')
    expect(items[0].due).toBe('today')
    expect(items[0].detail).toContain('4,500')
  })

  // 2026-02 has 28 days, so a dueDay past the month end lands on the last day.
  it('clamps a due day past the end of a short month onto the last day', () => {
    const items = accountReminders([card({ dueDay: 31 })], [{ iso: '2026-02-28', due: 'today' }])
    expect(items).toHaveLength(1)
  })

  it('skips inactive accounts and non-credit accounts', () => {
    expect(accountReminders([card({ inactive: true })], dueWindow)).toHaveLength(0)
    expect(accountReminders([card({ type: 'Cash' })], dueWindow)).toHaveLength(0)
  })

  it('stays quiet when tomorrow is excluded from the window', () => {
    const tomorrowOnly = accountReminders([card({ dueDay: 11 })], [{ iso: '2026-07-10', due: 'today' }])
    expect(tomorrowOnly).toHaveLength(0)
  })
})

describe('expenseReminders', () => {
  const accountById = new Map<string, Account>([['cc', card()]])
  const record = (over: Parameters<typeof expense>[0] = {}) =>
    expense({
      id: 'exp',
      accountId: 'cc',
      description: 'Laptop',
      purchaseDate: '2026-06-12',
      datePaid: null,
      paymentStatus: 'Unpaid',
      paymentFrequency: 'Monthly',
      periodCount: 1,
      amount: 1000,
      interest: 200,
      ...over
    }) as unknown as ExpenseRecord

  it('reminds on an unpaid credit transaction whose expected payment date is in the window', () => {
    const items = expenseReminders([record()], accountById, dueWindow)
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('expense:exp:2026-07-10')
    expect(items[0].title).toContain('Laptop')
    expect(items[0].detail).toContain('1,200')
  })

  it('covers installment records too', () => {
    const items = expenseReminders([record({ paymentStatus: 'Installment' })], accountById, dueWindow)
    expect(items).toHaveLength(1)
  })

  it('ignores settled, cancelled, and non-credit records', () => {
    expect(expenseReminders([record({ paymentStatus: 'Paid', datePaid: '2026-07-01' })], accountById, dueWindow)).toHaveLength(0)
    expect(expenseReminders([record({ paymentStatus: 'Cancelled' })], accountById, dueWindow)).toHaveLength(0)
    expect(expenseReminders([record({ accountId: 'wallet' })], accountById, dueWindow)).toHaveLength(0)
  })

  it('ignores a record whose expected payment date falls outside the window', () => {
    const items = expenseReminders([record({ purchaseDate: '2026-01-12' })], accountById, dueWindow)
    expect(items).toHaveLength(0)
  })
})

describe('safeNotificationMessage', () => {
  it('strips tokens, URLs, emails, and local paths before persisting', () => {
    const out = safeNotificationMessage(
      'Push failed for Bearer sk-abc123 at https://api.notion.com/v1/pages from /Users/sam/db.sqlite by sam@example.com'
    )
    expect(out).not.toContain('sk-abc123')
    expect(out).not.toContain('api.notion.com')
    expect(out).not.toContain('sam@example.com')
    expect(out).not.toContain('/Users/sam')
  })

  it('caps the stored message length', () => {
    expect(safeNotificationMessage('x'.repeat(900)).length).toBeLessThanOrEqual(500)
  })
})
