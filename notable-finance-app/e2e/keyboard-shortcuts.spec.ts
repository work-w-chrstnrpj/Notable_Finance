import { test, expect, _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

let app: ElectronApplication
let win: Page
let userData: string

// See the note in app.spec.ts: launch via the app directory so `app.getAppPath()` is the
// package root (matching dev + packaged), not `<root>/out/main` — otherwise the drizzle
// migrations folder can't be found and no window is ever created.
const launch = (): Promise<ElectronApplication> =>
  electron.launch({
    args: ['.'],
    env: { ...process.env, NF_USER_DATA_DIR: userData },
  })

test.beforeAll(async () => {
  userData = mkdtempSync(join(tmpdir(), 'nf-e2e-shortcuts-'))
  const first = await launch()
  await first.firstWindow()
  await first.close()
  // Seed reference data (categories, accounts without notion_page_id).
  execFileSync('node', ['scripts/seed-dev.mjs'], {
    env: { ...process.env, NF_USER_DATA_DIR: userData },
    stdio: 'ignore',
  })
  // Give seeded accounts a dummy notion_page_id so the app considers them synced
  // (activeAccounts filter in finance-data-context requires account.notionSynced).
  execFileSync('node', ['-e', `
    const { DatabaseSync } = require('node:sqlite')
    const { join } = require('node:path')
    const { randomUUID } = require('node:crypto')
    const dbPath = join(process.env.NF_USER_DATA_DIR, 'notable-finance.sqlite')
    const db = new DatabaseSync(dbPath)
    const uuid = 'seed-' + randomUUID()
    db.prepare('UPDATE accounts SET notion_page_id = ? WHERE notion_page_id IS NULL').run(uuid)
    db.close()
  `], {
    env: { ...process.env, NF_USER_DATA_DIR: userData },
    stdio: 'ignore',
  })
  app = await launch()
  win = await app.firstWindow()
  await win.waitForSelector('.sidebar')
})

test.afterAll(async () => {
  await app?.close()
})

// ── Helpers ───────────────────────────────────────────────────────────────

function keyCode(key: string): string {
  if (/^[a-zA-Z]$/.test(key)) return `Key${key.toUpperCase()}`
  if (/^\d$/.test(key)) return `Digit${key}`
  const map: Record<string, string> = {
    '/': 'Slash', '`': 'Backquote', '~': 'Backquote',
    'ArrowUp': 'ArrowUp', 'ArrowDown': 'ArrowDown',
    'ArrowLeft': 'ArrowLeft', 'ArrowRight': 'ArrowRight',
    'Enter': 'Enter', 'Escape': 'Escape', 'Backspace': 'Backspace',
    'Delete': 'Delete', 'Tab': 'Tab', 'Shift': 'Shift',
  }
  return map[key] ?? key
}

function keyValue(key: string): string {
  // "Digit0" → "0", "Backquote" → "`", "Slash" → "/"
  const digit = /^Digit(\d)$/.exec(key)
  if (digit) return digit[1]
  if (key === 'Backquote') return '`'
  if (key === 'Slash') return '/'
  if (key === 'Enter') return 'Enter'
  if (key === 'Escape') return 'Escape'
  if (key === 'Backspace') return 'Backspace'
  if (key === 'ArrowUp') return 'ArrowUp'
  if (key === 'ArrowDown') return 'ArrowDown'
  return key.toLowerCase()
}

/** Dispatch a native KeyboardEvent in the renderer process. */
async function dispatchKeyEvent(rawKey: string, modifiers: string) {
  const opts: Record<string, boolean> = {}
  for (const m of modifiers.split('+').filter(Boolean)) {
    if (m === 'Meta') opts.metaKey = true
    else if (m === 'Shift') opts.shiftKey = true
    else if (m === 'Control' || m === 'Ctrl') opts.ctrlKey = true
    else if (m === 'Alt') opts.altKey = true
  }
  await win.evaluate(
    ({ key, code, opts }) => {
      const event = new KeyboardEvent('keydown', {
        key,
        code,
        bubbles: true,
        cancelable: true,
        composed: true,
        metaKey: opts.metaKey ?? false,
        ctrlKey: opts.ctrlKey ?? false,
        shiftKey: opts.shiftKey ?? false,
        altKey: opts.altKey ?? false,
      })
      window.dispatchEvent(event)
    },
    { key: keyValue(rawKey), code: keyCode(rawKey), opts },
  )
  await new Promise((r) => setTimeout(r, 80))
}

/** Press a combo like "Meta+1" or "Meta+Shift+H". */
async function press(combo: string) {
  const parts = combo.split('+')
  const key = parts.pop()!
  await dispatchKeyEvent(key, parts.join('+'))
}

async function waitForHash(hash: string) {
  await win.waitForFunction((h) => window.location.hash === h, hash, { timeout: 10_000 })
}

async function goTo(section: string, hash: string) {
  await win.locator('.nav__item', { hasText: section }).click()
  await waitForHash(hash)
}

async function selectFilterDropdownItem(index: number, itemText: string) {
  const dd = win.locator('.modal-panel .filter-dropdown').nth(index)
  await dd.locator('.filter-dropdown__trigger').click()
  await new Promise((r) => setTimeout(r, 200))
  const clicked = await win.evaluate(({ idx, text }) => {
    const dds = document.querySelectorAll<HTMLElement>('.modal-panel .filter-dropdown')
    const dd = dds[idx]
    if (!dd) return { ok: false, reason: `no dropdown at ${idx}` }
    const items = dd.querySelectorAll<HTMLButtonElement>('.filter-dropdown__item')
    for (const btn of items) {
      const t = btn.textContent?.trim() ?? ''
      if (t === text || t.includes(text)) {
        btn.click()
        return { ok: true }
      }
    }
    return { ok: false, reason: `"${text}" not in items (${Array.from(items).map(b => b.textContent?.trim()).join(', ')})` }
  }, { idx: index, text: itemText })
  if (!clicked.ok) throw new Error(clicked.reason)
}

async function createTestExpense() {
  await goTo('Expense', '#/expense')
  await press('Meta+N')
  await expect(win.locator('.modal-panel')).toBeVisible({ timeout: 5_000 })
  const descInput = win.locator('.modal-panel input').first()
  await descInput.fill('E2E Test Expense')
  // Today's date, not a hardcoded one — the Expense page's default Monthly view only
  // shows the currently-selected month, so a fixed past date silently ages out of view.
  const todayIso = new Date().toISOString().slice(0, 10)
  const purchaseDateInput = win.locator('.modal-panel input[type="date"]').first()
  await purchaseDateInput.fill(todayIso)
  await selectFilterDropdownItem(0, 'BPI Savings')
  await selectFilterDropdownItem(1, 'Food')
  const amountInput = win.locator('.modal-panel input[inputMode="decimal"]')
  if (await amountInput.isVisible()) {
    await amountInput.fill('100')
  }
  await press('Meta+S')
  await expect(win.locator('.modal-panel')).not.toBeVisible({ timeout: 10_000 })
}

// ── Navigation shortcuts (Mod+1…9, Mod+Shift+...) ─────────────────────────

test.describe('Navigation shortcuts', () => {
  const cases: Array<{ combo: string; hash: string; section: string }> = [
    { combo: 'Meta+1', hash: '#/dashboard', section: 'Dashboard' },
    { combo: 'Meta+2', hash: '#/accounts', section: 'Accounts' },
    { combo: 'Meta+3', hash: '#/income', section: 'Income' },
    { combo: 'Meta+4', hash: '#/expense', section: 'Expense' },
    { combo: 'Meta+5', hash: '#/monthly-monitoring', section: 'Monitoring' },
    { combo: 'Meta+6', hash: '#/transfer', section: 'Transfer' },
    { combo: 'Meta+7', hash: '#/credit-card-payment', section: 'CC Payment' },
    { combo: 'Meta+8', hash: '#/alkansya', section: 'Alkansya' },
    { combo: 'Meta+9', hash: '#/receivables', section: 'Receivables' },
    { combo: 'Meta+Shift+H', hash: '#/history', section: 'History' },
    { combo: 'Meta+Shift+O', hash: '#/sync', section: 'Sync' },
    { combo: 'Meta+Shift+S', hash: '#/settings', section: 'Settings' },
  ]
  for (const { combo, hash, section } of cases) {
    test(`${combo} navigates to ${section}`, async () => {
      await press('Meta+1')
      await waitForHash('#/dashboard')
      await press(combo)
      await waitForHash(hash)
      const activeItem = win.locator('.nav__item--active')
      await expect(activeItem).toContainText(section, { timeout: 5_000 })
    })
  }

  test('Meta+Shift+L navigates to Dev Logs (when dev mode enabled)', async () => {
    await press('Meta+Shift+S') // Settings
    await waitForHash('#/settings')
    const devSwitch = win.locator('label[aria-label="Enable Dev Mode"]')
    await devSwitch.click()
    await press('Meta+Shift+L')
    await waitForHash('#/dev-logs')
    const activeItem = win.locator('.nav__item--active')
    await expect(activeItem).toContainText('Dev Logs', { timeout: 5_000 })
  })
})

// ── General shortcuts ─────────────────────────────────────────────────────

test.describe('General shortcuts', () => {
  test('⌘+/ opens and closes the cheat sheet', async () => {
    await press('Meta+1')
    await waitForHash('#/dashboard')
    await press('Meta+/')
    const cheatSheet = win.locator('.cheat-sheet')
    await expect(cheatSheet).toBeVisible({ timeout: 5_000 })
    await expect(cheatSheet.locator('#cheat-sheet-title')).toHaveText('Keyboard shortcuts')
    await press('Meta+/')
    await expect(cheatSheet).not.toBeVisible({ timeout: 5_000 })
  })

  test('Escape closes the cheat sheet', async () => {
    await press('Meta+1')
    await waitForHash('#/dashboard')
    await press('Meta+/')
    await expect(win.locator('.cheat-sheet')).toBeVisible({ timeout: 5_000 })
    await win.keyboard.press('Escape')
    await expect(win.locator('.cheat-sheet')).not.toBeVisible({ timeout: 5_000 })
  })

  test('holding Meta reveals shortcut hints on nav items', async () => {
    await press('Meta+1')
    await waitForHash('#/dashboard')
    await win.keyboard.down('Meta')
    await win.waitForSelector('.shortcuts-revealed', { timeout: 3_000 })
    const hints = win.locator('.shortcut-hint')
    await expect(hints.first()).toBeVisible({ timeout: 3_000 })
    await win.keyboard.up('Meta')
    await expect(win.locator('.shortcut-hint').first()).not.toBeVisible({ timeout: 3_000 })
  })
})

// ── View-scoped shortcuts ─────────────────────────────────────────────────

test.describe('Income view shortcuts', () => {
  test('⌘+N opens New Income modal', async () => {
    await press('Meta+3')
    await waitForHash('#/income')
    await press('Meta+N')
    const modal = win.locator('.modal-panel')
    await expect(modal).toBeVisible({ timeout: 5_000 })
    await expect(modal).toContainText('New Income')
    await win.keyboard.press('Escape')
    await expect(modal).not.toBeVisible({ timeout: 5_000 })
  })

  test('⌘+F toggles search on Income', async () => {
    await press('Meta+3')
    await waitForHash('#/income')
    await press('Meta+F')
    const searchInput = win.locator('input[placeholder="Search income..."]')
    await expect(searchInput).toBeVisible({ timeout: 5_000 })
    await press('Meta+F')
    await expect(searchInput).not.toBeVisible({ timeout: 5_000 })
  })

  test('⌘+Shift+F toggles filters on Income', async () => {
    await press('Meta+3')
    await waitForHash('#/income')
    await press('Meta+Shift+F')
    const filterDropdown = win.locator('text=All Accounts')
    await expect(filterDropdown).toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Expense view shortcuts', () => {
  test('⌘+N opens New Expense modal', async () => {
    await press('Meta+4')
    await waitForHash('#/expense')
    await press('Meta+N')
    const modal = win.locator('.modal-panel')
    await expect(modal).toBeVisible({ timeout: 5_000 })
    await expect(modal).toContainText('New Expense')
    await win.keyboard.press('Escape')
    await expect(modal).not.toBeVisible({ timeout: 5_000 })
  })

  test('⌘+F toggles search on Expense', async () => {
    await press('Meta+4')
    await waitForHash('#/expense')
    await press('Meta+F')
    const searchInput = win.locator('input[placeholder="Search expenses..."]')
    await expect(searchInput).toBeVisible({ timeout: 5_000 })
    await press('Meta+F')
    await expect(searchInput).not.toBeVisible({ timeout: 5_000 })
  })
})

test.describe('Accounts view shortcuts', () => {
  test('⌘+Ctrl+~ toggles Account layout', async () => {
    await press('Meta+2')
    await waitForHash('#/accounts')
    await press('Meta+Control+Backquote')
  })

  test('⌘+Ctrl+0 toggles Hide zero balance', async () => {
    await press('Meta+2')
    await waitForHash('#/accounts')
    await press('Meta+Control+Digit0')
  })
})

// ── Record modal shortcuts ────────────────────────────────────────────────

test.describe('Record modal shortcuts', () => {
  test('⌘+D duplicates an expense record', async () => {
    await createTestExpense()
    const firstRow = win.locator('table tbody tr, .data-table tbody tr').first()
    await expect(firstRow).toBeVisible({ timeout: 5_000 })
    await firstRow.click()
    await expect(win.locator('.modal-panel')).toBeVisible({ timeout: 5_000 })
    await press('Meta+D')
    const modal = win.locator('.modal-panel')
    await expect(modal).toBeVisible({ timeout: 5_000 })
    await expect(modal).toContainText('Copy')
    await win.keyboard.press('Escape')
    await expect(modal).not.toBeVisible({ timeout: 5_000 })
  })

  test('⌘+S saves while editing an expense record', async () => {
    await createTestExpense()
    const firstRow = win.locator('table tbody tr, .data-table tbody tr').first()
    await expect(firstRow).toBeVisible({ timeout: 5_000 })
    await firstRow.click()
    await expect(win.locator('.modal-panel')).toBeVisible({ timeout: 5_000 })
    await press('Meta+E')
    await press('Meta+S')
    await expect(win.locator('.modal-panel')).not.toBeVisible({ timeout: 10_000 })
  })

  test('⌘+Backspace triggers delete confirmation on expense record', async () => {
    await createTestExpense()
    const firstRow = win.locator('table tbody tr, .data-table tbody tr').first()
    await expect(firstRow).toBeVisible({ timeout: 5_000 })
    await firstRow.click()
    await expect(win.locator('.modal-panel')).toBeVisible({ timeout: 5_000 })
    await press('Meta+Backspace')
    const confirmDialog = win.locator('[class*="confirm"], [role="alertdialog"]')
    await expect(confirmDialog).toBeVisible({ timeout: 5_000 })
    // Clean up — close confirm dialog and modal so the next test starts clean
    await confirmDialog.locator('button', { hasText: 'Cancel' }).click()
    await expect(confirmDialog).not.toBeVisible({ timeout: 3_000 })
    await win.keyboard.press('Escape')
    await expect(win.locator('.modal-panel')).not.toBeVisible({ timeout: 3_000 })
  })
})

// ── Scope guard ───────────────────────────────────────────────────────────

test.describe('Scope guard tests', () => {
  test('navigation shortcut does not fire when modal is open', async () => {
    await press('Meta+3')
    await waitForHash('#/income')
    await press('Meta+N')
    await expect(win.locator('.modal-panel')).toBeVisible({ timeout: 5_000 })
    await press('Meta+4')
    await expect(win.locator('.modal-panel')).toBeVisible({ timeout: 3_000 })
    await expect(win.locator('.modal-panel')).toContainText('New Income')
    await win.keyboard.press('Escape')
    await expect(win.locator('.modal-panel')).not.toBeVisible({ timeout: 3_000 })
    await new Promise((r) => setTimeout(r, 200))
    await press('Meta+4')
    await waitForHash('#/expense')
  })
})

// ── Sync shortcuts ────────────────────────────────────────────────────────

test.describe('Sync shortcuts', () => {
  test('⌘+Shift+Enter (full sync) triggers sync pass', async () => {
    await press('Meta+1')
    await waitForHash('#/dashboard')
    await press('Meta+Shift+Enter')
  })
})

// ── Undo/Redo ─────────────────────────────────────────────────────────────

test.describe('Undo/Redo shortcuts', () => {
  test('⌘+Z and ⌘+Shift+Z can be pressed without error', async () => {
    await press('Meta+1')
    await waitForHash('#/dashboard')
    await press('Meta+Z')
    await press('Meta+Shift+Z')
  })
})
