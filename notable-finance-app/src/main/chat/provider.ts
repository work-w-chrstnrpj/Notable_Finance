import { DEFAULT_CHAT_BASE_URL, resolveChatBaseUrl } from './models'
import type { ChatToolDefinition } from './tools/registry'
import { appendDevLog } from '../dev-logs/store'

export type ChatCompletionMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_call_id?: string
  tool_calls?: ChatToolCall[]
  name?: string
}

export type ChatToolCall = {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export type ChatCompletionResult = {
  content: string | null
  toolCalls: ChatToolCall[]
}

function looksLikeGeminiKey(apiKey: string): boolean {
  const k = apiKey.trim()
  return k.startsWith('AIza') || k.startsWith('AQ.')
}

function looksLikeAnthropicKey(apiKey: string): boolean {
  return apiKey.trim().startsWith('sk-ant-')
}

/** Retries for transient provider failures (rate limit / overloaded). */
const RATE_LIMIT_MAX_RETRIES = 3

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Honour Retry-After when present, else exponential backoff (1s, 2s, 4s…). */
function retryDelayMs(res: Response, attempt: number): number {
  const header = res.headers.get('retry-after')
  if (header) {
    const seconds = Number(header)
    if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds * 1000, 30_000)
    const asDate = Date.parse(header)
    if (Number.isFinite(asDate)) {
      const delta = asDate - Date.now()
      if (delta > 0) return Math.min(delta, 30_000)
    }
  }
  return Math.min(1000 * 2 ** attempt, 8000)
}

/**
 * OpenAI reasoning models (o1/o3/o4-…, and gpt-5 reasoning tiers) reject any
 * `temperature` other than the default and 400 the whole request. Omit the
 * field for them; every other model keeps our low-variance default.
 */
function supportsTemperatureOverride(model: string): boolean {
  const m = model.trim().toLowerCase()
  return !/^(o\d|gpt-5)/.test(m)
}

