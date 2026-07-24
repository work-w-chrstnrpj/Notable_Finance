import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  APPLE_FORCE_ENV,
  appleEmptyDayAnswer,
  appleReasonUserCopy,
  gatherAppleToolResults,
  invalidateAppleProbeCache,
  isAppleReadOnlySkill,
  probeAppleReadOnly,
  resolveAppleAskDate,
  runAppleReadOnlyTurn,
  shouldUseAppleReadOnly
} from '../src/main/chat/apple'
import { confirmDraft, cancelDraft } from '../src/main/chat/confirm'
import { putDraft, getDraft, listDrafts } from '../src/main/chat/drafts'
import {
  expenseProfileMissingFields,
  resolveExpenseProfile,
  WORKFLOW_LOCKED_CATEGORIES
} from '../src/main/chat/expense-profile'
import { routeChatSkill } from '../src/main/chat/skills/router'
import {
  CHAT_TOOL_DEFINITIONS,
  executeChatTool,
  isChatToolAllowed,
  listAllowedChatToolNames,
  READ_TOOL_DEFINITIONS,
  WRITE_TOOL_DEFINITIONS
} from '../src/main/chat/tools/registry'
import { getExpenseFieldSchema } from '../src/main/chat/tools/read-tools'

vi.mock('../src/main/chat/tools/read-tools', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/main/chat/tools/read-tools')>()
  return {
    ...actual,
    getDashboardSummary: vi.fn(() => ({
      month: '2026-07',
      totalIncome: 1000,
      totalExpense: 400,
      grossMargin: 600
    })),
    getMonthlyMonitoringSnapshot: vi.fn(() => ({
      month: '2026-07',
      monthlyIncome: 1000,
      monthlyExpense: 400,
      grossMargin: 600,
      expenseCategories: [
        { name: 'Electricity Bill', spent: 905 },
        { name: 'Telecommunication & Internet', spent: 2048.89 }
      ]
    })),
    queryExpenses: vi.fn((args: { rangeStart?: string; rangeEnd?: string }) => {
      // Empty day for 2026-07-23; otherwise a tiny fixture for non-empty path tests.
      if (args?.rangeStart === '2026-07-23' || args?.rangeEnd === '2026-07-23') {
        return { count: 0, totalAmount: 0, records: [] }
      }
      return {
        count: 2,
        totalAmount: 250,
        records: [
          { description: 'Coffee', amount: 100 },
          { description: 'Lunch', amount: 150 }
        ]
      }
    }),
    queryIncomes: vi.fn(() => ({ count: 0, totalGrossIncome: 0, records: [] })),
    getCategoryBudgetStatus: vi.fn(() => ({ categoryName: 'Food', remaining: 100 })),
    explainAppTopic: vi.fn(() => ({
      found: true,
      explanation: 'Transfer moves money between accounts.'
    })),
    getExpenseFieldSchema: actual.getExpenseFieldSchema
  }
})

