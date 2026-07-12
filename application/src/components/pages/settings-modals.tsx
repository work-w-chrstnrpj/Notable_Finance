"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { ColorPicker } from "@/components/color-picker";
import { userNotionConfigApi } from "@/lib/api-client";
import { Field, FormSectionDivider } from "@/components/ui";
import { SettingsModal } from "@/components/ui/form-modals";
import { Database, KeyRound, LogOut, Mail, Palette, Save, Trash2 } from "lucide-react";

const KNOWN_DB_ID_KEYS = [
  { key: "accounts", label: "Accounts" },
  { key: "incomeCategories", label: "Income Portfolio" },
  { key: "incomes", label: "Incomes" },
  { key: "expenseCategories", label: "Expense Categories" },
  { key: "expenses", label: "Expenses" },
  { key: "monthlyMonitoring", label: "Monthly Monitoring" },
] as const;

type SettingsModalKind = "notion" | "email" | "password" | "delete" | "theme" | null;

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

  return (
    <SettingsModal
      title="Notion Configuration"
      subtitle="View, edit, or remove your Notion token and database IDs."
      onClose={onClose}
      footer={
        <>
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

function ChangeEmailModal({ onClose }: { onClose: () => void }) {
  const { user, changeEmail } = useAuth();
  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!newEmail.trim() || !currentPassword) {
      setError("New email and current password are required.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await changeEmail(currentPassword, newEmail.trim());
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.error ?? "Failed to change email.");
  }

  return (
    <SettingsModal
      title="Change Email"
      subtitle={`Current: ${user?.email ?? ""}`}
      onClose={onClose}
      footer={
        done ? (
          <button type="button" className="button button--primary" onClick={onClose}>Done</button>
        ) : (
          <button type="button" className="button button--primary" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Update Email"}
          </button>
        )
      }
    >
      <div className="form-grid form-grid--single">
        {error && <div className="auth-form__error">{error}</div>}
        {done ? (
          <div className="auth-form__notice">Email updated to {user?.email}.</div>
        ) : (
          <>
            <Field label="New Email">
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} autoComplete="off" />
            </Field>
            <Field label="Current Password">
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            </Field>
          </>
        )}
      </div>
    </SettingsModal>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!currentPassword || !newPassword) {
      setError("Current and new password are required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await changePassword(currentPassword, newPassword);
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(res.error ?? "Failed to change password.");
  }

  return (
    <SettingsModal
      title="Change Password"
      onClose={onClose}
      footer={
        done ? (
          <button type="button" className="button button--primary" onClick={onClose}>Done</button>
        ) : (
          <button type="button" className="button button--primary" onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Update Password"}
          </button>
        )
      }
    >
      <div className="form-grid form-grid--single">
        {error && <div className="auth-form__error">{error}</div>}
        {done ? (
          <div className="auth-form__notice">Your password has been updated.</div>
        ) : (
          <>
            <Field label="Current Password">
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            </Field>
            <Field label="New Password">
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" minLength={6} />
            </Field>
            <Field label="Confirm New Password">
              <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
            </Field>
          </>
        )}
      </div>
    </SettingsModal>
  );
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { deleteAccount } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!currentPassword) {
      setError("Enter your password to confirm.");
      return;
    }
    if (!window.confirm("Delete your account permanently? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    const res = await deleteAccount(currentPassword);
    setBusy(false);
    if (res.ok) {
      router.push("/login");
    } else {
      setError(res.error ?? "Failed to delete account.");
    }
  }

  return (
    <SettingsModal
      title="Delete Account"
      subtitle="This permanently deletes your account and Notion configuration."
      onClose={onClose}
      footer={
        <button type="button" className="button button--danger" onClick={submit} disabled={busy}>
          <Trash2 size={16} />
          {busy ? "Deleting…" : "Delete My Account"}
        </button>
      }
    >
      <div className="form-grid form-grid--single">
        {error && <div className="auth-form__error">{error}</div>}
        <div className="auth-form__error">
          Warning: this action is irreversible. All your data will be removed.
        </div>
        <Field label="Confirm Password">
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
        </Field>
      </div>
    </SettingsModal>
  );
}

export { KNOWN_DB_ID_KEYS, ThemeCustomizeModal, NotionConfigModal, ChangeEmailModal, ChangePasswordModal, DeleteAccountModal };
export type { SettingsModalKind };
