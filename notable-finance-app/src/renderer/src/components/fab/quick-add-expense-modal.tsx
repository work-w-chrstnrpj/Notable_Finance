import { useEffect, useState } from "react";
import { useLiveCollections } from "@/components/hooks";
import { useFinanceInvalidation } from "@/lib/use-data";
import { Field, ComputedField, FormSectionDivider } from "@/components/ui";
import { FormModal } from "@/components/ui/form-modals";
import { applyNotionTag, parseNumberInput, parseOptionalNumberInput } from "@/lib/finance-helpers";
import {
  calculateGrossPrice,
  calculateInstallmentAmount,
  calculatePaidAmount,
  calculateRemainingBalance,
  calculateExpectedPaymentDate,
  calculatePasabuyReceivedAmount,
  calculatePasabuyerBalance,
  getExpenseConditionalSections,
  pasabuyerLabels,
  pasabuyStatusLabels,
  paymentFrequencyLabels,
  paymentStatusLabels,
} from "@/lib/finance-rules";
import { formatDate, formatMoney, toYYMMDD } from "@/lib/format";
import { emitDataChanged } from "@/lib/finance-events";
import { todayIso } from "@/lib/date-range";
import { expensesApi } from "@/lib/api-client";
import type { PasabuyStatus, PaymentFrequency, PaymentStatus } from "@/types/finance";

/**
 * Quick-add Expense modal for the FAB (refactor_development_plan.md Phase 6.3 — pure move
 * out of fab/index.tsx, unchanged). Intentionally self-contained so the working Expense page
 * stays untouched — money math is shared via finance-rules, only the form layout is
 * duplicated here.
 */
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
    periodCount,
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
      paymentStatus: sections.creditCard ? paymentStatus || "Unpaid" : paymentStatus || null,
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

export { QuickAddExpenseModal };
