// Local database backup & restore (Phase 7.2).
//
// Export: a consistent SQLite snapshot of the live local DB (VACUUM INTO) stamped
// with metadata (app version, export time, row counts) in the app_settings table.
// Import: validate the file, close the live connection, swap the file in, drop
// stale WAL/SHM files, and re-init (migrations run additively). The renderer
// reloads its window after a successful import so every page re-fetches fresh.
//
// Security notes:
// - Chat API keys live in safeStorage vault FILES, not SQLite — exporting the DB
//   never exports raw credentials. Threads/messages metadata are included.
// - Imports from a NEWER app version are refused (schema may be ahead of this app).
import { app, dialog } from 'electron'
import { closeSync, existsSync, openSync, readSync, realpathSync, rmSync, statSync, copyFileSync } from 'node:fs'
import Database from 'better-sqlite3'
import {
  closeDatabase,
  getDbPath,
  getSqlite,
  initDatabase
} from '../db'

export interface BackupMeta {
  appVersion: string
  exportedAt: string
  counts: Record<string, number>
}

export interface BackupExportResult {
  path: string
  bytes: number
  exportedAt: string
  meta: BackupMeta
}

export interface BackupInspectResult {
  path: string
  bytes: number
  valid: boolean
  reason?: string
  meta: BackupMeta | null
}

export interface BackupImportResult {
  path: string
  valid: boolean
  reason?: string
  meta: BackupMeta | null
}

const META_KEY = 'backup.meta'
const SQLITE_HEADER = 'SQLite format 3\u0000'

// Tables that must exist for a file to be treated as a Notable Finance backup.
const REQUIRED_TABLES = [
  'accounts',
  'income_categories',
  'expense_categories',
  'incomes',
  'expenses'
]

// Tables whose row counts are stamped into the backup metadata.
const COUNTED_TABLES = [
  'incomes',
  'expenses',
  'expense_scheduler',
  'accounts',
  'income_categories',
  'expense_categories',
  'conflicts',
  'mutation_queue',
  'activity_log',
  'chat_threads',
  'chat_messages'
]

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function defaultBackupName(now = new Date()): string {
  const d = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`
  return `notable-finance-backup-${d}.sqlite`
}

function countRows(sqlite: Database.Database): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const table of COUNTED_TABLES) {
    try {
      const row = sqlite.prepare(`SELECT COUNT(*) AS c FROM "${table}"`).get() as {
        c: number
      }
      counts[table] = Number(row.c)
    } catch {
      // Table may not exist in older backups — skip.
    }
  }
  return counts
}

/** Parse + validate a backup file WITHOUT touching the live database. */
function inspectBackupFile(path: string): BackupInspectResult {
  if (!existsSync(path)) {
    return { path, bytes: 0, valid: false, reason: 'File does not exist', meta: null }
  }
  const bytes = statSync(path).size
  let fd: number | null = null
  try {
    fd = openSync(path, 'r')
    const header = Buffer.alloc(16)
    readSync(fd, header, 0, 16, 0)
    if (header.toString('latin1') !== SQLITE_HEADER) {
      return { path, bytes, valid: false, reason: 'Not a SQLite database file', meta: null }
    }
  } catch (err) {
    return {
      path,
      bytes,
      valid: false,
      reason: err instanceof Error ? err.message : String(err),
      meta: null
    }
  } finally {
    if (fd !== null) closeSync(fd)
  }

  let conn: Database.Database | null = null
  try {
    conn = new Database(path, { readonly: true })
    const tables = (
      conn
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all() as Array<{ name: string }>
    ).map((r) => r.name)
    const missing = REQUIRED_TABLES.filter((t) => !tables.includes(t))
    if (missing.length > 0) {
      return {
        path,
        bytes,
        valid: false,
        reason: `Missing tables (${missing.join(', ')}) — not a Notable Finance backup`,
        meta: null
      }
    }
    const metaRow = conn
      .prepare('SELECT value FROM app_settings WHERE key = ?')
      .get(META_KEY) as { value?: string } | undefined
    let meta: BackupMeta | null = null
    if (metaRow?.value) {
      try {
        meta = JSON.parse(metaRow.value) as BackupMeta
      } catch {
        meta = null // stamp missing/corrupt — treat as raw backup
      }
    }
    return { path, bytes, valid: true, meta }
  } catch (err) {
    return {
      path,
      bytes,
      valid: false,
      reason: err instanceof Error ? err.message : String(err),
      meta: null
    }
  } finally {
    conn?.close()
  }
}

function versionGt(a: string, b: string): boolean {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0
    const y = pb[i] ?? 0
    if (x > y) return true
    if (x < y) return false
  }
  return false
}

/**
 * Export a consistent snapshot of the live local DB. When `destPath` is omitted,
 * the OS save dialog picks the destination. Uses VACUUM INTO so the snapshot is
 * transactionally consistent even if sync is writing concurrently.
 */
export async function exportBackup(destPath?: string): Promise<BackupExportResult> {
  initDatabase()
  const sqlite = getSqlite()

  let target = destPath
  if (!target) {
    const out = await dialog.showSaveDialog({
      title: 'Export local database backup',
      defaultPath: defaultBackupName(),
      filters: [
        { name: 'Notable Finance backup', extensions: ['sqlite', 'db'] },
        { name: 'All files', extensions: ['*'] }
      ]
    })
    if (out.canceled || !out.filePath) throw new Error('Export cancelled')
    target = out.filePath
  }

  // VACUUM INTO refuses to overwrite an existing file — clear it first.
  if (existsSync(target)) rmSync(target, { force: true })
  // Single quotes are the only SQL-literal hazard in the path; double them.
  sqlite.exec(`VACUUM INTO '${target.replace(/'/g, "''")}'`)

  // Stamp metadata into the backup itself (single-file backup, no sidecar).
  const meta: BackupMeta = {
    appVersion: app.getVersion(),
    exportedAt: new Date().toISOString(),
    counts: countRows(sqlite)
  }
  const backupConn = new Database(target)
  try {
    backupConn
      .prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)')
      .run(META_KEY, JSON.stringify(meta))
  } finally {
    backupConn.close()
  }

  return { path: target, bytes: statSync(target).size, exportedAt: meta.exportedAt, meta }
}

