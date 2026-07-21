# Security (Desktop)

The desktop app's threat model differs from the web app: there is no server, secrets live on the user's machine, and the renderer is treated as untrusted. This document defines how secrets and process boundaries are handled.

## Secrets: the Notion token

- Entered once at onboarding; sent into main via `window.api.notion.connect(token)`.
- Stored **encrypted with Electron `safeStorage`**, backed by the OS keychain (macOS Keychain, Windows DPAPI, libsecret on Linux).
- **Never** written to SQLite, **never** logged, **never** returned to the renderer. No IPC getter exposes the token value.
- Redacted from any diagnostic output.

## Data at rest

- The local SQLite database and settings live under `app.getPath('userData')`.
- At-rest protection relies on **OS full-disk encryption** (FileVault / BitLocker / LUKS). SQLCipher is intentionally **not** used for now (documented decision; can be revisited if the app is distributed to shared/managed devices).

## Process isolation

- Every `BrowserWindow`: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- The renderer has **no** direct access to Node, the filesystem, SQLite, or the Notion client. It calls only the allow-listed `window.api.*` channels exposed by preload.
- The preload exposes an explicit channel allow-list — the renderer cannot invoke arbitrary IPC channels.
- All input validation happens in **main**, at the IPC boundary. The renderer is untrusted.

## Network

- The only outbound network calls are to the Notion API from the main process.
- No telemetry or third-party endpoints.
- Notion API errors and payloads are not logged with sensitive finance values.

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
