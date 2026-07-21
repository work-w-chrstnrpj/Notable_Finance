import { describe, it, expect } from 'vitest'
import { threeWayMerge } from '../src/main/sync/merge'

// The scenario matrix from wiki/desktop/sync-and-conflict-design.md.
const base = { amount: 100, note: 'a', date: '2026-07-01' }

describe('threeWayMerge scenario matrix', () => {
  it('no-op when neither side changed', () => {
    const r = threeWayMerge(base, { ...base }, { ...base })
    expect(r.outcome).toBe('noop')
  })

  it('pull when only remote changed', () => {
    const r = threeWayMerge(base, { ...base }, { ...base, amount: 150 })
    expect(r.outcome).toBe('pull')
    expect(r.merged.amount).toBe(150)
    expect(r.base.amount).toBe(150)
  })

  it('push when only local changed', () => {
    const r = threeWayMerge(base, { ...base, amount: 120 }, { ...base })
    expect(r.outcome).toBe('push')
    expect(r.merged.amount).toBe(120)
    expect(r.base.amount).toBe(100) // base unchanged; push advances it later
  })

  it('auto-merge when both changed disjoint fields', () => {
    const local = { ...base, amount: 120 } // local changed amount
    const remote = { ...base, note: 'b' } // remote changed note
    const r = threeWayMerge(base, local, remote)
    expect(r.outcome).toBe('automerge')
    expect(r.merged.amount).toBe(120) // local kept
    expect(r.merged.note).toBe('b') // remote applied
    expect(r.base.note).toBe('b') // base advances on the remote field
    expect(r.base.amount).toBe(100) // but not on the still-unpushed local field
    expect(r.conflicts).toHaveLength(0)
  })

  it('conflict when both changed the same field', () => {
    const local = { ...base, amount: 120 }
    const remote = { ...base, amount: 200 }
    const r = threeWayMerge(base, local, remote)
    expect(r.outcome).toBe('conflict')
    expect(r.conflicts).toEqual([{ field: 'amount', base: 100, local: 120, remote: 200 }])
    expect(r.merged.amount).toBe(120) // local kept until resolved
  })

  it('conflicts on the overlap but auto-merges disjoint fields in the same record', () => {
    const local = { ...base, amount: 120, note: 'local-note' }
    const remote = { ...base, amount: 200, date: '2026-08-01' }
    const r = threeWayMerge(base, local, remote)
    expect(r.outcome).toBe('conflict')
    // only amount conflicts
    expect(r.conflicts.map((c) => c.field)).toEqual(['amount'])
    // remote's disjoint date change is auto-applied; local's disjoint note kept
    expect(r.merged.date).toBe('2026-08-01')
    expect(r.merged.note).toBe('local-note')
    expect(r.base.date).toBe('2026-08-01')
  })

  it('treats null and undefined as equal (no spurious change)', () => {
    const b = { x: null as unknown }
    const r = threeWayMerge(b, { x: undefined }, { x: null })
    expect(r.outcome).toBe('noop')
  })

  it('soft-delete vs edit conflicts on the overlapping field (per the scenario matrix)', () => {
    const b = { title: 'Groceries', amount: 100 }
    // Soft-delete rewrites the title AND zeroes the amount; remote also edited amount.
    const local = { title: '[Deleted: Groceries]', amount: 0 }
    const remote = { title: 'Groceries', amount: 250 }
    const r = threeWayMerge(b, local, remote)
    expect(r.outcome).toBe('conflict')
    expect(r.conflicts.map((c) => c.field)).toEqual(['amount'])
    // title changed only locally → auto-kept; amount awaits the user's decision
    expect(r.merged.title).toBe('[Deleted: Groceries]')
    expect(r.merged.amount).toBe(0)
  })
})
