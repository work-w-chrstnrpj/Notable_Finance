
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useLiveCollections } from "@/components/hooks";
import { buildAnnualGroups, GroupBySelect } from "@/components/charts";
import { AnnualBarChart } from "@/components/charts";
import { Panel, Field, ComputedField, MoneyValue, FilterSelect, FilterDropdown, LoadingBlock, SegmentedControl } from "@/components/ui";
import { PageToolbar } from "@/components/ui";
import { SearchToggle, SearchInput, FilterToggle } from "@/components/ui/search-bar";
import { AccountIcon, CategoryIcon } from "@/components/ui/accounts";
import { ShortcutHint } from "@/components/shortcuts";
import { DataTable } from "@/components/ui/data-table";
import { FormModal, ConfirmModal, type ModalState } from "@/components/ui/form-modals";
import { FlippableModal } from "@/components/ui/flippable-modal";
import { MassEditModal, type MassEditFieldOption } from "@/components/ui/mass-edit-modal";
import { Toast } from "@/components/ui/toast";
import { useIncomes, useFinanceInvalidation } from "@/lib/use-data";
import { useShortcutAction } from "@/lib/shortcuts/context";
import { applyIncomeTag, stripNotionTag, parseNumberInput, getIncomeGrossTotal, getIncomeCapitalExpenditureTotal, getIncomeNetTotal } from "@/lib/finance-helpers";
import { consumePendingEdit } from "@/lib/pending-edit";
import { computeRange, incomeModeToUnit } from "@/lib/date-range";
import { calculateNetIncome, getMoneyValueTone } from "@/lib/finance-rules";
import { formatMoney, formatDate, toYYMMDD } from "@/lib/format";
import { fuzzyFilterIndices } from "@/lib/fuzzy-search";
import { incomesApi } from "@/lib/api-client";
import { DATA_CHANGED_EVENT } from "@/lib/finance-events";
import { deleteActionLabel, deleteConfirmCopy, useUiSettings } from "@/lib/ui-settings-context";
import { useDebouncedPersist } from "@/lib/use-debounced-persist";
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
    function handleIncomeViewModeChange(nextViewMode: IncomeViewMode) {
    // Reset all filters when view mode changes (Issue #3)
    setAccountId("");
    setCategoryId("");
    setFilterActive(false);
    setSearchActive(false);
    setSearchQuery("");
    onViewModeChange(nextViewMode);
  }

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
    function handleIncomeViewModeChange(nextViewMode: IncomeViewMode) {
    // Reset all filters when view mode changes (Issue #3)
    setAccountId("");
    setCategoryId("");
    setFilterActive(false);
    setSearchActive(false);
    setSearchQuery("");
    onViewModeChange(nextViewMode);
  }

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
  const [formAccountId, setFormAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [grossIncomeInput, setGrossIncomeInput] = useState("");
  const [capitalExpenditureInput, setCapitalExpenditureInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [shakeFields, setShakeFields] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [disabledIds, setDisabledIds] = useState<Set<string>>(new Set());
  const [deleteConfirmIds, setDeleteConfirmIds] = useState<string[] | null>(null);
  const { hardDeleteEnabled, settings, ready: settingsReady, updateSettings } = useUiSettings();
  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const deleteMode = hardDeleteEnabled ? "hard" : "soft";
  const deleteLabel = deleteActionLabel(hardDeleteEnabled);
  const [massEditOpen, setMassEditOpen] = useState(false);
  const [massEditSaving, setMassEditSaving] = useState(false);
  const [massEditError, setMassEditError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState(false);
  const [annualView, setAnnualView] = useState<"table" | "chart">("table");
  const [groupBy, setGroupBy] = useState<AnnualGroupBy>("month");

  useEffect(() => {
    if (!settingsReady || filtersHydrated) return;
    const f = settings.incomeFilters;
    setAccountId(f.accountId);
    setCategoryId(f.categoryId);
    setFilterActive(f.filterActive);
    setAnnualView(f.annualView);
    setGroupBy(f.groupBy);
    setFiltersHydrated(true);
  }, [settingsReady, filtersHydrated, settings.incomeFilters]);

  useDebouncedPersist(
    filtersHydrated,
    [accountId, categoryId, filterActive, annualView, groupBy],
    () => {
      void updateSettings({
        incomeFilters: { accountId, categoryId, filterActive, annualView, groupBy },
      });
    },
  );
  const isAnnual = viewMode === "Annually";
  const calculatedNetIncome = calculateNetIncome(
    parseNumberInput(grossIncomeInput),
    parseNumberInput(capitalExpenditureInput),
  );
  const { state: incomesState, refetch, applyLocal } = useIncomes({
    rangeStart: range.start,
    rangeEnd: range.end,
    // Only apply the account/category filters while the filter panel is active,
    // so a stale selection can't silently hide records once the panel is closed.
    accountId: filterActive ? accountId || undefined : undefined,
    categoryId: filterActive ? categoryId || undefined : undefined,
  });
  const { invalidateIncomeFamily } = useFinanceInvalidation();
  useEffect(() => {
    const handler = () => {
      void refetch();
    };
    window.addEventListener(DATA_CHANGED_EVENT, handler);
    function handleIncomeViewModeChange(nextViewMode: IncomeViewMode) {
    // Reset all filters when view mode changes (Issue #3)
    setAccountId("");
    setCategoryId("");
    setFilterActive(false);
    setSearchActive(false);
    setSearchQuery("");
    onViewModeChange(nextViewMode);
  }

  return () => window.removeEventListener(DATA_CHANGED_EVENT, handler);
  }, [refetch]);


  // Clear selection when view mode changes
  useEffect(() => {
    setSelectedIds(new Set());
    setDisabledIds(new Set());
  }, [viewMode]);

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

  const fuzzyMatchedIndices = useMemo(
    () =>
      searchActive && searchQuery.trim()
        ? fuzzyFilterIndices(visibleIncomeRecords, searchQuery, (r) => [
            r.name,
            r.date,
            accountNameById.get(r.accountId ?? "") ?? "",
            incomeCategoryNameById.get(r.categoryId) ?? "",
          ])
        : visibleIncomeRecords.map((_, i) => i),
    [visibleIncomeRecords, searchActive, searchQuery, accountNameById, incomeCategoryNameById],
  );
  const searchFilteredRecords = useMemo(
    () => fuzzyMatchedIndices.map((i) => visibleIncomeRecords[i]),
    [fuzzyMatchedIndices, visibleIncomeRecords],
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
  useShortcutAction("view.search", () => setSearchActive((s) => !s), !modalOpen);
  useShortcutAction("view.filters", () => setFilterActive((f) => !f), !modalOpen);
  useShortcutAction("modal.save", () => void handleSaveIncome(), modalOpen && editing);
  useShortcutAction("modal.edit", () => setEditing((e) => !e), modalOpen);
  useShortcutAction("modal.duplicate", () => handleDuplicateIncome(), modalOpen);
  useShortcutAction("modal.delete", () => void handleDeleteIncome(), modalOpen && editingId != null);
  useShortcutAction("modal.close", () => setModal(null), modalOpen);
  const hasSelection = selectedIds.size > 0;
  useShortcutAction(
    "mass.selectAll",
    () => setSelectedIds(new Set(searchFilteredRecords.map((r) => r.id).filter(Boolean))),
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
    setNameInput(record?.name ?? "");
    setDateInput(record?.date ?? "");
    setFormAccountId(record?.accountId ?? "");
    setFormCategoryId(record?.categoryId ?? "");
    setGrossIncomeInput(record?.grossIncome?.toString() ?? "");
    setCapitalExpenditureInput(record?.capitalExpenditure?.toString() ?? "");
    setEditingId(record?.id ?? null);
    setEditing(mode === "new"); // new starts editable; edit starts read-only
    setSaveError(null);
    setModal({ mode, title });
  }

  async function handleSaveIncome() {
    const invalid = new Set<string>();
    if (!nameInput.trim()) invalid.add("name");
    if (!dateInput) invalid.add("date");
    if (invalid.size > 0) {
      setShakeFields(invalid);
      setSaveError("Please fill in all required fields.");
      setTimeout(() => setShakeFields(new Set()), 600);
      return;
    }
    const payload = {
      name: nameInput.trim(),
      date: dateInput,
      grossIncome: parseNumberInput(grossIncomeInput),
      capitalExpenditure: parseNumberInput(capitalExpenditureInput),
      accountId: formAccountId,
      categoryId: formCategoryId,
    };
    setSaveError(null);
    setSaveNotice(null);

    // Capture modal state before closing
    const isEdit = modal?.mode === "edit" && editingId;
    const tempId = isEdit ? editingId! : `pending-${Date.now()}`;

    // Close modal immediately — no blocking "Saving..." state
    setModal(null);

    // Build the optimistic record for the table
    const optimisticRecord: IncomeRecord = {
      id: tempId,
      name: payload.name,
      date: payload.date,
      grossIncome: payload.grossIncome,
      capitalExpenditure: payload.capitalExpenditure,
      accountId: payload.accountId,
      categoryId: payload.categoryId,
    } as IncomeRecord;

    // Show the row as dimmed/pending
    setPendingIds((prev) => new Set(prev).add(tempId));

    // Inject into the query cache so the table renders immediately
    applyLocal((rows) => {
      if (isEdit) {
        const idx = rows.findIndex((r) => r.id === tempId);
        if (idx === -1) return rows;
        const next = rows.slice();
        next[idx] = optimisticRecord;
        return next;
      }
      return [optimisticRecord, ...rows];
    });

    try {
      const res = isEdit
        ? await incomesApi.update(editingId!, payload)
        : await incomesApi.create(payload);
      if (!res.success) {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(tempId);
          return next;
        });
        applyLocal((rows) => rows.filter((r) => r.id !== tempId));
        setSaveNotice(`Save failed: ${res.error.message}`);
        return;
      }
      // Replace optimistic item with the real saved record
      const saved = res.data;
      applyLocal((rows) => {
        const idx = rows.findIndex((r) => r.id === tempId);
        if (idx === -1) return [saved, ...rows];
        const next = rows.slice();
        next[idx] = saved;
        return next;
      });
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      invalidateIncomeFamily();
    } catch (err) {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(tempId);
        return next;
      });
      applyLocal((rows) => rows.filter((r) => r.id !== tempId));
      setSaveNotice(`Network error: ${err instanceof Error ? err.message : "Please try again."}`);
    }
  }

  function handleDuplicateIncome() {
    // Keep the currently-loaded field values but detach from the source record
    // so Save creates a fresh income instead of updating the original.
    setEditingId(null);
    setEditing(true);
    setSaveError(null);
    setModal({ mode: "new", title: "New Income (Copy)" });
  }

  function toggleRowSelect(recordId: string, selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(recordId);
      else next.delete(recordId);
      return next;
    });
  }

  const massEditFields = useMemo<MassEditFieldOption[]>(
    () => [
      { key: "date", label: "Date", kind: "date" },
      { key: "grossIncome", label: "Gross Income", kind: "number" },
      { key: "capitalExpenditure", label: "Capital Expenditure", kind: "number" },
      {
        key: "accountId",
        label: "Accounts",
        kind: "select",
        clearable: true,
        emptyLabel: "— None —",
        options: nonCreditActiveAccounts.map((a) => ({ value: a.id, label: a.name })),
      },
      {
        key: "categoryId",
        label: "Categories",
        kind: "select",
        clearable: true,
        emptyLabel: "— None —",
        options: normalIncomeCategories.map((c) => ({ value: c.id, label: c.source })),
      },
    ],
    [nonCreditActiveAccounts, normalIncomeCategories],
  );

  async function applyMassEdit(patch: Record<string, string | number | null>) {
    const ids = Array.from(selectedIds).filter((id): id is string => id != null);
    if (ids.length === 0) {
      setMassEditOpen(false);
      setSelectedIds(new Set());
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
      setSelectedIds(new Set());
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

  async function handleBulkAction(action: "enable" | "disable" | "duplicate" | "delete" | "edit" | "print" | "cover") {
    if (action === "edit") {
      if (selectedIds.size === 0) return;
      setMassEditError(null);
      setMassEditOpen(true);
      return;
    }

    if (action === "enable" || action === "disable") {
      const shouldDisable = action === "disable";
      setDisabledIds((prev) => {
        const next = new Set(prev);
        for (const id of selectedIds) {
          if (shouldDisable) next.add(id);
          else next.delete(id);
        }
        return next;
      });
      setSelectedIds(new Set());
      return;
    }

    if (action === "duplicate") {
      const recordsToDuplicate = visibleIncomeRecords.filter(
        (r) => selectedIds.has(r.id)
      );

      if (recordsToDuplicate.length === 0) {
        setSelectedIds(new Set());
        return;
      }

      setSelectedIds(new Set());

      // Build create payloads
      const items = recordsToDuplicate.map((record) => ({
        name: `${record.name} (Copy)`,
        date: record.date,
        grossIncome: record.grossIncome,
        capitalExpenditure: record.capitalExpenditure,
        accountId: record.accountId,
        categoryId: record.categoryId,
      }));

      // Optimistically add temp rows
      const tempIds: string[] = [];
      for (const record of recordsToDuplicate) {
        const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        tempIds.push(tempId);
        setPendingIds((prev) => new Set(prev).add(tempId));
        applyLocal((rows) => [
          { ...record, id: tempId, name: `${record.name} (Copy)` } as IncomeRecord,
          ...rows,
        ]);
      }

      try {
        const res = await incomesApi.bulkCreate(items);
        if (!res.success) {
          // Remove all temp rows on total failure
          for (const tempId of tempIds) {
            applyLocal((rows) => rows.filter((r) => r.id !== tempId));
            setPendingIds((prev) => { const n = new Set(prev); n.delete(tempId); return n; });
          }
          void refetch();
          setSaveNotice(`Bulk duplicate failed: ${res.error.message}`);
        } else {
          const { created, failed } = res.data;
          // Replace temp rows with real records
          for (let i = 0; i < tempIds.length; i++) {
            const tempId = tempIds[i];
            const match = created.find((_, ci) => ci === i);
            if (match) {
              applyLocal((rows) => {
                const idx = rows.findIndex((r) => r.id === tempId);
                if (idx === -1) return [match, ...rows];
                const next = rows.slice();
                next[idx] = match;
                return next;
              });
            } else {
              applyLocal((rows) => rows.filter((r) => r.id !== tempId));
            }
            setPendingIds((prev) => { const n = new Set(prev); n.delete(tempId); return n; });
          }
          if (failed.length > 0) {
            setSaveNotice(`${failed.length} of ${items.length} items failed to duplicate.`);
          }
          invalidateIncomeFamily();
        }
      } catch (err) {
        for (const tempId of tempIds) {
          applyLocal((rows) => rows.filter((r) => r.id !== tempId));
          setPendingIds((prev) => { const n = new Set(prev); n.delete(tempId); return n; });
        }
        setSaveNotice(`Network error: ${err instanceof Error ? err.message : "Please try again."}`);
      }
    }

    if (action === "delete") {
      const idsToDelete = Array.from(selectedIds).filter((id): id is string => id != null);

      if (idsToDelete.length === 0) {
        setSelectedIds(new Set());
        return;
      }

      setDeleteConfirmIds(idsToDelete);
    }
  }

  async function executeDeleteIncomes(idsToDelete: string[]) {
    setDeleteConfirmIds(null);
    setSelectedIds(new Set());
    setModal(null);
    setSaveError(null);
    setSaveNotice(null);

    for (const id of idsToDelete) {
      setPendingIds((prev) => new Set(prev).add(id));
    }
    applyLocal((rows) => rows.filter((r) => !idsToDelete.includes(r.id)));

    try {
      const res = await incomesApi.bulkDelete(idsToDelete, deleteMode);
      if (!res.success) {
        for (const id of idsToDelete) {
          setPendingIds((prev) => {
            const n = new Set(prev);
            n.delete(id);
            return n;
          });
        }
        void refetch();
        setSaveNotice(`Bulk delete failed: ${res.error.message}`);
      } else {
        const { deleted, failed } = res.data;
        for (const id of deleted) {
          setPendingIds((prev) => {
            const n = new Set(prev);
            n.delete(id);
            return n;
          });
        }
        if (failed.length > 0) {
          for (const f of failed) {
            setPendingIds((prev) => {
              const n = new Set(prev);
              n.delete(f.id);
              return n;
            });
          }
          void refetch();
          setSaveNotice(`${failed.length} of ${idsToDelete.length} items failed to delete.`);
        }
        invalidateIncomeFamily();
      }
    } catch (err) {
      for (const id of idsToDelete) {
        setPendingIds((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
      }
      void refetch();
      setSaveNotice(`Network error: ${err instanceof Error ? err.message : "Please try again."}`);
    }
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
    setSearchActive(false);
    setSearchQuery("");
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
      <PageToolbar
        title="Income"
        actions={
          <>
            <FilterToggle
              active={filterActive}
              onToggle={() => setFilterActive((prev) => !prev)}
              shortcutId="view.filters"
            />
            <SearchToggle
              active={searchActive}
              onToggle={() => {
                setSearchActive((prev) => !prev);
                if (searchActive) setSearchQuery("");
              }}
              shortcutId="view.search"
            />
            <button
              type="button"
              className="button button--primary"
              onClick={() => openIncomeModal("new", "New Income")}
            >
              <Plus size={16} />
              New Income
              <ShortcutHint id="view.newRecord" />
            </button>
          </>
        }
      />

      {(searchActive || filterActive) && (
        <div className="toolbar-row">
          {filterActive && (
            <>
              <FilterDropdown
                placeholder="All Accounts"
                value={accountId}
                onChange={setAccountId}
                items={nonCreditActiveAccounts.map((account) => ({
                  id: account.id,
                  label: account.name,
                  icon: <AccountIcon account={account} />,
                }))}
              />
              <FilterDropdown
                placeholder="All Categories"
                value={categoryId}
                onChange={setCategoryId}
                items={normalIncomeCategories.map((category) => ({
                  id: category.id,
                  label: category.source,
                  icon: <CategoryIcon icon={category.icon} />,
                }))}
              />
            </>
          )}
          {searchActive && (
            <SearchInput
              query={searchQuery}
              onQueryChange={setSearchQuery}
              placeholder="Search income..."
            />
          )}
        </div>
      )}

      <SegmentedControl
        label="Income view"
        options={incomeViewModes.map((mode) => ({ label: mode, value: mode }))}
        value={viewMode}
        onChange={(value) => handleIncomeViewModeChange(value as IncomeViewMode)}
        shortcutId="view.filterTab"
      />

      {isAnnual && (
        <div className="annual-controls">
          <SegmentedControl
            label="Annual display"
            options={[
              { label: "Table", value: "table" },
              { label: "Chart", value: "chart" },
            ]}
            value={annualView}
            onChange={(v) => setAnnualView(v as "table" | "chart")}
          />
          {annualView === "chart" && (
            <GroupBySelect value={groupBy} onChange={setGroupBy} />
          )}
        </div>
      )}

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
          rowClassName={(recordId) => {
            if (recordId && pendingIds.has(recordId)) {
              return "record-pending record-pending-appear";
            }
            return undefined;
          }}
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
