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

## Current stage: personal / unsigned (auto-update ready)

- For your own machines you can run **unsigned** builds (on macOS, right-click → Open to pass Gatekeeper once).
- No Apple Developer ID or notarization required at this stage.
- **Auto-update works** via GitHub Releases (see below).

## Future: signed distribution (when shared)

Documented now so it isn't a surprise later:

- **macOS:** Apple Developer ID signing + **notarization** (else Gatekeeper blocks other users). Hardened runtime + entitlements for the keychain.
- **Windows:** Authenticode code-signing certificate to avoid SmartScreen warnings.

## Auto-update workflow

Auto-update is implemented and ready for use — see `src/main/updater/index.ts`.

- **Provider:** GitHub Releases (no server needed).
- **Library:** `electron-updater`.
- **Config:** `electron-builder.yml` → `publish` section (owner + repo).
- **Trigger:** On startup (~3s delay) + manual "Check for Updates" button (Settings → Updates).
- **Install flow:**
  1. App starts → `initUpdater()` checks GitHub for a newer version.
  2. If found, the update downloads in the background silently.
  3. User sees "Install Now" in **Settings → Updates** once the download finishes.
  4. User clicks it → `autoUpdater.quitAndInstall()` → app quits, update applies, app relaunches.
- **Platform notes (unsigned):**
  - **Windows (NSIS):** works fully — silent installer.
  - **macOS (zip):** requires the app to have been opened via right-click → Open once. After that, zip-based replacement works.
  - **Linux (AppImage):** works if launched from a writable location.

## How to release a new version

Do this from your dev machine (and eventually from CI).

### 1. Bump the version

```bash
# In notable-finance-app/
npm version patch   # 0.1.0 → 0.1.1  (bug fixes)
# or
npm version minor   # 0.1.0 → 0.2.0  (new features)
```

This updates `package.json`, `package-lock.json`, and creates a git commit + `vX.Y.Z` tag automatically.

### 2. Push the tag

```bash
git push origin --tags
```

This pushes the tag (e.g. `v0.1.1`) to GitHub — required for the GitHub Release later.

### 3. Build + package for your current platform

```bash
npm run pack
```

Runs `electron-vite build` (compiles TS into `out/`) then `electron-builder --dir` (unpacked app in `dist/`).

To produce the actual installer artifacts on your current machine:

```bash
# macOS only
npx electron-builder --mac

# Windows only (run on Windows)
npx electron-builder --win

# Both (if on macOS with cross-compile setup)
npx electron-builder --mac --win --linux
```

Output lands in `dist/`:

| Platform | Artifacts to upload |
|----------|---------------------|
| macOS | `Notable Finance-X.Y.Z.dmg`, `Notable Finance-X.Y.Z-mac.zip`, **`latest-mac.yml`** |
| Windows | `Notable Finance Setup X.Y.Z.exe`, **`latest.yml`** |
| Linux | `Notable Finance-X.Y.Z.AppImage`, **`latest-linux.yml`** |

> The `latest-*.yml` files are **required** — electron-updater reads them to know which version is newest.

### 4. Create a GitHub Release

1. Go to **your repo → Releases**: `https://github.com/work-w-chrstnrpj/Notable_Finance/releases`
2. Click **Draft a new release**
3. Choose the tag you just pushed (e.g. `v0.1.1`)
4. Write release notes describing what changed
5. **Upload all artifacts from `dist/`** — every `.dmg`, `.exe`, `.AppImage`, **and** every `latest-*.yml` file
6. Click **Publish release**

### 5. Users get the update automatically

Once the release is live, every running copy of the app will:

1. Check for updates within 3 seconds of launch.
2. Find the new version, download it in the background.
3. Show **Install Now** in **Settings → Updates**.
4. Install and restart on click.

> **Future improvement:** automate steps 3–4 with a GitHub Actions workflow that builds on all three platforms and uploads to the Release. See [`.github/workflows/release.yml`] (placeholder).

## App configuration handling

- The **Notion token is not bundled** — it is entered per user at onboarding and stored in the OS keychain. See [`security.md`](security.md).
- No secrets are committed or shipped in the build.
- Local database and settings live in the OS app-data directory (`app.getPath('userData')`).

## Versioning & release notes

- Semantic versioning; a `CHANGELOG.md` in `notable-finance-app/`.
- Migrations run on launch and must be additive/safe (the local DB holds all history) — see [`local-data-schema.md`](local-data-schema.md#migrations).

## Related

- [`desktop-architecture.md`](desktop-architecture.md) · [`security.md`](security.md) · [`desktop-testing-strategy.md`](desktop-testing-strategy.md)
