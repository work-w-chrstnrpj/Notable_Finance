import { defineConfig } from '@playwright/test'

// Electron end-to-end tests (Phase 5.2). No browser projects — Playwright drives the
// built Electron app directly via `_electron`. Run with: pnpm --filter notable-finance-app test:e2e
// (which builds first). Serial, single worker: one app instance under test.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']]
})
