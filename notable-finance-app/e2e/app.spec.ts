import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Full-app Electron e2e against the PORTED web workspace UI (Sidebar + TopBar +
// pages copied from notable-finance-web). Isolated userData; reference data seeded
// between two launches (first launch creates + migrates the DB).

// Classes owned by a CSS Module are hashed in the built bundle, so a literal
// `.nav__item` selector matches nothing. Vite's scoped-name format keeps the local
// name intact — `.nav__item` becomes `._nav__item_oqaxm_1` — so `[class*="_<local>_"]`
// finds it again.
//
// The `:not()` is load-bearing. BEM children share the parent's prefix, and the first
// underscore of `__` completes the match: `[class*="_topbar_"]` alone also matches
// `_topbar__actions_` and `_topbar__avatar_`, which is a strict-mode violation. Excluding
// `_<local>__` keeps the parent and drops its children. Modifiers need no such guard —
// `_nav__item--active_` uses `--`, so `_nav__item_` never matches it.
//
// Classes the components still emit as literal strings (`.sidebar`, `.modal-panel`,
// `.workspace__content`, `.button`) are NOT hashed and must not use this helper.
const mod = (local: string) => `[class*="_${local}_"]:not([class*="_${local}__"])`

let app: ElectronApplication
let win: Page
let userData: string

// Launch via the app directory ('.'), NOT the built entry file. Electron derives
// `app.getAppPath()` from this arg: pointing at `out/main/index.js` makes appPath
// `<root>/out/main`, so db/index.ts's `join(app.getAppPath(), 'src/main/db/migrations')`
// resolves to a non-existent path and drizzle's migrate() throws "Can't find
// meta/_journal.json" — aborting app.whenReady() before createWindow() ever runs.
// Passing '.' makes Electron read package.json's `main`, giving appPath = package root,
// which is what both `electron-vite dev` and the packaged build already produce.
const launch = (): Promise<ElectronApplication> =>
  electron.launch({ args: ['.'], env: { ...process.env, NF_USER_DATA_DIR: userData } })

test.beforeAll(async () => {
  userData = mkdtempSync(join(tmpdir(), 'nf-e2e-'))

  const first = await launch()
  await first.firstWindow()
  await first.close()

  execFileSync('node', ['scripts/seed-dev.mjs'], {
    env: { ...process.env, NF_USER_DATA_DIR: userData },
    stdio: 'ignore'
  })

  // This fixture belongs only to this isolated test profile, not the dev seed or user data.
  execFileSync('node', ['-e', `
    const { DatabaseSync } = require('node:sqlite')
    const { join } = require('node:path')
    const db = new DatabaseSync(join(process.env.NF_USER_DATA_DIR, 'notable-finance.sqlite'))
    db.prepare('INSERT INTO expense_categories (id, notion_page_id, name, monthly_budget, auxiliary, created_at) VALUES (?, ?, ?, 0, 0, ?)').run('test-pasabuy', 'test-pasabuy', 'Pasabuy', Date.now())
    db.close()
  `], { env: { ...process.env, NF_USER_DATA_DIR: userData }, stdio: 'ignore' })

  app = await launch()
  win = await app.firstWindow()
  await win.waitForSelector('.sidebar')
})

test.afterAll(async () => {
  await app?.close()
})

test('boots the web workspace shell: sidebar groups + topbar', async () => {
  // Sidebar groups exactly as the web app: Core / Workflows / System
  for (const group of ['Overview', 'Money movement', 'Workspace']) {
    await expect(win.locator(mod('nav__title'), { hasText: group })).toBeVisible()
  }
  for (const label of [
    'Dashboard', 'Accounts', 'Income', 'Expense',
    'Transfer', 'Alkansya', 'Receivables', 'Sync', 'Settings'
  ]) {
    await expect(win.locator(mod('nav__item'), { hasText: label })).toBeVisible()
  }
  // TopBar with the web app's sync controls
  await expect(win.locator(mod('topbar'))).toBeVisible()
  await expect(win.locator(`${mod('topbar')} .button`, { hasText: 'Schema Check' })).toHaveCount(0)
  await expect(win.locator(`${mod('topbar')} .button--primary`, { hasText: 'Sync' })).toBeVisible()
})

test('dashboard renders the web dashboard layout', async ({ browserName }, testInfo) => {
  void browserName // Electron is launched directly; retain Playwright fixture signature.
  await win.locator(mod('nav__item'), { hasText: 'Dashboard' }).click()
  await expect(win.locator('.workspace__content')).toBeVisible()
  await win.screenshot({ path: testInfo.outputPath('dashboard-redesign.png') })
})

test('accounts page shows the seeded reference accounts (web card filters intact)', async () => {
  await win.locator(mod('nav__item'), { hasText: 'Accounts' }).click()
  await win.waitForFunction(() => window.location.hash === '#/accounts')
  await expect(win.getByText('BPI Savings')).toBeVisible()
  await expect(win.getByText('Cash on Hand')).toBeVisible()
  // Web behavior preserved: zero-balance accounts (Visa Platinum) are hidden until toggled.
  await expect(win.getByText('Hide zero balance')).toBeVisible()
})

test('settings section exists with Interface/Theme/Notion panels (no account management)', async () => {
  await win.locator(mod('nav__item'), { hasText: 'Settings' }).click()
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

test('CC Transaction periods and filters survive the desktop shell', async ({ browserName }, testInfo) => {
  void browserName // Electron is launched directly; retain Playwright fixture signature.
  await win.locator(mod('nav__item'), { hasText: 'Expense' }).click()
  await win.getByRole('button', { name: 'CC Transactions', exact: true }).click()
  await win.getByRole('button', { name: 'Filters', exact: true }).click()
  const period = win.getByRole('combobox', { name: 'CC Transaction period' })
  for (const value of ['Daily', 'Weekly', 'Monthly', 'Annually']) {
    await period.selectOption(value)
    await expect(period).toHaveValue(value)
  }
  await expect(win.locator('select').filter({ has: win.locator('option', { hasText: 'All payment statuses' }) })).toBeVisible()
  await win.getByRole('button', { name: 'All Categories', exact: true }).click()
  await win.getByRole('button', { name: 'Pasabuy', exact: true }).click()
  await expect(win.locator('select').filter({ has: win.locator('option', { hasText: 'All Pasabuy payment statuses' }) })).toBeVisible()
  await expect(win.getByRole('columnheader', { name: 'Pasabuyer Balance' })).toBeVisible()
  await win.screenshot({ path: testInfo.outputPath('cc-transaction-redesign.png') })
})

test('appearance and fonts persist after reload; narrow dark dashboard stays usable', async ({ browserName }, testInfo) => {
  void browserName // Electron is launched directly; retain Playwright fixture signature.
  await win.evaluate(async () => {
    const api = (window as unknown as { api: import('../src/preload').PreloadApi }).api
    const current = await api.settings.get()
    if (!current.ok) throw new Error('Test settings unavailable')
    const result = await api.settings.update({
      theme: { ...current.data.theme, preset: 'default', mode: 'dark', primaryColor: '#4270bd', secondaryColor: '#22816c' },
      fonts: { bodyFont: 'Arial', monoFont: 'Courier New', brandFont: 'Georgia', receiptFont: 'Times New Roman' },
    })
    if (!result.ok) throw new Error('Test settings update failed')
    window.location.hash = '#/dashboard'
  })
  await win.reload()
  await expect(win.locator('html')).toHaveAttribute('data-theme', 'dark')
  const appearance = await win.evaluate(() => {
    const style = document.documentElement.style
    return ['--blue', '--font-body', '--font-mono', '--font-brand', '--font-receipt'].map(key => style.getPropertyValue(key))
  })
  expect(appearance[0]).toBe('#4270bd')
  for (const [index, font] of ['Arial', 'Courier New', 'Georgia', 'Times New Roman'].entries()) expect(appearance[index + 1]).toContain(font)
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().forEach(w => w.setSize(900, 760)))
  await expect(win.getByRole('button', { name: 'Open navigation' })).toBeVisible()
  await expect(win.getByRole('heading', { name: 'This month' })).toBeVisible()
  await expect.poll(() => win.locator('.sidebar').evaluate(el => el.getBoundingClientRect().right)).toBeLessThanOrEqual(0)
  await win.screenshot({ path: testInfo.outputPath('dark-custom-font-dashboard.png'), animations: 'disabled' })
  expect(await win.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('daily calendar is a single popup matching the date selector width', async ({ browserName }, testInfo) => {
  void browserName
  await win.evaluate(() => { window.location.hash = '#/expense' })
  await win.getByRole('button', { name: 'Daily', exact: true }).click()
  await win.locator('.month-stepper__label').click()
  await expect(win.getByRole('dialog', { name: 'Pick a date' })).toBeVisible()
  await expect(win.locator('.date-picker input[type="date"]')).toHaveCount(0)
  const trigger = await win.locator('.month-stepper').boundingBox()
  const calendar = await win.locator('.date-picker').boundingBox()
  expect(Math.abs(trigger!.width - calendar!.width)).toBeLessThan(1)
  await win.screenshot({ path: testInfo.outputPath('single-calendar.png'), animations: 'disabled' })
  await win.keyboard.press('Escape')
  await expect(win.getByRole('dialog', { name: 'Pick a date' })).toHaveCount(0)
})