async function postChatCompletions(input: {
  apiKey: string
  model: string
  messages: ChatCompletionMessage[]
  tools?: ChatToolDefinition[]
  toolChoice?: 'auto' | 'required'
  baseUrl?: string
  headers?: Record<string, string>
  temperature?: number
}): Promise<unknown> {
  const base = resolveChatBaseUrl(input.baseUrl)
  const body: Record<string, unknown> = {
    model: input.model,
    messages: input.messages
  }
  if (supportsTemperatureOverride(input.model)) {
    body.temperature = input.temperature ?? 0.3
  }
  if (input.tools && input.tools.length > 0) {
    body.tools = input.tools
    body.tool_choice = input.toolChoice ?? 'auto'
  }

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.apiKey}`,
        ...(input.headers ?? {})
      },
      body: JSON.stringify(body)
    })

    const text = await res.text()
    let parsed: unknown
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      parsed = null
    }

    if (res.ok) return parsed

    // Free tiers (Gemini/Groq/OpenRouter) rate-limit aggressively and a single
    // agent turn can issue several requests. Back off and retry before failing.
    if (isRetryableStatus(res.status) && attempt < RATE_LIMIT_MAX_RETRIES) {
      const waitMs = retryDelayMs(res, attempt)
      appendDevLog({
        kind: 'api',
        source: 'main',
        action: 'chat.provider.retry',
        message: `${input.model} → HTTP ${res.status}, retrying in ${waitMs}ms (attempt ${attempt + 1}/${RATE_LIMIT_MAX_RETRIES})`,
        detail: { model: input.model, status: res.status, waitMs },
        ok: false
      })
      await sleep(waitMs)
      continue
    }

    let errMsg =
      parsed &&
      typeof parsed === 'object' &&
      parsed !== null &&
      'error' in parsed &&
      typeof (parsed as { error?: { message?: unknown } }).error?.message === 'string'
        ? (parsed as { error: { message: string } }).error.message
        : `Provider error (${res.status})`

    if (res.status === 429) {
      errMsg = `Rate limit reached (429) on ${input.model}. Free tiers allow only a few requests per minute and one chat turn can use several. Wait ~30–60s, or switch to a different model/provider in Configure AI. Provider said: ${errMsg}`
    } else if (
      base === DEFAULT_CHAT_BASE_URL &&
      looksLikeGeminiKey(input.apiKey) &&
      /incorrect api key|invalid.*api.?key|platform\.openai/i.test(errMsg)
    ) {
      errMsg = `${errMsg} This looks like a Gemini key sent to OpenAI. In Configure AI, set Provider to Gemini (or edit the credential and choose Gemini).`
    } else if (
      base === DEFAULT_CHAT_BASE_URL &&
      looksLikeAnthropicKey(input.apiKey) &&
      /incorrect api key|invalid.*api.?key|platform\.openai/i.test(errMsg)
    ) {
      errMsg = `${errMsg} This looks like an Anthropic key sent to OpenAI. In Configure AI, set Provider to Claude (or use OpenRouter for free Claude-class models).`
    } else if (res.status === 404 && /model/i.test(errMsg)) {
      errMsg = `${errMsg} — the model "${input.model}" isn't available for this key's provider. Pick a listed model in the Model dropdown.`
    }

    throw new Error(errMsg)
  }
}

export async function completeChat(input: {
  apiKey: string
  model: string
  messages: ChatCompletionMessage[]
  tools?: ChatToolDefinition[]
  toolChoice?: 'auto' | 'required'
  baseUrl?: string
  headers?: Record<string, string>
  temperature?: number
}): Promise<ChatCompletionResult> {
  const startedAt = Date.now()
  let body: unknown
  try {
    body = await postChatCompletions(input)
  } catch (err) {
    appendDevLog({
      kind: 'api',
      source: 'main',
      action: 'chat.provider.error',
      message: `${input.model} → ${err instanceof Error ? err.message : String(err)}`,
      detail: { model: input.model, toolsOffered: input.tools?.length ?? 0 },
      durationMs: Date.now() - startedAt,
      ok: false
    })
    throw err
  }
  const choice = (
    body as {
      choices?: Array<{
        finish_reason?: string | null
        message?: {
          content?: string | null
          tool_calls?: Array<{
            id?: string
            type?: string
            function?: { name?: string; arguments?: string }
          }>
        }
      }>
    } | null
  )?.choices?.[0]
  const message = choice?.message

  const rawToolCalls = message?.tool_calls ?? []
  const toolCalls: ChatToolCall[] = []
  rawToolCalls.forEach((tc, index) => {
    // Only the function name is truly required. Some OpenAI-compatible hosts
    // (notably Gemini's compat layer) omit or blank the `id`; synthesize a
    // stable one so the call survives and the follow-up tool result can match.
    if (!tc?.function?.name) return
    const id = tc.id && tc.id.trim() ? tc.id : `call_${index}`
    toolCalls.push({
      id,
      type: 'function',
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments ?? '{}'
      }
    })
  })

  const content = typeof message?.content === 'string' ? message.content : null

  appendDevLog({
    kind: 'api',
    source: 'main',
    action: 'chat.provider.completion',
    message: `${input.model} → finish=${choice?.finish_reason ?? 'n/a'} tools=${toolCalls.length}/${rawToolCalls.length} text=${content?.trim() ? 'yes' : 'no'}`,
    detail: {
      model: input.model,
      finishReason: choice?.finish_reason ?? null,
      rawToolCallCount: rawToolCalls.length,
      keptToolCallCount: toolCalls.length,
      droppedForMissingName: rawToolCalls.length - toolCalls.length,
      hadContent: Boolean(content?.trim()),
      toolsOffered: input.tools?.length ?? 0
    },
    durationMs: Date.now() - startedAt,
    ok: toolCalls.length > 0 || Boolean(content?.trim())
  })

  return { content, toolCalls }
}

/**
 * Live model discovery: every OpenAI-compatible host exposes GET {base}/models.
 * Using the key's own catalogue avoids the stale hardcoded list (and the silent
 * model coercion that made "the model doesn't match my key" so confusing).
 */
export async function fetchRemoteModelIds(input: {
  apiKey: string
  baseUrl?: string | null
  headers?: Record<string, string>
}): Promise<string[]> {
  const base = resolveChatBaseUrl(input.baseUrl)
  const res = await fetch(`${base}/models`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      ...(input.headers ?? {})
    }
  })

  const text = await res.text()
  let parsed: unknown = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = null
  }

  if (!res.ok) {
    const msg =
      parsed &&
      typeof parsed === 'object' &&
      'error' in parsed &&
      typeof (parsed as { error?: { message?: unknown } }).error?.message === 'string'
        ? (parsed as { error: { message: string } }).error.message
        : `Could not list models (HTTP ${res.status})`
    throw new Error(msg)
  }

  const data = (parsed as { data?: Array<{ id?: unknown }> } | null)?.data
  if (!Array.isArray(data)) return []

  const ids: string[] = []
  for (const row of data) {
    if (typeof row?.id !== 'string') continue
    // Gemini's compat layer returns "models/gemini-2.5-flash" — normalise.
    const id = row.id.replace(/^models\//, '').trim()
    if (id && !ids.includes(id)) ids.push(id)
  }
  return ids
}

/** Convenience for non-tool replies (legacy). */
export async function completeChatText(input: {
  apiKey: string
  model: string
  messages: ChatCompletionMessage[]
  baseUrl?: string
}): Promise<string> {
  const result = await completeChat(input)
  return result.content?.trim() || 'No response from the model.'
}
