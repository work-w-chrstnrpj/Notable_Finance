// Page Content (Notion block children) service — local-first, Markdown.
//
// Read: if the local copy is dirty (unpushed edit) it is authoritative; otherwise refresh
// from Notion, convert blocks → Markdown, and cache it clean. Save/Clear write locally and
// mark `page_content_dirty` so the next push mirrors the blocks to Notion (see push.ts).
import { getSqlite } from '../db'
import { client, isConnected } from '../notion/service'
import { NotionClient } from '../notion/client'
import { blocksToMarkdown, markdownToBlocks } from '../notion/markdown-blocks'
import type { PageContentDto, PageContentResource } from '../../shared/finance.types'

function tableFor(resource: PageContentResource): 'incomes' | 'expenses' {
  if (resource !== 'incomes' && resource !== 'expenses') {
    throw new Error(`Page content is not supported for "${resource}"`)
  }
  return resource
}

type Row = {
  id: string
  notion_page_id: string | null
  page_content: string | null
  page_content_dirty: number
}

function loadRow(resource: PageContentResource, id: string): Row {
  const table = tableFor(resource)
  const row = getSqlite()
    .prepare(
      `SELECT id, notion_page_id, page_content, page_content_dirty FROM ${table} WHERE id = ?`
    )
    .get(id) as Row | undefined
  if (!row) throw new Error('Record not found')
  return row
}

type ApiBlock = Record<string, unknown>

/**
 * Recursively fetch children for container blocks (table, column_list, column,
 * synced_block, toggle, callout) so the markdown converter can render them.
 */
async function enrichBlockChildren(blocks: ApiBlock[]): Promise<ApiBlock[]> {
  const containerTypes = new Set(['table', 'synced_block', 'column_list', 'column'])
  const result: ApiBlock[] = []
  for (const block of blocks) {
    const type = String(block.type ?? '')
    if (type === 'table') {
      const rows = await client().getBlockChildren(String(block.id))
      result.push({ ...block, _rows: rows })
    } else if (containerTypes.has(type)) {
      const children = await client().getBlockChildren(String(block.id))
      const enriched = await enrichBlockChildren(children)
      result.push({ ...block, _children: enriched })
    } else {
      result.push(block)
    }
  }
  return result
}

/** Read page content — local when dirty, else a fresh (cached) copy from Notion. */
export async function getPageContent(
  resource: PageContentResource,
  id: string
): Promise<PageContentDto> {
  const table = tableFor(resource)
  const row = loadRow(resource, id)

  // Unpushed local edit wins — never clobber it with the remote copy.
  if (row.page_content_dirty === 1) {
    return { resource, recordId: id, markdown: row.page_content ?? '', dirty: true, synced: false }
  }

  // No Notion page yet (never pushed) or offline → return whatever we have locally.
  if (!row.notion_page_id || !isConnected()) {
    return { resource, recordId: id, markdown: row.page_content ?? '', dirty: false, synced: false }
  }

  try {
    const blocks = await client().getBlockChildren(row.notion_page_id)
    const enriched = await enrichBlockChildren(blocks)
    const markdown = blocksToMarkdown(enriched)
    // Cache the fresh copy clean so it renders instantly next time / offline.
    getSqlite()
      .prepare(`UPDATE ${table} SET page_content = ? WHERE id = ? AND page_content_dirty = 0`)
      .run(markdown, id)
    return { resource, recordId: id, markdown, dirty: false, synced: true }
  } catch {
    // Network / API failure — fall back to the cached copy rather than erroring the UI.
    return { resource, recordId: id, markdown: row.page_content ?? '', dirty: false, synced: false }
  }
}

/** Save edited Markdown locally and mark it for the next push. */
export function savePageContent(
  resource: PageContentResource,
  id: string,
  markdown: string
): PageContentDto {
  const table = tableFor(resource)
  loadRow(resource, id) // existence check
  const normalized = (markdown ?? '').replace(/\r\n/g, '\n')
  getSqlite()
    .prepare(
      `UPDATE ${table} SET page_content = ?, page_content_dirty = 1, local_updated_at = ? WHERE id = ?`
    )
    .run(normalized, Date.now(), id)
  return { resource, recordId: id, markdown: normalized, dirty: true, synced: false }
}

/** Clear the page body (keeps the page). Equivalent to saving empty content. */
export function clearPageContent(resource: PageContentResource, id: string): PageContentDto {
  return savePageContent(resource, id, '')
}

/**
 * Replace a Notion page's body with the blocks parsed from Markdown: delete existing
 * top-level children, then append the new ones (batched at Notion's 100-per-call limit).
 * Empty Markdown clears the page. Used by the push engine.
 */
export async function replaceNotionPageContent(
  c: NotionClient,
  pageId: string,
  markdown: string
): Promise<void> {
  const existing = await c.getBlockChildren(pageId)
  for (const b of existing) {
    const blockId = b.id as string | undefined
    if (blockId) await c.deleteBlock(blockId)
  }
  const blocks = markdownToBlocks(markdown)
  for (let i = 0; i < blocks.length; i += 100) {
    await c.appendBlockChildren(pageId, blocks.slice(i, i + 100))
  }
}
