import type { PreloadApi } from './index'

// Types the `window.api` surface for the renderer (tsconfig.web.json includes this file).
declare global {
  interface Window {
    api: PreloadApi
  }
}

export {}
