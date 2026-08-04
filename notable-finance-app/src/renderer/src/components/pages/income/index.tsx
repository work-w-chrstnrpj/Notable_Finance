
import { useEffect, useMemo, useState } from "react";
import { useLiveCollections } from "@/components/hooks";
import { buildAnnualGroups } from "@/components/charts";
import { AnnualBarChart } from "@/components/charts";
import { Panel, MoneyValue, LoadingBlock } from "@/components/ui";
import { AccountIcon, CategoryIcon } from "@/components/ui/accounts";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmModal, type ModalState } from "@/components/ui/form-modals";
import { FlippableModal } from "@/components/ui/flippable-modal";
import { MassEditModal, type MassEditFieldOption } from "@/components/ui/mass-edit-modal";
import { Toast } from "@/components/ui/toast";
import { useIncomes, useFinanceInvalidation } from "@/lib/use-data";
import { useRecordSelection } from "@/features/records/use-record-selection";
import { useOptimisticRecords } from "@/features/records/use-optimistic-records";
import { useBulkActions } from "@/features/records/use-bulk-actions";
import { useShortcutAction } from "@/lib/shortcuts/context";
import { applyIncomeTag, stripNotionTag, getIncomeGrossTotal, getIncomeCapitalExpenditureTotal, getIncomeNetTotal } from "@/lib/finance-helpers";
import { consumePendingEdit } from "@/lib/pending-edit";
import { computeRange, incomeModeToUnit } from "@/lib/date-range";
import { calculateNetIncome } from "@/lib/finance-rules";
import { formatMoney, formatDate, toYYMMDD } from "@/lib/format";
import { useRecordSearch } from "@/features/records/use-record-search";
import { incomesApi } from "@/lib/api-client";
import { DATA_CHANGED_EVENT } from "@/lib/finance-events";
import { deleteActionLabel, deleteConfirmCopy, useUiSettings } from "@/lib/ui-settings-context";
import { usePersistedFilters } from "@/features/records/use-persisted-filters";
import { useIncomeForm } from "./use-income-form";
import { IncomeFormFields } from "./income-form-fields";
import { IncomeToolbar } from "./income-toolbar";
import { buildIncomeMassEditFields } from "./income-mass-edit-fields";
import type { AnnualGroupBy } from "@/components/constants";
import type { IncomeViewMode, IncomeRecord } from "@/types/finance";

const incomeViewModes: IncomeViewMode[] = ["Daily", "Weekly", "Monthly", "Annually"];

