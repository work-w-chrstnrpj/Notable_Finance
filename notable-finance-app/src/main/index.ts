import { app, shell, BrowserWindow } from 'electron'
import { join } from 'node:path'
import { initDatabase, closeDatabase, listTables } from './db'
import { registerIpc } from './ipc'

// Electron main process — app bootstrap and window lifecycle.
// Phase 0.1: boot a single window with HMR. Data/SQLite/sync/IPC land in later phases
// (see wiki/desktop/development-plan.md and wiki/desktop/desktop-architecture.md).

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 832,
    minWidth: 940,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'Notable Finance',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      // Renderer is untrusted-by-design (wiki/desktop/security.md + ipc-contract.md):
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    console.log('[notable-finance] main window shown')
  })

  // Open external links in the OS browser, never in-app.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  // In dev, electron-vite serves the renderer over HTTP (enables HMR);
  // in production, load the built HTML file.
  const devServerUrl = process.env['ELECTRON_RENDERER_URL']
  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Open the local SQLite store and run migrations before any window can request data.
  const { dbPath } = initDatabase()
  console.log(`[notable-finance] db ready at ${dbPath} (${listTables().length} tables)`)

  // Wire the renderer↔main IPC surface (Phase 0.4 skeleton).
  registerIpc()

  createWindow()

  // macOS: re-create a window when the dock icon is clicked and none are open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Close the SQLite handle cleanly on quit.
app.on('will-quit', () => {
  closeDatabase()
})
