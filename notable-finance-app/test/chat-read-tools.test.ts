import { describe, expect, it } from 'vitest'
import { currentMonth, resolveMonth, shiftMonth } from '../src/main/chat/dates'
import { routeChatSkill } from '../src/main/chat/skills/router'
import { executeReadTool, READ_TOOL_DEFINITIONS } from '../src/main/chat/tools/registry'
import { explainAppTopic, validateRebudgetAdjustments } from '../src/main/chat/tools/read-tools'

describe('resolveMonth', () => {
  const now = new Date('2026-07-15T12:00:00Z')

  it('parses YYYY-MM and relative phrases', () => {
    expect(resolveMonth('2026-03', now)).toBe('2026-03')
    expect(resolveMonth('this month', now)).toBe('2026-07')
    expect(resolveMonth('last month', now)).toBe('2026-06')
    expect(resolveMonth('July 2026', now)).toBe('2026-07')
  })

  it('shifts months across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12')
    expect(currentMonth(now)).toBe('2026-07')
  })
})

describe('routeChatSkill', () => {
  it('routes monitoring, rebudget, ask-app, refuse-delete, ask-data', () => {
    expect(routeChatSkill('Give me the monitoring summary for July 2026')).toBe(
      'monitoring-summary'
    )
    expect(routeChatSkill('Rebudget this month, same total, less Food more Transport')).toBe(
      'rebudget'
    )
    expect(routeChatSkill('How does Transfer work?')).toBe('ask-app')
    expect(routeChatSkill("Delete yesterday's food expense")).toBe('refuse-delete')
    expect(routeChatSkill("What's left in Food this month?")).toBe('ask-data')
  })
})

describe('read tool allowlist', () => {
  it('exports only read tool names', () => {
    const names = READ_TOOL_DEFINITIONS.map((t) => t.function.name)
    expect(names).toContain('getMonthlyMonitoringSnapshot')
    expect(names).toContain('queryExpenses')
    expect(names).toContain('planRebudget')
    expect(names.some((n) => /delete|propose/i.test(n))).toBe(false)
  })

  it('rejects unknown / forbidden tool names', () => {
    expect(executeReadTool('softDeleteIncome', '{}')).toEqual({
      error: 'Forbidden tool — finance delete tools are not available in Chat.'
    })
    expect(executeReadTool('notARealTool', '{}')).toEqual({
      error: 'Unknown or disallowed tool: notARealTool'
    })
  })

  it('explains app topics without DB', () => {
    const res = explainAppTopic({ topic: 'Transfer' }) as { found: boolean }
    expect(res.found).toBe(true)
  })
})

describe('validateRebudgetAdjustments', () => {
  it('requires deltas to sum to zero', () => {
    expect(
      validateRebudgetAdjustments([
        { categoryName: 'Food', delta: -2000 },
        { categoryName: 'Transport', delta: 2000 }
      ]).ok
    ).toBe(true)
    const bad = validateRebudgetAdjustments([{ categoryName: 'Food', delta: -100 }])
    expect(bad.ok).toBe(false)
  })
})
