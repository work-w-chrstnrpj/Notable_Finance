import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Loan terms flow (borrowing-terms/06). Runs against an isolated, seeded user-data dir, never a real profile.
test.use({ trace: 'retain-on-failure', screenshot: 'only-on-failure' })
let app: ElectronApplication
let win: Page
let userData: string
const today = new Date()
const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
const launch = () => electron.launch({ args: ['.'], env: { ...process.env, NF_USER_DATA_DIR: userData } })

test.beforeAll(async () => {
  userData = mkdtempSync(join(tmpdir(), 'nf-borrowing-terms-'))
  const first = await launch(); await first.firstWindow(); await first.close()
  execFileSync(process.execPath, ['-e', `
    const { DatabaseSync } = require('node:sqlite')
    const { join } = require('node:path')
    const db = new DatabaseSync(join(process.env.NF_USER_DATA_DIR, 'notable-finance.sqlite'))
    for (const [id, name, type] of [['bank', 'Bank', 'Digital Bank'], ['borrow', 'Debt/Loan', 'Auxiliary']]) {
      db.prepare('INSERT INTO accounts (id, notion_page_id, account_name, account_type, created_at) VALUES (?, ?, ?, ?, 0)').run(id, 'notion-' + id, name, type)
    }
    db.prepare('INSERT INTO income_categories (id, notion_page_id, source, auxiliary, created_at) VALUES (?, ?, ?, 1, 0)').run('borrowed', 'notion-borrowed', 'Borrowed Money')
    db.close()
  `], { env: { ...process.env, NF_USER_DATA_DIR: userData }, stdio: 'pipe' })
  app = await launch(); win = await app.firstWindow(); await win.waitForSelector('.sidebar')
})
test.afterAll(async () => { await app?.close() })

test('borrowing-terms/06#AC1 a 150,000 loan with 5,000 interest over 12 months shows 142,083.33 remaining after one linked payment', async () => {
  await win.evaluate(() => { window.location.hash = '#/borrowings' })

  // Create the loan with terms.
  await win.getByRole('button', { name: /New Record/ }).click()
  await win.getByRole('button', { name: /Money you borrowed/ }).click()
  let dialog = win.getByRole('dialog')
  await dialog.getByPlaceholder(/title$/).fill('Borrow: Ana')
  await dialog.locator('input[type="date"]').fill(date)
  await dialog.getByLabel('Amount', { exact: true }).fill('150000')
  await dialog.getByRole('combobox', { name: 'Borrow Account', exact: true }).click()
  await dialog.getByRole('option', { name: 'Debt/Loan', exact: true }).click()
  await dialog.getByRole('combobox', { name: 'Received Into', exact: true }).click()
  await dialog.getByRole('option', { name: 'Bank', exact: true }).click()
  await dialog.getByLabel('Interest', { exact: true }).fill('5000')
  await dialog.getByRole('combobox', { name: /^Payment Frequency/ }).selectOption('Monthly')
  await dialog.getByLabel('Period count', { exact: true }).fill('12')
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog).toHaveCount(0)

  const loanRow = win.getByRole('row').filter({ hasText: 'Borrow: Ana' })
  await expect(loanRow).toContainText('₱155,000.00')

  // Open the loan: computed figures, then record the Suggested payment as a linked repayment.
  await loanRow.click()
  dialog = win.getByRole('dialog')
  await expect(dialog).toContainText('Total owed')
  await expect(dialog).toContainText('₱155,000.00')
  await expect(dialog).toContainText('₱12,916.67')
  await dialog.getByRole('button', { name: 'Record repayment', exact: true }).click()
  dialog = win.getByRole('dialog')
  await expect(dialog.getByLabel('Amount', { exact: true })).toHaveValue('12916.67')
  await expect(dialog.getByRole('combobox', { name: /^Loan/ })).toContainText('Ana')
  await dialog.getByRole('combobox', { name: 'Paid From', exact: true }).click()
  await dialog.getByRole('option', { name: 'Bank', exact: true }).click()
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog).toHaveCount(0)

  // The loan row shows what is left; the modal shows the paid figures.
  await expect(win.getByRole('row').filter({ hasText: 'Borrow: Ana' }).first()).toContainText('₱142,083.33')
  await win.getByRole('row').filter({ hasText: 'Borrow: Ana' }).first().click()
  dialog = win.getByRole('dialog')
  await expect(dialog).toContainText('Remaining balance')
  await expect(dialog).toContainText('₱142,083.33')
  await expect(dialog).toContainText('₱12,916.67')
})

test('repayments can be linked from the loan side with the Payments multi-select', async () => {
  // The previous test leaves the loan's modal open.
  if (await win.getByRole('dialog').count()) await win.getByRole('dialog').getByRole('button', { name: 'Close modal' }).click()
  await win.evaluate(async (date) => {
    const make = async (input: Record<string, unknown>) => {
      const result = await window.api.incomes.create({ date, view: 'borrowings', ...input } as never)
      if (!result.ok) throw new Error(result.error.message)
    }
    await make({ name: 'Borrow: Ben', grossIncome: -1000, accountId: 'borrow', transactedAccountId: 'bank' })
    await make({ name: 'Repayment: Ben one', grossIncome: -400, accountId: 'bank', transactedAccountId: 'borrow' })
    await make({ name: 'Repayment: Ben two', grossIncome: -100, accountId: 'bank', transactedAccountId: 'borrow' })
    window.location.hash = '#/transfer'
    window.location.hash = '#/borrowings'
  }, date)

  const loanRow = win.getByRole('row').filter({ hasText: 'Borrow: Ben' })
  await expect(loanRow).toContainText('—')
  await loanRow.click()
  let dialog = win.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Edit', exact: true }).click()
  const payments = dialog.getByPlaceholder('Search repayments to link...')
  await payments.click()
  await dialog.getByRole('button', { name: /Repayment: Ben one/ }).click()
  await payments.click()
  await dialog.getByRole('button', { name: /Repayment: Ben two/ }).click()
  await expect(dialog).toContainText('Total paid')
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog).toHaveCount(0)

  await expect(win.getByRole('row').filter({ hasText: 'Borrow: Ben' })).toContainText('₱500.00')
  await win.getByRole('row').filter({ hasText: 'Borrow: Ben' }).click()
  dialog = win.getByRole('dialog')
  await expect(dialog).toContainText('Repayment: Ben one')
  await expect(dialog).toContainText('Repayment: Ben two')
  await expect(dialog).toContainText('Payments made')
})
