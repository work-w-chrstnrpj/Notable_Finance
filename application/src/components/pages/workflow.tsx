"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useLiveCollections } from "@/components/hooks";
import { Panel, Field, ComputedField, MoneyValue, LoadingBlock, EmptyState, PageToolbar } from "@/components/ui";
import { DataTable } from "@/components/ui/data-table";
import { FormModal, type ModalState } from "@/components/ui/form-modals";
import { useWorkflowRecords, useFinanceInvalidation } from "@/lib/use-data";
import {
  applyIncomeTag,
  stripNotionTag,
  parseNumberInput,
  getMonthLabel,
} from "@/lib/finance-helpers";
import { getActiveSectionLabel } from "@/lib/finance-data";
import { calculateNetIncome, getMoneyValueTone, getWorkflowFixedCategory } from "@/lib/finance-rules";
import { formatMoney, formatDate, toYYMMDD } from "@/lib/format";
import { alkansyaApi, creditCardPaymentsApi, receivablesApi, transfersApi } from "@/lib/api-client";
import type { IncomeRecord, WorkflowSectionId } from "@/types/finance";

function WorkflowPage({
  section,
  selectedMonth,
}: {
  section: WorkflowSectionId;
  selectedMonth: string;
}) {
  const {
    nonCreditActiveAccounts,
    creditActiveAccounts,
    normalIncomeCategories,
    accountNameById,
    incomeCategoryNameById,
  } = useLiveCollections();
  const fixedCategory = getWorkflowFixedCategory(section);
  const label = getActiveSectionLabel(section);
  const isTransfer = section === "transfer";
  const isCreditCardPayment = section === "credit-card-payment";
  const isAlkansya = section === "alkansya";
  const isReceivables = section === "receivables";
  // Receivables have no fixed category; Alkansya defaults to Savings but the
  // user may change it to move the record out of the bucket into normal Income.
  const categoryEditable = isReceivables || isAlkansya;
  const savingsCategoryId =
    normalIncomeCategories.find((c) => c.source.toLowerCase() === "savings")?.id ?? "";
  const sourceAccountLabel = isTransfer
    ? "Source Account"
    : isCreditCardPayment
      ? "CC Account"
      : isReceivables
        ? "Receiving Account"
        : "Accounts";
  const sourceAccountOptions = isCreditCardPayment ? creditActiveAccounts : nonCreditActiveAccounts;
  const secondaryAccountLabel = isTransfer
    ? "Transfer Account"
    : isCreditCardPayment
      ? "Payer Account"
      : null;
  const amountLabel = isTransfer
    ? "Transfer Amount"
    : isCreditCardPayment
      ? "Payment Amount"
      : isAlkansya
        ? "Savings Amount"
        : "Gross Income";
  const [modal, setModal] = useState<ModalState>(null);
  const [workflowNameInput, setWorkflowNameInput] = useState("");
  const [workflowDateInput, setWorkflowDateInput] = useState("");
  const [receivingAccountId, setReceivingAccountId] = useState("");
  const [transactedAccountId, setTransactedAccountId] = useState("");
  const [workflowCategoryIdInput, setWorkflowCategoryIdInput] = useState("");
  const [workflowAmountInput, setWorkflowAmountInput] = useState("");
  const [workflowCapitalExpenditureInput, setWorkflowCapitalExpenditureInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const workflowNetIncome = calculateNetIncome(
    parseNumberInput(workflowAmountInput),
    parseNumberInput(workflowCapitalExpenditureInput),
  );

  // Auto-update [YYMMDD] tag when date changes (new or edit mode).
  useEffect(() => {
    if (modal?.mode !== "new" && modal?.mode !== "edit") return;
    const yyymmdd = toYYMMDD(workflowDateInput);
    if (!yyymmdd) return;
    setWorkflowNameInput((prev) => applyIncomeTag(prev, yyymmdd));
  }, [workflowDateInput, modal?.mode]);

  // Each workflow is the Incomes data source filtered server-side by its fixed
  // category (transfer→Transfer, credit-card-payment→Credit Card Payment,
  // alkansya→Savings) or, for receivables, by an empty receiving account.
  // Alkansya and Receivables are month-independent buckets — they show every
  // matching record so items can be triaged and updated later, so no month is
  // passed for them.
  const monthScoped = section === "transfer" || section === "credit-card-payment";
  const { state: workflowState, refetch, applyLocal } = useWorkflowRecords(section, {
    month: monthScoped ? selectedMonth : undefined,
  });
  // Workflows are income-backed views, so they share the income invalidation.
  const { invalidateIncomeFamily } = useFinanceInvalidation();
  const isLoading = workflowState.status === "loading";
  const workflowIncomes: IncomeRecord[] = (
    workflowState.status === "success" ? workflowState.data : []
  ).filter((r) => !r.name?.includes("[Deleted:"));
  const workflowApi =
    section === "transfer"
      ? transfersApi
      : section === "credit-card-payment"
        ? creditCardPaymentsApi
        : section === "alkansya"
          ? alkansyaApi
          : receivablesApi;
  // Transfer has its own column layout (source + destination account and a
  // computed "Transferred Amount" = Amount × -1); the other workflows share a
  // simpler Name/Date/Account/Category/Amount table.
  const workflowHeaders = isTransfer
    ? ["Date", "Name", "Source Account", "Amount", "Transfer Account", "Transferred Amount"]
    : isCreditCardPayment
      ? ["Date", "Name", "CC Account", "Amount", "Payer Account"]
      : ["Name", "Date", sourceAccountLabel, "Category", "Amount"];
  const workflowRows = workflowIncomes.map((record) => {
    if (isTransfer) {
      return [
        formatDate(record.date),
        stripNotionTag(record.name),
        accountNameById.get(record.accountId ?? "") ?? "—",
        <MoneyValue key={`${record.id}-amount`} value={record.grossIncome} />,
        accountNameById.get(record.transactedAccountId ?? "") ?? "—",
        <MoneyValue key={`${record.id}-transferred`} value={-record.grossIncome} />,
      ];
    }
    if (isCreditCardPayment) {
      return [
        formatDate(record.date),
        stripNotionTag(record.name),
        accountNameById.get(record.accountId ?? "") ?? "—",
        <MoneyValue key={`${record.id}-amount`} value={record.grossIncome} />,
        accountNameById.get(record.transactedAccountId ?? "") ?? "—",
      ];
    }
    return [
      stripNotionTag(record.name),
      formatDate(record.date),
      accountNameById.get(record.accountId ?? "") ?? "—",
      fixedCategory ?? incomeCategoryNameById.get(record.categoryId) ?? "—",
      formatMoney(record.grossIncome),
    ];
  });

  function openWorkflowModal(mode: "new" | "edit", title: string, recordId?: string) {
    const record =
      recordId != null
        ? workflowIncomes.find((r) => r.id === recordId)
        : undefined;
    setWorkflowNameInput(record?.name ?? "");
    setWorkflowDateInput(record?.date ?? "");
    setReceivingAccountId(record?.accountId ?? "");
    setTransactedAccountId(record?.transactedAccountId ?? "");
    // New Alkansya records default to the Savings category (editable).
    setWorkflowCategoryIdInput(
      record?.categoryId ?? (isAlkansya ? savingsCategoryId : ""),
    );
    setWorkflowAmountInput(record?.grossIncome?.toString() ?? "");
    setWorkflowCapitalExpenditureInput(
      record?.capitalExpenditure?.toString() ?? "",
    );
    setEditingId(record?.id ?? null);
    setEditing(mode === "new");
    setSaveError(null);
    setModal({ mode, title });
  }

  async function handleSaveWorkflow() {
    // Validate required fields per section
    if (!workflowNameInput.trim()) {
      setSaveError("Name is required.");
      return;
    }
    if (!isReceivables && !workflowDateInput) {
      setSaveError("Date is required.");
      return;
    }
    if (isTransfer && !receivingAccountId) {
      setSaveError("Source Account is required.");
      return;
    }
    if (isTransfer && !transactedAccountId) {
      setSaveError("Transfer Account is required.");
      return;
    }
    if (isCreditCardPayment && !receivingAccountId) {
      setSaveError("CC Account is required.");
      return;
    }
    if (!isReceivables && !isTransfer && !isCreditCardPayment && !receivingAccountId) {
      setSaveError("Account is required.");
      return;
    }
    const payload: Record<string, unknown> = {
      name: workflowNameInput.trim(),
      date: workflowDateInput,
      grossIncome: parseNumberInput(workflowAmountInput),
      capitalExpenditure: parseNumberInput(workflowCapitalExpenditureInput),
      accountId: receivingAccountId,
    };
    // Transfer & CC Payment carry a transacted/payer account.
    if (secondaryAccountLabel) {
      payload.transactedAccountId = transactedAccountId || null;
    }
    // Receivables and Alkansya let the user choose/change the income category
    // (Alkansya defaults to Savings). Transfer & CC Payment stay locked to
    // their fixed category server-side (must NOT send categoryId).
    if (categoryEditable) {
      payload.categoryId = workflowCategoryIdInput;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res =
        modal?.mode === "edit" && editingId
          ? await workflowApi.update(editingId, payload)
          : await workflowApi.create(payload);
      if (!res.success) {
        setSaveError(res.error.message || "Failed to save to Notion.");
        return;
      }
      setModal(null);
      const saved = res.data;
      applyLocal((rows) => {
        const idx = rows.findIndex((r) => r.id === saved.id);
        if (idx === -1) return [saved, ...rows];
        const next = rows.slice();
        next[idx] = saved;
        return next;
      });
      invalidateIncomeFamily();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Network error. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDuplicateWorkflow() {
    // Keep the loaded field values but detach from the source record so Save
    // creates a fresh record instead of updating the original.
    setEditingId(null);
    setEditing(true);
    setSaveError(null);
    setModal({ mode: "new", title: `New ${label} Record (Copy)` });
  }

  async function handleDeleteWorkflow() {
    if (!editingId) return;
    if (!window.confirm(`Soft-delete this ${label} record in Notion?`)) return;
    const deletedId = editingId;
    setSaving(true);
    try {
      const res = await workflowApi.delete(deletedId);
      if (!res.success) {
        setSaveError(res.error.message || "Failed to delete.");
        return;
      }
      setModal(null);
      applyLocal((rows) => rows.filter((r) => r.id !== deletedId));
      invalidateIncomeFamily();
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : "Network error. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <PageToolbar
        title={label}
        actions={
          <button
            type="button"
            className="button button--primary"
            onClick={() => openWorkflowModal("new", `New ${label} Record`)}
          >
            <Plus size={16} />
            New Record
          </button>
        }
      />

      <Panel title="Records">
        {isLoading && <LoadingBlock label="Querying Notion…" />}
        {workflowRows.length ? (
          <DataTable
            headers={workflowHeaders}
            rows={workflowRows}
            onRowClick={(rowIndex) => {
              const record = workflowIncomes[rowIndex];
              if (record) {
                openWorkflowModal("edit", record.name, record.id);
              }
            }}
          />
        ) : (
          <EmptyState
            title={monthScoped ? `No ${label.toLowerCase()} records this month` : `No ${label.toLowerCase()} records`}
            detail={
              isReceivables
                ? "Receivables are income records that do not yet have a receiving account."
                : isAlkansya
                  ? "Alkansya holds income records in the Savings category."
                  : `No ${label} entries were found for ${getMonthLabel(selectedMonth)}.`
            }
          />
        )}
      </Panel>

      <FormModal
        deleteLabel="Soft Delete"
        modal={modal}
        editing={editing}
        saving={saving}
        error={saveError}
        subtitle={`${label} uses the same income-backed write path with workflow-only fields exposed.`}
        onEdit={() => setEditing(true)}
        onSave={handleSaveWorkflow}
        onDelete={handleDeleteWorkflow}
        onDuplicate={handleDuplicateWorkflow}
        onClose={() => setModal(null)}
      >
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
            <select value={receivingAccountId} onChange={(event) => setReceivingAccountId(event.target.value)}>
              <option value="">— None —</option>
              {sourceAccountOptions.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Field>
          {secondaryAccountLabel && (
            <Field label={secondaryAccountLabel} required={isTransfer}>
              <select value={transactedAccountId} onChange={(event) => setTransactedAccountId(event.target.value)}>
                <option value="">— None —</option>
                {nonCreditActiveAccounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </select>
            </Field>
          )}
          {!categoryEditable && fixedCategory ? (
            <ComputedField label="Categories" value={fixedCategory} />
          ) : (
            <Field label="Categories">
              <select value={workflowCategoryIdInput} onChange={(event) => setWorkflowCategoryIdInput(event.target.value)}>
                <option value="">— None —</option>
                {normalIncomeCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.source}</option>
                ))}
              </select>
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
      </FormModal>
    </div>
  );
}

export { WorkflowPage };
