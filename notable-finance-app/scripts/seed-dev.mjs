// Dev-only seeder for the LOCAL reference cache (accounts + categories).
// These are read-only in the app (maintained in Notion; pulled in Phase 3) — this script
// stands in for that pull during offline development. Idempotent: skips rows that exist.
// Usage: pnpm --filter notable-finance-app seed   (run the app once first so the DB exists)
import { DatabaseSync } from 'node:sqlite'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

function userDataDir() {
  if (process.env.NF_USER_DATA_DIR) return process.env.NF_USER_DATA_DIR
  if (process.platform === 'darwin') return join(homedir(), 'Library', 'Application Support', 'notable-finance-app')
  if (process.platform === 'win32') return join(process.env.APPDATA ?? '', 'notable-finance-app')
  return join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), 'notable-finance-app')
}

const dbPath = join(userDataDir(), 'notable-finance.sqlite')
if (!existsSync(dbPath)) {
  console.error(`No database at ${dbPath} — run the app once first (pnpm dev).`)
  process.exit(1)
}

const db = new DatabaseSync(dbPath)
const now = Date.now()

const ACCOUNTS = [
  { name: 'Cash on Hand', type: 'Cash', starting: 5000, limit: null },
  { name: 'BPI Savings', type: 'Savings', starting: 20000, limit: null },
  { name: 'GCash', type: 'e-Wallet', starting: 1500, limit: null },
  { name: 'Visa Platinum', type: 'Credit Account', starting: 0, limit: 50000 }
]

// Auxiliary income categories are the workflow categories (Transfer / Credit Card
// Payment / Savings) — excluded from the plain Income view, exactly like the web app.
const INCOME_CATEGORIES = [
  { source: 'Salary', auxiliary: 0 },
  { source: 'Freelance', auxiliary: 0 },
  { source: 'Transfer', auxiliary: 1 },
  { source: 'Credit Card Payment', auxiliary: 1 },
  { source: 'Savings', auxiliary: 1 }
]

const EXPENSE_CATEGORIES = [
  { name: 'Food', budget: 8000 },
  { name: 'Transport', budget: 3000 },
  { name: 'Rent', budget: 12000 },
  { name: 'Pasabuy', budget: 0 }
]

let added = 0

const accSelect = db.prepare('SELECT id FROM accounts WHERE account_name = ?')
const accInsert = db.prepare(
  `INSERT INTO accounts (id, account_name, account_type, starting_balance, credit_limit, inactive, created_at)
   VALUES (?, ?, ?, ?, ?, 0, ?)`
)
for (const a of ACCOUNTS) {
  if (!accSelect.get(a.name)) {
    accInsert.run(randomUUID(), a.name, a.type, a.starting, a.limit, now)
    added++
  }
}

const icSelect = db.prepare('SELECT id FROM income_categories WHERE source = ?')
const icInsert = db.prepare(
  'INSERT INTO income_categories (id, source, auxiliary, created_at) VALUES (?, ?, ?, ?)'
)
for (const c of INCOME_CATEGORIES) {
  if (!icSelect.get(c.source)) {
    icInsert.run(randomUUID(), c.source, c.auxiliary, now)
    added++
  }
}

const ecSelect = db.prepare('SELECT id FROM expense_categories WHERE name = ?')
const ecInsert = db.prepare(
  'INSERT INTO expense_categories (id, name, monthly_budget, auxiliary, created_at) VALUES (?, ?, ?, 0, ?)'
)
for (const c of EXPENSE_CATEGORIES) {
  if (!ecSelect.get(c.name)) {
    ecInsert.run(randomUUID(), c.name, c.budget, now)
    added++
  }
}

db.close()
console.log(`Seeded ${added} reference rows into ${dbPath}`)
