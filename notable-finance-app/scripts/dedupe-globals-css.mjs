// Phase 8.1 prerequisite (wiki/desktop/refactor_development_plan.md, F6) — remove exact
// duplicate sections from globals.css before splitting it.
//
// Discovered while building the @import split (see split-globals-css.mjs): 44 of the
// file's 161 top-level `/* comment */` sections are byte-identical repeats of an earlier
// section (~5,700 lines, over half the file) — dead CSS left behind by a past redesign
// that was never cleaned up. Splitting the file as-is exposes this to Vite's production
// build, which silently deduplicates identical content across separate @import'd files
// (confirmed with a minimal repro), shrinking the bundle in a way that can't be verified
// by a byte-comparison. So: remove the duplicates first, as their own explicit, verified
// step, then the split has nothing left to dedupe.
//
// Safety argument (why this is a zero-effect removal, not a "rule change" in the risky
// sense): for two byte-identical rules at the same selector/specificity, CSS's cascade
// tie-break is "last one in source order wins". Keeping only the LAST occurrence of each
// duplicate and removing every earlier one can only ever remove an assertion that was
// already losing to the kept (later, identical) copy — this holds regardless of what
// other rules exist anywhere else in the file, so no cascade-order reasoning about
// intervening rules is required.
//
// Usage:
//   node scripts/dedupe-globals-css.mjs           # writes the deduped file + prints a report
//   node scripts/dedupe-globals-css.mjs --dry-run # prints the report only, writes nothing

import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SOURCE = join(__dirname, '..', 'src', 'renderer', 'src', 'assets', 'globals.css')
const DRY_RUN = process.argv.includes('--dry-run')

function parseSections(text) {
  const lines = text.split('\n')
  let depth = 0
  const headerLineIdx = []
  for (let i = 0; i < lines.length; i++) {
    if (depth === 0 && lines[i].startsWith('/*')) headerLineIdx.push(i)
    depth += (lines[i].match(/{/g) ?? []).length - (lines[i].match(/}/g) ?? []).length
  }
  if (depth !== 0) {
    throw new Error(`Brace depth did not balance (ended at ${depth}) — refusing to dedupe.`)
  }
  return headerLineIdx.map((startIdx, i) => {
    const endIdx = i + 1 < headerLineIdx.length ? headerLineIdx[i + 1] : lines.length
    const bodyLines = lines.slice(startIdx, endIdx)
    return { startIdx, headerText: lines[startIdx], bodyLines, content: bodyLines.join('\n') }
  })
}

function main() {
  const original = readFileSync(SOURCE, 'utf8')
  const sections = parseSections(original)

  // Group by exact content; within each group, every member but the LAST is a removable
  // duplicate (kept member kept in its original position — see safety argument above).
  const byContent = new Map()
  for (const s of sections) {
    if (!byContent.has(s.content)) byContent.set(s.content, [])
    byContent.get(s.content).push(s)
  }
  const toRemove = new Set()
  for (const group of byContent.values()) {
    if (group.length < 2) continue
    for (const s of group.slice(0, -1)) toRemove.add(s)
  }

  const kept = sections.filter((s) => !toRemove.has(s))
  const removed = sections.filter((s) => toRemove.has(s))

  console.log(`${sections.length} sections parsed; ${removed.length} are duplicates of a later section.`)
  for (const s of removed) {
    const survivor = byContent.get(s.content).at(-1)
    console.log(
      `  remove line ${s.startIdx + 1} (${s.bodyLines.length} lines): ${s.headerText.slice(0, 70)}  [kept copy at line ${survivor.startIdx + 1}]`
    )
  }
  console.log(`\nLines before: ${sections.reduce((n, s) => n + s.bodyLines.length, 0)}`)
  console.log(`Lines after:  ${kept.reduce((n, s) => n + s.bodyLines.length, 0)}`)

  if (DRY_RUN) {
    console.log('\n--dry-run: nothing written.')
    return
  }

  const newContent = kept.flatMap((s) => s.bodyLines).join('\n')
  // Sanity check: every kept section's content must still be present, in original
  // relative order, nowhere else altered.
  const reparsed = parseSections(newContent)
  if (reparsed.length !== kept.length || reparsed.some((s, i) => s.content !== kept[i].content)) {
    throw new Error('Post-write re-parse does not match the planned kept-section list — refusing to write.')
  }

  writeFileSync(SOURCE, newContent, 'utf8')
  console.log(`\nWrote ${SOURCE} (${removed.length} duplicate sections removed, ${kept.length} kept).`)
}

main()
