import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test.use({ trace: 'retain-on-failure', screenshot: 'only-on-failure' })
let app: ElectronApplication
let win: Page
let userData: string
const today = new Date()
const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
const launch = () => electron.launch({ args: ['.'], env: { ...process.env, NF_USER_DATA_DIR: userData } })

test.beforeAll(async () => {
  userData = mkdtempSync(join(tmpdir(), 'nf-money-lent-'))
  const first = await launch(); await first.firstWindow(); await first.close()
  execFileSync(process.execPath, ['-e', `
    const { DatabaseSync } = require('node:sqlite')
    const { join } = require('node:path')
    const db = new DatabaseSync(join(process.env.NF_USER_DATA_DIR, 'notable-finance.sqlite'))
    for (const [id, name] of [['a', 'Wallet'], ['b', 'Bank']]) {
      db.prepare('INSERT INTO accounts (id, notion_page_id, account_name, account_type, created_at) VALUES (?, ?, ?, ?, 0)').run(id, 'notion-' + id, name, 'Cash')
    }
    for (const [id, source] of [['loan', 'Money Lent'], ['savings', 'Savings'], ['transfer', 'Transfer']]) {
      db.prepare('INSERT INTO income_categories (id, notion_page_id, source, auxiliary, created_at) VALUES (?, ?, ?, 1, 0)').run(id, 'notion-' + id, source)
    }
    db.close()
  `], { env: { ...process.env, NF_USER_DATA_DIR: userData }, stdio: 'pipe' })
  app = await launch(); win = await app.firstWindow(); await win.waitForSelector('.sidebar')
})
test.afterAll(async () => { await app?.close() })

async function balances() {
  return win.evaluate(async () => {
    const result = await window.api.accounts.list()
    if (!result.ok) throw new Error(result.error.message)
    return Object.fromEntries(result.data.map((a) => [a.id, a.currentBalance]))
  })
}
async function createLoan(name: string, useCategoryPicker = false) {
  await win.evaluate(() => { window.location.hash = '#/receivables' })
  await win.getByRole('button', { name: useCategoryPicker ? /New Record/ : 'Lend money' }).click()
  const dialog = win.getByRole('dialog')
  if (useCategoryPicker) {
    await dialog.getByRole('button', { name: 'Categories', exact: true }).click()
    await dialog.getByRole('button', { name: 'Money Lent', exact: true }).click()
  }
  await dialog.getByPlaceholder('Money Lent title').fill(name)
  await dialog.locator('input[type="date"]').fill(date)
  await dialog.getByPlaceholder('0.00', { exact: true }).fill('1000')
  await dialog.getByRole('button', { name: 'Source Account', exact: true }).click()
  await dialog.getByRole('button', { name: 'Wallet', exact: true }).click()
  await dialog.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  const row = win.getByRole('row').filter({ hasText: name })
  await expect(row).toContainText('₱1,000.00')
  await expect(row).not.toContainText('-₱1,000.00')
}
async function settle(name: string, destination?: string) {
  await win.getByRole('row').filter({ hasText: name }).click()
  await win.getByRole('button', { name: 'Record repayment', exact: true }).click()
  const dialog = win.getByRole('dialog', { name: 'Record full repayment' })
  if (destination) {
    await dialog.getByRole('button', { name: 'Transfer to another account', exact: true }).click()
    await expect(dialog.getByRole('button', { name: 'Convert to Transfer', exact: true })).toBeDisabled()
    await dialog.getByRole('button', { name: 'Transfer Account', exact: true }).click()
    await expect(dialog.getByRole('button', { name: 'Wallet', exact: true })).toHaveCount(0)
    await dialog.getByRole('button', { name: destination, exact: true }).click()
    await expect(dialog).toContainText('Convert this loan to a Transfer from Wallet to Bank')
  } else {
    await expect(dialog).toContainText('Soft-delete this loan and restore ₱1,000.00 to Wallet')
  }
  await dialog.getByRole('button', { name: destination ? 'Convert to Transfer' : 'Confirm full repayment', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(win.getByRole('row').filter({ hasText: name })).toHaveCount(0)
}

test('full same-account repayment restores the balance even with hard-delete enabled', async () => {
  await win.evaluate(() => window.api.settings.update({ hardDeleteEnabled: true }))
  await createLoan('Same account loan')
  expect(await balances()).toEqual({ a: -1000, b: 0 })
  await settle('Same account loan')
  expect(await balances()).toEqual({ a: 0, b: 0 })
  const deleted = await win.evaluate(() => window.api.incomes.list({ includeDeleted: true, view: 'moneyLent' }))
  expect(deleted.ok && deleted.data[0]).toMatchObject({ deleted: true, grossIncome: 0 })
})

test('full cross-account repayment converts the original loan to Transfer', async () => {
  await createLoan('Different account loan', true)
  expect(await balances()).toEqual({ a: -1000, b: 0 })
  await settle('Different account loan', 'Bank')
  expect(await balances()).toEqual({ a: -1000, b: 1000 })
  await win.evaluate(() => { window.location.hash = '#/transfer' })
  const row = win.getByRole('row').filter({ hasText: 'Different account loan' })
  await expect(row).toContainText('Wallet')
  await expect(row).toContainText('Bank')
})

test('explicitly reclassifies negative Alkansya without changing the balance', async () => {
  await win.evaluate(async (date) => {
    const result = await window.api.incomes.create({ name: 'Old Savings loan', date, grossIncome: -500, accountId: 'a', view: 'alkansya' })
    if (!result.ok) throw new Error(result.error.message)
    window.location.hash = '#/alkansya'
  }, date)
  const before = await balances()
  await win.getByRole('row').filter({ hasText: 'Old Savings loan' }).click()
  await win.getByRole('button', { name: 'Reclassify as money lent', exact: true }).click()
  await win.getByRole('button', { name: 'Reclassify', exact: true }).click()
  await expect(win.getByRole('dialog')).toHaveCount(0)
  expect(await balances()).toEqual(before)
  await win.evaluate(() => { window.location.hash = '#/receivables' })
  await expect(win.getByRole('row').filter({ hasText: 'Old Savings loan' })).toContainText('₱500.00')
})
