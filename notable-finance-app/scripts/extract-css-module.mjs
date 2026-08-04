// Phase 8.2 (wiki/desktop/refactor_development_plan.md, F6) — structural extraction of
// every CSS rule touching a given set of classes, out of the base/layout/components/pages
// split files and into a colocated CSS Module, WITHOUT dropping variants nested inside
// @media / other at-rules. A regex-only extractor would miss e.g. a dark-theme or
// responsive override sitting inside `@media (max-width: 768px) { .page-toolbar { ... } }`
// elsewhere in the file — exactly the failure mode this script exists to prevent, since a
// dropped variant doesn't error, it just silently never applies once the component switches
// to a CSS-Modules hashed class name.
//
// Usage:
//   node scripts/extract-css-module.mjs <output.module.css> <class1> [class2] [...]
//   node scripts/extract-css-module.mjs --dry-run <output.module.css> <class1> [...]
//
// Scans every src/renderer/src/assets/{base,layout,components,pages}/*.css file, pulls out
// every rule (at any nesting depth) whose selector references any of the given class names,
// writes them to <output.module.css> in original cross-file order, and rewrites the source
// files with those rules removed (unless --dry-run).

import { readFileSync, writeFileSync, globSync } from 'node:fs'

const args = process.argv.slice(2)
const dryRun = args[0] === '--dry-run'
const rest = dryRun ? args.slice(1) : args
const [outPath, ...targetClasses] = rest
if (!outPath || targetClasses.length === 0) {
  console.error('Usage: node scripts/extract-css-module.mjs [--dry-run] <output.module.css> <class1> [class2] ...')
  process.exit(1)
}
const targets = new Set(targetClasses)

const ASSETS_GLOB = 'src/renderer/src/assets/{base,layout,components,pages}/*.css'

/**
 * Parse a CSS string into a flat list of top-level nodes. Each node is either:
 *  { type: 'rule', selector, body, raw }         — a plain rule (no nested rules)
 *  { type: 'atrule', prelude, children, raw }    — @media/@supports/etc with nested rules
 *  { type: 'other', raw }                        — comments/blank lines/stray text between rules
 * Brace-depth tracking treats "..." / '...' as opaque so braces inside string values
 * (e.g. content: "}") don't desync the parse.
 */
