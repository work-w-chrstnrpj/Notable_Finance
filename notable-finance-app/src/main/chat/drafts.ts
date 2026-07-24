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
  display: string | null
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
      : null,
    display: row.display ? parseJson<ChatDraftDto['display']>(row.display, null) : null
  }
}

function persist(draft: ChatDraftDto): void {
  const db = safeSqlite()
  if (!db) return
  try {
    db.prepare(
      `INSERT INTO chat_drafts
         (id, thread_id, resource, action, kind, status, summary,
          missing_required, warnings, payload, target_ids, computed_preview, display, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         status = excluded.status,
         summary = excluded.summary,
         missing_required = excluded.missing_required,
         warnings = excluded.warnings,
         payload = excluded.payload,
         target_ids = excluded.target_ids,
         computed_preview = excluded.computed_preview,
         display = excluded.display`
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
      draft.display != null ? JSON.stringify(draft.display) : null,
      draft.createdAt
    )
  } catch {
    // Best-effort: never fail a propose/approve because persistence is unavailable
    // (e.g. an older DB where migration 0006 hasn't run yet — resolves on restart).
  }
}

/** A confirm card older than this is stale — never resurrect it on restart. */
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000

function isPending(d: ChatDraftDto): boolean {
  return d.status === 'needs_input' || d.status === 'ready'
}

/**
 * Collapse pending drafts to the newest one per (thread, kind) and retire
 * anything past the TTL. Persistence means a backlog of proposals from earlier
 * sessions would otherwise all come back as confirm cards at once.
 */
function reconcilePending(): void {
  const newestByGroup = new Map<string, ChatDraftDto>()
  const now = Date.now()

  for (const draft of drafts.values()) {
    if (!isPending(draft)) continue
    if (now - draft.createdAt > DRAFT_TTL_MS) {
      const expired: ChatDraftDto = { ...draft, status: 'cancelled' }
      drafts.set(draft.id, expired)
      persist(expired)
      continue
    }
    const group = `${draft.threadId}::${draft.kind}`
    const incumbent = newestByGroup.get(group)
    if (!incumbent) {
      newestByGroup.set(group, draft)
      continue
    }
    const loser = draft.createdAt >= incumbent.createdAt ? incumbent : draft
    const winner = draft.createdAt >= incumbent.createdAt ? draft : incumbent
    const superseded: ChatDraftDto = { ...loser, status: 'cancelled' }
    drafts.set(loser.id, superseded)
    persist(superseded)
    newestByGroup.set(group, winner)
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
    // Retire the backlog so a restart shows one card per kind, not a pile.
    reconcilePending()
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
    computedPreview: input.computedPreview ?? null,
    display: input.display ?? null
  }

  // Supersede earlier pending drafts of the same kind in this thread. Without
  // this, a model that proposes repeatedly (or across retries) leaves a pile of
  // stale confirm cards, since listDrafts returns every pending draft.
  for (const [id, existing] of drafts) {
    if (
      existing.threadId === draft.threadId &&
      existing.kind === draft.kind &&
      (existing.status === 'needs_input' || existing.status === 'ready')
    ) {
      const superseded: ChatDraftDto = { ...existing, status: 'cancelled' }
      drafts.set(id, superseded)
      persist(superseded)
    }
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
  const now = Date.now()
  const pending = [...drafts.values()]
    .filter((d) => isPending(d) && now - d.createdAt <= DRAFT_TTL_MS)
    .filter((d) => (threadId ? d.threadId === threadId : true))
    .sort((a, b) => b.createdAt - a.createdAt)

  // Newest wins per (thread, kind). Defensive: the UI must never render a pile
  // of confirm cards even if legacy rows predate supersede-on-write.
  const seen = new Set<string>()
  const out: ChatDraftDto[] = []
  for (const d of pending) {
    const group = `${d.threadId}::${d.kind}`
    if (seen.has(group)) continue
    seen.add(group)
    out.push(d)
  }
  return out
}

/** Fields a propose* validator recomputes — everything except identity. */
export type DraftSpec = Pick<
  ChatDraftDto,
  'resource' | 'action' | 'kind' | 'summary' | 'missingRequired' | 'warnings' | 'payload'
> &
  Partial<Pick<ChatDraftDto, 'targetIds' | 'computedPreview' | 'display'>>

/**
 * Replace an existing draft's computed content in place (same id) after the user
 * edits fields on the confirm card. Status is re-derived from missingRequired so
 * Approve unlocks the moment the record is complete.
 */
export function updateDraftSpec(id: string, spec: DraftSpec): ChatDraftDto {
  hydrate()
  const existing = drafts.get(id)
  if (!existing) throw new Error('Draft not found')
  const next: ChatDraftDto = {
    ...existing,
    resource: spec.resource,
    action: spec.action,
    kind: spec.kind,
    summary: spec.summary,
    missingRequired: spec.missingRequired,
    warnings: spec.warnings,
    payload: spec.payload,
    targetIds: spec.targetIds ?? existing.targetIds,
    computedPreview: spec.computedPreview ?? null,
    display: spec.display ?? null,
    status: spec.missingRequired.length > 0 ? 'needs_input' : 'ready'
  }
  drafts.set(id, next)
  persist(next)
  return next
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
