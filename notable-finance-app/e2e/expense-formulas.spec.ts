import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// Exercise persisted inputs through SQLite → IPC → production renderer on every OS.
// No Notion credentials, real user profile, or mocked formula implementation is used.
test.use({ trace: 'retain-on-failure', screenshot: 'only-on-failure' })

let app: ElectronApplication
let win: Page
let userData: string
const today = new Date()
const year = today.getFullYear()
const month = today.getMonth()
const purchaseDate = `${year}-${String(month + 1).padStart(2, '0')}-10`
const cases = [
  { label: 'blank', adjustment: null, monthOffset: 6, amount: 25000, interest: 0, periods: 6, paid: 2, installment: 4166.67, received: 8333.33, remaining: 16666.67, balance: 16666.67 },
  { label: 'zero', adjustment: 0, monthOffset: 6, amount: 25000, interest: 0, periods: 6, paid: 2, installment: 4166.67, received: 8333.33, remaining: 16666.67, balance: 16666.67 },
  { label: 'one', adjustment: 1, monthOffset: 7, amount: 25000, interest: 0, periods: 6, paid: 2, installment: 4166.67, received: 8333.33, remaining: 16666.67, balance: 16666.67 },
  // Owner-confirmed balance includes interest: gross 990 minus received 330 = 660.
  { label: 'interest', adjustment: null, monthOffset: 3, amount: 900, interest: 90, periods: 3, paid: 1, installment: 330, received: 330, remaining: 660, balance: 660 },
]
const money = (amount: number) => new Intl.NumberFormat('en-PH', {
  style: 'currency', currency: 'PHP', maximumFractionDigits: 2,
}).format(amount)
const dueDate = (monthOffset: number) => new Intl.DateTimeFormat('en-PH', {
  month: 'short', day: 'numeric', year: 'numeric',
}).format(new Date(year, month + monthOffset, 10))
const launch = () => electron.launch({ args: ['.'], env: { ...process.env, NF_USER_DATA_DIR: userData } })

test.beforeAll(async () => {
  userData = mkdtempSync(join(tmpdir(), 'nf-expense-formulas-'))
  const first = await launch()
  await first.firstWindow()
  await first.close()
  // Node's built-in SQLite avoids loading Electron's native better-sqlite3 ABI.
  execFileSync(process.execPath, ['-e', `
    const { DatabaseSync } = require('node:sqlite')
    const { join } = require('node:path')
    const db = new DatabaseSync(join(process.env.NF_USER_DATA_DIR, 'notable-finance.sqlite'))
    const now = Date.now()
    db.prepare('INSERT INTO accounts (id, notion_page_id, account_name, account_type, inactive, billing_day, due_day, created_at) VALUES (?, ?, ?, ?, 0, 15, 10, ?)')
      .run('formula-card', 'synced-formula-card', 'Formula Credit Card', 'Credit Account', now)
    db.prepare('INSERT INTO expense_categories (id, notion_page_id, name, created_at) VALUES (?, ?, ?, ?)')
      .run('formula-pasabuy', 'synced-formula-pasabuy', 'Pasabuy', now)
    const insert = db.prepare(
      'INSERT INTO expenses (id, notion_page_id, title, amount, interest, account_id, category_id, purchase_date, payment_status, payment_frequency, period_count, bnpl_adjustment, paid_period, is_pasabuy, pasabuy_status, pasabuy_paid_period, pasabuy_account_receiver_id, sync_state, local_updated_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)'
    )
    for (const fixture of ${JSON.stringify(cases)}) {
      insert.run('formula-' + fixture.label, 'synced-formula-' + fixture.label,
        'Monthly installment BNPL ' + fixture.label, fixture.amount, fixture.interest, 'formula-card', 'formula-pasabuy',
        ${JSON.stringify(purchaseDate)}, 'Installment', 'Monthly', fixture.periods, fixture.adjustment, fixture.paid,
        'Payment partially received (installment)', fixture.paid, 'formula-card', 'clean', now, now)
    }
    db.close()
  `], { env: { ...process.env, NF_USER_DATA_DIR: userData }, stdio: 'pipe' })
  app = await launch()
  win = await app.firstWindow()
  await win.waitForSelector('.sidebar')
  await win.evaluate(() => { window.location.hash = '#/expense' })
  await win.getByRole('button', { name: 'Installments', exact: true }).click()
  await win.getByRole('button', { name: 'Filters', exact: true }).click()
  await win.getByRole('button', { name: 'All Categories', exact: true }).click()
  await win.getByRole('button', { name: 'Pasabuy', exact: true }).click()
})

test.afterAll(async () => { await app?.close() })

for (const fixture of cases) {
  test(`saved monthly installment calculates with ${fixture.label} BNPL adjustment`, async () => {
    const title = `Monthly installment BNPL ${fixture.label}`
    const row = win.getByRole('row').filter({ hasText: title })
    const headers = await win.getByRole('columnheader').allTextContents()
    const cell = (heading: string) => {
      const index = headers.findIndex(text => text.trim() === heading)
      expect(index, `Table includes ${heading}`).toBeGreaterThanOrEqual(0)
      return row.getByRole('cell').nth(index)
    }
    await expect(cell('Expected payment date')).toHaveText(dueDate(fixture.monthOffset))
    await expect(cell('Installment Amount')).toHaveText(money(fixture.installment))
    await expect(cell('Paid Amount')).toHaveText(money(fixture.received))
    await expect(cell('Remaining Balance')).toHaveText(money(fixture.remaining))
    await expect(cell('Pasabuyer Balance')).toHaveText(money(fixture.balance))
    await row.getByText(title, { exact: true }).click()
    const dialog = win.getByRole('dialog', { name: title })
    const computed = (label: string) => dialog.locator('div').filter({
      has: win.locator('span', { hasText: new RegExp(`^${label}$`) }),
    }).filter({ has: win.locator('strong') }).last().locator('strong')
    // Confirm inputs survive persistence; a rendered zero must not mask missing data.
    await expect(dialog.getByLabel('Purchase Date', { exact: true })).toHaveValue(purchaseDate)
    await expect(dialog.getByRole('button', { name: 'Accounts', exact: true })).toHaveText('Formula Credit Card')
    await expect(dialog.getByRole('button', { name: 'Categories', exact: true })).toHaveText('Pasabuy')
    await expect(dialog.getByRole('combobox', { name: 'Payment Frequency', exact: true })).toHaveValue('Monthly')
    await expect(dialog.getByRole('combobox', { name: 'Payment Status', exact: true })).toHaveValue('Installment')
    await expect(dialog.getByRole('combobox', { name: 'Pasabuy Status', exact: true })).toHaveValue('Payment partially received (installment)')
    await expect(dialog.getByLabel('Period Count', { exact: true })).toHaveValue(String(fixture.periods))
    await expect(dialog.getByLabel('Paid period', { exact: true })).toHaveValue(String(fixture.paid))
    await expect(dialog.getByLabel('Pasabuy paid period', { exact: true })).toHaveValue(String(fixture.paid))
    await expect(dialog.getByLabel('BNPL adjustment', { exact: true })).toHaveValue(fixture.adjustment == null ? '' : String(fixture.adjustment))
    await expect(computed('Expected payment date')).toHaveText(dueDate(fixture.monthOffset))
    await expect(computed('Pasabuy Received Amount')).toHaveText(money(fixture.received))
    await expect(computed('Pasabuyer Balance')).toHaveText(money(fixture.balance))
    await expect(computed('Remaining Balance')).toHaveText(money(fixture.remaining))
    await dialog.getByRole('button', { name: 'Close modal' }).click()
  })
}
