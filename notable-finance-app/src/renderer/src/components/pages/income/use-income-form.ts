import { useState } from "react";
import { calculateNetIncome } from "@/lib/finance-rules";
import { parseNumberInput } from "@/lib/finance-helpers";
import type { IncomeRecord } from "@/types/finance";

/**
 * All state and derived figures for the Income record form
 * (refactor_development_plan.md F1, Phase 5.1 — same pattern as useExpenseForm in Phase 4.2).
 * Lifted verbatim out of income.tsx.
 */
export function useIncomeForm() {
  const [nameInput, setNameInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [grossIncomeInput, setGrossIncomeInput] = useState("");
  const [capitalExpenditureInput, setCapitalExpenditureInput] = useState("");

  const [shakeFields, setShakeFields] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  const calculatedNetIncome = calculateNetIncome(
    parseNumberInput(grossIncomeInput),
    parseNumberInput(capitalExpenditureInput),
  );

  /** Seed every field from `record` (or clear for a new entry). */
  function loadRecord(record: IncomeRecord | undefined) {
    setNameInput(record?.name ?? "");
    setDateInput(record?.date ?? "");
    setFormAccountId(record?.accountId ?? "");
    setFormCategoryId(record?.categoryId ?? "");
    setGrossIncomeInput(record?.grossIncome?.toString() ?? "");
    setCapitalExpenditureInput(record?.capitalExpenditure?.toString() ?? "");
    setEditingId(record?.id ?? null);
  }

  /**
   * Required-field check. Returns true when valid; on failure sets the shake fields and
   * clears them after the animation, exactly as the inline version did.
   */
  function validate(): boolean {
    const invalid = new Set<string>();
    if (!nameInput.trim()) invalid.add("name");
    if (!dateInput) invalid.add("date");
    if (invalid.size > 0) {
      setShakeFields(invalid);
      setTimeout(() => setShakeFields(new Set()), 600);
      return false;
    }
    return true;
  }

  function buildPayload() {
    return {
      name: nameInput.trim(),
      date: dateInput,
      grossIncome: parseNumberInput(grossIncomeInput),
      capitalExpenditure: parseNumberInput(capitalExpenditureInput),
      accountId: formAccountId,
      categoryId: formCategoryId,
    };
  }

  return {
    nameInput, setNameInput,
    dateInput, setDateInput,
    formAccountId, setFormAccountId,
    formCategoryId, setFormCategoryId,
    grossIncomeInput, setGrossIncomeInput,
    capitalExpenditureInput, setCapitalExpenditureInput,
    editingId, setEditingId,
    shakeFields,
    calculatedNetIncome,
    loadRecord,
    validate,
    buildPayload,
  };
}
