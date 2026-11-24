// account-cards/02: card finish, account colors and automatic color (local display preferences).
// Pure rules are tested directly; persistence runs on a temporary SQLite database, with the same
// Electron mock and "skip when the native binding does not match" pattern as budgets-repo.test.ts.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const state = vi.hoisted(() => {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { mkdtempSync } = require('node:fs') as typeof import('node:fs')
  const { tmpdir } = require('node:os') as typeof import('node:os')
  const { join: j } = require('node:path') as typeof import('node:path')
  /* eslint-enable @typescript-eslint/no-require-imports */
  return { dir: mkdtempSync(j(tmpdir(), 'nf-card-colors-test-')) }
})

vi.mock('electron', () => ({
  app: {
    getPath: () => state.dir,
    getAppPath: () => process.cwd(),
    isPackaged: false,
    getVersion: () => '3.0.0'
  },
  dialog: {}
}))

const sqliteUsable = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3') as typeof import('better-sqlite3').default
    new Database(':memory:').close()
    return true
  } catch {
    return false
  }
})()
const dbIt = sqliteUsable ? it : it.skip
const dbDescribe = sqliteUsable ? describe : describe.skip
const dbBeforeAll = sqliteUsable ? beforeAll : () => {}
const dbBeforeEach = sqliteUsable ? beforeEach : () => {}

import {
  AUTO_CARD_COLORS,
  CARD_COLORS,
  CARD_COLOR_NAMES,
  assignAutoCardColors,
  cardColorByName,
  pickAutoCardColor,
  type ColorableAccount
} from '../src/shared/card-colors'
import { closeDatabase, getSqlite, initDatabase } from '../src/main/db'
import { ensureAccountColors } from '../src/main/settings/card-colors'
import { DEFAULT_UI_SETTINGS, getUiSettings, normalizeUiSettings, setUiSettings } from '../src/main/settings/ui'

const acct = (id: string, name: string, type = 'Credit Account'): ColorableAccount => ({ id, name, type })
const NEUTRAL = ['Black', 'Graphite', 'Silver', 'White']

