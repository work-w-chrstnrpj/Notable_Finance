import { describe, it, expect } from 'vitest'
import { NotionApiError } from '../src/main/notion/client'
import {
  isNotionGoneError,
  localsMissingFromNotion
} from '../src/main/sync/notion-gone'

describe('isNotionGoneError', () => {
  it('detects the archived-block validation message', () => {
    expect(
      isNotionGoneError(
        new Error("Can't edit block that is archived. You must unarchive the block before editing.")
      )
    ).toBe(true)
  })

  it('detects trash-related messages', () => {
    expect(isNotionGoneError(new Error('Page is in_trash and cannot be edited'))).toBe(true)
    expect(isNotionGoneError(new Error('This page has been trashed'))).toBe(true)
  })

  it('detects NotionApiError 404 / object_not_found', () => {
    expect(isNotionGoneError(new NotionApiError('missing', 404, 'object_not_found'))).toBe(true)
    expect(isNotionGoneError(new NotionApiError('gone', 400, 'object_not_found'))).toBe(true)
  })

  it('detects could-not-find style messages', () => {
    expect(isNotionGoneError(new Error('Could not find page with ID: abc'))).toBe(true)
  })

  it('ignores unrelated errors', () => {
    expect(isNotionGoneError(new Error('rate limited'))).toBe(false)
    expect(isNotionGoneError(new NotionApiError('bad request', 400, 'validation_error'))).toBe(
      false
    )
    expect(isNotionGoneError('string')).toBe(false)
    expect(isNotionGoneError(null)).toBe(false)
  })
})

describe('localsMissingFromNotion', () => {
  it('returns only live locals whose notion_page_id is absent remotely', () => {
    const remote = new Set(['n1', 'n2'])
    const locals = [
      { id: 'a', notion_page_id: 'n1', deleted: 0 },
      { id: 'b', notion_page_id: 'n-gone', deleted: 0 },
      { id: 'c', notion_page_id: 'n-gone-too', deleted: 1 },
      { id: 'd', notion_page_id: null, deleted: 0 }
    ]
    expect(localsMissingFromNotion(locals, remote).map((r) => r.id)).toEqual(['b'])
  })

  it('returns empty when every live page is still present', () => {
    const remote = new Set(['n1'])
    expect(
      localsMissingFromNotion([{ id: 'a', notion_page_id: 'n1', deleted: 0 }], remote)
    ).toEqual([])
  })
})
