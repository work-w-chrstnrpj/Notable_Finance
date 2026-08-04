import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { getUiSettings, setUiSettings } from '../settings/ui'
import { handle } from './handle'
import { result } from './shared'

/**
 * UI settings (hard-delete mode, chat flags, workspace prefs, etc.).
 * refactor_development_plan.md Phase 7.1 — pure move out of ipc/index.ts, unchanged.
 */
export function registerSettingsIpc(): void {
  handle(IPC_CHANNELS.settingsGet, () => result(() => getUiSettings()))
  handle(IPC_CHANNELS.settingsUpdate, (_e, patch: Parameters<typeof setUiSettings>[0]) =>
    result(() => setUiSettings(patch))
  )
}