function parseBlocks(text) {
  const nodes = []
  let i = 0
  const n = text.length
  let cursor = 0

  function skipToBlockEnd(start) {
    // start is the index of the opening '{'; returns index just past the matching '}'.
    // Comments are skipped as opaque BEFORE quote-tracking: an apostrophe or stray quote
    // inside a body comment (e.g. "this item's automatic minimum size") would otherwise be
    // misread as the start of a string literal, silently swallowing every subsequent
    // `{`/`}` — including the rule's real closing brace — into "inside a string" and
    // corrupting brace-depth tracking for the rest of the file.
    let depth = 0
    let j = start
    let inStr = null
    while (j < n) {
      const ch = text[j]
      if (!inStr && ch === '/' && text[j + 1] === '*') {
        const end = text.indexOf('*/', j + 2)
        j = end === -1 ? n : end + 2
        continue
      }
      if (inStr) {
        if (ch === '\\') { j += 2; continue }
        if (ch === inStr) inStr = null
      } else if (ch === '"' || ch === "'") {
        inStr = ch
      } else if (ch === '{') {
        depth++
      } else if (ch === '}') {
        depth--
        if (depth === 0) return j + 1
      }
      j++
    }
    return n
  }

  while (i < n) {
    const braceIdx = text.indexOf('{', i)
    if (braceIdx === -1) {
      if (i < n) nodes.push({ type: 'other', raw: text.slice(i) })
      break
    }
    const prelude = text.slice(cursor, braceIdx)
    const blockEnd = skipToBlockEnd(braceIdx)
    const raw = text.slice(cursor, blockEnd)
    const preludeTrim = prelude.trim()
    // A leading section-header comment (very common in this codebase) sits in the SAME
    // prelude as the rule/at-rule that follows it — e.g. "/* Phones */\n@media (...)" — so
    // checking preludeTrim.startsWith('@') alone misses every at-rule with a comment
    // directly above it, silently treating the whole block (comment + @media + everything
    // nested inside it) as one opaque, never-recursed-into "rule" node.
    const preludeNoComments = preludeTrim.replace(/\/\*[\s\S]*?\*\//g, '').trim()

    if (preludeNoComments.startsWith('@')) {
      const innerStart = braceIdx + 1
      const innerEnd = blockEnd - 1
      const inner = text.slice(innerStart, innerEnd)
      nodes.push({
        type: 'atrule',
        prelude: preludeTrim,
        preludeRaw: prelude,
        children: parseBlocks(inner),
        innerStart,
        raw,
      })
    } else {
      nodes.push({ type: 'rule', selector: preludeTrim, selectorRaw: prelude, raw })
    }
    cursor = blockEnd
    i = blockEnd
  }
  if (cursor < n && nodes.length === 0) {
    nodes.push({ type: 'other', raw: text.slice(cursor) })
  }
  return nodes
}

/**
 * A single selector branch (no top-level commas) is safe to move only if EVERY class it
 * references is one of our targets — not merely "at least one". A branch like
 * `.page-toolbar__actions .button` or `.field--error .field__input--shake` mentions a
 * target ("page-toolbar__actions"/"field--error") alongside a class owned by a DIFFERENT,
 * un-migrated component ("button"/"field__input--shake"). CSS Modules hashes every class
 * token in the destination file regardless of whether the paired .tsx references it via
 * `styles[...]` — so moving a mixed branch would hash the untouched side too, silently
 * breaking that other component's styling (its JSX still emits the literal, now-orphaned
 * class name). A branch with a class list entirely inside `targets` is safe: either it's a
 * single target class, or a compound of several classes ALL owned by the same migration
 * (e.g. `.toast--info .toast__icon`, both toast-family).
 */
function branchClasses(branch) {
  // Strip comments BEFORE matching class tokens. A rule's leading section-header comment
  // lives in the same prelude text as its selector, and prose like "(e.g. unresolved sync
  // conflicts)" contains ".g" — which this regex would otherwise read as a class named
  // "g". That phantom class is never in `targets`, so branchFullyMatchesTargets would
  // judge the whole rule "mixed" and silently leave it behind in the global CSS while the
  // component switched to hashed names — losing the style with no error anywhere.
  const withoutComments = branch.replace(/\/\*[\s\S]*?\*\//g, ' ')
  return [...withoutComments.matchAll(/\.([a-zA-Z_][a-zA-Z0-9_-]*)/g)].map((m) => m[1])
}
function branchFullyMatchesTargets(branch) {
  const classes = branchClasses(branch)
  return classes.length > 0 && classes.every((c) => targets.has(c))
}

/**
 * Split a selector list on top-level commas — i.e. not inside (), [], "", '', or /* *\/
 * comments. A section-header comment placed right before a comma-separated rule (common in
 * this codebase, e.g. "/* Dropdowns, pickers - floating glass *\/") can itself contain a
 * literal comma, which would otherwise split mid-comment and corrupt the CSS syntax. A rule
 * like `.a, .b, .c { color: red }` is one CSS rule with THREE independent selector branches
 * sharing one declaration body; if only `.b` references a target class, only that branch
 * may move. Extracting the whole comma-joined rule would silently steal `.a`/`.c`'s styling
 * from whatever other component actually owns them.
 */
function splitSelectorList(selector) {
  const parts = []
  let depth = 0
  let inStr = null
  let start = 0
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i]
    if (inStr) {
      if (ch === '\\') { i++; continue }
      if (ch === inStr) inStr = null
    } else if (ch === '/' && selector[i + 1] === '*') {
      const end = selector.indexOf('*/', i + 2)
      i = end === -1 ? selector.length : end + 1
    } else if (ch === '"' || ch === "'") {
      inStr = ch
    } else if (ch === '(' || ch === '[') {
      depth++
    } else if (ch === ')' || ch === ']') {
      depth--
    } else if (ch === ',' && depth === 0) {
      parts.push(selector.slice(start, i))
      start = i + 1
    }
  }
  parts.push(selector.slice(start))
  return parts.map((p) => p.trim()).filter(Boolean)
}

