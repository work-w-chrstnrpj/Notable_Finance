import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

// Electron is never available in the node test env — mock the pieces the DB and
// backup layers touch. The temp dir is created BEFORE the mocked module loads
// (vi.hoisted) and pointed to by app.getPath('userData').
const state = vi.hoisted(() => {
  // vi.hoisted callbacks run before ES module imports resolve, so require() is the only
  // way to reach these Node builtins here — the standard vi.mock/vi.hoisted interop pattern.
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { mkdtempSync } = require('node:fs') as typeof import('node:fs')
  const { tmpdir } = require('node:os') as typeof import('node:os')
  const { join: j } = require('node:path') as typeof import('node:path')
  /* eslint-enable @typescript-eslint/no-require-imports */
  const dir = mkdtempSync(j(tmpdir(), 'nf-backup-test-'))
  return { dir }
})

vi.mock('electron', () => ({
  app: {
    getPath: () => state.dir,
    getAppPath: () => process.cwd(),
    isPackaged: false,
    getVersion: () => '1.2.0'
  },
  dialog: {
    showSaveDialog: vi.fn(async () => ({ canceled: true })),
    showOpenDialog: vi.fn(async () => ({ canceled: true, filePaths: [] }))
  }
}))

// Native binding probe: better-sqlite3 is compiled for Electron's ABI via
// `npm run rebuild` (electron-rebuild). The plain vitest (system Node) run may
// have a mismatched ABI — in that case skip the DB-backed suites with a reason
// rather than fail the whole run.
const sqliteUsable = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3') as typeof import('better-sqlite3').default
    const probe = new Database(':memory:')
    probe.close()
    return true
  } catch {
    return false
  }
})()

const dbIt = sqliteUsable ? it : it.skip
const dbDescribe = sqliteUsable ? describe : describe.skip
const dbBeforeAll = sqliteUsable ? beforeAll : () => {}
const dbAfterAll = sqliteUsable ? afterAll : () => {}

import { getDbPath, getSqlite, initDatabase, closeDatabase } from '../src/main/db'
import { exportBackup, importBackup, inspectBackup } from '../src/main/services/backup'

let backupPath: string

dbBeforeAll(() => {
  initDatabase()
  const sqlite = getSqlite()
  sqlite.exec(`
    INSERT INTO incomes (id, title, gross_income, local_updated_at, created_at)
    VALUES ('inc-1', 'Salary', 20000, 1, 1);
    INSERT INTO incomes (id, title, gross_income, local_updated_at, created_at)
    VALUES ('inc-2', 'Bonus', 5000, 1, 1);
    INSERT INTO expenses (id, title, amount, interest, local_updated_at, created_at)
    VALUES ('exp-1', 'Lunch', 250, 0, 1, 1);
  `)
  backupPath = join(state.dir, 'backup.sqlite')
})

dbAfterAll(() => {
  closeDatabase()
  rmSync(state.dir, { recursive: true, force: true })
})

dbDescribe('exportBackup', () => {
  dbIt('writes a valid stamped SQLite snapshot', async () => {
    const out = await exportBackup(backupPath)
    expect(existsSync(out.path)).toBe(true)
    expect(out.meta.appVersion).toBe('1.2.0')
    expect(out.meta.counts.incomes).toBe(2)
    expect(out.meta.counts.expenses).toBe(1)
  })
})

dbDescribe('inspectBackup', () => {
  dbIt('accepts a real backup and reads its metadata', async () => {
    const info = await inspectBackup(backupPath)
    expect(info.valid).toBe(true)
    expect(info.meta?.counts.incomes).toBe(2)
    expect(info.meta?.appVersion).toBe('1.2.0')
  })

  dbIt('rejects a non-SQLite file', async () => {
    const junk = join(state.dir, 'junk.txt')
    const { writeFileSync } = await import('node:fs')
    writeFileSync(junk, 'this is not a database')
    const info = await inspectBackup(junk)
    expect(info.valid).toBe(false)
    expect(info.reason).toContain('Not a SQLite database')
  })

  dbIt('rejects a SQLite file missing the finance tables', async () => {
    const bare = join(state.dir, 'bare.sqlite')
    const Database = (await import('better-sqlite3')).default
    const conn = new Database(bare)
    conn.exec('CREATE TABLE unrelated (id INTEGER PRIMARY KEY)')
    conn.close()
    const info = await inspectBackup(bare)
    expect(info.valid).toBe(false)
    expect(info.reason).toContain('Missing tables')
  })
})

