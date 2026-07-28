// Conflict log + resolution (Phase 4.2). A conflict row is written per overlapping field
// when the three-way merge can't auto-resolve; the record is marked sync_state='conflict'
// and held until the user resolves it (wiki/desktop/sync-and-conflict-design.md).
import { randomUUID } from 'node:crypto'
import { getSqlite } from '../db'
import {
  expenseWritableFromRow,
  incomeWritableFromRow,
  writeExpenseWritable,
  writeIncomeWritable
} from './writable'
import type { MergeConflict } from './merge'
import type { ConflictGroup, ConflictResolution } from '../../shared/finance.types'

type Table = 'incomes' | 'expenses'

const norm = (v: unknown): unknown => (v === undefined ? null : v)

export function recordConflicts(table: Table, recordId: string, conflicts: MergeConflict[]): void {
  const db = getSqlite()
  // Replace any prior unresolved conflicts for this record (re-detected on a later pull).
  db.prepare(
    'DELETE FROM conflicts WHERE record_table = ? AND record_id = ? AND resolved_at IS NULL'
  ).run(table, recordId)
  const stmt = db.prepare(
    `INSERT INTO conflicts (id, record_table, record_id, field, base_value, local_value, remote_value, detected_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const t = Date.now()
  for (const c of conflicts) {
    stmt.run(
      randomUUID(), table, recordId, c.field,
      JSON.stringify(norm(c.base)), JSON.stringify(norm(c.local)), JSON.stringify(norm(c.remote)), t
    )
  }
}

function titleFor(table: Table, recordId: string): string {
  const row = getSqlite().prepare(`SELECT title FROM ${table} WHERE id = ?`).get(recordId) as
    | { title?: string }
    | undefined
  return row?.title ?? recordId.slice(0, 8)
}

/** Resolve foreign-key field values to display names so the conflict modal shows
 *  human-readable account/category names instead of raw UUIDs. */
function resolveFieldValue(table: Table, field: string, value: unknown): unknown {
  if (value === null || value === undefined) return value
  const strVal = String(value)
  const db = getSqlite()
  if (field === 'accountId' || field === 'transactedAccountId' || field === 'pasabuyAccountReceiverId') {
    const row = db.prepare('SELECT account_name FROM accounts WHERE id = ?').get(strVal) as { account_name?: string } | undefined
    return row?.account_name ?? strVal
  }
  if (field === 'categoryId') {
    if (table === 'incomes') {
      const row = db.prepare('SELECT source FROM income_categories WHERE id = ?').get(strVal) as { source?: string } | undefined
      return row?.source ?? strVal
    }
    const row = db.prepare('SELECT name FROM expense_categories WHERE id = ?').get(strVal) as { name?: string } | undefined
    return row?.name ?? strVal
  }
  if (field === 'paymentStatus' || field === 'paymentFrequency' || field === 'pasabuyStatus') {
    // These are select labels — return as-is but replace empty/null with "(none)"
    if (strVal === '' || strVal === 'null') return '(none)'
    return strVal
  }
  return value
}

export function listConflicts(): ConflictGroup[] {
  const rows = getSqlite()
    .prepare(
      `SELECT record_table, record_id, field, base_value, local_value, remote_value, detected_at
       FROM conflicts WHERE resolved_at IS NULL ORDER BY detected_at`
    )
    .all() as Array<{
    record_table: Table
    record_id: string
    field: string
    base_value: string
    local_value: string
    remote_value: string
    detected_at: number
  }>

  const groups = new Map<string, ConflictGroup>()
  for (const r of rows) {
    const key = `${r.record_table}:${r.record_id}`
    let g = groups.get(key)
    if (!g) {
      g = {
        recordTable: r.record_table,
        recordId: r.record_id,
        title: titleFor(r.record_table, r.record_id),
        fields: [],
        detectedAt: r.detected_at
      }
      groups.set(key, g)
    }
    const base = JSON.parse(r.base_value)
    const local = JSON.parse(r.local_value)
    const remote = JSON.parse(r.remote_value)
    g.fields.push({
      field: r.field,
      base: resolveFieldValue(r.record_table, r.field, base),
      local: resolveFieldValue(r.record_table, r.field, local),
      remote: resolveFieldValue(r.record_table, r.field, remote)
    })
  }
  return [...groups.values()]
}

/**
 * Resolve a record's conflict. The chosen values become the record; base_snapshot is set
 * to Notion's current state (remote), so if the user kept any local value the record is
 * marked dirty to push it on the next pass; if they took all-remote it is clean.
 */
export function resolveConflict(
  table: Table,
  recordId: string,
  resolution: ConflictResolution
): void {
  const db = getSqlite()
  const conflictRows = db
    .prepare(
      'SELECT field, remote_value FROM conflicts WHERE record_table = ? AND record_id = ? AND resolved_at IS NULL'
    )
    .all(table, recordId) as Array<{ field: string; remote_value: string }>
  if (conflictRows.length === 0) throw new Error('no pending conflict for this record')

  const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(recordId) as
    | Record<string, unknown>
    | undefined
  if (!row) throw new Error(`record ${recordId} not found`)

  const current = table === 'incomes' ? incomeWritableFromRow(row) : expenseWritableFromRow(row)
  const base = JSON.parse((row.base_snapshot as string | null) ?? '{}') as Record<string, unknown>
  const resolved = { ...current }
  const newBase = { ...base }

  for (const c of conflictRows) {
    const remote = JSON.parse(c.remote_value)
    const choice = 'all' in resolution ? resolution.all : (resolution.perField[c.field] ?? 'local')
    resolved[c.field] = choice === 'remote' ? remote : current[c.field]
    newBase[c.field] = remote // base tracks Notion's current value
  }

  // Clean only if the resolved record already equals Notion's state.
  const keys = new Set([...Object.keys(resolved), ...Object.keys(newBase)])
  const isClean = [...keys].every((k) => Object.is(norm(resolved[k]), norm(newBase[k])))
  const opts = { base: newBase, syncState: isClean ? ('clean' as const) : ('dirty' as const) }
  if (table === 'incomes') writeIncomeWritable(recordId, resolved, opts)
  else writeExpenseWritable(recordId, resolved, opts)

  db.prepare(
    'UPDATE conflicts SET resolved_at = ?, resolution = ? WHERE record_table = ? AND record_id = ? AND resolved_at IS NULL'
  ).run(Date.now(), JSON.stringify(resolution), table, recordId)
}

/**
 * Resolve ALL pending conflicts across all records. Bulk operation for "Accept All" buttons.
 * Returns the updated conflict list after resolution.
 */
export function resolveAllConflicts(resolution: 'local' | 'remote'): ConflictGroup[] {
  const db = getSqlite()
  
  // Get all unique (table, record_id) pairs with pending conflicts
  const pending = db.prepare(
    `SELECT DISTINCT record_table, record_id FROM conflicts WHERE resolved_at IS NULL`
  ).all() as Array<{ record_table: Table; record_id: string }>
  
  for (const p of pending) {
    try {
      resolveConflict(p.record_table, p.record_id, { all: resolution })
    } catch {
      // Skip records that fail (shouldn't happen, but be safe)
    }
  }
  
  return listConflicts()
}
