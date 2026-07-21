// Sync settings (Phase 4.3): manual vs auto, and the auto interval. Stored in app_settings.
import { getSqlite } from '../db'
import type { SyncSettings } from '../../shared/finance.types'

const KEY = 'sync.settings'
const DEFAULT: SyncSettings = { mode: 'manual', intervalSeconds: 300 }
const MIN_INTERVAL = 30

export function getSyncSettings(): SyncSettings {
  const row = getSqlite().prepare('SELECT value FROM app_settings WHERE key = ?').get(KEY) as
    | { value: string }
    | undefined
  if (!row?.value) return { ...DEFAULT }
  try {
    const parsed = JSON.parse(row.value) as Partial<SyncSettings>
    return {
      mode: parsed.mode === 'auto' ? 'auto' : 'manual',
      intervalSeconds: Math.max(MIN_INTERVAL, Number(parsed.intervalSeconds) || DEFAULT.intervalSeconds)
    }
  } catch {
    return { ...DEFAULT }
  }
}

export function setSyncSettings(patch: Partial<SyncSettings>): SyncSettings {
  const next = { ...getSyncSettings(), ...patch }
  next.mode = next.mode === 'auto' ? 'auto' : 'manual'
  next.intervalSeconds = Math.max(MIN_INTERVAL, Number(next.intervalSeconds) || DEFAULT.intervalSeconds)
  getSqlite()
    .prepare(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(KEY, JSON.stringify(next))
  return next
}
