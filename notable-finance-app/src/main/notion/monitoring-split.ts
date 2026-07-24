// Reads the Needs/Wants/Savings allocation from the "Total Monthly Monitoring"
// row in the user's Notion monitoring database. This DB is not part of the
// local sync (it holds no records we own) — we query it on demand and cache the
// single global split. Falls back to the classic 50/30/20 whenever the Notion
// path is unavailable, so Monitoring always has usable numbers.
import { NotionClient } from './client'
import { hasToken, readToken } from './token-store'
import { getMapping } from './mapping-store'
import { extractNumberOrFormula, extractTitle } from './page-extractors'
import { appendDevLog } from '../dev-logs/store'
import type { MonitoringSplitDto } from '../../shared/finance.types'

type Props = Record<string, unknown>

const DEFAULT_SPLIT = { needsPct: 0.5, wantsPct: 0.3, savingsPct: 0.2 }
const TARGET_ROW = 'total monthly monitoring'
const CACHE_TTL_MS = 5 * 60 * 1000

let cache: { at: number; value: MonitoringSplitDto } | null = null

/** The monitoring DB id lives in the mapping under a non-`MappableResource` key. */
function monitoringDbId(): string | null {
  const id = (getMapping() as Record<string, string | undefined>).monthlyMonitoring
  return id && id.trim() ? id.trim() : null
}

/** Find the title property regardless of its label (usually "Name"). */
function titlePropName(props: Props): string | null {
  for (const [name, val] of Object.entries(props)) {
    if (val && typeof val === 'object' && (val as { type?: string }).type === 'title') return name
  }
  return null
}

/** Accept either whole percents (50) or fractions (0.5); return a fraction. */
function normalizePct(v: number | null): number | null {
  if (v == null || !Number.isFinite(v)) return null
  const frac = v > 1 ? v / 100 : v
  if (frac < 0 || frac > 1.5) return null
  return frac
}

function readPct(props: Props, candidates: string[]): number | null {
  for (const name of candidates) {
    if (name in props) {
      const norm = normalizePct(extractNumberOrFormula(props, name))
      if (norm != null) return norm
    }
  }
  // Case-insensitive fallback (handles trailing spaces / casing differences).
  const lower = new Map(Object.keys(props).map((k) => [k.toLowerCase().trim(), k]))
  for (const name of candidates) {
    const hit = lower.get(name.toLowerCase().trim())
    if (hit) {
      const norm = normalizePct(extractNumberOrFormula(props, hit))
      if (norm != null) return norm
    }
  }
  return null
}

function fallback(rowFound: boolean): MonitoringSplitDto {
  return { ...DEFAULT_SPLIT, source: 'default', rowFound }
}

function log(message: string, ok: boolean): void {
  appendDevLog({ kind: 'api', source: 'main', action: 'monitoring.split', message, ok })
}

export function invalidateMonitoringSplitCache(): void {
  cache = null
}

export async function fetchMonitoringSplit(opts?: {
  forceRefresh?: boolean
}): Promise<MonitoringSplitDto> {
  if (!opts?.forceRefresh && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.value
  }

  const dbId = monitoringDbId()
  if (!hasToken() || !dbId) {
    const value = fallback(false)
    cache = { at: Date.now(), value }
    return value
  }

  try {
    const pages = await new NotionClient(readToken()).queryDatabase(dbId)
    let target: Record<string, unknown> | undefined
    for (const page of pages) {
      const props = (page.properties as Props) ?? {}
      const tName = titlePropName(props)
      if (tName && extractTitle(props, tName).trim().toLowerCase() === TARGET_ROW) {
        target = page
        break
      }
    }

    if (!target) {
      log(`"Total Monthly Monitoring" row not found among ${pages.length} rows — using 50/30/20`, false)
      const value = fallback(false)
      cache = { at: Date.now(), value }
      return value
    }

    const props = (target.properties as Props) ?? {}
    const needs = readPct(props, ['Need %', 'Needs %', 'Need%', 'Needs%', 'Need', 'Needs'])
    const wants = readPct(props, ['Wants %', 'Want %', 'Wants%', 'Want%', 'Wants', 'Want'])
    const savings = readPct(props, ['Savings %', 'Saving %', 'Savings%', 'Saving%', 'Savings', 'Saving'])

    if (needs == null && wants == null && savings == null) {
      log(`Row found but no Need/Wants/Savings % matched. Props: ${Object.keys(props).join(', ')}`, false)
      const value = fallback(true)
      cache = { at: Date.now(), value }
      return value
    }

    const value: MonitoringSplitDto = {
      needsPct: needs ?? DEFAULT_SPLIT.needsPct,
      wantsPct: wants ?? DEFAULT_SPLIT.wantsPct,
      savingsPct: savings ?? DEFAULT_SPLIT.savingsPct,
      source: 'notion',
      rowFound: true
    }
    log(
      `Loaded Need ${Math.round(value.needsPct * 100)}% / Wants ${Math.round(
        value.wantsPct * 100
      )}% / Savings ${Math.round(value.savingsPct * 100)}%`,
      true
    )
    cache = { at: Date.now(), value }
    return value
  } catch (err) {
    log(`Notion fetch failed: ${err instanceof Error ? err.message : String(err)} — using 50/30/20`, false)
    const value = fallback(false)
    cache = { at: Date.now(), value }
    return value
  }
}
