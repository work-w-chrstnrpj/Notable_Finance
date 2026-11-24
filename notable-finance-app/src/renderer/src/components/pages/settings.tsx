import { useEffect, useState, type ReactNode } from "react";
import { SavedBudgetsSettings } from "./monitoring-budgets";
import { SavedBudgetsMirrorSettings } from "./saved-budgets-mirror";
import { Bell, Database, Bug, Download, Keyboard, MessageSquare, Palette, SlidersHorizontal, Upload, UserRound } from "lucide-react";
import { useShortcuts, IS_MAC } from "@/lib/shortcuts/context";
import { useTheme } from "@/lib/theme-context";
import { useAuth } from "@/lib/auth-context";
import { useUiSettings } from "@/lib/ui-settings-context";
import { userInitials } from "@/lib/avatar";
import { cx } from "@/lib/finance-helpers";
import { Panel, Field, ComputedField, Badge } from "@/components/ui";
import { ConfirmModal } from "@/components/ui/form-modals";
import { StatusPill } from "@/components/ui/date-range";
import { HIDEABLE_SECTIONS, type BackupMeta } from "@shared/finance.types";
import { getSectionById } from "@/lib/finance-data";
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

type SettingsGroupId = "account" | "appearance" | "notifications" | "data" | "ai" | "app";

const SETTINGS_GROUPS: Array<{ id: SettingsGroupId; label: string; icon: typeof Bell }> = [
  { id: "account", label: "Account", icon: UserRound },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "data", label: "Notion and data", icon: Database },
  { id: "ai", label: "AI and Chat", icon: MessageSquare },
  { id: "app", label: "App", icon: SlidersHorizontal },
];

/** One setting: a title and short hint on the left, one control on the right. */
function SettingRow({
  title,
  hint,
  control,
  leading,
}: {
  title: string;
  hint?: string;
  control: ReactNode;
  leading?: ReactNode;
}) {
  return (
    <div className="settings-row">
      {leading}
      <div className="settings-row__text">
        <p className="settings-toggle__title">
          {title.replace(/&amp;/g, "&")}
        </p>
        {hint && <p className="settings-toggle__hint">{hint}</p>}
      </div>
      <div className="settings-row__control">{control}</div>
    </div>
  );
}

