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

const folder = join(process.cwd(), 'src/main/db/migrations')

function accountPage(id: string, name: string, network?: string | null): Record<string, unknown> {
  const properties: Record<string, unknown> = {
    'Account Name': { type: 'title', title: [{ plain_text: name }] },
    'Account Type': { type: 'select', select: { name: 'Credit Account' } }
  }
  if (network !== undefined) {
    properties['Payment Network'] = { type: 'select', select: network === null ? null : { name: network } }
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

describe('account-cards/01 Payment Network', () => {
  it('account-cards/01#AC1 a Notion account page with Payment Network Visa gives an account whose network is Visa', () => {
    expect(pageToAccountFields(accountPage('p1', 'RCBC Visa', 'Visa')).payment_network).toBe('Visa')
  })

  it('account-cards/01#AC2 after a sync each account carries its network, and one with no value shows none', async () => {
    state.pages = [accountPage('p-visa', 'RCBC Visa', 'Visa'), accountPage('p-none', 'GCash', null), accountPage('p-missing', 'Cash')]
    await pullAll(true)
    const byName = Object.fromEntries(listAccounts(true).map((a) => [a.name, a.paymentNetwork]))
    expect(byName).toEqual({ 'RCBC Visa': 'Visa', GCash: null, Cash: null })
  })

  it('account-cards/01#AC2 a changed network is updated on the next sync and clearing it clears it', async () => {
    state.pages = [accountPage('p1', 'Card', 'Visa')]
    await pullAll(true)
    state.pages = [accountPage('p1', 'Card', 'Mastercard')]
    await pullAll(true)
    expect(listAccounts(true)[0].paymentNetwork).toBe('Mastercard')
    state.pages = [accountPage('p1', 'Card', null)]
    await pullAll(true)
    expect(listAccounts(true)[0].paymentNetwork).toBeNull()
  })

  it('account-cards/01#AC3 an unknown network is kept as its text and does not break the pull', async () => {
    state.pages = [accountPage('p1', 'Local Card', '  BancNet  '), accountPage('p2', 'Visa Card', 'Visa')]
    const result = await pullAll(true)
    expect(result.errors).toEqual([])
    const byName = Object.fromEntries(listAccounts(true).map((a) => [a.name, a.paymentNetwork]))
    expect(byName).toEqual({ 'Local Card': 'BancNet', 'Visa Card': 'Visa' })
  })

  it('account-cards/01#AC4 an existing database upgrades without losing account data', () => {
    state.db.close()
    state.db = new DatabaseSync(':memory:')
    applyMigrations(state.db, '0016_loan_terms')
    state.db
      .prepare(
        "INSERT INTO accounts (id, notion_page_id, account_name, account_type, starting_balance, credit_limit, created_at) VALUES ('a1', 'n1', 'Old Card', 'Credit Account', 10, 5000, 0)"
      )
      .run()
    state.db.exec(readFileSync(join(folder, '0017_account_payment_network.sql'), 'utf8'))
    expect(state.db.prepare('SELECT account_name, credit_limit, payment_network FROM accounts').all()).toEqual([
      { account_name: 'Old Card', credit_limit: 5000, payment_network: null }
    ])
    // later migrations (account-cards/11 adds card_numbers) must be applied before the app reads accounts
    state.db.exec(readFileSync(join(folder, '0018_account_card_numbers.sql'), 'utf8'))
    expect(listAccounts(true)[0].paymentNetwork).toBeNull()
  })

  it('account-cards/01#AC4 accounts get their network on the next sync after the upgrade', async () => {
    state.db.prepare("INSERT INTO accounts (id, notion_page_id, account_name, account_type, created_at) VALUES ('a1', 'p1', 'Old Card', 'Credit Account', 0)").run()
    state.pages = [accountPage('p1', 'Old Card', 'JCB')]
    await pullAll(true)
    expect(listAccounts(true).map((a) => [a.id, a.paymentNetwork])).toEqual([['a1', 'JCB']])
  })

  it('account-cards/01#AC5 nothing about the network is ever pushed to Notion', async () => {
    state.pages = [accountPage('p1', 'Card', 'Visa')]
    await pullAll(true)
    await pushAll()
    const sent = JSON.stringify([...api.updatePage.mock.calls, ...api.createPage.mock.calls])
    expect(sent).not.toContain('Payment Network')
    // a wrong or missing property can only warn; it is never a writable (push-blocking) field
    const spec = EXPECTED_SCHEMA.accounts.find((p) => p.property === NOTION_PROPERTY_NAMES.accounts.paymentNetwork)
    expect(spec).toMatchObject({ kind: 'computed', optional: true })
  })

  it('account-cards/01#AC6 the Notion field mapping document lists Payment Network', () => {
    const doc = readFileSync(join(process.cwd(), '..', 'wiki/shared/notion-field-mapping.md'), 'utf8')
    expect(doc).toContain('`Payment Network`')
  })
})
