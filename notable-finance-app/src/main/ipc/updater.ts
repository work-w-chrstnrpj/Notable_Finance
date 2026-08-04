import { IPC_CHANNELS } from '../../shared/ipc-channels'
import { checkForUpdatesNow, isUpdateDownloaded, installUpdate } from '../updater'
import { handle } from './handle'
import { result } from './shared'

/**
 * Auto-updater (Phase 5.1). refactor_development_plan.md Phase 7.1 — pure move out of
 * ipc/index.ts, unchanged.
 */
export function registerUpdaterIpc(): void {
  handle(IPC_CHANNELS.updaterCheck, () =>
    result(() => {
      return checkForUpdatesNow()
    })
  )
  handle(IPC_CHANNELS.updaterStatus, () =>
    result(() => ({
      updateDownloaded: isUpdateDownloaded()
    }))
  )
  handle(IPC_CHANNELS.updaterInstall, () =>
    result(() => {
      const willQuit = installUpdate()
      if (!willQuit) {
        throw new Error('Update is still downloading. Please wait for the download to finish.')
      }
      return true as const
    })
  )
}
