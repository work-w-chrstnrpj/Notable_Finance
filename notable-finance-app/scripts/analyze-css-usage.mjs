// Phase 8.2 analysis helper — maps each CSS class defined in the split assets/ files to the
// .tsx file(s) that reference it, so "genuinely component-local" can be answered precisely
// rather than guessed. Strips `import ... from "...";` lines before searching: a plain
// substring/word-boundary match without this falsely counts e.g. `toast` as "shared" because
// `import { Toast } from "@/components/ui/toast"` contains the literal substring "toast" in
// its import path, not because any other component's JSX references a `toast` class.
//
// Usage:
//   node scripts/analyze-css-usage.mjs                    # full report: N files x M classes
//   node scripts/analyze-css-usage.mjs --owner <file.tsx>  # classes owned by exactly this file

import { readFileSync, globSync } from 'node:fs'

const ASSETS_GLOB = 'src/renderer/src/assets/{base,layout,components,pages}/*.css'
const TSX_GLOB = 'src/renderer/src/**/*.tsx'

const cssFiles = globSync(ASSETS_GLOB).sort()
const classToCssFiles = new Map() // class -> Set<cssFile>

for (const f of cssFiles) {
  const text = readFileSync(f, 'utf8')
  for (const selBlock of text.matchAll(/([^{}]+)\{/g)) {
    for (const m of selBlock[1].matchAll(/\.([a-zA-Z_][a-zA-Z0-9_-]*)/g)) {
      if (!classToCssFiles.has(m[1])) classToCssFiles.set(m[1], new Set())
      classToCssFiles.get(m[1]).add(f)
    }
  }
}

const tsxFiles = globSync(TSX_GLOB).filter((f) => !f.endsWith('.test.tsx')).sort()
const tsxSearchable = new Map() // file -> content with import lines stripped
for (const f of tsxFiles) {
  const raw = readFileSync(f, 'utf8')
  const stripped = raw.replace(/^import\s[^\n]*;?\s*$/gm, '')
  tsxSearchable.set(f, stripped)
}

function usersOf(cls) {
  const escaped = cls.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`)
  const users = new Set()
  for (const [f, content] of tsxSearchable) {
    if (re.test(content)) users.add(f)
  }
  return users
}

const usage = new Map()
for (const cls of classToCssFiles.keys()) usage.set(cls, usersOf(cls))

const args = process.argv.slice(2)
if (args[0] === '--owner') {
  const target = args[1]
  const classes = [...usage.entries()]
    .filter(([, users]) => users.size === 1 && [...users][0] === target)
    .map(([cls]) => cls)
    .sort()
  console.log(classes.join('\n'))
  process.exit(0)
}

const zero = [...usage.entries()].filter(([, u]) => u.size === 0)
const one = [...usage.entries()].filter(([, u]) => u.size === 1)
const many = [...usage.entries()].filter(([, u]) => u.size > 1)

console.log('total unique classes:', usage.size)
console.log('used by 0 tsx files:', zero.length)
console.log('used by exactly 1 tsx file:', one.length)
console.log('used by 2+ tsx files (shared, do not migrate):', many.length)

const byFile = new Map()
for (const [cls, users] of one) {
  const owner = [...users][0]
  if (!byFile.has(owner)) byFile.set(owner, [])
  byFile.get(owner).push(cls)
}
const rows = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length)
console.log(`\n${rows.length} distinct .tsx files have >=1 single-owned class\n`)
for (const [f, classes] of rows) {
  console.log(String(classes.length).padStart(4), ' ', f)
}
