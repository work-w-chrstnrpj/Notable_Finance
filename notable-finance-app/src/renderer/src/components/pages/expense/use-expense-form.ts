import { useState } from "react";
import {
  calculateGrossPrice,
  calculateInstallmentAmount,
  calculatePaidAmount,
  calculateRemainingBalance,
  calculateExpectedPaymentDate,
  calculatePasabuyReceivedAmount,
  calculatePasabuyerBalance,
  getExpenseConditionalSections,
} from "@/lib/finance-rules";
import { parseNumberInput, parseOptionalNumberInput } from "@/lib/finance-helpers";
import { todayIso } from "@/lib/date-range";
import { incomesApi } from "@/lib/api-client";
import type {
  Account,
  ExpenseRecord,
  ExpenseViewMode,
  PasabuyStatus,
  PaymentFrequency,
  PaymentStatus,
} from "@/types/finance";

/**
 * All state, derived figures and automations for the Expense record form
 * (refactor_development_plan.md F1, Phase 4.2). Lifted verbatim out of expense.tsx — the
 * two automation handlers are real domain rules and move intact.
 *
 * Kept as loose individual fields rather than one form object: every field is read and set
 * independently by the modal's inputs, so collapsing them would be a behaviour-surface
 * change rather than a pure lift.
 */
