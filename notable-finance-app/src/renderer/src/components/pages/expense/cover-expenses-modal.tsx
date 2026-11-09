import { useEffect, useState } from "react";
import { Field } from "@/components/ui";
import { useLiveCollections } from "@/components/hooks";
import { creditCardPaymentsApi } from "@/lib/api-client";
import { stripNotionTag, parseNumberInput } from "@/lib/finance-helpers";
import { todayIso } from "@/lib/date-range";
import { formatDate } from "@/lib/format";
import type { IncomeRecord } from "@/types/finance";

// ── Cover Expenses Modal (Issue #7) ─────────────────────────────────────────

function CoverExpensesModal({
  open,
  selectedExpenseIds,
  onClose,
  onCovered,
}: {
  open: boolean;
  selectedExpenseIds: string[];
  onClose: () => void;
  onCovered: () => void;
}) {
  const { creditActiveAccounts, nonCreditActiveAccounts } = useLiveCollections();
  const [ccPayments, setCcPayments] = useState<IncomeRecord[]>([]);
  const [selectedCcPaymentId, setSelectedCcPaymentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("CC Payment — ");
  const [newDate, setNewDate] = useState(() => todayIso());
  const [newCcAccountId, setNewCcAccountId] = useState("");
  const [newPayerAccountId, setNewPayerAccountId] = useState("");
  const [newAmount, setNewAmount] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError(null);
    setCcPayments([]);
    setSelectedCcPaymentId("");
    setShowCreateForm(false);
    creditCardPaymentsApi.list({}).then((res) => {
      if (!active) return;
      if (res.success) {
        setCcPayments(res.data.filter((r) => !r.deleted && !r.name?.includes("[Deleted:")));
      } else {
        setError("Failed to load CC Payment records.");
      }
    }).catch(() => {
      if (active) setError("Network error loading CC Payment records.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [open]);

  async function handleCover() {
    if (!selectedCcPaymentId) {
      setError("Select a CC Payment receipt or create a new one.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await creditCardPaymentsApi.update(selectedCcPaymentId, {
        addCcPaymentCoveredIds: selectedExpenseIds,
      });
      if (!res.success) {
        setError(res.error.message || "Failed to cover expenses.");
        return;
      }
      onCovered();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateAndCover() {
    if (!newName.trim() || !newDate || !newCcAccountId) {
      setError("Name, Date, and CC Account are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const createRes = await creditCardPaymentsApi.create({
        name: newName.trim(),
        date: newDate,
        grossIncome: parseNumberInput(newAmount),
        accountId: newCcAccountId,
        transactedAccountId: newPayerAccountId || null,
        ccPaymentCoveredIds: selectedExpenseIds,
        // Category is set server-side via the workflow view parameter
      });
      if (!createRes.success) {
        setError(createRes.error.message || "Failed to create CC Payment.");
        return;
      }
      onCovered();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="cover-title">
        <div className="modal-panel__header">
          <div>
            <h2 id="cover-title">Cover {selectedExpenseIds.length} Expense{selectedExpenseIds.length > 1 ? "s" : ""}</h2>
            <p>Add a CC Payment receipt to the selected expenses. Each expense can have multiple receipts.</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose} disabled={saving}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="modal-panel__body">
          {error && <p className="mass-edit-error" style={{ marginBottom: "0.75rem" }}>{error}</p>}

          {!showCreateForm ? (
            <>
              {/* Existing CC Payments list */}
              <div className="form-grid form-grid--single" style={{ marginBottom: "1rem" }}>
                <div role="group" aria-label="Select a CC Payment Receipt">
                    {/* Header row: label + [+] button */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--ink)" }}>Available Receipts</span>
                      <button
                        type="button"
                        className="button button--ghost"
                        title="Create a new CC Payment record"
                        onClick={() => {
                          setShowCreateForm(true);
                          setSelectedCcPaymentId("");
                        }}
                        disabled={saving}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem", padding: "0.25rem 0.5rem" }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        New
                      </button>
                    </div>

                    {/* Scrollable CC Payment list */}
                    {loading ? (
                      <p style={{ color: "var(--ink-muted)", fontSize: "0.8125rem" }}>Loading CC Payment records...</p>
                    ) : ccPayments.length === 0 ? (
                      <p style={{ color: "var(--ink-muted)", fontSize: "0.8125rem" }}>No CC Payment records found.</p>
                    ) : (
                      <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1px" }}>
                        {ccPayments.map((cp) => {
                          const alreadyLinked = selectedExpenseIds.every((id) => cp.ccPaymentCoveredIds?.includes(id));
                          return (
                            <label
                              key={cp.id}
                              style={{
                                display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.25rem 0.375rem",
                                borderRadius: 3, cursor: "pointer",
                                background: selectedCcPaymentId === cp.id ? "var(--blue-soft, #dbeafe)" : "transparent",
                              }}
                            >
                              <input
                                type="radio"
                                name="cover-cc-payment"
                                checked={selectedCcPaymentId === cp.id}
                                disabled={saving || alreadyLinked}
                                onChange={() => setSelectedCcPaymentId(cp.id)}
                              />
                              <span style={{ flex: 1, fontSize: "0.8125rem", lineHeight: 1.3 }}>{stripNotionTag(cp.name)}{alreadyLinked && " (Already linked)"}</span>
                              <span style={{ fontSize: "0.6875rem", color: "var(--ink-muted)", flexShrink: 0 }}>{formatDate(cp.date)}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                </div>
              </div>

            </>
          ) : (
            <>
              {/* New CC Payment form */}
              <p style={{ fontSize: "0.875rem", color: "var(--ink-muted)", marginBottom: "0.75rem" }}>
                The new CC Payment will be created and the {selectedExpenseIds.length} selected expense{selectedExpenseIds.length > 1 ? "s" : ""} will be linked to it.
              </p>
              <div className="form-grid form-grid--single">
                <Field label="Name" required>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="CC Payment — ..." />
                </Field>
                <Field label="Date" required>
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                </Field>
                <Field label="CC Account" required>
                  <select value={newCcAccountId} onChange={(e) => setNewCcAccountId(e.target.value)}>
                    <option value="">— Select —</option>
                    {creditActiveAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Payment Amount">
                  <input inputMode="decimal" placeholder="0.00" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
                </Field>
                <Field label="Payer Account">
                  <select value={newPayerAccountId} onChange={(e) => setNewPayerAccountId(e.target.value)}>
                    <option value="">— None —</option>
                    {nonCreditActiveAccounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  className="button"
                  onClick={() => setShowCreateForm(false)}
                  disabled={saving}
                >
                  Back to existing records
                </button>
              </div>
            </>
          )}
        </div>

        <div className="modal-panel__footer">
          <button type="button" className="button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="button button--primary"
            onClick={showCreateForm ? handleCreateAndCover : handleCover}
            disabled={saving || (!showCreateForm && !selectedCcPaymentId)}
          >
            {saving ? "Saving..." : showCreateForm ? "Create & Cover" : "Cover"}
          </button>
        </div>
      </section>
    </div>
  );
}

export { CoverExpensesModal };
