import { platform } from 'node:os'
import { getUiSettings } from '../settings/ui'
import type {
  ChatDraftDto,
  ChatMessageDto,
  ChatOverlayId,
  ChatSendResult,
  ChatStatusDto,
  ChatThreadDto
} from '../../shared/finance.types'
import {
  probeAppleReadOnly,
  runAppleReadOnlyTurn,
  shouldUseAppleReadOnly
} from './apple'
import { getCredential, getDefaultCredentialId, listCredentials } from './credentials'
import { readChatApiKey, readChatBaseUrl, readChatProviderId } from './credentials-vault'
import { currentMonth, todayIso } from './dates'
import {
  DEFAULT_CHAT_MODEL,
  coerceModelForProvider,
  headersForProvider,
  normalizeChatModelId,
  providerPresetFromBaseUrl
} from './models'
import {
  completeChat,
  type ChatCompletionMessage,
  type ChatCompletionResult,
  type ChatToolCall
} from './provider'
import { routeChatSkill, skillSystemAddendum } from './skills/router'
import {
  CHAT_TOOL_DEFINITIONS,
  executeChatTool
} from './tools/registry'
import { getDraft } from './drafts'
import {
  detectBudgetGuardFromToolResults,
  detectKeywordCheer,
  effectiveOverlayForPrompt,
  formatBudgetGuardAppendix,
  overlaySystemPrompt,
  parseSlashOverlay,
  resolveActiveOverlay
} from './overlays'
import {
  addMessage,
  createThread,
  getThread,
  listMessages,
  maybeSetTitleFromUserMessage,
  updateThread
} from './threads'
import { appendDevLog } from '../dev-logs/store'

const MAX_TURNS = 20
const MAX_TOOL_ROUNDS = 8

const PHASE_65_SYSTEM = `You are Notable Finance's Finance Copilot (Phase 6.5+ — overlays + confirm-gated writes + Apple/on-device read-only option).

You answer from local SQLite via read tools and may **propose** creates/updates via propose* tools. Records are written ONLY when the user Approves a draft card in the UI (chat:confirm). Cancel does nothing.

Rules:
- Prefer tools over guessing. Never invent balances, accounts, or categories.
- To log or edit ANY record you MUST call the matching propose* tool — that is the only way a confirm card appears for the user. NEVER claim you drafted, logged, saved, or created something ("na-draft ko", "na-log na", "done") unless you actually called a propose* tool in this turn. If you only have a text reply, you have NOT drafted anything.
- After propose* tools, briefly explain the draft and any missing fields. Do NOT say "saved" / "created" until Approve.
- Finance delete / trash / archive / burahin: refuse. Soft/hard delete stay in the normal app UI.
- Rebudget remains plan-only (planRebudget) — no budget writes.
- Expense view questions: pass expenseViewMode (Monthly, Unpaid Pasabuy, Unpaid CC, To pay, …).
- Follow the active slash overlay voice instructions. Overlays never change amounts or enable delete.
- Apple/on-device path is read-only — never use propose* tools there.`

const REFUSE_DELETE =
  'I can’t delete finance records from Chat. Soft delete and hard delete stay in the normal app UI (Income, Expense, History, etc.). You can delete chat conversations from the history list or Configure AI — that only removes chat threads, not your money data.'

const WRITE_NEEDS_KEY =
  'Select an API credential for writes. Apple/on-device Q&A is read-only — add a named API key in Configure AI to log or edit records.'

function assertChatEnabled(): void {
  if (!getUiSettings().chatEnabled) {
    throw new Error('Chat is disabled. Enable it in Settings → AI / Chat.')
  }
}

