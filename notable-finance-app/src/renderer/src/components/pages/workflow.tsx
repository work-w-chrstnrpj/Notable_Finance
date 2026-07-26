
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useLiveCollections } from "@/components/hooks";
import { Panel, Field, ComputedField, MoneyValue, FilterDropdown, LoadingBlock, EmptyState, PageToolbar, MultiSelect, FormSectionDivider } from "@/components/ui";
import { DataTable } from "@/components/ui/data-table";
import { FormModal, ConfirmModal, type ModalState } from "@/components/ui/form-modals";
import { AccountIcon, CategoryIcon } from "@/components/ui/accounts";
import { ShortcutHint } from "@/components/shortcuts";
import { useWorkflowRecords, useFinanceInvalidation, useExpensesForCCCoverage } from "@/lib/use-data";
import { useShortcutAction } from "@/lib/shortcuts/context";
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
import { deleteActionLabel, deleteConfirmCopy, useUiSettings } from "@/lib/ui-settings-context";
import { useFabRegister, type ReceiptContext, type ReceiptRow } from "@/lib/fab-export-context";
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [disabledIds, setDisabledIds] = useState<Set<number>>(new Set());
  const [deleteConfirmIds, setDeleteConfirmIds] = useState<string[] | null>(null);
  const { hardDeleteEnabled } = useUiSettings();
  const deleteMode = hardDeleteEnabled ? "hard" : "soft";
  const deleteLabel = deleteActionLabel(hardDeleteEnabled);
  const [ccCoveredIds, setCcCoveredIds] = useState<string[]>([]);
  const { state: ccCoverageState } = useExpensesForCCCoverage();
  const workflowNetIncome = calculateNetIncome(
    parseNumberInput(workflowAmountInput),
    parseNumberInput(workflowCapitalExpenditureInput),
  );

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
  const hasSelection = selectedIds.size > 0;
  useShortcutAction("mass.selectAll", () => setSelectedIds(new Set(workflowIncomes.map((_, i) => i))), !modalOpen);
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
  const receiptContext = useMemo<ReceiptContext>(() => {
    const enabledRecords = workflowIncomes.filter(
      (_, idx) => !disabledIds.has(idx),
    );
    const rows: ReceiptRow[] = enabledRecords.map((record) => ({
      date: record.date ? formatDate(record.date) : "—",
      description: stripNotionTag(record.name),
      amount: formatMoney(record.grossIncome),
    }));
    const total = enabledRecords.reduce(
      (sum, record) => sum + (record.grossIncome ?? 0),
      0,
    );
    return {
      viewTitle: "Receivables",
      periodLabel: "All Time",
      amountHeader: "Amount",
      rows,
      total: formatMoney(total),
    };
  }, [workflowIncomes, disabledIds]);

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
    setCcCoveredIds(record?.ccPaymentCoveredIds ?? []);
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

  function toggleRowSelect(rowIndex: number, selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(rowIndex);
      else next.delete(rowIndex);
      return next;
    });
  }

  async function handleBulkAction(action: "enable" | "disable" | "duplicate" | "delete" | "edit") {
    if (action === "edit") {
      // Mass edit is available on Income / Expense pages; workflows keep duplicate/delete.
      return;
    }
    if (action === "enable" || action === "disable") {
      const shouldDisable = action === "disable";
      setDisabledIds((prev) => {
        const next = new Set(prev);
        for (const idx of selectedIds) {
          if (shouldDisable) next.add(idx);
          else next.delete(idx);
        }
        return next;
      });
      setSelectedIds(new Set());
      return;
    }

    if (action === "duplicate") {
      const recordsToDuplicate = Array.from(selectedIds)
        .map((idx) => workflowIncomes[idx])
        .filter((r): r is IncomeRecord => r != null);

      if (recordsToDuplicate.length === 0) {
        setSelectedIds(new Set());
        return;
      }

      setSelectedIds(new Set());

      const items = recordsToDuplicate.map((record) => ({
        name: `${record.name} (Copy)`,
        date: record.date,
        grossIncome: record.grossIncome,
        capitalExpenditure: record.capitalExpenditure,
        accountId: record.accountId,
        ...(categoryEditable ? { categoryId: record.categoryId } : {}),
        ...(record.transactedAccountId ? { transactedAccountId: record.transactedAccountId } : {}),
      }));

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
    }

    if (action === "delete") {
      const idsToDelete = Array.from(selectedIds)
        .map((idx) => workflowIncomes[idx]?.id)
        .filter((id): id is string => id != null);

      if (idsToDelete.length === 0) {
        setSelectedIds(new Set());
        return;
      }

      setDeleteConfirmIds(idsToDelete);
    }
  }

  async function executeDeleteWorkflow(idsToDelete: string[]) {
    setDeleteConfirmIds(null);
    setSelectedIds(new Set());
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
            selectedIds={selectedIds}
            disabledIds={disabledIds}
            onToggleSelect={toggleRowSelect}
            onBulkAction={handleBulkAction}
            showBulkEdit={false}
            bulkDeleteLabel={deleteLabel}
            bulkDeleteDanger={hardDeleteEnabled}
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
                items={nonCreditActiveAccounts.map((account) => ({
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
