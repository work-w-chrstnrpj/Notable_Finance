import { Field, ComputedField, FilterDropdown, MultiSelect, FormSectionDivider } from "@/components/ui";
import { AccountIcon, CategoryIcon } from "@/components/ui/accounts";
import { calculateCcCoveredExpenseAmount, getMoneyValueTone } from "@/lib/finance-rules";
import { formatMoney } from "@/lib/format";
import type { Account, ExpenseRecord, IncomeCategory } from "@/types/finance";
import type { BorrowingKind } from "@shared/borrowings";
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
  incomeCategories,
  isTransfer,
  isBorrowings,
  borrowKind,
  onBorrowKindChange,
  placeholderAccounts,
  sourceAccountRequired,
  isCreditCardPayment,
  isAlkansya,
  isReceivables,
  categoryEditable,
  fixedCategory,
  eligibleCcExpenses,
  totalCovered,
  onCategoryChange,
  invalidFields,
}: {
  form: ReturnType<typeof useWorkflowForm>;
  label: string;
  amountLabel: string;
  sourceAccountLabel: string;
  sourceAccountOptions: Account[];
  secondaryAccountLabel: string | null;
  nonCreditActiveAccounts: Account[];
  incomeCategories: IncomeCategory[];
  isTransfer: boolean;
  isBorrowings: boolean;
  borrowKind: BorrowingKind;
  onBorrowKindChange: (kind: BorrowingKind) => void;
  placeholderAccounts: Account[];
  sourceAccountRequired: boolean;
  isCreditCardPayment: boolean;
  isAlkansya: boolean;
  isReceivables: boolean;
  categoryEditable: boolean;
  fixedCategory: string | undefined;
  eligibleCcExpenses: ExpenseRecord[];
  totalCovered: number;
  onCategoryChange?: (id: string) => void;
  invalidFields?: ReadonlySet<string>;
}) {
  const bad = (key: string) => invalidFields?.has(key) ?? false;
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
      <Field label="Name" required error={bad("name")}>
        <input
          className={bad("name") ? "field__input--shake" : undefined}
          placeholder={`${label} title`}
          value={workflowNameInput}
          onChange={(event) => setWorkflowNameInput(event.target.value)}
        />
      </Field>
      <Field label="Date" required={!isReceivables} error={bad("date")}>
        <input
          className={bad("date") ? "field__input--shake" : undefined}
          type="date"
          value={workflowDateInput}
          onChange={(event) => setWorkflowDateInput(event.target.value)}
        />
      </Field>
      <Field label={amountLabel} error={bad("amount")}>
        <input
          className={bad("amount") ? "field__input--shake" : undefined}
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
      {isBorrowings ? (
        <>
          <Field label="Type" required>
            <FilterDropdown
              placeholder="Type"
              value={borrowKind}
              onChange={(value) => onBorrowKindChange(value as BorrowingKind)}
              items={[{ id: "borrowed", label: "Borrowed" }, { id: "repayment", label: "Repayment" }]}
            />
          </Field>
          <Field label="Borrow Account" required error={bad("account")}>
            <FilterDropdown
              placeholder="— None —"
              value={receivingAccountId}
              onChange={setReceivingAccountId}
              items={placeholderAccounts.map((account) => ({ id: account.id, label: account.name, icon: <AccountIcon account={account} /> }))}
            />
          </Field>
          <Field label={borrowKind === "borrowed" ? "Received Into" : "Paid From"} required error={bad("secondary")}>
            <FilterDropdown
              placeholder="— None —"
              value={transactedAccountId}
              onChange={setTransactedAccountId}
              items={nonCreditActiveAccounts
                .filter((account) => account.type !== "Auxiliary")
                .map((account) => ({ id: account.id, label: account.name, icon: <AccountIcon account={account} /> }))}
            />
          </Field>
        </>
      ) : (
      <Field label={sourceAccountLabel} required={isTransfer || isCreditCardPayment || sourceAccountRequired} error={bad("account")}>
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
      )}
      {secondaryAccountLabel && (
        <Field label={secondaryAccountLabel} required={isTransfer} error={bad("secondary")}>
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
                  sublabel: formatMoney(calculateCcCoveredExpenseAmount(e)),
                }))}
              />
            </Field>
            {ccCoveredIds.length > 0 && (
              <ComputedField
                label="Total Covered"
                value={formatMoney(totalCovered)}
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
            onChange={onCategoryChange ?? setWorkflowCategoryIdInput}
            items={incomeCategories.map((category) => ({
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
