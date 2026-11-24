import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const state = vi.hoisted(() => ({
  db: null as unknown as DatabaseSync,
  pages: [] as Record<string, unknown>[]
}))
const api = vi.hoisted(() => ({
  queryDatabase: vi.fn(),
  updatePage: vi.fn(async (id: string, _properties: Record<string, unknown>) => ({ id })),
  createPage: vi.fn(async (..._args: unknown[]) => ({ id: 'created-page' }))
}))
vi.mock('../src/main/db', () => ({ getSqlite: () => state.db }))
vi.mock('../src/main/notion/service', () => ({ client: () => api }))
vi.mock('../src/main/notion/mapping-store', () => ({ getMapping: () => ({ accounts: 'account-db' }) }))
vi.mock('../src/main/sync/status', () => ({
  isRunning: () => false,
  setRunning: vi.fn(),
  emitStatus: vi.fn(),
  syncStatus: () => ({ connected: true, mapped: true })
}))
vi.mock('../src/main/windows', () => ({ broadcast: vi.fn() }))
vi.mock('../src/main/services/history', () => ({ recordActivity: vi.fn() }))
vi.mock('../src/main/services/page-content', () => ({ replaceNotionPageContent: vi.fn() }))

import { pullAll } from '../src/main/sync/pull'
import { pushAll } from '../src/main/sync/push'
import { listAccounts } from '../src/main/db/repositories'
import { pageToAccountFields } from '../src/main/notion/page-extractors'
import { EXPECTED_SCHEMA } from '../src/main/notion/schema-spec'
import { NOTION_PROPERTY_NAMES } from '../src/main/notion/property-mapper'
import { formatLast4, formatMaskedCardNumber, maskedCardNumberOrNull, parseCardNumber } from '../src/shared/card-number'

const folder = join(process.cwd(), 'src/main/db/migrations')
const PROPERTY = 'Card Numbers & Last 4 Digit'

function accountPage(id: string, name: string, cardNumbers?: string | null): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    'Account Name': { type: 'title', title: [{ plain_text: name }] },
    'Account Type': { type: 'select', select: { name: 'Credit Account' } }
  }
  if (cardNumbers !== undefined) {
    properties[PROPERTY] = {
      type: 'rich_text',
      rich_text: cardNumbers === null ? [] : [{ plain_text: cardNumbers }]
    }
  }
  return { id, last_edited_time: '2026-11-24T00:00:00.000Z', properties }
}

function applyMigrations(db: DatabaseSync, upToTag?: string): void {
  const journal = JSON.parse(readFileSync(join(folder, 'meta/_journal.json'), 'utf8')) as { entries: { tag: string }[] }
  for (const entry of journal.entries) {
    db.exec(readFileSync(join(folder, `${entry.tag}.sql`), 'utf8'))
    if (entry.tag === upToTag) break
  }
}

beforeEach(() => {
  state.db?.close()
  state.db = new DatabaseSync(':memory:')
  applyMigrations(state.db)
  api.updatePage.mockClear()
  api.createPage.mockClear()
  api.queryDatabase.mockImplementation(async () => state.pages)
  state.pages = []
})
afterAll(() => state.db.close())

describe('account-cards/11 card number rules', () => {
  it('account-cards/11#AC1 the value "16, 4056" is 12 masked digits then 4056, grouped in fours', () => {
    const parsed = parseCardNumber('16, 4056')
    expect(parsed).toEqual({ count: 16, last4: '4056' })
    expect(formatMaskedCardNumber(parsed!)).toBe('•••• •••• •••• 4056')
    expect(formatLast4(parsed!)).toBe('•••• 4056')
    expect(parseCardNumber('  16 ,4056 ')).toEqual({ count: 16, last4: '4056' }) // flexible spacing
  })

  it('account-cards/11#AC2 a 15-digit value groups 4-6-5, a 14-digit one 4-6-4, other lengths in fours; only the last four are real', () => {
    expect(formatMaskedCardNumber(parseCardNumber('15, 1005')!)).toBe('•••• •••••• •1005')
    expect(formatMaskedCardNumber(parseCardNumber('14, 0004')!)).toBe('•••• •••••• 0004')
    expect(formatMaskedCardNumber(parseCardNumber('19, 1234')!)).toBe('•••• •••• •••• •••1 234')
    expect(formatMaskedCardNumber(parseCardNumber('12, 9876')!)).toBe('•••• •••• 9876')
    expect(formatMaskedCardNumber(parseCardNumber('13, 0042')!)).toBe('•••• •••• •004 2')
    // leading zeros survive, and no digit before the last four is ever shown
    expect(parseCardNumber('16, 0042')!.last4).toBe('0042')
    expect(formatMaskedCardNumber(parseCardNumber('16, 0042')!).replace(/[• ]/g, '')).toBe('0042')
  })

  it('account-cards/11#AC3 an empty or invalid value gives nothing', () => {
    for (const bad of [null, undefined, '', '   ', 'abc', '16', '16,', '16, 40', '16, 40567', '11, 4056', '20, 4056', '0, 4056', '16 4056', '16, 40a6', '16.5, 4056']) {
      expect(parseCardNumber(bad as string | null | undefined)).toBeNull()
      expect(maskedCardNumberOrNull(bad as string | null | undefined)).toBeNull()
    }
    expect(maskedCardNumberOrNull('16, 4056')).toBe('•••• •••• •••• 4056')
  })
})

