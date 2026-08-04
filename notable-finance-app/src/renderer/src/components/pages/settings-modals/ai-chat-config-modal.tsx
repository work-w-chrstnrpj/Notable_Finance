import { Field, FormSectionDivider } from "@/components/ui";
import { SettingsModal } from "@/components/ui/form-modals";
import { cx } from "@/lib/finance-helpers";
import { MessageSquare, Save, Trash2 } from "lucide-react";
import { useAiChatConfig } from "./use-ai-chat-config";

/**
 * refactor_development_plan.md Phase 6.1 — pure move out of settings-modals.tsx, unchanged.
 * State and handlers moved to useAiChatConfig(); this file is the JSX only.
 */
function AiChatConfigModal({ onClose }: { onClose: () => void }) {
  const {
    settings, updateSettings, setChatEnabled,
    credentials,
    isAppleOs,
    appleStatusLabel,
    appleDetail,
    appleAvailable,
    appleStatus,
    appleBusy,
    formName, setFormName,
    formKey, setFormKey,
    formProvider, setFormProvider,
    formCustomBaseUrl, setFormCustomBaseUrl,
    detectedProvider,
    setProviderTouched,
    providers,
    editingId, setEditingId,
    error, setError,
    busy,
    confirmDeleteAll, setConfirmDeleteAll,
    selectedProvider,
    refreshAppleStatus,
    resetForm,
    detectProviderFromKeyInput,
    providerLabel,
    onSaveCredential,
    onDeleteCredential,
    onSetDefault,
    onDeleteAllChats,
  } = useAiChatConfig();

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
                setProviderTouched(true);
                setFormProvider(id);
                const p = providers.find((x) => x.id === id);
                if (p && !formName.trim()) setFormName(p.label);
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
              onBlur={(e) => void detectProviderFromKeyInput(e.target.value)}
              placeholder={
                editingId
                  ? "Leave blank to keep current key"
                  : (selectedProvider?.keyPlaceholder ?? "API key")
              }
              autoComplete="off"
            />
          </Field>
          {detectedProvider && (
            <p className="settings-toggle__hint">
              {detectedProvider === formProvider
                ? `Key looks like ${providers.find((p) => p.id === detectedProvider)?.label ?? detectedProvider} — Provider matches.`
                : `Heads up: this key looks like ${providers.find((p) => p.id === detectedProvider)?.label ?? detectedProvider}, but Provider is set to ${selectedProvider?.label ?? formProvider}. The Provider picks the host that's actually called — the Name is only a label.`}
            </p>
          )}
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
            Preference for new chats. In Chat, the Model list still follows the selected{" "}
            <strong>Key</strong> (so a Gemini key only shows Gemini models). Switch Key to use
            another provider.
          </p>
          <Field label="Model for new chats">
            {providers.length > 0 ? (
              <select
                className="settings-select"
                value={settings.chatDefaultModel}
                onChange={(e) => void updateSettings({ chatDefaultModel: e.target.value })}
              >
                {providers.map((p) => (
                  <optgroup key={p.id} label={p.label}>
                    {p.models.map((m) => (
                      <option key={`${p.id}:${m.id}`} value={m.id}>
                        {m.label}
                        {m.free ? " (free)" : ""}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            ) : (
              <input
                value={settings.chatDefaultModel}
                onChange={(e) => void updateSettings({ chatDefaultModel: e.target.value })}
                placeholder="model id"
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

export { AiChatConfigModal };
