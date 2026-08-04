import { useEffect, useState } from "react";
import { useLiveCollections } from "@/components/hooks";
import { useFinanceInvalidation } from "@/lib/use-data";
import { Field, ComputedField } from "@/components/ui";
import { FormModal } from "@/components/ui/form-modals";
import { applyIncomeTag, parseNumberInput } from "@/lib/finance-helpers";
import { calculateNetIncome, getMoneyValueTone } from "@/lib/finance-rules";
import { formatMoney, toYYMMDD } from "@/lib/format";
import { emitDataChanged } from "@/lib/finance-events";
import { todayIso } from "@/lib/date-range";
import { incomesApi } from "@/lib/api-client";

/**
 * Quick-add Income modal for the FAB (refactor_development_plan.md Phase 6.3 — pure move
 * out of fab/index.tsx, unchanged). Intentionally self-contained so the working Income page
 * stays untouched — money math is shared via finance-rules, only the form layout is
 * duplicated here.
 */
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

export { QuickAddIncomeModal };
