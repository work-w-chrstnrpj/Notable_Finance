/**
 * Chat provider catalog — OpenAI-compatible hosts + curated free/cheap models.
 * Prefer free-tier model ids for Gemini, Groq, Cerebras, OpenRouter, OpenCode Zen.
 */

export type ChatProviderId =
  | 'alibaba'
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
/**
 * Alibaba Model Studio, international (Singapore) estate.
 *
 * The account's own console export records the endpoint as workspace-scoped:
 * `https://<workspace>.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1`.
 * The legacy region domain below needs no workspace id and the docs still list
 * it as available, so it is the default. If a key returns 401
 * `invalid_api_key`, switch the credential to Custom and paste the
 * workspace host (Model Studio -> Workspace Management); keys are region-bound,
 * so a non-Singapore key fails here regardless of host.
 *
 * Free quota is granted per model (1,000,000 combined input+output tokens for
 * the text models) and is SHARED ACROSS EVERY SINGAPORE WORKSPACE on the
 * account — other apps on the same account draw down the same pool. Real-time
 * inference only: batch, fine-tuning and deployed/custom models are excluded.
 * When a model's grant is spent and Stop-on-Exhaust is on, the API returns
 * HTTP 403 `AllocationQuota.FreeTierOnly`.
 */
export const ALIBABA_CHAT_BASE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'

export const CHAT_PROVIDERS: ChatProviderDef[] = [
  {
    id: 'alibaba',
    label: 'Alibaba Model Studio (Qwen)',
    baseUrl: ALIBABA_CHAT_BASE_URL,
    keyPlaceholder: 'sk-… (Model Studio, Singapore region)',
    hint: '1M free tokens per model. Order below follows the account\u2019s text-chat priority \u2014 on HTTP 403 AllocationQuota.FreeTierOnly, pick the next one down.',
    docsUrl: 'https://modelstudio.console.alibabacloud.com/ap-southeast-1/costing-balance/free-quota',
    defaultModelId: 'qwen-flash',
    models: [
      // Priority order captured from the Model Studio free-quota console on
      // 2026-11-09 (see SpeechCoachAI/docs/api/alibaba-free-quota-models.json).
      // Quota is shared across every Singapore workspace on the account, so
      // other apps draw this pool down too. Most grants expire 2027-01-13.
      { id: 'qwen-flash', label: 'Qwen Flash', free: true },
      { id: 'qwen3.5-flash', label: 'Qwen3.5 Flash', free: true },
      { id: 'qwen3.6-flash', label: 'Qwen3.6 Flash', free: true },
      { id: 'qwen3.7-flash', label: 'Qwen3.7 Flash', free: true },
      { id: 'qwen3.8-flash', label: 'Qwen3.8 Flash', free: true },
      { id: 'qwen-flash-2025-07-28', label: 'Qwen Flash (2025-07-28)', free: true },
      { id: 'deepseek-v4.1-flash', label: 'DeepSeek V4.1 Flash', free: true },
      // Expires 2026-11-14, well before the rest of the pool.
      { id: 'qwen-plus', label: 'Qwen Plus (expires 2026-11-14)', free: true },
      { id: 'qwen3.5-plus', label: 'Qwen3.5 Plus', free: true },
      { id: 'qwen3.6-plus', label: 'Qwen3.6 Plus', free: true },
      { id: 'qwen3.7-plus', label: 'Qwen3.7 Plus', free: true },
      { id: 'qwen-plus-latest', label: 'Qwen Plus (latest)', free: true },
      { id: 'qwen-max', label: 'Qwen Max', free: true },
      { id: 'qwen3.7-max', label: 'Qwen3.7 Max', free: true },
      // Outside the priority chain, still 1M free each on this account.
      { id: 'qwen3.8-max', label: 'Qwen3.8 Max', free: true },
      { id: 'qwen3-coder-flash', label: 'Qwen3 Coder Flash', free: true },
      { id: 'qwen3.5-397b-a17b', label: 'Qwen3.5 397B A17B', free: true },
      { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro', free: true },
      { id: 'glm-5.3', label: 'GLM-5.3', free: true },
      { id: 'kimi-k3', label: 'Kimi K3', free: true }
    ]
  },
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

/**
 * Free-quota models for a provider in catalog order, starting at `startId`.
 *
 * Catalog order is the account's own priority order, so this is the sequence to
 * walk when a model answers 403 `AllocationQuota.FreeTierOnly` — each entry
 * carries its own independent grant. `startId` leads even when it is not itself
 * flagged free (an explicit paid pick still gets free fallbacks behind it), and
 * is never repeated later in the chain.
 */
export function freeModelChain(
  providerId: string | null | undefined,
  startId: string
): string[] {
  const free = modelsForProvider(providerId)
    .filter((m) => m.free)
    .map((m) => m.id)
  const startIndex = free.indexOf(startId)
  if (startIndex >= 0) return free.slice(startIndex)
  return startId ? [startId, ...free] : free
}
