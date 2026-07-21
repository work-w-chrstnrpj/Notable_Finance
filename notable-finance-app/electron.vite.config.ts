import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

// Build config for the three Electron targets (main / preload / renderer).
// See wiki/desktop/desktop-architecture.md and wiki/desktop/project-structure.md.
export default defineConfig({
  main: {
    // Node/native deps (better-sqlite3, @notionhq/client, …) stay external — not bundled.
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react()]
  }
})
