import { useState } from "react";
import { calculateNetIncome } from "@/lib/finance-rules";
import { parseNumberInput } from "@/lib/finance-helpers";
import type { IncomeRecord } from "@/types/finance";

/**
 * All state and derived figures for the Workflow record form
 * (refactor_development_plan.md Phase 5.4 — same pattern as useIncomeForm in Phase 5.1).
 * Lifted verbatim out of workflow.tsx. Validation and payload-building stay in the page
 * component because they branch on section (transfer/CC/alkansya/receivables), unlike the
 * single-shape Income/Expense forms.
 */
export function useWorkflowForm() {
  const [workflowNameInput, setWorkflowNameInput] = useState("");
  const [workflowDateInput, setWorkflowDateInput] = useState("");
  const [receivingAccountId, setReceivingAccountId] = useState("");
  const [transactedAccountId, setTransactedAccountId] = useState("");
  const [workflowCategoryIdInput, setWorkflowCategoryIdInput] = useState("");
  const [workflowAmountInput, setWorkflowAmountInput] = useState("");
  const [workflowCapitalExpenditureInput, setWorkflowCapitalExpenditureInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [ccCoveredIds, setCcCoveredIds] = useState<string[]>([]);

  const workflowNetIncome = calculateNetIncome(
    parseNumberInput(workflowAmountInput),
    parseNumberInput(workflowCapitalExpenditureInput),
  );

  /** Seed every field from `record` (or clear for a new entry). */
  function loadRecord(
    record: IncomeRecord | undefined,
    opts: { isTransfer: boolean; isCreditCardPayment: boolean; isAlkansya: boolean; savingsCategoryId: string },
  ) {
    setWorkflowNameInput(
      record?.name ?? (opts.isTransfer ? "Transfer" : opts.isCreditCardPayment ? "CC Payment —" : ""),
    );
    setWorkflowDateInput(record?.date ?? "");
    setReceivingAccountId(record?.accountId ?? "");
    setTransactedAccountId(record?.transactedAccountId ?? "");
    // New Alkansya records default to the Savings category (editable).
    setWorkflowCategoryIdInput(record?.categoryId ?? (opts.isAlkansya ? opts.savingsCategoryId : ""));
    setWorkflowAmountInput(record?.grossIncome?.toString() ?? "");
    setWorkflowCapitalExpenditureInput(record?.capitalExpenditure?.toString() ?? "");
    setEditingId(record?.id ?? null);
    setCcCoveredIds(record?.ccPaymentCoveredIds ?? []);
  }

  return {
    workflowNameInput, setWorkflowNameInput,
    workflowDateInput, setWorkflowDateInput,
    receivingAccountId, setReceivingAccountId,
    transactedAccountId, setTransactedAccountId,
    workflowCategoryIdInput, setWorkflowCategoryIdInput,
    workflowAmountInput, setWorkflowAmountInput,
    workflowCapitalExpenditureInput, setWorkflowCapitalExpenditureInput,
    editingId, setEditingId,
    ccCoveredIds, setCcCoveredIds,
    workflowNetIncome,
    loadRecord,
  };
}
