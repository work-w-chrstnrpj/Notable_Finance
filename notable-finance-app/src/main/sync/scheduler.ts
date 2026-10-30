// Auto-sync scheduler (Phase 4.3). In 'auto' mode a pass runs every intervalSeconds,
// but only when connected, mapped, online, and not already running. Manual mode = no timer.
import { getSyncSettings } from './settings'
import { syncStatus } from './status'
import { syncNow } from './index'
import { recordNotificationError } from '../services/notification-errors'

let timer: NodeJS.Timeout | null = null

async function tick(): Promise<void> {
  const s = syncStatus()
  if (!s.connected || !s.mapped || !s.online || s.running) return
  try {
    const out = await syncNow()
    for (const message of [...out.pull.errors, ...out.push.errors].slice(0, 5)) {
      recordNotificationError('sync:auto', message)
    }
  } catch (error) {
    // Failures surface via status.lastError and Notifications; the next tick retries.
    recordNotificationError('sync:auto', error instanceof Error ? error.message : String(error))
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
