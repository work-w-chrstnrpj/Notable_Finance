import { app, shell, BrowserWindow, Menu } from 'electron'
import { join } from 'node:path'
import type {
  EventChannel,
  RecordsChangedEvent,
  TabsCommandEvent
} from '../../shared/finance.types'

// Window lifecycle + multi-window management (Phase 1.5). All windows share the single
// main-process data owner; main→renderer events fan out to every window.
// In-window tabs are renderer-owned; File menu sends tabs:command to the focused window.

/**
 * App icon path. In dev, the source PNG; in packaged win/linux builds, electron-builder
 * bakes the icon into the executable so a window-level icon isn't needed (mac uses the
 * bundle .icns). Only used for dev/win/linux window + dev dock.
 */
export function appIconPath(): string {
  return join(app.getAppPath(), 'build', 'icon.png')
}

export function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1280,
    height: 832,
    minWidth: 940,
    minHeight: 600,
    show: false,
    autoHideMenuBar: false,
    title: 'Notable Finance',
    ...(process.platform !== 'darwin' && !app.isPackaged ? { icon: appIconPath() } : {}),
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

/** Send an event only to the focused window (in-window tab commands). */
export function sendToFocused(channel: EventChannel, payload?: TabsCommandEvent | object): void {
  const focused = BrowserWindow.getFocusedWindow()
  if (!focused || focused.isDestroyed()) return
  focused.webContents.send(channel, payload ?? {})
}

/** App menu: in-window tabs + multi-window entry points. */
export function installMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin' ? [{ role: 'appMenu' as const }] : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Tab',
          accelerator: 'CmdOrCtrl+T',
          click: () => sendToFocused('tabs:command', { action: 'new' })
        },
        {
          label: 'Close Tab',
          accelerator: 'CmdOrCtrl+W',
          click: () => sendToFocused('tabs:command', { action: 'close' })
        },
        { type: 'separator' },
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            createWindow()
          }
        },
        { type: 'separator' },
        process.platform === 'darwin'
          ? {
              label: 'Close Window',
              accelerator: 'CmdOrCtrl+Shift+W',
              role: 'close'
            }
          : { role: 'quit' as const }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Next Tab',
          accelerator: 'Ctrl+Tab',
          click: () => sendToFocused('tabs:command', { action: 'next' })
        },
        {
          label: 'Previous Tab',
          accelerator: 'Ctrl+Shift+Tab',
          click: () => sendToFocused('tabs:command', { action: 'prev' })
        },
        { type: 'separator' },
        { role: 'minimize' },
        { role: 'zoom' },
        ...(process.platform === 'darwin'
          ? [{ type: 'separator' as const }, { role: 'front' as const }]
          : [{ role: 'close' as const }])
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

export function onActivate(): void {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
}

// Re-exported for main bootstrap convenience.
export { app }
