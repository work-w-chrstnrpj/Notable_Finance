import { app } from 'electron'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { schema } from './schema'

// SQLite lives in the OS userData dir; it is the working source of truth (local-first).
// Migrations are drizzle-generated SQL, applied on every start (additive & safe).

export type AppDatabase = BetterSQLite3Database<typeof schema>

let db: AppDatabase | null = null
let sqlite: Database.Database | null = null
let dbPath = ''

function migrationsFolder(): string {
  // Packaged: bundled as an extraResource (Phase 5). Dev: read from source,
  // resolved from the app root (robust to bundler/test runners that relocate
  // __dirname of the bundled main file).
  return app.isPackaged
    ? join(process.resourcesPath, 'migrations')
    : join(app.getAppPath(), 'src/main/db/migrations')
}

export function initDatabase(): { db: AppDatabase; dbPath: string } {
  if (db) return { db, dbPath }

  dbPath = join(app.getPath('userData'), 'notable-finance.sqlite')
  sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder: migrationsFolder() })

  return { db, dbPath }
}

export function getDb(): AppDatabase {
  if (!db) throw new Error('Database not initialised — call initDatabase() first')
  return db
}

/** Raw better-sqlite3 handle for prepared-statement repositories. */
export function getSqlite(): Database.Database {
  if (!sqlite) throw new Error('Database not initialised — call initDatabase() first')
  return sqlite
}

export function getDbPath(): string {
  return dbPath
}

/** List user tables — used by the db:health IPC channel to prove the store is wired. */
export function listTables(): string[] {
  if (!sqlite) return []
  const rows = sqlite
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all() as Array<{ name: string }>
  return rows.map((r) => r.name)
}

export function closeDatabase(): void {
  sqlite?.close()
  sqlite = null
  db = null
}
