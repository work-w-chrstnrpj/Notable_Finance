import { app } from 'electron'
import { autoUpdater } from 'electron-updater'

/**
 * Auto-update via GitHub Releases.
 *
 * How it works:
 * 1. electron-builder packages the app and uploads artifacts to a GitHub Release.
 * 2. electron-builder embeds the publish config into the build (app-updater.yml).
 * 3. On startup, autoUpdater reads that config and checks GitHub for a newer version.
 * 4. If found, it downloads the update in the background.
 * 5. Windows (NSIS): applies update silently and restarts the app.
 * 6. macOS (zip): stages the update — user is prompted to restart.
 *
 * For unsigned macOS builds:
 *   The app must have been opened via right-click → Open once (Gatekeeper).
 *   After that, zip-based updates work.
 */

let updateDownloaded = false

/** Start the auto-updater. Called once during app startup. */
export function initUpdater(): void {
  if (!app.isPackaged) {
    console.log('[updater] Skipped (dev mode)')
    return
  }

  autoUpdater.on('checking-for-update', () =>
    console.log('[updater] Checking for updates…')
  )

  autoUpdater.on('update-available', (info) =>
    console.log(`[updater] Update available: v${info.version}`)
  )

  autoUpdater.on('update-not-available', () =>
    console.log('[updater] No update available')
  )

  autoUpdater.on('download-progress', (p) =>
    console.log(`[updater] Downloading… ${Math.round(p.percent)}%`)
  )

  autoUpdater.on('update-downloaded', (info) => {
    updateDownloaded = true
    console.log(`[updater] Downloaded v${info.version} — ready to install`)
  })

  autoUpdater.on('error', (err) =>
    console.error('[updater] Error:', err.message ?? err)
  )

  // Check ~3s after startup so the UI is ready.
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) =>
      console.error('[updater] check failed:', err.message ?? err)
    )
  }, 3_000)
}

/** Manual "Check for Updates" triggered from the UI. */
export async function checkForUpdatesNow(): Promise<{
  updateAvailable: boolean
  version?: string
  error?: string
}> {
  try {
    const result = await autoUpdater.checkForUpdates()
    if (result?.updateInfo) {
      return { updateAvailable: true, version: result.updateInfo.version }
    }
    return { updateAvailable: false }
  } catch (err) {
    return {
      updateAvailable: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/** True if an update has been fully downloaded. */
export function isUpdateDownloaded(): boolean {
  return updateDownloaded
}

/** Quit the app and apply the staged update. */
export function installUpdate(): void {
  if (updateDownloaded) {
    autoUpdater.quitAndInstall()
  }
}
