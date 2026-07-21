import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Full-app Electron e2e (wiki/desktop/desktop-testing-strategy.md §E2E). Runs against the
// electron-vite build output in an isolated userData dir so it never touches the dev store.
// Reference data (accounts/categories) is seeded between two launches — the first creates
// and migrates the DB, then the seed script fills the read-only caches.

let app: ElectronApplication
let win: Page
let userData: string

const launch = (): Promise<ElectronApplication> =>
  electron.launch({ args: ['out/main/index.js'], env: { ...process.env, NF_USER_DATA_DIR: userData } })

test.beforeAll(async () => {
  userData = mkdtempSync(join(tmpdir(), 'nf-e2e-'))

  // Launch once to create + migrate the DB, then close so seeding has exclusive access.
  const first = await launch()
  await first.firstWindow()
  await first.close()

  execFileSync('node', ['scripts/seed-dev.mjs'], {
    env: { ...process.env, NF_USER_DATA_DIR: userData },
    stdio: 'ignore'
  })

  app = await launch()
  win = await app.firstWindow()
  await win.waitForSelector('.sidebar')
})

test.afterAll(async () => {
  await app?.close()
})

test('boots with all nine sections + Sync and a live local store', async () => {
  await expect(win.locator('h1')).toHaveText('Dashboard')
  for (const label of ['Dashboard', 'Accounts', 'Income', 'Expense', 'Monitoring', 'Transfer', 'CC Payment', 'Alkansya', 'Receivables', 'Sync']) {
    await expect(win.locator('.nav-item', { hasText: label })).toBeVisible()
  }
  await expect(win.locator('.store-status')).toContainText('tables')
})

test('sync chip renders and reflects offline / not-connected state', async () => {
  await expect(win.locator('.sync-chip')).toBeVisible()
  await expect(win.locator('.sync-chip .badge')).toContainText(/not connected/i)
})

test('accounts pulled from the seeded reference cache render with balances', async () => {
  await win.locator('.nav-item', { hasText: 'Accounts' }).click()
  await expect(win.locator('h1')).toHaveText('Accounts')
  await expect(win.locator('.account-card', { hasText: 'BPI Savings' })).toBeVisible()
})

test('create an income offline: row is badged and the dashboard updates live', async () => {
  await win.locator('.nav-item', { hasText: 'Income' }).click()
  await win.locator('button.primary', { hasText: '+ New' }).click()
  await win.waitForSelector('.modal')

  await win.locator('.modal input').first().fill('E2E Salary') // name (first text input)
  await win.locator('.modal input[type="number"]').first().fill('12345') // gross income
  await win.locator('.modal select').nth(0).selectOption({ index: 1 }) // account
  await win.locator('.modal select').nth(1).selectOption({ index: 1 }) // category (non-auxiliary)
  await win.locator('.modal button.primary', { hasText: 'Create' }).click()

  // row appears with the "Not yet synced" badge (Phase 4.3)
  const row = win.locator('.data-table tbody tr', { hasText: 'E2E Salary' })
  await expect(row).toBeVisible()
  await expect(row.locator('.sync-badge.dirty')).toBeVisible()

  // dashboard reflects the new income (derived live from SQLite — Phase 1.3)
  await win.locator('.nav-item', { hasText: 'Dashboard' }).click()
  await expect(win.locator('.stat-card', { hasText: 'Total income' })).toContainText('12,345')
})

test('New Window opens a second window (multi-window consistency)', async () => {
  const before = app.windows().length
  await win.locator('.nav-item', { hasText: 'New Window' }).click()
  await expect.poll(() => app.windows().length, { timeout: 10_000 }).toBeGreaterThan(before)
})