/**
 * Show the open dialog (or use the given path) and validate the file without
 * touching the live DB. The renderer confirms, then calls importBackup(path).
 */
export async function inspectBackup(srcPath?: string): Promise<BackupInspectResult> {
  let path = srcPath
  if (!path) {
    const out = await dialog.showOpenDialog({
      title: 'Choose a Notable Finance backup file',
      properties: ['openFile'],
      filters: [
        { name: 'Notable Finance backup', extensions: ['sqlite', 'db'] },
        { name: 'All files', extensions: ['*'] }
      ]
    })
    if (out.canceled || out.filePaths.length === 0) throw new Error('Import cancelled')
    path = out.filePaths[0]!
  }
  return inspectBackupFile(path)
}

/**
 * Replace the live local DB with a validated backup file. Closes the connection,
 * swaps the file, clears stale WAL/SHM, and re-initialises (drizzle migrations
 * apply additively for older backups).
 */
export async function importBackup(path: string): Promise<BackupImportResult> {
  const inspected = inspectBackupFile(path)
  if (!inspected.valid) {
    return { path, valid: false, reason: inspected.reason, meta: inspected.meta }
  }

  const livePath = getDbPath()
  if (!livePath) throw new Error('Database not initialised')

  if (realpathSync(path) === realpathSync(livePath)) {
    return {
      path,
      valid: false,
      reason: 'That file is the live database itself — choose an exported backup instead.',
      meta: inspected.meta
    }
  }

  if (inspected.meta && versionGt(inspected.meta.appVersion, app.getVersion())) {
    return {
      path,
      valid: false,
      reason: `This backup was created by v${inspected.meta.appVersion}, which is newer than this app (v${app.getVersion()}). Update the app first, then import again.`,
      meta: inspected.meta
    }
  }

  closeDatabase()
  copyFileSync(path, livePath)
  // The old DB may have left WAL/SHM artifacts behind; a stale WAL would corrupt
  // the freshly copied file on next open.
  rmSync(`${livePath}-wal`, { force: true })
  rmSync(`${livePath}-shm`, { force: true })
  try {
    initDatabase()
  } catch (err) {
    throw new Error(
      `Backup imported but could not be re-opened (${err instanceof Error ? err.message : String(err)}). Restart the app; if it fails, re-import from your last backup.`
    )
  }

  return { path, valid: true, meta: inspected.meta }
}