describe('Apple Foundation Models probe', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    invalidateAppleProbeCache()
  })

  it('marks non-darwin as unsupported', async () => {
    const p = await probeAppleReadOnly({ platform: 'win32', env: {} })
    expect(p.status).toBe('unsupported')
    expect(p.available).toBe(false)
    expect(p.osSupported).toBe(false)
    expect(p.reasonCode).toBe('NOT_DARWIN')
  })

  it('does not treat bare Darwin as available without compatibility', async () => {
    const p = await probeAppleReadOnly({
      platform: 'darwin',
      env: {},
      compatibility: { compatible: false, reasonCode: 'AI_DISABLED' }
    })
    expect(p.status).toBe('unavailable')
    expect(p.available).toBe(false)
    expect(p.reasonCode).toBe('AI_DISABLED')
    expect(p.detail.toLowerCase()).toContain('system settings')
  })

  it('marks Available when Foundation Models report compatible', async () => {
    const p = await probeAppleReadOnly({
      platform: 'darwin',
      env: {},
      compatibility: { compatible: true }
    })
    expect(p.status).toBe('available')
    expect(p.available).toBe(true)
    expect(p.mode).toBe('foundation-models')
  })

  it('maps UNSUPPORTED_HARDWARE to unsupported', async () => {
    const p = await probeAppleReadOnly({
      platform: 'darwin',
      env: {},
      compatibility: { compatible: false, reasonCode: 'UNSUPPORTED_HARDWARE' }
    })
    expect(p.status).toBe('unsupported')
    expect(appleReasonUserCopy('UNSUPPORTED_HARDWARE').detail).toMatch(/Apple Silicon/i)
  })

  it('force env skips real probe for CI', async () => {
    const p = await probeAppleReadOnly({
      platform: 'darwin',
      env: { [APPLE_FORCE_ENV]: '1' }
    })
    expect(p.available).toBe(true)
    expect(p.mode).toBe('force')
  })

  it('gates Apple path to read-only skills when prefer is on', () => {
    expect(isAppleReadOnlySkill('ask-data')).toBe(true)
    expect(isAppleReadOnlySkill('log-income')).toBe(false)
    expect(
      shouldUseAppleReadOnly({
        preferApple: true,
        appleAvailable: true,
        skill: 'monitoring-summary'
      })
    ).toBe(true)
    expect(
      shouldUseAppleReadOnly({
        preferApple: true,
        appleAvailable: true,
        skill: 'log-expense'
      })
    ).toBe(false)
    expect(
      shouldUseAppleReadOnly({
        preferApple: false,
        appleAvailable: true,
        skill: 'ask-data'
      })
    ).toBe(false)
  })

  it('read-only turn builds day-only TOOL_RESULTS and never proposes writes', async () => {
    let captured = ''
    const out = await runAppleReadOnlyTurn({
      skill: 'ask-data',
      userText: 'expense for today?',
      selectedDate: '2026-07-22',
      env: {},
      respond: async (params) => {
        captured = params.input
        return { ok: true, text: 'You spent ₱250 today across 2 expenses.', request_id: 't1' }
      }
    })
    expect(out.provider).toBe('apple-readonly')
    expect(out.text).toContain('₱250')
    expect(captured).toContain('TOOL_RESULTS')
    expect(captured).toContain('queryExpensesForDay')
    expect(captured).not.toContain('getDashboardSummary')
    expect(captured).not.toContain('getMonthlyMonitoringSnapshot')
    expect(captured).toContain('USER QUESTION: expense for today?')
    expect(captured.toLowerCase()).not.toContain('propose')
  })

  it('empty day expenses answer without calling Foundation Models', async () => {
    let called = false
    const tools = gatherAppleToolResults('ask-data', 'What are my expenses for today?', {
      selectedDate: '2026-07-23'
    })
    expect(tools.getDashboardSummary).toBeUndefined()
    expect(tools.getMonthlyMonitoringSnapshot).toBeUndefined()
    expect(appleEmptyDayAnswer(tools)).toMatch(/No expenses on 2026-07-23/)
    expect(resolveAppleAskDate('expenses for today?', '2026-07-23')).toEqual({
      date: '2026-07-23',
      source: 'workspace-selected-date'
    })

    const out = await runAppleReadOnlyTurn({
      skill: 'ask-data',
      userText: 'What are my expenses for today?',
      selectedDate: '2026-07-23',
      env: {},
      respond: async () => {
        called = true
        return { ok: true, text: 'hallucinated category list', request_id: 'x' }
      }
    })
    expect(called).toBe(false)
    expect(out.text).toMatch(/No expenses on 2026-07-23/)
    expect(out.text).not.toMatch(/Electricity Bill|Telecommunication/)
  })

  it('force mode uses tool fallback without old Quick snapshot spam title', async () => {
    const out = await runAppleReadOnlyTurn({
      skill: 'ask-data',
      userText: 'how much did I spend?',
      env: { [APPLE_FORCE_ENV]: '1' }
    })
    expect(out.text).not.toMatch(/Quick snapshot —/)
    expect(out.text).toMatch(/force mode/i)
    expect(out.provider).toBe('apple-readonly')
  })
})

describe('tool allowlist parity (6.6)', () => {
  it('CHAT_TOOL_DEFINITIONS equals read + write and has no delete tools', () => {
    const names = listAllowedChatToolNames()
    expect(names).toEqual(
      [...READ_TOOL_DEFINITIONS, ...WRITE_TOOL_DEFINITIONS]
        .map((t) => t.function.name)
        .sort()
    )
    expect(names.some((n) => /delete/i.test(n))).toBe(false)
    expect(names).toContain('proposeCreateIncome')
    expect(names).toContain('getMonthlyMonitoringSnapshot')
    expect(isChatToolAllowed('softDeleteExpense')).toBe(false)
    expect(executeChatTool('hardDeleteIncome', '{}', { threadId: 't' })).toEqual({
      error: 'Forbidden tool — finance delete tools are not available in Chat.'
    })
    expect(CHAT_TOOL_DEFINITIONS.length).toBe(names.length)
  })
})

describe('confirm / clarify gates (6.6)', () => {
  it('rejects incomplete drafts and cancels without writing', () => {
    const draft = putDraft({
      threadId: 'thread-gate',
      resource: 'expenses',
      action: 'create',
      kind: 'proposeCreateExpense',
      summary: 'incomplete',
      missingRequired: ['Account', 'Pasabuyer'],
      warnings: [],
      payload: { description: 'x', amount: 100 }
    })
    expect(draft.status).toBe('needs_input')
    expect(() => confirmDraft(draft.id)).toThrow(/incomplete|Missing/i)

    const cancelled = cancelDraft(draft.id)
    expect(cancelled.status).toBe('cancelled')
    expect(getDraft(draft.id)?.status).toBe('cancelled')
    expect(listDrafts('thread-gate').some((d) => d.id === draft.id)).toBe(false)
  })

  it('blocks Approve when draft is ready but no BYOK credentials (Apple-only gate)', () => {
    const draft = putDraft({
      threadId: 'thread-apple-only',
      resource: 'incomes',
      action: 'create',
      kind: 'proposeCreateIncome',
      summary: 'ready',
      missingRequired: [],
      warnings: [],
      payload: {
        name: 'Salary',
        date: '2026-07-01',
        grossIncome: 1000,
        accountId: 'a1',
        categoryId: 'c1'
      }
    })
    expect(draft.status).toBe('ready')
    expect(() => confirmDraft(draft.id)).toThrow(/API credential for writes/i)
  })
})

