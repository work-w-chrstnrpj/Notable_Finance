// Global Vitest setup (test.setupFiles in vitest.config.ts). Extending `expect` with jest-dom
// matchers and running RTL's cleanup are both no-ops for the existing node-environment tests
// (main process, domain logic) — safe to apply globally rather than per-renderer-test.
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup, configure } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

// Cold-process test runs recompile a page component's whole dependency tree (some renderer
// pages are 1000+ lines) before the first render commits, which can occasionally exceed RTL's
// 1000ms findBy/waitFor default — a compile-time cost, not a real async delay. A longer budget
// costs nothing when the DOM update arrives quickly, as it normally does.
configure({ asyncUtilTimeout: 5000 })

// jsdom doesn't implement matchMedia — ThemeProvider calls it whenever theme.mode is
// "system" (the default), which every renderer component test hits via the provider stack.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false
    }) as MediaQueryList
}
