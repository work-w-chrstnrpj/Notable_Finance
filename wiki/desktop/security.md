# Security (Desktop)

The desktop app's threat model differs from the web app: there is no server, secrets live on the user's machine, and the renderer is treated as untrusted. This document defines how secrets and process boundaries are handled.

## Secrets: the Notion token

- Entered once at onboarding; sent into main via `window.api.notion.connect(token)`.
- Stored **encrypted with Electron `safeStorage`**, backed by the OS keychain (macOS Keychain, Windows DPAPI, libsecret on Linux).
- **Never** written to SQLite, **never** logged, **never** returned to the renderer. No IPC getter exposes the token value.
- Redacted from any diagnostic output.

## Secrets: Chat API keys (Phase 6.1)

- Entered in Configure AI as **Name + API Key**; metadata (name, fingerprint) is in SQLite `chat_credentials`.
- Raw keys are **per-credential vault files** under userData, encrypted with the same `safeStorage` posture as the Notion token. Vault payload may include a non-secret OpenAI-compatible `baseUrl` (e.g. Gemini’s Google host) alongside the key.
- Renderer receives only fingerprints / names / baseUrl — never the plaintext key.
- Turning Chat off does not delete keys or history; deleting a credential removes its vault file.

## Chat: Apple Intelligence read-only (Foundation Models)

- Mac-only preference `chatPreferAppleReadOnly`. When `compatibility.check()` reports ready, ask/summarize runs in main: allow-listed **read** tools → bundled `fm-proxy` → Apple Foundation Models. **No** propose tools, **no** Approve without a named API key.
- Status reason codes (`AI_DISABLED`, `MODEL_NOT_READY`, `UNSUPPORTED_HARDWARE`, …) map to plain UI copy. Dev/CI may set `NOTABLE_FORCE_APPLE_AVAILABLE=1` to skip the real probe.
- Apple path does **not** send prompts to OpenAI; BYOK remains required for create/update; `confirmDraft` refuses when zero credentials are saved.
- Tool allowlist still has **zero** finance delete tools. Chat thread delete is conversation hygiene only.

## Dev Mode logs

- Opt-in via Settings → Developer (`devModeEnabled`). Shows **Dev Logs** in the System nav.
- Ring buffer lives **only in main-process memory** (max 500). Never written to SQLite or disk.
- Cleared when the app process exits or Dev Mode is turned off.
- IPC args are summarized with secret keys redacted (`apiKey`, `token`, etc.). Do not log Notion tokens or raw Chat API keys.

## Data at rest

- The local SQLite database and settings live under `app.getPath('userData')`.
- At-rest protection relies on **OS full-disk encryption** (FileVault / BitLocker / LUKS). SQLCipher is intentionally **not** used for now (documented decision; can be revisited if the app is distributed to shared/managed devices).

## Process isolation

- Every `BrowserWindow`: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- The renderer has **no** direct access to Node, the filesystem, SQLite, or the Notion client. It calls only the allow-listed `window.api.*` channels exposed by preload.
- The preload exposes an explicit channel allow-list — the renderer cannot invoke arbitrary IPC channels.
- All input validation happens in **main**, at the IPC boundary. The renderer is untrusted.

## Network

- Outbound network from main: Notion API (sync) and, when Chat is enabled with a BYOK key, the configured OpenAI-compatible chat endpoint (default `api.openai.com`).
- Apple Intelligence Chat path stays on-device (local `fm-proxy` / Foundation Models) — no cloud for that adapter.
- No telemetry or other third-party endpoints.
- Notion / provider API errors and payloads are not logged with secrets or raw finance dumps.

## Content & navigation

- Disable `webSecurity` bypasses; block new-window/navigation to untrusted origins (`setWindowOpenHandler` denies external navigation, opens real links in the system browser).
- A strict Content-Security-Policy for the renderer; no remote code execution.

## Logging

- Structured logs exclude the Notion token, account numbers, and record-level finance payloads.
- Errors are normalized (reusing the web app's error classes) without leaking secrets.

## Future (distribution)

- Code-signing + notarization (see [`packaging-and-release.md`](packaging-and-release.md)) also protect integrity of the shipped binary.
- Consider optional app-lock (OS biometry) and SQLCipher if the app is distributed beyond personal single-user use.

## Related

- [`onboarding-and-notion-connect.md`](onboarding-and-notion-connect.md) · [`ipc-contract.md`](ipc-contract.md) · [`desktop-architecture.md`](desktop-architecture.md)
