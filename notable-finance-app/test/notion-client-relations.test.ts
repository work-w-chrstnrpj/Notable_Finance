import { afterEach, describe, expect, it, vi } from 'vitest'
import { NotionClient } from '../src/main/notion/client'

describe('NotionClient.getPageRelationIds', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('paginates Retrieve a page property until has_more is false', async () => {
    const fetchMock = vi.fn(async (input: string | URL) => {
      const url = String(input)
      if (url.includes('start_cursor=cursor-2')) {
        return {
          ok: true,
          json: async () => ({
            results: [{ relation: { id: 'exp-26' } }, { relation: { id: 'exp-27' } }],
            has_more: false,
            next_cursor: null
          })
        }
      }
      return {
        ok: true,
        json: async () => ({
          results: [{ relation: { id: 'exp-1' } }],
          has_more: true,
          next_cursor: 'cursor-2'
        })
      }
    })
    vi.stubGlobal('fetch', fetchMock)

    const client = new NotionClient('test-token')
    const ids = await client.getPageRelationIds('page-1', 'prop/id')

    expect(ids).toEqual(['exp-1', 'exp-26', 'exp-27'])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const firstUrl = String(fetchMock.mock.calls[0][0])
    expect(firstUrl).toContain('/v1/pages/page-1/properties/prop%2Fid')
    expect(firstUrl).not.toContain('start_cursor')
    const secondUrl = String(fetchMock.mock.calls[1][0])
    expect(secondUrl).toContain('start_cursor=cursor-2')
  })
})
