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
}): Promise<unknown> {
  const base = resolveChatBaseUrl(input.baseUrl)
  const body: Record<string, unknown> = {
    model: input.model,
    messages: input.messages
  }
  if (supportsTemperatureOverride(input.model)) {
    body.temperature = 0.3
  }
  if (input.tools && input.tools.length > 0) {
    body.tools = input.tools
    body.tool_choice = input.toolChoice ?? 'auto'
  }

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

  if (!res.ok) {
    let errMsg =
      parsed &&
      typeof parsed === 'object' &&
      parsed !== null &&
      'error' in parsed &&
      typeof (parsed as { error?: { message?: unknown } }).error?.message === 'string'
        ? (parsed as { error: { message: string } }).error.message
        : `Provider error (${res.status})`

    if (
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
    }

    throw new Error(errMsg)
  }

  return parsed
}

export async function completeChat(input: {
  apiKey: string
  model: string
  messages: ChatCompletionMessage[]
  tools?: ChatToolDefinition[]
  toolChoice?: 'auto' | 'required'
  baseUrl?: string
  headers?: Record<string, string>
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
