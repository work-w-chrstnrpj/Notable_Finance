"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Camera, Plus, Printer, Receipt } from "lucide-react";
import { useLiveCollections } from "@/components/hooks";
import { useFinanceInvalidation } from "@/lib/use-data";
import { useAuth } from "@/lib/auth-context";
import { useFabExport, type ReceiptContext } from "@/lib/fab-export-context";
import { downloadNodeAsPng, nodeToPngDataUrl, printNode } from "@/lib/export-node";
import { ExportModalShell } from "@/components/export/export-modal-shell";
import { Field, ComputedField, FormSectionDivider, LoadingBlock, EmptyState } from "@/components/ui";
import { FormModal } from "@/components/ui/form-modals";
import { applyIncomeTag, applyNotionTag, cx, parseNumberInput, parseOptionalNumberInput } from "@/lib/finance-helpers";
import { calculateNetIncome, calculateGrossPrice, calculateInstallmentAmount, calculatePaidAmount, calculateRemainingBalance, calculateExpectedPaymentDate, calculatePasabuyReceivedAmount, calculatePasabuyerBalance, getExpenseConditionalSections, getMoneyValueTone, pasabuyerLabels, pasabuyStatusLabels, paymentFrequencyLabels, paymentStatusLabels } from "@/lib/finance-rules";
import { formatDate, formatMoney, toYYMMDD } from "@/lib/format";
import { emitDataChanged } from "@/lib/finance-events";
import { todayIso } from "@/lib/date-range";
import { incomesApi, expensesApi } from "@/lib/api-client";
import type { FinanceSectionId, PasabuyStatus, PaymentFrequency, PaymentStatus } from "@/types/finance";

// ── Floating action button ────────────────────────────────────────────

type FabModalKind = "income" | "expense" | "receipt" | "insight" | null;

