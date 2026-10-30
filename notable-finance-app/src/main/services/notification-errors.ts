import { randomUUID } from 'node:crypto'
import { getSqlite } from '../db'
import type { NotificationInbox } from '../../shared/notifications'
import { ValidationError } from '../domain/validation'
import { broadcast } from '../windows'
const KEY = 'notifications.inbox'
const empty = (): NotificationInbox => ({ errors: [], dismissedIds: [] })

export function notificationInbox(): NotificationInbox {
  const row = getSqlite().prepare('SELECT value FROM app_settings WHERE key = ?').get(KEY) as { value: string } | undefined
  if (!row) return empty()
  try {
    const value = JSON.parse(row.value) as NotificationInbox
    return { errors: Array.isArray(value.errors) ? value.errors.slice(0, 100) : [],
      dismissedIds: Array.isArray(value.dismissedIds) ? value.dismissedIds.slice(-2000) : [] }
  } catch { return empty() }
}
function save(inbox: NotificationInbox): void {
  getSqlite().prepare('INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(KEY, JSON.stringify(inbox))
}
/** Never persist IPC arguments, stack traces, provider response bodies, or credentials. */
export function safeNotificationMessage(message: string): string {
  return message.replace(/Bearer\s+\S+|(?:secret_|ntn_|sk-)[\w-]+/gi, '[redacted]')
    .replace(/https?:\/\/\S+/gi, '[service]')
    .replace(/\{[\s\S]*\}/g, '[response details omitted]')
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email]')
    .replace(/(?:\/Users\/|[A-Z]:\\)[^\n]+/g, '[local path]')
    .slice(0, 500)
}
/** Logging must never change the outcome of the operation that failed. */
export function recordNotificationError(source: string, message: string): void {
  try {
    const inbox = notificationInbox()
    const safe = safeNotificationMessage(message)
    const existing = inbox.errors.find((entry) => entry.source === source && entry.message === safe)
    const entry = existing ? { ...existing, count: existing.count + 1, createdAt: Date.now() }
      : { id: `error:${randomUUID()}`, source, message: safe, createdAt: Date.now(), count: 1 }
    inbox.errors = [entry, ...inbox.errors.filter((item) => item.id !== entry.id)].slice(0, 100)
    save(inbox)
    broadcast('notifications:changed', {})
  } catch { /* Error recording cannot block normal IPC/sync error handling. */ }
}
export function dismissNotification(id: string): NotificationInbox {
  if (typeof id !== 'string' || id.length > 200 || !/^(error|account|expense):[\w:.-]+$/.test(id)) {
    throw new ValidationError('Invalid notification ID.')
  }
  const inbox = notificationInbox()
  inbox.errors = inbox.errors.filter((entry) => entry.id !== id)
  if (!id.startsWith('error:')) inbox.dismissedIds = [...new Set([...inbox.dismissedIds, id])].slice(-2000)
  save(inbox)
  broadcast('notifications:changed', {})
  return inbox
}
