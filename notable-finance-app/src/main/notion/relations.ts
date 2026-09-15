// Relation helpers used by pull: Notion database queries embed at most 25
// related page ids and set `has_more` when the rest must be paginated via
// Retrieve a page property (developers.notion.com page-property-values).
import {
  relationHasMore,
  relationPropertyId,
  type Props
} from './page-extractors'

export function uniqueSortedIds(ids: string[]): string[] {
  return [...new Set(ids.filter((id) => id.length > 0))].sort()
}

export async function expandRelationIds(
  page: Record<string, unknown>,
  propertyName: string,
  inlineIds: string[],
  fetchAll: (pageId: string, propertyId: string) => Promise<string[]>
): Promise<string[]> {
  const props = ((page.properties as Props) ?? {}) as Props
  const fallback = uniqueSortedIds(inlineIds)
  if (!relationHasMore(props, propertyName)) return fallback
  const propertyId = relationPropertyId(props, propertyName)
  const pageId = page.id
  if (!propertyId || typeof pageId !== 'string') return fallback
  const all = await fetchAll(pageId, propertyId)
  return uniqueSortedIds(all.length > 0 ? all : inlineIds)
}