function WorkspaceFab({
  activeSection,
  selectedDate,
}: {
  activeSection: FinanceSectionId;
  selectedDate: string;
}) {
  const { receipt, insight } = useFabExport();
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<FabModalKind>(null);

  const canPrintReceipt = activeSection === "expense" && receipt !== null;
  const canShotInsight = activeSection === "monthly-monitoring" && insight !== null;

  function choose(kind: Exclude<FabModalKind, null>) {
    setOpen(false);
    setModal(kind);
  }

  return (
    <>
      <div className="fab">
        {open && (
          <div className="fab__menu" role="menu">
            <button type="button" className="fab__action" onClick={() => choose("income")}>
              <span className="fab__action-label">Add New Income</span>
              <span className="fab__action-icon fab__action-icon--income">
                <ArrowUpRight size={18} />
              </span>
            </button>
            <button type="button" className="fab__action" onClick={() => choose("expense")}>
              <span className="fab__action-label">Add New Expense</span>
              <span className="fab__action-icon fab__action-icon--expense">
                <Receipt size={18} />
              </span>
            </button>
            {canPrintReceipt && (
              <button type="button" className="fab__action" onClick={() => choose("receipt")}>
                <span className="fab__action-label">Print Receipt</span>
                <span className="fab__action-icon">
                  <Printer size={18} />
                </span>
              </button>
            )}
            {canShotInsight && (
              <button type="button" className="fab__action" onClick={() => choose("insight")}>
                <span className="fab__action-label">Monthly Insight Shot</span>
                <span className="fab__action-icon">
                  <Camera size={18} />
                </span>
              </button>
            )}
          </div>
        )}
        <button
          type="button"
          className={cx("fab__toggle", open && "fab__toggle--open")}
          aria-label={open ? "Close quick actions" : "Open quick actions"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Plus size={24} />
        </button>
      </div>

      {open && (
        <div
          className="fab__backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        />
      )}

      {modal === "income" && (
        <QuickAddIncomeModal onClose={() => setModal(null)} />
      )}
      {modal === "expense" && (
        <QuickAddExpenseModal
          selectedDate={selectedDate}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "receipt" && receipt && (
        <ReceiptModal receipt={receipt} onClose={() => setModal(null)} />
      )}
      {modal === "insight" && insight && (
        <InsightShotModal insight={insight} onClose={() => setModal(null)} />
      )}
    </>
  );
}

// ── Quick-add modals (mirror the Income/Expense page forms) ────────────
// These are intentionally self-contained so the working Income/Expense pages
// stay untouched. All money math is shared via finance-rules — only the form
// layout is duplicated here.

function QuickAddIncomeModal({ onClose }: { onClose: () => void }) {
  const { nonCreditActiveAccounts, normalIncomeCategories } = useLiveCollections();
  const { invalidateIncomeFamily } = useFinanceInvalidation();
  const [nameInput, setNameInput] = useState("");
  const [dateInput, setDateInput] = useState(() => todayIso());
  const [formAccountId, setFormAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [grossIncomeInput, setGrossIncomeInput] = useState("");
  const [capitalExpenditureInput, setCapitalExpenditureInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-update [YYMMDD] tag when date changes.
  useEffect(() => {
    const yyymmdd = toYYMMDD(dateInput);
    if (!yyymmdd) return;
    setNameInput((prev) => applyIncomeTag(prev, yyymmdd));
  }, [dateInput]);

  const calculatedNetIncome = calculateNetIncome(
    parseNumberInput(grossIncomeInput),
    parseNumberInput(capitalExpenditureInput),
  );

  async function handleSave() {
    if (!nameInput.trim() || !dateInput) {
      setSaveError("Name and date are required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const res = await incomesApi.create({
      name: nameInput.trim(),
      date: dateInput,
      grossIncome: parseNumberInput(grossIncomeInput),
      capitalExpenditure: parseNumberInput(capitalExpenditureInput),
      accountId: formAccountId,
      categoryId: formCategoryId,
    });
    setSaving(false);
    if (!res.success) {
      setSaveError(res.error.message || "Failed to save to Notion.");
      return;
    }
    emitDataChanged();
    invalidateIncomeFamily();
    onClose();
  }

  return (
    <FormModal
      deleteLabel="Soft Delete"
      modal={{ mode: "new", title: "New Income" }}
      editing
      saving={saving}
      error={saveError}
      subtitle="Net income updates from gross income less capital expenditure."
      onEdit={() => {}}
      onSave={handleSave}
      onDelete={() => {}}
      onClose={onClose}
    >
      <div className="form-grid form-grid--single">
        <Field label="Name">
          <input
            placeholder="Income title"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            value={dateInput}
            onChange={(event) => setDateInput(event.target.value)}
          />
        </Field>
        <Field label="Gross Income">
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={grossIncomeInput}
            onChange={(event) => setGrossIncomeInput(event.target.value)}
          />
        </Field>
        <Field label="Capital Expenditure">
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={capitalExpenditureInput}
            onChange={(event) => setCapitalExpenditureInput(event.target.value)}
          />
        </Field>
        <Field label="Accounts">
          <select value={formAccountId} onChange={(event) => setFormAccountId(event.target.value)}>
            <option value="">— None —</option>
            {nonCreditActiveAccounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Categories">
          <select value={formCategoryId} onChange={(event) => setFormCategoryId(event.target.value)}>
            <option value="">— None —</option>
            {normalIncomeCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.source}</option>
            ))}
          </select>
        </Field>
        <ComputedField
          label="Net Income"
          value={formatMoney(calculatedNetIncome)}
          valueTone={getMoneyValueTone(calculatedNetIncome)}
        />
      </div>
    </FormModal>
  );
}

function QuickAddExpenseModal({
  selectedDate,
  onClose,
}: {
  selectedDate: string;
  onClose: () => void;
}) {
  const { activeAccounts, expenseCategories, expenseCategoryNameById } =
    useLiveCollections();
  const { invalidateExpenseFamily } = useFinanceInvalidation();
  const [descriptionInput, setDescriptionInput] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [purchaseDateInput, setPurchaseDateInput] = useState(() =>
    selectedDate || todayIso(),
  );
  const [datePaidInput, setDatePaidInput] = useState("");
  const [expenseAmountInput, setExpenseAmountInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("");
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency | "">("");
  const [periodCountInput, setPeriodCountInput] = useState("");
  const [paidPeriodInput, setPaidPeriodInput] = useState("");
  const [pasabuyer, setPasabuyer] = useState("");
  const [pasabuyStatus, setPasabuyStatus] = useState<PasabuyStatus | "">("");
  const [pasabuyDateOfPaymentInput, setPasabuyDateOfPaymentInput] = useState("");
  const [pasabuyPaidPeriodInput, setPasabuyPaidPeriodInput] = useState("");
  const [pasabuyAccountReceiverId, setPasabuyAccountReceiverId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Auto-update [YYMMDDx] tag when purchase date changes.
  useEffect(() => {
    const yyymmdd = toYYMMDD(purchaseDateInput);
    if (!yyymmdd) return;
    setDescriptionInput((prev) => applyNotionTag(prev, yyymmdd));
  }, [purchaseDateInput]);

  const selectedFormAccount = activeAccounts.find((a) => a.id === formAccountId);
  const accountType = selectedFormAccount?.type ?? "Cash";
  const categoryName = expenseCategoryNameById.get(formCategoryId) ?? "";
  const sections = getExpenseConditionalSections({
    accountType,
    viewMode: "Monthly",
    categoryName,
  });
  const expenseAmount = parseNumberInput(expenseAmountInput);
  const interestAmount = sections.creditCard ? parseNumberInput(interestInput) : 0;
  const periodCount = parseOptionalNumberInput(periodCountInput);
  const paidPeriod = parseOptionalNumberInput(paidPeriodInput);
  const pasabuyPaidPeriod = parseOptionalNumberInput(pasabuyPaidPeriodInput);
  const grossPrice = calculateGrossPrice(expenseAmount, interestAmount);
  const installmentAmount = calculateInstallmentAmount({
    grossPrice,
    paymentStatus,
    periodCount,
  });
  const paidAmount = calculatePaidAmount({
    grossPrice,
    paymentStatus,
    installmentAmount,
    paidPeriod,
  });
  const remainingBalance = calculateRemainingBalance(grossPrice, paidAmount);
  const expectedPaymentDate = calculateExpectedPaymentDate({
    purchaseDate: purchaseDateInput,
    billingDay: selectedFormAccount?.billingDay ?? null,
    dueDay: selectedFormAccount?.dueDay ?? null,
  });
  const pasabuyReceivedAmount = calculatePasabuyReceivedAmount({
    grossPrice,
    pasabuyStatus,
    installmentAmount,
    pasabuyPaidPeriod,
    periodCount,
  });
  const pasabuyerBalance = calculatePasabuyerBalance(grossPrice, pasabuyReceivedAmount);

  async function handleSave() {
    if (!descriptionInput.trim()) {
      setSaveError("Description is required.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    const res = await expensesApi.create({
      description: descriptionInput.trim(),
      purchaseDate: purchaseDateInput,
      datePaid: datePaidInput || null,
      amount: parseNumberInput(expenseAmountInput),
      interest: parseNumberInput(interestInput),
      accountId: formAccountId,
      categoryId: formCategoryId,
      paymentStatus: paymentStatus || "Unpaid",
      paymentFrequency: paymentFrequency || null,
      periodCount: parseOptionalNumberInput(periodCountInput),
      paidPeriod: parseOptionalNumberInput(paidPeriodInput),
      pasabuyer: pasabuyer || null,
      pasabuyStatus: pasabuyStatus || null,
      pasabuyDateOfPayment: pasabuyDateOfPaymentInput || null,
      pasabuyPaidPeriod: parseOptionalNumberInput(pasabuyPaidPeriodInput),
      pasabuyAccountReceiverId: pasabuyAccountReceiverId || null,
    });
    setSaving(false);
    if (!res.success) {
      setSaveError(res.error.message || "Failed to save to Notion.");
      return;
    }
    emitDataChanged();
    invalidateExpenseFamily();
    onClose();
  }

  return (
    <FormModal
      deleteLabel="Soft Delete"
      modal={{ mode: "new", title: "New Expense" }}
      editing
      saving={saving}
      error={saveError}
      subtitle="Context fields change from the selected account and category."
      onEdit={() => {}}
      onSave={handleSave}
      onDelete={() => {}}
      onClose={onClose}
    >
      <div className="form-grid form-grid--single">
        <Field label="Purchase description">
          <input
            placeholder="Purchase description"
            value={descriptionInput}
            onChange={(event) => setDescriptionInput(event.target.value)}
          />
        </Field>
        <Field label="Purchase Date">
          <input
            type="date"
            value={purchaseDateInput}
            onChange={(event) => setPurchaseDateInput(event.target.value)}
          />
        </Field>
        <Field label="Accounts">
          <select value={formAccountId} onChange={(event) => setFormAccountId(event.target.value)}>
            <option value="">— None —</option>
            {activeAccounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Categories">
          <select value={formCategoryId} onChange={(event) => setFormCategoryId(event.target.value)}>
            <option value="">— None —</option>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Expense Amount">
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={expenseAmountInput}
            onChange={(event) => setExpenseAmountInput(event.target.value)}
          />
        </Field>
        <Field label="Date Paid">
          <input
            type="date"
            value={datePaidInput}
            onChange={(event) => setDatePaidInput(event.target.value)}
          />
        </Field>
        {sections.creditCard && (
          <>
            <FormSectionDivider title="CC Transaction" />
            <Field label="Payment Status">
              <select
                value={paymentStatus}
                onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}
              >
                <option value="">— None —</option>
                {paymentStatusLabels.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </Field>
            <Field label="Interest">
              <input
                inputMode="decimal"
                placeholder="0.00"
                value={interestInput}
                onChange={(event) => setInterestInput(event.target.value)}
              />
            </Field>
            <ComputedField label="Gross Price" value={formatMoney(grossPrice)} />
            <Field label="Payment Frequency">
              <select
                value={paymentFrequency}
                onChange={(event) => setPaymentFrequency(event.target.value as PaymentFrequency)}
              >
                <option value="">— None —</option>
                {paymentFrequencyLabels.map((frequency) => (
                  <option key={frequency} value={frequency}>{frequency}</option>
                ))}
              </select>
            </Field>
            <Field label="Period Count">
              <input
                inputMode="numeric"
                placeholder="0"
                value={periodCountInput}
                onChange={(event) => setPeriodCountInput(event.target.value)}
              />
            </Field>
            {paymentStatus === "Installment" && installmentAmount !== null && (
              <ComputedField label="Installment Amount" value={formatMoney(installmentAmount)} />
            )}
            <Field label="Paid period">
              <input
                inputMode="numeric"
                placeholder="0"
                value={paidPeriodInput}
                onChange={(event) => setPaidPeriodInput(event.target.value)}
              />
            </Field>
            <ComputedField label="Paid Amount" value={formatMoney(paidAmount)} />
            <ComputedField label="Remaining Balance" value={formatMoney(remainingBalance)} />
            <ComputedField
              label="Expected payment date"
              value={expectedPaymentDate ? formatDate(expectedPaymentDate) : "-"}
            />
          </>
        )}
        {sections.pasabuy && (
          <>
            <FormSectionDivider title="Pasabuy Transaction" />
            <Field label="Pasabuyer">
              <select value={pasabuyer} onChange={(event) => setPasabuyer(event.target.value)}>
                <option value="">— None —</option>
                {pasabuyerLabels.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </Field>
            <Field label="Pasabuy Status">
              <select
                value={pasabuyStatus}
                onChange={(event) => setPasabuyStatus(event.target.value as PasabuyStatus)}
              >
                <option value="">— None —</option>
                {pasabuyStatusLabels.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </Field>
            <Field label="Pasabuy Date of Payment">
              <input
                type="date"
                value={pasabuyDateOfPaymentInput}
                onChange={(event) => setPasabuyDateOfPaymentInput(event.target.value)}
              />
            </Field>
            <Field label="Pasabuy Account Receiver">
              <select
                value={pasabuyAccountReceiverId}
                onChange={(event) => setPasabuyAccountReceiverId(event.target.value)}
              >
                <option value="">— None —</option>
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Pasabuy paid period">
              <input
                inputMode="numeric"
                placeholder="0"
                value={pasabuyPaidPeriodInput}
                onChange={(event) => setPasabuyPaidPeriodInput(event.target.value)}
              />
            </Field>
            <ComputedField label="Pasabuy Received Amount" value={formatMoney(pasabuyReceivedAmount)} />
            <ComputedField label="Pasabuyer Balance" value={formatMoney(pasabuyerBalance)} />
          </>
        )}
      </div>
    </FormModal>
  );
}

// ── Print Receipt ─────────────────────────────────────────────────────

function ReceiptModal({
  receipt,
  onClose,
}: {
  receipt: ReceiptContext;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const surfaceRef = useRef<HTMLDivElement>(null);

  return (
    <ExportModalShell
      title="Print Receipt"
      subtitle="Export the current expense view as a receipt."
      onClose={onClose}
      onPrint={() => surfaceRef.current && printNode(surfaceRef.current)}
      onSaveImage={() =>
        surfaceRef.current && downloadNodeAsPng(surfaceRef.current, "notable-receipt")
      }
    >
      <div
        className={`receipt${receipt.installmentLayout ? " receipt--installment" : ""}`}
        ref={surfaceRef}
      >
        <div className="receipt__head">
          <h1 className="receipt__brand">Notable Finance Receipt</h1>
          <p className="receipt__tagline">by {user?.name ?? user?.email ?? "Guest"}</p>
          <p className="receipt__meta">{receipt.viewTitle}</p>
          <p className="receipt__meta">{receipt.periodLabel}</p>
        </div>
        <div className="receipt__rule" />
        {receipt.installmentLayout ? (
          <div className="receipt__breakdowns">
            {receipt.rows.length === 0 ? (
              <p className="receipt__empty">No items to display.</p>
            ) : (
              receipt.rows.map((row, index) => (
                <div className="receipt__breakdown" key={`${row.date}-${index}`}>
                  <span className="receipt__breakdown-label">Item name:</span>
                  <span className="receipt__breakdown-dots" />
                  <span className="receipt__breakdown-value">{row.description}</span>

                  <span className="receipt__breakdown-label">Date of Purchase:</span>
                  <span className="receipt__breakdown-dots" />
                  <span className="receipt__breakdown-value">{row.date}</span>

                  <span className="receipt__breakdown-label">Gross Amount:</span>
                  <span className="receipt__breakdown-dots" />
                  <span className="receipt__breakdown-value">{row.grossAmount ?? row.amount}</span>

                  <span className="receipt__breakdown-label receipt__breakdown-label--indent">Paid Amount:</span>
                  <span className="receipt__breakdown-dots" />
                  <span className="receipt__breakdown-value receipt__breakdown-value--green">{row.paidAmount ?? "—"}</span>

                  <span className="receipt__breakdown-label receipt__breakdown-label--indent">Remaining Balance:</span>
                  <span className="receipt__breakdown-dots" />
                  <span className="receipt__breakdown-value receipt__breakdown-value--red">{row.remainingBalance ?? "—"}</span>

                  <span className="receipt__breakdown-label">Installment Amount:</span>
                  <span className="receipt__breakdown-dots" />
                  <span className="receipt__breakdown-value">{row.installmentAmount ?? "—"}</span>

                  <span className="receipt__breakdown-label">Expected Date of Payment:</span>
                  <span className="receipt__breakdown-dots" />
                  <span className="receipt__breakdown-value">{row.expectedPaymentDate ?? "—"}</span>

                  {index < receipt.rows.length - 1 && <div className="receipt__breakdown-divider" />}
                </div>
              ))
            )}
          </div>
        ) : (
          <>
            <table className="receipt__table">
              <colgroup>
                <col className="receipt__col-date" />
                <col className="receipt__col-desc" />
                <col className="receipt__col-amount" />
              </colgroup>
              <thead>
                <tr>
                  <th>Date of Purchase</th>
                  <th>Description</th>
                  <th className="receipt__amount">{receipt.amountHeader}</th>
                </tr>
              </thead>
              <tbody>
                {receipt.rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="receipt__empty">No items to display.</td>
                  </tr>
                ) : (
                  receipt.rows.map((row, index) => (
                    <tr key={`${row.date}-${index}`}>
                      <td className="receipt__date">{row.date}</td>
                      <td>{row.description}</td>
                      <td className="receipt__amount">{row.amount}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total</td>
                  <td className="receipt__amount">{receipt.total}</td>
                </tr>
              </tfoot>
            </table>
            <div className="receipt__rule" />
            <p className="receipt__disclaimer">
              This document is electronically generated and does not require a
              signature.
            </p>
          </>
        )}
        {receipt.installmentLayout && (
          <>
            <div className="receipt__rule" />
            <div className="receipt__breakdown-total">
              <span>Total Installment Amount:</span>
              <span>{receipt.total}</span>
            </div>
            <p className="receipt__disclaimer">
              This document is electronically generated and does not require a
              signature.
            </p>
          </>
        )}
      </div>
    </ExportModalShell>
  );
}

// ── Monthly Insight Shot ──────────────────────────────────────────────

function InsightShotModal({
  insight,
  onClose,
}: {
  insight: { monthLabel: string; getNode: () => HTMLElement | null };
  onClose: () => void;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [status, setStatus] = useState<"capturing" | "ready" | "error">(
    "capturing",
  );

  useEffect(() => {
    let cancelled = false;
    const node = insight.getNode();
    if (!node) {
      queueMicrotask(() => {
        if (!cancelled) setStatus("error");
      });
      return;
    }
    nodeToPngDataUrl(node)
      .then((url) => {
        if (!cancelled) {
          setSnapshot(url);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [insight]);

  return (
    <ExportModalShell
      title="Monthly Insight Shot"
      subtitle="A clean snapshot of your monthly monitoring."
      busy={status !== "ready"}
      onClose={onClose}
      onPrint={() => surfaceRef.current && printNode(surfaceRef.current)}
      onSaveImage={() =>
        surfaceRef.current &&
        downloadNodeAsPng(surfaceRef.current, `notable-insight-${insight.monthLabel}`)
      }
    >
      {status === "capturing" && <LoadingBlock label="Building snapshot…" />}
      {status === "error" && (
        <EmptyState
          title="Couldn't build the snapshot"
          detail="Open the Monthly Monitoring view and try again."
        />
      )}
      {status === "ready" && snapshot && (
        <div className="insight-shot" ref={surfaceRef}>
          <div className="insight-shot__head">
            <span className="insight-shot__brand">NOTABLE FINANCE</span>
            <span className="insight-shot__title">Monthly Monitoring</span>
            <span className="insight-shot__month">{insight.monthLabel}</span>
          </div>
          <div className="insight-shot__body">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="insight-shot__image" src={snapshot} alt="Monthly monitoring snapshot" />
          </div>
        </div>
      )}
    </ExportModalShell>
  );
}

export { WorkspaceFab, QuickAddIncomeModal, QuickAddExpenseModal, ReceiptModal, InsightShotModal };
export type { FabModalKind };
