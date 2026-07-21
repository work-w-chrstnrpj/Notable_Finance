// Notion token storage (Phase 2.1). The token is encrypted with Electron safeStorage
// (OS keychain-backed: macOS Keychain / Windows DPAPI / libsecret) and kept as a file in
// userData. It is NEVER written to SQLite, never logged, and never returned to the
// renderer — no IPC getter exposes it (wiki/desktop/security.md).
import { app, safeStorage } from 'electron'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

function tokenPath(): string {
  return join(app.getPath('userData'), 'notion-token.enc')
}

export function storeToken(token: string): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS keychain encryption is not available on this system')
  }
  const encrypted = safeStorage.encryptString(token.trim())
  writeFileSync(tokenPath(), encrypted, { mode: 0o600 })
}

export function hasToken(): boolean {
  return existsSync(tokenPath())
}

/** Decrypt the token for main-process use only. Throws if absent/undecryptable. */
export function readToken(): string {
  if (!hasToken()) throw new Error('Notion is not connected')
  return safeStorage.decryptString(readFileSync(tokenPath()))
}

export function deleteToken(): void {
  rmSync(tokenPath(), { force: true })
}