function SettingSwitch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className={cx("switch", checked && "switch--on", disabled && "switch--disabled")} aria-label={label}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch__track">
        <span className="switch__thumb" />
      </span>
    </label>
  );
}

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
  const [group, setGroup] = useState<SettingsGroupId>("account");
  useTheme();
  const { user } = useAuth();
  const { chatEnabled, setChatEnabled, devModeEnabled, setDevModeEnabled, settings, updateSettings } = useUiSettings();
  const { openCheat } = useShortcuts();
  const initials = userInitials(user?.name, user?.email);
  const current = SETTINGS_GROUPS.find((g) => g.id === group) ?? SETTINGS_GROUPS[0];

  return (
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="Settings groups">
        {SETTINGS_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            className="settings-nav__item"
            aria-current={g.id === group ? "page" : undefined}
            onClick={() => setGroup(g.id)}
          >
            <g.icon size={16} aria-hidden="true" />
            {g.label}
          </button>
        ))}
      </nav>
      <div className="settings-content">
        <h1 className="settings-content__title">{current.label}</h1>

        {group === "account" && (
          <Panel title="Profile">
            <SettingRow
              title={user?.name ?? "Local User"}
              hint="Your display name and profile photo on this device."
              leading={
                <div className="settings-profile-preview__avatar" aria-hidden="true">
                  {user?.avatarDataUrl ? <img src={user.avatarDataUrl} alt="" /> : <span>{initials}</span>}
                </div>
              }
              control={
                <button type="button" className="button" onClick={() => setModal("profile")}>
                  <UserRound size={16} />
                  Edit
                </button>
              }
            />
          </Panel>
        )}

        {group === "appearance" && (
          <>
            <Panel title="Theme">
              <SettingRow
                title="Appearance &amp; Colors"
                hint="Colors, fonts and how the app looks."
                control={
                  <button type="button" className="button" onClick={() => setModal("theme")}>
                    <Palette size={16} />
                    Customize
                  </button>
                }
              />
            </Panel>
            <Panel title="Interface">
              <SettingRow
                title="Quick actions &amp; delete"
                hint="Manage the floating quick-action button and hard-delete behavior."
                control={
                  <button type="button" className="button" onClick={() => setModal("interface")}>
                    <SlidersHorizontal size={16} />
                    Manage
                  </button>
                }
              />
            </Panel>
            <Panel title="Sections">
              <p className="settings-toggle__hint">
                Choose which sections appear in the sidebar. Hiding a section keeps its records and sync; it only removes it from navigation.
              </p>
              {HIDEABLE_SECTIONS.map((id) => {
                const visible = !settings.hiddenSections.includes(id);
                const label = getSectionById(id)?.label ?? id;
                return (
                  <SettingRow
                    key={id}
                    title={label}
                    control={
                      <SettingSwitch
                        checked={visible}
                        label={`Show ${label}`}
                        onChange={(checked) =>
                          void updateSettings({
                            hiddenSections: checked
                              ? settings.hiddenSections.filter((x) => x !== id)
                              : [...settings.hiddenSections, id],
                          })
                        }
                      />
                    }
                  />
                );
              })}
            </Panel>
            <Panel title="Keyboard shortcuts">
              <SettingRow
                title="Shortcuts"
                hint={`Hold ${IS_MAC ? "⌥ Option" : "Alt"} anywhere to reveal shortcuts on buttons and tabs.`}
                control={
                  <button type="button" className="button" onClick={openCheat}>
                    <Keyboard size={16} />
                    View shortcuts
                  </button>
                }
              />
            </Panel>
          </>
        )}

        {group === "notifications" && (
          <Panel title="Notifications">
            <SettingRow
              title="Workspace notifications"
              hint="Show the Notifications section: credit-account due dates, unsettled credit transactions that have reached their expected payment date, and recorded errors."
              control={
                <SettingSwitch
                  checked={settings.notificationsEnabled}
                  label="Show Notifications"
                  onChange={(checked) => void updateSettings({ notificationsEnabled: checked })}
                />
              }
            />
            <SettingRow
              title="Include tomorrow"
              hint="Remind one day ahead as well. Turn this off to see only what is due today."
              control={
                <SettingSwitch
                  checked={settings.notificationsIncludeTomorrow}
                  disabled={!settings.notificationsEnabled}
                  label="Include tomorrow in due reminders"
                  onChange={(checked) => void updateSettings({ notificationsIncludeTomorrow: checked })}
                />
              }
            />
          </Panel>
        )}

        {group === "data" && (
          <>
            <Panel title="Notion Configuration">
              <SettingRow
                title="Notion connection"
                hint="Your Notion integration token is stored encrypted in the OS keychain; database IDs are stored locally."
                control={
                  <button type="button" className="button button--primary" onClick={() => setModal("notion")}>
                    <Database size={16} />
                    Manage Configuration
                  </button>
                }
              />
            </Panel>
            <Panel title="Custom monthly budget">
              <SavedBudgetsSettings />
              <SavedBudgetsMirrorSettings onOpenNotionConfig={() => setModal("notion")} />
            </Panel>
            <BackupPanel />
            <section className="two-column">
              <Panel title="Local Data" action={<Badge tone="green">This device</Badge>}>
                <div className="form-grid form-grid--single">
                  <ComputedField label="Storage" value="Saved on this device" />
                  <ComputedField label="Works offline" value="Yes — sync with Notion when connected" />
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
          </>
        )}

        {group === "ai" && (
          <Panel title="AI / Chat">
            <SettingRow
              title="Finance Copilot"
              hint="Turn Chat on or off and add named API keys. Chat is off by default."
              control={
                <>
                  <SettingSwitch checked={chatEnabled} label="Enable Chat" onChange={(checked) => void setChatEnabled(checked)} />
                  <button type="button" className="button button--primary" onClick={() => setModal("ai")}>
                    <MessageSquare size={16} />
                    Configure
                  </button>
                </>
              }
            />
          </Panel>
        )}

        {group === "app" && (
          <>
            <UpdatesPanel />
            <Panel title="Developer">
              <SettingRow
                title="Dev Mode"
                hint="When on, shows Dev Logs in the sidebar and records clicks, IPC/API calls, and operations in memory. Logs are discarded when the app closes (never written to SQLite). Off by default."
                control={
                  <>
                    <Badge tone={devModeEnabled ? "amber" : "neutral"}>
                      <Bug size={12} aria-hidden="true" /> {devModeEnabled ? "Logging" : "Idle"}
                    </Badge>
                    <SettingSwitch
                      checked={devModeEnabled}
                      label="Enable Dev Mode"
                      onChange={(checked) => void setDevModeEnabled(checked)}
                    />
                  </>
                }
              />
            </Panel>
          </>
        )}
      </div>

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


