// Dev-only seeder for the LOCAL reference cache (accounts + expense categories).
// These are read-only in the app (maintained in Notion; pulled in Phase 3) — this script
// stands in for that pull during offline development. Idempotent: skips rows that exist.
// Usage: pnpm --filter notable-finance-app seed   (run the app once first so the DB exists)
//
// Every seeded row gets a placeholder notion_page_id: pickers across the app (accounts.tsx,
// finance-data-context.tsx, chat/draft-card.tsx) filter accounts to `notionSynced` — true
// only when notion_page_id is non-empty — specifically to hide ad-hoc local test accounts
// created without ever syncing. Since this script stands in for a real Notion pull, its rows
// need to look synced too, or they're silently invisible everywhere despite existing in the DB.
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

const EXPENSE_CATEGORIES = ['Food', 'Transportation', 'Utilities', 'Entertainment']

let added = 0

const accSelect = db.prepare('SELECT id FROM accounts WHERE account_name = ?')
const accInsert = db.prepare(
  `INSERT INTO accounts (id, notion_page_id, account_name, account_type, starting_balance, credit_limit, inactive, created_at)
   VALUES (?, ?, ?, ?, ?, ?, 0, ?)`
)
for (const a of ACCOUNTS) {
  if (!accSelect.get(a.name)) {
    accInsert.run(randomUUID(), `seed-${randomUUID()}`, a.name, a.type, a.starting, a.limit, now)
    added++
  }
}

const catSelect = db.prepare('SELECT id FROM expense_categories WHERE name = ?')
const catInsert = db.prepare(
  `INSERT INTO expense_categories (id, notion_page_id, name, monthly_budget, auxiliary, created_at)
   VALUES (?, ?, ?, 0, 0, ?)`
)
for (const name of EXPENSE_CATEGORIES) {
  if (!catSelect.get(name)) {
    catInsert.run(randomUUID(), `seed-${randomUUID()}`, name, now)
    added++
  }
}

db.close()
console.log(`Seeded ${added} reference rows into ${dbPath}`)