describe('account-cards/02 pure rules', () => {
  it('account-cards/02#AC1 an unknown finish or color falls back to the default', () => {
    expect(DEFAULT_UI_SETTINGS.cardFinish).toBe('glass')
    expect(DEFAULT_UI_SETTINGS.accountColors).toEqual({})
    expect(normalizeUiSettings({ cardFinish: 'metal' }).cardFinish).toBe('metal')
    expect(normalizeUiSettings({ cardFinish: 'sparkly' }).cardFinish).toBe('glass')
    expect(normalizeUiSettings({ cardFinish: 3 }).cardFinish).toBe('glass')
    expect(normalizeUiSettings({ accountColors: { a: 'Red', b: 'Chartreuse', c: 5 } }).accountColors).toEqual({ a: 'Red' })
    expect(normalizeUiSettings({ accountColors: 'Red' }).accountColors).toEqual({})
  })

  it('account-cards/02#AC2 auto color is repeatable and never reuses a color while one is free', () => {
    const accounts = Array.from({ length: AUTO_CARD_COLORS.length }, (_, i) => acct(`a${i}`, `Card ${i} Visa`))
    const first = assignAutoCardColors(accounts, {}).colors
    expect(assignAutoCardColors(accounts, {}).colors).toEqual(first)
    expect(new Set(Object.values(first)).size).toBe(accounts.length)
    // One more account than free colors: only then may a color repeat.
    const more = assignAutoCardColors([...accounts, acct('x', 'One more')], {}).colors
    expect(Object.keys(more)).toHaveLength(accounts.length + 1)
  })

  it('account-cards/02#AC2 auto color never picks Black, Graphite, Silver or White', () => {
    const accounts = Array.from({ length: 40 }, (_, i) => acct(`a${i}`, `Account number ${i}`))
    for (const name of Object.values(assignAutoCardColors(accounts, {}).colors)) {
      expect(NEUTRAL).not.toContain(name)
    }
    expect(AUTO_CARD_COLORS.some((n) => NEUTRAL.includes(n))).toBe(false)
  })

  it('account-cards/02#AC3 a Cash account starts at Graphite', () => {
    expect(pickAutoCardColor(acct('c', 'Cash Wallet', 'Cash'), new Set(['Graphite']))).toBe('Graphite')
    expect(assignAutoCardColors([acct('c', 'Cash Wallet', 'Cash')], {}).colors.c).toBe('Graphite')
  })

  it('account-cards/02#AC4 an existing pick does not change when another account is recolored or added', () => {
    const a = acct('a', 'RCBC Gold Mastercard')
    const b = acct('b', 'BDO Visa Platinum')
    const first = assignAutoCardColors([a, b], {})
    expect(first.changed).toBe(true)
    // Recolor b by hand, add c: a keeps its saved color.
    const second = assignAutoCardColors([a, b, acct('c', 'New card')], { ...first.colors, b: 'Pink' })
    expect(second.colors.a).toBe(first.colors.a)
    expect(second.colors.b).toBe('Pink')
    // Nothing new to assign: nothing changes, so nothing needs saving.
    expect(assignAutoCardColors([a, b], first.colors).changed).toBe(false)
  })

  it('account-cards/02#AC5 an explicit choice is never overridden by auto', () => {
    const a = acct('a', 'RCBC Gold Mastercard')
    const { colors } = assignAutoCardColors([a], { a: 'White' })
    expect(colors.a).toBe('White')
    // A saved color that is not in the palette is ignored and replaced by an automatic one.
    expect(CARD_COLOR_NAMES).toContain(assignAutoCardColors([a], { a: 'Chartreuse' }).colors.a)
  })

  it('account-cards/02#AC6 color code never touches Notion', () => {
    for (const file of ['src/shared/card-colors.ts', 'src/main/settings/card-colors.ts']) {
      const source = readFileSync(join(process.cwd(), file), 'utf8')
      expect(source).not.toMatch(/from '[^']*notion/i)
      expect(source).not.toMatch(/mutation_queue|sync_state/)
    }
  })

  it('account-cards/02#AC7 the palette matches the approved prototype', () => {
    expect(CARD_COLORS).toHaveLength(18)
    const file = join(process.cwd(), '..', 'prototypes/account-cards/index.html')
    if (!existsSync(file)) return // prototype is the reference; skip when the folder is not present
    const html = readFileSync(file, 'utf8')
    const block = html.slice(html.indexOf('const PALETTE = {'), html.indexOf('const AUTO_ORDER'))
    const entries = [...block.matchAll(/(\w+):\["(#\w+)","(#\w+)","(#\w+)"(?:,"(#\w+)")?\]/g)]
    expect(entries).toHaveLength(18)
    expect(entries.map((e) => e[1])).toEqual([...CARD_COLOR_NAMES])
    for (const [, name, dark, mid, highlight, ink] of entries) {
      expect(cardColorByName(name)).toEqual({ name, dark, mid, highlight, ink: ink ? 'dark' : 'light' })
    }
    for (const name of ['Yellow', 'Silver', 'White']) expect(cardColorByName(name)?.ink).toBe('dark')
  })
})

dbBeforeAll(() => {
  initDatabase()
})

afterAll(() => {
  if (sqliteUsable) closeDatabase()
  rmSync(state.dir, { recursive: true, force: true })
})

function seedAccounts(rows: Array<[string, string, string, string | null]>) {
  const sqlite = getSqlite()
  sqlite.exec('DELETE FROM accounts')
  const insert = sqlite.prepare(
    'INSERT INTO accounts (id, notion_page_id, account_name, account_type, created_at) VALUES (?, ?, ?, ?, 1)'
  )
  for (const [id, name, type, page] of rows) insert.run(id, page, name, type)
}

dbBeforeEach(() => {
  getSqlite().exec("DELETE FROM app_settings WHERE key = 'ui.settings'")
})