export async function getChatStatus(opts?: { forceRefresh?: boolean }): Promise<ChatStatusDto> {
  const ui = getUiSettings()
  const creds = listCredentials()
  const defaultId = getDefaultCredentialId()
  const apple = await probeAppleReadOnly({ forceRefresh: opts?.forceRefresh })
  return {
    chatEnabled: ui.chatEnabled,
    preferAppleReadOnly: ui.chatPreferAppleReadOnly,
    defaultModel: ui.chatDefaultModel || DEFAULT_CHAT_MODEL,
    credentialCount: creds.length,
    hasDefaultCredential: Boolean(defaultId),
    appleAvailable: apple.available,
    appleStatus: apple.status,
    appleStatusLabel: apple.label,
    appleDetail: apple.detail,
    appleReasonCode: apple.reasonCode ?? null,
    canUseByok: creds.length > 0,
    canUseAppleReadOnly: apple.available && ui.chatPreferAppleReadOnly
  }
}

export function isAppleOs(): boolean {
  return platform() === 'darwin'
}

const MEMO_REPLAY_TURNS = 2

function extractMemo(payloadJson: string | null): string | null {
  if (!payloadJson) return null
  try {
    const memo = (JSON.parse(payloadJson) as { contextMemo?: unknown }).contextMemo
    return typeof memo === 'string' && memo.trim() ? memo.trim() : null
  } catch {
    return null
  }
}

function buildHistoryMessages(prior: ChatMessageDto[]): ChatCompletionMessage[] {
  const usable = prior.filter((m) => m.role === 'user' || m.role === 'assistant')
  const truncated = usable.slice(-MAX_TURNS * 2)

  // Only the most recent few assistant turns get their compact memo replayed,
  // to bound token cost (#10 compact-memo strategy).
  const memoIds = new Set(
    truncated
      .filter((m) => m.role === 'assistant' && extractMemo(m.payloadJson))
      .slice(-MEMO_REPLAY_TURNS)
      .map((m) => m.id)
  )

  return truncated.map((m) => {
    if (m.role === 'assistant') {
      const memo = memoIds.has(m.id) ? extractMemo(m.payloadJson) : null
      return {
        role: 'assistant',
        content: memo ? `${m.content}\n\n[Context for follow-ups: ${memo}]` : m.content
      }
    }
    return { role: 'user', content: m.content }
  })
}

function truncateToolResult(value: unknown): string {
  const json = JSON.stringify(value)
  const max = 12_000
  if (json.length <= max) return json
  return `${json.slice(0, max)}…[truncated]`
}

function collectDraft(payload: unknown, bucket: ChatDraftDto[]): void {
  if (!payload || typeof payload !== 'object') return
  const draft = (payload as { draft?: ChatDraftDto }).draft
  if (draft && typeof draft.id === 'string') {
    const fresh = getDraft(draft.id) ?? draft
    // A later round proposing the same kind supersedes the earlier draft for
    // the same thread — keep the newest so the UI shows one confirm card.
    const dupeIdx = bucket.findIndex((d) => d.id === fresh.id)
    if (dupeIdx >= 0) {
      bucket[dupeIdx] = fresh
      return
    }
    const sameKindIdx = bucket.findIndex(
      (d) => d.kind === fresh.kind && d.threadId === fresh.threadId
    )
    if (sameKindIdx >= 0) bucket[sameKindIdx] = fresh
    else bucket.push(fresh)
  }
}

/**
 * Fallback prose when the model runs a tool but returns empty content — small /
 * free models frequently stop after a tool call. Rather than discard a draft
 * the user could Approve, describe it so the confirm card has context.
 */
/** Does the reply assert a write happened? Used to catch a model that narrates
 * "na-draft ko na" without actually calling a propose* tool. */
function claimsWrite(text: string): boolean {
  return /\b(drafted|logged|saved|created|recorded|added it)\b|na-?draft|na-?log|naka-?lista|nai-?log|na-?record|na-?save/i.test(
    text
  )
}

