import { useEffect, useState } from "react";
import { Database, Bug, Keyboard, MessageSquare, Palette, SlidersHorizontal, UserRound } from "lucide-react";
import { useShortcuts, IS_MAC } from "@/lib/shortcuts/context";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";
import { useUiSettings } from "@/lib/ui-settings-context";
import { userInitials } from "@/lib/avatar";
import { cx } from "@/lib/finance-helpers";
import { Panel, Field, ComputedField, Badge } from "@/components/ui";
import { StatusPill } from "@/components/ui/date-range";
import {
  SettingsModalKind,
  ThemeCustomizeModal,
  NotionConfigModal,
  InterfaceManageModal,
  ProfileManageModal,
  AiChatConfigModal,
} from "@/components/pages/settings-modals";
import type { SchemaHealth } from "@/types/finance";

// Desktop settings — profile + interface/theme/Notion/AI/Dev. No cloud account management.

function SettingsPage({
  schemaHealth,
  onSchemaVerify,
  showFab,
  onShowFabChange,
}: {
  schemaHealth: SchemaHealth;
  onSchemaVerify: () => void;
  showFab: boolean;
  onShowFabChange: (next: boolean) => void;
}) {
  const [modal, setModal] = useState<SettingsModalKind>(null);
  useTheme();
  const { user } = useAuth();
  const { chatEnabled, setChatEnabled, devModeEnabled, setDevModeEnabled } = useUiSettings();
  const { openCheat } = useShortcuts();
  const initials = userInitials(user?.name, user?.email);

  return (
    <div className="page-stack">
      <Panel title="Profile">
        <div className="settings-row">
          <div className="settings-profile-preview">
            <div className="settings-profile-preview__avatar" aria-hidden="true">
              {user?.avatarDataUrl ? (
                <img src={user.avatarDataUrl} alt="" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div>
              <p className="settings-toggle__title">{user?.name ?? "Local User"}</p>
              <p className="settings-toggle__hint">
                Click{" "}
                <button
                  type="button"
                  className="settings-inline-link"
                  onClick={() => setModal("profile")}
                >
                  edit
                </button>{" "}
                to change your display name and profile photo on this device.
              </p>
            </div>
          </div>
          <button type="button" className="button" onClick={() => setModal("profile")}>
            <UserRound size={16} />
            Edit
          </button>
        </div>
      </Panel>
      <Panel title="Interface">
        <div className="settings-row">
          <div>
            <p className="settings-toggle__title">Quick actions &amp; delete</p>
            <p className="settings-toggle__hint">
              Click here to{" "}
              <button
                type="button"
                className="settings-inline-link"
                onClick={() => setModal("interface")}
              >
                manage
              </button>{" "}
              the floating quick-action button and hard-delete behavior.
            </p>
          </div>
          <button
            type="button"
            className="button"
            onClick={() => setModal("interface")}
          >
            <SlidersHorizontal size={16} />
            Manage
          </button>
        </div>
      </Panel>
      <Panel title="Keyboard shortcuts">
        <div className="settings-row">
          <div>
            <p className="settings-toggle__title">Shortcuts</p>
            <p className="settings-toggle__hint">
              Hold {IS_MAC ? "⌥ Option" : "Alt"} anywhere to reveal shortcuts on buttons and tabs, or{" "}
              <button
                type="button"
                className="settings-inline-link"
                onClick={openCheat}
              >
                view the full list
              </button>
              .
            </p>
          </div>
          <button type="button" className="button" onClick={openCheat}>
            <Keyboard size={16} />
            View shortcuts
          </button>
        </div>
      </Panel>
      <Panel title="Theme">
        <div className="settings-row">
          <div>
            <p className="settings-toggle__title">Appearance &amp; Colors</p>
            <p className="settings-toggle__hint">
              Click here to{" "}
              <button
                type="button"
                className="settings-inline-link"
                onClick={() => setModal("theme")}
              >
                customize
              </button>{" "}
              your appearance settings.
            </p>
          </div>
          <button
            type="button"
            className="button"
            onClick={() => setModal("theme")}
          >
            <Palette size={16} />
            Customize
          </button>
        </div>
      </Panel>
      <Panel title="AI / Chat">
        <div className="settings-row">
          <div>
            <p className="settings-toggle__title">Finance Copilot</p>
            <p className="settings-toggle__hint">
              Turn Chat on or off and{" "}
              <button
                type="button"
                className="settings-inline-link"
                onClick={() => setModal("ai")}
              >
                configure
              </button>{" "}
              named API keys. Chat is off by default.
            </p>
            <label
              className={cx("switch", chatEnabled && "switch--on")}
              aria-label="Enable Chat"
              style={{ marginTop: "0.75rem" }}
            >
              <input
                type="checkbox"
                checked={chatEnabled}
                onChange={(e) => void setChatEnabled(e.target.checked)}
              />
              <span className="switch__track">
                <span className="switch__thumb" />
              </span>
            </label>
          </div>
          <button type="button" className="button button--primary" onClick={() => setModal("ai")}>
            <MessageSquare size={16} />
            Configure
          </button>
        </div>
      </Panel>
      <Panel title="Developer">
        <div className="settings-row">
          <div>
            <p className="settings-toggle__title">Dev Mode</p>
            <p className="settings-toggle__hint">
              When on, shows <strong>Dev Logs</strong> in the sidebar and records clicks, IPC/API
              calls, and operations in memory. Logs are discarded when the app closes (never written
              to SQLite). Off by default.
            </p>
            <label
              className={cx("switch", devModeEnabled && "switch--on")}
              aria-label="Enable Dev Mode"
              style={{ marginTop: "0.75rem" }}
            >
              <input
                type="checkbox"
                checked={devModeEnabled}
                onChange={(e) => void setDevModeEnabled(e.target.checked)}
              />
              <span className="switch__track">
                <span className="switch__thumb" />
              </span>
            </label>
          </div>
          <span className="settings-toggle__hint" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Bug size={16} />
            {devModeEnabled ? "Logging" : "Idle"}
          </span>
        </div>
      </Panel>
      <section className="two-column">
        <Panel title="Local Data" action={<Badge tone="green">This device</Badge>}>
          <div className="form-grid form-grid--single">
            <ComputedField label="Storage" value="Local SQLite (app data folder)" />
            <ComputedField label="Works offline" value="Yes — Notion is a synced mirror" />
            <ComputedField label="Token Storage" value="OS keychain (encrypted, local only)" />
          </div>
        </Panel>
        <Panel title="Schema" action={<StatusPill syncState="idle" schemaHealth={schemaHealth} />}>
          <div className="form-grid form-grid--single">
            <Field label="Data Source">
              <input value="Local SQLite + Notion sync" readOnly />
            </Field>
            <ComputedField label="Database Mapping" value="Per-workspace Notion configuration" />
            <button type="button" className="button button--primary" onClick={onSchemaVerify}>
              <Database size={16} />
              Verify Schema
            </button>
          </div>
        </Panel>
      </section>

      <Panel title="Notion Configuration">
        <div className="settings-row">
          <p>Your Notion integration token is stored encrypted in the OS keychain; database IDs are stored locally.</p>
          <button type="button" className="button button--primary" onClick={() => setModal("notion")}>
            <Database size={16} />
            Manage Configuration
          </button>
        </div>
      </Panel>

      <UpdatesPanel />

      {modal === "notion" && <NotionConfigModal onClose={() => setModal(null)} />}
      {modal === "theme" && <ThemeCustomizeModal onClose={() => setModal(null)} />}
      {modal === "interface" && (
        <InterfaceManageModal
          onClose={() => setModal(null)}
          showFab={showFab}
          onShowFabChange={onShowFabChange}
        />
      )}
      {modal === "profile" && <ProfileManageModal onClose={() => setModal(null)} />}
      {modal === "ai" && <AiChatConfigModal onClose={() => setModal(null)} />}
    </div>
  );
}


function UpdatesPanel() {
  const [checking, setChecking] = useState(false)
  const [statusText, setStatusText] = useState("")
  const [downloaded, setDownloaded] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [percent, setPercent] = useState(0)
  const [installError, setInstallError] = useState("")
  const [manualDownloadUrl, setManualDownloadUrl] = useState<string | null>(null)

  useEffect(() => {
    const unsub = window.api.on("updater:progress", (payload) => {
      const ev = payload as {
        stage: string
        percent?: number
        version?: string
        error?: string
      }
      if (ev.stage === "downloading") {
        setDownloading(true)
        setDownloaded(false)
        if (ev.percent != null) setPercent(ev.percent)
      } else if (ev.stage === "downloaded") {
        setDownloading(false)
        setDownloaded(true)
        setPercent(100)
        setStatusText(
          ev.version
            ? `Update v${ev.version} downloaded — ready to install.`
            : "Update downloaded — ready to install."
        )
      } else if (ev.stage === "error") {
        setDownloading(false)
        setStatusText(`Error: ${ev.error ?? "unknown"}`)
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    const unsub = window.api.on("updater:manual-download", (payload) => {
      const ev = payload as { releaseUrl: string; version?: string }
      setManualDownloadUrl(ev.releaseUrl)
      setStatusText(
        ev.version
          ? `Auto-update unavailable for v${ev.version} on this platform — download manually.`
          : "Auto-update unavailable — download the latest release manually."
      )
    })
    return unsub
  }, [])

  const handleCheck = async () => {
    setChecking(true)
    setInstallError("")
    setManualDownloadUrl(null)
    setStatusText("Checking for updates…")
    try {
      const res = await window.api.updater.check()
      if (!res.ok) {
        setStatusText(`Error: ${res.error ?? "unknown"}`)
        return
      }
      if (res.data.updateAvailable) {
        setStatusText(
          `Update v${res.data.version} available — downloading in background.`
        )
      } else {
        setStatusText("You have the latest version.")
      }
    } catch (err) {
      setStatusText(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setChecking(false)
    }
  }

  const handleInstall = async () => {
    setInstallError("")
    try {
      await window.api.updater.install()
    } catch (err) {
      setInstallError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <Panel title="Updates">
      <div className="settings-row">
        <div style={{ flex: 1 }}>
          <p className="settings-toggle__title">App version</p>
          <p className="settings-toggle__hint">
            {__APP_VERSION__} &mdash;
            {" "}auto-update downloads releases from GitHub.
          </p>
          {statusText && (
            <p className="settings-toggle__hint" style={{ marginTop: "0.5rem" }}>
              {statusText}
            </p>
          )}
          {downloading && (
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{
                height: 6,
                borderRadius: 3,
                background: "var(--color-border, #e5e5e5)",
                overflow: "hidden",
                width: "100%",
                maxWidth: 300,
              }}>
                <div style={{
                  height: "100%",
                  width: `${percent}%`,
                  background: "var(--color-primary, #3b82f6)",
                  borderRadius: 3,
                  transition: "width 0.3s ease",
                }} />
              </div>
              <p className="settings-toggle__hint" style={{ marginTop: "0.25rem" }}>
                {percent}% downloaded
              </p>
            </div>
          )}
          {installError && (
            <p className="settings-toggle__hint" style={{ marginTop: "0.5rem", color: "var(--color-error, #ef4444)" }}>
              {installError}
            </p>
          )}
          {manualDownloadUrl && (
            <p className="settings-toggle__hint" style={{ marginTop: "0.5rem" }}>
              <a href={manualDownloadUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary, #3b82f6)" }}>
                Download latest release manually →
              </a>
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
          <button
            type="button"
            className="button"
            onClick={handleCheck}
            disabled={checking}
          >
            {checking ? "Checking…" : "Check for Updates"}
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={handleInstall}
            disabled={!downloaded}
          >
            Install Now
          </button>
        </div>
      </div>
    </Panel>
  )
}

export { SettingsPage };
