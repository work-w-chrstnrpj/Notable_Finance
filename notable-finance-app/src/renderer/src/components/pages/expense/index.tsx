
import { useMemo, useEffect, useState } from "react";
import { useLiveCollections, isSpecificExpenseCategoryFilter } from "@/components/hooks";
import { buildAnnualGroups, AnnualBarChart } from "@/components/charts";
import { Panel, LoadingBlock } from "@/components/ui";
import { AccountIcon, CategoryIcon } from "@/components/ui/accounts";
import { DataTable } from "@/components/ui/data-table";
import { getExpenseTableConfig, makeDeriveExpenseComputed } from "./expense-tables";
import { CoverExpensesModal } from "./cover-expenses-modal";
import { useExpenseForm } from "./use-expense-form";
import { ExpenseFormFields } from "./expense-form-fields";
import { buildExpenseMassEditFields } from "./expense-mass-edit-fields";
import { ExpenseToolbar } from "./expense-toolbar";
import { ConfirmModal, type ModalState } from "@/components/ui/form-modals";
import { FlippableModal } from "@/components/ui/flippable-modal";
import { MassEditModal, type MassEditFieldOption } from "@/components/ui/mass-edit-modal";
import { Toast } from "@/components/ui/toast";
import { ReceiptModal } from "@/components/fab";
import { useShortcutAction } from "@/lib/shortcuts/context";
import { useExpenses, useFinanceInvalidation } from "@/lib/use-data";
import { useRecordSelection } from "@/features/records/use-record-selection";
import { useOptimisticRecords } from "@/features/records/use-optimistic-records";
import { useBulkActions } from "@/features/records/use-bulk-actions";
import { makeExpenseReceiptBuilder } from "./expense-receipt";
import { useFabRegister, type ReceiptContext } from "@/lib/fab-export-context";
import { applyNotionTag } from "@/lib/finance-helpers";
import { computeRange, expenseModeToUnit, todayIso } from "@/lib/date-range";
import { toYYMMDD } from "@/lib/format";
import { useRecordSearch } from "@/features/records/use-record-search";
import { expensesApi } from "@/lib/api-client";
import { deleteActionLabel, deleteConfirmCopy, useUiSettings } from "@/lib/ui-settings-context";
import { DATA_CHANGED_EVENT } from "@/lib/finance-events";
import { consumePendingEdit } from "@/lib/pending-edit";
import { usePersistedFilters } from "@/features/records/use-persisted-filters";
import {
  expenseCategoryFilterWithoutPasabuy,
  type AnnualGroupBy,
} from "@/components/constants";
import type { ExpenseViewMode, ExpenseRecord } from "@/types/finance";

const expenseViewModes: ExpenseViewMode[] = [
  "Daily",
  "Weekly",
  "Monthly",
  "Annually",
  "To pay",
  "To buy",
  "Installments",
  "Unpaid CC",
  "Unpaid Pasabuy",
];

