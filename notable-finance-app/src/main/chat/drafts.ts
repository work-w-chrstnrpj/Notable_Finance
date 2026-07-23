import { randomUUID } from 'node:crypto'
import type { ChatDraftDto } from '../../shared/finance.types'
import { getSqlite } from '../db'

/**
 * In-memory index is the synchronous working store (also the only store in unit
 * tests / early boot, before SQLite is initialised). Every mutation is mirrored
 * best-effort to the `chat_drafts` table so a proposed create/update survives an
 * app restart; on first access after a restart we hydrate pending rows back in.
 */
const drafts = new Map<string, ChatDraftDto>()
let hydrated = false

type DraftRow = {
  id: string
  thread_id: string
  resource: string
  action: string
  kind: string
  status: string
  summary: string
  missing_required: string
  warnings: string
  payload: string
  target_ids: string | null
  computed_preview: string | null
  created_at: number
}

/** SQLite handle if the DB is up; null in tests / before initDatabase(). */
function safeSqlite() {
  try {
    return getSqlite()
  } catch {
    return null
  }
}

function parseJson<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function rowToDraft(row: DraftRow): ChatDraftDto {
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status as ChatDraftDto['status'],
    threadId: row.thread_id,
    resource: row.resource as ChatDraftDto['resource'],
    action: row.action as ChatDraftDto['action'],
    kind: row.kind,
    summary: row.summary,
    missingRequired: parseJson<string[]>(row.missing_required, []),
    warnings: parseJson<string[]>(row.warnings, []),
    payload: parseJson<Record<string, unknown>>(row.payload, {}),
    targetIds: row.target_ids ? parseJson<string[]>(row.target_ids, []) : undefined,
    computedPreview: row.computed_preview
      ? parseJson<ChatDraftDto['computedPreview']>(row.computed_preview, null)
      : null
  }
}

function persist(draft: ChatDraftDto): void {
  const db = safeSqlite()
  if (!db) return
  try {
    db.prepare(
      `INSERT INTO chat_drafts
         (id, thread_id, resource, action, kind, status, summary,
          missing_required, warnings, payload, target_ids, computed_preview, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         status = excluded.status,
         summary = excluded.summary,
         missing_required = excluded.missing_required,
         warnings = excluded.warnings,
         payload = excluded.payload,
         target_ids = excluded.target_ids,
         computed_preview = excluded.computed_preview`
    ).run(
      draft.id,
      draft.threadId,
      draft.resource,
      draft.action,
      draft.kind,
      draft.status,
      draft.summary,
      JSON.stringify(draft.missingRequired),
      JSON.stringify(draft.warnings),
      JSON.stringify(draft.payload),
      draft.targetIds ? JSON.stringify(draft.targetIds) : null,
      draft.computedPreview != null ? JSON.stringify(draft.computedPreview) : null,
      draft.createdAt
    )
  } catch {
    // Best-effort: never fail a propose/approve because persistence is unavailable
    // (e.g. an older DB where migration 0006 hasn't run yet — resolves on restart).
  }
}

/** Pull still-pending drafts from SQLite into the Map once per process. */
function hydrate(): void {
  if (hydrated) return
  const db = safeSqlite()
  if (!db) return // stay unhydrated until the DB exists (tests never reach here)
  hydrated = true
  try {
    const rows = db
      .prepare(
        `SELECT * FROM chat_drafts WHERE status IN ('needs_input', 'ready')
         ORDER BY created_at ASC`
      )
      .all() as DraftRow[]
    for (const row of rows) {
      if (!drafts.has(row.id)) drafts.set(row.id, rowToDraft(row))
    }
  } catch {
    // Table may not exist on a pre-0006 DB; nothing to hydrate.
  }
}

export function putDraft(
  input: Omit<ChatDraftDto, 'id' | 'createdAt' | 'status'> & {
    status?: ChatDraftDto['status']
  }
): ChatDraftDto {
  hydrate()
  const draft: ChatDraftDto = {
    id: randomUUID(),
    createdAt: Date.now(),
    status: input.status ?? (input.missingRequired.length > 0 ? 'needs_input' : 'ready'),
    threadId: input.threadId,
    resource: input.resource,
    action: input.action,
    kind: input.kind,
    summary: input.summary,
    missingRequired: input.missingRequired,
    warnings: input.warnings,
    payload: input.payload,
    targetIds: input.targetIds,
    computedPreview: input.computedPreview ?? null
  }
  drafts.set(draft.id, draft)
  persist(draft)
  return draft
}

export function getDraft(id: string): ChatDraftDto | null {
  hydrate()
  return drafts.get(id) ?? null
}

export function listDrafts(threadId?: string): ChatDraftDto[] {
  hydrate()
  const all = [...drafts.values()].filter(
    (d) => d.status === 'needs_input' || d.status === 'ready'
  )
  if (!threadId) return all.sort((a, b) => b.createdAt - a.createdAt)
  return all.filter((d) => d.threadId === threadId).sort((a, b) => b.createdAt - a.createdAt)
}

export function markDraft(id: string, status: 'applied' | 'cancelled'): ChatDraftDto {
  hydrate()
  const d = drafts.get(id)
  if (!d) throw new Error('Draft not found')
  const next = { ...d, status }
  drafts.set(id, next)
  persist(next)
  return next
}

export function updateDraftMissing(
  id: string,
  patch: Partial<Pick<ChatDraftDto, 'payload' | 'missingRequired' | 'warnings' | 'summary' | 'status'>>
): ChatDraftDto {
  hydrate()
  const d = drafts.get(id)
  if (!d) throw new Error('Draft not found')
  const missing = patch.missingRequired ?? d.missingRequired
  const next: ChatDraftDto = {
    ...d,
    ...patch,
    missingRequired: missing,
    status:
      patch.status ??
      (missing.length > 0 ? 'needs_input' : d.status === 'needs_input' ? 'ready' : d.status)
  }
  drafts.set(id, next)
  persist(next)
  return next
}
