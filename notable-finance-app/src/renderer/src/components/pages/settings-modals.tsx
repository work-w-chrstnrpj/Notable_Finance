
import { startTransition, useState, useEffect } from "react";
import { useTheme } from "@/lib/theme-context";
import { useUiSettings } from "@/lib/ui-settings-context";
import { ColorPicker } from "@/components/color-picker";
import { userNotionConfigApi } from "@/lib/api-client";
import { Field, FormSectionDivider } from "@/components/ui";
import { SettingsModal } from "@/components/ui/form-modals";
import { cx } from "@/lib/finance-helpers";
import { fileToAvatarDataUrl, userInitials } from "@/lib/avatar";
import { Database, Download, Save, Trash2, Upload } from "lucide-react";

const KNOWN_DB_ID_KEYS = [
  { key: "accounts", label: "Accounts" },
  { key: "incomeCategories", label: "Income Portfolio" },
  { key: "incomes", label: "Incomes" },
  { key: "expenseCategories", label: "Expense Categories" },
  { key: "expenses", label: "Expenses" },
  { key: "monthlyMonitoring", label: "Monthly Monitoring" },
] as const;

type SettingsModalKind = "notion" | "theme" | "interface" | "profile" | null;

function ProfileManageModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useUiSettings();
  const [displayName, setDisplayName] = useState(settings.profile.displayName);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(
    settings.profile.avatarDataUrl,
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onPickAvatar(file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      setAvatarDataUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read image.");
    }
  }

  async function onSave() {
    const name = displayName.trim() || "Local User";
    setSaving(true);
    setError(null);
    try {
      await updateSettings({
        profile: { displayName: name, avatarDataUrl },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  const initials = userInitials(displayName);

  return (
    <SettingsModal
      title="Edit Profile"
      subtitle="Name and photo are stored on this device only."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={() => void onSave()}
            disabled={saving}
          >
            Save
          </button>
        </>
      }
    >
      <div className="theme-modal-grid">
        <div className="profile-editor">
          <div className="profile-editor__avatar" aria-hidden="true">
            {avatarDataUrl ? (
              <img src={avatarDataUrl} alt="" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="profile-editor__actions">
            <label className="button">
              Change photo
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => void onPickAvatar(e.target.files?.[0] ?? null)}
              />
            </label>
            {avatarDataUrl && (
              <button
                type="button"
                className="button"
                onClick={() => setAvatarDataUrl(null)}
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
        <Field label="Display name">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
            placeholder="Local User"
            autoFocus
          />
        </Field>
        {error && <p className="form-error">{error}</p>}
      </div>
    </SettingsModal>
  );
}

function InterfaceManageModal({
  onClose,
  showFab,
  onShowFabChange,
}: {
  onClose: () => void;
  showFab: boolean;
  onShowFabChange: (next: boolean) => void;
}) {
  const { hardDeleteEnabled, setHardDeleteEnabled } = useUiSettings();

  return (
    <SettingsModal
      title="Manage Interface"
      subtitle="Control the quick-action button and delete behavior."
      onClose={onClose}
      footer={
        <button type="button" className="button button--primary" onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="theme-modal-grid">
        <div className="settings-row">
          <div>
            <p className="settings-toggle__title">Quick-action button</p>
            <p className="settings-toggle__hint">
              Show a floating button for adding income/expense and printing
              receipts or monthly insights.
            </p>
          </div>
          <label
            className={cx("switch", showFab && "switch--on")}
            aria-label="Toggle quick-action button"
          >
            <input
              type="checkbox"
              checked={showFab}
              onChange={(event) => onShowFabChange(event.target.checked)}
            />
            <span className="switch__track"><span className="switch__thumb" /></span>
          </label>
        </div>
        <div className="settings-row">
          <div>
            <p className="settings-toggle__title">Hard delete</p>
            <p className="settings-toggle__hint">
              When on, Soft Delete becomes Hard Delete (red). Confirmed deletes
              remove the record locally and move the Notion page to trash on the
              next sync. Soft delete (default) still clears the amount and marks
              the title as deleted.
            </p>
          </div>
          <label
            className={cx("switch", hardDeleteEnabled && "switch--on")}
            aria-label="Toggle hard delete"
          >
            <input
              type="checkbox"
              checked={hardDeleteEnabled}
              onChange={(event) => {
                void setHardDeleteEnabled(event.target.checked);
              }}
            />
            <span className="switch__track"><span className="switch__thumb" /></span>
          </label>
        </div>
        {hardDeleteEnabled && (
          <div className="settings-row settings-row--danger">
            <p>
              <Trash2 size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
              Hard delete is on. Use Confirm carefully — trashed Notion pages can
              be restored from Notion trash, but local rows are removed immediately.
            </p>
          </div>
        )}
      </div>
    </SettingsModal>
  );
}

function ThemeCustomizeModal({ onClose }: { onClose: () => void }) {
  const { mode, primaryColor, secondaryColor, setMode, setPrimaryColor, setSecondaryColor } =
    useTheme();

  return (
    <SettingsModal
      title="Customize Theme"
      subtitle="Personalize your appearance and accent colors."
      onClose={onClose}
      footer={
        <button type="button" className="button button--primary" onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="theme-modal-grid">
        <div className="theme-modal-section">
          <p className="settings-toggle__title">Appearance</p>
          <p className="settings-toggle__hint">
            Choose light, dark, or follow your system setting.
          </p>
          <select
            className="settings-select"
            value={mode}
            onChange={(e) => setMode(e.target.value as "light" | "dark" | "system")}
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
        <div className="theme-modal-section">
          <p className="settings-toggle__title">Colors</p>
          <p className="settings-toggle__hint">
            Customize accent colors applied globally.
          </p>
          <div className="theme-color-pickers">
            <div className="theme-color-picker-group">
              <span className="settings-color-label">Primary</span>
              <ColorPicker value={primaryColor} onChange={setPrimaryColor} />
            </div>
            <div className="theme-color-picker-group">
              <span className="settings-color-label">Secondary</span>
              <ColorPicker value={secondaryColor} onChange={setSecondaryColor} />
            </div>
          </div>
        </div>
      </div>
    </SettingsModal>
  );
}

function NotionConfigModal({ onClose }: { onClose: () => void }) {
  const [notionToken, setNotionToken] = useState("");
  const [dbIds, setDbIds] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    userNotionConfigApi.get().then((res) => {
      if (cancelled || !res.success || !res.data.configured) return;
      startTransition(() => {
        setNotionToken(res.data.tokenConfigured ? "stored" : "");
        setDbIds(res.data.dbIds);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function setDbId(key: string, value: string) {
    setDbIds((prev) => ({ ...prev, [key]: value.trim() }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setNotice(null);
    const token = notionToken === "stored" ? undefined : notionToken;
    const res = await userNotionConfigApi.save({ token: token || undefined, dbIds });
    setSaving(false);
    if (res.success) {
      setNotice("Configuration saved.");
      setNotionToken(token ? "stored" : notionToken === "stored" ? "stored" : "");
    } else {
      setError(res.error.message);
    }
  }

  async function handleRemove() {
    if (!window.confirm("Remove your Notion configuration?")) return;
    setSaving(true);
    setError(null);
    const res = await userNotionConfigApi.remove();
    setSaving(false);
    if (res.success) {
      setNotionToken("");
      setDbIds({});
      setNotice("Configuration removed.");
    } else {
      setError(res.error.message);
    }
  }

  function handleExport() {
    const data = JSON.stringify(dbIds, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notion-db-ids.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          if (typeof imported !== "object" || imported === null) {
            setError("Invalid file format.");
            return;
          }
          setDbIds(imported);
          setNotice("Database IDs imported. Click Save to apply.");
        } catch {
          setError("Failed to parse JSON file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  return (
    <SettingsModal
      title="Notion Configuration"
      subtitle="View, edit, or remove your Notion token and database IDs."
      onClose={onClose}
      footer={
        <>
          <div className="modal-footer-left">
            <button type="button" className="button" onClick={handleImport} disabled={saving}>
              <Upload size={16} />
              Import
            </button>
            <button type="button" className="button" onClick={handleExport} disabled={saving || Object.keys(dbIds).length === 0}>
              <Download size={16} />
              Export
            </button>
          </div>
          <button type="button" className="button" onClick={handleRemove} disabled={saving}>
            <Trash2 size={16} />
            Remove
          </button>
          <button type="button" className="button button--primary" onClick={handleSave} disabled={saving}>
            <Save size={16} />
            {saving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <div className="form-grid form-grid--single">
        {error && <div className="auth-form__error">{error}</div>}
        {notice && <div className="auth-form__notice">{notice}</div>}
        <Field label="Notion Integration Token">
          <input
            type="password"
            value={notionToken}
            onChange={(e) => setNotionToken(e.target.value)}
            placeholder={notionToken === "stored" ? "Stored — enter new to replace" : "ntn_…"}
            autoComplete="off"
          />
        </Field>
        <FormSectionDivider title="Database IDs" />
        {KNOWN_DB_ID_KEYS.map(({ key, label }) => (
          <Field key={key} label={`${label} Database ID`}>
            <input
              value={dbIds[key] ?? ""}
              onChange={(e) => setDbId(key, e.target.value)}
              placeholder={`${key} database ID`}
              spellCheck={false}
              autoComplete="off"
            />
          </Field>
        ))}
      </div>
    </SettingsModal>
  );
}

export { KNOWN_DB_ID_KEYS, ThemeCustomizeModal, NotionConfigModal, InterfaceManageModal, ProfileManageModal };
export type { SettingsModalKind };
