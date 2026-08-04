// tsc -p tsconfig.web.json never sees vitest.config.ts's `setupFiles` (a runtime-only
// mechanism), so test/setup-renderer.ts's `import '@testing-library/jest-dom/vitest'` never
// reaches the type checker on its own. This file sits inside tsconfig.web.json's existing
// `src/renderer/src/**/*` include glob purely to re-surface that same augmentation to tsc.
import '@testing-library/jest-dom/vitest'
