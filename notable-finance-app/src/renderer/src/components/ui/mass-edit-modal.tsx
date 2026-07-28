import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { Field } from "@/components/ui";
import { parseNumberInput, parseOptionalNumberInput } from "@/lib/finance-helpers";
import { todayIso } from "@/lib/date-range";

export type MassEditFieldKind = "text" | "number" | "date" | "select" | "optionalNumber" | "optionalDate";

export type MassEditFieldOption = {
  /** Patch key sent to update APIs (e.g. `grossIncome`, `accountId`). */
  key: string;
  label: string;
  kind: MassEditFieldKind;
  /** For select fields. Empty value (`""`) is allowed and mapped to null when `clearable`. */
  options?: Array<{ value: string; label: string }>;
  clearable?: boolean;
  /** Placeholder / empty option label for selects and optional dates. */
  emptyLabel?: string;
};

type RowState = {
  id: string;
  fieldKey: string;
  rawValue: string;
};

function newRow(preferredKey = ""): RowState {
  return {
    id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fieldKey: preferredKey,
    rawValue: "",
  };
}

function coerceValue(
  field: MassEditFieldOption,
  raw: string,
): string | number | null {
  switch (field.kind) {
    case "number":
      return parseNumberInput(raw);
    case "optionalNumber": {
      const n = parseOptionalNumberInput(raw);
      return n;
    }
    case "date":
      return raw;
    case "optionalDate":
      return raw.trim() ? raw : null;
    case "select":
      if (field.clearable && raw === "") return null;
      return raw;
    case "text":
    default:
      return raw;
  }
}

