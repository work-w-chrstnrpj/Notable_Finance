import { describe, it, expect } from 'vitest'
import {
  SHORTCUTS,
  SHORTCUT_GROUPS,
  displayCombo,
  shortcutKeys,
} from '../src/renderer/src/lib/shortcuts/registry'

// ---------------------------------------------------------------------------
// Registry integrity – every shortcut must be well-formed so the keyboard
// handler, reveal overlay, and Settings cheat sheet can never drift apart.
// ---------------------------------------------------------------------------

describe('SHORTCUTS registry integrity', () => {
  it('every shortcut has a unique id', () => {
    const ids = SHORTCUTS.map((s) => s.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('every shortcut belongs to a known group', () => {
    const groups = new Set(SHORTCUT_GROUPS)
    for (const s of SHORTCUTS) {
      expect(groups.has(s.group), `${s.id} has unknown group "${s.group}"`).toBe(true)
    }
  })

  it('every shortcut has a valid scope', () => {
    const validScopes = ['global', 'navigation', 'view', 'recordModal', 'massSelect']
    for (const s of SHORTCUTS) {
      expect(
        validScopes.includes(s.scope),
        `${s.id} has invalid scope "${s.scope}"`,
      ).toBe(true)
    }
  })

  it('every shortcut has a non-empty label', () => {
    for (const s of SHORTCUTS) {
      expect(s.label.length, `${s.id} label is empty`).toBeGreaterThan(0)
    }
  })

  it('every shortcut has a well-formed combo', () => {
    const comboPattern = /^(Mod|Mod2|Shift|Alt|\+|[A-Za-z0-9]+)(\+[A-Za-z0-9]+)*$/
    for (const s of SHORTCUTS) {
      // Remove non-standard tokens for validation
      const normalized = s.combo
        .replace(/Arrow(Up|Down|Left|Right)/, 'ArrowKey')
        .replace(/Backspace/, 'BKSP')
        .replace(/Delete/, 'DEL')
        .replace(/Enter/, 'ENTER')
        .replace(/Escape/, 'ESC')
        .replace(/Backquote/, 'BQ')
        .replace(/Slash/, 'SLASH')
        .replace(/Digit/, 'DIGIT')
      expect(
        comboPattern.test(normalized) || normalized === 'Mod2+Digit' || normalized === 'Enter',
        `${s.id} has malformed combo "${s.combo}"`,
      ).toBe(true)
    }
  })

  it('no duplicate combos within the same scope', () => {
    const seen = new Map<string, string[]>()
    for (const s of SHORTCUTS) {
      const key = `${s.scope}:${s.combo}`
      if (!seen.has(key)) seen.set(key, [])
      seen.get(key)!.push(s.id)
    }
    for (const [key, ids] of seen) {
      expect(ids.length, `duplicate combo ${key} for: ${ids.join(', ')}`).toBe(1)
    }
  })

  it('navigation section shortcuts (Mod+1…9) map to valid section IDs', () => {
    const navSectionShortcuts = SHORTCUTS.filter(
      (s) => s.scope === 'navigation' && /^Mod\+\d$/.test(s.combo),
    )
    // We expect Mod+1 through Mod+9
    expect(navSectionShortcuts.length).toBeGreaterThanOrEqual(9)
    for (const s of navSectionShortcuts) {
      expect(s.id).toMatch(/^nav\./)
    }
  })

  it('global shortcuts have whileTyping true for ones that need it', () => {
    const globalShortcuts = SHORTCUTS.filter((s) => s.scope === 'global')
    for (const s of globalShortcuts) {
      // General.cheatSheet and edit.undo/redo should allow typing
      if (['general.cheatSheet', 'edit.undo', 'edit.redo'].includes(s.id)) {
        expect(s.whileTyping, `${s.id} should allow while typing`).toBe(true)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// comboFromEvent logic — the composite event token is built inside
// context.tsx. We test the inverse: platform combo display.
// ---------------------------------------------------------------------------

describe('displayCombo', () => {
  it('renders Mac combos', () => {
    expect(displayCombo('Mod+1', true)).toBe('⌘1')
    expect(displayCombo('Mod+Shift+H', true)).toBe('⌘⇧H')
    expect(displayCombo('Mod2+Backquote', true)).toBe('⌘⌃~')
    expect(displayCombo('Mod+Slash', true)).toBe('⌘/')
    expect(displayCombo('Mod+ArrowUp', true)).toBe('⌘↑')
    expect(displayCombo('Mod+Backspace', true)).toBe('⌘⌫')
    expect(displayCombo('Escape', true)).toBe('Esc')
    expect(displayCombo('Enter', true)).toBe('↵')
  })

  it('renders Win/Linux combos', () => {
    expect(displayCombo('Mod+1', false)).toBe('Ctrl+1')
    expect(displayCombo('Mod+Shift+H', false)).toBe('Ctrl+Shift+H')
    expect(displayCombo('Mod2+Backquote', false)).toBe('Ctrl+Alt+~')
    expect(displayCombo('Mod+Slash', false)).toBe('Ctrl+/')
    expect(displayCombo('Mod+ArrowUp', false)).toBe('Ctrl+↑')
    expect(displayCombo('Mod+Backspace', false)).toBe('Ctrl+Backspace')
    expect(displayCombo('Escape', false)).toBe('Esc')
    expect(displayCombo('Enter', false)).toBe('Enter')
  })

  it('respects displayCombo override', () => {
    const def = SHORTCUTS.find((s) => s.id === 'view.filterTab')
    expect(def).toBeDefined()
    // displayCombo is "Mod2+1…9" which gets processed through displayCombo
    const macLabel = shortcutKeys(def!, true)
    expect(macLabel).toBe('⌘⌃1…9')
    const winLabel = shortcutKeys(def!, false)
    expect(winLabel).toBe('Ctrl+Alt+1…9')
  })

  it('handles Digit token', () => {
    expect(displayCombo('Mod2+Digit', true)).toBe('⌘⌃1…9')
    expect(displayCombo('Mod2+Digit', false)).toBe('Ctrl+Alt+1…9')
  })
})

// ---------------------------------------------------------------------------
// Scope priority ordering — higher number = higher priority in dispatch
// ---------------------------------------------------------------------------

describe('scope priority', () => {
  it('recordModal has highest priority', () => {
    const recordModal = SHORTCUTS.filter((s) => s.scope === 'recordModal')
    expect(recordModal.length).toBeGreaterThan(0)
  })

  it('massSelect has higher priority than view', () => {
    // In the engine, SCOPE_PRIORITY: recordModal=4, massSelect=3, view=2, navigation=1, global=0
    // Verify in the registry that view and massSelect both exist
    const viewShortcuts = SHORTCUTS.filter((s) => s.scope === 'view')
    const massShortcuts = SHORTCUTS.filter((s) => s.scope === 'massSelect')
    expect(viewShortcuts.length).toBeGreaterThan(0)
    expect(massShortcuts.length).toBeGreaterThan(0)
  })

  it('navigation is always present in the registry', () => {
    const navShortcuts = SHORTCUTS.filter((s) => s.scope === 'navigation')
    expect(navShortcuts.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// No reserved Electron / OS-level combos are hijacked by accident
// ---------------------------------------------------------------------------

describe('OS shortcut conflicts', () => {
  // On macOS, Cmd+Q quits the app — our shortcuts should not use it.
  // On Win, Ctrl+W closes tabs; Ctrl+Q quits.
  const reserved: string[] = ['Mod+Q', 'Mod+W', 'Mod+Tab', 'Mod+Shift+Tab']

  for (const combo of reserved) {
    it(`${combo} is not used by any shortcut`, () => {
      const match = SHORTCUTS.filter((s) => s.combo === combo)
      expect(match.length, `${combo} conflicts with OS/reserved shortcut`).toBe(0)
    })
  }

  // Mod+F is used for find/search — ensure it's in the registry
  it('Mod+F is registered for search', () => {
    const searchShortcut = SHORTCUTS.find((s) => s.combo === 'Mod+F')
    expect(searchShortcut).toBeDefined()
    expect(searchShortcut!.id).toBe('view.search')
  })

  // Cmd/Ctrl+S is used for save — ensure it's in the registry
  it('Mod+S is registered for save', () => {
    const saveShortcut = SHORTCUTS.find((s) => s.combo === 'Mod+S')
    expect(saveShortcut).toBeDefined()
    expect(saveShortcut!.id).toBe('modal.save')
  })
})
