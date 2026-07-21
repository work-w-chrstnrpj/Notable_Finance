// Mapping persistence (Phase 2.1): which Notion database backs each resource.
// Stored in app_settings — never hardcoded (bring-your-own-Notion).
import { getSqlite } from '../db'
import type { NotionMapping } from '../../shared/finance.types'

const MAPPING_KEY = 'notion.mapping'

export function saveMapping(mapping: NotionMapping): void {
  getSqlite()
    .prepare(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(MAPPING_KEY, JSON.stringify(mapping))
}

export function getMapping(): NotionMapping {
  const row = getSqlite()
    .prepare('SELECT value FROM app_settings WHERE key = ?')
    .get(MAPPING_KEY) as { value: string } | undefined
  if (!row?.value) return {}
  try {
    return JSON.parse(row.value) as NotionMapping
  } catch {
    return {}
  }
}

export function isMapped(): boolean {
  const m = getMapping()
  // Push needs at least incomes + expenses plus the reference dbs for relations.
  return Boolean(m.incomes && m.expenses && m.accounts && m.incomeCategories && m.expenseCategories)
}
