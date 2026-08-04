// Phase 8.1 of wiki/desktop/refactor_development_plan.md (F6) — split the single
// 11,030-line globals.css into base/ layout/ components/ pages/ by concern.
//
// This script is IMPORTS ONLY: every original line is preserved verbatim, in its
// original relative order, split at existing top-level `/* comment */` section
// boundaries into one file per section. The new globals.css becomes a flat list of
// `@import` statements in the exact original order, so the cascade — and therefore the
// built CSS bundle — is unchanged. Categorization into base/layout/components/pages is
// classification only (via keyword rules against each section's header text): it decides
// which folder a section's file lives in, never its content or its position in the
// import order, so a wrong guess costs navigability, not correctness.
//
// One deliberate exception: section files move one directory level deeper than the
// original globals.css (assets/globals.css -> assets/<category>/<file>.css), so a
// same-directory relative reference inside a section (only `@import "./fonts.css";`
// exists in this file today) has its `./` prefix rewritten to `../` at write time so it
// still resolves. This is the only content edit the script makes; the byte-for-byte
// reconstruction check below runs against the UNMODIFIED body lines, before that
// rewrite, so it still proves the split lost, duplicated, or reordered nothing — the
// path fix is verified separately, by the build succeeding and the compiled CSS bundle
// (where import paths are resolved away entirely) byte-matching the pre-split baseline.
//
// Usage:
//   node scripts/split-globals-css.mjs           # writes the split + prints a report
//   node scripts/split-globals-css.mjs --dry-run # prints the report only, writes nothing
// Verification (run separately): rebuild the app and byte-diff the built CSS bundle
// against the pre-split baseline. See wiki/desktop/refactor_development_plan.md Phase 8.

import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ASSETS_DIR = join(__dirname, '..', 'src', 'renderer', 'src', 'assets')
const SOURCE = join(ASSETS_DIR, 'globals.css')
const DRY_RUN = process.argv.includes('--dry-run')

const CATEGORIES = ['base', 'layout', 'components', 'pages']

// Ordered rules: first match wins. Matched against the header comment's own text only
// (not file content), case-insensitive. Keep base minimal — root tokens + the color-scheme
// switch itself — everything else defaults to components/pages by keyword, else components.
const RULES = [
  [/fonts are self-hosted/i, 'base'],
  [/^\/\*\s*──\s*dark mode\s*──/i, 'base'],
  [/dark mode: hardcoded color overrides/i, 'base'],

  [/full-window shell|tab strip/i, 'layout'],
  [/collapsed rail|wordmark/i, 'layout'],
  [/collapsed sidebar/i, 'layout'],
  [/connectivity indicator/i, 'layout'],
  [/hamburger/i, 'layout'],
  [/drawer backdrop|mobile nav/i, 'layout'],
  [/tablet|phones?\b|small tablets/i, 'layout'],

  [/chat mode|sidebar \/ history|main pane \/ toolbar|message stream|empty state|composer\b|offline chip in chat/i, 'pages'],
  [/dev logs/i, 'pages'],
  [/financial action card/i, 'pages'],
  [/notion preview|^\/\*\s*headings\s*\*\/$|^\/\*\s*paragraph\s*\*\/$|^\/\*\s*lists\s*\*\/$|^\/\*\s*checkbox \(task list\)\s*\*\/$|^\/\*\s*blockquote\s*\*\/$|^\/\*\s*inline code\s*\*\/$|^\/\*\s*code block\s*\*\/$|^\/\*\s*table\s*\*\/$|^\/\*\s*divider\s*\*\/$|^\/\*\s*image\s*\*\/$|^\/\*\s*link\s*\*\/$|^\/\*\s*callout\s*\*\/$|^\/\*\s*toggle\s*\*\/$|^\/\*\s*child page\s*\*\/$|^\/\*\s*breadcrumb\s*\*\/$|end notion preview/i, 'pages'],
  [/page content panel|flip animation for page content/i, 'pages'],
  [/design preset cards/i, 'pages'],
  [/optimistic pending record rows/i, 'pages'],
  [/forecast kind tag/i, 'pages'],
  [/wide tables|freeze the first two columns|opaque backgrounds so scrolling/i, 'pages'],
  [/sticky toolbar inside page-stack/i, 'pages'],
  [/conflict resolution|three-column merge grid|header row.*data rows|^\/\*\s*data rows\s*\*\/$|^\/\*\s*cells\s*\*\/$|^\/\*\s*arrow buttons\s*\*\/$|desktop local-first sync panel/i, 'pages'],
  [/receipt|monthly insight|export modal|scoped printing|fab shot hide/i, 'pages'],
  [/account modal header actions/i, 'pages'],
  [/settings: (theme row|interface toggle)/i, 'pages'],
  [/multi-select|linked items section/i, 'pages'],
  [/preset: hig|glass|glossy gradient buttons/i, 'pages'],

  [/bulk action floating toolbar/i, 'components'],
  [/filter dropdown|search toggle|filter toggle|toolbar row/i, 'components'],
  [/modal header actions container/i, 'components'],
  [/numeric value styling|amount owed/i, 'components'],
  [/row selection checkbox|header checkbox|show checkbox on row hover|disabled \(dimmed\) rows|keep the checkbox clickable/i, 'components'],
  [/sort caret/i, 'components'],
  [/field error \+ shake/i, 'components'],
  [/toast notification|info variant \(form automations\)/i, 'components'],
  [/skeleton loading/i, 'components'],
  [/error boundary/i, 'components'],
  [/table pagination/i, 'components'],
  [/push-to-sync floating button|launch flourish/i, 'components'],
  [/floating action button/i, 'components'],
  [/color ?picker/i, 'components'],
  [/theme modal color pickers layout/i, 'components'],
  [/disabling fieldset/i, 'components'],
  [/red badge for items needing attention|amber .waiting to sync. badge/i, 'components'],
  [/keyboard shortcuts: reveal hints|revealed while cmd\/ctrl/i, 'components'],
]

