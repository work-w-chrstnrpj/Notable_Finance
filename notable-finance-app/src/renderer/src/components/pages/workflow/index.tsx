
import { useEffect, useMemo, useState } from "react";
import styles from "@/components/ui/filter-row.module.css";
import { SearchToggle, SearchInput, FilterToggle } from "@/components/ui/search-bar";
import { AccountIcon } from "@/components/ui/accounts";
import { useRecordSearch } from "@/features/records/use-record-search";
import { Plus } from "lucide-react";
import { useLiveCollections } from "@/components/hooks";
import { Panel, MoneyValue, LoadingBlock, EmptyState, PageToolbar, FilterDropdown, SegmentedControl } from "@/components/ui";
import { DataTable } from "@/components/ui/data-table";
import { FormModal, ConfirmModal, type ModalState } from "@/components/ui/form-modals";
import { ShortcutHint } from "@/components/shortcuts";
import { useWorkflowForm } from "./use-workflow-form";
import { WorkflowFormFields } from "./workflow-form-fields";
import { useWorkflowRecords, useFinanceInvalidation, useExpensesForCCCoverage, useExpenses } from "@/lib/use-data";
import { useRecordSelection } from "@/features/records/use-record-selection";
import { buildReceipt } from "@/features/records/receipt";
import { useBulkActions } from "@/features/records/use-bulk-actions";
import { useShortcutAction } from "@/lib/shortcuts/context";
import {
  applyIncomeTag,
  stripNotionTag,
  parseNumberInput,
  getMonthLabel,
  getIncomeGrossTotal,
} from "@/lib/finance-helpers";
import { consumePendingEdit, type PendingEditResource } from "@/lib/pending-edit";
import { getActiveSectionLabel } from "@/lib/finance-data";
import { calculateCcCoveredExpenseAmount, getWorkflowFixedCategory } from "@/lib/finance-rules";
import { formatMoney, formatDate, toYYMMDD } from "@/lib/format";
import { alkansyaApi, creditCardPaymentsApi, receivablesApi, transfersApi } from "@/lib/api-client";
import { deleteActionLabel, deleteConfirmCopy, useUiSettings } from "@/lib/ui-settings-context";
import { useFabRegister, type ReceiptContext } from "@/lib/fab-export-context";
import { navigate } from "@/lib/router";
import { setPendingEdit } from "@/lib/pending-edit";
import { computeRange, incomeModeToUnit, rangeLabel } from "@/lib/date-range";
import type { IncomeRecord, WorkflowSectionId } from "@/types/finance";
import type { ExpenseRecord } from "@/types/finance";

