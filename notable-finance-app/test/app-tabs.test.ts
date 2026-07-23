import { describe, expect, it } from 'vitest'
import {
  activeSection,
  createInitialTabsState,
  tabsReducer
} from '../src/renderer/src/lib/app-tabs'

describe('tabsReducer', () => {
  it('starts with one tab', () => {
    const state = createInitialTabsState('dashboard')
    expect(state.tabs).toHaveLength(1)
    expect(activeSection(state)).toBe('dashboard')
  })

  it('navigates only the active tab', () => {
    let state = createInitialTabsState('dashboard')
    state = tabsReducer(state, { type: 'open', section: 'expense' })
    expect(activeSection(state)).toBe('expense')
    state = tabsReducer(state, { type: 'navigate', section: 'income' })
    expect(state.tabs.map((t) => t.section)).toEqual(['dashboard', 'income'])
  })

  it('keeps at least one tab on close', () => {
    const state = createInitialTabsState('settings')
    const next = tabsReducer(state, { type: 'close-active' })
    expect(next.tabs).toHaveLength(1)
    expect(next).toEqual(state)
  })

  it('closes a tab and activates a neighbor', () => {
    let state = createInitialTabsState('dashboard')
    state = tabsReducer(state, { type: 'open', section: 'income' })
    state = tabsReducer(state, { type: 'open', section: 'expense' })
    const closing = state.activeId
    state = tabsReducer(state, { type: 'close', id: closing })
    expect(state.tabs).toHaveLength(2)
    expect(activeSection(state)).toBe('income')
  })

  it('cycles next/prev', () => {
    let state = createInitialTabsState('dashboard')
    state = tabsReducer(state, { type: 'open', section: 'accounts' })
    state = tabsReducer(state, { type: 'open', section: 'sync' })
    state = tabsReducer(state, { type: 'next' })
    expect(activeSection(state)).toBe('dashboard')
    state = tabsReducer(state, { type: 'prev' })
    expect(activeSection(state)).toBe('sync')
  })
})
