import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import type { ManualDownloadEvent, UpdaterProgressEvent } from '../../shared/finance.types'
import { broadcast } from '../windows'

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
 *   Code signature validation in ShipIt can fail for unsigned .app bundles.
 *   When this happens, the updater falls back to broadcasting a manual-download
 *   event so the UI can offer a direct link to the GitHub Release instead.
 */

let updateDownloaded = false
/** Cached available version from the most recent check (electron-updater AppUpdater does not expose this directly). */
let latestAvailableVersion: string | null = null

const GITHUB_RELEASE_URL =
  'https://github.com/work-w-chrstnrpj/Notable_Finance/releases/latest'

/** Detect if the error is a macOS code-signature validation failure (unsigned app). */
function isMacSignatureError(msg: string): boolean {
  return (
    msg.includes('did not pass validation') ||
    msg.includes('code has no resources') ||
    msg.includes('signature indicates they must be present')
  )
}

/** Start the auto-updater. Called once during app startup. */
export function initUpdater(): void {
  if (!app.isPackaged) {
    console.log('[updater] Skipped (dev mode)')
    return
  }

  autoUpdater.on('checking-for-update', () =>
    console.log('[updater] Checking for updates…')
  )

  autoUpdater.on('update-available', (info) => {
    latestAvailableVersion = info.version
    console.log(`[updater] Update available: v${info.version}`)
  })

  autoUpdater.on('update-not-available', () =>
    console.log('[updater] No update available')
  )

  autoUpdater.on('download-progress', (p) => {
    console.log(`[updater] Downloading… ${Math.round(p.percent)}%`)
    broadcast('updater:progress', {
      stage: 'downloading',
      percent: Math.round(p.percent),
      bytesPerSecond: p.bytesPerSecond,
      transferred: p.transferred,
      total: p.total,
    } satisfies UpdaterProgressEvent)
  })

  autoUpdater.on('update-downloaded', (info) => {
    updateDownloaded = true
    console.log(`[updater] Downloaded v${info.version} — ready to install`)
    broadcast('updater:progress', {
      stage: 'downloaded',
      percent: 100,
      version: info.version,
    } satisfies UpdaterProgressEvent)
  })

  autoUpdater.on('error', (err) => {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[updater] Error:', msg)

    if (isMacSignatureError(msg)) {
      broadcast('updater:manual-download', {
        releaseUrl: GITHUB_RELEASE_URL,
        version: latestAvailableVersion ?? 'latest',
      } satisfies ManualDownloadEvent)
      return
    }

    broadcast('updater:progress', {
      stage: 'error',
      error: msg,
    } satisfies UpdaterProgressEvent)
  })

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
    const msg = err instanceof Error ? err.message : String(err)
    if (isMacSignatureError(msg)) {
      broadcast('updater:manual-download', {
        releaseUrl: GITHUB_RELEASE_URL,
        version: latestAvailableVersion ?? 'latest',
      } satisfies ManualDownloadEvent)
      return { updateAvailable: false, version: latestAvailableVersion ?? undefined }
    }
    return {
      updateAvailable: false,
      error: msg,
    }
  }
}

/** True if an update has been fully downloaded. */
export function isUpdateDownloaded(): boolean {
  return updateDownloaded
}

/** Quit the app and apply the staged update. Returns true if it will quit. */
export function installUpdate(): boolean {
  if (updateDownloaded) {
    autoUpdater.quitAndInstall()
    return true
  }
  return false
}
