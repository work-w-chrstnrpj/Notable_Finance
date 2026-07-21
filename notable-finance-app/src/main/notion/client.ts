// Minimal Notion REST client for the main process (Phase 2). Uses native fetch — the
// only endpoints needed are users/me, search, database retrieve, page create/update.
// (Adapted from the web app's notion-api-client; a full SDK is unnecessary here.)
// NF_NOTION_BASE_URL overrides the host for mock-server verification.

const NOTION_VERSION = '2022-06-28'

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

  /** List databases the integration can access. */
  async searchDatabases(): Promise<Array<Record<string, unknown>>> {
    const results: Array<Record<string, unknown>> = []
    let cursor: string | undefined
    do {
      const page = await this.request<{
        results: Array<Record<string, unknown>>
        has_more: boolean
        next_cursor: string | null
      }>('POST', '/v1/search', {
        filter: { property: 'object', value: 'database' },
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {})
      })
      results.push(...page.results)
      cursor = page.has_more && page.next_cursor ? page.next_cursor : undefined
    } while (cursor)
    return results
  }

  async getDatabase(id: string): Promise<Record<string, unknown>> {
    return this.request('GET', `/v1/databases/${id}`)
  }

  async createPage(
    databaseId: string,
    properties: Record<string, unknown>
  ): Promise<{ id: string }> {
    return this.request('POST', '/v1/pages', {
      parent: { database_id: databaseId },
      properties
    })
  }

  async updatePage(
    pageId: string,
    properties: Record<string, unknown>
  ): Promise<{ id: string }> {
    return this.request('PATCH', `/v1/pages/${pageId}`, { properties })
  }
}
