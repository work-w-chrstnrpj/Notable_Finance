// page-controls/01#AC4: hidden controls are saved per page; older settings and unknown values load as everything shown.
import { describe, expect, it } from 'vitest'
import { normalizeUiSettings } from '../src/main/settings/ui'

describe('page-controls/01 saved state', () => {
  it('page-controls/01#AC4 settings saved before the field existed load as everything shown', () => {
    expect(normalizeUiSettings({}).pageControls).toEqual({})
    expect(normalizeUiSettings({ incomeFilters: { filterActive: true } }).pageControls).toEqual({})
  })

  it('page-controls/01#AC4 hidden controls round trip per page', () => {
    const saved = normalizeUiSettings({
      pageControls: { income: { periodHidden: true, viewsHidden: false }, accounts: { periodHidden: false, viewsHidden: true } }
    })
    expect(saved.pageControls).toEqual({
      income: { periodHidden: true, viewsHidden: false },
      accounts: { periodHidden: false, viewsHidden: true }
    })
    // normalizing what was saved again changes nothing
    expect(normalizeUiSettings(saved).pageControls).toEqual(saved.pageControls)
  })

  it('page-controls/01#AC4 anything that is not exactly true counts as shown, and bad shapes are ignored', () => {
    const saved = normalizeUiSettings({
      pageControls: { income: { periodHidden: 'yes', viewsHidden: 1 }, expense: 'hidden', monitoring: null, accounts: { periodHidden: true } }
    })
    expect(saved.pageControls).toEqual({ accounts: { periodHidden: true, viewsHidden: false } })
    expect(normalizeUiSettings({ pageControls: ['income'] }).pageControls).toEqual({})
    expect(normalizeUiSettings({ pageControls: 'x' }).pageControls).toEqual({})
  })
})
