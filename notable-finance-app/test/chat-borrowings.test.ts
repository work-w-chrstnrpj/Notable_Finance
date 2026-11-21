import { describe, expect, it, vi } from 'vitest'
import { routeChatSkill } from '../src/main/chat/skills/router'
import { executeChatTool, isChatToolAllowed } from '../src/main/chat/tools/registry'
import { editDraftFields } from '../src/main/chat/tools/write-tools'
import { toCreateIncomeInput } from '../src/main/chat/tools/write-tools'
import { computeLoanSummary } from '../src/shared/borrowings'

// Rows the mocked repository returns for the Borrowings view (empty unless a test sets them).
const store = vi.hoisted(() => ({ incomes: [] as Array<Record<string, unknown>> }))

vi.mock('../src/main/db/repositories', async (importOriginal) => ({
  ...await importOriginal<typeof import('../src/main/db/repositories')>(),
  listAccounts: () => [
    { id: 'wallet', name: 'Home Wallet', type: 'Cash', currentBalance: 500 },
    { id: 'card', name: 'Card', type: 'Credit Account', currentBalance: 0 },
    { id: 'borrow', name: 'Borrowed Money', type: 'Auxiliary', currentBalance: -1000 },
    { id: 'rewards', name: 'Auxiliary & Rewards', type: 'Auxiliary', currentBalance: 0 },
    { id: 'loan', name: 'Debt/Loan', type: 'Auxiliary', currentBalance: 0 }
  ],
  // Loan lookups read the Borrowings rows; these tests run without a database.
  listIncomes: () => store.incomes,
  listIncomeCategories: () => [
    { id: 'cat-borrow', source: 'Borrowed Money', auxiliary: true },
    { id: 'cat-lent', source: 'Money Lent', auxiliary: true }
  ]
}))

const ctx = { threadId: 'borrow-test' }
type DraftResult = { draft: { id: string; status: string; missingRequired: string[]; payload: Record<string, unknown> } }
const run = (name: string, args: unknown) => executeChatTool(name, JSON.stringify(args), ctx) as DraftResult

