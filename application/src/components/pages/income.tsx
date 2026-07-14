"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useLiveCollections } from "@/components/hooks";
import { buildAnnualGroups, GroupBySelect } from "@/components/charts";
import { AnnualBarChart } from "@/components/charts";
import { Panel, Field, ComputedField, MoneyValue, FilterSelect, LoadingBlock, SegmentedControl } from "@/components/ui";
import { PageToolbar } from "@/components/ui";
import { SearchToggle, SearchInput } from "@/components/ui/search-bar";
import { DataTable } from "@/components/ui/data-table";
import { FormModal, type ModalState } from "@/components/ui/form-modals";
import { Toast } from "@/components/ui/toast";
import { useIncomes, useFinanceInvalidation } from "@/lib/use-data";
import { applyIncomeTag, stripNotionTag, parseNumberInput, getIncomeGrossTotal, getIncomeCapitalExpenditureTotal, getIncomeNetTotal } from "@/lib/finance-helpers";
import { computeRange, incomeModeToUnit } from "@/lib/date-range";
import { calculateNetIncome, getMoneyValueTone } from "@/lib/finance-rules";
import { formatMoney, formatDate, toYYMMDD } from "@/lib/format";
import { fuzzyFilterIndices } from "@/lib/fuzzy-search";
import { incomesApi } from "@/lib/api-client";
import { DATA_CHANGED_EVENT } from "@/lib/finance-events";
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [disabledIds, setDisabledIds] = useState<Set<number>>(new Set());
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [annualView, setAnnualView] = useState<"table" | "chart">("table");
  const [groupBy, setGroupBy] = useState<AnnualGroupBy>("month");
  const isAnnual = viewMode === "Annually";
  const calculatedNetIncome = calculateNetIncome(
    parseNumberInput(grossIncomeInput),
    parseNumberInput(capitalExpenditureInput),
  );
  const { state: incomesState, refetch, applyLocal } = useIncomes({
    rangeStart: range.start,
    rangeEnd: range.end,
    accountId: accountId || undefined,
    categoryId: categoryId || undefined,
  });
  const { invalidateIncomeFamily } = useFinanceInvalidation();
  useEffect(() => {
    const handler = () => {
      void refetch();
    };
    window.addEventListener(DATA_CHANGED_EVENT, handler);
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

  function toggleRowSelect(rowIndex: number, selected: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) next.add(rowIndex);
      else next.delete(rowIndex);
      return next;
    });
  }

  async function handleBulkAction(action: "enable" | "disable" | "duplicate" | "delete") {
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
        .map((idx) => visibleIncomeRecords[idx])
        .filter((r): r is IncomeRecord => r != null);

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
      const idsToDelete = Array.from(selectedIds)
        .map((idx) => visibleIncomeRecords[idx]?.id)
        .filter((id): id is string => id != null);

      if (idsToDelete.length === 0) {
        setSelectedIds(new Set());
        return;
      }

      // Clear selection FIRST so indices don't shift onto wrong rows
      setSelectedIds(new Set());

      // Optimistic: remove all selected from the visible list
      for (const idx of selectedIds) {
        const record = visibleIncomeRecords[idx];
        if (record) setPendingIds((prev) => new Set(prev).add(record.id));
      }
      applyLocal((rows) => rows.filter((r) => !idsToDelete.includes(r.id)));

      try {
        const res = await incomesApi.bulkDelete(idsToDelete);
        if (!res.success) {
          // Restore all on total failure
          for (const id of idsToDelete) {
            setPendingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
          }
          void refetch();
          setSaveNotice(`Bulk delete failed: ${res.error.message}`);
        } else {
          const { deleted, failed } = res.data;
          // Clear pending for successfully deleted
          for (const id of deleted) {
            setPendingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
          }
          // Restore failed ones
          if (failed.length > 0) {
            for (const f of failed) {
              setPendingIds((prev) => { const n = new Set(prev); n.delete(f.id); return n; });
            }
            void refetch();
            setSaveNotice(`${failed.length} of ${idsToDelete.length} items failed to delete.`);
          }
          invalidateIncomeFamily();
        }
      } catch (err) {
        for (const id of idsToDelete) {
          setPendingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
        }
        void refetch();
        setSaveNotice(`Network error: ${err instanceof Error ? err.message : "Please try again."}`);
      }
    }
  }

  async function handleDeleteIncome() {
    if (!editingId) return;
    if (!window.confirm("Soft-delete this income in Notion?")) return;
    const deletedId = editingId;
    setSaveError(null);
    setSaveNotice(null);

    // Close modal immediately
    setModal(null);

    // Show the row as dimmed/pending
    setPendingIds((prev) => new Set(prev).add(deletedId));

    // Remove from the visible list optimistically
    applyLocal((rows) => rows.filter((r) => r.id !== deletedId));

    try {
      const res = await incomesApi.delete(deletedId);
      if (!res.success) {
        // Restore the item since delete failed — refetch from server
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(deletedId);
          return next;
        });
        void refetch();
        setSaveNotice(`Delete failed: ${res.error.message}`);
        return;
      }
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(deletedId);
        return next;
      });
      invalidateIncomeFamily();
    } catch (err) {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(deletedId);
        return next;
      });
      void refetch();
      setSaveNotice(`Network error: ${err instanceof Error ? err.message : "Please try again."}`);
    }
  }

  const enabledIncomeRecords = searchFilteredRecords.filter(
    (_, idx) => !disabledIds.has(idx),
  );

  return (
    <div className="page-stack">
      <PageToolbar
        title="Income"
        actions={
          <>
            <SearchToggle
              active={searchActive}
              onToggle={() => {
                setSearchActive((prev) => !prev);
                if (searchActive) setSearchQuery("");
              }}
            />
            <FilterSelect
              placeholder="All Accounts"
              placeholderDisabled={false}
              value={accountId}
              onChange={setAccountId}
            >
              {nonCreditActiveAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect
              placeholder="All Categories"
              placeholderDisabled={false}
              value={categoryId}
              onChange={setCategoryId}
            >
              {normalIncomeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.source}
                </option>
              ))}
            </FilterSelect>
            <button
              type="button"
              className="button button--primary"
              onClick={() => openIncomeModal("new", "New Income")}
            >
              <Plus size={16} />
              New Income
            </button>
          </>
        }
      />

      {searchActive && (
        <SearchInput
          query={searchQuery}
          onQueryChange={setSearchQuery}
          placeholder="Search income..."
        />
      )}

      <SegmentedControl
        label="Income view"
        options={incomeViewModes.map((mode) => ({ label: mode, value: mode }))}
        value={viewMode}
        onChange={(value) => onViewModeChange(value as IncomeViewMode)}
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
          selectedIds={selectedIds}
          disabledIds={disabledIds}
          onToggleSelect={toggleRowSelect}
          onBulkAction={handleBulkAction}
          headers={["Name", "Date", "Account", "Category", "Gross", "Expenditure", "Net"]}
          rowClassName={(rowIndex) => {
            const record = visibleIncomeRecords[rowIndex];
            if (record && pendingIds.has(record.id)) {
              return "record-pending record-pending-appear";
            }
            return undefined;
          }}
          rows={searchFilteredRecords.map((record) => {
            const netIncome = calculateNetIncome(record.grossIncome, record.capitalExpenditure);

            return [
              stripNotionTag(record.name),
              formatDate(record.date),
              accountNameById.get(record.accountId ?? "") ?? "—",
              incomeCategoryNameById.get(record.categoryId) ?? "—",
              formatMoney(record.grossIncome),
              formatMoney(record.capitalExpenditure),
              <MoneyValue key={`${record.id}-net`} value={netIncome} />,
            ];
          })}
          footerRows={[
            [
              "Total",
              "",
              "",
              "",
              formatMoney(getIncomeGrossTotal(enabledIncomeRecords)),
              formatMoney(getIncomeCapitalExpenditureTotal(enabledIncomeRecords)),
              <MoneyValue
                key="income-total-net"
                value={getIncomeNetTotal(enabledIncomeRecords)}
              />,
            ],
          ]}
          onRowClick={(rowIndex) => {
            const record = visibleIncomeRecords[rowIndex];
            if (record) {
              openIncomeModal("edit", record.name, record.id);
            }
          }}
        />
        )}
      </Panel>

      {saveNotice && (
        <div className="save-notice" style={{ padding: "0.75rem 1rem", borderRadius: 8, background: "var(--color-warning-bg, #fef3c7)", color: "var(--color-warning-text, #92400e)", marginBottom: "0.5rem", fontSize: "0.875rem", cursor: "pointer" }} onClick={() => setSaveNotice(null)}>
          {saveNotice}
        </div>
      )}

      <FormModal
        deleteLabel="Soft Delete"
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
            <select value={formAccountId} onChange={(event) => setFormAccountId(event.target.value)}>
              <option value="">— None —</option>
              {nonCreditActiveAccounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Categories">
            <select value={formCategoryId} onChange={(event) => setFormCategoryId(event.target.value)}>
              <option value="">— None —</option>
              {normalIncomeCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.source}</option>
              ))}
            </select>
          </Field>
          <ComputedField
            label="Net Income"
            value={formatMoney(calculatedNetIncome)}
            valueTone={getMoneyValueTone(calculatedNetIncome)}
          />
        </div>
      </FormModal>
      {saveError && (
        <Toast message={saveError} onDismiss={() => setSaveError(null)} />
      )}
    </div>
  );
}

export { IncomePage };