describe('account-cards/11 reading it from Notion', () => {
  it('account-cards/11#AC4 the value is read on every sync and kept with the account', async () => {
    expect(pageToAccountFields(accountPage('p1', 'Card', '16, 4056')).card_numbers).toBe('16, 4056')
    state.pages = [accountPage('p-set', 'RCBC Visa', '16, 4056'), accountPage('p-empty', 'GCash', null), accountPage('p-missing', 'Cash')]
    await pullAll(true)
    const byName = Object.fromEntries(listAccounts(true).map((a) => [a.name, a.cardNumbers]))
    expect(byName).toEqual({ 'RCBC Visa': '16, 4056', GCash: null, Cash: null })
    // an edit and a clear arrive on the next sync
    state.pages = [accountPage('p-set', 'RCBC Visa', '15, 1005')]
    await pullAll(true)
    expect(listAccounts(true).find((a) => a.name === 'RCBC Visa')!.cardNumbers).toBe('15, 1005')
    state.pages = [accountPage('p-set', 'RCBC Visa', null)]
    await pullAll(true)
    expect(listAccounts(true).find((a) => a.name === 'RCBC Visa')!.cardNumbers).toBeNull()
  })

  it('account-cards/11#AC4 an existing database upgrades without losing account data', () => {
    state.db.close()
    state.db = new DatabaseSync(':memory:')
    applyMigrations(state.db, '0017_account_payment_network')
    state.db
      .prepare(
        "INSERT INTO accounts (id, notion_page_id, account_name, account_type, starting_balance, credit_limit, payment_network, created_at) VALUES ('a1', 'n1', 'Old Card', 'Credit Account', 10, 5000, 'Visa', 0)"
      )
      .run()
    state.db.exec(readFileSync(join(folder, '0018_account_card_numbers.sql'), 'utf8'))
    expect(state.db.prepare('SELECT account_name, credit_limit, payment_network, card_numbers FROM accounts').all()).toEqual([
      { account_name: 'Old Card', credit_limit: 5000, payment_network: 'Visa', card_numbers: null }
    ])
    expect(listAccounts(true)[0].cardNumbers).toBeNull()
  })

  it('account-cards/11#AC5 nothing about the field is pushed to Notion, and a missing property never blocks a sync', async () => {
    state.pages = [accountPage('p1', 'Card', '16, 4056')]
    await pullAll(true)
    await pushAll()
    const sent = JSON.stringify([...api.updatePage.mock.calls, ...api.createPage.mock.calls])
    expect(sent).not.toContain(PROPERTY)
    const spec = EXPECTED_SCHEMA.accounts.find((p) => p.property === NOTION_PROPERTY_NAMES.accounts.cardNumbers)
    expect(spec).toMatchObject({ type: 'rich_text', kind: 'computed', optional: true })
    // a page with no such property at all still pulls without errors
    state.pages = [accountPage('p2', 'No Field')]
    const result = await pullAll(true)
    expect(result.errors).toEqual([])
  })

  it('account-cards/11#AC6 the Notion field mapping document and the glossary list the new property', () => {
    const doc = readFileSync(join(process.cwd(), '..', 'wiki/shared/notion-field-mapping.md'), 'utf8')
    expect(doc).toContain('`Card Numbers & Last 4 Digit`')
    const glossary = readFileSync(join(process.cwd(), '..', 'GLOSSARY.md'), 'utf8')
    expect(glossary).toContain('**Card number**')
  })
})
