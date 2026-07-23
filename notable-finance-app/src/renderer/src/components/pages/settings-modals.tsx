
import { startTransition, useState, useEffect } from "react";
import { useTheme } from "@/lib/theme-context";
import { useUiSettings } from "@/lib/ui-settings-context";
import { ColorPicker } from "@/components/color-picker";
import { userNotionConfigApi } from "@/lib/api-client";
import { Field, FormSectionDivider } from "@/components/ui";
import { SettingsModal } from "@/components/ui/form-modals";
import { cx } from "@/lib/finance-helpers";
import { fileToAvatarDataUrl, userInitials } from "@/lib/avatar";
import { Database, Download, MessageSquare, Save, Trash2, Upload } from "lucide-react";
import type { ChatCredentialDto, ChatProviderCatalogDto } from "@shared/finance.types";

const KNOWN_DB_ID_KEYS = [
  { key: "accounts", label: "Accounts" },
  { key: "incomeCategories", label: "Income Portfolio" },
  { key: "incomes", label: "Incomes" },
  { key: "expenseCategories", label: "Expense Categories" },
  { key: "expenses", label: "Expenses" },
  { key: "monthlyMonitoring", label: "Monthly Monitoring" },
] as const;

type SettingsModalKind = "notion" | "theme" | "interface" | "profile" | "ai" | null;

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

export { KNOWN_DB_ID_KEYS, ThemeCustomizeModal, NotionConfigModal, InterfaceManageModal, ProfileManageModal, AiChatConfigModal };
export type { SettingsModalKind };

function AiChatConfigModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, setChatEnabled } = useUiSettings();
  const [credentials, setCredentials] = useState<ChatCredentialDto[]>([]);
  const [isAppleOs, setIsAppleOs] = useState(false);
  const [appleStatusLabel, setAppleStatusLabel] = useState("…");
  const [appleDetail, setAppleDetail] = useState("");
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [appleStatus, setAppleStatus] = useState<"available" | "unavailable" | "unsupported">(
    "unavailable"
  );
  const [formName, setFormName] = useState("");
  const [formKey, setFormKey] = useState("");
  const [formProvider, setFormProvider] = useState("gemini");
  const [formCustomBaseUrl, setFormCustomBaseUrl] = useState("");
  const [providers, setProviders] = useState<ChatProviderCatalogDto[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [appleBusy, setAppleBusy] = useState(false);

  const selectedProvider = providers.find((p) => p.id === formProvider) ?? null;

  const refresh = async () => {
    const res = await window.api.chat.listCredentials();
    if (res.ok) setCredentials(res.data);
  };

  const refreshAppleStatus = async (forceRefresh = false) => {
    setAppleBusy(true);
    try {
      const r = await window.api.chat.status({ forceRefresh });
      if (r.ok) {
        setAppleStatusLabel(r.data.appleStatusLabel);
        setAppleDetail(r.data.appleDetail);
        setAppleAvailable(r.data.appleAvailable);
        setAppleStatus(r.data.appleStatus);
      }
    } finally {
      setAppleBusy(false);
    }
  };

  useEffect(() => {
    void refresh();
    void window.api.chat.isAppleOs().then((r) => {
      if (r.ok) setIsAppleOs(r.data);
    });
    void refreshAppleStatus();
    void window.api.chat.providers?.().then((r) => {
      if (r.ok && r.data.length > 0) setProviders(r.data);
    });
  }, []);

  function resetForm() {
    setEditingId(null);
    setFormName("");
    setFormKey("");
    setFormProvider("gemini");
    setFormCustomBaseUrl("");
  }

  function providerLabel(c: ChatCredentialDto): string {
    const id = c.providerId ?? "custom";
    return providers.find((p) => p.id === id)?.label ?? id;
  }

  async function onSaveCredential() {
    const name = (formName.trim() || selectedProvider?.label || "API key").trim();
    if (!editingId && !formKey.trim()) {
      setError("API key is required.");
      return;
    }
    if (formProvider === "custom" && !formCustomBaseUrl.trim()) {
      setError("Custom provider needs a base URL (OpenAI-compatible …/v1).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (editingId) {
        const patch: {
          name: string;
          apiKey?: string;
          baseUrl?: string | null;
          providerId: string;
        } = {
          name,
          providerId: formProvider
        };
        if (formProvider === "custom") {
          patch.baseUrl = formCustomBaseUrl.trim().replace(/\/$/, "") || null;
        } else if (formProvider === "openai") {
          patch.baseUrl = null;
        }
        if (formKey.trim()) patch.apiKey = formKey;
        const res = await window.api.chat.updateCredential(editingId, patch);
        if (!res.ok) throw new Error(res.error.message);
      } else {
        const createOpts: { baseUrl?: string | null; providerId: string } = {
          providerId: formProvider
        };
        if (formProvider === "custom") {
          createOpts.baseUrl = formCustomBaseUrl.trim().replace(/\/$/, "") || null;
        } else if (formProvider === "openai") {
          createOpts.baseUrl = null;
        }
        const res = await window.api.chat.createCredential(name, formKey, createOpts);
        if (!res.ok) throw new Error(res.error.message);
      }
      if (selectedProvider?.defaultModelId) {
        void updateSettings({ chatDefaultModel: selectedProvider.defaultModelId });
      }
      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save credential.");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteCredential(id: string) {
    if (!window.confirm("Remove this API key from this device?")) return;
    setBusy(true);
    try {
      const res = await window.api.chat.deleteCredential(id);
      if (!res.ok) throw new Error(res.error.message);
      if (editingId === id) resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete credential.");
    } finally {
      setBusy(false);
    }
  }

  async function onSetDefault(id: string) {
    const res = await window.api.chat.setDefaultCredential(id);
    if (res.ok) await refresh();
  }

  async function onDeleteAllChats() {
    setBusy(true);
    setError(null);
    try {
      const res = await window.api.chat.deleteAllThreads();
      if (!res.ok) throw new Error(res.error.message);
      setConfirmDeleteAll(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete conversations.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsModal
      title="Configure AI"
      subtitle="Enable Chat, manage named API keys, and clear conversation history. Keys stay encrypted on this device."
      onClose={onClose}
      footer={
        <button type="button" className="button button--primary" onClick={onClose} disabled={busy}>
          Done
        </button>
      }
    >
      <div className="theme-modal-grid">
        <div className="settings-row">
          <div>
            <p className="settings-toggle__title">Enable Chat</p>
            <p className="settings-toggle__hint">
              When off, Chat is hidden and no AI calls are made. Conversation history is kept until
              you delete it.
            </p>
          </div>
          <label
            className={cx("switch", settings.chatEnabled && "switch--on")}
            aria-label="Enable Chat"
          >
            <input
              type="checkbox"
              checked={settings.chatEnabled}
              onChange={(e) => void setChatEnabled(e.target.checked)}
            />
            <span className="switch__track">
              <span className="switch__thumb" />
            </span>
          </label>
        </div>

        {isAppleOs && (
          <div className="theme-modal-section">
            <div className="settings-row">
              <div>
                <p className="settings-toggle__title">Prefer Apple for read-only Q&amp;A</p>
                <p className="settings-toggle__hint">
                  Status: <strong>{appleStatusLabel}</strong>
                  {appleAvailable
                    ? " — Apple Intelligence ready for ask/summarize (no cloud)."
                    : " — not ready for Chat yet."}{" "}
                  Cannot create or edit records; add a named API key for writes.
                </p>
              </div>
              <label
                className={cx("switch", settings.chatPreferAppleReadOnly && "switch--on")}
                aria-label="Prefer Apple Intelligence for read-only Q&A"
              >
                <input
                  type="checkbox"
                  checked={settings.chatPreferAppleReadOnly}
                  onChange={(e) =>
                    void updateSettings({ chatPreferAppleReadOnly: e.target.checked })
                  }
                />
                <span className="switch__track">
                  <span className="switch__thumb" />
                </span>
              </label>
            </div>
            {!appleAvailable && appleStatus !== "unsupported" && (
              <div className="settings-toggle__hint" style={{ marginTop: 8 }}>
                <p style={{ margin: "0 0 6px" }}>Setup checklist:</p>
                <ol style={{ margin: 0, paddingLeft: "1.25rem" }}>
                  <li>Apple Silicon Mac (M1 or later)</li>
                  <li>macOS with Apple Intelligence support</li>
                  <li>System Settings → Apple Intelligence → On</li>
                  <li>Wait until the on-device model finishes downloading</li>
                  <li>Restart Notable Finance, then refresh status</li>
                </ol>
                {appleDetail ? <p style={{ marginTop: 8 }}>{appleDetail}</p> : null}
              </div>
            )}
            {appleStatus === "unsupported" && (
              <p className="settings-toggle__hint" style={{ marginTop: 8 }}>
                {appleDetail}
              </p>
            )}
            {appleAvailable && appleDetail ? (
              <p className="settings-toggle__hint" style={{ marginTop: 8 }}>
                {appleDetail}
              </p>
            ) : null}
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="button"
                disabled={appleBusy}
                onClick={() => void refreshAppleStatus(true)}
              >
                {appleBusy ? "Checking…" : "Refresh Apple status"}
              </button>
            </div>
          </div>
        )}

        <div className="theme-modal-section">
          <p className="settings-toggle__title">API credentials</p>
          <p className="settings-toggle__hint">
            Add a free-tier key from Gemini, Groq, Cerebras, OpenRouter, OpenCode Zen, Mistral,
            Claude, or OpenAI. The provider choice sets the correct API host and model list so keys
            and models stay matched. Raw keys stay encrypted on this device.
          </p>
          {credentials.length === 0 && (
            <p className="settings-toggle__hint">No credentials saved yet.</p>
          )}
          <ul className="chat-cred-list">
            {credentials.map((c) => (
              <li key={c.id} className="chat-cred-list__row">
                <div>
                  <strong>{c.name}</strong>
                  <span className="chat-cred-list__meta">
                    {c.keyFingerprint}
                    {c.isDefault ? " · default" : ""}
                    {" · "}
                    {providerLabel(c)}
                  </span>
                </div>
                <div className="chat-cred-list__actions">
                  {!c.isDefault && (
                    <button type="button" className="button" onClick={() => void onSetDefault(c.id)}>
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    className="button"
                    onClick={() => {
                      setEditingId(c.id);
                      setFormName(c.name);
                      setFormKey("");
                      const preset = c.providerId ?? "custom";
                      setFormProvider(preset);
                      setFormCustomBaseUrl(preset === "custom" ? (c.baseUrl ?? "") : "");
                      setError(null);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button button--danger"
                    onClick={() => void onDeleteCredential(c.id)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <FormSectionDivider title={editingId ? "Edit credential" : "Add API key"} />
          <Field label="Provider">
            <select
              className="settings-select"
              value={formProvider}
              onChange={(e) => {
                const id = e.target.value;
                setFormProvider(id);
                const p = providers.find((x) => x.id === id);
                if (p && !formName.trim()) setFormName(p.label);
                if (p?.defaultModelId) {
                  void updateSettings({ chatDefaultModel: p.defaultModelId });
                }
              }}
              aria-label="API provider"
            >
              {(providers.length > 0
                ? providers
                : [
                    { id: "gemini", label: "Gemini (Google AI)" },
                    { id: "groq", label: "Groq" },
                    { id: "openrouter", label: "OpenRouter" },
                    { id: "openai", label: "OpenAI" },
                    { id: "custom", label: "Custom" },
                  ]
              ).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
          {selectedProvider && (
            <p className="settings-toggle__hint">
              {selectedProvider.hint}
              {selectedProvider.docsUrl ? (
                <>
                  {" "}
                  <a href={selectedProvider.docsUrl} target="_blank" rel="noreferrer">
                    Get a key
                  </a>
                </>
              ) : null}
              {selectedProvider.models.some((m) => m.free) ? (
                <>
                  {" "}
                  Free models:{" "}
                  {selectedProvider.models
                    .filter((m) => m.free)
                    .map((m) => m.label)
                    .join(", ")}
                  .
                </>
              ) : null}
            </p>
          )}
          <Field label="Name">
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={selectedProvider?.label ?? "My API key"}
              maxLength={80}
            />
          </Field>
          {formProvider === "custom" && (
            <Field label="Base URL">
              <input
                value={formCustomBaseUrl}
                onChange={(e) => setFormCustomBaseUrl(e.target.value)}
                placeholder="https://host/v1"
                spellCheck={false}
              />
            </Field>
          )}
          <Field label="API Key">
            <input
              type="password"
              value={formKey}
              onChange={(e) => setFormKey(e.target.value)}
              placeholder={
                editingId
                  ? "Leave blank to keep current key"
                  : (selectedProvider?.keyPlaceholder ?? "API key")
              }
              autoComplete="off"
            />
          </Field>
          <div className="chat-cred-form-actions">
            {editingId && (
              <button type="button" className="button" onClick={resetForm} disabled={busy}>
                Cancel edit
              </button>
            )}
            <button
              type="button"
              className="button button--primary"
              onClick={() => void onSaveCredential()}
              disabled={busy}
            >
              <Save size={14} />
              {editingId ? "Update credential" : "Add API key"}
            </button>
          </div>
        </div>

        <div className="theme-modal-section">
          <p className="settings-toggle__title">Default model</p>
          <p className="settings-toggle__hint">
            Used for new chats. Chat also filters this list to models that match the selected key’s
            provider.
          </p>
          <Field label="Model for new chats">
            {selectedProvider && selectedProvider.models.length > 0 ? (
              <select
                className="settings-select"
                value={
                  selectedProvider.models.some((m) => m.id === settings.chatDefaultModel)
                    ? settings.chatDefaultModel
                    : selectedProvider.defaultModelId
                }
                onChange={(e) => void updateSettings({ chatDefaultModel: e.target.value })}
              >
                {selectedProvider.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                    {m.free ? " (free)" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={settings.chatDefaultModel}
                onChange={(e) => void updateSettings({ chatDefaultModel: e.target.value })}
                placeholder="gemini-2.5-flash"
                spellCheck={false}
              />
            )}
          </Field>
        </div>

        <div className="theme-modal-section settings-row--danger">
          <p className="settings-toggle__title">History</p>
          <p className="settings-toggle__hint">
            Delete all chat conversations. This does not delete finance records.
          </p>
          {!confirmDeleteAll ? (
            <button
              type="button"
              className="button button--danger"
              onClick={() => setConfirmDeleteAll(true)}
            >
              <MessageSquare size={14} />
              Delete all conversations…
            </button>
          ) : (
            <div className="chat-cred-form-actions">
              <button
                type="button"
                className="button button--danger"
                disabled={busy}
                onClick={() => void onDeleteAllChats()}
              >
                Confirm delete all chats
              </button>
              <button
                type="button"
                className="button"
                disabled={busy}
                onClick={() => setConfirmDeleteAll(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {error && <p className="form-error">{error}</p>}
      </div>
    </SettingsModal>
  );
}
