import { startTransition, useState, useEffect } from "react";
import { userNotionConfigApi } from "@/lib/api-client";
import { Field, FormSectionDivider } from "@/components/ui";
import { SettingsModal } from "@/components/ui/form-modals";
import { Download, Save, Trash2, Upload } from "lucide-react";

const KNOWN_DB_ID_KEYS = [
  { key: "accounts", label: "Accounts" },
  { key: "incomeCategories", label: "Income Portfolio" },
  { key: "incomes", label: "Incomes" },
  { key: "expenseCategories", label: "Expense Categories" },
  { key: "expenses", label: "Expenses" },
  { key: "monthlyMonitoring", label: "Monthly Monitoring" },
] as const;

/**
 * refactor_development_plan.md Phase 6.1 — pure move out of settings-modals.tsx, unchanged.
 */
function NotionConfigModal({ onClose }: { onClose: () => void }) {
  const [notionToken, setNotionToken] = useState("");
  const [dbIds, setDbIds] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Fire-and-forget: failure here just leaves the form at its empty defaults, same as
    // today — `void` marks that as deliberate rather than an accidentally-ignored rejection.
    void userNotionConfigApi.get().then((res) => {
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

export { NotionConfigModal, KNOWN_DB_ID_KEYS };
