# Packaging & Release

How the desktop app is built, packaged, and distributed. Distribution is **personal for now** (your own Macs), designed so signing/notarization and auto-update can be added when the app is shared.

## Targets

- **macOS** (Apple Silicon + Intel — universal build), **Linux**, **Windows**.
- Tooling: `electron-vite` (build) + `electron-builder` (package/installers).

## Native modules

- `better-sqlite3` is a native addon and must be built per platform/arch.
- Use `electron-builder`'s rebuild (or `@electron/rebuild`) so the SQLite binary matches the packaged Electron ABI.
- macOS universal builds require the native module available for both arm64 and x64.

## Apple Intelligence helper (`fm-proxy`)

- Dependency: `apple-local-llm` (main process only). Bundled binary: `node_modules/apple-local-llm/bin/fm-proxy`.
- `electron-builder.yml` unpacks `**/apple-local-llm/bin/**` via `asarUnpack` so Electron can spawn the helper (and may also copy `fm-proxy` under `extraResources`).
- On quit, main calls `client.shutdown()` so the helper process exits.
- Gatekeeper / notarization later must allow spawning the helper; Apple Silicon + Apple Intelligence OS settings are required at runtime (see Chat design).

## Build outputs

| Platform | Artifact |
| --- | --- |
| macOS | `.dmg` / `.zip` (universal) |
| Windows | NSIS `.exe` installer |
| Linux | `AppImage` (and optionally `.deb`) |

## Current stage: personal / unsigned

- For your own machines you can run **unsigned** builds (on macOS, right-click → Open to pass Gatekeeper once).
- No Apple Developer ID, notarization, or update server required at this stage.

## Future: distribution (when shared)

Documented now so it isn't a surprise later:

- **macOS:** Apple Developer ID signing + **notarization** (else Gatekeeper blocks other users). Hardened runtime + entitlements for the keychain.
- **Windows:** Authenticode code-signing certificate to avoid SmartScreen warnings.
- **Auto-update:** `electron-updater` against a release feed (e.g. GitHub Releases or an S3-compatible bucket). Requires signed builds.

## App configuration handling

- The **Notion token is not bundled** — it is entered per user at onboarding and stored in the OS keychain. See [`security.md`](security.md).
- No secrets are committed or shipped in the build.
- Local database and settings live in the OS app-data directory (`app.getPath('userData')`).

## Versioning & release notes

- Semantic versioning; a `CHANGELOG.md` in `notable-finance-app/`.
- Migrations run on launch and must be additive/safe (the local DB holds all history) — see [`local-data-schema.md`](local-data-schema.md#migrations).

## Related

- [`desktop-architecture.md`](desktop-architecture.md) · [`security.md`](security.md) · [`desktop-testing-strategy.md`](desktop-testing-strategy.md)
