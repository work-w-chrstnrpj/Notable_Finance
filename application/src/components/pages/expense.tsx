"use client";

import { useMemo, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useLiveCollections, isSpecificExpenseCategoryFilter } from "@/components/hooks";
import { buildAnnualGroups, GroupBySelect, AnnualBarChart } from "@/components/charts";
import {
  Panel,
  Field,
  ComputedField,
  FormSectionDivider,
  FilterSelect,
  LoadingBlock,
  SegmentedControl,
  PageToolbar,
} from "@/components/ui";
import { SearchToggle, SearchInput, FilterToggle } from "@/components/ui/search-bar";
import { DataTable } from "@/components/ui/data-table";
import { FormModal, type ModalState } from "@/components/ui/form-modals";
import { Toast } from "@/components/ui/toast";
import { useExpenses, useFinanceInvalidation } from "@/lib/use-data";
import { useFabRegister, type ReceiptContext, type ReceiptRow } from "@/lib/fab-export-context";
import { applyNotionTag, getMonthLabel, stripNotionTag } from "@/lib/finance-helpers";
import { computeRange, expenseModeToUnit, anchorMonth } from "@/lib/date-range";
import {
  calculateGrossPrice,
  calculateInstallmentAmount,
  calculatePaidAmount,
  calculateRemainingBalance,
  calculateExpectedPaymentDate,
  calculatePasabuyReceivedAmount,
  calculatePasabuyerBalance,
  getExpenseConditionalSections,
  pasabuyerLabels,
  pasabuyStatusLabels,
  paymentFrequencyLabels,
  paymentStatusLabels,
} from "@/lib/finance-rules";
import { formatMoney, formatDate, toYYMMDD } from "@/lib/format";
import { fuzzyFilterIndices } from "@/lib/fuzzy-search";
import { expensesApi } from "@/lib/api-client";
import { DATA_CHANGED_EVENT } from "@/lib/finance-events";
import { parseNumberInput, parseOptionalNumberInput, getExpenseTotal } from "@/lib/finance-helpers";
import {
  expenseCategoryFilterWithoutPasabuy,
  type AccountScope,
  type AnnualGroupBy,
} from "@/components/constants";
import type {
  ExpenseViewMode,
  ExpenseRecord,
  PaymentFrequency,
  PaymentStatus,
  PasabuyStatus,
} from "@/types/finance";

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
  const [descriptionInput, setDescriptionInput] = useState("");
  const [accountFilterId, setAccountFilterId] = useState("");
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState("");
  const [pasabuyerFilter, setPasabuyerFilter] = useState("");
  const [annualView, setAnnualView] = useState<"table" | "chart">("table");
  const [groupBy, setGroupBy] = useState<AnnualGroupBy>("month");
  const isAnnual = viewMode === "Annually";
  const [formAccountId, setFormAccountId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [purchaseDateInput, setPurchaseDateInput] = useState("");
  const [datePaidInput, setDatePaidInput] = useState("");
  const [expenseAmountInput, setExpenseAmountInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | "">("");
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency | "">("");
  const [periodCountInput, setPeriodCountInput] = useState("");
  const [paidPeriodInput, setPaidPeriodInput] = useState("");
  const [pasabuyer, setPasabuyer] = useState("");
  const [pasabuyStatus, setPasabuyStatus] = useState<PasabuyStatus | "">("");
  const [pasabuyDateOfPaymentInput, setPasabuyDateOfPaymentInput] = useState("");
  const [pasabuyPaidPeriodInput, setPasabuyPaidPeriodInput] = useState("");
  const [pasabuyAccountReceiverId, setPasabuyAccountReceiverId] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterActive, setFilterActive] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);

  const pasabuyCategory = expenseCategories.find((c) => /pasabuy/i.test(c.name));
  const selectedFormAccount = activeAccounts.find((account) => account.id === formAccountId);
  const accountType = selectedFormAccount?.type ?? "Cash";
  const categoryName = expenseCategoryNameById.get(formCategoryId) ?? "";
  const sections = getExpenseConditionalSections({
    accountType,
    viewMode,
    categoryName,
  });
  const expenseAmount = parseNumberInput(expenseAmountInput);
  const interestAmount = sections.creditCard ? parseNumberInput(interestInput) : 0;
  const periodCount = parseOptionalNumberInput(periodCountInput);
  const paidPeriod = parseOptionalNumberInput(paidPeriodInput);
  const pasabuyPaidPeriod = parseOptionalNumberInput(pasabuyPaidPeriodInput);
  const grossPrice = calculateGrossPrice(expenseAmount, interestAmount);
  const installmentAmount = calculateInstallmentAmount({
    grossPrice,
    paymentStatus,
    periodCount,
  });
  const paidAmount = calculatePaidAmount({
    grossPrice,
    paymentStatus,
    installmentAmount,
    paidPeriod,
  });
  const remainingBalance = calculateRemainingBalance(grossPrice, paidAmount);
  const expectedPaymentDate = calculateExpectedPaymentDate({
    purchaseDate: purchaseDateInput,
    billingDay: selectedFormAccount?.billingDay ?? null,
    dueDay: selectedFormAccount?.dueDay ?? null,
  });
  const pasabuyReceivedAmount = calculatePasabuyReceivedAmount({
    grossPrice,
    pasabuyStatus,
    installmentAmount,
    pasabuyPaidPeriod,
    periodCount,
  });
  const pasabuyerBalance = calculatePasabuyerBalance(grossPrice, pasabuyReceivedAmount);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [shakeFields, setShakeFields] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [disabledIds, setDisabledIds] = useState<Set<number>>(new Set());
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const { state: expensesState, refetch, applyLocal } = useExpenses({
    rangeStart: expenseRange?.start,
    rangeEnd: expenseRange?.end,
    accountId: accountFilterId || undefined,
    categoryId: isSpecificExpenseCategoryFilter(expenseCategoryFilter)
      ? expenseCategoryFilter
      : undefined,
    paymentStatus: undefined,
    pasabuyer: pasabuyerFilter || undefined,
    expenseViewMode: viewMode,
  });
  const { invalidateExpenseFamily } = useFinanceInvalidation();
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

  const isLoading = expensesState.status === "loading";
  const allExpenseRecords: ExpenseRecord[] =
    expensesState.status === "success" ? expensesState.data : [];
  const visibleExpenseRecords: ExpenseRecord[] = allExpenseRecords.filter(
    (record) => {
      if (record.description?.includes("[Deleted:")) return false;
      if (
        expenseCategoryFilter === expenseCategoryFilterWithoutPasabuy &&
        pasabuyCategory &&
        record.categoryId === pasabuyCategory.id
      ) {
        return false;
      }
      return true;
    },
  );

  // Fuzzy search: filter visible records by search query (client-side only)
  const fuzzyMatchedIndices = useMemo(
    () =>
      searchActive && searchQuery.trim()
        ? fuzzyFilterIndices(visibleExpenseRecords, searchQuery, (r) => [
            r.description,
            r.purchaseDate,
            r.datePaid ?? "",
            accountNameById.get(r.accountId) ?? "",
            expenseCategoryNameById.get(r.categoryId) ?? "",
            r.pasabuyer ?? "",
          ])
        : visibleExpenseRecords.map((_, i) => i),
    [visibleExpenseRecords, searchActive, searchQuery, accountNameById, expenseCategoryNameById],
  );
  const searchFilteredRecords = useMemo(
    () => fuzzyMatchedIndices.map((i) => visibleExpenseRecords[i]),
    [fuzzyMatchedIndices, visibleExpenseRecords],
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
  function deriveExpenseComputed(record: ExpenseRecord) {
    const gross = calculateGrossPrice(record.amount, record.interest ?? 0);
    const installment = calculateInstallmentAmount({
      grossPrice: gross,
      paymentStatus: record.paymentStatus,
      periodCount: record.periodCount,
    });
    const paid = calculatePaidAmount({
      grossPrice: gross,
      paymentStatus: record.paymentStatus,
      installmentAmount: installment,
      paidPeriod: record.paidPeriod,
    });
    const remaining = calculateRemainingBalance(gross, paid);
    const account = accountById.get(record.accountId ?? "");
    const expected = calculateExpectedPaymentDate({
      purchaseDate: record.purchaseDate,
      billingDay: account?.billingDay ?? null,
      dueDay: account?.dueDay ?? null,
    });
    return { gross, installment, paid, remaining, expected };
  }

  function expenseRowClassName(rowIndex: number): string | undefined {
    const record = visibleExpenseRecords[rowIndex];
    if (record && pendingIds.has(record.id)) {
      return "record-pending record-pending-appear";
    }
    return undefined;
  }

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

    setDescriptionInput(record?.description ?? "");
    setFormAccountId(record?.accountId ?? accountFilterId);
    setFormCategoryId(nextCategoryId);
    setPurchaseDateInput(record?.purchaseDate ?? "");
    setDatePaidInput(record?.datePaid ?? "");
    setExpenseAmountInput(record?.amount?.toString() ?? "");
    setInterestInput(record?.interest?.toString() ?? "");
    setPaymentStatus(record?.paymentStatus ?? "");
    setPaymentFrequency(record?.paymentFrequency ?? "");
    setPeriodCountInput(record?.periodCount?.toString() ?? "");
    setPaidPeriodInput(record?.paidPeriod?.toString() ?? "");
    setPasabuyer(record?.pasabuyer ?? "");
    setPasabuyStatus(record?.pasabuyStatus ?? "");
    setPasabuyDateOfPaymentInput(record?.pasabuyDateOfPayment ?? "");
    setPasabuyPaidPeriodInput(record?.pasabuyPaidPeriod?.toString() ?? "");
    setPasabuyAccountReceiverId(record?.pasabuyAccountReceiverId ?? "");
    setEditingId(record?.id ?? null);
    setEditing(mode === "new");
    setSaveError(null);
    setModal({ mode, title });
  }

  async function handleSaveExpense() {
    const invalid = new Set<string>();
    if (!descriptionInput.trim()) invalid.add("description");
    if (invalid.size > 0) {
      setShakeFields(invalid);
      setSaveError("Please fill in all required fields.");
      // Auto-clear shake after animation
      setTimeout(() => setShakeFields(new Set()), 600);
      return;
    }
    const payload: Record<string, unknown> = {
      description: descriptionInput.trim(),
      purchaseDate: purchaseDateInput,
      datePaid: datePaidInput || null,
      amount: parseNumberInput(expenseAmountInput),
      interest: parseNumberInput(interestInput),
      accountId: formAccountId,
      categoryId: formCategoryId,
      paymentStatus: paymentStatus || "Unpaid",
      paymentFrequency: paymentFrequency || null,
      periodCount: parseOptionalNumberInput(periodCountInput),
      paidPeriod: parseOptionalNumberInput(paidPeriodInput),
      pasabuyer: pasabuyer || null,
      pasabuyStatus: pasabuyStatus || null,
      pasabuyDateOfPayment: pasabuyDateOfPaymentInput || null,
      pasabuyPaidPeriod: parseOptionalNumberInput(pasabuyPaidPeriodInput),
      pasabuyAccountReceiverId: pasabuyAccountReceiverId || null,
    };
    setSaveError(null);
    setSaveNotice(null);

    // Capture modal state before closing
    const isEdit = modal?.mode === "edit" && editingId;
    const tempId = isEdit ? editingId! : `pending-${Date.now()}`;

    // Close modal immediately — no blocking "Saving..." state
    setModal(null);

    // Build the optimistic record for the table
    const optimisticRecord = {
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
    } as ExpenseRecord;

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
        ? await expensesApi.update(editingId!, payload)
        : await expensesApi.create(payload);
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
      invalidateExpenseFamily();
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

  function handleDuplicateExpense() {
    // Keep the loaded field values but detach from the source record so Save
    // creates a fresh expense instead of updating the original.
    setEditingId(null);
    setEditing(true);
    setSaveError(null);
    setModal({ mode: "new", title: "New Expense (Copy)" });
  }

  async function handleDeleteExpense() {
    if (!editingId) return;
    if (!window.confirm("Soft-delete this expense in Notion?")) return;
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
      const res = await expensesApi.delete(deletedId);
      if (!res.success) {
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
      invalidateExpenseFamily();
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

  function handleExpenseViewModeChange(nextViewMode: ExpenseViewMode) {
    if (nextViewMode === "Unpaid Pasabuy") {
      setExpenseCategoryFilter("");
    }

    onViewModeChange(nextViewMode);
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
        .map((idx) => visibleExpenseRecords[idx])
        .filter((r): r is ExpenseRecord => r != null);

      if (recordsToDuplicate.length === 0) {
        setSelectedIds(new Set());
        return;
      }

      setSelectedIds(new Set());

      const items = recordsToDuplicate.map((record) => ({
        description: `${record.description} (Copy)`,
        purchaseDate: record.purchaseDate,
        datePaid: record.datePaid || null,
        amount: record.amount,
        interest: record.interest ?? 0,
        accountId: record.accountId,
        categoryId: record.categoryId,
        paymentStatus: record.paymentStatus || "Unpaid",
        paymentFrequency: record.paymentFrequency || null,
        periodCount: record.periodCount ?? null,
        paidPeriod: record.paidPeriod ?? null,
        pasabuyer: record.pasabuyer || null,
        pasabuyStatus: record.pasabuyStatus || null,
        pasabuyDateOfPayment: record.pasabuyDateOfPayment || null,
        pasabuyPaidPeriod: record.pasabuyPaidPeriod ?? null,
        pasabuyAccountReceiverId: record.pasabuyAccountReceiverId || null,
      }));

      const tempIds: string[] = [];
      for (const record of recordsToDuplicate) {
        const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        tempIds.push(tempId);
        setPendingIds((prev) => new Set(prev).add(tempId));
        applyLocal((rows) => [
          { ...record, id: tempId, description: `${record.description} (Copy)` } as ExpenseRecord,
          ...rows,
        ]);
      }

      try {
        const res = await expensesApi.bulkCreate(items);
        if (!res.success) {
          for (const tempId of tempIds) {
            applyLocal((rows) => rows.filter((r) => r.id !== tempId));
            setPendingIds((prev) => { const n = new Set(prev); n.delete(tempId); return n; });
          }
          void refetch();
          setSaveNotice(`Bulk duplicate failed: ${res.error.message}`);
        } else {
          const { created, failed } = res.data;
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
          invalidateExpenseFamily();
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
        .map((idx) => visibleExpenseRecords[idx]?.id)
        .filter((id): id is string => id != null);

      if (idsToDelete.length === 0) {
        setSelectedIds(new Set());
        return;
      }

      // Clear selection FIRST so indices don't shift onto wrong rows
      setSelectedIds(new Set());

      for (const idx of selectedIds) {
        const record = visibleExpenseRecords[idx];
        if (record) setPendingIds((prev) => new Set(prev).add(record.id));
      }
      applyLocal((rows) => rows.filter((r) => !idsToDelete.includes(r.id)));

      try {
        const res = await expensesApi.bulkDelete(idsToDelete);
        if (!res.success) {
          for (const id of idsToDelete) {
            setPendingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
          }
          void refetch();
          setSaveNotice(`Bulk delete failed: ${res.error.message}`);
        } else {
          const { deleted, failed } = res.data;
          for (const id of deleted) {
            setPendingIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
          }
          if (failed.length > 0) {
            for (const f of failed) {
              setPendingIds((prev) => { const n = new Set(prev); n.delete(f.id); return n; });
            }
            void refetch();
            setSaveNotice(`${failed.length} of ${idsToDelete.length} items failed to delete.`);
          }
          invalidateExpenseFamily();
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

  const enabledExpenseRecords = searchFilteredRecords.filter(
    (_, idx) => !disabledIds.has(idx),
  );

  // Publish a printable receipt of the current view for the floating button.
  // The "Amount" column is remapped per view per the receipt spec.
  const { setReceipt } = useFabRegister();
  const receiptContext = useMemo<ReceiptContext>(() => {
    const isInstallment = viewMode === "Installments";
    const amountHeader = isInstallment ? "Installment Amount" : "Amount";
    const receiptValue = (record: ExpenseRecord): number => {
      if (isInstallment) {
        return deriveExpenseComputed(record).installment ?? 0;
      }
      if (viewMode === "Unpaid CC") {
        return deriveExpenseComputed(record).remaining;
      }
      if (viewMode === "Unpaid Pasabuy") {
        return record.pasabuyBalance ?? 0;
      }
      return record.amount;
    };
    const enabledRecords = visibleExpenseRecords.filter(
      (_, idx) => !disabledIds.has(idx),
    );
    const rows: ReceiptRow[] = enabledRecords.map((record) => {
      const base = {
        date: formatDate(record.purchaseDate),
        description: stripNotionTag(record.description),
        amount: formatMoney(receiptValue(record)),
      };
      if (isInstallment) {
        const c = deriveExpenseComputed(record);
        return {
          ...base,
          grossAmount: formatMoney(c.gross),
          paidAmount: formatMoney(c.paid),
          remainingBalance: formatMoney(c.remaining),
          installmentAmount: c.installment != null ? formatMoney(c.installment) : "—",
          expectedPaymentDate: c.expected ? formatDate(c.expected) : "—",
        };
      }
      return base;
    });
    const total = enabledRecords.reduce(
      (sum, record) => sum + receiptValue(record),
      0,
    );
    return {
      viewTitle: `${viewMode} Expenses`,
      periodLabel: getMonthLabel(anchorMonth(selectedDate)),
      amountHeader,
      rows,
      total: formatMoney(total),
      installmentLayout: isInstallment || undefined,
    };
    // deriveExpenseComputed is a stable closure over the same render inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selectedDate, visibleExpenseRecords, disabledIds]);

  useEffect(() => {
    setReceipt(receiptContext);
    return () => setReceipt(null);
  }, [receiptContext, setReceipt]);

  return (
    <div className="page-stack">
      <PageToolbar
        title="Expense"
        actions={
          <>
            <FilterToggle
              active={filterActive}
              onToggle={() => setFilterActive((prev) => !prev)}
            />
            <SearchToggle
              active={searchActive}
              onToggle={() => {
                setSearchActive((prev) => !prev);
                if (searchActive) setSearchQuery("");
              }}
            />
            <button
              type="button"
              className="button button--primary"
              onClick={() => openExpenseModal("new", "New Expense")}
            >
              <Plus size={16} />
              New Expense
            </button>
          </>
        }
      />

      {(searchActive || filterActive) && (
        <div className="toolbar-row">
          {filterActive && (
            <>
              <FilterSelect
                placeholder="All accounts"
                placeholderDisabled={false}
                value={accountFilterId}
                onChange={setAccountFilterId}
              >
                {activeAccounts.map((account) => (
                  <option key={account.id} value={account.id}>{account.name}</option>
                ))}
              </FilterSelect>
              {viewMode !== "Unpaid Pasabuy" && (
                <FilterSelect
                  placeholder="All Categories"
                  placeholderDisabled={false}
                  value={expenseCategoryFilter}
                  onChange={setExpenseCategoryFilter}
                >
                  <option value={expenseCategoryFilterWithoutPasabuy}>W/out Pasabuy</option>
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </FilterSelect>
              )}
              {viewMode === "Unpaid Pasabuy" && (
                <FilterSelect
                  placeholder="All pasabuyers"
                  placeholderDisabled={false}
                  value={pasabuyerFilter}
                  onChange={setPasabuyerFilter}
                >
                  {pasabuyerLabels.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </FilterSelect>
              )}
            </>
          )}
          {searchActive && (
            <SearchInput
              query={searchQuery}
              onQueryChange={setSearchQuery}
              placeholder="Search expenses..."
            />
          )}
        </div>
      )}

      <SegmentedControl
        label="Expense view"
        options={expenseViewModes.map((mode) => ({ label: mode, value: mode }))}
        value={viewMode}
        onChange={(value) => handleExpenseViewModeChange(value as ExpenseViewMode)}
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

      <Panel title={`${viewMode} Expenses`}>
        {isLoading && <LoadingBlock label="Querying Notion…" />}
        {isAnnual && annualView === "chart" ? (
          <AnnualBarChart data={annualExpenseGroups} color="#E11D48" />
        ) : viewMode === "Unpaid Pasabuy" ? (
          <DataTable
            selectable
            selectedIds={selectedIds}
            disabledIds={disabledIds}
            onToggleSelect={toggleRowSelect}
            onBulkAction={handleBulkAction}
            wide
            headers={["Date", "Name", "Balance", "Pasabuyer", "Status", "DOP", "Account Receiver"]}
            rowClassName={expenseRowClassName}
            rows={searchFilteredRecords.map((record) => [
              formatDate(record.purchaseDate),
              <span className="expense-cell--unpaid" key={`${record.id}-desc`}>
                {stripNotionTag(record.description)}
              </span>,
              <span className="expense-cell--unpaid" key={`${record.id}-bal`}>
                {formatMoney(record.pasabuyBalance)}
              </span>,
              record.pasabuyer ?? "—",
              record.pasabuyStatus ?? "—",
              record.pasabuyDateOfPayment ? formatDate(record.pasabuyDateOfPayment) : "—",
              accountNameById.get(record.pasabuyAccountReceiverId ?? "") ?? "—",
            ])}
            footerRows={[
              [
                "Total",
                "",
                formatMoney(
                  enabledExpenseRecords.reduce((sum, r) => sum + (r.pasabuyBalance ?? 0), 0),
                ),
                "",
                "",
                "",
                "",
              ],
            ]}
            onRowClick={(rowIndex) => {
              const record = visibleExpenseRecords[rowIndex];
              if (record) {
                openExpenseModal("edit", record.description, record.id);
              }
            }}
          />
        ) : viewMode === "Unpaid CC" ? (
          <DataTable
            selectable
            selectedIds={selectedIds}
            disabledIds={disabledIds}
            onToggleSelect={toggleRowSelect}
            onBulkAction={handleBulkAction}
            wide
            headers={[
              "Date",
              "Description",
              "Account",
              "Amount",
              "Category",
              "Interest",
              "Gross Amount",
              "Remaining Balance",
              "Payment Status",
              "Expected payment date",
              "Date Paid",
            ]}
            rowClassName={expenseRowClassName}
            rows={searchFilteredRecords.map((record) => {
              const c = deriveExpenseComputed(record);
              return [
                formatDate(record.purchaseDate),
                <span className="expense-cell--unpaid" key={`${record.id}-desc`}>
                  {stripNotionTag(record.description)}
                </span>,
                accountNameById.get(record.accountId ?? "") ?? "—",
                <span className="expense-cell--unpaid" key={`${record.id}-amt`}>
                  {formatMoney(record.amount)}
                </span>,
                expenseCategoryNameById.get(record.categoryId) ?? "—",
                formatMoney(record.interest ?? 0),
                formatMoney(c.gross),
                formatMoney(c.remaining),
                record.paymentStatus ?? "—",
                c.expected ? formatDate(c.expected) : "-",
                record.datePaid ? formatDate(record.datePaid) : "-",
              ];
            })}
            footerRows={[
              [
                "Total",
                "",
                "",
                formatMoney(enabledExpenseRecords.reduce((s, r) => s + r.amount, 0)),
                "",
                formatMoney(enabledExpenseRecords.reduce((s, r) => s + (r.interest ?? 0), 0)),
                formatMoney(
                  enabledExpenseRecords.reduce((s, r) => s + deriveExpenseComputed(r).gross, 0),
                ),
                formatMoney(
                  enabledExpenseRecords.reduce((s, r) => s + deriveExpenseComputed(r).remaining, 0),
                ),
                "",
                "",
                "",
              ],
            ]}
            onRowClick={(rowIndex) => {
              const record = visibleExpenseRecords[rowIndex];
              if (record) {
                openExpenseModal("edit", record.description, record.id);
              }
            }}
          />
        ) : viewMode === "Installments" ? (
          <DataTable
            selectable
            selectedIds={selectedIds}
            disabledIds={disabledIds}
            onToggleSelect={toggleRowSelect}
            onBulkAction={handleBulkAction}
            wide
            headers={[
              "Date",
              "Description",
              "Account",
              "Amount",
              "Category",
              "Interest",
              "Gross Amount",
              "Period Count",
              "Installment Amount",
              "Paid Period",
              "Paid Amount",
              "Remaining Balance",
              "Payment Status",
              "Expected payment date",
              "Date Paid",
            ]}
            rowClassName={expenseRowClassName}
            rows={searchFilteredRecords.map((record) => {
              const c = deriveExpenseComputed(record);
              return [
                formatDate(record.purchaseDate),
                stripNotionTag(record.description),
                accountNameById.get(record.accountId ?? "") ?? "—",
                formatMoney(record.amount),
                expenseCategoryNameById.get(record.categoryId) ?? "—",
                formatMoney(record.interest ?? 0),
                formatMoney(c.gross),
                record.periodCount ?? "—",
                c.installment != null ? formatMoney(c.installment) : "—",
                record.paidPeriod ?? "—",
                formatMoney(c.paid),
                formatMoney(c.remaining),
                record.paymentStatus ?? "—",
                c.expected ? formatDate(c.expected) : "-",
                record.datePaid ? formatDate(record.datePaid) : "-",
              ];
            })}
            footerRows={[
              [
                "Total",
                "",
                "",
                formatMoney(enabledExpenseRecords.reduce((s, r) => s + r.amount, 0)),
                "",
                formatMoney(enabledExpenseRecords.reduce((s, r) => s + (r.interest ?? 0), 0)),
                formatMoney(
                  enabledExpenseRecords.reduce((s, r) => s + deriveExpenseComputed(r).gross, 0),
                ),
                "",
                "",
                "",
                formatMoney(
                  enabledExpenseRecords.reduce((s, r) => s + deriveExpenseComputed(r).paid, 0),
                ),
                formatMoney(
                  enabledExpenseRecords.reduce((s, r) => s + deriveExpenseComputed(r).remaining, 0),
                ),
                "",
                "",
                "",
              ],
            ]}
            onRowClick={(rowIndex) => {
              const record = visibleExpenseRecords[rowIndex];
              if (record) {
                openExpenseModal("edit", record.description, record.id);
              }
            }}
          />
        ) : (
          <DataTable
            selectable
            selectedIds={selectedIds}
            disabledIds={disabledIds}
            onToggleSelect={toggleRowSelect}
            onBulkAction={handleBulkAction}
            wide
            headers={["Date", "Description", "Amount", "Account", "Category", "Date Paid"]}
            rowClassName={expenseRowClassName}
            rows={searchFilteredRecords.map((record) => {
              const isUnpaid = !record.datePaid;
              return [
                formatDate(record.purchaseDate),
                stripNotionTag(record.description),
                formatMoney(record.amount),
                accountNameById.get(record.accountId ?? "") ?? "—",
                expenseCategoryNameById.get(record.categoryId) ?? "—",
                record.datePaid ? formatDate(record.datePaid) : "-",
              ].map((cell, cellIndex) =>
                isUnpaid && (cellIndex === 1 || cellIndex === 2) ? (
                  <span className="expense-cell--unpaid" key={`cell-${record.id}-${cellIndex}`}>
                    {cell}
                  </span>
                ) : (
                  cell
                ),
              );
            })}
            footerRows={[
              [
                "Total",
                "",
                formatMoney(getExpenseTotal(enabledExpenseRecords)),
                "",
                "",
                "",
              ],
            ]}
            onRowClick={(rowIndex) => {
              const record = visibleExpenseRecords[rowIndex];
              if (record) {
                openExpenseModal("edit", record.description, record.id);
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
        subtitle="Context fields change from the selected account and category."
        onEdit={() => setEditing(true)}
        onSave={handleSaveExpense}
        onDelete={handleDeleteExpense}
        onDuplicate={handleDuplicateExpense}
        onClose={() => setModal(null)}
      >
        <div className="form-grid form-grid--single">
          <Field label="Purchase description" required error={shakeFields.has("description")}>
            <input
              className={shakeFields.has("description") ? "field__input--shake" : undefined}
              placeholder="Purchase description"
              value={descriptionInput}
              onChange={(event) => setDescriptionInput(event.target.value)}
            />
          </Field>
          <Field label="Purchase Date" required>
            <input
              type="date"
              value={purchaseDateInput}
              onChange={(event) => setPurchaseDateInput(event.target.value)}
            />
          </Field>
          <Field label="Accounts">
            <select value={formAccountId} onChange={(event) => setFormAccountId(event.target.value)}>
              <option value="">— None —</option>
              {activeAccounts.map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Categories">
            <select value={formCategoryId} onChange={(event) => setFormCategoryId(event.target.value)}>
              <option value="">— None —</option>
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Expense Amount" required>
            <input
              inputMode="decimal"
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
                  onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}
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
              {paymentStatus === "Installment" && installmentAmount !== null && (
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
            </>
          )}
          {sections.pasabuy && (
            <>
              <FormSectionDivider title="Pasabuy Transaction" />
              <Field label="Pasabuyer">
                <select value={pasabuyer} onChange={(event) => setPasabuyer(event.target.value)}>
                  <option value="">— None —</option>
                  {pasabuyerLabels.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Pasabuy Status">
                <select
                  value={pasabuyStatus}
                  onChange={(event) => setPasabuyStatus(event.target.value as PasabuyStatus)}
                >
                  <option value="">— None —</option>
                  {pasabuyStatusLabels.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </Field>
              <Field label="Pasabuy Date of Payment">
                <input
                  type="date"
                  value={pasabuyDateOfPaymentInput}
                  onChange={(event) => setPasabuyDateOfPaymentInput(event.target.value)}
                />
              </Field>
              <Field label="Pasabuy Account Receiver">
                <select
                  value={pasabuyAccountReceiverId}
                  onChange={(event) => setPasabuyAccountReceiverId(event.target.value)}
                >
                  <option value="">— None —</option>
                  {activeAccounts.map((account) => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Pasabuy paid period">
                <input
                  inputMode="numeric"
                  placeholder="0"
                  value={pasabuyPaidPeriodInput}
                  onChange={(event) => setPasabuyPaidPeriodInput(event.target.value)}
                />
              </Field>
              <ComputedField label="Pasabuy Received Amount" value={formatMoney(pasabuyReceivedAmount)} />
              <ComputedField label="Pasabuyer Balance" value={formatMoney(pasabuyerBalance)} />
            </>
          )}
        </div>
      </FormModal>
      {saveError && (
        <Toast message={saveError} onDismiss={() => setSaveError(null)} />
      )}
    </div>
  );
}

export { ExpensePage };
