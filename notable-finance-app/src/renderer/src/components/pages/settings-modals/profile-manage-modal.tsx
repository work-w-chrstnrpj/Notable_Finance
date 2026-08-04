import { useState } from "react";
import { useUiSettings } from "@/lib/ui-settings-context";
import { Field } from "@/components/ui";
import { SettingsModal } from "@/components/ui/form-modals";
import { fileToAvatarDataUrl, userInitials } from "@/lib/avatar";

/**
 * refactor_development_plan.md Phase 6.1 — pure move out of settings-modals.tsx, unchanged.
 */
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

export { ProfileManageModal };
