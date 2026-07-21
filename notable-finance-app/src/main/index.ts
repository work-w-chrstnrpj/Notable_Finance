import { app } from 'electron'
import { initDatabase, closeDatabase, listTables } from './db'
import { registerIpc } from './ipc'
import { createWindow, installMenu, onActivate } from './windows'
import { reschedule, stopScheduler } from './sync/scheduler'

// Electron main process bootstrap. Main owns all data & side effects: SQLite, domain
// logic, IPC. See wiki/desktop/desktop-architecture.md.

app.whenReady().then(() => {
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