describe('chat Borrowings and Money Lent tools', () => {
  it('drafts a borrow: debits the Borrow account, credits the receiving account', () => {
    const { draft } = run('proposeCreateBorrowing', { type: 'borrowed', name: 'Borrow: Ana', amount: 1000, otherAccount: 'Home Wallet', borrowAccount: 'Borrowed Money', date: '2026-11-14' })
    expect(draft.missingRequired).toEqual([])
    expect(draft.payload).toMatchObject({
      grossIncome: -1000, accountId: 'borrow', transactedAccountId: 'wallet', categoryId: 'cat-borrow', isTransaction: true
    })
    expect(toCreateIncomeInput(draft.payload)).toMatchObject({ grossIncome: -1000, accountId: 'borrow', isTransaction: true })
  })

  it('drafts a repayment: debits the paying account, credits the Borrow account', () => {
    const { draft } = run('proposeCreateBorrowing', { type: 'repayment', name: 'Repayment: Ana', amount: 400, otherAccount: 'Home Wallet', borrowAccount: 'Borrowed Money', date: '2026-11-14' })
    expect(draft.payload).toMatchObject({ grossIncome: -400, accountId: 'wallet', transactedAccountId: 'borrow' })
  })

  it('asks which Borrow account when there is more than one', () => {
    const { draft } = run('proposeCreateBorrowing', { type: 'borrowed', name: 'x', amount: 5, otherAccount: 'Home Wallet' })
    expect(draft.missingRequired.join(' ')).toMatch(/Borrow Account \(one of: Borrowed Money, Debt\/Loan\)/)
  })

  it('asks for what is missing and rejects credit or non-borrow accounts', () => {
    const missing = run('proposeCreateBorrowing', { name: 'x', amount: 5 }).draft.missingRequired
    expect(missing).toEqual(expect.arrayContaining(['Type (Borrowed or Repayment)', 'Received Into account']))
    const bad = run('proposeCreateBorrowing', { type: 'borrowed', name: 'x', amount: 5, otherAccount: 'Card', borrowAccount: 'Auxiliary & Rewards' })
    expect(bad.draft.missingRequired.join(' ')).toMatch(/Borrow Account \(must be/)
    expect(bad.draft.missingRequired.join(' ')).toMatch(/non-credit/)
  })

  it('keeps the borrow/repayment orientation when edited on the confirm card', () => {
    const { draft } = run('proposeCreateBorrowing', { type: 'repayment', name: 'Repayment: Ana', amount: 400, otherAccount: 'Home Wallet', borrowAccount: 'Borrowed Money' })
    const edited = editDraftFields(draft.id, { amount: 250 })
    expect(edited.payload).toMatchObject({ grossIncome: -250, accountId: 'wallet', transactedAccountId: 'borrow' })
  })

  it('drafts Lend Money against the locked Money Lent category', () => {
    const { draft } = run('proposeCreateMoneyLent', { name: 'Lend Money: Ben', amount: 1500, sourceAccount: 'Home Wallet' })
    expect(draft.missingRequired).toEqual([])
    expect(draft.payload).toMatchObject({ grossIncome: -1500, accountId: 'wallet', categoryId: 'cat-lent', isTransaction: false, transactedAccountId: null })
    expect(run('proposeCreateMoneyLent', { name: 'x', amount: 5, sourceAccount: 'Card' }).draft.missingRequired.join(' ')).toMatch(/non-credit/)
  })

  it('summarizes what is still owed per Borrow account', () => {
    expect(executeChatTool('getBorrowingsSummary', '{}', ctx)).toMatchObject({
      borrowAccounts: [{ id: 'borrow', stillOwed: 1000 }, { id: 'loan', stillOwed: 0 }], totalStillOwed: 1000
    })
  })

  it('routes borrow and lend intents, still refuses deletes, and exposes no delete tool', () => {
    expect(routeChatSkill('humiram ako kay Ana ng 1000')).toBe('workflow-borrowings')
    expect(routeChatSkill('how much do I owe')).toBe('workflow-borrowings')
    expect(routeChatSkill('record a repayment of 400')).toBe('workflow-borrowings')
    expect(routeChatSkill('I lent Ben 1500 today')).toBe('workflow-money-lent')
    expect(routeChatSkill('Receivable 5k utang sa akin')).toBe('workflow-receivables')
    expect(routeChatSkill('delete my borrowing record')).toBe('refuse-delete')
    expect(isChatToolAllowed('deleteBorrowing')).toBe(false)
  })
})

describe('borrowing-terms/05 chat parity for loan terms', () => {
  const loanRow = {
    id: 'loan-1', name: 'Borrow: Ana', date: '2026-11-01', grossIncome: -150000, deleted: false,
    accountId: 'borrow', transactedAccountId: 'wallet', categoryId: 'cat-borrow',
    interest: 5000, paymentFrequency: 'Monthly', periodCount: 12, linkedBorrowingId: null
  }
  const repayment = (id: string, amount: number, linked: string | null, deleted = false) => ({
    id, name: 'Repayment: Ana', date: '2026-11-10', grossIncome: -amount, deleted,
    accountId: 'wallet', transactedAccountId: 'borrow', categoryId: 'cat-borrow', linkedBorrowingId: linked
  })
  const withRows = (rows: Array<Record<string, unknown>>) => { store.incomes = rows }

  it('borrowing-terms/05#AC1 borrow 150,000 with 5,000 interest over 12 months drafts the terms and read-only totals', () => {
    withRows([])
    const { draft } = run('proposeCreateBorrowing', {
      type: 'borrowed', name: 'Borrow: Ana', amount: 150000, interest: 5000, paymentFrequency: 'monthly', periodCount: 12,
      otherAccount: 'Home Wallet', borrowAccount: 'Borrowed Money', date: '2026-11-14'
    })
    expect(draft.missingRequired).toEqual([])
    expect(draft.payload).toMatchObject({ grossIncome: -150000, interest: 5000, paymentFrequency: 'Monthly', periodCount: 12, linkedBorrowingId: null })
    // Computed values are on the card only, never in the saved payload (ADR-0004).
    expect(draft.payload).not.toHaveProperty('totalOwed')
    expect(draft.payload).not.toHaveProperty('suggestedPayment')
    const full = draft as unknown as { computedPreview: Record<string, number>; display: { note: string } }
    expect(full.computedPreview).toMatchObject({ totalOwed: 155000, suggestedPayment: 12916.67, remainingBalance: 155000 })
    expect(full.display.note).toContain('Total owed ₱155,000.00')
    expect(full.display.note).toContain('Suggested payment ₱12,916.67 monthly')
    expect(toCreateIncomeInput(draft.payload)).toMatchObject({ interest: 5000, paymentFrequency: 'Monthly', periodCount: 12 })
  })

  it('borrowing-terms/05#AC2 a repayment naming the loan is drafted and saved linked', () => {
    withRows([loanRow])
    const { draft } = run('proposeCreateBorrowing', {
      type: 'repayment', name: 'Repayment: Ana', amount: 12916.67, loan: 'Borrow: Ana',
      otherAccount: 'Home Wallet', borrowAccount: 'Borrowed Money'
    })
    expect(draft.missingRequired).toEqual([])
    expect(draft.payload).toMatchObject({ linkedBorrowingId: 'loan-1', accountId: 'wallet', transactedAccountId: 'borrow' })
    expect(toCreateIncomeInput(draft.payload)).toMatchObject({ linkedBorrowingId: 'loan-1' })
    const full = draft as unknown as { computedPreview: Record<string, number> }
    expect(full.computedPreview).toMatchObject({ remainingBalanceBefore: 155000, remainingBalance: 142083.33 })
    // Card edits keep the link; an unknown loan blocks the draft instead of saving unlinked.
    expect(editDraftFields(draft.id, { amount: 5000 }).payload).toMatchObject({ linkedBorrowingId: 'loan-1' })
    const bad = run('proposeCreateBorrowing', { type: 'repayment', name: 'x', amount: 5, loan: 'Nope', otherAccount: 'Home Wallet', borrowAccount: 'Borrowed Money' })
    expect(bad.draft.missingRequired.join(' ')).toMatch(/Loan/)
    // Without naming a loan the repayment stays valid but unlinked, with a warning.
    const unlinked = run('proposeCreateBorrowing', { type: 'repayment', name: 'x', amount: 5, otherAccount: 'Home Wallet', borrowAccount: 'Borrowed Money' })
    expect(unlinked.draft.missingRequired).toEqual([])
    expect(unlinked.draft.payload.linkedBorrowingId).toBeNull()
  })

  it('borrowing-terms/05#AC3 the remaining balance read matches the shared math the screen uses', () => {
    const rows = [loanRow, repayment('r1', 12916.67, 'loan-1'), repayment('r2', 5000, 'loan-1', true), repayment('r3', 700, null)]
    withRows(rows)
    const screen = computeLoanSummary(loanRow as never, rows as never)
    expect(screen.remainingBalance).toBe(142083.33)
    expect(executeChatTool('getLoanSummary', JSON.stringify({ loan: 'Borrow: Ana' }), ctx)).toMatchObject({
      found: true,
      loan: { id: 'loan-1', totalOwed: 155000, suggestedPayment: 12916.67, paidAmount: 12916.67, paymentsMade: 1, remainingBalance: screen.remainingBalance }
    })
    const summary = executeChatTool('getBorrowingsSummary', '{}', ctx) as { loans: Array<{ remainingBalance: number }> }
    expect(summary.loans[0].remainingBalance).toBe(screen.remainingBalance)
    // Account still-owed counts unpaid interest: mocked balance-owed 1000 → 1000 + 12,916.67 paid − 150,000 principal + 142,083.33 remaining = 6,000.
    expect(executeChatTool('getBorrowingsSummary', '{}', ctx)).toMatchObject({ borrowAccounts: [{ id: 'borrow', stillOwed: 6000 }, { id: 'loan', stillOwed: 0 }] })
  })

  it('borrowing-terms/05#AC4 a draft with only part of the terms asks for the rest instead of saving', () => {
    withRows([])
    const base = { type: 'borrowed', name: 'Borrow: Ana', amount: 150000, interest: 5000, otherAccount: 'Home Wallet', borrowAccount: 'Borrowed Money' }
    const noPeriod = run('proposeCreateBorrowing', { ...base, paymentFrequency: 'Monthly' })
    expect(noPeriod.draft.status).toBe('needs_input')
    expect(noPeriod.draft.missingRequired.join(' ')).toMatch(/Period count/)
    // Completing the pair on the card unlocks the draft (a newer draft supersedes it, so edit first).
    expect(editDraftFields(noPeriod.draft.id, { periodCount: 12 }).missingRequired).toEqual([])
    const noFreq = run('proposeCreateBorrowing', { ...base, periodCount: 12 })
    expect(noFreq.draft.status).toBe('needs_input')
    expect(noFreq.draft.missingRequired.join(' ')).toMatch(/Payment Frequency/)
    const badPeriod = run('proposeCreateBorrowing', { ...base, paymentFrequency: 'Monthly', periodCount: 0 })
    expect(badPeriod.draft.missingRequired.join(' ')).toMatch(/Period count/)
    // Interest alone was always allowed.
    expect(run('proposeCreateBorrowing', base).draft.missingRequired).toEqual([])
  })

  it('borrowing-terms/07#AC6 a repayment can name a loan that has no terms and is linked to it', () => {
    const plainLoan = { ...loanRow, id: 'plain-1', name: 'Borrow: Ben', grossIncome: -1000, interest: null, paymentFrequency: null, periodCount: null }
    withRows([plainLoan])
    const { draft } = run('proposeCreateBorrowing', {
      type: 'repayment', name: 'Repayment: Ben', amount: 400, loan: 'Borrow: Ben',
      otherAccount: 'Home Wallet', borrowAccount: 'Borrowed Money'
    })
    expect(draft.missingRequired).toEqual([])
    expect(draft.payload).toMatchObject({ linkedBorrowingId: 'plain-1' })
    const full = draft as unknown as { computedPreview: Record<string, number> }
    expect(full.computedPreview).toMatchObject({ remainingBalanceBefore: 1000, remainingBalance: 600, suggestedPayment: null })
    // Once it has a linked repayment it is read as a loan with Interest 0.
    withRows([plainLoan, repayment('r1', 400, 'plain-1')])
    expect(executeChatTool('getLoanSummary', JSON.stringify({ loan: 'Borrow: Ben' }), ctx)).toMatchObject({
      found: true, loan: { id: 'plain-1', totalOwed: 1000, paidAmount: 400, paymentsMade: 1, remainingBalance: 600 }
    })
  })
})
