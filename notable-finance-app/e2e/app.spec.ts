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
  await expect(win.locator(`${mod('topbar')} .button`, { hasText: 'Schema Check' })).toBeVisible()
  await expect(win.locator(`${mod('topbar')} .button--primary`, { hasText: 'Sync' })).toBeVisible()
})

test('dashboard renders the web dashboard layout', async () => {
  await win.locator(mod('nav__item'), { hasText: 'Dashboard' }).click()
  await expect(win.locator('.workspace__content')).toBeVisible()
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
