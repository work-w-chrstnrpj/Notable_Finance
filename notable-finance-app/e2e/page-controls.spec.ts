import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// page-controls/04#AC1: hide the period picker on Income and see the bar go and come back; on Accounts hide the
// period tabs, the view switches and the filter row and see them go and come back.
// Isolated userData, empty database: only the header icons and the controls they hide are under test.
test.use({ trace: 'retain-on-failure', screenshot: 'only-on-failure' })

let app: ElectronApplication
let win: Page
let userData: string
const launch = () => electron.launch({ args: ['.'], env: { ...process.env, NF_USER_DATA_DIR: userData } })

test.beforeAll(async () => {
  userData = mkdtempSync(join(tmpdir(), 'nf-page-controls-'))
  app = await launch()
  win = await app.firstWindow()
  await win.waitForSelector('.sidebar')
})

test.afterAll(async () => {
  await app?.close()
})

test('page-controls/04#AC1 Income: the period icon hides the picker bar and brings it back', async () => {
  await win.evaluate(() => { window.location.hash = '#/income' })
  const picker = win.getByLabel('Income view')
  await expect(picker).toBeVisible()

  await win.getByRole('button', { name: 'Hide period picker' }).click()
  await expect(picker).toHaveCount(0)
  // The header (title) stays and the icon now offers to show it again.
  await expect(win.getByRole('heading', { name: /Income$/ })).toBeVisible()

  await win.getByRole('button', { name: 'Show period picker' }).click()
  await expect(picker).toBeVisible()
})

test('page-controls/04#AC1 Accounts: the period, views and filter icons each hide their own controls and restore them', async () => {
  await win.evaluate(() => { window.location.hash = '#/accounts' })
  const tabs = win.getByLabel('Account mode')
  const views = win.getByLabel('Account view')
  await expect(tabs).toBeVisible()
  await expect(views).toBeVisible()

  await win.getByRole('button', { name: 'Hide period picker' }).click()
  await expect(tabs).toHaveCount(0)
  await expect(views).toBeVisible() // only its own controls go

  await win.getByRole('button', { name: 'Hide view switches' }).click()
  await expect(views).toHaveCount(0)

  await win.getByRole('button', { name: 'Close filters' }).click()
  await expect(win.getByRole('checkbox', { name: /Hide zero balance/ })).toHaveCount(0)
  // Everything hidden: the header title is what is left above the content.
  await expect(win.getByRole('heading', { name: 'Accounts', exact: true })).toBeVisible()

  await win.getByRole('button', { name: 'Show period picker' }).click()
  await win.getByRole('button', { name: 'Show view switches' }).click()
  await win.getByRole('button', { name: 'Filters' }).click()
  await expect(tabs).toBeVisible()
  await expect(views).toBeVisible()
  await expect(win.getByRole('checkbox', { name: /Hide zero balance/ })).toBeVisible()
})
