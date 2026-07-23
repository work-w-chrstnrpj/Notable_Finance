// UI preferences stored in app_settings (hard-delete mode, etc.).
import { getSqlite } from '../db'
import type { UiSettings } from '../../shared/finance.types'

const KEY = 'ui.settings'
const DEFAULT: UiSettings = { hardDeleteEnabled: false }

export function getUiSettings(): UiSettings {
  const row = getSqlite().prepare('SELECT value FROM app_settings WHERE key = ?').get(KEY) as
    | { value: string }
    | undefined
  if (!row?.value) return { ...DEFAULT }
  try {
    const parsed = JSON.parse(row.value) as Partial<UiSettings>
    return {
      hardDeleteEnabled: parsed.hardDeleteEnabled === true
    }
  } catch {
    return { ...DEFAULT }
  }
}

export function setUiSettings(patch: Partial<UiSettings>): UiSettings {
  const current = getUiSettings()
  const next: UiSettings = {
    hardDeleteEnabled:
      patch.hardDeleteEnabled === undefined
        ? current.hardDeleteEnabled
        : patch.hardDeleteEnabled === true
  }
  getSqlite()
    .prepare(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`
    )
    .run(KEY, JSON.stringify(next))
  return next
}
