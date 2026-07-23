import { app, nativeImage } from 'electron'
import { initDatabase, closeDatabase, listTables } from './db'
import { registerIpc } from './ipc'
import { appIconPath, createWindow, installMenu, onActivate } from './windows'
import { reschedule, stopScheduler } from './sync/scheduler'

// Test hook: redirect userData (DB + keychain token file) to an isolated dir for e2e runs.
if (process.env.NF_USER_DATA_DIR) {
  app.setPath('userData', process.env.NF_USER_DATA_DIR)
}

// Electron main process bootstrap. Main owns all data & side effects: SQLite, domain
// logic, IPC. See wiki/desktop/desktop-architecture.md.

app.whenReady().then(() => {
  // macOS dock icon in dev (packaged builds get the icon from the app bundle).
  if (process.platform === 'darwin' && !app.isPackaged) {
    const icon = nativeImage.createFromPath(appIconPath())
    if (!icon.isEmpty()) app.dock?.setIcon(icon)
  }

  // Open the local SQLite store and run migrations before any window can request data.
  const { dbPath } = initDatabase()
  console.log(`[notable-finance] db ready at ${dbPath} (${listTables().length} tables)`)

  registerIpc()
  installMenu()
  createWindow()

  // Arm auto-sync if the saved mode is 'auto' (Phase 4.3).
  reschedule()

  // macOS: re-create a window when the dock icon is clicked and none are open.
  app.on('activate', onActivate)
})

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Close the SQLite handle cleanly on quit.
app.on('will-quit', () => {
  stopScheduler()
  closeDatabase()
})
