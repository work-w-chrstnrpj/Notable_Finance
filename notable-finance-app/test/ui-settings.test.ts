import { describe, expect, it } from 'vitest'
import { normalizeUiSettings, DEFAULT_UI_SETTINGS } from '../src/main/settings/ui'

describe('normalizeUiSettings', () => {
  it('returns defaults for empty input', () => {
    expect(normalizeUiSettings({})).toEqual(DEFAULT_UI_SETTINGS)
  })

  it('merges profile and hard-delete flag', () => {
    const next = normalizeUiSettings({
      hardDeleteEnabled: true,
      profile: { displayName: 'Chris', avatarDataUrl: null }
    })
    expect(next.hardDeleteEnabled).toBe(true)
    expect(next.chatEnabled).toBe(false)
    expect(next.profile.displayName).toBe('Chris')
    expect(next.workspace.incomeViewMode).toBe('Monthly')
  })

  it('accepts chat feature flags and default model', () => {
    const next = normalizeUiSettings({
      chatEnabled: true,
      chatPreferAppleReadOnly: true,
      chatDefaultModel: 'gpt-4o'
    })
    expect(next.chatEnabled).toBe(true)
    expect(next.chatPreferAppleReadOnly).toBe(true)
    expect(next.chatDefaultModel).toBe('gpt-4o')
    expect(next.devModeEnabled).toBe(false)
  })

  it('accepts Dev Mode flag', () => {
    expect(normalizeUiSettings({ devModeEnabled: true }).devModeEnabled).toBe(true)
    expect(DEFAULT_UI_SETTINGS.devModeEnabled).toBe(false)
  })

  it('rejects non-image avatar payloads', () => {
    const next = normalizeUiSettings({
      profile: { displayName: 'A', avatarDataUrl: 'not-an-image' }
    })
    expect(next.profile.avatarDataUrl).toBeNull()
  })

  it('keeps valid income view modes and filters', () => {
    const next = normalizeUiSettings({
      workspace: { incomeViewMode: 'Weekly', selectedDate: '2026-01-15' },
      incomeFilters: { accountId: 'acc-1', filterActive: true, groupBy: 'category' }
    })
    expect(next.workspace.incomeViewMode).toBe('Weekly')
    expect(next.workspace.selectedDate).toBe('2026-01-15')
    expect(next.incomeFilters.accountId).toBe('acc-1')
    expect(next.incomeFilters.groupBy).toBe('category')
  })
})
