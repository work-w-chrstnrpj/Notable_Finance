// Phase 8.2 safety net (wiki/desktop/refactor_development_plan.md, F6) — cross-checks a
// CSS-Modules migration pair. TypeScript's default `*.module.css` typing is a blanket
// `{ [key: string]: string }` index signature, so `styles["typo"]` typechecks fine and
// resolves to `undefined` at runtime — a silently-dropped className, not a build error.
// Lint and vitest don't catch it either (component tests assert behavior/text, not exact
// class names). This script is the actual check: every `styles[...]`/`styles.xxx` key
// referenced in the .tsx must exist as a real class in the paired .module.css.
//
// Usage: node scripts/verify-css-module.mjs <Component.tsx> <Component.module.css>
// Exits non-zero (with the offending keys) if any referenced key isn't defined.

import { readFileSync } from 'node:fs'

const [, , tsxPath, cssPath] = process.argv
if (!tsxPath || !cssPath) {
  console.error('Usage: node scripts/verify-css-module.mjs <Component.tsx> <Component.module.css>')
  process.exit(1)
}

const tsx = readFileSync(tsxPath, 'utf8')
const css = readFileSync(cssPath, 'utf8')

// Classes actually defined in the module (selector position, before `{`).
const defined = new Set()
for (const selBlock of css.matchAll(/([^{}]+)\{/g)) {
  for (const m of selBlock[1].matchAll(/\.([a-zA-Z_][a-zA-Z0-9_-]*)/g)) {
    defined.add(m[1])
  }
}

// Static dot/bracket-string access: styles.foo / styles["foo"] / styles['foo']
const staticKeys = new Set()
for (const m of tsx.matchAll(/styles\.([a-zA-Z_][a-zA-Z0-9_]*)\b/g)) staticKeys.add(m[1])
for (const m of tsx.matchAll(/styles\[(['"])((?:(?!\1).)*)\1\]/g)) staticKeys.add(m[2])

// Dynamic template-literal access: styles[`foo--${x}`] — verify by static prefix only,
// since the interpolated part isn't resolvable without evaluating the component.
const dynamicPrefixes = new Set()
for (const m of tsx.matchAll(/styles\[`([^`]*)\$\{/g)) {
  if (m[1]) dynamicPrefixes.add(m[1])
}

const missingStatic = [...staticKeys].filter((k) => !defined.has(k))
const uncoveredDynamic = [...dynamicPrefixes].filter(
  (prefix) => ![...defined].some((d) => d.startsWith(prefix))
)

let ok = true
if (missingStatic.length > 0) {
  ok = false
  console.error(`✗ ${tsxPath}: styles key(s) not defined in ${cssPath}:`)
  for (const k of missingStatic) console.error(`    "${k}"`)
}
if (uncoveredDynamic.length > 0) {
  ok = false
  console.error(`✗ ${tsxPath}: dynamic prefix(es) with zero matching classes in ${cssPath}:`)
  for (const p of uncoveredDynamic) console.error(`    "${p}..."`)
}
if (dynamicPrefixes.size > 0) {
  console.log(`  (${dynamicPrefixes.size} dynamic-key prefix(es) found — prefix-checked only, review manually)`)
}

const unused = [...defined].filter((d) => !staticKeys.has(d) && ![...dynamicPrefixes].some((p) => d.startsWith(p)))
if (unused.length > 0) {
  console.log(`  (${unused.length} class(es) defined but not referenced via styles — expected for pseudo-class/nested targets: ${unused.slice(0, 8).join(', ')}${unused.length > 8 ? ', …' : ''})`)
}

if (ok) {
  console.log(`✓ ${tsxPath} ↔ ${cssPath}: all ${staticKeys.size} static + ${dynamicPrefixes.size} dynamic key(s) accounted for.`)
} else {
  process.exit(1)
}
