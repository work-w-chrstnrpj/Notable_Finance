/** Resolve relative month phrases to YYYY-MM using a reference "today" ISO date. */
const MONTH_NAMES: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12
}

function padMonth(y: number, m: number): string {
  return `${y}-${String(m).padStart(2, '0')}`
}

export function todayIso(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function currentMonth(now = new Date()): string {
  return padMonth(now.getFullYear(), now.getMonth() + 1)
}

/** Shift YYYY-MM by delta months. */
export function shiftMonth(month: string, delta: number): string {
  const [ys, ms] = month.split('-')
  const y = Number(ys)
  const m = Number(ms)
  const idx = y * 12 + (m - 1) + delta
  const ny = Math.floor(idx / 12)
  const nm = (idx % 12) + 1
  return padMonth(ny, nm)
}

/**
 * Resolve user/tool month input to YYYY-MM.
 * Accepts YYYY-MM, "this month", "last month", "July 2026", "July".
 * Returns null if not resolvable.
 */
export function resolveMonth(raw: unknown, now = new Date()): string | null {
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  if (!t) return null
  if (/^\d{4}-\d{2}$/.test(t)) return t

  const lower = t.toLowerCase()
  const cur = currentMonth(now)
  if (
    lower === 'this month' ||
    lower === 'current month' ||
    lower === 'ngayon' ||
    lower === 'this'
  ) {
    return cur
  }
  if (lower === 'last month' || lower === 'previous month' || lower === 'nakaraan') {
    return shiftMonth(cur, -1)
  }
  if (lower === 'next month') return shiftMonth(cur, 1)

  // "July 2026" / "jul 2026"
  const named = lower.match(/^([a-z]+)\s+(\d{4})$/)
  if (named) {
    const mi = MONTH_NAMES[named[1]!]
    if (mi) return padMonth(Number(named[2]), mi)
  }

  // "July" alone → that month in current year (or previous year if month already passed? use current year)
  const onlyName = MONTH_NAMES[lower]
  if (onlyName) return padMonth(now.getFullYear(), onlyName)

  return null
}

export function requireMonth(raw: unknown, now = new Date()): string {
  const m = resolveMonth(raw, now) ?? (raw == null || raw === '' ? currentMonth(now) : null)
  if (!m) {
    throw new Error(
      `Could not resolve month from "${String(raw)}". Use YYYY-MM or phrases like "this month" / "July 2026".`
    )
  }
  return m
}

function padDay(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function addDays(iso: string, delta: number): string {
  const [ys, ms, ds] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(ys!, ms! - 1, ds!))
  dt.setUTCDate(dt.getUTCDate() + delta)
  return padDay(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())
}

/** Resolve relative dates to YYYY-MM-DD (today / yesterday / tomorrow / ISO). */
export function resolveDate(raw: unknown, now = new Date()): string | null {
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  if (!t) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  const lower = t.toLowerCase()
  const today = todayIso(now)
  if (lower === 'today' || lower === 'ngayon') return today
  if (lower === 'yesterday' || lower === 'kahapon') return addDays(today, -1)
  if (lower === 'tomorrow' || lower === 'bukas') return addDays(today, 1)
  return null
}

export function requireDate(raw: unknown, field = 'date', now = new Date()): string {
  const d = resolveDate(raw, now)
  if (!d) {
    throw new Error(
      `${field} must be YYYY-MM-DD or today/yesterday/tomorrow (got "${String(raw)}")`
    )
  }
  return d
}
