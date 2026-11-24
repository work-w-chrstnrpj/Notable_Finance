// Custom monthly budget sync (ADR-0010, building on ADR-0009). The user's Custom monthly budget database in
// Notion is the only place these budgets are edited; its ID is saved in Notion Configuration and the app never
// creates a database. Each sync replaces a READ-ONLY local cache (`monthly_budget_snapshots`) from Notion, so
// Monitoring still works offline. It is a separate step after the normal record sync. The one-time send of
// previously local budgets to Notion was done and removed (custom-budget/04); the only Notion write left is
// adding missing category columns.
import { getSqlite } from '../db'
import { budgetCategories, replaceAllSavedBudgets } from '../db/budgets'
import type { PeriodBudgetRow } from '../../shared/saved-budgets'
import { appendDevLog } from '../dev-logs/store'
import { NotionApiError, NotionClient } from './client'
import { hasToken, readToken } from './token-store'
import { getMapping } from './mapping-store'
import { extractNumberOrFormula, extractTitle } from './page-extractors'
import { budgetPeriodKey, parseBudgetPeriod, splitAmountEvenly } from '../../shared/budget-periods'
import type {
  SavedBudgetsDatabaseCheck,
  SavedBudgetsMirrorRunResult,
  SavedBudgetsMirrorStatus
} from '../../shared/finance.types'

const STATE_KEY = 'notion.savedBudgetsMirror'

type Props = Record<string, unknown>
type Page = Record<string, unknown>

/** The Notion calls the mirror needs, so tests can pass a fake. */
export type MirrorClient = Pick<
  NotionClient,
  'getDatabase' | 'getDataSourceSchema' | 'addDataSourceProperties' | 'queryDatabase'
>

interface MirrorState {
  databaseMissing: boolean
  /** Category names with no Number column in the database, from the last check. */
  missingColumns: string[]
  lastRunAt: number | null
  lastError: string | null
}

const EMPTY_STATE: MirrorState = {
  databaseMissing: false,
  missingColumns: [],
  lastRunAt: null,
  lastError: null
}

export function readMirrorState(): MirrorState {
  const row = getSqlite().prepare('SELECT value FROM app_settings WHERE key = ?').get(STATE_KEY) as
    | { value: string }
    | undefined
  if (!row?.value) return structuredClone(EMPTY_STATE)
  try {
    return { ...structuredClone(EMPTY_STATE), ...(JSON.parse(row.value) as Partial<MirrorState>) }
  } catch {
    return structuredClone(EMPTY_STATE)
  }
}

