/**
 * Chat provider catalog — OpenAI-compatible hosts + curated free/cheap models.
 * Prefer free-tier model ids for Gemini, Groq, Cerebras, OpenRouter, OpenCode Zen.
 */

export type ChatProviderId =
  | 'openai'
  | 'gemini'
  | 'mistral'
  | 'claude'
  | 'groq'
  | 'cerebras'
  | 'openrouter'
  | 'opencode'
  | 'custom'

export type ChatModelOption = {
  id: string
  label: string
  /** Highlighted for free-tier / free-route use. */
  free?: boolean
}

export type ChatProviderDef = {
  id: ChatProviderId
  label: string
  /** null → OpenAI default host. */
  baseUrl: string | null
  keyPlaceholder: string
  /** Short UX hint under the provider picker. */
  hint: string
  docsUrl?: string
  /** Extra request headers (e.g. OpenRouter). */
  headers?: Record<string, string>
  defaultModelId: string
  models: ChatModelOption[]
}

export const DEFAULT_CHAT_BASE_URL = 'https://api.openai.com/v1'
export const GEMINI_CHAT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai'

export const CHAT_PROVIDERS: ChatProviderDef[] = [
  {
    id: 'gemini',
    label: 'Gemini (Google AI)',
    baseUrl: GEMINI_CHAT_BASE_URL,
    keyPlaceholder: 'AIza… or Google AI Studio key',
    hint: 'Free tier via Google AI Studio. Use hyphenated model ids.',
    docsUrl: 'https://aistudio.google.com/apikey',
    defaultModelId: 'gemini-2.5-flash',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', free: true },
      { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', free: true },
      { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite', free: true },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' }
    ]
  },
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    keyPlaceholder: 'gsk_…',
    hint: 'Fast free tier — Llama / Gemma on GroqCloud.',
    docsUrl: 'https://console.groq.com/keys',
    defaultModelId: 'llama-3.1-8b-instant',
    models: [
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant', free: true },
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile', free: true },
      { id: 'gemma2-9b-it', label: 'Gemma 2 9B', free: true },
      { id: 'qwen/qwen3-32b', label: 'Qwen3 32B', free: true }
    ]
  },
  {
    id: 'cerebras',
    label: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    keyPlaceholder: 'csk-…',
    hint: 'Free tier — very fast Llama inference.',
    docsUrl: 'https://cloud.cerebras.ai/',
    defaultModelId: 'llama3.1-8b',
    models: [
      { id: 'llama3.1-8b', label: 'Llama 3.1 8B', free: true },
      { id: 'llama-3.3-70b', label: 'Llama 3.3 70B', free: true },
      { id: 'qwen-3-32b', label: 'Qwen 3 32B', free: true }
    ]
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    keyPlaceholder: 'sk-or-…',
    hint: 'Many free models (ids ending in :free). One key, many hosts.',
    docsUrl: 'https://openrouter.ai/keys',
    headers: {
      'HTTP-Referer': 'https://notable-finance.app',
      'X-Title': 'Notable Finance'
    },
    defaultModelId: 'google/gemma-3-4b-it:free',
    models: [
      { id: 'google/gemma-3-4b-it:free', label: 'Gemma 3 4B (free)', free: true },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (free)', free: true },
      { id: 'qwen/qwen3-4b:free', label: 'Qwen3 4B (free)', free: true },
      { id: 'mistralai/mistral-small-3.1-24b-instruct:free', label: 'Mistral Small (free)', free: true },
      { id: 'google/gemini-2.0-flash-exp:free', label: 'Gemini 2.0 Flash Exp (free)', free: true }
    ]
  },
  {
    id: 'opencode',
    label: 'OpenCode Zen',
    baseUrl: 'https://opencode.ai/zen/v1',
    keyPlaceholder: 'OpenCode Zen API key',
    hint: 'OpenCode Zen free chat/completions models.',
    docsUrl: 'https://opencode.ai/docs/zen/',
    defaultModelId: 'mimo-v2.5-free',
    models: [
      { id: 'mimo-v2.5-free', label: 'MiMo V2.5 Free', free: true },
      { id: 'laguna-s-2.1-free', label: 'Laguna S 2.1 Free', free: true },
      { id: 'north-mini-code-free', label: 'North Mini Code Free', free: true },
      { id: 'nemotron-3-ultra-free', label: 'Nemotron 3 Ultra Free', free: true },
      { id: 'deepseek-v4-flash-free', label: 'DeepSeek V4 Flash Free', free: true }
    ]
  },
  {
    id: 'mistral',
    label: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    keyPlaceholder: '…',
    hint: 'Mistral API — free credits / experiment models vary by account.',
    docsUrl: 'https://console.mistral.ai/api-keys/',
    defaultModelId: 'open-mistral-nemo',
    models: [
      { id: 'open-mistral-nemo', label: 'Open Mistral Nemo', free: true },
      { id: 'mistral-small-latest', label: 'Mistral Small' },
      { id: 'mistral-medium-latest', label: 'Mistral Medium' }
    ]
  },
  {
    id: 'claude',
    label: 'Claude (Anthropic)',
    baseUrl: 'https://api.anthropic.com/v1',
    keyPlaceholder: 'sk-ant-…',
    hint: 'Anthropic OpenAI-compat layer. Usually paid — for free Claude-class models prefer OpenRouter.',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    defaultModelId: 'claude-3-5-haiku-latest',
    models: [
      { id: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku' },
      { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
      { id: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet' }
    ]
  },
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: null,
    keyPlaceholder: 'sk-…',
    hint: 'Official OpenAI — free trial credits only, not a permanent free tier.',
    docsUrl: 'https://platform.openai.com/api-keys',
    defaultModelId: 'gpt-4o-mini',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
      { id: 'gpt-4.1', label: 'GPT-4.1' },
      { id: 'o4-mini', label: 'o4-mini' }
    ]
  },
  {
    id: 'custom',
    label: 'Custom (OpenAI-compatible)',
    baseUrl: null,
    keyPlaceholder: 'API key',
    hint: 'Any host that speaks /v1/chat/completions. Enter base URL ending in /v1.',
    defaultModelId: 'gpt-4o-mini',
    models: [{ id: 'gpt-4o-mini', label: 'Custom model (edit id in Chat)' }]
  }
]

