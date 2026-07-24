import { randomUUID } from 'node:crypto'
import { app } from 'electron'
import type { DevLogEntry, DevLogKind } from '../../shared/finance.types'
import { getUiSettings } from '../settings/ui'
import { broadcast } from '../windows'

/** Max entries retained in memory for the current process. */
export const DEV_LOG_CAPACITY = 500

const buffer: DevLogEntry[] = []

const SENSITIVE_KEY =
  /^(apiKey|api_key|token|password|secret|authorization|notionToken|key)$/i

function redactValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY.test(key)) return '[redacted]'
  if (typeof value === 'string' && value.length > 240) {
    return `${value.slice(0, 240)}…`
  }
  return value
}

/** Safe JSON-ish summary of IPC/tool args (no secrets, truncated). */
export function summarizeForDevLog(value: unknown, depth = 0): unknown {
  if (value == null) return value
  if (typeof value !== 'object') {
    if (typeof value === 'string' && value.length > 240) return `${value.slice(0, 240)}…`
    return value
  }
  if (depth >= 3) return '[truncated]'
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => summarizeForDevLog(item, depth + 1))
  }
  const out: Record<string, unknown> = {}
  let n = 0
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (n >= 24) {
      out['…'] = 'truncated'
      break
    }
    out[k] = redactValue(k, summarizeForDevLog(v, depth + 1))
    n += 1
  }
  return out
}

export function isDevModeEnabled(): boolean {
  try {
    return getUiSettings().devModeEnabled === true
  } catch {
    return false
  }
}

export function listDevLogs(limit = DEV_LOG_CAPACITY): DevLogEntry[] {
  const n = Math.min(Math.max(limit, 1), DEV_LOG_CAPACITY)
  return buffer.slice(-n)
}

export function clearDevLogs(): number {
  const n = buffer.length
  buffer.length = 0
  return n
}

export function appendDevLog(input: {
  kind: DevLogKind
  source: 'main' | 'renderer'
  action: string
  message: string
  detail?: Record<string, unknown> | null
  durationMs?: number | null
  ok?: boolean | null
}): DevLogEntry | null {
  // Chat diagnostics also go to stdout in development so provider/tool problems
  // are visible in the dev terminal without enabling Dev Mode in the UI.
  if (input.action.startsWith('chat') && !app.isPackaged) {
    console.log(
      `[chat-diag] ${input.ok === false ? 'FAIL' : 'ok'} ${input.action} :: ${input.message}`
    )
  }
  if (!isDevModeEnabled()) return null

  const entry: DevLogEntry = {
    id: randomUUID(),
    at: Date.now(),
    kind: input.kind,
    source: input.source,
    action: input.action.slice(0, 120),
    message: input.message.slice(0, 500),
    detail: input.detail ?? null,
    durationMs: input.durationMs ?? null,
    ok: input.ok ?? null
  }

  buffer.push(entry)
  if (buffer.length > DEV_LOG_CAPACITY) {
    buffer.splice(0, buffer.length - DEV_LOG_CAPACITY)
  }

  try {
    broadcast('devLogs:entry', entry)
  } catch {
    // Windows may not be ready during early boot.
  }

  return entry
}

/** Convenience for domain operations (sync, chat confirm, etc.). */
export function logDevOperation(
  action: string,
  message: string,
  detail?: Record<string, unknown> | null,
  ok: boolean | null = true
): void {
  appendDevLog({
    kind: 'operation',
    source: 'main',
    action,
    message,
    detail: detail ? (summarizeForDevLog(detail) as Record<string, unknown>) : null,
    ok
  })
}
