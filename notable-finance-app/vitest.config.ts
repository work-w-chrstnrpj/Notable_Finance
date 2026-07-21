import { defineConfig } from 'vitest/config'

// Unit tests for the pure domain/derivation logic (Phase 0.3). Node environment — these
// tests never touch Electron, SQLite, or the renderer.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globals: false
  }
})
