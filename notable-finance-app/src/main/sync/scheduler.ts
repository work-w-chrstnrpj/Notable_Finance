// Auto-sync scheduler (Phase 4.3). In 'auto' mode a pass runs every intervalSeconds,
// but only when connected, mapped, online, and not already running. Manual mode = no timer.
import { getSyncSettings } from './settings'
import { syncStatus } from './status'
import { syncNow } from './index'

let timer: NodeJS.Timeout | null = null

async function tick(): Promise<void> {
  const s = syncStatus()
  if (!s.connected || !s.mapped || !s.online || s.running) return
  try {
    await syncNow()
  } catch {
    // Failures surface via status.lastError; the next tick retries.
  }
}

/** (Re)arm the interval timer to match current settings. Call on startup and after setMode. */
export function reschedule(): void {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  const s = getSyncSettings()
  if (s.mode === 'auto') {
    timer = setInterval(() => void tick(), s.intervalSeconds * 1000)
  }
}

export function stopScheduler(): void {
  if (timer) clearInterval(timer)
  timer = null
}
