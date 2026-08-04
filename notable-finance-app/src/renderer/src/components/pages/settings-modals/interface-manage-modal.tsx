import { Trash2 } from "lucide-react";
import { useUiSettings } from "@/lib/ui-settings-context";
import { SettingsModal } from "@/components/ui/form-modals";
import { cx } from "@/lib/finance-helpers";

/**
 * refactor_development_plan.md Phase 6.1 — pure move out of settings-modals.tsx, unchanged.
 */
function InterfaceManageModal({
  onClose,
  showFab,
  onShowFabChange,
}: {
  onClose: () => void;
  showFab: boolean;
  onShowFabChange: (next: boolean) => void;
}) {
  const { hardDeleteEnabled, setHardDeleteEnabled, settings, updateSettings } =
    useUiSettings();
  const pushFabMinutes = Math.max(
    1,
    Math.round(settings.workspace.pushFabAutoHideMs / 60000),
  );

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
            <p className="settings-toggle__title">Push button auto-hide</p>
            <p className="settings-toggle__hint">
              After you create, edit, or delete a record, a floating “Push to
              sync” button appears top-right. It hides on its own after this many
              minutes if you don’t use it (and disappears once a push succeeds).
            </p>
          </div>
          <label className="settings-inline-field" aria-label="Push button auto-hide minutes">
            <input
              type="number"
              className="settings-inline-field__input"
              min={1}
              max={30}
              step={1}
              value={pushFabMinutes}
              onChange={(event) => {
                const minutes = Number(event.target.value);
                if (!Number.isFinite(minutes)) return;
                const clamped = Math.min(Math.max(Math.round(minutes), 1), 30);
                void updateSettings({
                  workspace: { pushFabAutoHideMs: clamped * 60000 },
                });
              }}
            />
            <span className="settings-inline-field__suffix">min</span>
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

export { InterfaceManageModal };
