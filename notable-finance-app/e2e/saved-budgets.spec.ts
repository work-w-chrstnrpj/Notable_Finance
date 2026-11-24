import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// monthly-budget/03#AC11: switching the Budget source on Monitoring changes the figures.
// custom-budget/03#AC1: Monitoring offers no way to edit or export custom budgets.
// Isolated userData; one non-auxiliary category with a Default budget of 8,000 and a cached Custom budget of 5,000 for this month.
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
    // A saved Custom monthly budget database ID, so the Custom option is enabled (custom-budget/01).
    db.prepare("INSERT INTO app_settings (key, value) VALUES ('notion.mapping', ?)").run(JSON.stringify({ savedBudgets: 'db-1' }))
    const month = new Date().toISOString().slice(0, 7)
    db.prepare("INSERT INTO monthly_budget_snapshots (id, month, category_id, category_name, budget, created_at, updated_at) VALUES ('s1', ?, 'groceries', 'Groceries', 5000, 0, 0)").run(month)
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

  // Default: today's category budget.
  await expect(win.getByText('Default budgets')).toBeVisible()
  await expect(groceriesRow()).toContainText('8,000.00')

  // Custom: the cached budget from the Custom monthly budget database.
  await source.getByRole('button', { name: 'Custom' }).click()
  await expect(win.getByText('Custom budgets', { exact: true })).toBeVisible()
  await expect(groceriesRow()).toContainText('5,000.00')

  // Nothing to edit, save, import or export from Monitoring.
  for (const gone of ['Export', 'Export actions', 'Edit budgets', 'Save budgets for this month', 'Import CSV']) {
    await expect(win.getByRole('button', { name: gone, exact: true })).toHaveCount(0)
  }

  // Back to Default: the figure returns, and the saved set is still there for next time.
  await source.getByRole('button', { name: 'Default' }).click()
  await expect(groceriesRow()).toContainText('8,000.00')
  await expect(groceriesRow()).not.toContainText('5,000.00')
  await source.getByRole('button', { name: 'Custom' }).click()
  await expect(groceriesRow()).toContainText('5,000.00')
})
