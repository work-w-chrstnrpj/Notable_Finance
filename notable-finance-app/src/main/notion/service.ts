// Notion onboarding operations (Phase 2.1/2.2): connect, discover, verify.
// All run in main; the token never crosses the IPC boundary outward.
import { NotionClient } from './client'
import { deleteToken, hasToken, readToken, storeToken } from './token-store'
import { getMapping } from './mapping-store'
import { compareSchema, EXPECTED_SCHEMA } from './schema-spec'
import type {
  ConnectResult,
  DiscoveredDb,
  MappableResource,
  SchemaReport,
  SchemaResourceReport
} from '../../shared/finance.types'

export function client(): NotionClient {
  return new NotionClient(readToken())
}

/** Validate the token against the API before storing it (encrypted). */
export async function connect(token: string): Promise<ConnectResult> {
  if (!token || token.trim().length < 10) {
    throw new Error('A Notion integration token is required')
  }
  const probe = new NotionClient(token.trim())
  const me = await probe.me() // throws NotionApiError(401) on a bad token
  storeToken(token)
  return { connected: true, workspaceUser: me.name }
}

export function isConnected(): boolean {
  return hasToken()
}

export function disconnect(): void {
  deleteToken()
}

function extractDbTitle(db: Record<string, unknown>): string {
  const title = db.title as Array<{ plain_text?: string }> | undefined
  return title?.map((t) => t.plain_text ?? '').join('') || '(untitled)'
}

export async function discoverDatabases(): Promise<DiscoveredDb[]> {
  const dbs = await client().searchDatabases()
  return dbs.map((db) => ({
    id: db.id as string,
    title: extractDbTitle(db),
    propertyCount: Object.keys((db.properties as Record<string, unknown>) ?? {}).length
  }))
}

/** Drift report for every mapped database (Phase 2.2). */
export async function verifySchema(): Promise<SchemaReport> {
  const mapping = getMapping()
  const c = client()
  const resources: SchemaResourceReport[] = []

  for (const resource of Object.keys(EXPECTED_SCHEMA) as MappableResource[]) {
    const databaseId = mapping[resource] ?? null
    if (!databaseId) {
      resources.push({
        resource,
        databaseId: null,
        ok: false,
        errors: EXPECTED_SCHEMA[resource]
          .filter((p) => p.kind === 'writable')
          .map((p) => ({ property: p.property, expectedType: p.type, actualType: null })),
        warnings: []
      })
      continue
    }
    const db = await c.getDatabase(databaseId)
    const actual = (db.properties as Record<string, { type: string }>) ?? {}
    const { errors, warnings } = compareSchema(EXPECTED_SCHEMA[resource], actual)
    resources.push({ resource, databaseId, ok: errors.length === 0, errors, warnings })
  }

  return { ok: resources.every((r) => r.ok), resources }
}
