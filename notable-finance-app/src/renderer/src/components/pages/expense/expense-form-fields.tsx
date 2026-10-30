import { PasabuyFormFields } from "./pasabuy-form-fields";
import { Field, ComputedField, FormSectionDivider, FilterDropdown } from "@/components/ui";
import { AccountIcon, CategoryIcon } from "@/components/ui/accounts";
import {
  paymentFrequencyLabels,
  paymentStatusLabels,
} from "@/lib/finance-rules";
import { formatMoney, formatDate } from "@/lib/format";
import type { Account, ExpenseCategory, PaymentFrequency, PaymentStatus } from "@/types/finance";
import type { useExpenseForm } from "./use-expense-form";

/**
 * The Expense record form's field grid (refactor_development_plan.md F1, Phase 4.2).
 * Lifted verbatim out of expense.tsx's FlippableModal children — which conditional sections
 * show is still driven entirely by `form.sections`, unchanged.
 *
 * The page keeps ownership of the surrounding FlippableModal (modal open/close, save, delete,
 * duplicate) because those are page concerns, not form concerns.
 */
export function ExpenseFormFields({
  form,
  activeAccounts,
  expenseCategories,
}: {
  form: ReturnType<typeof useExpenseForm>;
  activeAccounts: Account[];
  expenseCategories: ExpenseCategory[];
}) {
  const {
    descriptionInput, setDescriptionInput,
    formAccountId, setFormAccountId,
    formCategoryId, setFormCategoryId,
    purchaseDateInput, setPurchaseDateInput,
    datePaidInput, setDatePaidInput,
    expenseAmountInput, setExpenseAmountInput,
    interestInput, setInterestInput,
    paymentStatus, paymentFrequency, setPaymentFrequency,
    periodCountInput, setPeriodCountInput,
    bnplAdjustmentInput, setBnplAdjustmentInput,
    paidPeriodInput, setPaidPeriodInput,
    shakeFields, linkedIncomeName,
    sections, grossPrice, installmentAmount, paidAmount, remainingBalance,
    expectedPaymentDate,
    onSelectPaymentStatus,
  } = form;

  return (
        <div className="form-grid form-grid--single">
          <Field label="Purchase description" required={form.fieldsRequired} error={shakeFields.has("description")}>
            <input
              className={shakeFields.has("description") ? "field__input--shake" : undefined}
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
          <Field label="Accounts" required={form.fieldsRequired} error={shakeFields.has("account")}>
            <FilterDropdown
              placeholder="— None —"
              value={formAccountId}
              onChange={setFormAccountId}
              items={activeAccounts.map((account) => ({
                id: account.id,
                label: account.name,
                icon: <AccountIcon account={account} />,
              }))}
            />
          </Field>
          <Field label="Categories" required={form.fieldsRequired} error={shakeFields.has("category")}>
            <FilterDropdown
              placeholder="— None —"
              value={formCategoryId}
              onChange={setFormCategoryId}
              items={expenseCategories.map((category) => ({
                id: category.id,
                label: category.name,
                icon: <CategoryIcon icon={category.icon} />,
              }))}
            />
          </Field>
          <Field label="Expense Amount" required={form.fieldsRequired} error={shakeFields.has("amount")}>
            <input
              inputMode="decimal"
              className={shakeFields.has("amount") ? "field__input--shake" : undefined}
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
                  onChange={(event) => onSelectPaymentStatus(event.target.value as PaymentStatus)}
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
              <Field label="BNPL adjustment">
                <input
                  inputMode="numeric"
                  placeholder="0"
                  value={bnplAdjustmentInput}
                  onChange={(event) => setBnplAdjustmentInput(event.target.value)}
                />
              </Field>
              {installmentAmount !== null && (
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
              {linkedIncomeName && (
                <>
                  <FormSectionDivider title="CC Payment Receipt" />
                  <div className="form-grid form-grid--single">
                    <ComputedField label="Covered by" value={linkedIncomeName} />
                  </div>
                </>
              )}
            </>
          )}
          {sections.pasabuy && <PasabuyFormFields form={form} activeAccounts={activeAccounts} />}
        </div>
  );
}