/** Flat curated list (legacy IPC) — all known models. */
export const CHAT_CURATED_MODELS: ChatModelOption[] = (() => {
  const seen = new Set<string>()
  const out: ChatModelOption[] = []
  for (const p of CHAT_PROVIDERS) {
    for (const m of p.models) {
      if (seen.has(m.id)) continue
      seen.add(m.id)
      out.push(m)
    }
  }
  return out
})()

export const DEFAULT_CHAT_MODEL = 'gemini-2.5-flash'

export type ChatProviderPreset = ChatProviderId

export function listChatProviders(): ChatProviderDef[] {
  return CHAT_PROVIDERS
}

export function getChatProvider(id: string | null | undefined): ChatProviderDef | null {
  if (!id) return null
  return CHAT_PROVIDERS.find((p) => p.id === id) ?? null
}

export function resolveChatBaseUrl(baseUrl: string | null | undefined): string {
  const trimmed = (baseUrl ?? '').trim().replace(/\/$/, '')
  return trimmed || DEFAULT_CHAT_BASE_URL
}

export function baseUrlForProviderPreset(
  preset: ChatProviderId,
  customBaseUrl?: string | null
): string | null {
  if (preset === 'custom') {
    const t = (customBaseUrl ?? '').trim().replace(/\/$/, '')
    return t || null
  }
  if (preset === 'openai') return null
  const def = getChatProvider(preset)
  return def?.baseUrl ?? null
}

