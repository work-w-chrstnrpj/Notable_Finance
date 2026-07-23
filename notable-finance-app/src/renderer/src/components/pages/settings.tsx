
import { useState } from "react";
import { Database, Palette, Trash2 } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { useUiSettings } from "@/lib/ui-settings-context";
import { cx } from "@/lib/finance-helpers";
import { Panel, Field, ComputedField, Badge } from "@/components/ui";
import { StatusPill } from "@/components/ui/date-range";
import { SettingsModalKind, ThemeCustomizeModal, NotionConfigModal } from "@/components/pages/settings-modals";
import type { SchemaHealth } from "@/types/finance";

// Desktop settings — identical to the web page minus login/account management
// (the desktop app is single-user and local; there are no accounts to manage).

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
  const { hardDeleteEnabled, setHardDeleteEnabled } = useUiSettings();
  useTheme(); // theme context is exercised by the modal

  return (
    <div className="page-stack">
      <Panel title="Interface">
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
    </div>
  );
}

export { SettingsPage };
