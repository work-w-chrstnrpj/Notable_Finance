import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import { appendDevLog, summarizeForDevLog } from '../dev-logs/store'
import type { ApiResult } from '../../shared/finance.types'
import type { IpcChannel } from '../../shared/ipc-channels'

const SKIP_DEV_LOG_CHANNELS = new Set<IpcChannel>([
  'devLogs:list',
  'devLogs:clear',
  'devLogs:append',
  'app:ping',
  'settings:get'
])

/**
 * Registers an IPC handler and wraps it with dev-mode logging — the explicit replacement
 * for the old `ipcMain.handle` monkey-patch (refactor_development_plan.md Phase 7.1/7.3,
 * fixes F9). Same behaviour as before: channels in `SKIP_DEV_LOG_CHANNELS` are exempt (too
 * noisy / logged elsewhere), everything else logs on failure or throw. Now visible at every
 * call site — every registrar calls `handle(...)` instead of `ipcMain.handle(...)` — and the
 * global `ipcMain.handle` function itself is never reassigned.
 */
export function handle<Args extends unknown[], R>(
  channel: IpcChannel,
  listener: (event: IpcMainInvokeEvent, ...args: Args) => R | Promise<R>
): void {
  ipcMain.handle(channel, async (event, ...args: Args) => {
    if (SKIP_DEV_LOG_CHANNELS.has(channel)) {
      return listener(event, ...args)
    }
    const started = Date.now()
    try {
      const out = await listener(event, ...args)
      const ok =
        out && typeof out === 'object' && 'ok' in (out as object)
          ? Boolean((out as ApiResult<unknown>).ok)
          : true
      if (!ok) {
        appendDevLog({
          kind: 'api',
          source: 'main',
          action: channel,
          message: `IPC ${channel} failed`,
          detail: {
            args: summarizeForDevLog(args)
          } as Record<string, unknown>,
          durationMs: Date.now() - started,
          ok: false
        })
      }
      return out
    } catch (error) {
      appendDevLog({
        kind: 'api',
        source: 'main',
        action: channel,
        message: `IPC ${channel} threw`,
        detail: {
          args: summarizeForDevLog(args),
          error: error instanceof Error ? error.message : String(error)
        } as Record<string, unknown>,
        durationMs: Date.now() - started,
        ok: false
      })
      throw error
    }
  })
}
