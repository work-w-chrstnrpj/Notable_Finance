import { describe, expect, it } from 'vitest'
import {
  DEV_LOG_CAPACITY,
  summarizeForDevLog
} from '../src/main/dev-logs/store'

describe('summarizeForDevLog', () => {
  it('redacts sensitive keys and truncates long strings', () => {
    const out = summarizeForDevLog({
      apiKey: 'sk-secret',
      token: 'abc',
      note: 'x'.repeat(300),
      nested: { password: 'nope', ok: true }
    }) as Record<string, unknown>
    expect(out.apiKey).toBe('[redacted]')
    expect(out.token).toBe('[redacted]')
    expect(String(out.note).endsWith('…')).toBe(true)
    expect((out.nested as { password: string }).password).toBe('[redacted]')
  })
})

describe('DEV_LOG_CAPACITY', () => {
  it('caps ring buffer at 500', () => {
    expect(DEV_LOG_CAPACITY).toBe(500)
  })
})
