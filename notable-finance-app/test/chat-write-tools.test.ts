import { describe, expect, it } from 'vitest'
import { resolveDate } from '../src/main/chat/dates'
import { routeChatSkill } from '../src/main/chat/skills/router'
import {
  CHAT_TOOL_DEFINITIONS,
  executeChatTool,
  WRITE_TOOL_DEFINITIONS
} from '../src/main/chat/tools/registry'
import { MASS_EDIT_CAP } from '../src/main/chat/tools/write-tools'
import { putDraft, getDraft, listDrafts } from '../src/main/chat/drafts'
import { cancelDraft } from '../src/main/chat/confirm'

describe('routeChatSkill write intents', () => {
  it('routes log/workflow skills', () => {
    expect(routeChatSkill('add income, svi salary, 20000, today')).toBe('log-income')
    expect(routeChatSkill('Log expense, 300 pesos, dating, yesterday')).toBe('log-expense')
    expect(routeChatSkill('Transfer 1000 from GCash to Maya today')).toBe('workflow-transfer')
    expect(routeChatSkill('Pay 10k to BPI CC from Maya')).toBe('workflow-cc-payment')
    expect(routeChatSkill('Alkansya 2k today')).toBe('workflow-alkansya')
    expect(routeChatSkill('Receivable 5k utang sa akin')).toBe('workflow-receivables')
    expect(routeChatSkill('Update expense mark as paid')).toBe('edit-record')
    expect(routeChatSkill("Delete yesterday's food expense")).toBe('refuse-delete')
  })
})

describe('resolveDate', () => {
  const now = new Date('2026-07-15T12:00:00Z')
  it('resolves today/yesterday', () => {
    expect(resolveDate('today', now)).toBe('2026-07-15')
    expect(resolveDate('yesterday', now)).toBe('2026-07-14')
    expect(resolveDate('2026-01-02', now)).toBe('2026-01-02')
  })
})

describe('write tool allowlist', () => {
  it('includes propose tools and excludes delete', () => {
    const names = CHAT_TOOL_DEFINITIONS.map((t) => t.function.name)
    expect(names).toContain('proposeCreateIncome')
    expect(names).toContain('proposeCreateTransfer')
    expect(names).toContain('proposeCreateExpense')
    expect(WRITE_TOOL_DEFINITIONS.length).toBeGreaterThan(5)
    expect(names.some((n) => /delete/i.test(n))).toBe(false)
  })

  it('rejects delete tool names', () => {
    expect(executeChatTool('softDeleteIncome', '{}', { threadId: 't1' })).toEqual({
      error: 'Forbidden tool — finance delete tools are not available in Chat.'
    })
  })
})

describe('draft store + cancel', () => {
  it('stores needs_input drafts and cancels without writing', () => {
    const draft = putDraft({
      threadId: 'thread-a',
      resource: 'incomes',
      action: 'create',
      kind: 'proposeCreateIncome',
      summary: 'test',
      missingRequired: ['Account'],
      warnings: [],
      payload: { name: 'x' }
    })
    expect(draft.status).toBe('needs_input')
    expect(listDrafts('thread-a').some((d) => d.id === draft.id)).toBe(true)
    const cancelled = cancelDraft(draft.id)
    expect(cancelled.status).toBe('cancelled')
    expect(cancelled.quip).toBeTruthy()
    expect(getDraft(draft.id)?.status).toBe('cancelled')
    expect(listDrafts('thread-a').some((d) => d.id === draft.id)).toBe(false)
  })

  it('exports mass edit cap of 50', () => {
    expect(MASS_EDIT_CAP).toBe(50)
  })

  it('supersedes earlier pending drafts of the same kind in a thread', () => {
    const base = {
      threadId: 'thread-supersede',
      resource: 'expenses' as const,
      action: 'create' as const,
      kind: 'proposeCreateExpense',
      warnings: [],
      missingRequired: []
    }
    const first = putDraft({ ...base, summary: 'first', payload: { amount: 1 } })
    const second = putDraft({ ...base, summary: 'second', payload: { amount: 2 } })
    const third = putDraft({ ...base, summary: 'third', payload: { amount: 3 } })

    // Only the newest stays pending — no pile of stale confirm cards.
    const pending = listDrafts('thread-supersede')
    expect(pending).toHaveLength(1)
    expect(pending[0]!.id).toBe(third.id)
    expect(getDraft(first.id)?.status).toBe('cancelled')
    expect(getDraft(second.id)?.status).toBe('cancelled')
  })

  it('round-trips the display block through putDraft', () => {
    const draft = putDraft({
      threadId: 'thread-display',
      resource: 'expenses',
      action: 'create',
      kind: 'proposeCreateExpense',
      summary: 'Create expense: spaghetti · ₱1',
      missingRequired: [],
      warnings: [],
      payload: { amount: 1 },
      display: {
        title: 'spaghetti',
        amount: 1,
        currency: 'PHP',
        date: '2026-07-24',
        from: 'Home Wallet',
        fromLabel: 'Account',
        to: 'Food',
        toLabel: 'Category'
      }
    })
    expect(draft.display?.title).toBe('spaghetti')
    expect(getDraft(draft.id)?.display?.from).toBe('Home Wallet')
    expect(getDraft(draft.id)?.display?.amount).toBe(1)
  })

  it('does not supersede a different kind or a different thread', () => {
    const income = putDraft({
      threadId: 'thread-mixed',
      resource: 'incomes',
      action: 'create',
      kind: 'proposeCreateIncome',
      summary: 'income',
      missingRequired: [],
      warnings: [],
      payload: {}
    })
    const expense = putDraft({
      threadId: 'thread-mixed',
      resource: 'expenses',
      action: 'create',
      kind: 'proposeCreateExpense',
      summary: 'expense',
      missingRequired: [],
      warnings: [],
      payload: {}
    })
    expect(getDraft(income.id)?.status).toBe('ready')
    expect(listDrafts('thread-mixed').map((d) => d.id).sort()).toEqual(
      [income.id, expense.id].sort()
    )
  })
})