function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function countsLabel(counts: Record<string, number>): string {
  const entries = Object.entries(counts).filter(([, c]) => c > 0);
  if (entries.length === 0) return "empty database";
  return entries.map(([table, c]) => `${table.replace(/_/g, " ")}: ${c}`).join(", ");
}

/**
 * Local backup & restore (Phase 7.2). Export writes a consistent SQLite snapshot;
 * import swaps the live file, so the window reloads afterward to re-fetch every
 * page from the restored data.
 */
function BackupPanel() {
  const [statusText, setStatusText] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    path: string;
    meta: BackupMeta | null;
  } | null>(null);
  const [importBusy, setImportBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    setStatusText("");
    try {
      const res = await window.api.backup.export();
      if (!res.ok) {
        setStatusText(`Export failed: ${res.error?.message ?? "unknown"}`);
        return;
      }
      const { path, bytes, meta } = res.data;
      setStatusText(
        `Backup saved to ${path} (${formatBytes(bytes)}) — ${countsLabel(meta.counts)}.`
      );
    } catch (err) {
      setStatusText(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setBusy(false);
    }
  };

  const handlePickImport = async () => {
    setStatusText("");
    try {
      const res = await window.api.backup.inspect();
      if (!res.ok) {
        setStatusText(`Import failed: ${res.error?.message ?? "unknown"}`);
        return;
      }
      const info = res.data;
      if (!info.valid) {
        setStatusText(`Not a valid backup: ${info.reason}`);
        return;
      }
      setPendingImport({ path: info.path, meta: info.meta });
    } catch (err) {
      setStatusText(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingImport) return;
    setImportBusy(true);
    try {
      const res = await window.api.backup.import(pendingImport.path);
      if (!res.ok) {
        setStatusText(`Import failed: ${res.error?.message ?? "unknown"}`);
        setPendingImport(null);
        return;
      }
      if (!res.data.valid) {
        setStatusText(`Import failed: ${res.data.reason}`);
        setPendingImport(null);
        return;
      }
      // Success — the live SQLite file was swapped. Reload so every page and
      // cached collection re-fetches from the restored data.
      window.location.reload();
    } catch (err) {
      setStatusText(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
      setPendingImport(null);
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <Panel title="Backup & Restore">
      <div className="settings-row">
        <div style={{ flex: 1 }}>
          <p className="settings-toggle__title">Local database backup</p>
          <p className="settings-toggle__hint">
            Export a copy of all local data (incomes, expenses, accounts, budgets, chat
            history) as a single SQLite file — works even when Notion sync is unavailable.
            Import restores that file and replaces the current local data; the window
            reloads afterward. Chat API keys stay in the OS keychain and are never exported.
          </p>
          {statusText && (
            <p className="settings-toggle__hint" style={{ marginTop: "0.5rem" }}>
              {statusText}
            </p>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
          <button
            type="button"
            className="button"
            onClick={() => void handleExport()}
            disabled={busy || importBusy}
          >
            <Download size={16} />
            {busy ? "Exporting…" : "Export Backup"}
          </button>
          <button
            type="button"
            className="button"
            onClick={() => void handlePickImport()}
            disabled={busy || importBusy}
          >
            <Upload size={16} />
            Import Backup…
          </button>
        </div>
      </div>

      {pendingImport && (
        <ConfirmModal
          title="Import backup?"
          message={`This replaces ALL local finance data with the contents of: ${pendingImport.path}. ${
            pendingImport.meta
              ? `Created by v${pendingImport.meta.appVersion} on ${new Date(
                  pendingImport.meta.exportedAt
                ).toLocaleString()} (${countsLabel(pendingImport.meta.counts)}). `
              : ""
          }Unsynced changes not present in the backup will be lost. Sync to Notion first if you have changes you need to keep.`}
          confirmLabel="Import & Reload"
          danger
          busy={importBusy}
          onConfirm={() => void handleConfirmImport()}
          onCancel={() => setPendingImport(null)}
        />
      )}
    </Panel>
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
