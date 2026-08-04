import { Field, ComputedField, FilterDropdown } from "@/components/ui";
import { AccountIcon, CategoryIcon } from "@/components/ui/accounts";
import { getMoneyValueTone } from "@/lib/finance-rules";
import { formatMoney } from "@/lib/format";
import type { Account, IncomeCategory } from "@/types/finance";
import type { useIncomeForm } from "./use-income-form";

/**
 * The Income record form's field grid (refactor_development_plan.md F1, Phase 5.1).
 * Lifted verbatim out of income.tsx's FlippableModal children.
 */
export function IncomeFormFields({
  form,
  nonCreditActiveAccounts,
  normalIncomeCategories,
}: {
  form: ReturnType<typeof useIncomeForm>;
  nonCreditActiveAccounts: Account[];
  normalIncomeCategories: IncomeCategory[];
}) {
  const {
    nameInput, setNameInput,
    dateInput, setDateInput,
    formAccountId, setFormAccountId,
    formCategoryId, setFormCategoryId,
    grossIncomeInput, setGrossIncomeInput,
    capitalExpenditureInput, setCapitalExpenditureInput,
    shakeFields,
    calculatedNetIncome,
  } = form;

  return (
    <div className="form-grid form-grid--single">
      <Field label="Name" required error={shakeFields.has("name")}>
        <input
          className={shakeFields.has("name") ? "field__input--shake" : undefined}
          placeholder="Income title"
          value={nameInput}
          onChange={(event) => setNameInput(event.target.value)}
        />
      </Field>
      <Field label="Date" required error={shakeFields.has("date")}>
        <input
          className={shakeFields.has("date") ? "field__input--shake" : undefined}
          type="date"
          value={dateInput}
          onChange={(event) => setDateInput(event.target.value)}
        />
      </Field>
      <Field label="Gross Income" required>
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
        <FilterDropdown
          placeholder="— None —"
          value={formAccountId}
          onChange={setFormAccountId}
          items={nonCreditActiveAccounts.map((account) => ({
            id: account.id,
            label: account.name,
            icon: <AccountIcon account={account} />,
          }))}
        />
      </Field>
      <Field label="Categories">
        <FilterDropdown
          placeholder="— None —"
          value={formCategoryId}
          onChange={setFormCategoryId}
          items={normalIncomeCategories.map((category) => ({
            id: category.id,
            label: category.source,
            icon: <CategoryIcon icon={category.icon} />,
          }))}
        />
      </Field>
      <ComputedField
        label="Net Income"
        value={formatMoney(calculatedNetIncome)}
        valueTone={getMoneyValueTone(calculatedNetIncome)}
      />
    </div>
  );
}
