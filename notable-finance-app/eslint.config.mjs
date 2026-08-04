import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'

// Phase 1 of wiki/desktop/refactor_development_plan.md — the safety net that must exist
// before any renderer extraction work starts. Rule severities intentionally match the plan:
//   errors   → no-unused-vars, no-unreachable, no-dupe-class-members, react-hooks/rules-of-hooks,
//              @typescript-eslint/no-floating-promises
//   warnings → react-hooks/exhaustive-deps, max-lines(600), complexity(15)
// Everything else typescript-eslint/eslint-plugin-react bring in via their base configs is left
// at each plugin's own default severity rather than re-tuned — expanding the rule set beyond
// what the plan calls for is a decision for a later, deliberate pass, not this one.

const srcTypeChecked = tseslint.config({
  files: ['src/**/*.{ts,tsx}'],
  extends: [tseslint.configs.recommended],
  languageOptions: {
    parserOptions: {
      // Auto-discovers tsconfig.node.json / tsconfig.web.json per file via their
      // "include" globs — both cover all of src/, so every file here resolves.
      projectService: true,
      tsconfigRootDir: import.meta.dirname
    }
  },
  rules: {
    '@typescript-eslint/no-floating-promises': 'error',
    // '_'-prefixed names are this codebase's existing convention for "kept for interface
    // parity, deliberately unused" (see api-client.ts pullLatest/commit) — respected, not
    // just tolerated.
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
    ],
    // tsc already catches this more accurately (and we run tsc in CI); the base rule has
    // known false positives on TS-only constructs (ambient types, enums, module augmentation).
    'no-undef': 'off',
    // 15 pre-existing hits, concentrated in src/main/notion/markdown-blocks.ts (the Notion
    // block API's own types are loosely shaped). Fixing them properly means modeling that
    // API surface — a dedicated typing pass, not something this lint-infra phase should do
    // incidentally. Report-only for now.
    '@typescript-eslint/no-explicit-any': 'warn'
  }
})

// test/, e2e/, and scripts/ aren't part of either tsconfig's "include" (see tsconfig.node.json,
// tsconfig.web.json), so they get syntax-only TS linting rather than the type-aware project
// service — pulling them into project coverage is a tsconfig/build change, out of scope here.
const otherTypeScript = tseslint.config({
  files: ['test/**/*.{ts,tsx}', 'e2e/**/*.ts', 'scripts/**/*.mjs'],
  extends: [tseslint.configs.recommended],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }
    ],
    'no-undef': 'off'
  }
})

export default [
  {
    ignores: [
      'node_modules/**',
      'out/**',
      'dist/**',
      'build/**',
      'test-results/**',
      '.ua/**',
      'new-logo/**',
      'Personal Finance Desktop Redesign/**',
      'src/main/db/migrations/**',
      'src/renderer/src/assets/**',
      // Root build/tool configs sit outside both tsconfig's "include" (see tsconfig.node.json,
      // tsconfig.web.json) and aren't part of the god-component surface this phase targets —
      // linting them well needs its own parserOptions setup, deferred to a later pass.
      'vitest.config.ts',
      'playwright.config.ts',
      'drizzle.config.ts',
      'electron.vite.config.ts'
    ]
  },
  js.configs.recommended,
  ...srcTypeChecked,
  ...otherTypeScript,
  {
    files: ['src/renderer/src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}', 'e2e/**/*.ts'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      globals: { ...globals.browser, __APP_VERSION__: 'readonly' }
    },
    settings: { react: { version: '19' } },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // 21 pre-existing hits, concentrated in expense.tsx/income.tsx/workflow.tsx — the
      // exact files Phase 4/5 restructure. Report-only for now; fix alongside that work
      // rather than as an isolated edit here (plan §0.2: no changes beyond what's needed).
      'react/jsx-key': 'warn'
    }
  },
  {
    files: ['src/main/**/*.ts', 'src/preload/**/*.ts', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: { ...globals.node }
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      // @typescript-eslint/no-unused-vars (set per-block above, where the plugin is
      // registered) supersedes this; turned off here to avoid duplicate reports.
      'no-unused-vars': 'off',
      'no-unreachable': 'error',
      'no-dupe-class-members': 'error',
      'max-lines': ['warn', { max: 600, skipBlankLines: true, skipComments: true }],
      complexity: ['warn', 15]
    }
  }
]
