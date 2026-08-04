
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useLiveCollections } from "@/components/hooks";
import { Panel, MoneyValue, LoadingBlock, EmptyState, PageToolbar } from "@/components/ui";
import { DataTable } from "@/components/ui/data-table";
import { FormModal, ConfirmModal, type ModalState } from "@/components/ui/form-modals";
import { ShortcutHint } from "@/components/shortcuts";
import { useWorkflowForm } from "./use-workflow-form";
import { WorkflowFormFields } from "./workflow-form-fields";
import { useWorkflowRecords, useFinanceInvalidation, useExpensesForCCCoverage } from "@/lib/use-data";
import { useRecordSelection } from "@/features/records/use-record-selection";
import { buildReceipt } from "@/features/records/receipt";
import { useBulkActions } from "@/features/records/use-bulk-actions";
import { useShortcutAction } from "@/lib/shortcuts/context";
import {
  applyIncomeTag,
  stripNotionTag,
  parseNumberInput,
  getMonthLabel,
} from "@/lib/finance-helpers";
import { consumePendingEdit, type PendingEditResource } from "@/lib/pending-edit";
import { getActiveSectionLabel } from "@/lib/finance-data";
import { getWorkflowFixedCategory } from "@/lib/finance-rules";
import { formatMoney, formatDate, toYYMMDD } from "@/lib/format";
import { alkansyaApi, creditCardPaymentsApi, receivablesApi, transfersApi } from "@/lib/api-client";
import { deleteActionLabel, deleteConfirmCopy, useUiSettings } from "@/lib/ui-settings-context";
import { useFabRegister, type ReceiptContext } from "@/lib/fab-export-context";
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
  const form = useWorkflowForm();
  const {
    workflowNameInput, setWorkflowNameInput,
    workflowDateInput,
    receivingAccountId,
    transactedAccountId,
    workflowCategoryIdInput,
    workflowAmountInput,
    workflowCapitalExpenditureInput,
    editingId, setEditingId,
    ccCoveredIds, setCcCoveredIds,
    loadRecord,
  } = form;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const {
    selectedIds,
    disabledIds,
    hasSelection,
    toggleRowSelect,
    selectAll,
    clearSelection,
    applyDisabled,
  } = useRecordSelection();
  const [deleteConfirmIds, setDeleteConfirmIds] = useState<string[] | null>(null);
  const { hardDeleteEnabled } = useUiSettings();
  const deleteMode = hardDeleteEnabled ? "hard" : "soft";
  const deleteLabel = deleteActionLabel(hardDeleteEnabled);
  const { state: ccCoverageState } = useExpensesForCCCoverage();

  const eligibleCcExpenses = (ccCoverageState.status === "success" ? ccCoverageState.data : [])
  const totalCovered = eligibleCcExpenses
    .filter((e) => ccCoveredIds.includes(e.id))
    .reduce((sum, e) => {
      const installment = e.periodCount && e.periodCount > 0 ? e.amount / e.periodCount : e.amount;
      return sum + installment;
    }, 0);

  // ── Keyboard shortcuts ──────────────────────────────────────────
  const modalOpen = modal !== null;
  useShortcutAction("view.newRecord", () => openWorkflowModal("new", `New ${label} Record`), !modalOpen);
  useShortcutAction("modal.save", () => void handleSaveWorkflow(), modalOpen && editing);
  useShortcutAction("modal.edit", () => setEditing((e) => !e), modalOpen);
  useShortcutAction("modal.duplicate", () => handleDuplicateWorkflow(), modalOpen);
  useShortcutAction("modal.delete", () => void handleDeleteWorkflow(), modalOpen && editingId != null);
  useShortcutAction("modal.close", () => { setModal(null); setCcCoveredIds([]); }, modalOpen);
  useShortcutAction("mass.selectAll", () => selectAll(workflowIncomes.map((r) => r.id)), !modalOpen);
  useShortcutAction("mass.duplicate", () => void handleBulkAction("duplicate"), hasSelection);
  useShortcutAction("mass.disable", () => void handleBulkAction("disable"), hasSelection);
  useShortcutAction("mass.delete", () => void handleBulkAction("delete"), hasSelection);

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


  // ── Publish printable receipt for Receivables ──────────────────────
  const { setReceipt } = useFabRegister();
  const receiptContext = useMemo<ReceiptContext>(
    () =>
      buildReceipt({
        records: workflowIncomes,
        excludeIds: disabledIds,
        viewTitle: "Receivables",
        periodLabel: "All Time",
        toRow: (record) => ({
          date: record.date ? formatDate(record.date) : "—",
          description: stripNotionTag(record.name),
          amount: formatMoney(record.grossIncome),
        }),
        valueOf: (record) => record.grossIncome ?? 0,
      }),
    [workflowIncomes, disabledIds],
  );

  useEffect(() => {
    if (isReceivables) {
      setReceipt(receiptContext);
      return () => setReceipt(null);
    }
  }, [isReceivables, receiptContext, setReceipt]);
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
      <span className="num">{formatMoney(record.grossIncome)}</span>,
    ];
  });

  function openWorkflowModal(mode: "new" | "edit", title: string, recordId?: string) {
    const record =
      recordId != null
        ? workflowIncomes.find((r) => r.id === recordId)
        : undefined;
    loadRecord(record, { isTransfer, isCreditCardPayment, isAlkansya, savingsCategoryId });
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
      grossIncome: isTransfer
        ? -Math.abs(parseNumberInput(workflowAmountInput))
        : parseNumberInput(workflowAmountInput),
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
    if (isCreditCardPayment) {
      payload.ccPaymentCoveredIds = ccCoveredIds;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res =
        modal?.mode === "edit" && editingId
          ? await workflowApi.update(editingId, payload)
          : await workflowApi.create(payload);
      if (!res.success) {
        setSaveError(res.error.message || "Couldn't save this record. Please try again.");
        return;
      }
      setModal(null);
      setCcCoveredIds([]);
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
    setCcCoveredIds([]);
    setModal({ mode: "new", title: `New ${label} Record (Copy)` });
  }

  // No onEdit / onPrint / onCover — workflows have never offered those (the table also
  // renders showBulkEdit={false}). Omitting them keeps that gap explicit.
  const handleBulkAction = useBulkActions({
    selectedIds,
    applyDisabled,
    clearSelection,
    onDelete: setDeleteConfirmIds,
    onDuplicate: async () => {
      const recordsToDuplicate = workflowIncomes.filter((r) => selectedIds.has(r.id));

      if (recordsToDuplicate.length === 0) {
        clearSelection();
        return;
      }

      clearSelection();

      const items = recordsToDuplicate.map((record) => ({
        name: `${record.name} (Copy)`,
        date: record.date,
        grossIncome: record.grossIncome,
        capitalExpenditure: record.capitalExpenditure,
        accountId: record.accountId,
        ...(categoryEditable ? { categoryId: record.categoryId } : {}),
        ...(record.transactedAccountId ? { transactedAccountId: record.transactedAccountId } : {}),
      }));

      // NOTE: unlike Income/Expense this path is not optimistic — no temp rows, no pending
      // markers, no failure notices. Left as-is; converting it to `commitMany` would change
      // observable behaviour and belongs in its own change.
      try {
        const res = await workflowApi.bulkCreate(items);
        if (res.success && res.data.created.length > 0) {
          applyLocal((rows) => [...res.data.created, ...rows]);
          invalidateIncomeFamily();
        }
        if (res.success && res.data.failed.length > 0) {
          void refetch();
        }
      } catch {
        void refetch();
      }
    },
  });

  async function executeDeleteWorkflow(idsToDelete: string[]) {
    setDeleteConfirmIds(null);
    clearSelection();
    setModal(null);
    setCcCoveredIds([]);
    setSaveError(null);
    setSaving(true);
    try {
      const res = await workflowApi.bulkDelete(idsToDelete, deleteMode);
      if (res.success) {
        const { deleted } = res.data;
        applyLocal((rows) => rows.filter((r) => !deleted.includes(r.id)));
        invalidateIncomeFamily();
      } else {
        setSaveError(res.error.message || "Failed to delete.");
        void refetch();
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Network error. Please try again.");
      void refetch();
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteWorkflow() {
    if (!editingId) return;
    setDeleteConfirmIds([editingId]);
  }

  // Check for pending edit triggered by History page navigation
  useEffect(() => {
    const sectionToResource: Record<string, PendingEditResource> = {
      transfer: "transfers",
      "credit-card-payment": "creditCardPayments",
      alkansya: "alkansya",
      receivables: "receivables",
    };
    const mapped = sectionToResource[section];
    if (mapped) {
      const pending = consumePendingEdit(mapped);
      if (pending && workflowIncomes.length > 0) {
        const record = workflowIncomes.find((r) => r.id === pending.recordId);
        if (record) {
          openWorkflowModal("edit", record.name, record.id);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workflowIncomes.length]);

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
            <ShortcutHint id="view.newRecord" />
          </button>
        }
      />

      <Panel title="Records">
        {isLoading && <LoadingBlock label="Querying Notion…" />}
        {workflowRows.length ? (
          <DataTable
            selectable
            recordIds={workflowIncomes.map((r) => r.id)}
            selectedIds={selectedIds}
            disabledIds={disabledIds}
            onToggleSelect={toggleRowSelect}
            onBulkAction={handleBulkAction}
            showBulkEdit={false}
            bulkDeleteLabel={deleteLabel}
            bulkDeleteDanger={hardDeleteEnabled}
            headers={workflowHeaders}
            rows={workflowRows}
            onRowClick={(recordId) => {
              const record = workflowIncomes.find((r) => r.id === recordId);
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
        deleteLabel={deleteLabel}
        deleteDanger={hardDeleteEnabled}
        modal={modal}
        editing={editing}
        saving={saving}
        error={saveError}
        subtitle={`${label} uses the same income-backed write path with workflow-only fields exposed.`}
        onEdit={() => setEditing(true)}
        onSave={handleSaveWorkflow}
        onDelete={handleDeleteWorkflow}
        onDuplicate={handleDuplicateWorkflow}
        onClose={() => { setModal(null); setCcCoveredIds([]); }}
      >
        <WorkflowFormFields
          form={form}
          label={label}
          amountLabel={amountLabel}
          sourceAccountLabel={sourceAccountLabel}
          sourceAccountOptions={sourceAccountOptions}
          secondaryAccountLabel={secondaryAccountLabel}
          nonCreditActiveAccounts={nonCreditActiveAccounts}
          normalIncomeCategories={normalIncomeCategories}
          isTransfer={isTransfer}
          isCreditCardPayment={isCreditCardPayment}
          isAlkansya={isAlkansya}
          isReceivables={isReceivables}
          categoryEditable={categoryEditable}
          fixedCategory={fixedCategory}
          eligibleCcExpenses={eligibleCcExpenses}
          totalCovered={totalCovered}
        />
      </FormModal>
      {deleteConfirmIds && (
        <ConfirmModal
          {...deleteConfirmCopy(hardDeleteEnabled, deleteConfirmIds.length)}
          danger={hardDeleteEnabled}
          busy={saving}
          onCancel={() => setDeleteConfirmIds(null)}
          onConfirm={() => {
            void executeDeleteWorkflow(deleteConfirmIds);
          }}
        />
      )}
    </div>
  );
}

export { WorkflowPage };
