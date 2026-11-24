// Custom budgets UI for Monitoring (ADR-0010). Budgets are edited only in Notion; the local table is a
// read-only cache, so this file only reads it and exports it as CSV. It only calls window.api.budgets.
import { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { cx } from "@/lib/finance-helpers";
import type { SavedBudgetRow } from "@shared/saved-budgets";
import styles from "./monitoring.module.css";

export interface BudgetCategory {
  id: string;
  name: string;
  monthlyBudget: number;
}

/** Saved rows for a range of months, with a reload for after a write. */
export function useSavedBudgets(fromMonth: string | undefined, toMonth: string | undefined) {
  const [rows, setRows] = useState<SavedBudgetRow[]>([]);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    if (!fromMonth || !toMonth) {
      setRows([]);
      return;
    }
    void window.api?.budgets?.list({ fromMonth, toMonth }).then((res) => {
      if (!cancelled && res?.ok) setRows(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [fromMonth, toMonth, version]);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { rows, reload };
}

/** Budget source coverage badge (spec section 6.2). */
export function BudgetSourceBadge({ text, muted }: { text: string; muted?: boolean }) {
  return <span className={cx(styles["budget-badge"], muted && styles["budget-badge--muted"])}>{text}</span>;
}
type ActionMessage = { kind: "error" | "info"; text: string } | null;


// ── Settings ────────────────────────────────────────────────────────────────

/** Settings panel body: export every cached month at once (no month or range to choose). */
export function SavedBudgetsSettings() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<ActionMessage>(null);

  async function exportAll() {
    const api = window.api?.budgets;
    if (!api) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await api.exportCsv({ kind: "saved" });
      if (!res.ok) setMessage({ kind: "error", text: res.error.message });
      else if (!res.data.canceled) {
        setMessage({ kind: "info", text: `Exported ${res.data.rows ?? 0} custom budgets to ${res.data.path}.` });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-row">
      <div style={{ flex: 1 }}>
        <p className="settings-toggle__title">Monthly budgets</p>
        <p className="settings-toggle__hint">
          Export every cached month in one CSV file as a read-only copy. Custom budgets are edited only in your Notion
          database, so the copy here cannot be imported back.
        </p>
        {message && (
          <p className={cx("settings-toggle__hint", message.kind === "error" && "form-error")} style={{ marginTop: "0.5rem" }}>
            {message.text}
          </p>
        )}
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
        <button type="button" className="button" disabled={busy} onClick={() => void exportAll()}>
          <Download size={16} />
          {busy ? "Exporting…" : "Export all budgets"}
        </button>
      </div>
    </div>
  );
}
