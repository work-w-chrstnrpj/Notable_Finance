import { describe, expect, it } from 'vitest'
import {
  GEMINI_CHAT_BASE_URL,
  baseUrlForProviderPreset,
  coerceModelForProvider,
  decorateRemoteModels,
  defaultModelForProvider,
  detectProviderFromKey,
  listChatProviders,
  modelsForProvider,
  normalizeChatModelId,
  pickModelForProviderList,
  providerPresetFromBaseUrl,
  resolveChatBaseUrl
} from '../src/main/chat/models'

describe('chat provider catalog', () => {
  it('includes free-tier providers the UX targets', () => {
    const ids = listChatProviders().map((p) => p.id)
    expect(ids).toEqual(
      expect.arrayContaining([
        'gemini',
        'mistral',
        'claude',
        'openai',
        'groq',
        'cerebras',
        'openrouter',
        'opencode',
        'custom'
      ])
    )
  })

  it('defaults empty base URL to OpenAI', () => {
    expect(resolveChatBaseUrl(null)).toBe('https://api.openai.com/v1')
    expect(providerPresetFromBaseUrl(null)).toBe('openai')
  })

  it('maps Gemini / Groq / OpenRouter base URLs', () => {
    expect(baseUrlForProviderPreset('gemini')).toBe(GEMINI_CHAT_BASE_URL)
    expect(providerPresetFromBaseUrl(GEMINI_CHAT_BASE_URL)).toBe('gemini')
    expect(baseUrlForProviderPreset('groq')).toContain('groq.com')
    expect(baseUrlForProviderPreset('openrouter')).toContain('openrouter.ai')
    expect(baseUrlForProviderPreset('opencode')).toContain('opencode.ai')
  })

  it('filters models per provider and coerces mismatches', () => {
    const geminiModels = modelsForProvider('gemini')
    expect(geminiModels.every((m) => m.id.includes('gemini') || m.id.includes('flash'))).toBe(true)
    expect(coerceModelForProvider('gemini', 'gpt-4o-mini')).toBe(defaultModelForProvider('gemini'))
    expect(coerceModelForProvider('groq', 'llama-3.1-8b-instant')).toBe('llama-3.1-8b-instant')
    expect(coerceModelForProvider('mistral', 'gemini-2.5-flash')).toBe(defaultModelForProvider('mistral'))
    expect(coerceModelForProvider('mistral', 'open-mistral-nemo')).toBe('open-mistral-nemo')
  })

  it('picks a valid model when switching provider lists', () => {
    const mistral = modelsForProvider('mistral')
    expect(pickModelForProviderList('gemini-2.5-flash', mistral, 'open-mistral-nemo')).toBe(
      'open-mistral-nemo'
    )
    expect(pickModelForProviderList('mistral-small-latest', mistral)).toBe('mistral-small-latest')
    const gemini = modelsForProvider('gemini')
    expect(pickModelForProviderList('open-mistral-nemo', gemini, 'gemini-2.5-flash')).toBe(
      'gemini-2.5-flash'
    )
  })

  it('normalizes Gemini display names to API ids', () => {
    expect(normalizeChatModelId('Gemini 2.5 Flash')).toBe('gemini-2.5-flash')
    expect(normalizeChatModelId('gpt-4o-mini')).toBe('gpt-4o-mini')
  })
})

describe('key → provider auto-detection (6.9)', () => {
  it('maps known key prefixes to their host', () => {
    expect(detectProviderFromKey('AIzaSyExample')).toBe('gemini')
    expect(detectProviderFromKey('gsk_example')).toBe('groq')
    expect(detectProviderFromKey('sk-or-v1-example')).toBe('openrouter')
    expect(detectProviderFromKey('sk-ant-example')).toBe('claude')
    expect(detectProviderFromKey('csk-example')).toBe('cerebras')
    expect(detectProviderFromKey('sk-proj-example')).toBe('openai')
  })

  it('returns null when the prefix is not distinctive (e.g. Mistral)', () => {
    expect(detectProviderFromKey('abc123mistralkey')).toBeNull()
    expect(detectProviderFromKey('')).toBeNull()
  })
})

describe('remote model decoration (6.9)', () => {
  it('reuses curated labels/free flags and sorts free first', () => {
    const out = decorateRemoteModels(
      ['gemini-2.5-pro', 'gemini-2.5-flash', 'some-unknown-model'],
      'gemini'
    )
    expect(out[0]!.id).toBe('gemini-2.5-flash')
    expect(out[0]!.free).toBe(true)
    expect(out.find((m) => m.id === 'some-unknown-model')?.label).toBe('some-unknown-model')
  })

  it('treats OpenRouter :free ids as free even when uncurated', () => {
    const out = decorateRemoteModels(['vendor/model-x:free', 'vendor/model-y'], 'openrouter')
    expect(out[0]!.id).toBe('vendor/model-x:free')
    expect(out[0]!.free).toBe(true)
  })
})
