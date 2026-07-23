import * as repo from '../db/repositories'
import type {
  ChatConfirmResult,
  ChatDraftDto,
  ChatMessageDto,
  ChatOverlayId
} from '../../shared/finance.types'
import { listCredentials } from './credentials'
import { getDraft, markDraft } from './drafts'
import { addMessage, getThread } from './threads'
import {
  buildApproveQuip,
  buildCancelAck,
  detectKeywordCheer,
  resolveActiveOverlay
} from './overlays'
import {
  toCreateExpenseInput,
  toCreateIncomeInput,
  toUpdateExpensePatch,
  toUpdateIncomePatch
} from './tools/write-tools'

function assertByokForWrites(): void {
  try {
    if (listCredentials().length === 0) {
      throw new Error(
        'Select an API credential for writes. Apple/on-device Q&A is read-only — add a named API key in Configure AI.'
      )
    }
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.startsWith('Select an API credential for writes')
    ) {
      throw err
    }
    throw new Error(
      'Select an API credential for writes. Apple/on-device Q&A is read-only — add a named API key in Configure AI.'
    )
  }
}

/**
 * Persist an assistant acknowledgement to the thread. Best-effort: an Approve /
 * Cancel must never fail because a cosmetic message couldn't be written (e.g.
 * an ephemeral or already-deleted thread), so a missing thread is swallowed.
 */
function persistAssistant(
  threadId: string,
  content: string,
  payloadJson: string | null = null
): ChatMessageDto | null {
  try {
    return addMessage(threadId, 'assistant', content, payloadJson)
  } catch {
    return null
  }
}

function overlayForThread(threadId: string): ChatOverlayId {
  try {
    const thread = getThread(threadId)
    return resolveActiveOverlay({
      slashOverlay: null,
      threadOverlay: thread?.overlay
    })
  } catch {
    return 'default'
  }
}

export function cancelDraft(
  draftId: string
): ChatDraftDto & { quip?: string; assistantMessage?: ChatMessageDto | null } {
  const draft = getDraft(draftId)
  if (!draft) throw new Error('Draft not found')
  if (draft.status === 'applied') throw new Error('Draft already applied')
  const cancelled = markDraft(draftId, 'cancelled')
  const quip = buildCancelAck(overlayForThread(draft.threadId))
  const assistantMessage = persistAssistant(draft.threadId, quip)
  return { ...cancelled, quip, assistantMessage }
}

export function confirmDraft(draftId: string): ChatConfirmResult {
  const draft = getDraft(draftId)
  if (!draft) throw new Error('Draft not found')
  if (draft.status === 'cancelled') throw new Error('Draft was cancelled')
  if (draft.status === 'applied') throw new Error('Draft already applied')
  if (draft.missingRequired.length > 0 || draft.status === 'needs_input') {
    throw new Error(
      `Draft is incomplete. Missing: ${draft.missingRequired.join(', ') || 'required fields'}`
    )
  }
  if (draft.action !== 'create' && draft.action !== 'update') {
    throw new Error('Invalid draft action')
  }
  assertByokForWrites()

  let record: unknown

  if (draft.resource === 'incomes' && draft.action === 'create') {
    record = repo.createIncome(toCreateIncomeInput(draft.payload))
  } else if (draft.resource === 'expenses' && draft.action === 'create') {
    record = repo.createExpense(toCreateExpenseInput(draft.payload))
  } else if (draft.resource === 'incomes' && draft.action === 'update') {
    const ids =
      draft.targetIds && draft.targetIds.length > 0
        ? draft.targetIds
        : [String(draft.payload.id ?? '')].filter(Boolean)
    if (ids.length === 0) throw new Error('No income ids to update')
    const patch = toUpdateIncomePatch(draft.payload)
    const updated = ids.map((id) => repo.updateIncome(id, patch))
    record = ids.length === 1 ? updated[0] : updated
  } else if (draft.resource === 'expenses' && draft.action === 'update') {
    const ids =
      draft.targetIds && draft.targetIds.length > 0
        ? draft.targetIds
        : [String(draft.payload.id ?? '')].filter(Boolean)
    if (ids.length === 0) throw new Error('No expense ids to update')
    const patch = toUpdateExpensePatch(draft.payload)
    const updated = ids.map((id) => repo.updateExpense(id, patch))
    record = ids.length === 1 ? updated[0] : updated
  } else {
    throw new Error('Unsupported draft')
  }

  const applied = markDraft(draftId, 'applied')
  const overlay = overlayForThread(draft.threadId)
  const summaryBits = `${draft.summary} ${JSON.stringify(draft.payload)}`
  const quip = buildApproveQuip({
    overlay,
    draft: applied,
    keywordCheer: detectKeywordCheer(summaryBits)
  })
  const base = `Approved — saved ${applied.resource} (${applied.action}).`
  const content = quip ? `${base}\n\n${quip}` : base
  const assistantMessage = persistAssistant(
    draft.threadId,
    content,
    JSON.stringify({ kind: 'approve', draftId, resource: applied.resource, action: applied.action })
  )
  return { draft: applied, record, quip, assistantMessage }
}

export function changedResourceFromDraft(
  draft: ChatDraftDto
): 'incomes' | 'expenses' {
  return draft.resource
}

export function changedIdsFromResult(draft: ChatDraftDto, record: unknown): string[] {
  if (draft.targetIds && draft.targetIds.length > 0) return draft.targetIds
  if (record && typeof record === 'object' && record !== null && 'id' in record) {
    return [String((record as { id: string }).id)]
  }
  if (Array.isArray(record)) {
    return record
      .map((r) => (r && typeof r === 'object' && 'id' in r ? String((r as { id: string }).id) : ''))
      .filter(Boolean)
  }
  return []
}