function synthesizeDraftReply(drafts: ChatDraftDto[]): string {
  const lines = drafts.map((d) => {
    if (d.missingRequired.length > 0) {
      return `${d.summary}\nStill need: ${d.missingRequired.join(', ')}.`
    }
    return `${d.summary}\nReview the draft below and tap Approve to save it.`
  })
  return lines.join('\n\n')
}

async function runToolLoop(input: {
  apiKey: string
  model: string
  messages: ChatCompletionMessage[]
  threadId: string
  baseUrl?: string | null
  headers?: Record<string, string>
  /** Write intents: require a tool call on the first round so the model can't
   * narrate "I logged it" without actually proposing a draft. */
  forceToolFirstRound?: boolean
}): Promise<{
  text: string
  drafts: ChatDraftDto[]
  toolResults: unknown[]
  toolNames: string[]
}> {
  const messages = [...input.messages]
  const drafts: ChatDraftDto[] = []
  const toolResults: unknown[] = []
  const toolNames: string[] = []
  const baseUrl = input.baseUrl ?? undefined
  const headers = input.headers

  const done = (text: string) => ({ text, drafts, toolResults, toolNames })

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const forceThisRound = Boolean(input.forceToolFirstRound) && round === 0
    let result: ChatCompletionResult
    try {
      result = await completeChat({
        apiKey: input.apiKey,
        model: input.model,
        messages,
        tools: CHAT_TOOL_DEFINITIONS,
        toolChoice: forceThisRound ? 'required' : undefined,
        baseUrl,
        headers
      })
    } catch (err) {
      if (!forceThisRound) throw err
      // Some OpenAI-compatible hosts reject tool_choice:"required" — retry the
      // same round with auto so forcing never hard-fails the turn.
      appendDevLog({
        kind: 'api',
        source: 'main',
        action: 'chat.provider.forceToolFallback',
        message: `${input.model} rejected tool_choice=required; retrying with auto`,
        detail: { model: input.model },
        ok: false
      })
      result = await completeChat({
        apiKey: input.apiKey,
        model: input.model,
        messages,
        tools: CHAT_TOOL_DEFINITIONS,
        baseUrl,
        headers
      })
    }

    if (!result.toolCalls.length) {
      const text = result.content?.trim()
      if (text) return done(text)
      // No tool calls and no prose. Salvage a draft the model already built;
      // otherwise fall through to one final nudge before giving up.
      if (drafts.length > 0) return done(synthesizeDraftReply(drafts))
      break
    }

    messages.push({
      role: 'assistant',
      // Some compat layers reject a null content alongside tool_calls — send ''.
      content: result.content ?? '',
      tool_calls: result.toolCalls
    })

    for (const call of result.toolCalls as ChatToolCall[]) {
      let payload: unknown
      try {
        payload = executeChatTool(call.function.name, call.function.arguments, {
          threadId: input.threadId
        })
      } catch (err) {
        payload = {
          error: err instanceof Error ? err.message : String(err)
        }
      }
      toolResults.push(payload)
      toolNames.push(call.function.name)
      collectDraft(payload, drafts)
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: truncateToolResult(payload)
      })
    }
  }

  const final = await completeChat({
    apiKey: input.apiKey,
    model: input.model,
    baseUrl,
    headers,
    messages: [
      ...messages,
      {
        role: 'user',
        content:
          'Please answer the user now. If drafts were created, summarize them and any missing fields. Do not call more tools. Do not claim records were saved.'
      }
    ]
  })
  const text = final.content?.trim()
  if (text) return done(text)
  // Last-ditch salvage so real work (a draft, or fetched data) is never lost to
  // an empty final completion.
  if (drafts.length > 0) return done(synthesizeDraftReply(drafts))
  if (toolResults.length > 0) {
    appendDevLog({
      kind: 'api',
      source: 'main',
      action: 'chat.orchestrator.emptyAfterTools',
      message: `${input.model} returned no text after ${toolResults.length} tool result(s)`,
      detail: { model: input.model, toolResultCount: toolResults.length },
      ok: false
    })
    return done(
      'I gathered your data but the model returned an empty summary. Please try again, or pick a stronger model in the toolbar.'
    )
  }
  throw new Error('Provider returned an empty response')
}