function classify(headerText) {
  for (const [re, category] of RULES) {
    if (re.test(headerText)) return category
  }
  return 'components'
}

function slug(headerText) {
  return headerText
    .replace(/\/\*|\*\//g, '')
    .replace(/[─│┌┐└┘├┤┬┴┼]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'section'
}

function main() {
  const original = readFileSync(SOURCE, 'utf8')
  const lines = original.split('\n')

  // Find top-level (brace-depth 0) comment headers — same boundary rule used for the
  // dry-run survey: a new section starts at every depth-0 line beginning with `/*`.
  let depth = 0
  const headerLineIdx = []
  for (let i = 0; i < lines.length; i++) {
    if (depth === 0 && lines[i].startsWith('/*')) headerLineIdx.push(i)
    depth += (lines[i].match(/{/g) ?? []).length - (lines[i].match(/}/g) ?? []).length
  }
  if (depth !== 0) {
    throw new Error(`Brace depth did not balance (ended at ${depth}) — refusing to split.`)
  }

  const sections = headerLineIdx.map((startIdx, i) => {
    const endIdx = i + 1 < headerLineIdx.length ? headerLineIdx[i + 1] : lines.length
    const bodyLines = lines.slice(startIdx, endIdx)
    const headerText = lines[startIdx]
    return { startIdx, endIdx, headerText, bodyLines }
  })

  // Assign unique filenames: 3-digit running counter (= original order) + slug, so a
  // directory listing sorts back into document order and duplicate header text
  // (e.g. several sections literally titled "Dark theme") can't collide.
  const used = new Set()
  const plan = sections.map((s, i) => {
    const category = classify(s.headerText)
    const base = `${String(i + 1).padStart(3, '0')}-${slug(s.headerText)}`
    let name = base
    let n = 2
    while (used.has(name)) name = `${base}-${n++}`
    used.add(name)
    return { ...s, category, filename: `${name}.css` }
  })

  // Report
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c, 0]))
  for (const p of plan) counts[p.category]++
  console.log(`${plan.length} sections found (depth balanced to 0, as expected).`)
  for (const c of CATEGORIES) console.log(`  ${c}: ${counts[c]}`)

  if (DRY_RUN) {
    for (const p of plan) {
      console.log(`  [${p.category}] ${p.filename}  <-  line ${p.startIdx + 1}: ${p.headerText.slice(0, 90)}`)
    }
    console.log('\n--dry-run: nothing written.')
    return
  }

  // Reconstruction check BEFORE writing anything: concatenating every section's body
  // lines, in plan order, must reproduce the original file exactly.
  const rebuilt = plan.flatMap((p) => p.bodyLines).join('\n')
  if (rebuilt !== original) {
    throw new Error('Section split does not reconstruct the original file byte-for-byte — refusing to write.')
  }

  for (const c of CATEGORIES) {
    const dir = join(ASSETS_DIR, c)
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
  }

  for (const p of plan) {
    const dir = join(ASSETS_DIR, p.category)
    // Section files live one directory deeper than the original globals.css did, so a
    // same-directory relative `@import "./x"` must become `../x` to keep resolving.
    const adjusted = p.bodyLines
      .map((line) => line.replace(/^(\s*@import\s+["'])\.\//, '$1../'))
      .join('\n')
    writeFileSync(join(dir, p.filename), adjusted, 'utf8')
  }

  const importLines = plan.map((p) => `@import "./${p.category}/${p.filename}";`)
  const newGlobals = importLines.join('\n') + '\n'
  writeFileSync(SOURCE, newGlobals, 'utf8')

  console.log(`\nWrote ${plan.length} section files across ${CATEGORIES.length} folders.`)
  console.log(`Rewrote ${SOURCE} as a ${importLines.length}-line @import list.`)
  console.log('Reconstruction check passed: concatenated sections == original file, byte-for-byte.')
}

main()