export function useExpenseForm({
  viewMode,
  activeAccounts,
  expenseCategoryNameById,
}: {
  viewMode: ExpenseViewMode;
  activeAccounts: Account[];
  expenseCategoryNameById: Map<string, string>;
}) {
  const [descriptionInput, setDescriptionInput] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [purchaseDateInput, setPurchaseDateInput] = useState("");
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

  const [shakeFields, setShakeFields] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkedIncomeName, setLinkedIncomeName] = useState<string | null>(null);
  const [automationNotice, setAutomationNotice] = useState<string | null>(null);

  const selectedFormAccount = activeAccounts.find((account) => account.id === formAccountId);
  const accountType = selectedFormAccount?.type ?? "Cash";
  const categoryName = expenseCategoryNameById.get(formCategoryId) ?? "";

  const sections = getExpenseConditionalSections({ accountType, viewMode, categoryName });

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

  // ── Form automations (user-triggered only; record-load uses setters directly) ──

  /** CC Payment Status change → auto-fill dependent fields. */
  function onSelectPaymentStatus(next: PaymentStatus | "") {
    const prev = paymentStatus;
    setPaymentStatus(next);
    if (!sections.creditCard) return;
    if (next === "Unpaid") {
      // A fresh unpaid CC purchase defaults to a single monthly, no interest.
      setInterestInput("0.00");
      setPaymentFrequency("Monthly");
      setPeriodCountInput("1");
      setAutomationNotice("Auto-filled: Interest ₱0.00 · Monthly · Period Count 1");
    } else if (next === "Paid" && (prev === "Unpaid" || periodCount === 1)) {
      // A non-installment (or single-period) CC purchase marked Paid is settled
      // in one period, today. Installments with more periods are left untouched.
      setPaidPeriodInput("1");
      setDatePaidInput(todayIso());
      setAutomationNotice("Auto-filled: Paid Period 1 · Date Paid today");
    }
  }

  /** Pasabuy Status change → auto-fill when fully received in a single period. */
  function onSelectPasabuyStatus(next: PasabuyStatus | "") {
    setPasabuyStatus(next);
    if (!sections.pasabuy) return;
    if (next === "Payment fully received" && periodCount === 1) {
      setPasabuyPaidPeriodInput("1");
      setPasabuyDateOfPaymentInput(todayIso());
      setAutomationNotice("Auto-filled: Pasabuy Paid Period 1 · Date of Payment today");
    }
  }

  /**
   * Seed every field from `record` (or clear for a new entry). `defaultCategoryId` /
   * `defaultAccountId` carry the page's current filter context for the new-record case.
   */
  function loadRecord(
    record: ExpenseRecord | undefined,
    defaults: { accountId: string; categoryId: string },
  ) {
    setDescriptionInput(record?.description ?? "");
    setFormAccountId(record?.accountId ?? defaults.accountId);
    setFormCategoryId(record?.categoryId ?? defaults.categoryId);
    setPurchaseDateInput(record?.purchaseDate ?? "");
    setDatePaidInput(record?.datePaid ?? "");
    setExpenseAmountInput(record?.amount?.toString() ?? "");
    setInterestInput(record?.interest?.toString() ?? "");
    setPaymentStatus(record?.paymentStatus ?? "");
    setPaymentFrequency(record?.paymentFrequency ?? "");
    setPeriodCountInput(record?.periodCount?.toString() ?? "");
    setPaidPeriodInput(record?.paidPeriod?.toString() ?? "");
    setPasabuyer(record?.pasabuyer ?? "");
    setPasabuyStatus(record?.pasabuyStatus ?? "");
    setPasabuyDateOfPaymentInput(record?.pasabuyDateOfPayment ?? "");
    setPasabuyPaidPeriodInput(record?.pasabuyPaidPeriod?.toString() ?? "");
    setPasabuyAccountReceiverId(record?.pasabuyAccountReceiverId ?? "");
    setEditingId(record?.id ?? null);
    // Look up linked CC Payment income name
    if (record?.ccLinkPaymentReceiptId) {
      incomesApi
        .detail(record.ccLinkPaymentReceiptId)
        .then((res) => {
          setLinkedIncomeName(res.success ? res.data.name : null);
        })
        .catch(() => setLinkedIncomeName(null));
    } else {
      setLinkedIncomeName(null);
    }
  }

  /**
   * Required-field check. Returns true when valid; on failure sets the shake fields and
   * clears them after the animation, exactly as the inline version did.
   */
  function validate(): boolean {
    const invalid = new Set<string>();
    if (!descriptionInput.trim()) invalid.add("description");
    if (!formAccountId) invalid.add("account");
    if (!formCategoryId) invalid.add("category");
    if (!expenseAmountInput || parseNumberInput(expenseAmountInput) <= 0) invalid.add("amount");
    if (invalid.size > 0) {
      setShakeFields(invalid);
      // Auto-clear shake after animation
      setTimeout(() => setShakeFields(new Set()), 600);
      return false;
    }
    return true;
  }

  function buildPayload(): Record<string, unknown> {
    return {
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
    };
  }

  return {
    // fields
    descriptionInput, setDescriptionInput,
    formAccountId, setFormAccountId,
    formCategoryId, setFormCategoryId,
    purchaseDateInput, setPurchaseDateInput,
    datePaidInput, setDatePaidInput,
    expenseAmountInput, setExpenseAmountInput,
    interestInput, setInterestInput,
    paymentStatus, setPaymentStatus,
    paymentFrequency, setPaymentFrequency,
    periodCountInput, setPeriodCountInput,
    paidPeriodInput, setPaidPeriodInput,
    pasabuyer, setPasabuyer,
    pasabuyStatus, setPasabuyStatus,
    pasabuyDateOfPaymentInput, setPasabuyDateOfPaymentInput,
    pasabuyPaidPeriodInput, setPasabuyPaidPeriodInput,
    pasabuyAccountReceiverId, setPasabuyAccountReceiverId,
    // record binding
    editingId, setEditingId,
    linkedIncomeName,
    shakeFields,
    // derived
    sections,
    selectedFormAccount,
    grossPrice,
    installmentAmount,
    paidAmount,
    remainingBalance,
    expectedPaymentDate,
    pasabuyReceivedAmount,
    pasabuyerBalance,
    // automations
    automationNotice, setAutomationNotice,
    onSelectPaymentStatus,
    onSelectPasabuyStatus,
    // operations
    loadRecord,
    validate,
    buildPayload,
  };
}
