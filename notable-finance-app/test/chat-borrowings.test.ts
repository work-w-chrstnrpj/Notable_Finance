import { describe, expect, it, vi } from 'vitest'
import { routeChatSkill } from '../src/main/chat/skills/router'
import { executeChatTool, isChatToolAllowed } from '../src/main/chat/tools/registry'
import { editDraftFields } from '../src/main/chat/tools/write-tools'
import { toCreateIncomeInput } from '../src/main/chat/tools/write-tools'

vi.mock('../src/main/db/repositories', async (importOriginal) => ({
  ...await importOriginal<typeof import('../src/main/db/repositories')>(),
  listAccounts: () => [
    { id: 'wallet', name: 'Home Wallet', type: 'Cash', currentBalance: 500 },
    { id: 'card', name: 'Card', type: 'Credit Account', currentBalance: 0 },
    { id: 'borrow', name: 'Borrowed Money', type: 'Auxiliary', currentBalance: -1000 },
    { id: 'rewards', name: 'Auxiliary & Rewards', type: 'Auxiliary', currentBalance: 0 },
    { id: 'loan', name: 'Debt/Loan', type: 'Auxiliary', currentBalance: 0 }
  ],
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