function WorkflowPage({
  section,
  selectedMonth,
  selectedDate = `${selectedMonth}-15`,
  viewMode = "Monthly",
  onViewModeChange = () => {},
}: {
  section: WorkflowSectionId;
  selectedMonth: string;
  selectedDate?: string;
  viewMode?: "Daily" | "Weekly" | "Monthly" | "Annually" | "All Records";
  onViewModeChange?: (mode: "Daily" | "Weekly" | "Monthly" | "Annually" | "All Records") => void;
}) {
  const {
    activeAccounts,
    nonCreditActiveAccounts,
    creditActiveAccounts,
    normalIncomeCategories,
    accountNameById,
    incomeCategoryNameById,
    expenseCategoryNameById,
  } = useLiveCollections();
  const fixedCategory = getWorkflowFixedCategory(section);
  const label = getActiveSectionLabel(section);
  const isTransfer = section === "transfer";
  const isCreditCardPayment = section === "credit-card-payment";
  const isAlkansya = section === "alkansya";
  const isReceivables = section === "receivables";
  // Alkansya is locked to Savings, like Transfer and CC Payment categories.
  const categoryEditable = isReceivables;
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
  const [accountFilterId, setAccountFilterId] = useState("");
  const [filterActive, setFilterActive] = useState(false);
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
    .reduce((sum, e) => sum + calculateCcCoveredExpenseAmount(e), 0);

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
  // Alkansya and Receivables use the selected date period; Transfer and CC
  // Payment remain month-scoped.
  const monthScoped = section === "transfer" || section === "credit-card-payment";
  const periodScoped = isAlkansya || isReceivables;
  const viewUnit = incomeModeToUnit(viewMode);
  const selectedRange = periodScoped && viewUnit ? computeRange(viewUnit, selectedDate) : undefined;
  const { state: workflowState, refetch, applyLocal } = useWorkflowRecords(section, {
    month: monthScoped ? selectedMonth : undefined,
    rangeStart: selectedRange?.start,
    rangeEnd: selectedRange?.end,
  });
  const { state: expenseState } = useExpenses();
  const selectedPeriodLabel = !periodScoped ? "All Time" : viewUnit ? rangeLabel(viewUnit, selectedDate) : "All Records";
  // Workflows are income-backed views, so they share the income invalidation.
  const { invalidateIncomeFamily } = useFinanceInvalidation();
  const isLoading = workflowState.status === "loading";
  const allWorkflowIncomes: IncomeRecord[] = (
    workflowState.status === "success" ? workflowState.data : []
  ).filter((r) => !r.name?.includes("[Deleted:"));
  const receivablePasabuyExpenses: ExpenseRecord[] = isReceivables && expenseState.status === "success"
    ? expenseState.data.filter((expense) =>
        expenseCategoryNameById.get(expense.categoryId) === "Pasabuy" &&
        expense.paymentStatus === "Paid" &&
        Boolean(expense.datePaid) &&
        expense.pasabuyStatus !== "Payment fully received" &&
        (!selectedRange || (expense.datePaid! >= selectedRange.start && expense.datePaid! <= selectedRange.end))
      )
    : [];
  const accountFiltered = allWorkflowIncomes.filter((record) => {
    if (!filterActive || !accountFilterId) return true;
    if (accountFilterId === "__none__") return !record.accountId;
    return record.accountId === accountFilterId ||
      ((isTransfer || isCreditCardPayment) && record.transactedAccountId === accountFilterId);
  });
  const receivableExpensesFiltered = receivablePasabuyExpenses.filter((expense) => {
    if (!filterActive || !accountFilterId) return true;
    if (accountFilterId === "__none__") return !expense.accountId;
    return expense.accountId === accountFilterId;
  });
  const { searchActive, searchQuery, setSearchQuery, toggleSearch, resetSearch,
    filteredRecords: workflowIncomes } = useRecordSearch(
    accountFiltered,
    (record) => [record.name, record.date, String(record.grossIncome),
      accountNameById.get(record.accountId ?? "") ?? "",
      accountNameById.get(record.transactedAccountId ?? "") ?? "",
      incomeCategoryNameById.get(record.categoryId) ?? ""],
    [accountNameById, incomeCategoryNameById],
  );
  const receivableExpenseSearch = receivableExpensesFiltered.filter((expense) => {
    if (!searchActive || !searchQuery.trim()) return true;
    const query = searchQuery.trim().toLocaleLowerCase();
    return [expense.description, expense.datePaid, expense.pasabuyer, accountNameById.get(expense.accountId) ?? ""]
      .some((value) => value?.toLocaleLowerCase().includes(query));
  });
  const receivableRecords = isReceivables
    ? [
        ...workflowIncomes.map((record) => ({ id: record.id, kind: "income" as const, record })),
        ...receivableExpenseSearch.map((record) => ({ id: `expense:${record.id}`, kind: "expense" as const, record })),
      ]
    : workflowIncomes.map((record) => ({ id: record.id, kind: "income" as const, record }));
  useShortcutAction("view.search", toggleSearch, !modalOpen);
  useShortcutAction("view.filters", () => setFilterActive((prev) => !prev), !modalOpen);
  useEffect(() => {
    setAccountFilterId("");
    setFilterActive(false);
    resetSearch();
  }, [section, resetSearch]);
  useEffect(() => {
    clearSelection();
  }, [section, filterActive, accountFilterId, searchActive, searchQuery, clearSelection]);
  const enabledWorkflowRecords = workflowIncomes.filter((r) => !disabledIds.has(r.id));
  const workflowAmountTotal = getIncomeGrossTotal(enabledWorkflowRecords) + receivableExpenseSearch
    .filter((expense) => !disabledIds.has(`expense:${expense.id}`))
    .reduce((sum, expense) => sum + (expense.pasabuyBalance ?? 0), 0);


  // ── Publish printable receipt for Receivables ──────────────────────
  const { setReceipt } = useFabRegister();
  const receiptContext = useMemo<ReceiptContext>(
    () =>
      buildReceipt({
        records: receivableRecords,
        excludeIds: disabledIds,
        viewTitle: "Receivables",
        periodLabel: selectedPeriodLabel,
        toRow: (item) => ({
          date: item.kind === "income" ? (item.record.date ? formatDate(item.record.date) : "—") : (item.record.datePaid ? formatDate(item.record.datePaid) : "—"),
          description: item.kind === "income" ? stripNotionTag(item.record.name) : item.record.description,
          amount: formatMoney(item.kind === "income" ? item.record.grossIncome : item.record.pasabuyBalance ?? 0),
        }),
        valueOf: (item) => item.kind === "income" ? item.record.grossIncome ?? 0 : item.record.pasabuyBalance ?? 0,
      }),
    [receivableRecords, disabledIds, selectedPeriodLabel],
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
      : ["Name", "Date", isReceivables ? "Account" : sourceAccountLabel, "Category", "Amount"];
  const workflowRows = receivableRecords.map((item) => {
    if (item.kind === "expense") {
      const record = item.record;
      return [
        stripNotionTag(record.description),
        formatDate(record.datePaid),
        accountNameById.get(record.accountId) ?? "—",
        "Pasabuy · Expense",
        <span key={`${record.id}-amount`} className="num">
          {formatMoney(record.pasabuyBalance ?? 0)}
        </span>,
      ];
    }
    const record = item.record;
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
      <span key={`${record.id}-amount`} className="num">
        {formatMoney(record.grossIncome)}
      </span>,
    ];
  });
  const workflowFooterRows = isTransfer
    ? []
    : isCreditCardPayment
      ? [
          [
            "Total",
            "",
            "",
            <MoneyValue key="workflow-total-amount" value={workflowAmountTotal} />,
            "",
          ],
        ]
      : [
          [
            "Total",
            "",
            "",
            "",
            <span key="workflow-total-amount" className="num">
              {formatMoney(workflowAmountTotal)}
            </span>,
          ],
        ];

  const expenseRowIds = new Set(receivableExpenseSearch.map((expense) => `expense:${expense.id}`));
  const tableRecordIds = receivableRecords.map((item) => item.kind === "income" ? item.record.id : `expense:${item.record.id}`);

  function openWorkflowModal(mode: "new" | "edit", title: string, recordId?: string) {
    const record =
      recordId != null
        ? allWorkflowIncomes.find((r) => r.id === recordId)
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
    // Only Receivables chooses a category. Other workflows resolve their fixed
    // category in main, including Savings for Alkansya.
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
      if (pending && allWorkflowIncomes.length > 0) {
        const record = allWorkflowIncomes.find((r) => r.id === pending.recordId);
        if (record) {
          openWorkflowModal("edit", record.name, record.id);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allWorkflowIncomes.length]);

  return (
    <div className="page-stack">
      <PageToolbar
        title={label}
        actions={
          <>
          <FilterToggle active={filterActive} onToggle={() => setFilterActive((prev) => !prev)} shortcutId="view.filters" />
          <SearchToggle active={searchActive} onToggle={toggleSearch} shortcutId="view.search" />
          <button
            type="button"
            className="button button--primary"
            onClick={() => openWorkflowModal("new", `New ${label} Record`)}
          >
            <Plus size={16} />
            New Record
            <ShortcutHint id="view.newRecord" />
          </button>
          </>
        }
      />
      {periodScoped && (
        <SegmentedControl
          label={`${label} view`}
          options={["Daily", "Weekly", "Monthly", "Annually", "All Records"].map((mode) => ({ label: mode, value: mode }))}
          value={viewMode}
          onChange={(mode) => onViewModeChange(mode as typeof viewMode)}
          shortcutId="view.filterTab"
        />
      )}
      {(filterActive || searchActive) && (
        <div className={`toolbar-row ${styles.filters}`}>
          {filterActive && (
            <FilterDropdown
              placeholder="All Accounts"
              value={accountFilterId}
              onChange={setAccountFilterId}
              items={[
                { id: "__none__", label: "No Account" },
                ...activeAccounts.map((account) => ({ id: account.id, label: account.name, icon: <AccountIcon account={account} /> })),
              ]}
            />
          )}
          {searchActive && <SearchInput query={searchQuery} onQueryChange={setSearchQuery} placeholder={`Search ${label.toLowerCase()}...`} />}
        </div>
      )}

      <Panel title="Records">
        {isLoading && <LoadingBlock label="Querying Notion…" />}
        {workflowRows.length ? (
          <DataTable
            selectable
            recordIds={tableRecordIds}
            selectedIds={selectedIds}
            disabledIds={disabledIds}
            selectionDisabledIds={expenseRowIds}
            onToggleSelect={toggleRowSelect}
            onBulkAction={handleBulkAction}
            showBulkEdit={false}
            bulkDeleteLabel={deleteLabel}
            bulkDeleteDanger={hardDeleteEnabled}
            headers={workflowHeaders}
            rows={workflowRows}
            footerRows={workflowFooterRows}
            onRowClick={(recordId) => {
              if (recordId.startsWith("expense:")) {
                const expense = receivablePasabuyExpenses.find((candidate) => candidate.id === recordId.slice("expense:".length));
                if (!expense) return;
                setPendingEdit("expenses", expense.id, expense);
                navigate("/expense");
                return;
              }
              const record = allWorkflowIncomes.find((r) => r.id === recordId);
              if (record) {
                openWorkflowModal("edit", record.name, record.id);
              }
            }}
          />
        ) : (
          <EmptyState
            title={allWorkflowIncomes.length || receivablePasabuyExpenses.length ? "No matching records" : periodScoped || monthScoped ? `No ${label.toLowerCase()} records for ${selectedPeriodLabel}` : `No ${label.toLowerCase()} records`}
            detail={
              allWorkflowIncomes.length
                ? "Try another account or search term."
                : isReceivables
                ? "Receivables include income entries without a receiving account and paid Pasabuy expenses that still have a balance due."
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