dbDescribe('importBackup', () => {
  dbIt('restores data after the live DB is mutated away from the backup', async () => {
    // Mutate the live DB so it no longer matches the backup.
    const sqlite = getSqlite()
    sqlite.exec("DELETE FROM incomes WHERE id = 'inc-1'")
    sqlite.exec("UPDATE expenses SET amount = 999 WHERE id = 'exp-1'")

    const out = await importBackup(backupPath)
    expect(out.valid).toBe(true)

    const restored = getSqlite()
    const incomes = restored
      .prepare('SELECT id, gross_income FROM incomes ORDER BY id')
      .all() as Array<{ id: string; gross_income: number }>
    expect(incomes).toHaveLength(2)
    expect(incomes.find((r) => r.id === 'inc-1')?.gross_income).toBe(20000)
    const expenses = restored
      .prepare('SELECT amount FROM expenses WHERE id = ?')
      .get('exp-1') as { amount: number }
    expect(expenses.amount).toBe(250)
  })

  dbIt('refuses a backup from a newer app version', async () => {
    const newer = join(state.dir, 'newer.sqlite')
    const Database = (await import('better-sqlite3')).default
    const conn = new Database(newer)
    conn.exec(`
      CREATE TABLE accounts (id TEXT PRIMARY KEY, account_name TEXT NOT NULL, account_type TEXT NOT NULL, created_at INTEGER NOT NULL);
      CREATE TABLE income_categories (id TEXT PRIMARY KEY, source TEXT NOT NULL, created_at INTEGER NOT NULL);
      CREATE TABLE expense_categories (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at INTEGER NOT NULL);
      CREATE TABLE incomes (id TEXT PRIMARY KEY, title TEXT NOT NULL, created_at INTEGER NOT NULL);
      CREATE TABLE expenses (id TEXT PRIMARY KEY, title TEXT NOT NULL, created_at INTEGER NOT NULL);
      CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);
    `)
    conn
      .prepare('INSERT INTO app_settings (key, value) VALUES (?, ?)')
      .run('backup.meta', JSON.stringify({ appVersion: '9.9.9', exportedAt: new Date().toISOString(), counts: {} }))
    conn.close()

    const out = await importBackup(newer)
    expect(out.valid).toBe(false)
    expect(out.reason).toContain('newer than this app')
  })

  dbIt('refuses the live database file itself', async () => {
    const out = await importBackup(getDbPath())
    expect(out.valid).toBe(false)
    expect(out.reason).toContain('live database')
  })
})

// monthly-budget/05: saved budgets travel with the database backup.
dbDescribe('saved budgets in backups', () => {
  const seed = () => {
    const sqlite = getSqlite()
    sqlite.exec(`
      DELETE FROM monthly_budget_snapshots;
      INSERT INTO monthly_budget_snapshots (id, month, category_id, category_name, budget, created_at, updated_at)
      VALUES ('s1', '2026-01', 'food', 'Food', 5000, 1, 1), ('s2', '2026-01', 'fun', 'Fun', 900, 1, 1);
    `)
  }

  dbIt('monthly-budget/05#AC1 a backup counts saved budgets and restore brings them back', async () => {
    seed()
    const file = join(state.dir, 'with-budgets.sqlite')
    const out = await exportBackup(file)
    expect(out.meta.counts.monthly_budget_snapshots).toBe(2)

    getSqlite().exec('DELETE FROM monthly_budget_snapshots')
    const restored = await importBackup(file)
    expect(restored.valid).toBe(true)
    const rows = getSqlite()
      .prepare('SELECT month, category_name, budget FROM monthly_budget_snapshots ORDER BY category_name')
      .all()
    expect(rows).toEqual([
      { month: '2026-01', category_name: 'Food', budget: 5000 },
      { month: '2026-01', category_name: 'Fun', budget: 900 }
    ])
  })

  dbIt('monthly-budget/05#AC2 a backup made before this feature restores and shows no saved sets', async () => {
    const file = join(state.dir, 'pre-feature.sqlite')
    await exportBackup(file)
    const Database = (await import('better-sqlite3')).default
    const conn = new Database(file)
    // Make it look like it predates the saved-budgets migration: no table, and the migration not yet applied.
    conn.exec('DROP TABLE monthly_budget_snapshots')
    // Later migrations (0016 loan terms) came after 0015: roll those back too, so the file looks like 0000..0014.
    for (const column of ['interest', 'payment_frequency', 'period_count', 'linked_borrowing_id']) {
      conn.exec(`ALTER TABLE incomes DROP COLUMN ${column}`)
    }
    conn.exec('DELETE FROM __drizzle_migrations WHERE created_at >= 1786600000000')
    conn.close()

    const restored = await importBackup(file)
    expect(restored.valid).toBe(true)
    const count = getSqlite().prepare('SELECT COUNT(*) AS c FROM monthly_budget_snapshots').get() as { c: number }
    expect(count.c).toBe(0)
  })
})
