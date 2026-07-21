import { app, shell, BrowserWindow, Menu } from 'electron'
import { join } from 'node:path'
import type { EventChannel, RecordsChangedEvent } from '../../shared/finance.types'

// Window lifecycle + multi-window management (Phase 1.5). All windows share the single
// main-process data owner; main→renderer events fan out to every window.

export function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 832,
    minWidth: 940,
    minHeight: 600,
    show: false,
    autoHideMenuBar: false,
    title: 'Notable Finance',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // Renderer is untrusted-by-design (wiki/desktop/security.md + ipc-contract.md):
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  window.on('ready-to-show', () => {
    window.show()
    console.log('[notable-finance] main window shown')
  })

  // Open external links in the OS browser, never in-app.
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  const devServerUrl = process.env['ELECTRON_RENDERER_URL']
  if (devServerUrl) {
    void window.loadURL(devServerUrl)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }
  return window
}

/** Broadcast an event to every open window (ipc-contract.md events). */
export function broadcast(channel: EventChannel, payload?: RecordsChangedEvent | object): void {
  for (const w of BrowserWindow.getAllWindows()) {
    w.webContents.send(channel, payload ?? {})
  }
}

/** App menu with New Window (Cmd/Ctrl+N) — the multi-window entry point. */
export function installMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' as const }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            createWindow()
          }
        },
        { type: 'separator' },
        process.platform === 'darwin' ? { role: 'close' as const } : { role: 'quit' as const }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

export function onActivate(): void {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
}

// Re-exported for main bootstrap convenience.
export { app }