function IncomePage({
  viewMode,
  onViewModeChange,
  selectedDate,
}: {
  viewMode: IncomeViewMode;
  onViewModeChange: (viewMode: IncomeViewMode) => void;
  selectedDate: string;
}) {
  const {
    nonCreditActiveAccounts,
    normalIncomeCategories,
    accountNameById,
    incomeCategoryNameById,
  } = useLiveCollections();
  const incomeCategoryById = useMemo(
    () => new Map(normalIncomeCategories.map((c) => [c.id, c])),
    [normalIncomeCategories],
  );
  const categoryCell = (id: string) => {
    const c = incomeCategoryById.get(id);
    if (!c) return incomeCategoryNameById.get(id) ?? "—";
    return (
      <span className="cat-cell">
        <CategoryIcon icon={c.icon} />
        {c.source}
      </span>
    );
  };
  const accountById = useMemo(
    () => new Map(nonCreditActiveAccounts.map((a) => [a.id, a])),
    [nonCreditActiveAccounts],
  );
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
  const range = computeRange(incomeModeToUnit(viewMode), selectedDate);
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Only what the PAGE still needs; every other field is consumed inside IncomeFormFields.
  const form = useIncomeForm();
  const { setNameInput, dateInput, editingId, setEditingId } = form;
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
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState(false);
  const [annualView, setAnnualView] = useState<"table" | "chart">("table");
  const [groupBy, setGroupBy] = useState<AnnualGroupBy>("month");

  usePersistedFilters({
    ready: settingsReady,
    source: settings.incomeFilters,
    hydrate: (f) => {
      setAccountId(f.accountId);
      setCategoryId(f.categoryId);
      setFilterActive(f.filterActive);
      setAnnualView(f.annualView);
      setGroupBy(f.groupBy);
    },
    values: [accountId, categoryId, filterActive, annualView, groupBy],
    persist: () => {
      void updateSettings({
        incomeFilters: { accountId, categoryId, filterActive, annualView, groupBy },
      });
    },
  });
  const isAnnual = viewMode === "Annually";
  const { state: incomesState, refetch, applyLocal } = useIncomes({
    rangeStart: range.start,
    rangeEnd: range.end,
    // Only apply the account/category filters while the filter panel is active,
    // so a stale selection can't silently hide records once the panel is closed.
    accountId: filterActive ? accountId || undefined : undefined,
    categoryId: filterActive ? categoryId || undefined : undefined,
  });
  const { invalidateIncomeFamily } = useFinanceInvalidation();
  const { pendingRowClassName, commit, commitMany, commitDelete } =
    useOptimisticRecords<IncomeRecord>({
      applyLocal,
      invalidate: invalidateIncomeFamily,
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

  // Auto-update [YYMMDD] tag when date changes (new or edit mode).
  useEffect(() => {
    if (modal?.mode !== "new" && modal?.mode !== "edit") return;
    const yyymmdd = toYYMMDD(dateInput);
    if (!yyymmdd) return;
    setNameInput((prev) => applyIncomeTag(prev, yyymmdd));
  }, [dateInput, modal?.mode]);

  const isLoading = incomesState.status === "loading";
  const allIncomeRecords: IncomeRecord[] =
    incomesState.status === "success" ? incomesState.data : [];
  const visibleIncomeRecords: IncomeRecord[] = allIncomeRecords.filter(
    (record) => !record.name?.includes("[Deleted:"),
  );

  const {
    searchActive,
    searchQuery,
    setSearchQuery,
    filteredRecords: searchFilteredRecords,
    toggleSearch,
    resetSearch,
  } = useRecordSearch(
    visibleIncomeRecords,
    (r) => [
      r.name,
      r.date,
      accountNameById.get(r.accountId ?? "") ?? "",
      incomeCategoryNameById.get(r.categoryId) ?? "",
    ],
    [accountNameById, incomeCategoryNameById],
  );

  const annualIncomeGroups = buildAnnualGroups(
    visibleIncomeRecords.map((r) => ({
      dateIso: r.date,
      accountId: r.accountId,
      categoryId: r.categoryId,
      value: r.grossIncome,
    })),
    groupBy,
    accountNameById,
    incomeCategoryNameById,
  );

  // ── Keyboard shortcuts ──────────────────────────────────────────
  const modalOpen = modal !== null;
  useShortcutAction("view.newRecord", () => openIncomeModal("new", "New Income"), !modalOpen);
  useShortcutAction("view.search", toggleSearch, !modalOpen);
  useShortcutAction("view.filters", () => setFilterActive((f) => !f), !modalOpen);
  useShortcutAction("modal.save", () => void handleSaveIncome(), modalOpen && editing);
  useShortcutAction("modal.edit", () => setEditing((e) => !e), modalOpen);
  useShortcutAction("modal.duplicate", () => handleDuplicateIncome(), modalOpen);
  useShortcutAction("modal.delete", () => void handleDeleteIncome(), modalOpen && editingId != null);
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

  function openIncomeModal(mode: "new" | "edit", title: string, recordId?: string) {
    const record =
      recordId != null
        ? visibleIncomeRecords.find((r) => r.id === recordId)
        : undefined;
    form.loadRecord(record);
    setEditing(mode === "new"); // new starts editable; edit starts read-only
    setSaveError(null);
    setModal({ mode, title });
  }

  async function handleSaveIncome() {
    if (!form.validate()) {
      setSaveError("Please fill in all required fields.");
      return;
    }
    const payload = form.buildPayload();
    setSaveError(null);
    setSaveNotice(null);

    // Capture modal state before closing
    const existingId = modal?.mode === "edit" && editingId ? editingId : null;

    // Close modal immediately — no blocking "Saving..." state
    setModal(null);

    await commit({
      existingId,
      buildOptimistic: (tempId) =>
        ({
          id: tempId,
          name: payload.name,
          date: payload.date,
          grossIncome: payload.grossIncome,
          capitalExpenditure: payload.capitalExpenditure,
          accountId: payload.accountId,
          categoryId: payload.categoryId,
        }) as IncomeRecord,
      save: () =>
        existingId ? incomesApi.update(existingId, payload) : incomesApi.create(payload),
    });
  }

  function handleDuplicateIncome() {
    // Keep the currently-loaded field values but detach from the source record
    // so Save creates a fresh income instead of updating the original.
    setEditingId(null);
    setEditing(true);
    setSaveError(null);
    setModal({ mode: "new", title: "New Income (Copy)" });
  }


  const massEditFields = useMemo<MassEditFieldOption[]>(
    () => buildIncomeMassEditFields(nonCreditActiveAccounts, normalIncomeCategories),
    [nonCreditActiveAccounts, normalIncomeCategories],
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
      const res = await incomesApi.bulkUpdate(ids, patch);
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
      clearSelection();
      invalidateIncomeFamily();
      if (failed.length > 0) {
        setSaveNotice(`${failed.length} of ${ids.length} items failed to update.`);
      } else {
        setSaveNotice(`Updated ${updated.length} income${updated.length === 1 ? "" : "s"}.`);
      }
    } catch (err) {
      setMassEditError(err instanceof Error ? err.message : "Network error");
    } finally {
      setMassEditSaving(false);
    }
  }

  // No onPrint / onCover — Income has never offered those (both are Expense-only).
  const handleBulkAction = useBulkActions({
    selectedIds,
    applyDisabled,
    clearSelection,
    onDelete: setDeleteConfirmIds,
    onEdit: () => {
      setMassEditError(null);
      setMassEditOpen(true);
    },
    onDuplicate: async () => {
      const recordsToDuplicate = visibleIncomeRecords.filter((r) => selectedIds.has(r.id));

      if (recordsToDuplicate.length === 0) {
        clearSelection();
        return;
      }

      clearSelection();

      // Build create payloads
      const items = recordsToDuplicate.map((record) => ({
        name: `${record.name} (Copy)`,
        date: record.date,
        grossIncome: record.grossIncome,
        capitalExpenditure: record.capitalExpenditure,
        accountId: record.accountId,
        categoryId: record.categoryId,
      }));

      await commitMany({
        count: recordsToDuplicate.length,
        buildOptimistic: (tempId, i) => {
          const record = recordsToDuplicate[i];
          return { ...record, id: tempId, name: `${record.name} (Copy)` } as IncomeRecord;
        },
        save: () => incomesApi.bulkCreate(items),
        failureLabel: "Bulk duplicate failed",
        partialFailureNoun: "duplicate",
      });
    },
  });

  async function executeDeleteIncomes(idsToDelete: string[]) {
    setDeleteConfirmIds(null);
    clearSelection();
    setModal(null);
    setSaveError(null);
    setSaveNotice(null);

    await commitDelete({
      ids: idsToDelete,
      save: () => incomesApi.bulkDelete(idsToDelete, deleteMode),
      failureLabel: "Bulk delete failed",
      partialFailureNoun: "delete",
    });
  }

  function handleDeleteIncome() {
    if (!editingId) return;
    setDeleteConfirmIds([editingId]);
  }

  const enabledIncomeRecords = searchFilteredRecords.filter(
    (r) => !disabledIds.has(r.id),
  );

  function handleIncomeViewModeChange(nextViewMode: IncomeViewMode) {
    // Reset all filters when view mode changes (Issue #3)
    setAccountId("");
    setCategoryId("");
    setFilterActive(false);
    resetSearch();
    onViewModeChange(nextViewMode);
  }

  // Check for pending edit triggered by History page navigation
  useEffect(() => {
    const pending = consumePendingEdit("incomes");
    if (pending && visibleIncomeRecords.length > 0) {
      const record = visibleIncomeRecords.find((r) => r.id === pending.recordId);
      if (record) {
        openIncomeModal("edit", record.name, record.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIncomeRecords.length]);

  return (
    <div className="page-stack">
      <IncomeToolbar
        viewMode={viewMode}
        incomeViewModes={incomeViewModes}
        isAnnual={isAnnual}
        nonCreditActiveAccounts={nonCreditActiveAccounts}
        normalIncomeCategories={normalIncomeCategories}
        filterActive={filterActive}
        setFilterActive={setFilterActive}
        searchActive={searchActive}
        toggleSearch={toggleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        accountId={accountId}
        setAccountId={setAccountId}
        categoryId={categoryId}
        setCategoryId={setCategoryId}
        annualView={annualView}
        setAnnualView={setAnnualView}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        onNewIncome={() => openIncomeModal("new", "New Income")}
        onViewModeChange={handleIncomeViewModeChange}
      />


      <Panel title={`${viewMode} Income Records`}>
        {isLoading && <LoadingBlock label="Querying Notion…" />}
        {isAnnual && annualView === "chart" ? (
          <AnnualBarChart data={annualIncomeGroups} color="#0D9488" />
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
          headers={["Name", "Date", "Account", "Category", "Gross", "Expenditure", "Net"]}
          rowClassName={pendingRowClassName}
          rows={searchFilteredRecords.map((record) => {
            const netIncome = calculateNetIncome(record.grossIncome, record.capitalExpenditure);

            return [
              stripNotionTag(record.name),
              formatDate(record.date),
              accountCell(record.accountId),
              categoryCell(record.categoryId),
              <span className="num">{formatMoney(record.grossIncome)}</span>,
              <span className="num">{formatMoney(record.capitalExpenditure)}</span>,
              <MoneyValue key={`${record.id}-net`} value={netIncome} />,
            ];
          })}
          footerRows={[
            [
              "Total",
              "",
              "",
              "",
              <span className="num">{formatMoney(getIncomeGrossTotal(enabledIncomeRecords))}</span>,
              <span className="num">{formatMoney(getIncomeCapitalExpenditureTotal(enabledIncomeRecords))}</span>,
              <MoneyValue
                key="income-total-net"
                value={getIncomeNetTotal(enabledIncomeRecords)}
              />,
            ],
          ]}
          onRowClick={(recordId) => {
            const record = visibleIncomeRecords.find((r) => r.id === recordId);
            if (record) {
              openIncomeModal("edit", record.name, record.id);
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
        subtitle="Net income updates from gross income less capital expenditure."
        onEdit={() => setEditing(true)}
        onSave={handleSaveIncome}
        onDelete={handleDeleteIncome}
        onDuplicate={handleDuplicateIncome}
        onClose={() => setModal(null)}
        pageContentResource="incomes"
        recordId={editingId}
      >
        <IncomeFormFields
          form={form}
          nonCreditActiveAccounts={nonCreditActiveAccounts}
          normalIncomeCategories={normalIncomeCategories}
        />
      </FlippableModal>
      <MassEditModal
        open={massEditOpen}
        title={`Bulk edit ${selectedIds.size} income${selectedIds.size === 1 ? "" : "s"}`}
        subtitle="Name cannot be bulk-edited. Add one or more fields, set the new value, then apply to every selected row."
        fields={massEditFields}
        saving={massEditSaving}
        error={massEditError}
        onClose={() => {
          if (!massEditSaving) setMassEditOpen(false);
        }}
        onApply={applyMassEdit}
      />
      {deleteConfirmIds && (
        <ConfirmModal
          {...deleteConfirmCopy(hardDeleteEnabled, deleteConfirmIds.length)}
          danger={hardDeleteEnabled}
          onCancel={() => setDeleteConfirmIds(null)}
          onConfirm={() => {
            void executeDeleteIncomes(deleteConfirmIds);
          }}
        />
      )}
      {saveError && (
        <Toast message={saveError} onDismiss={() => setSaveError(null)} />
      )}
    </div>
  );
}

export { IncomePage };
