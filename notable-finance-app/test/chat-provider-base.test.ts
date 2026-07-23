import { describe, expect, it } from 'vitest'
import {
  GEMINI_CHAT_BASE_URL,
  baseUrlForProviderPreset,
  coerceModelForProvider,
  defaultModelForProvider,
  listChatProviders,
  modelsForProvider,
  normalizeChatModelId,
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
  })

  it('normalizes Gemini display names to API ids', () => {
    expect(normalizeChatModelId('Gemini 2.5 Flash')).toBe('gemini-2.5-flash')
    expect(normalizeChatModelId('gpt-4o-mini')).toBe('gpt-4o-mini')
  })
})
