import { contextBridge, ipcRenderer } from 'electron'
import type { ApiResult, HealthData } from '../shared/finance.types'

// Preload — the ONLY bridge between the sandboxed renderer and main. Channels are
// explicitly allow-listed here; the renderer cannot invoke arbitrary channels.
// See wiki/desktop/ipc-contract.md.
const api = {
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  },
  /** No-op liveness check. */
  ping: (): Promise<ApiResult<'pong'>> => ipcRenderer.invoke('app:ping'),
  /** Local SQLite health — path + table list. */
  health: (): Promise<ApiResult<HealthData>> => ipcRenderer.invoke('db:health')
}

// contextIsolation is always on (see src/main/index.ts), so exposeInMainWorld is the
// only path. It throws if isolation is ever disabled — surface that rather than fall back.
try {
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  console.error('Failed to expose preload API:', error)
}

export type PreloadApi = typeof api
