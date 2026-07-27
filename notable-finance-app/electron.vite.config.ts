import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8')) as { version: string }

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
        // '@/…' mirrors the web app's path alias so ported components import unchanged.
        '@': resolve('src/renderer/src'),
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    define: {
      '__APP_VERSION__': JSON.stringify(pkg.version)
    },
    plugins: [react()]
  }
})
