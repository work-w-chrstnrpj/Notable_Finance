// Saved budgets UI for Monitoring (ADR-0006, tickets monthly-budget/03 and /04).
// Data lives in the main process (local SQLite); these components only call window.api.budgets.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Pencil, Save, Upload, X } from "lucide-react";
import { Field, SegmentedControl } from "@/components/ui";
import { cx, getMonthLabel } from "@/lib/finance-helpers";
import { formatMoney } from "@/lib/format";
import { isValidMonth, roundBudget, type SavedBudgetRow } from "@shared/saved-budgets";
import type {
  BudgetImportPolicy,
  BudgetImportPreview,
  BudgetImportRowStatus,
  SavedBudgetInput,
} from "@shared/finance.types";
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

/** Parse a budget typed in an input. Null when it is not a non-negative number. */
function parseBudgetInput(value: string): number | null {
  const cleaned = value.replace(/[₱\s,]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return roundBudget(Number(cleaned));
}

function ModalShell({
  id,
  title,
  subtitle,
  onClose,
  footer,
  wide,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer: React.ReactNode;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        aria-labelledby={id}
        aria-modal="true"
        className={cx("modal-panel", wide ? styles["modal-panel--wide"] : styles["modal-panel--narrow"])}
        role="dialog"
      >
        <div className="modal-panel__header">
          <div>
            <h2 id={id}>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="icon-button" aria-label="Close modal" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <div className="modal-panel__body">{children}</div>
        <div className="modal-panel__footer">{footer}</div>
      </section>
    </div>
  );
}

/**
 * A budget figure in a table cell. Carries a numeric `value` so the table sorts it as a number,
 * and optionally a muted line with the Notion figure when a saved budget differs from it.
 */
export function BudgetFigure({ value, notionValue }: { value: number; notionValue?: number }) {
  return (
    <span>
      {formatMoney(value)}
      {notionValue !== undefined && <span className={styles["budget-diff"]}>Notion {formatMoney(notionValue)}</span>}
    </span>
  );
}

/** Budget source coverage badge (spec section 6.2). */
export function BudgetSourceBadge({ text, muted }: { text: string; muted?: boolean }) {
  return <span className={cx(styles["budget-badge"], muted && styles["budget-badge--muted"])}>{text}</span>;
}

// ── Save, edit, delete ──────────────────────────────────────────────────────

type ActionMessage = { kind: "error" | "info"; text: string } | null;

/** "Save budgets for this month": copy today's Notion budgets into a month's saved set. */
export function SaveBudgetsModal({
  defaultMonth,
  onClose,
  onSaved,
}: {
  defaultMonth: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [month, setMonth] = useState(defaultMonth);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<ActionMessage>(null);

  async function save() {
    if (!isValidMonth(month)) {
      setMessage({ kind: "error", text: "Choose a month." });
      return;
    }
    const api = window.api?.budgets;
    if (!api) return;
    setBusy(true);
    setMessage(null);
    try {
      const existing = await api.list({ fromMonth: month, toMonth: month });
      if (existing.ok && existing.data.length > 0) {
        if (!window.confirm(`Replace the saved budgets for ${getMonthLabel(month)}?`)) return;
      }
      const res = await api.saveFromNotion(month, true);
      if (!res.ok) {
        setMessage({ kind: "error", text: res.error.message });
        return;
      }
      onSaved();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell
      id="save-budgets-title"
      title="Save budgets for a month"
      subtitle="Copies today's Notion budgets into that month. Saved on this computer only."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="button button--primary" disabled={busy} onClick={() => void save()}>
            <Save size={16} />
            Save budgets
          </button>
        </>
      }
    >
      <div className="form-grid form-grid--single">
        <Field label="Month" error={message?.kind === "error"}>
          <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </Field>
        {message && <p className={message.kind === "error" ? "form-error" : undefined}>{message.text}</p>}
      </div>
    </ModalShell>
  );
}

/** "Edit budgets": one input per category for a chosen month, saved in one write. */
export function EditBudgetsModal({
  months,
  defaultMonth,
  categories,
  onClose,
  onChanged,
}: {
  /** Months in the current Monitoring range; the picker is limited to these. */
  months: string[];
  defaultMonth: string;
  categories: BudgetCategory[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [month, setMonth] = useState(months.includes(defaultMonth) ? defaultMonth : (months[0] ?? defaultMonth));
  const [saved, setSaved] = useState<SavedBudgetRow[] | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<ActionMessage>(null);

  // The parent rebuilds `categories` on every render. Reload the set only when its content changes,
  // so a re-render while the user is typing never wipes their input.
  const categoriesKey = JSON.stringify(categories);
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  // Saved rows for a category that is no longer in the category list stay editable.
  const removed = useMemo(() => {
    if (!saved) return [];
    const currentIds = new Set(categories.map((c) => c.id));
    const currentNames = new Set(categories.map((c) => c.name.trim().toLowerCase()));
    return saved.filter((r) => !currentIds.has(r.categoryId) && !currentNames.has(r.categoryName.trim().toLowerCase()));
  }, [saved, categories]);

  useEffect(() => {
    let cancelled = false;
    setSaved(null);
    setErrors({});
    setMessage(null);
    const current = categoriesRef.current;
    void window.api?.budgets?.list({ fromMonth: month, toMonth: month }).then((res) => {
      if (cancelled || !res?.ok) return;
      setSaved(res.data);
      const next: Record<string, string> = {};
      if (res.data.length > 0) {
        for (const c of current) {
          const row =
            res.data.find((r) => r.categoryId === c.id) ??
            res.data.find((r) => r.categoryName.trim().toLowerCase() === c.name.trim().toLowerCase());
          next[c.id] = String(row ? row.budget : 0);
        }
        for (const r of res.data) next[`removed:${r.categoryId}`] = String(r.budget);
      } else {
        // No saved set yet: start from today's Notion budgets. Nothing is saved until Save.
        for (const c of current) next[c.id] = String(c.monthlyBudget);
      }
      setValues(next);
    });
    return () => {
      cancelled = true;
    };
  }, [month, categoriesKey]);

  const hasSet = (saved?.length ?? 0) > 0;

  function fillFromNotion() {
    const next = { ...values };
    for (const c of categories) next[c.id] = String(c.monthlyBudget);
    setValues(next);
    setErrors({});
  }

  async function save() {
    const nextErrors: Record<string, string> = {};
    const rows: SavedBudgetInput[] = [];
    const check = (key: string, categoryId: string, categoryName: string) => {
      const parsed = parseBudgetInput(values[key] ?? "");
      if (parsed === null) nextErrors[key] = "Enter a number of 0 or more (up to 2 decimals).";
      else rows.push({ categoryId, categoryName, budget: parsed });
    };
    for (const c of categories) check(c.id, c.id, c.name);
    for (const r of removed) check(`removed:${r.categoryId}`, r.categoryId, r.categoryName);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const api = window.api?.budgets;
    if (!api) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await api.saveSet(month, rows);
      if (!res.ok) {
        setMessage({ kind: "error", text: res.error.message });
        return;
      }
      onChanged();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete saved budgets for ${getMonthLabel(month)}?`)) return;
    const api = window.api?.budgets;
    if (!api) return;
    setBusy(true);
    try {
      const res = await api.deleteSet(month);
      if (!res.ok) {
        setMessage({ kind: "error", text: res.error.message });
        return;
      }
      onChanged();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  function renderRow(key: string, name: string, notionBudget: number | null) {
    return (
      <div key={key} className={styles["budget-edit-row"]}>
        <Field label={name} error={Boolean(errors[key])}>
          <input
            inputMode="decimal"
            value={values[key] ?? ""}
            onChange={(event) => setValues((prev) => ({ ...prev, [key]: event.target.value }))}
          />
        </Field>
        <span className={styles["budget-edit-row__ref"]}>
          {notionBudget === null ? "Removed category" : `Notion ${formatMoney(notionBudget)}`}
        </span>
        {errors[key] && <p className={cx("form-error", styles["budget-edit-row__error"])}>{errors[key]}</p>}
      </div>
    );
  }

  return (
    <ModalShell
      id="edit-budgets-title"
      title="Edit budgets"
      subtitle="Saved on this computer only. They never change Notion."
      wide
      onClose={onClose}
      footer={
        <>
          <button type="button" className="button" disabled={busy} onClick={fillFromNotion}>
            Fill from Notion
          </button>
          {hasSet && (
            <button type="button" className="button" disabled={busy} onClick={() => void remove()}>
              Delete saved budgets for this month
            </button>
          )}
          <span className={styles["modal-footer-spacer"]} />
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="button button--primary" disabled={busy || saved === null} onClick={() => void save()}>
            <Save size={16} />
            Save
          </button>
        </>
      }
    >
      <div className="form-grid form-grid--single">
        <Field label="Month">
          <select value={month} onChange={(event) => setMonth(event.target.value)}>
            {(months.includes(month) ? months : [month, ...months]).map((m) => (
              <option key={m} value={m}>
                {getMonthLabel(m)}
              </option>
            ))}
          </select>
        </Field>
        {saved !== null && !hasSet && (
          <p className={styles["budget-hint"]}>
            No saved budgets for {getMonthLabel(month)} yet. The values below start from today&apos;s Notion budgets; nothing is
            saved until you press Save.
          </p>
        )}
        {message && <p className={message.kind === "error" ? "form-error" : undefined}>{message.text}</p>}
      </div>
      <div className={styles["budget-edit-list"]}>
        {saved === null && <p className={styles["budget-hint"]}>Loading…</p>}
        {saved !== null && categories.map((c) => renderRow(c.id, c.name, c.monthlyBudget))}
        {saved !== null && removed.map((r) => renderRow(`removed:${r.categoryId}`, r.categoryName, null))}
      </div>
    </ModalShell>
  );
}

// ── Export ──────────────────────────────────────────────────────────────────

/** Export saved budgets, or a template prefilled with today's Notion budgets, as CSV. */
export function ExportBudgetsModal({
  rangeStart,
  rangeEnd,
  onClose,
}: {
  rangeStart: string;
  rangeEnd: string;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<"saved" | "template">("saved");
  const [scope, setScope] = useState<"range" | "all">("range");
  const [fromMonth, setFromMonth] = useState(rangeStart);
  const [toMonth, setToMonth] = useState(rangeEnd);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<ActionMessage>(null);

  async function run() {
    const api = window.api?.budgets;
    if (!api) return;
    if (kind === "template" && (!isValidMonth(fromMonth) || !isValidMonth(toMonth) || toMonth < fromMonth)) {
      setMessage({ kind: "error", text: "Choose a from month and a to month that is not earlier." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await api.exportCsv(
        kind === "template"
          ? { kind, fromMonth, toMonth }
          : scope === "all"
            ? { kind }
            : { kind, fromMonth: rangeStart, toMonth: rangeEnd },
      );
      if (!res.ok) {
        setMessage({ kind: "error", text: res.error.message });
        return;
      }
      if (res.data.canceled) return;
      setMessage({ kind: "info", text: `Exported ${res.data.rows ?? 0} rows to ${res.data.path}.` });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell
      id="export-budgets-title"
      title="Export budgets"
      subtitle="Saves a CSV file you can open in a spreadsheet and import back."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="button" onClick={onClose}>
            Close
          </button>
          <button type="button" className="button button--primary" disabled={busy} onClick={() => void run()}>
            <Download size={16} />
            Export CSV
          </button>
        </>
      }
    >
      <div className="form-grid form-grid--single">
        <Field label="What to export">
          <SegmentedControl
            label="Export kind"
            options={[
              { label: "Saved budgets", value: "saved" },
              { label: "Template (Notion budgets)", value: "template" },
            ]}
            value={kind}
            onChange={(value) => setKind(value as "saved" | "template")}
          />
        </Field>
        {kind === "saved" ? (
          <Field label="Months">
            <SegmentedControl
              label="Export months"
              options={[
                { label: "Current range", value: "range" },
                { label: "All saved months", value: "all" },
              ]}
              value={scope}
              onChange={(value) => setScope(value as "range" | "all")}
            />
          </Field>
        ) : (
          <>
            <Field label="From month">
              <input type="month" value={fromMonth} onChange={(event) => setFromMonth(event.target.value)} />
            </Field>
            <Field label="To month">
              <input type="month" value={toMonth} onChange={(event) => setToMonth(event.target.value)} />
            </Field>
          </>
        )}
        {message && <p className={message.kind === "error" ? "form-error" : styles["budget-hint"]}>{message.text}</p>}
      </div>
    </ModalShell>
  );
}

// ── Import ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<BudgetImportRowStatus, string> = {
  new: "New",
  changed: "Changed",
  unchanged: "Unchanged",
  skipped: "Skipped",
  invalid: "Invalid",
};

/** Choose a CSV, review a preview, then import all valid rows or none. */
export function ImportBudgetsModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [preview, setPreview] = useState<BudgetImportPreview | null>(null);
  const [policy, setPolicy] = useState<BudgetImportPolicy>("overwrite");
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState<ActionMessage>(null);

  // Opening the modal opens the file dialog straight away, once. The ref keeps React StrictMode's
  // development double-run of effects from opening two dialogs.
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void window.api?.budgets?.importPreview({ policy: "overwrite" }).then((res) => {
      setBusy(false);
      if (!res.ok) setMessage({ kind: "error", text: res.error.message });
      else if (res.data === null) onClose();
      else setPreview(res.data);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on open
  }, []);

  async function changePolicy(next: BudgetImportPolicy) {
    setPolicy(next);
    if (!preview) return;
    const res = await window.api.budgets.importPreview({ previewId: preview.previewId, policy: next });
    if (res.ok && res.data) setPreview(res.data);
    else if (!res.ok) setMessage({ kind: "error", text: res.error.message });
  }

  async function commit() {
    if (!preview) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await window.api.budgets.importCommit({ previewId: preview.previewId, policy });
      if (!res.ok) {
        setMessage({ kind: "error", text: res.error.message });
        return;
      }
      onImported();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  const counts = preview?.counts;
  return (
    <ModalShell
      id="import-budgets-title"
      title="Import saved budgets"
      subtitle={preview ? preview.fileName : "Choose a CSV file with Month, Category and Budget columns."}
      wide
      onClose={onClose}
      footer={
        <>
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="button button--primary"
            disabled={busy || !preview || preview.writable === 0}
            onClick={() => void commit()}
          >
            <Upload size={16} />
            {preview ? `Import ${preview.writable} rows` : "Import"}
          </button>
        </>
      }
    >
      {busy && !preview && <p className={styles["budget-hint"]}>Waiting for a file…</p>}
      {message && <p className="form-error">{message.text}</p>}
      {preview && counts && (
        <>
          <p className={styles["budget-hint"]}>
            {counts.new} new, {counts.changed} changed, {counts.unchanged} unchanged, {counts.skipped} skipped,{" "}
            {counts.invalid} invalid. Invalid rows are not imported.
          </p>
          <Field label="When a month already has saved budgets">
            <SegmentedControl
              label="Import policy"
              options={[
                { label: "Overwrite matching rows", value: "overwrite" },
                { label: "Skip those months", value: "skip-existing-months" },
              ]}
              value={policy}
              onChange={(value) => void changePolicy(value as BudgetImportPolicy)}
            />
          </Field>
          <div className={styles["budget-import-table"]}>
            <table>
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Month</th>
                  <th>Category</th>
                  <th>Budget</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => (
                  <tr key={row.line} className={row.status === "invalid" ? styles["budget-import-row--invalid"] : undefined}>
                    <td>{row.line}</td>
                    <td>{row.month}</td>
                    <td>{row.category}</td>
                    <td>{row.budget === null ? "—" : formatMoney(row.budget)}</td>
                    <td>
                      {STATUS_LABEL[row.status]}
                      {row.status === "changed" && row.previousBudget !== undefined
                        ? ` (was ${formatMoney(row.previousBudget)})`
                        : ""}
                      {row.reason ? `: ${row.reason}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.truncated && <p className={styles["budget-hint"]}>Showing the first {preview.rows.length} rows.</p>}
          </div>
        </>
      )}
    </ModalShell>
  );
}

// ── Action bar ──────────────────────────────────────────────────────────────

export type BudgetModal = "save" | "edit" | "export" | "import" | null;

/** Buttons shown in Saved mode, above the budget table. */
export function BudgetActions({ onOpen }: { onOpen: (modal: Exclude<BudgetModal, null>) => void }) {
  return (
    <div className={styles["budget-actions"]}>
      <button type="button" className="button" onClick={() => onOpen("save")}>
        <Save size={16} />
        Save budgets for this month
      </button>
      <button type="button" className="button" onClick={() => onOpen("edit")}>
        <Pencil size={16} />
        Edit budgets
      </button>
      <button type="button" className="button" onClick={() => onOpen("import")}>
        <Upload size={16} />
        Import CSV
      </button>
      <button type="button" className="button" onClick={() => onOpen("export")}>
        <Download size={16} />
        Export
      </button>
    </div>
  );
}

// ── Settings ────────────────────────────────────────────────────────────────

/** Settings panel body: export or import every saved month at once (no month or range to choose). */
export function SavedBudgetsSettings({ onImported }: { onImported?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
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
        setMessage({ kind: "info", text: `Exported ${res.data.rows ?? 0} saved budgets to ${res.data.path}.` });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="settings-row">
        <div style={{ flex: 1 }}>
          <p className="settings-toggle__title">Monthly budgets</p>
          <p className="settings-toggle__hint">
            Export every saved month in one CSV file, or import a file to add or update saved budgets for all the months in
            it. Saved budgets live on this computer only and are not synced to Notion, so keep an export as a copy.
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
          <button type="button" className="button" disabled={busy} onClick={() => setImportOpen(true)}>
            <Upload size={16} />
            Import budgets…
          </button>
        </div>
      </div>
      {importOpen && (
        <ImportBudgetsModal
          onClose={() => setImportOpen(false)}
          onImported={() => {
            setMessage({ kind: "info", text: "Imported. Monitoring shows the new saved budgets when its source is Saved." });
            onImported?.();
          }}
        />
      )}
    </>
  );
}
