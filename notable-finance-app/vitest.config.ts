import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Unit tests for the pure domain/derivation logic (Phase 0.3) plus renderer component tests
// (Phase 1 of wiki/desktop/refactor_development_plan.md). Node environment by default — most
// tests never touch Electron, SQLite, or the DOM; renderer component tests opt into jsdom
// per-file via a `// @vitest-environment jsdom` docblock at the top of the file.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer/src'),
      '@renderer': path.resolve(__dirname, 'src/renderer/src'),
      '@shared': path.resolve(__dirname, 'src/shared')
    }
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    setupFiles: ['./test/setup-renderer.ts'],
    // Safety margin for cold-process renderer test runs (see setup-renderer.ts) — a big page
    // component's dependency tree can take a moment to transform before the first render.
    testTimeout: 15000,
    globals: false
  }
})
