import { randomUUID } from 'node:crypto'
import { getSqlite } from '../db'
import type { ChatCredentialDto } from '../../shared/finance.types'
import { baseUrlForProviderPreset, providerPresetFromBaseUrl, type ChatProviderId } from './models'
import {
  deleteChatApiKey,
  fingerprintApiKey,
  hasChatApiKey,
  readChatApiKey,
  readChatCredentialSecret,
  storeChatApiKey,
  storeChatCredentialSecret
} from './credentials-vault'

type CredRow = {
  id: string
  name: string
  key_fingerprint: string
  is_default: number
  created_at: number
}

function mapCred(row: CredRow): ChatCredentialDto {
  let baseUrl: string | null = null
  let providerId: string | null = null
  try {
    if (hasChatApiKey(row.id)) {
      const secret = readChatCredentialSecret(row.id)
      baseUrl = secret.baseUrl
      providerId = secret.providerId ?? providerPresetFromBaseUrl(secret.baseUrl)
    }
  } catch {
    baseUrl = null
    providerId = null
  }
  return {
    id: row.id,
    name: row.name,
    keyFingerprint: row.key_fingerprint,
    isDefault: row.is_default === 1,
    createdAt: row.created_at,
    baseUrl,
    providerId
  }
}

export function listCredentials(): ChatCredentialDto[] {
  const rows = getSqlite()
    .prepare(
      `SELECT id, name, key_fingerprint, is_default, created_at
       FROM chat_credentials ORDER BY is_default DESC, created_at ASC`
    )
    .all() as CredRow[]
  return rows.map(mapCred)
}

export function getCredential(id: string): ChatCredentialDto | null {
  const row = getSqlite()
    .prepare(
      `SELECT id, name, key_fingerprint, is_default, created_at FROM chat_credentials WHERE id = ?`
    )
    .get(id) as CredRow | undefined
  return row ? mapCred(row) : null
}

export function getDefaultCredentialId(): string | null {
  const row = getSqlite()
    .prepare(`SELECT id FROM chat_credentials WHERE is_default = 1 LIMIT 1`)
    .get() as { id: string } | undefined
  if (row) return row.id
  const first = getSqlite()
    .prepare(`SELECT id FROM chat_credentials ORDER BY created_at ASC LIMIT 1`)
    .get() as { id: string } | undefined
  return first?.id ?? null
}

export function createCredential(
  name: string,
  apiKey: string,
  opts?: { baseUrl?: string | null; providerId?: string | null }
): ChatCredentialDto {
  const trimmedName = name.trim()
  if (!trimmedName) throw new Error('Name is required')
  const id = randomUUID()
  const now = Date.now()
  const fp = fingerprintApiKey(apiKey)
  const providerId = (opts?.providerId ??
    providerPresetFromBaseUrl(opts?.baseUrl ?? null)) as ChatProviderId
  const baseUrl =
    opts?.baseUrl !== undefined
      ? opts.baseUrl
      : baseUrlForProviderPreset(providerId, null)
  storeChatCredentialSecret(id, {
    apiKey,
    baseUrl,
    providerId
  })
  const count = (
    getSqlite().prepare(`SELECT COUNT(*) AS c FROM chat_credentials`).get() as { c: number }
  ).c
  const isDefault = count === 0 ? 1 : 0
  getSqlite()
    .prepare(
      `INSERT INTO chat_credentials (id, name, key_fingerprint, is_default, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(id, trimmedName, fp, isDefault, now)
  return getCredential(id)!
}

export function updateCredential(
  id: string,
  patch: { name?: string; apiKey?: string; baseUrl?: string | null; providerId?: string | null }
): ChatCredentialDto {
  const existing = getCredential(id)
  if (!existing) throw new Error('Credential not found')
  const name = patch.name !== undefined ? patch.name.trim() : existing.name
  if (!name) throw new Error('Name is required')
  let fp = existing.keyFingerprint

  const touchingSecret =
    patch.apiKey !== undefined || patch.baseUrl !== undefined || patch.providerId !== undefined
  if (touchingSecret) {
    const nextProvider = (patch.providerId !== undefined
      ? patch.providerId
      : (existing.providerId ?? providerPresetFromBaseUrl(existing.baseUrl))) as ChatProviderId
    const nextBase =
      patch.baseUrl !== undefined
        ? patch.baseUrl
        : patch.providerId !== undefined
          ? baseUrlForProviderPreset(nextProvider, null)
          : existing.baseUrl
    if (patch.apiKey !== undefined && patch.apiKey.trim()) {
      storeChatApiKey(id, patch.apiKey, { baseUrl: nextBase, providerId: nextProvider })
      fp = fingerprintApiKey(patch.apiKey)
    } else if (hasChatApiKey(id)) {
      storeChatApiKey(id, readChatApiKey(id), { baseUrl: nextBase, providerId: nextProvider })
    } else {
      throw new Error('API key is missing for this credential')
    }
  } else if (!hasChatApiKey(id)) {
    throw new Error('API key is missing for this credential')
  }

  getSqlite()
    .prepare(`UPDATE chat_credentials SET name = ?, key_fingerprint = ? WHERE id = ?`)
    .run(name, fp, id)
  return getCredential(id)!
}

export function setDefaultCredential(id: string): ChatCredentialDto {
  if (!getCredential(id)) throw new Error('Credential not found')
  const db = getSqlite()
  db.prepare(`UPDATE chat_credentials SET is_default = 0`).run()
  db.prepare(`UPDATE chat_credentials SET is_default = 1 WHERE id = ?`).run(id)
  return getCredential(id)!
}

export function deleteCredential(id: string): void {
  if (!getCredential(id)) throw new Error('Credential not found')
  deleteChatApiKey(id)
  getSqlite().prepare(`DELETE FROM chat_credentials WHERE id = ?`).run(id)
  getSqlite().prepare(`UPDATE chat_threads SET credential_id = NULL WHERE credential_id = ?`).run(id)
  const def = getSqlite()
    .prepare(`SELECT id FROM chat_credentials WHERE is_default = 1 LIMIT 1`)
    .get() as { id: string } | undefined
  if (!def) {
    const first = getSqlite()
      .prepare(`SELECT id FROM chat_credentials ORDER BY created_at ASC LIMIT 1`)
      .get() as { id: string } | undefined
    if (first) {
      getSqlite().prepare(`UPDATE chat_credentials SET is_default = 1 WHERE id = ?`).run(first.id)
    }
  }
}
