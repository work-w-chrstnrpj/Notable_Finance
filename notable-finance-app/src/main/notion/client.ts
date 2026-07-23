// Minimal Notion REST client for the main process (Phase 2). Uses native fetch — the
// only endpoints needed are users/me, search, database/data-source retrieve, page
// create/update, and data-source query.
// (Adapted from the web app's notion-api-client; a full SDK is unnecessary here.)
// NF_NOTION_BASE_URL overrides the host for mock-server verification.
//
// Notion-Version 2025-09-03+ splits databases vs data sources: query/create/schema
// must use data_source_id (see developers.notion.com upgrade guide). We still accept
// the user-mapped database_id and resolve the first child data source on demand.

const NOTION_VERSION = '2026-03-11'

export class NotionApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string | null = null,
    readonly retryAfterSeconds: number | null = null
  ) {
    super(message)
    this.name = 'NotionApiError'
  }
}

export class NotionClient {
  private readonly baseUrl: string
  /** database_id → first data_source_id (personal DBs are single-source). */
  private readonly dataSourceByDatabase = new Map<string, string>()

  constructor(private readonly token: string) {
    this.baseUrl = process.env.NF_NOTION_BASE_URL ?? 'https://api.notion.com'
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
    if (!response.ok) {
      let code: string | null = null
      let message = `Notion API ${response.status}`
      try {
        const payload = (await response.json()) as { code?: string; message?: string }
        code = payload.code ?? null
        message = payload.message ?? message
      } catch {
        // non-JSON error body — keep defaults
      }
      const retryAfter = response.headers.get('Retry-After')
      throw new NotionApiError(
        message,
        response.status,
        code,
        retryAfter ? Number(retryAfter) : null
      )
    }
    return (await response.json()) as T
  }

  /** Validates the token; returns the bot/user name. */
  async me(): Promise<{ name: string | null }> {
    const user = await this.request<{ name?: string; bot?: { owner?: unknown } }>(
      'GET',
      '/v1/users/me'
    )
    return { name: user.name ?? null }
  }

  /**
   * Resolve the primary data_source_id for a mapped database_id.
   * Required for query / create / schema under Notion-Version ≥ 2025-09-03.
   */
  async resolveDataSourceId(databaseId: string): Promise<string> {
    const cached = this.dataSourceByDatabase.get(databaseId)
    if (cached) return cached

    const db = await this.request<{
      data_sources?: Array<{ id: string; name?: string }>
    }>('GET', `/v1/databases/${databaseId}`)
    const dataSourceId = db.data_sources?.[0]?.id
    if (!dataSourceId) {
      throw new NotionApiError(
        `database ${databaseId} has no data sources`,
        400,
        'validation_error'
      )
    }
    this.dataSourceByDatabase.set(databaseId, dataSourceId)
    return dataSourceId
  }

  /** List data sources the integration can access (Search filter = data_source). */
  async searchDatabases(): Promise<Array<Record<string, unknown>>> {
    const results: Array<Record<string, unknown>> = []
    let cursor: string | undefined
    do {
      const page = await this.request<{
        results: Array<Record<string, unknown>>
        has_more: boolean
        next_cursor: string | null
      }>('POST', '/v1/search', {
        filter: { property: 'object', value: 'data_source' },
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {})
      })
      results.push(...page.results)
      cursor = page.has_more && page.next_cursor ? page.next_cursor : undefined
    } while (cursor)
    return results
  }

  /** Database shell (includes data_sources[]); schema lives on the data source. */
  async getDatabase(id: string): Promise<Record<string, unknown>> {
    return this.request('GET', `/v1/databases/${id}`)
  }

  /** Schema/properties for the primary data source under a mapped database id. */
  async getDataSourceSchema(databaseId: string): Promise<Record<string, unknown>> {
    const dataSourceId = await this.resolveDataSourceId(databaseId)
    return this.request('GET', `/v1/data_sources/${dataSourceId}`)
  }

  /**
   * Query all pages in a database's primary data source, oldest-edited first.
   * When `since` is given, only pages edited on/after that ISO time are fetched.
   */
  async queryDatabase(
    databaseId: string,
    opts: { since?: string } = {}
  ): Promise<Array<Record<string, unknown>>> {
    const dataSourceId = await this.resolveDataSourceId(databaseId)
    const results: Array<Record<string, unknown>> = []
    let cursor: string | undefined
    do {
      const body: Record<string, unknown> = {
        page_size: 100,
        sorts: [{ timestamp: 'last_edited_time', direction: 'ascending' }],
        ...(opts.since
          ? { filter: { timestamp: 'last_edited_time', last_edited_time: { on_or_after: opts.since } } }
          : {}),
        ...(cursor ? { start_cursor: cursor } : {})
      }
      const page = await this.request<{
        results: Array<Record<string, unknown>>
        has_more: boolean
        next_cursor: string | null
      }>('POST', `/v1/data_sources/${dataSourceId}/query`, body)
      results.push(...page.results)
      cursor = page.has_more && page.next_cursor ? page.next_cursor : undefined
    } while (cursor)
    return results
  }

  async createPage(
    databaseId: string,
    properties: Record<string, unknown>,
    opts?: { icon?: { type: string; icon?: { name: string; color?: string }; emoji?: string } }
  ): Promise<{ id: string }> {
    const dataSourceId = await this.resolveDataSourceId(databaseId)
    return this.request('POST', '/v1/pages', {
      parent: { type: 'data_source_id', data_source_id: dataSourceId },
      properties,
      ...(opts?.icon ? { icon: opts.icon } : {})
    })
  }

  async updatePage(
    pageId: string,
    properties: Record<string, unknown>,
    opts?: { icon?: { type: string; icon?: { name: string; color?: string }; emoji?: string } }
  ): Promise<{ id: string }> {
    return this.request('PATCH', `/v1/pages/${pageId}`, {
      properties,
      ...(opts?.icon ? { icon: opts.icon } : {})
    })
  }
}
