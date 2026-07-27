import { defineConfig } from 'vitest/config'
import path from 'path'

// Unit tests for the pure domain/derivation logic (Phase 0.3). Node environment — these
// tests never touch Electron, SQLite, or the renderer.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer/src'),
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    globals: false
  }
})
