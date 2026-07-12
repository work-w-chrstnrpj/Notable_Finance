"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useLiveCollections } from "@/components/hooks";
import { buildAnnualGroups, GroupBySelect } from "@/components/charts";
import { AnnualBarChart } from "@/components/charts";
import { Panel, Field, ComputedField, MoneyValue, FilterSelect, LoadingBlock, SegmentedControl } from "@/components/ui";
import { PageToolbar } from "@/components/ui";
import { DataTable } from "@/components/ui/data-table";
import { FormModal, type ModalState } from "@/components/ui/form-modals";
import { useIncomes, useFinanceInvalidation } from "@/lib/use-data";
import { applyIncomeTag, stripNotionTag, parseNumberInput, getIncomeGrossTotal, getIncomeCapitalExpenditureTotal, getIncomeNetTotal } from "@/lib/finance-helpers";
import { computeRange, incomeModeToUnit } from "@/lib/date-range";
import { calculateNetIncome, getMoneyValueTone } from "@/lib/finance-rules";
import { formatMoney, formatDate, toYYMMDD } from "@/lib/format";
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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    if (!nameInput.trim() || !dateInput) {
      setSaveError("Name and date are required.");
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
    setSaving(true);
    setSaveError(null);
    const res =
      modal?.mode === "edit" && editingId
        ? await incomesApi.update(editingId, payload)
        : await incomesApi.create(payload);
    setSaving(false);
    if (!res.success) {
      setSaveError(res.error.message || "Failed to save to Notion.");
      return;
    }
    setModal(null);
    // Optimistic: splice the returned record into the visible list immediately,
    // then invalidate the income family so this list AND cross-section views
    // (Dashboard, Monthly Monitoring) reconcile from the server.
    const saved = res.data;
    applyLocal((rows) => {
      const idx = rows.findIndex((r) => r.id === saved.id);
      if (idx === -1) return [saved, ...rows];
      const next = rows.slice();
      next[idx] = saved;
      return next;
    });
    invalidateIncomeFamily();
  }

  function handleDuplicateIncome() {
    // Keep the currently-loaded field values but detach from the source record
    // so Save creates a fresh income instead of updating the original.
    setEditingId(null);
    setEditing(true);
    setSaveError(null);
    setModal({ mode: "new", title: "New Income (Copy)" });
  }

  async function handleDeleteIncome() {
    if (!editingId) return;
    if (!window.confirm("Soft-delete this income in Notion?")) return;
    const deletedId = editingId;
    setSaving(true);
    const res = await incomesApi.delete(deletedId);
    setSaving(false);
    if (!res.success) {
      setSaveError(res.error.message || "Failed to delete.");
      return;
    }
    setModal(null);
    // Optimistic: drop the row immediately, then invalidate the income family so
    // this list and cross-section views reconcile.
    applyLocal((rows) => rows.filter((r) => r.id !== deletedId));
    invalidateIncomeFamily();
  }

  return (
    <div className="page-stack">
      <PageToolbar
        title="Income"
        actions={
          <>
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
          headers={["Name", "Date", "Account", "Category", "Gross", "Expenditure", "Net"]}
          rows={visibleIncomeRecords.map((record) => {
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
              formatMoney(getIncomeGrossTotal(visibleIncomeRecords)),
              formatMoney(getIncomeCapitalExpenditureTotal(visibleIncomeRecords)),
              <MoneyValue
                key="income-total-net"
                value={getIncomeNetTotal(visibleIncomeRecords)}
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

      <FormModal
        deleteLabel="Soft Delete"
        modal={modal}
        editing={editing}
        saving={saving}
        error={saveError}
        subtitle="Net income updates from gross income less capital expenditure."
        onEdit={() => setEditing(true)}
        onSave={handleSaveIncome}
        onDelete={handleDeleteIncome}
        onDuplicate={handleDuplicateIncome}
        onClose={() => setModal(null)}
      >
        <div className="form-grid form-grid--single">
          <Field label="Name">
            <input
              placeholder="Income title"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={dateInput}
              onChange={(event) => setDateInput(event.target.value)}
            />
          </Field>
          <Field label="Gross Income">
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
    </div>
  );
}

export { IncomePage };
