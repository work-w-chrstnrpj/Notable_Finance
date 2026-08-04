import type { ChatOverlayId } from '../../shared/finance.types'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import * as chat from '../chat'
import {
  CHAT_CURATED_MODELS,
  listChatProviders,
  modelsForProvider,
  providerPresetFromBaseUrl
} from '../chat/models'
import { getUiSettings } from '../settings/ui'
import { logDevOperation } from '../dev-logs/store'
import { handle } from './handle'
import { changed, result } from './shared'

function requireChatEnabled(): void {
  if (!getUiSettings().chatEnabled) {
    throw new Error('Chat is disabled. Enable it in Settings → AI / Chat.')
  }
}

/**
 * Chat (Phase 6.1) — credentials usable from Settings even when Chat is off; threads + send
 * require chatEnabled (enforced here via requireChatEnabled). refactor_development_plan.md
 * Phase 7.1 — pure move out of ipc/index.ts, unchanged.
 */
export function registerChatIpc(): void {
  handle(IPC_CHANNELS.chatStatus, (_e, opts?: { forceRefresh?: boolean }) =>
    result(() => chat.getChatStatus(opts))
  )
  handle(IPC_CHANNELS.chatProviders, () =>
    result(() =>
      listChatProviders().map((p) => ({
        id: p.id,
        label: p.label,
        keyPlaceholder: p.keyPlaceholder,
        hint: p.hint,
        docsUrl: p.docsUrl,
        defaultModelId: p.defaultModelId,
        needsCustomBaseUrl: p.id === 'custom',
        models: p.models.map((m) => ({ id: m.id, label: m.label, free: m.free }))
      }))
    )
  )
  handle(IPC_CHANNELS.chatModels, (_e, credentialId?: string | null) =>
    result(() => {
      let providerId: string | null = null
      if (credentialId) {
        const cred = chat.listCredentials().find((c) => c.id === credentialId)
        providerId = cred?.providerId ?? providerPresetFromBaseUrl(cred?.baseUrl ?? null)
      }
      const models = credentialId ? modelsForProvider(providerId) : CHAT_CURATED_MODELS
      return models.map((m) => ({ id: m.id, label: m.label, free: m.free === true }))
    })
  )
  // Live model list straight from the key's own host (GET {base}/models).
  // Renderer falls back to the curated catalogue when this fails.
  handle(IPC_CHANNELS.chatRemoteModels, (_e, credentialId: string) =>
    result(() => chat.listRemoteModels(credentialId))
  )
  handle(IPC_CHANNELS.chatDetectProvider, (_e, apiKey: string) =>
    result(() => chat.detectProviderFromKey(apiKey))
  )
  handle(IPC_CHANNELS.chatOverlays, () => result(() => chat.CHAT_SLASH_OVERLAYS))
  handle(IPC_CHANNELS.chatIsAppleOs, () => result(() => chat.isAppleOs()))

  handle(IPC_CHANNELS.chatListCredentials, () => result(() => chat.listCredentials()))
  handle(
    IPC_CHANNELS.chatCreateCredential,
    (
      _e,
      name: string,
      apiKey: string,
      opts?: { baseUrl?: string | null; providerId?: string | null }
    ) => result(() => chat.createCredential(name, apiKey, opts))
  )
  handle(
    IPC_CHANNELS.chatUpdateCredential,
    (
      _e,
      id: string,
      patch: { name?: string; apiKey?: string; baseUrl?: string | null; providerId?: string | null }
    ) => result(() => chat.updateCredential(id, patch))
  )
  handle(IPC_CHANNELS.chatSetDefaultCredential, (_e, id: string) =>
    result(() => chat.setDefaultCredential(id))
  )
  handle(IPC_CHANNELS.chatDeleteCredential, (_e, id: string) =>
    result(() => {
      chat.deleteCredential(id)
      return true as const
    })
  )

  handle(IPC_CHANNELS.chatListThreads, () =>
    result(() => {
      requireChatEnabled()
      return chat.listThreads()
    })
  )
  handle(IPC_CHANNELS.chatGetThread, (_e, id: string) =>
    result(() => {
      requireChatEnabled()
      const thread = chat.getThread(id)
      if (!thread) throw new Error('Thread not found')
      return thread
    })
  )
  handle(
    IPC_CHANNELS.chatCreateThread,
    (
      _e,
      input?: {
        title?: string
        credentialId?: string | null
        modelId?: string | null
        overlay?: string
      }
    ) =>
      result(() => {
        requireChatEnabled()
        return chat.createThread(input)
      })
  )
  handle(
    IPC_CHANNELS.chatUpdateThread,
    (
      _e,
      id: string,
      patch: {
        title?: string
        credentialId?: string | null
        modelId?: string | null
        overlay?: string
      }
    ) =>
      result(() => {
        requireChatEnabled()
        return chat.updateThread(id, patch)
      })
  )
  handle(IPC_CHANNELS.chatDeleteThread, (_e, id: string) =>
    result(() => {
      requireChatEnabled()
      chat.deleteThread(id)
      return true as const
    })
  )
  handle(IPC_CHANNELS.chatDeleteAllThreads, () =>
    result(() => {
      // Allowed from Configure AI even when Chat is off (history cleanup).
      chat.deleteAllThreads()
      return true as const
    })
  )
  handle(IPC_CHANNELS.chatListMessages, (_e, threadId: string) =>
    result(() => {
      requireChatEnabled()
      return chat.listMessages(threadId)
    })
  )
  handle(
    IPC_CHANNELS.chatSend,
    (
      _e,
      input: {
        threadId?: string | null
        content: string
        credentialId?: string | null
        modelId?: string | null
        overlay?: ChatOverlayId | null
      }
    ) => result(() => chat.sendChatMessage(input))
  )

  handle(IPC_CHANNELS.chatListDrafts, (_e, threadId?: string) =>
    result(() => {
      requireChatEnabled()
      return chat.listDrafts(threadId)
    })
  )
  handle(IPC_CHANNELS.chatConfirmDraft, (_e, draftId: string) =>
    result(() => {
      requireChatEnabled()
      const out = chat.confirmDraft(draftId)
      const { draft, record } = out
      const ids = chat.changedIdsFromResult(draft, record)
      changed(chat.changedResourceFromDraft(draft), ids)
      logDevOperation('chat:confirmDraft', `Approved ${draft.resource} ${draft.action}`, {
        draftId,
        resource: draft.resource,
        action: draft.action,
        ids
      })
      return out
    })
  )
  handle(IPC_CHANNELS.chatCancelDraft, (_e, draftId: string) =>
    result(() => {
      requireChatEnabled()
      const cancelled = chat.cancelDraft(draftId)
      logDevOperation('chat:cancelDraft', 'Cancelled draft', { draftId }, true)
      return cancelled
    })
  )
  handle(
    IPC_CHANNELS.chatUpdateDraft,
    (_e, draftId: string, edits: Record<string, unknown>) =>
      result(() => {
        requireChatEnabled()
        return chat.editDraftFields(draftId, edits ?? {})
      })
  )
}
