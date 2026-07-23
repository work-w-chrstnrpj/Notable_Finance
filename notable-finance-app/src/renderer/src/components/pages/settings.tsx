import { useState } from "react";
import { Database, Bug, MessageSquare, Palette, SlidersHorizontal, UserRound } from "lucide-react";
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

export { SettingsPage };
