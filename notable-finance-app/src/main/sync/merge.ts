// Three-way merge (Phase 4.1) — the core of reconcile (wiki/desktop/sync-and-conflict-design.md).
// Pure: three field maps in, an outcome out. Operates in the shared camelCase "writable"
// space that base_snapshot, push, and pull all use, so base is a true common ancestor.
//
//   localChanged  = fields where local ≠ base
//   remoteChanged = fields where remote ≠ base
//   both empty                 → noop
//   local empty                → pull      (apply remote)
//   remote empty               → push      (local already dirty; push handles it)
//   both, no overlap           → automerge (keep local's changes, apply remote's disjoint ones)
//   both, overlap ≠ ∅          → conflict  (auto-merge disjoint, flag overlapping fields)

export type FieldMap = Record<string, unknown>

export type MergeOutcome = 'noop' | 'pull' | 'push' | 'automerge' | 'conflict'

export interface MergeConflict {
  field: string
  base: unknown
  local: unknown
  remote: unknown
}

export interface MergeResult {
  outcome: MergeOutcome
  /** Writable fields to store on the local record. */
  merged: FieldMap
  /** New base_snapshot (the merge ancestor going forward). */
  base: FieldMap
  conflicts: MergeConflict[]
}

// null and undefined are the same "empty" for finance fields.
const norm = (v: unknown): unknown => (v === undefined ? null : v)
const eq = (a: unknown, b: unknown): boolean => Object.is(norm(a), norm(b))

export function threeWayMerge(base: FieldMap, local: FieldMap, remote: FieldMap): MergeResult {
  const keys = new Set([...Object.keys(base), ...Object.keys(local), ...Object.keys(remote)])
  const localChanged: string[] = []
  const remoteChanged: string[] = []
  for (const k of keys) {
    if (!eq(local[k], base[k])) localChanged.push(k)
    if (!eq(remote[k], base[k])) remoteChanged.push(k)
  }

  if (localChanged.length === 0 && remoteChanged.length === 0) {
    return { outcome: 'noop', merged: { ...local }, base: { ...base }, conflicts: [] }
  }
  if (localChanged.length === 0) {
    return { outcome: 'pull', merged: { ...remote }, base: { ...remote }, conflicts: [] }
  }
  if (remoteChanged.length === 0) {
    return { outcome: 'push', merged: { ...local }, base: { ...base }, conflicts: [] }
  }

  const remoteChangedSet = new Set(remoteChanged)
  const overlap = localChanged.filter((k) => remoteChangedSet.has(k))

  // Apply remote's DISJOINT changes onto local; base advances on those fields.
  const merged: FieldMap = { ...local }
  const newBase: FieldMap = { ...base }
  for (const k of remoteChanged) {
    if (!overlap.includes(k)) {
      merged[k] = remote[k]
      newBase[k] = remote[k]
    }
  }

  if (overlap.length === 0) {
    return { outcome: 'automerge', merged, base: newBase, conflicts: [] }
  }

  const conflicts: MergeConflict[] = overlap.map((field) => ({
    field,
    base: norm(base[field]),
    local: norm(local[field]),
    remote: norm(remote[field])
  }))
  return { outcome: 'conflict', merged, base: newBase, conflicts }
}
