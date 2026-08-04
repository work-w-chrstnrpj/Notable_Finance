import type { NotionMapping } from '../../shared/finance.types'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import * as notion from '../notion/service'
import { getMapping, saveMapping } from '../notion/mapping-store'
import { handle } from './handle'
import { result } from './shared'

/**
 * Notion onboarding: connect/disconnect, database discovery, schema mapping and
 * verification. refactor_development_plan.md Phase 7.1 — pure move out of ipc/index.ts,
 * unchanged.
 */
export function registerNotionIpc(): void {
  // notion onboarding (Phase 2.1/2.2) — the token goes IN once; nothing returns it.
  handle(IPC_CHANNELS.notionConnect, (_e, token: string) => result(() => notion.connect(token)))
  handle(IPC_CHANNELS.notionIsConnected, () => result(() => notion.isConnected()))
  handle(IPC_CHANNELS.notionDisconnect, () =>
    result(() => {
      notion.disconnect()
      return true as const
    })
  )
  handle(IPC_CHANNELS.notionDiscoverDatabases, () => result(() => notion.discoverDatabases()))
  handle(IPC_CHANNELS.notionGetMapping, () => result(() => getMapping()))
  handle(IPC_CHANNELS.notionSaveMapping, (_e, mapping: NotionMapping) =>
    result(() => {
      saveMapping(mapping)
      return true as const
    })
  )
  handle(IPC_CHANNELS.notionVerifySchema, () => result(() => notion.verifySchema()))
}
