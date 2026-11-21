import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// monthly-budget/03#AC11: switching the Budget source on Monitoring changes the figures.
// Isolated userData; one non-auxiliary category with a Notion budget of 8,000.
test.use({ trace: 'retain-on-failure', screenshot: 'only-on-failure' })

let app: ElectronApplication
let win: Page
let userData: string
const launch = () => electron.launch({ args: ['.'], env: { ...process.env, NF_USER_DATA_DIR: userData } })

test.beforeAll(async () => {
  userData = mkdtempSync(join(tmpdir(), 'nf-saved-budgets-'))
  const first = await launch()
  await first.firstWindow()
  await first.close()
  execFileSync(process.execPath, ['-e', `
    const { DatabaseSync } = require('node:sqlite')
    const { join } = require('node:path')
    const db = new DatabaseSync(join(process.env.NF_USER_DATA_DIR, 'notable-finance.sqlite'))
    db.prepare("INSERT INTO expense_categories (id, notion_page_id, name, monthly_budget, auxiliary, created_at) VALUES ('groceries', 'notion-groceries', 'Groceries', 8000, 0, 0)").run()
    db.close()
  `], { env: { ...process.env, NF_USER_DATA_DIR: userData }, stdio: 'pipe' })
  app = await launch()
  win = await app.firstWindow()
  await win.waitForSelector('.sidebar')
})

test.afterAll(async () => {
  await app?.close()
})

const groceriesRow = () => win.getByRole('row', { name: /^Groceries\b/ })

test('monthly-budget/03#AC11 switching the budget source changes the Monitoring figures', async () => {
  await win.evaluate(() => { window.location.hash = '#/monthly-monitoring' })
  const source = win.getByLabel('Budget source')
  await expect(source).toBeVisible()

  // Notion (default): today's category budget.
  await expect(win.getByText('Notion budgets')).toBeVisible()
  await expect(groceriesRow()).toContainText('8,000.00')

  // Saved with nothing saved yet: same figures, and the badge says so.
  await source.getByRole('button', { name: 'Saved' }).click()
  await expect(win.getByText('No budget saved')).toBeVisible()
  await expect(groceriesRow()).toContainText('8,000.00')

  // The budget action buttons start hidden and an icon button shows them, like Filters on Expense.
  await expect(win.getByRole('button', { name: 'Edit budgets' })).toHaveCount(0)
  await win.getByRole('button', { name: 'Budget actions' }).click()

  // Save a different budget for this month.
  await win.getByRole('button', { name: 'Edit budgets' }).click()
  const input = win.getByLabel('Groceries')
  await expect(input).toHaveValue('8000')
  await input.fill('5000')
  await win.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(win.getByRole('dialog')).toHaveCount(0)
  await expect(win.getByText('Saved budgets', { exact: true })).toBeVisible()
  await expect(groceriesRow()).toContainText('5,000.00')
  await expect(groceriesRow()).not.toContainText('Notion')

  // Back to Notion: the figure returns, and the saved set is still there for next time.
  await source.getByRole('button', { name: 'Notion' }).click()
  await expect(groceriesRow()).toContainText('8,000.00')
  await expect(groceriesRow()).not.toContainText('5,000.00')
  await source.getByRole('button', { name: 'Saved' }).click()
  await expect(groceriesRow()).toContainText('5,000.00')
})
