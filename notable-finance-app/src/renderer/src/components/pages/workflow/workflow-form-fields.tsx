import { Field, ComputedField, FilterDropdown, MultiSelect, FormSectionDivider } from "@/components/ui";
import { AccountIcon, CategoryIcon } from "@/components/ui/accounts";
import { getMoneyValueTone } from "@/lib/finance-rules";
import { formatMoney } from "@/lib/format";
import type { Account, ExpenseRecord, IncomeCategory } from "@/types/finance";
import type { useWorkflowForm } from "./use-workflow-form";

/**
 * The Workflow record form's field grid (refactor_development_plan.md Phase 5.4 —
 * same pattern as IncomeFormFields in Phase 5.1). Lifted verbatim out of workflow.tsx's
 * FormModal children. Field visibility still branches on section (transfer/CC/alkansya/
 * receivables), passed in as booleans/labels rather than re-derived here.
 */
export function WorkflowFormFields({
  form,
  label,
  amountLabel,
  sourceAccountLabel,
  sourceAccountOptions,
  secondaryAccountLabel,
  nonCreditActiveAccounts,
  normalIncomeCategories,
  isTransfer,
  isCreditCardPayment,
  isAlkansya,
  isReceivables,
  categoryEditable,
  fixedCategory,
  eligibleCcExpenses,
  totalCovered,
}: {
  form: ReturnType<typeof useWorkflowForm>;
  label: string;
  amountLabel: string;
  sourceAccountLabel: string;
  sourceAccountOptions: Account[];
  secondaryAccountLabel: string | null;
  nonCreditActiveAccounts: Account[];
  normalIncomeCategories: IncomeCategory[];
  isTransfer: boolean;
  isCreditCardPayment: boolean;
  isAlkansya: boolean;
  isReceivables: boolean;
  categoryEditable: boolean;
  fixedCategory: string | undefined;
  eligibleCcExpenses: ExpenseRecord[];
  totalCovered: number;
}) {
  const {
    workflowNameInput, setWorkflowNameInput,
    workflowDateInput, setWorkflowDateInput,
    workflowAmountInput, setWorkflowAmountInput,
    workflowCapitalExpenditureInput, setWorkflowCapitalExpenditureInput,
    receivingAccountId, setReceivingAccountId,
    transactedAccountId, setTransactedAccountId,
    workflowCategoryIdInput, setWorkflowCategoryIdInput,
    ccCoveredIds, setCcCoveredIds,
    workflowNetIncome,
  } = form;

  return (
    <div className="form-grid form-grid--single">
      <Field label="Name" required>
        <input
          placeholder={`${label} title`}
          value={workflowNameInput}
          onChange={(event) => setWorkflowNameInput(event.target.value)}
        />
      </Field>
      <Field label="Date" required={!isReceivables}>
        <input
          type="date"
          value={workflowDateInput}
          onChange={(event) => setWorkflowDateInput(event.target.value)}
        />
      </Field>
      <Field label={amountLabel}>
        <input
          inputMode="decimal"
          placeholder={isAlkansya ? "-0.00" : "0.00"}
          value={workflowAmountInput}
          onChange={(event) => setWorkflowAmountInput(event.target.value)}
        />
      </Field>
      {isReceivables && (
        <Field label="Capital Expenditure">
          <input
            inputMode="decimal"
            placeholder="0.00"
            value={workflowCapitalExpenditureInput}
            onChange={(event) => setWorkflowCapitalExpenditureInput(event.target.value)}
          />
        </Field>
      )}
      <Field label={sourceAccountLabel} required={isTransfer || isCreditCardPayment || isReceivables}>
        <FilterDropdown
          placeholder="— None —"
          value={receivingAccountId}
          onChange={setReceivingAccountId}
          items={sourceAccountOptions.map((account) => ({
            id: account.id,
            label: account.name,
            icon: <AccountIcon account={account} />,
          }))}
        />
      </Field>
      {secondaryAccountLabel && (
        <Field label={secondaryAccountLabel} required={isTransfer}>
          <FilterDropdown
            placeholder="— None —"
            value={transactedAccountId}
            onChange={setTransactedAccountId}
            items={nonCreditActiveAccounts
              .filter((account) => !isTransfer || account.id !== receivingAccountId)
              .map((account) => ({
              id: account.id,
              label: account.name,
              icon: <AccountIcon account={account} />,
            }))}
          />
        </Field>
      )}
      {isCreditCardPayment && (
        <>
          <FormSectionDivider title="CC Covered Expenses" />
          <div className="form-grid form-grid--single">
            <Field label="Covered Expenses">
              <MultiSelect
                placeholder="Search expenses to link..."
                selectedIds={ccCoveredIds}
                onChange={setCcCoveredIds}
                items={eligibleCcExpenses.map((e) => ({
                  id: e.id,
                  label: e.description,
                  sublabel: `₱${(e.periodCount && e.periodCount > 0 ? e.amount / e.periodCount : e.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
                }))}
              />
            </Field>
            {ccCoveredIds.length > 0 && (
              <ComputedField
                label="Total Covered"
                value={`₱${totalCovered.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              />
            )}
          </div>
        </>
      )}
      {!categoryEditable && fixedCategory ? (
        <ComputedField label="Categories" value={fixedCategory} />
      ) : (
        <Field label="Categories">
          <FilterDropdown
            placeholder="— None —"
            value={workflowCategoryIdInput}
            onChange={setWorkflowCategoryIdInput}
            items={normalIncomeCategories.map((category) => ({
              id: category.id,
              label: category.source,
              icon: <CategoryIcon icon={category.icon} />,
            }))}
          />
        </Field>
      )}
      {isReceivables && (
        <ComputedField
          label="Net Income"
          value={formatMoney(workflowNetIncome)}
          valueTone={getMoneyValueTone(workflowNetIncome)}
        />
      )}
    </div>
  );
}
