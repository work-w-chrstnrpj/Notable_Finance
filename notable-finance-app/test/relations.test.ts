import { describe, it, expect, vi } from 'vitest'
import { relationHasMore, relationPropertyId } from '../src/main/notion/page-extractors'
import { expandRelationIds, uniqueSortedIds } from '../src/main/notion/relations'

describe('uniqueSortedIds', () => {
  it('dedupes, drops blanks, and sorts', () => {
    expect(uniqueSortedIds(['b', '', 'a', 'b'])).toEqual(['a', 'b'])
  })
})

describe('expandRelationIds', () => {
  const propertyName = 'CC Payment Covered'

  it('keeps inline ids when has_more is false', async () => {
    const fetchAll = vi.fn(async () => ['should-not-run'])
    const ids = await expandRelationIds(
      {
        id: 'page-1',
        properties: {
          [propertyName]: {
            id: 'prop-1',
            type: 'relation',
            relation: [{ id: 'a' }, { id: 'c' }],
            has_more: false
          }
        }
      },
      propertyName,
      ['c', 'a'],
      fetchAll
    )
    expect(ids).toEqual(['a', 'c'])
    expect(fetchAll).not.toHaveBeenCalled()
  })

  it('replaces the truncated inline list when has_more is true', async () => {
    const fetchAll = vi.fn(async () => ['z', 'a', 'm', 'a'])
    const ids = await expandRelationIds(
      {
        id: 'page-1',
        properties: {
          [propertyName]: {
            id: 'prop-cc',
            type: 'relation',
            relation: [{ id: 'a' }],
            has_more: true
          }
        }
      },
      propertyName,
      ['a'],
      fetchAll
    )
    expect(fetchAll).toHaveBeenCalledWith('page-1', 'prop-cc')
    expect(ids).toEqual(['a', 'm', 'z'])
  })

  it('reads has_more and property id from the page property object', () => {
    const props = {
      'CC Payment Covered': { id: 'AbC%', type: 'relation', relation: [], has_more: true }
    }
    expect(relationHasMore(props, 'CC Payment Covered')).toBe(true)
    expect(relationPropertyId(props, 'CC Payment Covered')).toBe('AbC%')
  })
})
