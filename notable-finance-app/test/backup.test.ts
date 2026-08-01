import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'

// Electron is never available in the node test env — mock the pieces the DB and
// backup layers touch. The temp dir is created BEFORE the mocked module loads
// (vi.hoisted) and pointed to by app.getPath('userData').
const state = vi.hoisted(() => {
  const { mkdtempSync } = require('node:fs') as typeof import('node:fs')
  const { tmpdir } = require('node:os') as typeof import('node:os')
  const { join: j } = require('node:path') as typeof import('node:path')
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
