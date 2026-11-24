import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui";
import { cx } from "@/lib/finance-helpers";
import type { SavedBudgetsMirrorStatus } from "../../../../shared/finance.types";

type Notice = { kind: "info" | "error"; text: string } | null;

/**
 * Settings area for the Custom monthly budget database (ADR-0010). The budgets are edited only in Notion;
 * this panel shows the database status, the missing columns (with a button to add them), and a manual sync.
 * It never creates a database.
 */
export function SavedBudgetsMirrorSettings({ onOpenNotionConfig }: { onOpenNotionConfig?: () => void }) {
  const [status, setStatus] = useState<SavedBudgetsMirrorStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const local = await window.api?.budgets?.mirrorStatus();
      if (cancelled || !local?.ok) return;
      setStatus(local.data);
      // Best-effort live check for the list of missing columns (needs a saved ID and a connection).
      if (local.data.databaseId) {
        const live = await window.api?.budgets?.mirrorRefresh();
        if (!cancelled && live?.ok) setStatus(live.data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const api = window.api?.budgets;
  if (!api) return null;

  const hasId = Boolean(status?.databaseId);
  const badge = !hasId
    ? { tone: "neutral" as const, text: "No database ID" }
    : status?.databaseMissing
      ? { tone: "rose" as const, text: "Database missing" }
      : { tone: "green" as const, text: "Connected" };

  async function refresh() {
    const next = await api.mirrorStatus();
    if (next.ok) setStatus(next.data);
  }

  async function syncNow() {
    setBusy(true);
    setNotice(null);
    const res = await api.mirrorRun();
    setBusy(false);
    await refresh();
    if (!res.ok) setNotice({ kind: "error", text: res.error.message });
    else if (res.data.skipped) setNotice({ kind: "error", text: res.data.skipped });
    else setNotice({ kind: "info", text: `Updated ${res.data.cachedMonths} month(s) from Notion.` });
  }

  async function addColumns() {
    setBusy(true);
    setNotice(null);
    const res = await api.mirrorAddColumns();
    setBusy(false);
    if (!res.ok) {
      setNotice({ kind: "error", text: res.error.message });
      return;
    }
    setStatus(res.data.status);
    setNotice({ kind: "info", text: `Added ${res.data.added} column(s) to the Custom monthly budget database.` });
  }

  return (
    <div className="settings-row" style={{ display: "block" }}>
      <div className="settings-row" style={{ marginTop: 0 }}>
        <div className="settings-row__text">
          <p className="settings-toggle__title">Custom monthly budget database</p>
          <p className="settings-toggle__hint">
            Your own Notion database of monthly budgets: one row per period (for example Jan 2025) and one number column
            per expense category. Edit budgets there; the app only reads it and keeps a copy for offline use. Choose
            Custom in Monitoring to use it.
          </p>
        </div>
        <div className="settings-row__control">
          <Badge tone={badge.tone}>{badge.text}</Badge>
          <button type="button" className="button" disabled={busy || !hasId} onClick={() => void syncNow()}>
            <RefreshCw size={16} />
            Sync now
          </button>
        </div>
      </div>

      <div className="settings-subcard">
        {hasId ? (
          <p className="settings-toggle__hint" style={{ marginTop: 0 }}>
            Database ID: <strong>{status?.databaseId}</strong>
          </p>
        ) : (
          <p className="settings-toggle__hint" style={{ marginTop: 0 }}>
            Create a database in Notion, share it with your integration, then save its ID in Notion Configuration.{" "}
            {onOpenNotionConfig && (
              <button type="button" className="settings-inline-link" onClick={onOpenNotionConfig}>
                Open Notion Configuration
              </button>
            )}
          </p>
        )}

        {status && status.missingColumns.length > 0 && (
          <div style={{ marginTop: "0.75rem" }}>
            <p className="settings-toggle__hint">
              The database has no number column for: <strong>{status.missingColumns.join(", ")}</strong>. These
              categories are skipped until the columns exist.
            </p>
            <button type="button" className="button" disabled={busy} onClick={() => void addColumns()}>
              Add missing columns
            </button>
          </div>
        )}

        {status?.databaseMissing && (
          <p className="form-error" style={{ marginTop: "0.75rem" }}>
            The database was removed or is no longer shared with your integration. Nothing is recreated. Check the ID in
            Notion Configuration.
          </p>
        )}
        {status?.lastError && !status.databaseMissing && (
          <p className="settings-toggle__hint form-error" style={{ marginTop: "0.5rem" }}>
            {status.lastError}
          </p>
        )}
        {notice && (
          <p className={cx("settings-toggle__hint", notice.kind === "error" && "form-error")} style={{ marginTop: "0.5rem" }}>
            {notice.text}
          </p>
        )}
      </div>
    </div>
  );
}
