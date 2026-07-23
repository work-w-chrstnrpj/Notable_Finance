import { describe, expect, it } from 'vitest'
import {
  buildApproveQuip,
  detectKeywordCheer,
  effectiveOverlayForPrompt,
  formatBudgetGuardAppendix,
  parseSlashOverlay,
  resolveActiveOverlay
} from '../src/main/chat/overlays'
import type { ChatDraftDto } from '../src/shared/finance.types'

function draft(partial: Partial<ChatDraftDto> & Pick<ChatDraftDto, 'resource' | 'action'>): ChatDraftDto {
  return {
    id: 'd1',
    threadId: 't1',
    status: 'ready',
    kind: 'proposeCreateIncome',
    summary: 'test',
    missingRequired: [],
    warnings: [],
    payload: {},
    createdAt: Date.now(),
    ...partial
  }
}

describe('parseSlashOverlay', () => {
  it('strips slash and returns last match', () => {
    expect(parseSlashOverlay('/roast Magkano food?')).toEqual({
      content: 'Magkano food?',
      overlay: 'roast'
    })
    expect(parseSlashOverlay('Hello /cheer /strict')).toEqual({
      content: 'Hello',
      overlay: 'strict'
    })
    expect(parseSlashOverlay('No mode here')).toEqual({
      content: 'No mode here',
      overlay: null
    })
  })
})

describe('resolveActiveOverlay + keyword cheer', () => {
  it('prefers slash, then thread, refuse-delete forces strict', () => {
    expect(
      resolveActiveOverlay({ slashOverlay: 'roast', threadOverlay: 'cheer' })
    ).toBe('roast')
    expect(
      resolveActiveOverlay({ slashOverlay: null, threadOverlay: 'quiet' })
    ).toBe('quiet')
    expect(
      resolveActiveOverlay({
        slashOverlay: 'cheer',
        threadOverlay: 'default',
        forceStrict: true
      })
    ).toBe('strict')
  })

  it('biases default → cheer on dating keywords unless roast/strict/quiet', () => {
    expect(detectKeywordCheer('log expense dating 500')).toBe(true)
    expect(effectiveOverlayForPrompt('default', true)).toBe('cheer')
    expect(effectiveOverlayForPrompt('roast', true)).toBe('roast')
    expect(effectiveOverlayForPrompt('strict', true)).toBe('strict')
  })
})

describe('budget-guard appendix + approve quips', () => {
  it('formats budget guard by overlay', () => {
    const notes = ['Food: spent ₱6,000 vs budget ₱5,000']
    expect(formatBudgetGuardAppendix('quiet', notes)).toContain('Budget:')
    expect(formatBudgetGuardAppendix('roast', notes)).toContain('Magtipid')
    expect(formatBudgetGuardAppendix('default', [])).toBeNull()
  })

  it('builds income celebrate and spend wince quips', () => {
    const bigIncome = draft({
      resource: 'incomes',
      action: 'create',
      payload: { grossIncome: 20_000 }
    })
    expect(buildApproveQuip({ overlay: 'default', draft: bigIncome })).toContain('paldo')

    const bigSpend = draft({
      resource: 'expenses',
      action: 'create',
      payload: { amount: 8_000 }
    })
    expect(buildApproveQuip({ overlay: 'roast', draft: bigSpend })).toMatch(/tipid|gastos/i)

    const quiet = draft({
      resource: 'expenses',
      action: 'create',
      payload: { amount: 100 }
    })
    expect(buildApproveQuip({ overlay: 'quiet', draft: quiet })).toBe('Logged.')
  })
})
