// Pasabuyer is a workspace-owned select list, independent of values used by records.
// Fetch schema in main only and persist successful results for offline use.
import { getSqlite } from '../db'
import { getMapping } from './mapping-store'
import { NOTION_PROPERTY_NAMES } from './property-mapper'
import { client, isConnected } from './service'

function readOptions(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every(v => typeof v === 'string')) {
    throw new Error('Invalid cached Pasabuyer options')
  }
  return value
}

export async function listPasabuyerOptions(): Promise<string[]> {
  const databaseId = getMapping().expenses
  if (!databaseId) return []
  const key = `notion.pasabuyer-options:${databaseId}`
  const db = getSqlite()
  const cached = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined
  let previous: string[] | undefined
  if (cached) {
    try { previous = readOptions(JSON.parse(cached.value)) } catch { /* refresh invalid cache */ }
  }
  if (!isConnected()) return previous ?? []
  try {
    const schema = await client().getDataSourceSchema(databaseId)
    const properties = schema.properties as Record<string, { type?: string; select?: { options?: unknown } }> | undefined
    const field = properties?.[NOTION_PROPERTY_NAMES.expenses.pasabuyer]
    if (field?.type !== 'select' || !Array.isArray(field.select?.options)) {
      throw new Error('Expense Pasabuyer must be a Notion select property')
    }
    const names = field.select.options.map((option: unknown) => {
      const name = (option as { name?: unknown } | null)?.name
      if (typeof name !== 'string' || !name.trim()) throw new Error('Invalid Notion Pasabuyer option')
      return name
    })
    const options = [...new Set(names)]
    db.prepare(`INSERT INTO app_settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(key, JSON.stringify(options))
    return options
  } catch (error) {
    // A successful empty schema is authoritative. A failed refresh preserves last known options.
    if (previous !== undefined) return previous
    throw error
  }
}
