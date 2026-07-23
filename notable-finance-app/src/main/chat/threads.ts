import { randomUUID } from 'node:crypto'
import { getSqlite } from '../db'
import type { ChatMessageDto, ChatMessageRole, ChatThreadDto } from '../../shared/finance.types'

type ThreadRow = {
  id: string
  title: string
  credential_id: string | null
  model_id: string | null
  overlay: string
  created_at: number
  updated_at: number
}

type MessageRow = {
  id: string
  thread_id: string
  role: string
  content: string
  payload_json: string | null
  created_at: number
}

function mapThread(row: ThreadRow): ChatThreadDto {
  return {
    id: row.id,
    title: row.title,
    credentialId: row.credential_id,
    modelId: row.model_id,
    overlay: row.overlay,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapMessage(row: MessageRow): ChatMessageDto {
  return {
    id: row.id,
    threadId: row.thread_id,
    role: row.role as ChatMessageRole,
    content: row.content,
    payloadJson: row.payload_json,
    createdAt: row.created_at
  }
}

export function listThreads(): ChatThreadDto[] {
  const rows = getSqlite()
    .prepare(
      `SELECT id, title, credential_id, model_id, overlay, created_at, updated_at
       FROM chat_threads ORDER BY updated_at DESC`
    )
    .all() as ThreadRow[]
  return rows.map(mapThread)
}

export function getThread(id: string): ChatThreadDto | null {
  const row = getSqlite()
    .prepare(
      `SELECT id, title, credential_id, model_id, overlay, created_at, updated_at
       FROM chat_threads WHERE id = ?`
    )
    .get(id) as ThreadRow | undefined
  return row ? mapThread(row) : null
}

export function createThread(input?: {
  title?: string
  credentialId?: string | null
  modelId?: string | null
  overlay?: string
}): ChatThreadDto {
  const id = randomUUID()
  const now = Date.now()
  getSqlite()
    .prepare(
      `INSERT INTO chat_threads (id, title, credential_id, model_id, overlay, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      input?.title?.trim() || 'New chat',
      input?.credentialId ?? null,
      input?.modelId ?? null,
      input?.overlay?.trim() || 'default',
      now,
      now
    )
  return getThread(id)!
}

export function updateThread(
  id: string,
  patch: {
    title?: string
    credentialId?: string | null
    modelId?: string | null
    overlay?: string
  }
): ChatThreadDto {
  const existing = getThread(id)
  if (!existing) throw new Error('Thread not found')
  const title = patch.title !== undefined ? patch.title.trim() || existing.title : existing.title
  const credentialId =
    patch.credentialId !== undefined ? patch.credentialId : existing.credentialId
  const modelId = patch.modelId !== undefined ? patch.modelId : existing.modelId
  const overlay = patch.overlay !== undefined ? patch.overlay.trim() || 'default' : existing.overlay
  const now = Date.now()
  getSqlite()
    .prepare(
      `UPDATE chat_threads
       SET title = ?, credential_id = ?, model_id = ?, overlay = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(title, credentialId, modelId, overlay, now, id)
  return getThread(id)!
}

export function touchThread(id: string): void {
  getSqlite()
    .prepare(`UPDATE chat_threads SET updated_at = ? WHERE id = ?`)
    .run(Date.now(), id)
}

export function deleteThread(id: string): void {
  const db = getSqlite()
  db.prepare(`DELETE FROM chat_messages WHERE thread_id = ?`).run(id)
  db.prepare(`DELETE FROM chat_threads WHERE id = ?`).run(id)
}

export function deleteAllThreads(): void {
  const db = getSqlite()
  db.prepare(`DELETE FROM chat_messages`).run()
  db.prepare(`DELETE FROM chat_threads`).run()
}

export function listMessages(threadId: string): ChatMessageDto[] {
  const rows = getSqlite()
    .prepare(
      `SELECT id, thread_id, role, content, payload_json, created_at
       FROM chat_messages WHERE thread_id = ? ORDER BY created_at ASC`
    )
    .all(threadId) as MessageRow[]
  return rows.map(mapMessage)
}

export function addMessage(
  threadId: string,
  role: ChatMessageRole,
  content: string,
  payloadJson: string | null = null
): ChatMessageDto {
  if (!getThread(threadId)) throw new Error('Thread not found')
  const id = randomUUID()
  const now = Date.now()
  getSqlite()
    .prepare(
      `INSERT INTO chat_messages (id, thread_id, role, content, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, threadId, role, content, payloadJson, now)
  touchThread(threadId)
  return {
    id,
    threadId,
    role,
    content,
    payloadJson,
    createdAt: now
  }
}

/** Auto-title from first user message if still "New chat". */
export function maybeSetTitleFromUserMessage(threadId: string, userText: string): void {
  const thread = getThread(threadId)
  if (!thread || thread.title !== 'New chat') return
  const title = userText.trim().replace(/\s+/g, ' ').slice(0, 60) || 'New chat'
  updateThread(threadId, { title })
}