/** Extract the declaration-body text (`{ ... }` inclusive) from a rule's raw text. */
function bodyOf(raw) {
  return raw.slice(raw.indexOf('{'))
}

/**
 * Partition a node list into { keep, extract } — `extract` reconstructs into standalone
 * CSS text (at-rule wrappers preserved around only the matching children); `keep` is the
 * original node list with matching content removed. Rules with a mixed comma-separated
 * selector list are split so only the matching branches move.
 */
function partition(nodes) {
  const keepNodes = []
  const extractedTexts = []

  for (const node of nodes) {
    if (node.type === 'rule') {
      const branches = splitSelectorList(node.selector)
      const matching = branches.filter(branchFullyMatchesTargets)
      const nonMatching = branches.filter((b) => !branchFullyMatchesTargets(b))
      if (matching.length === branches.length) {
        // every branch qualifies (covers the common single-selector rule too) — move as-is.
        extractedTexts.push(node.raw)
        continue
      }
      const body = bodyOf(node.raw)
      if (matching.length > 0) {
        extractedTexts.push(`${matching.join(',\n')} ${body}`)
      }
      if (nonMatching.length > 0) {
        keepNodes.push({ type: 'rule', rebuiltRaw: `${nonMatching.join(',\n')} ${body}` })
      }
    } else if (node.type === 'atrule') {
      const { keep: childKeep, extract: childExtract } = partition(node.children)
      if (childExtract.length > 0) {
        extractedTexts.push(`${node.preludeRaw.trim()} {\n${childExtract.join('\n\n')}\n}`)
      }
      if (childKeep.trim().length > 0) {
        keepNodes.push({ ...node, children: null, rebuiltRaw: `${node.preludeRaw}{${childKeep}}` })
      }
      // else: entire at-rule extracted, drop from keepNodes
    } else {
      keepNodes.push(node)
    }
  }

  const keepText = keepNodes
    .map((n) => (n.rebuiltRaw !== undefined ? n.rebuiltRaw : n.raw))
    .join('')
  const extract = extractedTexts
  return { keep: keepText, extract }
}

const files = globSync(ASSETS_GLOB).sort()
const allExtracted = []
const fileRewrites = []

for (const file of files) {
  const text = readFileSync(file, 'utf8')
  const nodes = parseBlocks(text)
  const { keep, extract } = partition(nodes)
  if (extract.length > 0) {
    allExtracted.push({ file, extract })
    fileRewrites.push({ file, keep })
  }
}

if (allExtracted.length === 0) {
  console.log('No matching rules found in any split CSS file for:', [...targets].join(', '))
  process.exit(0)
}

console.log(`Found rules for [${[...targets].join(', ')}] in ${allExtracted.length} file(s):`)
for (const { file, extract } of allExtracted) {
  console.log(`  ${file}  (${extract.length} rule/at-rule block(s))`)
}

const moduleCss = allExtracted
  .flatMap(({ extract }) => extract)
  .join('\n\n')
  .trim() + '\n'

if (dryRun) {
  console.log('\n--- would write to', outPath, '---\n')
  console.log(moduleCss)
  console.log('--- dry-run: source files left untouched ---')
  process.exit(0)
}

writeFileSync(outPath, moduleCss, 'utf8')
for (const { file, keep } of fileRewrites) {
  writeFileSync(file, keep, 'utf8')
}
console.log(`\nWrote ${outPath}.`)
console.log(`Rewrote ${fileRewrites.length} source file(s) with extracted rules removed.`)
