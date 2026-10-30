import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test.use({ trace: 'retain-on-failure', screenshot: 'only-on-failure' })
let app: ElectronApplication
let win: Page
let userData: string
const now = new Date()
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
const launch = () => electron.launch({ args: ['.'], env: { ...process.env, NF_USER_DATA_DIR: userData } })

test.beforeAll(async () => {
  userData = mkdtempSync(join(tmpdir(), 'nf-receivable-pasabuy-'))
  const first = await launch(); await first.firstWindow(); await first.close()
  execFileSync(process.execPath, ['-e', `
    const { DatabaseSync } = require('node:sqlite')
    const { join } = require('node:path')
    const db = new DatabaseSync(join(process.env.NF_USER_DATA_DIR, 'notable-finance.sqlite'))
    db.prepare("INSERT INTO accounts (id, notion_page_id, account_name, account_type, created_at) VALUES ('a', 'notion-a', 'Wallet', 'Cash', 0)").run()
    db.prepare("INSERT INTO expense_categories (id, notion_page_id, name, auxiliary, created_at) VALUES ('pasabuy', 'notion-pasabuy', 'Pasabuy', 1, 0)").run()
    db.prepare("INSERT INTO income_categories (id, notion_page_id, source, created_at) VALUES ('salary', 'notion-salary', 'Salary', 0)").run()
    db.close()
  `], { env: { ...process.env, NF_USER_DATA_DIR: userData }, stdio: 'pipe' })
  app = await launch(); win = await app.firstWindow(); await win.waitForSelector('.sidebar')
  await win.evaluate(async (date) => {
    for (let index = 1; index <= 3; index++) {
      const result = await window.api.expenses.create({
        description: `Pasabuy ${index}`, purchaseDate: date, datePaid: date, amount: 1000, interest: 0,
        accountId: 'a', categoryId: 'pasabuy', paymentStatus: 'Paid', periodCount: 1, paidPeriod: 1,
        pasabuyer: 'Ana', pasabuyStatus: 'Payment partially received', pasabuyPaidPeriod: 0.4,
        pasabuyAccountReceiverId: 'a',
      })
      if (!result.ok) throw new Error(result.error.message)
    }
    const result = await window.api.incomes.create({ name: 'Other receivable', date, grossIncome: 100, categoryId: 'salary' })
    if (!result.ok) throw new Error(result.error.message)
    window.location.hash = '#/receivables'
  }, date)
  await expect(win.getByRole('table')).toBeVisible()
})
test.afterAll(async () => { await app?.close() })

test('opens Pasabuy-only details in Receivables and preserves hidden expense fields on save', async () => {
  await win.getByRole('row').filter({ hasText: 'Pasabuy 1' }).click()
  const dialog = win.getByRole('dialog', { name: 'Pasabuy receivable' })
  await expect(dialog.getByLabel('Purchase description')).toHaveValue('Pasabuy 1')
  await expect(dialog.getByLabel('Expense Amount', { exact: true })).toHaveCount(0)
  await expect(dialog.getByLabel('Payment Status', { exact: true })).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Edit', exact: true }).click()
  await dialog.getByLabel('Purchase description').fill('Updated Pasabuy 1')
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  expect(await win.evaluate(() => window.location.hash)).toBe('#/receivables')
  const result = await win.evaluate(() => window.api.expenses.list())
  expect(result.ok && result.data.find((record) => record.description === 'Updated Pasabuy 1')).toMatchObject({
    amount: 1000, accountId: 'a', categoryId: 'pasabuy', paymentStatus: 'Paid', paidPeriod: 1,
  })
})

test('row checkboxes work by keyboard and header select-all includes both record types', async () => {
  const row = win.getByRole('row').filter({ hasText: 'Updated Pasabuy 1' })
  const checkbox = row.getByRole('button', { name: 'Select row', exact: true })
  await checkbox.focus(); await checkbox.press('Space')
  await expect(checkbox).toHaveAttribute('aria-pressed', 'true')
  await expect(win.getByRole('dialog')).toHaveCount(0)
  await checkbox.press('Enter')
  await expect(checkbox).toHaveAttribute('aria-pressed', 'false')
  await expect(win.getByRole('dialog')).toHaveCount(0)
  const all = win.getByRole('button', { name: 'Select all rows', exact: true })
  await all.click()
  await expect(win.getByText('4 selected', { exact: true })).toBeVisible()
  await expect(win.getByRole('button', { name: 'Bulk Pasabuy', exact: true })).toHaveCount(0)
  await expect(win.getByRole('button', { name: 'Duplicate', exact: true })).toHaveCount(0)
  await all.click()
  await expect(win.getByText('4 selected', { exact: true })).toHaveCount(0)
  await expect(all).toHaveAttribute('aria-pressed', 'false')
})

test('Bulk Pasabuy updates only Pasabuy inputs on selected expenses and refreshes Receivables', async () => {
  for (const name of ['Updated Pasabuy 1', 'Pasabuy 2', 'Pasabuy 3']) {
    await win.getByRole('row').filter({ hasText: name }).getByRole('button', { name: 'Select row', exact: true }).click()
  }
  await win.getByRole('button', { name: 'Bulk Pasabuy', exact: true }).click()
  const dialog = win.getByRole('dialog', { name: 'Bulk Pasabuy · 3 expenses' })
  await expect(dialog.getByRole('option', { name: 'Expense Amount', exact: true })).toHaveCount(0)
  await expect(dialog.getByRole('option', { name: 'Bulk CC Pay', exact: true })).toHaveCount(0)
  await dialog.getByLabel('New value').nth(2).selectOption('a')
  await dialog.getByRole('button', { name: 'Apply to selected', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(win.getByRole('row').filter({ hasText: 'Pasabuy · Expense' })).toHaveCount(0)
  await expect(win.getByRole('row').filter({ hasText: 'Other receivable' })).toBeVisible()
  const result = await win.evaluate(() => window.api.expenses.list())
  expect(result.ok && result.data).toHaveLength(3)
  if (result.ok) for (const record of result.data) expect(record).toMatchObject({
    amount: 1000, accountId: 'a', categoryId: 'pasabuy', paymentStatus: 'Paid', paidPeriod: 1,
    pasabuyStatus: 'Payment fully received', pasabuyPaidPeriod: 1, pasabuyAccountReceiverId: 'a', pasabuyBalance: 0,
  })
})