/** Infer provider from stored base URL (legacy credentials without providerId). */
export function providerPresetFromBaseUrl(baseUrl: string | null | undefined): ChatProviderId {
  const resolved = resolveChatBaseUrl(baseUrl)
  if (resolved === DEFAULT_CHAT_BASE_URL) return 'openai'
  for (const p of CHAT_PROVIDERS) {
    if (!p.baseUrl) continue
    if (resolved === p.baseUrl || resolved.startsWith(p.baseUrl + '/')) return p.id
  }
  return 'custom'
}

export function modelsForProvider(providerId: string | null | undefined): ChatModelOption[] {
  const def = getChatProvider(providerId ?? 'openai')
  return def?.models ?? CHAT_CURATED_MODELS
}

export function defaultModelForProvider(providerId: string | null | undefined): string {
  const def = getChatProvider(providerId ?? 'openai')
  return def?.defaultModelId ?? DEFAULT_CHAT_MODEL
}

export function headersForProvider(providerId: string | null | undefined): Record<string, string> | undefined {
  return getChatProvider(providerId)?.headers
}

/**
 * Normalize casual model labels to API ids.
 * e.g. "Gemini 2.5 Flash" → "gemini-2.5-flash"
 */
export function normalizeChatModelId(model: string): string {
  const t = model.trim()
  if (!t) return t
  if (/^gemini[\s._-]*\d/i.test(t) || /^gemini[\s._-]+(flash|pro)/i.test(t)) {
    return t
      .toLowerCase()
      .replace(/[_\s]+/g, '-')
      .replace(/-+/g, '-')
  }
  return t
}

/**
 * Keep the current model when it is still in the provider list; otherwise prefer
 * a free-tier option, then the first curated id, then an explicit fallback.
 */
export function pickModelForProviderList(
  currentId: string,
  models: ChatModelOption[],
  fallbackId?: string
): string {
  if (currentId && models.some((m) => m.id === currentId)) return currentId
  const free = models.find((m) => m.free)
  return free?.id ?? models[0]?.id ?? fallbackId ?? currentId
}

/**
 * Guess the provider from the API key's prefix so users don't have to know that
 * the Name field is cosmetic and the Provider dropdown is what actually picks
 * the host. Mistral keys have no distinctive prefix — the dropdown stays the
 * override for those.
 */
export function detectProviderFromKey(apiKey: string): ChatProviderId | null {
  const k = (apiKey ?? '').trim()
  if (!k) return null
  if (k.startsWith('AIza') || k.startsWith('AQ.')) return 'gemini'
  if (k.startsWith('gsk_')) return 'groq'
  if (k.startsWith('sk-or-')) return 'openrouter'
  if (k.startsWith('sk-ant-')) return 'claude'
  if (k.startsWith('csk-')) return 'cerebras'
  if (k.startsWith('sk-')) return 'openai'
  return null
}

/**
 * Turn raw ids from GET /models into pickable options, reusing curated labels /
 * free flags where we recognise the id. Free + known first (remote lists such as
 * OpenRouter's run to hundreds of entries).
 */
export function decorateRemoteModels(
  ids: string[],
  providerId?: string | null
): ChatModelOption[] {
  const known = new Map<string, ChatModelOption>()
  for (const m of CHAT_CURATED_MODELS) known.set(m.id, m)
  for (const m of modelsForProvider(providerId)) known.set(m.id, m)

  return ids
    .map((id) => {
      const hit = known.get(id)
      return {
        id,
        label: hit?.label ?? id,
        free: hit?.free === true || /:free$/.test(id)
      }
    })
    .sort((a, b) => {
      if (a.free !== b.free) return a.free ? -1 : 1
      return a.id.localeCompare(b.id)
    })
}

/** Pick a valid model for a provider when the current id is wrong/mismatched. */
export function coerceModelForProvider(
  providerId: string | null | undefined,
  modelId: string | null | undefined
): string {
  const models = modelsForProvider(providerId)
  const normalized = normalizeChatModelId(modelId ?? '')
  if (normalized && providerId === 'custom' && normalized) return normalized
  return pickModelForProviderList(normalized, models, defaultModelForProvider(providerId))
}