describe('expense profiles + workflow locks (6.6)', () => {
  it('resolves CC vs Pasabuy vs base profiles', () => {
    expect(
      resolveExpenseProfile({ accountType: 'Cash', categoryName: 'Food' })
    ).toEqual({ creditCard: false, pasabuy: false })
    expect(
      resolveExpenseProfile({ accountType: 'Credit Account', categoryName: 'Food' })
    ).toEqual({ creditCard: true, pasabuy: false })
    expect(
      resolveExpenseProfile({ accountType: 'Cash', categoryName: 'Pasabuy' })
    ).toEqual({ creditCard: false, pasabuy: true })
    expect(
      resolveExpenseProfile({
        accountType: 'Cash',
        categoryName: 'Food',
        viewMode: 'Unpaid Pasabuy'
      })
    ).toEqual({ creditCard: false, pasabuy: true })
  })

  it('lists missing CC and Pasabuy fields', () => {
    expect(
      expenseProfileMissingFields({
        creditCard: true,
        pasabuy: false,
        hasDescription: true,
        hasPurchaseDate: true,
        hasAmount: true,
        hasAccount: true,
        hasCategory: true
      })
    ).toContain('Payment Status')

    expect(
      expenseProfileMissingFields({
        creditCard: false,
        pasabuy: true,
        hasDescription: true,
        hasPurchaseDate: true,
        hasAmount: true,
        hasAccount: true,
        hasCategory: true
      })
    ).toEqual(expect.arrayContaining(['Pasabuyer', 'Pasabuy Status']))
  })

  it('getExpenseFieldSchema works with accountType hint (no DB)', () => {
    const base = getExpenseFieldSchema({
      accountType: 'Cash',
      categoryName: 'Food'
    }) as { profile: { creditCard: boolean; pasabuy: boolean } }
    expect(base.profile).toEqual({ base: true, creditCard: false, pasabuy: false })

    const cc = getExpenseFieldSchema({
      accountType: 'BNPL',
      categoryName: 'Shopping'
    }) as { requiredCreditCard: string[] }
    expect(cc.requiredCreditCard.length).toBeGreaterThan(0)

    const pb = getExpenseFieldSchema({
      accountType: 'Cash',
      categoryName: 'Pasabuy Stuff'
    }) as { requiredPasabuy: string[] }
    expect(pb.requiredPasabuy).toEqual(['Pasabuyer', 'Pasabuy Status'])
  })

  it('exports locked workflow category labels', () => {
    expect(WORKFLOW_LOCKED_CATEGORIES.transfer).toBe('Transfer')
    expect(WORKFLOW_LOCKED_CATEGORIES.ccPayment).toBe('Credit Card Payment')
  })
})

describe('refuse-delete routing (6.6)', () => {
  it('routes Taglish and English finance delete intents', () => {
    expect(routeChatSkill('burahin yung expense kahapon')).toBe('refuse-delete')
    expect(routeChatSkill('tanggalin ang income record')).toBe('refuse-delete')
    expect(routeChatSkill('hard delete this expense')).toBe('refuse-delete')
    expect(routeChatSkill('delete chat history')).not.toBe('refuse-delete')
  })
})

describe('write-intent routing — English + Taglish (6.8)', () => {
  it('routes Taglish "make me a new income" phrasing to log-income', () => {
    expect(
      routeChatSkill(
        'gawa mo naman ako ng bagong income, lagay mo: sahod, salary category, 100 pesos, home wallet, date is today'
      )
    ).toBe('log-income')
    expect(routeChatSkill('add income salary 5000 today GCash')).toBe('log-income')
    expect(routeChatSkill('ilagay mo ang sahod ko 20000')).toBe('log-income')
  })

  it('routes Taglish/English expense logging to log-expense', () => {
    expect(routeChatSkill('lagay mo expense 300 food kahapon')).toBe('log-expense')
    expect(routeChatSkill('gawa ng expense, 200, groceries')).toBe('log-expense')
    expect(routeChatSkill('gumastos ako 150 pagkain')).toBe('log-expense')
    expect(routeChatSkill('Log expense, 300 pesos, dating, yesterday')).toBe('log-expense')
  })

  it('routes Taglish transfer / cc-payment workflows', () => {
    expect(routeChatSkill('ilipat 1000 galing GCash papunta Maya')).toBe('workflow-transfer')
    expect(routeChatSkill('transfer 1000 from GCash to Maya today')).toBe('workflow-transfer')
    expect(routeChatSkill('bayaran ang credit card 5000 galing GCash')).toBe('workflow-cc-payment')
  })

  it('keeps read questions on the ask-data path (no false write drafts)', () => {
    expect(routeChatSkill('magkano gastos ko this month')).toBe('ask-data')
    expect(routeChatSkill('how much income did I get in July')).toBe('ask-data')
    expect(routeChatSkill("what's my expense summary")).toBe('ask-data')
  })
})
