import { describe, expect, it } from 'vitest'
import { fingerprintApiKey } from '../src/main/chat/credentials-vault'

describe('fingerprintApiKey', () => {
  it('masks short keys', () => {
    expect(fingerprintApiKey('abcd')).toBe('••••')
  })

  it('keeps last four for longer keys', () => {
    expect(fingerprintApiKey('sk-abcdefghijklmnopqrstuvwxyz')).toBe('••••wxyz')
  })
})
