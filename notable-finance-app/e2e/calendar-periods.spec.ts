import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// calendar-periods/06#AC1: Income -> Quarterly shows a fixed calendar quarter label with its month range.
// calendar-periods/06#AC2: Monitoring -> Semi-Annually shows a fixed calendar half label with its month range.
// Isolated userData, empty database: only the picker and the date selector label are under test.
test.use({ trace: 'retain-on-failure', screenshot: 'only-on-failure' })

let app: ElectronApplication
let win: Page
let userData: string
const launch = () => electron.launch({ args: ['.'], env: { ...process.env, NF_USER_DATA_DIR: userData } })

test.beforeAll(async () => {
  userData = mkdtempSync(join(tmpdir(), 'nf-calendar-periods-'))
  app = await launch()
  win = await app.firstWindow()
  await win.waitForSelector('.sidebar')
})

test.afterAll(async () => {
  await app?.close()
})

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** The label the selector must show today, from the fixed calendar rule (ADR-0012). */
function expectedLabel(unit: 'quarter' | 'half'): string {
  const now = new Date()
  const m = now.getMonth()
  const year = now.getFullYear()
  if (unit === 'quarter') {
    const q = Math.floor(m / 3)
    return `Q${q + 1} ${year} · ${MONTHS[q * 3]} – ${MONTHS[q * 3 + 2]}`
  }
  const h = m < 6 ? 0 : 1
  return `H${h + 1} ${year} · ${MONTHS[h * 6]} – ${MONTHS[h * 6 + 5]}`
}

test('calendar-periods/06#AC1 Income Quarterly shows the fixed calendar quarter and its month range', async () => {
  await win.evaluate(() => { window.location.hash = '#/income' })
  const picker = win.getByLabel('Income view')
  await expect(picker).toBeVisible()
  // All seven periods, in order.
  const labels = await picker.getByRole('button').allTextContents()
  expect(labels.map(l => l.trim()).slice(0, 7)).toEqual([
    'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-Annually', 'Annually', 'All Records'
  ])
  await picker.getByRole('button', { name: 'Quarterly', exact: true }).click()
  await expect(win.locator('.month-stepper__label')).toHaveText(expectedLabel('quarter'))
})

test('calendar-periods/06#AC2 Monitoring Semi-Annually shows the fixed calendar half and its month range', async () => {
  await win.evaluate(() => { window.location.hash = '#/monthly-monitoring' })
  const picker = win.getByLabel('Monitoring view')
  await expect(picker).toBeVisible()
  await picker.getByRole('button', { name: 'Semi-Annually', exact: true }).click()
  await expect(win.locator('.month-stepper__label')).toHaveText(expectedLabel('half'))
  await expect(win.getByRole('heading', { name: 'Semi-Annual Monitoring' })).toBeVisible()
})
