// calendar-periods/01#AC6: saved view modes accept Quarterly and Semi-Annually and fall back to Monthly.
import { describe, expect, it } from 'vitest'
import { normalizeUiSettings } from '../src/main/settings/ui'

const workspace = (patch: Record<string, unknown>) =>
  normalizeUiSettings({ workspace: patch }).workspace

describe('calendar-periods/01 saved view modes', () => {
  it('calendar-periods/01#AC6 Income, workflow, CC and Pasabuy periods accept Quarterly and Semi-Annually', () => {
    for (const mode of ['Quarterly', 'Semi-Annually'] as const) {
      const w = workspace({ incomeViewMode: mode, workflowViewMode: mode, ccPeriod: mode, pasabuyPeriod: mode })
      expect(w.incomeViewMode).toBe(mode)
      expect(w.workflowViewMode).toBe(mode)
      expect(w.ccPeriod).toBe(mode)
      expect(w.pasabuyPeriod).toBe(mode)
    }
  })

  it('calendar-periods/01#AC6 Expense accepts the two new modes and keeps All Records and its extra views', () => {
    for (const mode of ['Quarterly', 'Semi-Annually', 'All Records', 'Pasabuy', 'To pay', 'Installments'] as const) {
      expect(workspace({ expenseViewMode: mode }).expenseViewMode).toBe(mode)
    }
  })

  it('calendar-periods/01#AC6 an unknown stored value falls back to Monthly (All Records for the Pasabuy period)', () => {
    const w = workspace({ incomeViewMode: 'Fortnightly', workflowViewMode: 'Q9', expenseViewMode: 'Biweekly', ccPeriod: 'x', pasabuyPeriod: 'y' })
    expect(w.incomeViewMode).toBe('Monthly')
    expect(w.workflowViewMode).toBe('Monthly')
    expect(w.expenseViewMode).toBe('Monthly')
    expect(w.ccPeriod).toBe('Monthly')
    expect(w.pasabuyPeriod).toBe('All Records')
  })

  it('calendar-periods/01#AC6 modes that were already valid still load unchanged', () => {
    const w = workspace({ incomeViewMode: 'Annually', expenseViewMode: 'Daily', workflowViewMode: 'Weekly' })
    expect([w.incomeViewMode, w.expenseViewMode, w.workflowViewMode]).toEqual(['Annually', 'Daily', 'Weekly'])
  })
})