function writeMirrorState(state: MirrorState): void {
  getSqlite()
    .prepare(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(STATE_KEY, JSON.stringify(state))
}

function log(message: string, ok: boolean, detail?: Record<string, unknown>): void {
  appendDevLog({ kind: 'api', source: 'main', action: 'savedBudgets.mirror', message, ok, detail })
}

const norm = (name: string) => name.trim().toLowerCase()

function isGone(error: unknown): boolean {
  return error instanceof NotionApiError && (error.status === 404 || error.code === 'object_not_found')
}

// ── Database ID, status and settings ─────────────────────────────────────────

/** The ID the user saved in Notion Configuration, or null when blank. */
export function savedBudgetsDatabaseId(): string | null {
  const id = (getMapping() as Record<string, string | undefined>).savedBudgets
  return id && id.trim() ? id.trim() : null
}

export function getMirrorStatus(): SavedBudgetsMirrorStatus {
  const s = readMirrorState()
  const databaseId = savedBudgetsDatabaseId()
  return {
    databaseId,
    databaseMissing: s.databaseMissing,
    missingColumns: s.missingColumns,
    lastRunAt: s.lastRunAt,
    lastError: s.lastError
  }
}

function describeError(error: unknown): string {
  if (error instanceof NotionApiError) {
    if (error.status === 429) return `Notion is rate limiting requests. Try again in ${error.retryAfterSeconds ?? 'a few'} seconds.`
    if (error.status === 401) return 'Notion rejected the token. Reconnect Notion in Notion Configuration.'
    if (error.status === 403 || error.status === 404) {
      return 'Notion cannot find or open that database. Check the ID and share the database with your integration.'
    }
    return error.message
  }
  return error instanceof Error ? error.message : String(error)
}

/** Check a database ID the user typed: can the app see it, and does it have a title column? */
export async function checkSavedBudgetsDatabase(
  databaseId: string,
  client?: MirrorClient
): Promise<SavedBudgetsDatabaseCheck> {
  if (!client && !hasToken()) return { ok: false, message: 'Connect Notion first, then save the Saved Budgets database ID again.' }
  try {
    const c = client ?? new NotionClient(readToken())
    const db = await c.getDatabase(databaseId)
    if (db.in_trash === true || db.archived === true) {
      return { ok: false, message: 'That database is in the Notion trash. Restore it or use another database.' }
    }
    const schema = (await c.getDataSourceSchema(databaseId)) as { properties?: Record<string, { type?: string }> }
    const hasTitle = Object.values(schema.properties ?? {}).some((p) => p.type === 'title')
    if (!hasTitle) return { ok: false, message: 'That database has no title column. Add a title column to it.' }
    return { ok: true, message: 'The Saved Budgets database is reachable.' }
  } catch (error) {
    return { ok: false, message: describeError(error) }
  }
}

// ── Columns ───────────────────────────────────────────────────────────────────

/**
 * Which current non-auxiliary expense categories have a Number column. Nothing is added here.
 * Returns the title property name, a category-name → column map (existing columns only) and the
 * categories that have no column yet. A same-named column of another type counts as missing but
 * is never changed.
 */
export async function readColumns(
  client: MirrorClient,
  databaseId: string
): Promise<{ titleProp: string; columns: Map<string, string>; missing: string[]; existing: Record<string, { type?: string }> }> {
  const schema = (await client.getDataSourceSchema(databaseId)) as { properties?: Record<string, { type?: string }> }
  const existing = schema.properties ?? {}
  const titleProp = Object.entries(existing).find(([, p]) => p.type === 'title')?.[0] ?? 'Name'
  const byName = new Map(Object.keys(existing).map((name) => [norm(name), name]))
  const columns = new Map<string, string>()
  const missing: string[] = []
  for (const category of budgetCategories()) {
    const hit = byName.get(norm(category.name))
    if (hit && existing[hit]?.type === 'number') columns.set(norm(category.name), hit)
    else missing.push(category.name)
  }
  return { titleProp, columns, missing, existing }
}

/** Live check for Settings: refresh the list of missing columns. Never throws. */
export async function refreshMirrorColumns(client?: MirrorClient): Promise<SavedBudgetsMirrorStatus> {
  const state = readMirrorState()
  const databaseId = savedBudgetsDatabaseId()
  if (databaseId && (client || hasToken())) {
    try {
      const c = client ?? new NotionClient(readToken())
      state.missingColumns = (await readColumns(c, databaseId)).missing
      state.databaseMissing = false
    } catch (error) {
      if (isGone(error)) state.databaseMissing = true
      state.lastError = describeError(error)
    }
    writeMirrorState(state)
  }
  return getMirrorStatus()
}

/** The explicit "Add missing columns" action. Adds Number columns only; never deletes or renames. */
export async function addMissingColumns(client?: MirrorClient): Promise<{ added: number; status: SavedBudgetsMirrorStatus }> {
  const databaseId = savedBudgetsDatabaseId()
  if (!databaseId) throw new Error('Save the Saved Budgets database ID in Notion Configuration first.')
  const c = client ?? new NotionClient(readToken())
  const { missing, existing } = await readColumns(c, databaseId)
  const existingNames = new Set(Object.keys(existing).map(norm))
  // A same-named column of another type cannot be turned into a Number column, so it is not touched.
  const toAdd = missing.filter((name) => !existingNames.has(norm(name)))
  if (toAdd.length > 0) {
    await c.addDataSourceProperties(
      databaseId,
      Object.fromEntries(toAdd.map((name) => [name, { number: { format: 'philippine_peso' } }]))
    )
    log(`Added ${toAdd.length} category column(s) to the Saved Budgets database`, true, { columns: toAdd })
  }
  const status = await refreshMirrorColumns(client)
  return { added: toAdd.length, status }
}

// ── Cache from Notion ─────────────────────────────────────────────────────────

const RANK = { month: 3, quarter: 2, half: 1, year: 0 } as const

function readRowValues(page: Page, columns: Map<string, string>): Map<string, number> {
  const props = (page.properties as Props) ?? {}
  const out = new Map<string, number>()
  for (const [key, column] of columns) {
    const value = extractNumberOrFormula(props, column)
    if (value != null && Number.isFinite(value) && value >= 0) out.set(key, value)
  }
  return out
}

/**
 * The budget rows the Custom database says. For each month the most specific row wins (month, then
 * quarter, half, year); quarter, half and year rows are split evenly across their months. Categories
 * without a column are skipped, blank cells give no row, unrecognized titles are skipped with a log line.
 */
export function budgetRowsFromPages(
  pages: Page[],
  titleProp: string,
  columns: Map<string, string>
): Array<{ month: string; categoryId: string; categoryName: string; budget: number }> {
  const byKey = new Map(budgetCategories().map((c) => [norm(c.name), c]))
  const winner = new Map<string, { rank: number; values: Map<string, number> }>()
  for (const page of pages) {
    if (page.in_trash === true || page.archived === true) continue
    const title = extractTitle((page.properties as Props) ?? {}, titleProp).trim()
    if (!title) continue
    const parsed = parseBudgetPeriod(title)
    if (!parsed.ok) {
      log(`Skipped Notion row: ${parsed.reason}`, false)
      continue
    }
    const values = readRowValues(page, columns)
    if (values.size === 0) continue
    const rank = RANK[parsed.period.kind]
    const count = parsed.period.months.length
    parsed.period.months.forEach((month, index) => {
      const current = winner.get(month)
      if (current && current.rank >= rank) return
      const share = new Map<string, number>()
      for (const [key, total] of values) share.set(key, count === 1 ? total : splitAmountEvenly(total, count)[index])
      winner.set(month, { rank, values: share })
    })
  }
  const rows: Array<{ month: string; categoryId: string; categoryName: string; budget: number }> = []
  for (const [month, { values }] of [...winner].sort((a, b) => a[0].localeCompare(b[0]))) {
    for (const [key, budget] of values) {
      const category = byKey.get(key)
      if (category) rows.push({ month, categoryId: category.id, categoryName: category.name, budget })
    }
  }
  return rows
}

/**
 * The quarter, half and year rows as written (`Q1 2026`, `H1 2026`, `2026`), not split: Monitoring uses
 * one directly when its view is that period. If two rows name the same period, the first one wins.
 */
export function periodRowsFromPages(pages: Page[], titleProp: string, columns: Map<string, string>): PeriodBudgetRow[] {
  const byKey = new Map(budgetCategories().map((c) => [norm(c.name), c]))
  const seen = new Set<string>()
  const rows: PeriodBudgetRow[] = []
  for (const page of pages) {
    if (page.in_trash === true || page.archived === true) continue
    const title = extractTitle((page.properties as Props) ?? {}, titleProp).trim()
    const parsed = title ? parseBudgetPeriod(title) : null
    if (!parsed || !parsed.ok) continue
    const key = budgetPeriodKey(parsed.period.kind, parsed.period.months)
    if (!key || seen.has(key)) continue
    const values = readRowValues(page, columns)
    if (values.size === 0) continue
    seen.add(key)
    for (const [name, budget] of values) {
      const category = byKey.get(name)
      if (category) rows.push({ period: key, categoryId: category.id, categoryName: category.name, budget })
    }
  }
  return rows
}

// ── Orchestration ─────────────────────────────────────────────────────────────

const SKIPPED = (reason: string, missingColumns: string[] = []): SavedBudgetsMirrorRunResult => ({
  skipped: reason,
  missingColumns,
  cachedMonths: 0
})

async function openDatabase(
  client: MirrorClient,
  state: MirrorState,
  databaseId: string
): Promise<{ titleProp: string; columns: Map<string, string>; missing: string[]; pages: Page[] } | string> {
  try {
    const db = await client.getDatabase(databaseId)
    if (db.in_trash === true || db.archived === true) throw new NotionApiError('trashed', 404, 'object_not_found')
  } catch (error) {
    if (isGone(error)) {
      state.databaseMissing = true
      state.lastError = 'The Custom monthly budget database was removed or is no longer shared with the integration.'
      writeMirrorState(state)
      log('Custom monthly budget database is missing in Notion', false)
      return 'The Custom monthly budget database is missing in Notion'
    }
    throw error
  }
  state.databaseMissing = false
  const { titleProp, columns, missing } = await readColumns(client, databaseId)
  state.missingColumns = missing
  const pages = await client.queryDatabase(databaseId)
  return { titleProp, columns, missing, pages }
}

/**
 * One sync pass: read the Custom monthly budget database and replace the local cache from it. Notion
 * always wins. Skipped when there is no saved ID or no token. Never throws into the caller's sync.
 */
export async function syncCustomBudgets(opts: { client?: MirrorClient } = {}): Promise<SavedBudgetsMirrorRunResult> {
  const state = readMirrorState()
  if (!opts.client && !hasToken()) return SKIPPED('Notion is not connected')
  const databaseId = savedBudgetsDatabaseId()
  if (!databaseId) return SKIPPED('No Custom monthly budget database ID is saved in Notion Configuration')
  try {
    const client = opts.client ?? new NotionClient(readToken())
    const opened = await openDatabase(client, state, databaseId)
    if (typeof opened === 'string') return SKIPPED(opened)
    const out = replaceAllSavedBudgets(
      budgetRowsFromPages(opened.pages, opened.titleProp, opened.columns),
      periodRowsFromPages(opened.pages, opened.titleProp, opened.columns)
    )
    state.lastRunAt = Date.now()
    state.lastError = null
    writeMirrorState(state)
    log(`Custom monthly budget cache replaced from Notion: ${out.months} month(s)`, true)
    return { skipped: null, missingColumns: opened.missing, cachedMonths: out.months }
  } catch (error) {
    const message = describeError(error)
    state.lastError = message
    writeMirrorState(state)
    log(`Custom budget sync failed: ${message}`, false)
    return SKIPPED(message)
  }
}

/** Called after every normal sync. Never throws. */
export async function runSavedBudgetsMirrorSafe(): Promise<void> {
  try {
    await syncCustomBudgets()
  } catch (error) {
    log(`Custom budget sync failed: ${describeError(error)}`, false)
  }
}
