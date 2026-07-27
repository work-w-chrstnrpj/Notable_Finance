import type { PreloadApi } from './index'

// Types the `window.api` surface for the renderer (tsconfig.web.json includes this file).
declare global {
  interface Window {
    api: PreloadApi
  }
  
  // Build-time app version (from electron.vite.config.ts → define).
  const __APP_VERSION__: string
}

export {}