/**
 * Compact per-turn memo (#10): a short, model-facing note of what happened this
 * turn — the tools run and any draft proposed — so a follow-up like "make it
 * 500" or "yes, save it" has grounding without replaying raw tool transcripts.
 */
function buildContextMemo(drafts: ChatDraftDto[], toolNames: string[]): string | null {
  const parts: string[] = []
  for (const d of drafts) {
    const missing = d.missingRequired.length ? ` (missing: ${d.missingRequired.join(', ')})` : ''
    parts.push(`proposed ${d.kind} [draft ${d.id}, ${d.status}]: ${d.summary}${missing}`)
  }
  const uniqueTools = [...new Set(toolNames)]
  if (uniqueTools.length) parts.push(`tools run: ${uniqueTools.join(', ')}`)
  if (parts.length === 0) return null
  const memo = parts.join(' | ')
  return memo.length > 600 ? `${memo.slice(0, 600)}…` : memo
}

export async function sendChatMessage(input: {
  threadId?: string | null
  content: string
  credentialId?: string | null
  modelId?: string | null
  /** Optional overlay from UI chips (slash in content also works). */
  overlay?: ChatOverlayId | null
}): Promise<ChatSendResult> {
  assertChatEnabled()
  const raw = input.content.trim()
  if (!raw) throw new Error('Message is required')

  const parsed = parseSlashOverlay(raw)
  const text = parsed.content || raw
  if (!text.trim()) throw new Error('Message is required')

  const ui = getUiSettings()
  const status = await getChatStatus()
  const skill = routeChatSkill(text)
  const useApple = shouldUseAppleReadOnly({
    preferApple: status.preferAppleReadOnly,
    appleAvailable: status.appleAvailable,
    skill
  })

  if (!useApple && !status.canUseByok) {
    if (status.preferAppleReadOnly && !status.appleAvailable) {
      throw new Error(
        `Apple Intelligence isn’t ready. ${status.appleDetail} Or add a named API key in Configure AI.`
      )
    }
    throw new Error('Add an API key in Settings → AI / Chat → Configure before sending.')
  }

  // Write intents always need BYOK (Apple cannot propose/approve mutations).
  const writeSkill =
    skill === 'log-income' ||
    skill === 'log-expense' ||
    skill === 'edit-record' ||
    skill.startsWith('workflow-')
  if (writeSkill && !status.canUseByok) {
    throw new Error(WRITE_NEEDS_KEY)
  }

  let thread: ChatThreadDto
  if (input.threadId) {
    const existing = getThread(input.threadId)
    if (!existing) throw new Error('Thread not found')
    thread = existing
  } else {
    thread = createThread({
      credentialId: input.credentialId ?? getDefaultCredentialId(),
      modelId: input.modelId ?? ui.chatDefaultModel ?? DEFAULT_CHAT_MODEL,
      overlay: parsed.overlay ?? input.overlay ?? 'default'
    })
  }

  const slashOverlay = parsed.overlay ?? input.overlay ?? null
  const activeOverlay = resolveActiveOverlay({
    slashOverlay,
    threadOverlay: thread.overlay,
    forceStrict: skill === 'refuse-delete'
  })

  if (slashOverlay && thread.overlay !== slashOverlay) {
    thread = updateThread(thread.id, { overlay: slashOverlay })
  } else if (!slashOverlay && input.overlay && thread.overlay !== input.overlay) {
    thread = updateThread(thread.id, { overlay: input.overlay })
  }

  const prior = listMessages(thread.id)
  const userMessage = addMessage(thread.id, 'user', text)
  maybeSetTitleFromUserMessage(thread.id, text)

  if (skill === 'refuse-delete') {
    const assistantMessage = addMessage(thread.id, 'assistant', REFUSE_DELETE)
    return { userMessage, assistantMessage, thread: getThread(thread.id)!, drafts: [] }
  }

  if (useApple) {
    const apple = await runAppleReadOnlyTurn({
      skill,
      userText: text,
      selectedDate: ui.workspace.selectedDate
    })
    const payloadJson = JSON.stringify({
      provider: apple.provider,
      overlay: activeOverlay,
      skill
    })
    const assistantMessage = addMessage(thread.id, 'assistant', apple.text, payloadJson)
    return {
      userMessage,
      assistantMessage,
      thread: getThread(thread.id)!,
      drafts: []
    }
  }

  const credentialId =
    input.credentialId ?? thread.credentialId ?? getDefaultCredentialId()
  if (!credentialId) throw new Error('No API credential selected')
  const cred = getCredential(credentialId)
  if (!cred) throw new Error('Credential not found')

  const apiKey = readChatApiKey(credentialId)
  const baseUrl = readChatBaseUrl(credentialId)
  const providerId =
    readChatProviderId(credentialId) ?? providerPresetFromBaseUrl(baseUrl)
  const modelId = coerceModelForProvider(
    providerId,
    normalizeChatModelId(
      (input.modelId ?? thread.modelId ?? ui.chatDefaultModel ?? DEFAULT_CHAT_MODEL).trim() ||
        DEFAULT_CHAT_MODEL
    )
  )

  if (thread.credentialId !== credentialId || thread.modelId !== modelId) {
    thread = updateThread(thread.id, { credentialId, modelId })
  }

  const keywordCheer = detectKeywordCheer(text)
  const promptOverlay = effectiveOverlayForPrompt(activeOverlay, keywordCheer)

  const system = [
    PHASE_65_SYSTEM,
    skillSystemAddendum(skill, todayIso(), currentMonth()),
    overlaySystemPrompt(promptOverlay)
  ].join('\n\n')

  const messages: ChatCompletionMessage[] = [
    { role: 'system', content: system },
    ...buildHistoryMessages(prior),
    { role: 'user', content: text }
  ]

  const { text: reply, drafts, toolResults, toolNames } = await runToolLoop({
    apiKey,
    model: modelId,
    messages,
    threadId: thread.id,
    baseUrl,
    headers: headersForProvider(providerId),
    forceToolFirstRound: writeSkill
  })

  const budgetNotes = detectBudgetGuardFromToolResults(toolResults)
  const appendix = formatBudgetGuardAppendix(activeOverlay, budgetNotes)
  let finalReply = appendix && !reply.includes(appendix) ? `${reply}\n\n${appendix}` : reply

  // Safety net: a write intent that produced no draft but claims one would leave
  // the user hunting for an Approve card that doesn't exist. Say so plainly.
  if (writeSkill && drafts.length === 0 && claimsWrite(reply)) {
    finalReply += `\n\n⚠️ Note: I didn’t actually create a draft, so there’s nothing to Approve yet. Please resend with the details (e.g. “Log expense, 200, Food, Home Wallet, yesterday”) and I’ll prepare an Approve card.`
    appendDevLog({
      kind: 'api',
      source: 'main',
      action: 'chat.orchestrator.claimedWriteNoDraft',
      message: `${modelId} claimed a write but produced no draft`,
      detail: { model: modelId, skill },
      ok: false
    })
  }

  const contextMemo = buildContextMemo(drafts, toolNames)
  const payloadJson = JSON.stringify({
    overlay: activeOverlay,
    keywordCheer,
    provider: 'byok',
    ...(drafts.length > 0 ? { drafts } : {}),
    ...(contextMemo ? { contextMemo } : {})
  })

  const assistantMessage = addMessage(thread.id, 'assistant', finalReply, payloadJson)
  return {
    userMessage,
    assistantMessage,
    thread: getThread(thread.id)!,
    drafts
  }
}
