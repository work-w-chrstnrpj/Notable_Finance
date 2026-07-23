// Per-credential API key vault (Phase 6.1). Keys never go in SQLite — same posture as Notion token.
// Payload v1: encrypted JSON `{ v:1, apiKey, baseUrl?, providerId? }` (legacy plaintext key still decrypts).
import { app, safeStorage } from 'electron'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export type ChatCredentialSecret = {
  apiKey: string
  /** OpenAI-compatible chat completions base URL, or null for default OpenAI. */
  baseUrl: string | null
  /** Catalog provider id (gemini, groq, …). */
  providerId: string | null
}

function vaultDir(): string {
  const dir = join(app.getPath('userData'), 'chat-credentials')
  mkdirSync(dir, { recursive: true })
  return dir
}

function keyPath(id: string): string {
  return join(vaultDir(), `${id}.enc`)
}

function encodePayload(secret: ChatCredentialSecret): string {
  return JSON.stringify({
    v: 1,
    apiKey: secret.apiKey,
    baseUrl: secret.baseUrl && secret.baseUrl.trim() ? secret.baseUrl.trim().replace(/\/$/, '') : null,
    providerId: secret.providerId && secret.providerId.trim() ? secret.providerId.trim() : null
  })
}

function decodePayload(raw: string): ChatCredentialSecret {
  const trimmed = raw.trim()
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as {
        apiKey?: unknown
        baseUrl?: unknown
        providerId?: unknown
      }
      if (typeof parsed.apiKey === 'string' && parsed.apiKey.trim()) {
        const baseUrl =
          typeof parsed.baseUrl === 'string' && parsed.baseUrl.trim()
            ? parsed.baseUrl.trim().replace(/\/$/, '')
            : null
        const providerId =
          typeof parsed.providerId === 'string' && parsed.providerId.trim()
            ? parsed.providerId.trim()
            : null
        return { apiKey: parsed.apiKey.trim(), baseUrl, providerId }
      }
    } catch {
      // Fall through to legacy raw key.
    }
  }
  return { apiKey: trimmed, baseUrl: null, providerId: null }
}

export function storeChatCredentialSecret(id: string, secret: ChatCredentialSecret): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS keychain encryption is not available on this system')
  }
  const apiKey = secret.apiKey.trim()
  if (!apiKey) throw new Error('API key is required')
  writeFileSync(
    keyPath(id),
    safeStorage.encryptString(
      encodePayload({
        apiKey,
        baseUrl: secret.baseUrl,
        providerId: secret.providerId
      })
    ),
    { mode: 0o600 }
  )
}

export function storeChatApiKey(
  id: string,
  apiKey: string,
  opts?: { baseUrl?: string | null; providerId?: string | null }
): void {
  const existing = hasChatApiKey(id) ? readChatCredentialSecret(id) : null
  storeChatCredentialSecret(id, {
    apiKey,
    baseUrl: opts?.baseUrl !== undefined ? opts.baseUrl : (existing?.baseUrl ?? null),
    providerId: opts?.providerId !== undefined ? opts.providerId : (existing?.providerId ?? null)
  })
}

export function readChatCredentialSecret(id: string): ChatCredentialSecret {
  const path = keyPath(id)
  if (!existsSync(path)) throw new Error('API key is not configured for this credential')
  return decodePayload(safeStorage.decryptString(readFileSync(path)))
}

export function readChatApiKey(id: string): string {
  return readChatCredentialSecret(id).apiKey
}

export function readChatBaseUrl(id: string): string | null {
  return readChatCredentialSecret(id).baseUrl
}

export function readChatProviderId(id: string): string | null {
  return readChatCredentialSecret(id).providerId
}

export function hasChatApiKey(id: string): boolean {
  return existsSync(keyPath(id))
}

export function deleteChatApiKey(id: string): void {
  rmSync(keyPath(id), { force: true })
}

export function fingerprintApiKey(apiKey: string): string {
  const t = apiKey.trim()
  if (t.length <= 4) return '••••'
  return `••••${t.slice(-4)}`
}