function ExpensePage({
  viewMode,
  onViewModeChange,
  selectedDate,
}: {
  viewMode: ExpenseViewMode;
  onViewModeChange: (viewMode: ExpenseViewMode) => void;
  selectedDate: string;
}) {
  const {
    activeAccounts,
    expenseCategories,
    accountNameById,
    expenseCategoryNameById,
  } = useLiveCollections();
  const expenseUnit = expenseModeToUnit(viewMode);
  const expenseRange = expenseUnit ? computeRange(expenseUnit, selectedDate) : null;
  const [accountFilterId, setAccountFilterId] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("");
  const [pasabuyerFilter, setPasabuyerFilter] = useState("");
  const [annualView, setAnnualView] = useState<"table" | "chart">("table");
  const [groupBy, setGroupBy] = useState<AnnualGroupBy>("month");
  const isAnnual = viewMode === "Annually";
  const [filterActive, setFilterActive] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);

  // All record-form state, derived figures and automations live in useExpenseForm.
  const form = useExpenseForm({ viewMode, activeAccounts, expenseCategoryNameById });
  // Only what the PAGE still needs; every other field is consumed inside ExpenseFormFields.
  const {
    setDescriptionInput,
    purchaseDateInput,
    editingId,
    automationNotice, setAutomationNotice,
  } = form;

  const pasabuyCategory = expenseCategories.find((c) => /pasabuy/i.test(c.name));

  // Table cell renderers — passed into the per-view-mode table config.
  const expenseCategoryById = useMemo(
    () => new Map(expenseCategories.map((c) => [c.id, c])),
    [expenseCategories],
  );
  const categoryCell = (id: string) => {
    const c = expenseCategoryById.get(id);
    if (!c) return "—";
    return (
      <span className="cat-cell">
        <CategoryIcon icon={c.icon} />
        {c.name}
      </span>
    );
  };
  const accountCell = (id: string | null | undefined) => {
    const a = accountById.get(id ?? "");
    if (!a) return accountNameById.get(id ?? "") ?? "—";
    return (
      <span className="cat-cell">
        <AccountIcon account={a} />
        {a.name}
      </span>
    );
  };

  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const {
    selectedIds,
    disabledIds,
    hasSelection,
    toggleRowSelect,
    selectAll,
    clearSelection,
    resetSelection,
    applyDisabled,
  } = useRecordSelection();
  const [deleteConfirmIds, setDeleteConfirmIds] = useState<string[] | null>(null);
  const { hardDeleteEnabled, settings, ready: settingsReady, updateSettings } = useUiSettings();
  const deleteMode = hardDeleteEnabled ? "hard" : "soft";
  const deleteLabel = deleteActionLabel(hardDeleteEnabled);
  const [massEditOpen, setMassEditOpen] = useState(false);
  const [massEditSaving, setMassEditSaving] = useState(false);
  const [massEditError, setMassEditError] = useState<string | null>(null);
  /** When set, the bulk-edit modal opens pre-filled with these rows (e.g. Bulk CC Pay). */
  const [massEditPreset, setMassEditPreset] = useState<
    Array<{ fieldKey: string; rawValue: string }> | undefined
  >(undefined);
  const [coverExpensesOpen, setCoverExpensesOpen] = useState(false);
  /** After covering, offer to continue into the Bulk CC Pay workflow with the same selection. */
  const [bulkPayPromptOpen, setBulkPayPromptOpen] = useState(false);
  const [receiptModalCtx, setReceiptModalCtx] = useState<ReceiptContext | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  usePersistedFilters({
    ready: settingsReady,
    source: settings.expenseFilters,
    hydrate: (f) => {
      setAccountFilterId(f.accountFilterId);
      setExpenseCategoryFilter(f.expenseCategoryFilter);
      setPasabuyerFilter(f.pasabuyerFilter);
      setFilterActive(f.filterActive);
      setAnnualView(f.annualView);
      setGroupBy(f.groupBy);
    },
    values: [accountFilterId, expenseCategoryFilter, pasabuyerFilter, filterActive, annualView, groupBy],
    persist: () => {
      void updateSettings({
        expenseFilters: {
          accountFilterId,
          expenseCategoryFilter,
          pasabuyerFilter,
          filterActive,
          annualView,
          groupBy,
        },
      });
    },
  });
  const expenseParams = useMemo(
    () => ({
      rangeStart: expenseRange?.start,
      rangeEnd: expenseRange?.end,
      // Account/category/pasabuyer filters only apply while the filter panel is
      // active. Otherwise a value left selected before toggling the panel off
      // would silently hide records with the control hidden from view.
      accountId: filterActive ? accountFilterId || undefined : undefined,
      categoryId:
        filterActive && isSpecificExpenseCategoryFilter(expenseCategoryFilter)
          ? expenseCategoryFilter
          : undefined,
      paymentStatus: undefined,
      pasabuyer: filterActive ? pasabuyerFilter || undefined : undefined,
      expenseViewMode: viewMode,
    }),
    [
      expenseRange?.start,
      expenseRange?.end,
      filterActive,
      accountFilterId,
      expenseCategoryFilter,
      pasabuyerFilter,
      viewMode,
    ],
  );
  const { state: expensesState, refetch, applyLocal } = useExpenses(expenseParams);
  const { invalidateExpenseFamily } = useFinanceInvalidation();
  const { pendingRowClassName, commit, commitMany, commitDelete } =
    useOptimisticRecords<ExpenseRecord>({
      applyLocal,
      invalidate: invalidateExpenseFamily,
      refetch,
      onNotice: setSaveNotice,
    });
  useEffect(() => {
    const handler = () => {
      void refetch();
    };
    window.addEventListener(DATA_CHANGED_EVENT, handler);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, handler);
  }, [refetch]);

  // Clear selection when view mode changes
  useEffect(() => {
    resetSelection();
  }, [viewMode, resetSelection]);

  const isLoading = expensesState.status === "loading";
  const allExpenseRecords: ExpenseRecord[] =
    expensesState.status === "success" ? expensesState.data : [];

  const visibleExpenseRecords: ExpenseRecord[] = useMemo(
    () =>
      allExpenseRecords.filter((record) => {
        if (record.description?.includes("[Deleted:")) return false;
        if (
          expenseCategoryFilter === expenseCategoryFilterWithoutPasabuy &&
          pasabuyCategory &&
          record.categoryId === pasabuyCategory.id
        ) {
          return false;
        }
        return true;
      }),
    [allExpenseRecords, expenseCategoryFilter, expenseCategoryFilterWithoutPasabuy, pasabuyCategory],
  );

  // Fuzzy search: filter visible records by search query (client-side only)
  const {
    searchActive,
    searchQuery,
    setSearchQuery,
    filteredRecords: searchFilteredRecords,
    toggleSearch,
    resetSearch,
  } = useRecordSearch(
    visibleExpenseRecords,
    (r) => [
      r.description,
      r.purchaseDate,
      r.datePaid ?? "",
      accountNameById.get(r.accountId) ?? "",
      expenseCategoryNameById.get(r.categoryId) ?? "",
      r.pasabuyer ?? "",
    ],
    [accountNameById, expenseCategoryNameById],
  );

  const annualExpenseGroups = buildAnnualGroups(
    visibleExpenseRecords.map((r) => ({
      dateIso: r.purchaseDate,
      accountId: r.accountId,
      categoryId: r.categoryId,
      value: r.amount + (r.interest ?? 0),
    })),
    groupBy,
    accountNameById,
    expenseCategoryNameById,
  );

  // Derived credit/installment figures per record, mirroring the modal's math,
  // for the detailed CC Transactions and Installments table columns.
  const accountById = new Map(activeAccounts.map((a) => [a.id, a]));
  const deriveExpenseComputed = makeDeriveExpenseComputed(accountById);

  // Auto-update [YYMMDDx] tag when purchase date changes (new or edit mode).
  useEffect(() => {
    if (modal?.mode !== "new" && modal?.mode !== "edit") return;
    const yyymmdd = toYYMMDD(purchaseDateInput);
    if (!yyymmdd) return;
    setDescriptionInput((prev) => applyNotionTag(prev, yyymmdd));
  }, [purchaseDateInput, modal?.mode]);

  function openExpenseModal(mode: "new" | "edit", title: string, recordId?: string) {
    const record =
      recordId != null
        ? visibleExpenseRecords.find((r) => r.id === recordId)
        : undefined;
    const nextCategoryId =
      record?.categoryId ??
      (viewMode === "Unpaid Pasabuy" ? pasabuyCategory?.id : undefined) ??
      (isSpecificExpenseCategoryFilter(expenseCategoryFilter) ? expenseCategoryFilter : "");

    form.loadRecord(record, { accountId: accountFilterId, categoryId: nextCategoryId });
    setEditing(mode === "new");
    setSaveError(null);
    setModal({ mode, title });
  }

  async function handleSaveExpense() {
    if (!form.validate()) {
      setSaveError("Please fill in all required fields.");
      return;
    }
    const payload = form.buildPayload();
    setSaveError(null);
    setSaveNotice(null);

    // Capture modal state before closing
    const existingId = modal?.mode === "edit" && form.editingId ? form.editingId : null;

    // Close modal immediately — no blocking "Saving..." state
    setModal(null);

    await commit({
      existingId,
      buildOptimistic: (tempId) =>
        ({
          id: tempId,
          description: payload.description as string,
          purchaseDate: payload.purchaseDate as string,
          datePaid: payload.datePaid as string | null,
          amount: payload.amount as number,
          interest: payload.interest as number,
          accountId: payload.accountId as string,
          categoryId: payload.categoryId as string,
          paymentStatus: payload.paymentStatus as string,
          paymentFrequency: payload.paymentFrequency as string | null,
          periodCount: payload.periodCount as number | undefined,
          paidPeriod: payload.paidPeriod as number | undefined,
          pasabuyer: payload.pasabuyer as string | null,
          pasabuyStatus: payload.pasabuyStatus as string | null,
          pasabuyDateOfPayment: payload.pasabuyDateOfPayment as string | null,
          pasabuyPaidPeriod: payload.pasabuyPaidPeriod as number | undefined,
          pasabuyAccountReceiverId: payload.pasabuyAccountReceiverId as string | null,
        }) as ExpenseRecord,
      save: () =>
        existingId ? expensesApi.update(existingId, payload) : expensesApi.create(payload),
    });
  }

  function handleDuplicateExpense() {
    // Keep the loaded field values but detach from the source record so Save
    // creates a fresh expense instead of updating the original.
    form.setEditingId(null);
    setEditing(true);
    setSaveError(null);
    setModal({ mode: "new", title: "New Expense (Copy)" });
  }

  async function handleDeleteExpense() {
    if (!editingId) return;
    setDeleteConfirmIds([editingId]);
  }

  function handleExpenseViewModeChange(nextViewMode: ExpenseViewMode) {
    // Reset all filters when view mode changes (Issue #3)
    setAccountFilterId("");
    setExpenseCategoryFilter("");
    setPasabuyerFilter("");
    setFilterActive(false);
    resetSearch();

    onViewModeChange(nextViewMode);
  }


  const massEditFields = useMemo<MassEditFieldOption[]>(
    () => buildExpenseMassEditFields(activeAccounts, expenseCategories),
    [activeAccounts, expenseCategories],
  );
  async function applyMassEdit(patch: Record<string, string | number | null>) {
    const ids = Array.from(selectedIds).filter((id): id is string => id != null);
    if (ids.length === 0) {
      setMassEditOpen(false);
      clearSelection();
      return;
    }

    setMassEditSaving(true);
    setMassEditError(null);
    try {
      const res = await expensesApi.bulkUpdate(ids, patch);
      if (!res.success) {
        setMassEditError(res.error.message);
        return;
      }
      const { updated, failed } = res.data;
      applyLocal((rows) =>
        rows.map((row) => {
          const match = updated.find((u) => u.id === row.id);
          return match ?? row;
        }),
      );
      setMassEditOpen(false);
      setMassEditPreset(undefined);
      clearSelection();
      invalidateExpenseFamily();
      if (failed.length > 0) {
        setSaveNotice(`${failed.length} of ${ids.length} items failed to update.`);
      } else {
        setSaveNotice(`Updated ${updated.length} expense${updated.length === 1 ? "" : "s"}.`);
      }
    } catch (err) {
      setMassEditError(err instanceof Error ? err.message : "Network error");
    } finally {
      setMassEditSaving(false);
    }
  }

  // Expense is the only page with print + cover; passing those callbacks is what enables them.
  const handleBulkAction = useBulkActions({
    selectedIds,
    applyDisabled,
    clearSelection,
    onDelete: setDeleteConfirmIds,
    onEdit: () => {
      setMassEditError(null);
      setMassEditPreset(undefined); // plain bulk edit starts with an empty row
      setMassEditOpen(true);
    },
    onCover: () => setCoverExpensesOpen(true),
    onPrint: () => {
      setReceiptModalCtx(
        buildExpenseReceipt(searchFilteredRecords.filter((r) => selectedIds.has(r.id))),
      );
      clearSelection();
    },
    onDuplicate: async () => {
      const recordsToDuplicate = visibleExpenseRecords.filter((r) => selectedIds.has(r.id));

      if (recordsToDuplicate.length === 0) {
        clearSelection();
        return;
      }

      clearSelection();

      const items = recordsToDuplicate.map((record) => ({
        description: `${record.description} (Copy)`,
        purchaseDate: record.purchaseDate,
        datePaid: record.datePaid || null,
        amount: record.amount,
        interest: record.interest ?? 0,
        accountId: record.accountId,
        categoryId: record.categoryId,
        paymentStatus: record.paymentStatus || null,
        paymentFrequency: record.paymentFrequency || null,
        periodCount: record.periodCount ?? null,
        paidPeriod: record.paidPeriod ?? null,
        pasabuyer: record.pasabuyer || null,
        pasabuyStatus: record.pasabuyStatus || null,
        pasabuyDateOfPayment: record.pasabuyDateOfPayment || null,
        pasabuyPaidPeriod: record.pasabuyPaidPeriod ?? null,
        pasabuyAccountReceiverId: record.pasabuyAccountReceiverId || null,
      }));

      await commitMany({
        count: recordsToDuplicate.length,
        buildOptimistic: (tempId, i) => {
          const record = recordsToDuplicate[i];
          return {
            ...record,
            id: tempId,
            description: `${record.description} (Copy)`,
          } as ExpenseRecord;
        },
        save: () => expensesApi.bulkCreate(items),
        failureLabel: "Bulk duplicate failed",
        partialFailureNoun: "duplicate",
      });
    },
  });

  async function executeDeleteExpenses(idsToDelete: string[]) {
    setDeleteConfirmIds(null);
    clearSelection();
    setModal(null);
    setSaveError(null);
    setSaveNotice(null);

    await commitDelete({
      ids: idsToDelete,
      save: () => expensesApi.bulkDelete(idsToDelete, deleteMode),
      failureLabel: "Bulk delete failed",
      partialFailureNoun: "delete",
    });
  }

  const enabledExpenseRecords = searchFilteredRecords.filter(
    (r) => !disabledIds.has(r.id),
  );

  // Per-view-mode table shape (headers / row / footer), selected as data rather than a
  // ternary chain over four near-identical <DataTable> blocks. See expense/expense-tables.tsx.
  const tableConfig = getExpenseTableConfig(viewMode, {
    accountCell,
    categoryCell,
    derive: deriveExpenseComputed,
    enabledRecords: enabledExpenseRecords,
  });

  // Publish a printable receipt of the current view for the floating button.
  // The "Amount" column is remapped per view per the receipt spec.
  const { setReceipt } = useFabRegister();
  const buildExpenseReceipt = makeExpenseReceiptBuilder({
    viewMode,
    selectedDate,
    derive: deriveExpenseComputed,
  });

  const receiptContext = useMemo<ReceiptContext>(
    () => buildExpenseReceipt(searchFilteredRecords, disabledIds),
    // deriveExpenseComputed is a stable closure over the same render inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewMode, selectedDate, searchFilteredRecords, disabledIds],
  );

  useEffect(() => {
    setReceipt(receiptContext);
    return () => setReceipt(null);
  }, [receiptContext, setReceipt]);

  // ── Keyboard shortcuts (Option/Alt) ────────────────────────────────
  const modalOpen = modal !== null;
  useShortcutAction("view.newRecord", () => openExpenseModal("new", "New Expense"), !modalOpen);
  useShortcutAction("view.search", toggleSearch, !modalOpen);
  useShortcutAction("view.filters", () => {
    if (filterActive) {
      setAccountFilterId("");
      setExpenseCategoryFilter("");
      setPasabuyerFilter("");
    }
    setFilterActive((f) => !f);
  }, !modalOpen);
  useShortcutAction("modal.save", () => void handleSaveExpense(), modalOpen && editing);
  useShortcutAction("modal.edit", () => setEditing((e) => !e), modalOpen);
  useShortcutAction("modal.duplicate", () => handleDuplicateExpense(), modalOpen);
  useShortcutAction("modal.delete", () => void handleDeleteExpense(), modalOpen && editingId != null);
  useShortcutAction("modal.close", () => setModal(null), modalOpen);
  useShortcutAction(
    "mass.selectAll",
    () => selectAll(searchFilteredRecords.map((r) => r.id)),
    !modalOpen,
  );
  useShortcutAction("mass.duplicate", () => void handleBulkAction("duplicate"), hasSelection);
  useShortcutAction("mass.edit", () => void handleBulkAction("edit"), hasSelection);
  useShortcutAction("mass.disable", () => void handleBulkAction("disable"), hasSelection);
  useShortcutAction("mass.delete", () => void handleBulkAction("delete"), hasSelection);

  // Check for pending edit triggered by History page navigation
  useEffect(() => {
    const pending = consumePendingEdit("expenses");
    if (pending && visibleExpenseRecords.length > 0) {
      const record = visibleExpenseRecords.find((r) => r.id === pending.recordId);
      if (record) {
        openExpenseModal("edit", record.description, record.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleExpenseRecords.length]);

  return (
    <div className="page-stack">
      <ExpenseToolbar
        viewMode={viewMode}
        expenseViewModes={expenseViewModes}
        isAnnual={isAnnual}
        activeAccounts={activeAccounts}
        expenseCategories={expenseCategories}
        filterActive={filterActive}
        setFilterActive={setFilterActive}
        searchActive={searchActive}
        toggleSearch={toggleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        accountFilterId={accountFilterId}
        setAccountFilterId={setAccountFilterId}
        expenseCategoryFilter={expenseCategoryFilter}
        setExpenseCategoryFilter={setExpenseCategoryFilter}
        pasabuyerFilter={pasabuyerFilter}
        setPasabuyerFilter={setPasabuyerFilter}
        annualView={annualView}
        setAnnualView={setAnnualView}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        onNewExpense={() => openExpenseModal("new", "New Expense")}
        onViewModeChange={handleExpenseViewModeChange}
      />
      <Panel title={`${viewMode} Expenses`}>
        {isLoading && <LoadingBlock label="Querying Notion…" />}
        {isAnnual && annualView === "chart" ? (
          <AnnualBarChart data={annualExpenseGroups} color="#E11D48" />
        ) : (
          <DataTable
            selectable
            recordIds={searchFilteredRecords.map((r) => r.id)}
            selectedIds={selectedIds}
            disabledIds={disabledIds}
            onToggleSelect={toggleRowSelect}
            onBulkAction={handleBulkAction}
            bulkDeleteLabel={deleteLabel}
            bulkDeleteDanger={hardDeleteEnabled}
            showBulkCover={tableConfig.showBulkCover}
            showBulkPrint
            wide
            headers={tableConfig.headers}
            rowClassName={pendingRowClassName}
            rows={searchFilteredRecords.map(tableConfig.buildRow)}
            footerRows={tableConfig.buildFooter()}
            onRowClick={(recordId) => {
              const record = visibleExpenseRecords.find((r) => r.id === recordId);
              if (record) {
                openExpenseModal("edit", record.description, record.id);
              }
            }}
          />
        )}
      </Panel>

      {saveNotice && (
        <Toast key={saveNotice} tone="info" duration={4000} message={saveNotice} onDismiss={() => setSaveNotice(null)} />
      )}

      <FlippableModal
        deleteLabel={deleteLabel}
        deleteDanger={hardDeleteEnabled}
        modal={modal}
        editing={editing}
        saving={false}
        error={saveError}
        subtitle="Context fields change from the selected account and category."
        onEdit={() => setEditing(true)}
        onSave={handleSaveExpense}
        onDelete={handleDeleteExpense}
        onDuplicate={handleDuplicateExpense}
        onClose={() => setModal(null)}
        pageContentResource="expenses"
        recordId={editingId}
      >
        <ExpenseFormFields
          form={form}
          activeAccounts={activeAccounts}
          expenseCategories={expenseCategories}
        />
      </FlippableModal>
      <MassEditModal
        open={massEditOpen}
        title={`Bulk edit ${selectedIds.size} expense${selectedIds.size === 1 ? "" : "s"}`}
        subtitle="Purchase description cannot be bulk-edited. Add one or more fields, set the new value, then apply to every selected row."
        fields={massEditFields}
        saving={massEditSaving}
        error={massEditError}
        onClose={() => {
          if (!massEditSaving) {
            setMassEditOpen(false);
            setMassEditPreset(undefined);
          }
        }}
        onApply={applyMassEdit}
        presetRows={massEditPreset}
        showExpensePresets
      />
      {deleteConfirmIds && (
        <ConfirmModal
          {...deleteConfirmCopy(hardDeleteEnabled, deleteConfirmIds.length)}
          danger={hardDeleteEnabled}
          onCancel={() => setDeleteConfirmIds(null)}
          onConfirm={() => {
            void executeDeleteExpenses(deleteConfirmIds);
          }}
        />
      )}
      {saveError && (
        <Toast message={saveError} onDismiss={() => setSaveError(null)} />
      )}
      {automationNotice && (
        <Toast
          key={automationNotice}
          tone="info"
          duration={5000}
          message={automationNotice}
          onDismiss={() => setAutomationNotice(null)}
        />
      )}
      {receiptModalCtx && (
        <ReceiptModal
          receipt={receiptModalCtx}
          onClose={() => setReceiptModalCtx(null)}
        />
      )}
      <CoverExpensesModal
        open={coverExpensesOpen}
        selectedExpenseIds={Array.from(selectedIds)}
        onClose={() => setCoverExpensesOpen(false)}
        onCovered={() => {
          // Keep the selection so the user can continue into Bulk CC Pay if they choose.
          setCoverExpensesOpen(false);
          invalidateExpenseFamily();
          setBulkPayPromptOpen(true);
        }}
      />
      {bulkPayPromptOpen && (
        <ConfirmModal
          title="Continue to Bulk CC Pay?"
          message="Do you want to continue editing these selected items using the Bulk CC Pay workflow?"
          confirmLabel="Yes"
          cancelLabel="No"
          onConfirm={() => {
            setBulkPayPromptOpen(false);
            // Pre-fill the bulk-edit modal with the Bulk CC Pay defaults, still on the
            // same selected expenses (paymentStatus → Paid, paidPeriod → 1, datePaid → today).
            setMassEditError(null);
            setMassEditPreset([
              { fieldKey: "paymentStatus", rawValue: "Paid" },
              { fieldKey: "paidPeriod", rawValue: "1" },
              { fieldKey: "datePaid", rawValue: todayIso() },
            ]);
            setMassEditOpen(true);
          }}
          onCancel={() => {
            setBulkPayPromptOpen(false);
            clearSelection();
          }}
        />
      )}
    </div>
  );
}


export { ExpensePage };