function MassEditModal({
  open,
  title,
  subtitle,
  fields,
  saving,
  error,
  onClose,
  onApply,
  presetRows,
  showExpensePresets = false,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  fields: MassEditFieldOption[];
  saving: boolean;
  error?: string | null;
  onClose: () => void;
  /** Called with a sparse patch of selected field → coerced values. */
  onApply: (patch: Record<string, string | number | null>) => void | Promise<void>;
  /** Pre-populate rows when the modal opens. Each entry selects a field key and fills a value. */
  presetRows?: Array<{ fieldKey: string; rawValue: string }>;
  /** Show Bulk CC Pay / Bulk Pasabuy Receive preset buttons in the footer (expense-specific). */
  showExpensePresets?: boolean;
}) {
  const [rows, setRows] = useState<RowState[]>(() => [newRow(fields[0]?.key ?? "")]);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (presetRows && presetRows.length > 0) {
      setRows(presetRows.map((p) => ({ id: newRow("").id, fieldKey: p.fieldKey, rawValue: p.rawValue })));
    } else {
      setRows([newRow(fields[0]?.key ?? "")]);
    }
    setLocalError(null);
    // Reset only when the modal opens; field catalog is stable per page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const usedKeys = useMemo(
    () => new Set(rows.map((r) => r.fieldKey).filter(Boolean)),
    [rows],
  );

  function applyPresetCCPay() {
    setRows([
      { id: newRow("paymentStatus").id, fieldKey: "paymentStatus", rawValue: "Paid" },
      { id: newRow("paidPeriod").id, fieldKey: "paidPeriod", rawValue: "1" },
      { id: newRow("datePaid").id, fieldKey: "datePaid", rawValue: todayIso() },
    ]);
  }

  function applyPresetPasabuy() {
    setRows([
      { id: newRow("pasabuyStatus").id, fieldKey: "pasabuyStatus", rawValue: "Payment fully received" },
      { id: newRow("pasabuyDateOfPayment").id, fieldKey: "pasabuyDateOfPayment", rawValue: todayIso() },
      { id: newRow("pasabuyAccountReceiverId").id, fieldKey: "pasabuyAccountReceiverId", rawValue: "" },
      { id: newRow("pasabuyPaidPeriod").id, fieldKey: "pasabuyPaidPeriod", rawValue: "1" },
    ]);
  }

  if (!open) return null;

  function fieldDef(key: string): MassEditFieldOption | undefined {
    return fields.find((f) => f.key === key);
  }

  function availableFor(row: RowState): MassEditFieldOption[] {
    return fields.filter((f) => f.key === row.fieldKey || !usedKeys.has(f.key));
  }

  function setRow(id: string, patch: Partial<RowState>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRow() {
    const next = fields.find((f) => !usedKeys.has(f.key));
    if (!next) return;
    setRows((prev) => [...prev, newRow(next.key)]);
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.id !== id)));
  }

  function handleApply() {
    setLocalError(null);
    const patch: Record<string, string | number | null> = {};
    for (const row of rows) {
      const field = fieldDef(row.fieldKey);
      if (!field) {
        setLocalError("Pick a field for every row.");
        return;
      }
      if (field.kind === "date" && !row.rawValue.trim()) {
        setLocalError(`${field.label} needs a date.`);
        return;
      }
      if (field.kind === "select" && !field.clearable && !row.rawValue) {
        setLocalError(`${field.label} needs a value.`);
        return;
      }
      if (field.kind === "number" && row.rawValue.trim() === "") {
        setLocalError(`${field.label} needs a number.`);
        return;
      }
      patch[field.key] = coerceValue(field, row.rawValue);
    }
    if (Object.keys(patch).length === 0) {
      setLocalError("Add at least one field to edit.");
      return;
    }
    void onApply(patch);
  }

  const canAddMore = usedKeys.size < fields.length;
  const displayError = localError ?? error ?? null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mass-edit-title"
      >
        <div className="modal-panel__header">
          <div>
            <h2 id="mass-edit-title">{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close"
            onClick={onClose}
            disabled={saving}
          >
            <X size={17} />
          </button>
        </div>

        <div className="modal-panel__body">
          <div className="mass-edit-list">
            {rows.map((row) => {
              const field = fieldDef(row.fieldKey);
              const choices = availableFor(row);
              return (
                <div className="mass-edit-row" key={row.id}>
                  <Field label="Field">
                    <select
                      value={row.fieldKey}
                      disabled={saving}
                      onChange={(e) =>
                        setRow(row.id, { fieldKey: e.target.value, rawValue: "" })
                      }
                    >
                      {choices.map((f) => (
                        <option key={f.key} value={f.key}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="New value">
                    {!field ? (
                      <input disabled value="" placeholder="Pick a field" />
                    ) : field.kind === "select" ? (
                      <select
                        value={row.rawValue}
                        disabled={saving}
                        onChange={(e) => setRow(row.id, { rawValue: e.target.value })}
                      >
                        {field.clearable && (
                          <option value="">{field.emptyLabel ?? "— None —"}</option>
                        )}
                        {!field.clearable && !row.rawValue && (
                          <option value="" disabled>
                            {field.emptyLabel ?? "Select…"}
                          </option>
                        )}
                        {(field.options ?? []).map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : field.kind === "date" || field.kind === "optionalDate" ? (
                      <input
                        type="date"
                        value={row.rawValue}
                        disabled={saving}
                        onChange={(e) => setRow(row.id, { rawValue: e.target.value })}
                      />
                    ) : field.kind === "number" || field.kind === "optionalNumber" ? (
                      <input
                        inputMode="decimal"
                        placeholder="0.00"
                        value={row.rawValue}
                        disabled={saving}
                        onChange={(e) => setRow(row.id, { rawValue: e.target.value })}
                      />
                    ) : (
                      <input
                        value={row.rawValue}
                        disabled={saving}
                        onChange={(e) => setRow(row.id, { rawValue: e.target.value })}
                      />
                    )}
                  </Field>

                  <button
                    type="button"
                    className="icon-button mass-edit-row__remove"
                    aria-label="Remove field"
                    disabled={saving || rows.length <= 1}
                    onClick={() => removeRow(row.id)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="button"
            disabled={saving || !canAddMore}
            onClick={addRow}
          >
            <Plus size={15} />
            Add field
          </button>

          {displayError && <p className="mass-edit-error">{displayError}</p>}
        </div>

        <div className="modal-panel__footer" style={{ justifyContent: showExpensePresets ? "space-between" : undefined }}>
          <div style={{ display: "flex", gap: "0.375rem" }}>
            {showExpensePresets && (
              <>
                <button type="button" className="button button--ghost" style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }} onClick={applyPresetCCPay} disabled={saving}>
                  Bulk CC Pay
                </button>
                <button type="button" className="button button--ghost" style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem" }} onClick={applyPresetPasabuy} disabled={saving}>
                  Bulk Pasabuy
                </button>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="button" className="button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={handleApply}
              disabled={saving}
            >
              {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
              {saving ? "Applying…" : "Apply to selected"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export { MassEditModal };
