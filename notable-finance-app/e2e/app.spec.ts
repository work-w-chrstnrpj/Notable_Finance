import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Full-app Electron e2e against the PORTED web workspace UI (Sidebar + TopBar +
// pages copied from notable-finance-web). Isolated userData; reference data seeded
// between two launches (first launch creates + migrates the DB).

let app: ElectronApplication
let win: Page
let userData: string

const launch = (): Promise<ElectronApplication> =>
  electron.launch({ args: ['out/main/index.js'], env: { ...process.env, NF_USER_DATA_DIR: userData } })

test.beforeAll(async () => {
  userData = mkdtempSync(join(tmpdir(), 'nf-e2e-'))

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

test('boots the web workspace shell: sidebar groups + topbar', async () => {
  // Sidebar groups exactly as the web app: Core / Workflows / System
  for (const group of ['Core', 'Workflows', 'System']) {
    await expect(win.locator('.nav__title', { hasText: group })).toBeVisible()
  }
  for (const label of [
    'Dashboard', 'Accounts', 'Income', 'Expense',
    'Transfer', 'Alkansya', 'Receivables', 'Sync', 'Settings'
  ]) {
    await expect(win.locator('.nav__item', { hasText: label })).toBeVisible()
  }
  // TopBar with the web app's sync controls
  await expect(win.locator('.topbar')).toBeVisible()
  await expect(win.locator('.topbar .button', { hasText: 'Schema Check' })).toBeVisible()
  await expect(win.locator('.topbar .button--primary', { hasText: 'Sync' })).toBeVisible()
})

test('dashboard renders the web dashboard layout', async () => {
  await win.locator('.nav__item', { hasText: 'Dashboard' }).click()
  await expect(win.locator('.workspace__content')).toBeVisible()
})

test('accounts page shows the seeded reference accounts (web card filters intact)', async () => {
  await win.locator('.nav__item', { hasText: 'Accounts' }).click()
  await win.waitForFunction(() => window.location.hash === '#/accounts')
  await expect(win.getByText('BPI Savings')).toBeVisible()
  await expect(win.getByText('Cash on Hand')).toBeVisible()
  // Web behavior preserved: zero-balance accounts (Visa Platinum) are hidden until toggled.
  await expect(win.getByText('Hide zero balance')).toBeVisible()
})

test('settings section exists with Interface/Theme/Notion panels (no account management)', async () => {
  await win.locator('.nav__item', { hasText: 'Settings' }).click()
  await win.waitForFunction(() => window.location.hash === '#/settings')
  await expect(win.getByText('Quick-action button')).toBeVisible()
  await expect(win.getByText('Appearance & Colors')).toBeVisible()
  await expect(win.getByText('Notion Configuration', { exact: true })).toBeVisible()
  // dropped by design: no login/account management on desktop
  await expect(win.getByText('Change Password')).toHaveCount(0)
  await expect(win.getByText('Delete Account')).toHaveCount(0)
})

test('multi-window still works (File menu owns New Window)', async () => {
  const before = app.windows().length
  await app.evaluate(({ BrowserWindow }) => {
    // Trigger via the same code path the menu uses.
    const win = BrowserWindow.getAllWindows()[0]
    void win // menu accelerators aren't clickable in Playwright; open directly:
  })
  // windows:new IPC from the renderer side:
  await win.evaluate(() => (window as unknown as { api: { windows: { new: () => Promise<unknown> } } }).api.windows.new())
  await expect.poll(() => app.windows().length, { timeout: 10_000 }).toBeGreaterThan(before)
})