dbDescribe('account-cards/02 saved settings', () => {
  dbIt('account-cards/02#AC1 finish and colors are saved and read back', () => {
    setUiSettings({ cardFinish: 'matte', accountColors: { a1: 'Teal' } })
    const back = getUiSettings()
    expect(back.cardFinish).toBe('matte')
    expect(back.accountColors).toEqual({ a1: 'Teal' })
    // Bad values in a patch are ignored, not stored.
    setUiSettings({ accountColors: { a2: 'Chartreuse' } })
    expect(getUiSettings().accountColors).toEqual({ a1: 'Teal' })
  })

  dbIt('account-cards/02#AC4 the first automatic pick is saved and does not move later', () => {
    seedAccounts([
      ['a1', 'RCBC Gold Mastercard', 'Credit Account', 'p1'],
      ['a2', 'BDO Visa Platinum', 'Credit Account', 'p2'],
      ['local', 'Seed only', 'Cash', null]
    ])
    ensureAccountColors()
    const first = getUiSettings().accountColors
    expect(Object.keys(first).sort()).toEqual(['a1', 'a2']) // local seed accounts get none
    // Recolor a2 by hand and add a third account: a1 stays as saved.
    setUiSettings({ accountColors: { a2: 'Pink' } })
    seedAccounts([
      ['a0', 'Aardvark Bank', 'Savings', 'p0'],
      ['a1', 'RCBC Gold Mastercard', 'Credit Account', 'p1'],
      ['a2', 'BDO Visa Platinum', 'Credit Account', 'p2']
    ])
    ensureAccountColors()
    const after = getUiSettings().accountColors
    expect(after.a1).toBe(first.a1)
    expect(after.a2).toBe('Pink')
    expect(after.a0).toBeTruthy()
  })

  dbIt('account-cards/02#AC5 clearing a choice puts the account back on an automatic color', () => {
    seedAccounts([['a1', 'RCBC Gold Mastercard', 'Credit Account', 'p1']])
    setUiSettings({ accountColors: { a1: 'White' } })
    ensureAccountColors()
    expect(getUiSettings().accountColors.a1).toBe('White') // explicit choice untouched
    setUiSettings({ accountColors: { a1: null } })
    expect(getUiSettings().accountColors.a1).toBeUndefined()
    ensureAccountColors()
    const color = getUiSettings().accountColors.a1
    expect(color).toBeTruthy()
    expect(AUTO_CARD_COLORS).toContain(color)
  })

  dbIt('account-cards/02#AC6 saving colors queues nothing for Notion', () => {
    seedAccounts([['a1', 'RCBC Gold Mastercard', 'Credit Account', 'p1']])
    const sqlite = getSqlite()
    const queued = () => (sqlite.prepare('SELECT COUNT(*) AS n FROM mutation_queue').get() as { n: number }).n
    const before = queued()
    ensureAccountColors()
    setUiSettings({ cardFinish: 'metal', accountColors: { a1: 'Red' } })
    expect(queued()).toBe(before)
    const row = sqlite.prepare('SELECT account_name, account_type FROM accounts WHERE id = ?').get('a1')
    expect(row).toEqual({ account_name: 'RCBC Gold Mastercard', account_type: 'Credit Account' })
  })
})

// account-cards/06: Settings tells a hand-picked color (Custom) from an automatic one (Auto).
describe('account-cards/06 custom marker (pure)', () => {
  it('account-cards/06#AC5 only ids that have a saved color can be Custom', () => {
    const s = normalizeUiSettings({ accountColors: { a: 'Red' }, customAccountColors: ['a', 'ghost', 5, 'a'] })
    expect(s.customAccountColors).toEqual(['a'])
    expect(normalizeUiSettings({ customAccountColors: 'a' }).customAccountColors).toEqual([])
  })
})

dbDescribe('account-cards/06 custom marker (saved)', () => {
  dbIt('account-cards/06#AC3 a chosen color is Custom, an automatic pick is not, and Auto clears it', () => {
    seedAccounts([
      ['a1', 'RCBC Gold Mastercard', 'Credit Account', 'p1'],
      ['a2', 'BDO Visa Platinum', 'Credit Account', 'p2']
    ])
    setUiSettings({ accountColors: { a1: 'Purple' } })
    expect(getUiSettings().customAccountColors).toEqual(['a1'])
    ensureAccountColors() // a2 gets an automatic color; it must not become Custom
    expect(getUiSettings().accountColors.a2).toBeTruthy()
    expect(getUiSettings().customAccountColors).toEqual(['a1'])
    setUiSettings({ accountColors: { a1: null } })
    expect(getUiSettings().customAccountColors).toEqual([])
    ensureAccountColors()
    expect(getUiSettings().customAccountColors).toEqual([])
  })
})
