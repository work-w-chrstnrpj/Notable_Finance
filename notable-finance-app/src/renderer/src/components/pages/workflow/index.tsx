
import { useEffect, useMemo, useState } from "react";
import styles from "@/components/ui/filter-row.module.css";
import { SearchToggle, SearchInput, FilterToggle } from "@/components/ui/search-bar";
import { AccountIcon } from "@/components/ui/accounts";
import { useRecordSearch } from "@/features/records/use-record-search";
import { isMoneyLentCategory, isOutstandingMoneyLent, receivableAmount } from '@shared/money-lent';
import { NewRecordTypeModal } from './new-record-type-modal';
import { ReceivablePasabuyModal } from './receivable-pasabuy-modal';
import { ReceivablePasabuyBulkModal } from './receivable-pasabuy-bulk-modal';
import { MoneyLentRepayment } from './money-lent-repayment';
import { borrowingKind, isPlaceholderAccount, type BorrowingKind } from '@shared/borrowings';
import { Plus } from "lucide-react";
import amountStyles from "./receivable-amount.module.css";
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
} from "@/lib/finance-helpers";
import { consumePendingEdit, type PendingEditResource } from "@/lib/pending-edit";
import { getActiveSectionLabel } from "@/lib/finance-data";
import { calculateCcCoveredExpenseAmount, getWorkflowFixedCategory } from "@/lib/finance-rules";
import { formatMoney, formatDate, toYYMMDD } from "@/lib/format";
import { incomesApi, alkansyaApi, borrowingsApi, creditCardPaymentsApi, receivablesApi, transfersApi } from "@/lib/api-client";
import { deleteActionLabel, deleteConfirmCopy, useUiSettings } from "@/lib/ui-settings-context";
import { useFabRegister, type ReceiptContext } from "@/lib/fab-export-context";
import { computeRange, incomeModeToUnit, rangeLabel } from "@/lib/date-range";
import type { IncomeRecord, WorkflowSectionId } from "@/types/finance";
import type { ExpenseRecord } from "@/types/finance";

/** Money still owed: red when something is owed (shown without a minus sign), neutral at zero. */
function OwedValue({ amount }: { amount: number }) {
  const owed = Math.abs(amount) < 0.005 ? 0 : amount;
  // Overpaid (negative owed) is the only green case and keeps its minus sign.
  const tone = owed > 0 ? "rose" : owed < 0 ? "green" : "ink";
  return <span className={`money-value money-value--${tone}`}>{formatMoney(owed)}</span>;
}

const RECEIVABLE_TABS = ["All", "Expected Income", "Money Lent", "Pasabuy"] as const;
type ReceivableTab = (typeof RECEIVABLE_TABS)[number];

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
    allAccounts,
    allIncomeCategories,
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
  const isBorrowings = section === "borrowings";
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
  const amountLabel = isBorrowings
    ? "Amount"
    : isTransfer
    ? "Transfer Amount"
    : isCreditCardPayment
      ? "Payment Amount"
      : isAlkansya
        ? "Savings Amount"
        : "Gross Income";
  const [pasabuyRecord, setPasabuyRecord] = useState<ExpenseRecord | null>(null);
  const [bulkPasabuyIds, setBulkPasabuyIds] = useState<string[] | null>(null);
  const [moneyLentMode, setMoneyLentMode] = useState(false);
  const [borrowKind, setBorrowKind] = useState<BorrowingKind>("borrowed");
  const [showBorrowAccounts, setShowBorrowAccounts] = useState(false);
  const [borrowTypeState, setBorrowType] = useState<"All" | BorrowingKind>("All");
  const [receivableTabState, setReceivableTab] = useState<ReceivableTab>("All");
  const [filterActive, setFilterActive] = useState(false);
  const receivableTab: ReceivableTab = filterActive ? receivableTabState : "All";
  const borrowType = filterActive ? borrowTypeState : "All";
  // Auxiliary accounts are excluded from the shared active-account lists, so read them from allAccounts.
  const placeholderAccounts = allAccounts.filter((a) => isPlaceholderAccount(a) && !a.inactive && a.notionSynced);
  const placeholderIds = useMemo(() => new Set(allAccounts.filter(isPlaceholderAccount).map((a) => a.id)), [allAccounts]);
  const [repaymentRecord, setRepaymentRecord] = useState<IncomeRecord | null>(null);
  const [reclassifyRecord, setReclassifyRecord] = useState<IncomeRecord | null>(null);
  const moneyLentCategory = allIncomeCategories.find((c) => isMoneyLentCategory(c.source));
  const receivableIncomeCategories = [...normalIncomeCategories, ...allIncomeCategories.filter((category) =>
    isMoneyLentCategory(category.source) && !normalIncomeCategories.some((normal) => normal.id === category.id))];
  const displayAmount = (record: IncomeRecord) => isReceivables
    ? receivableAmount(record, incomeCategoryNameById.get(record.categoryId)) : record.grossIncome;
  const [accountFilterId, setAccountFilterId] = useState("");
  const [secondAccountFilterId, setSecondAccountFilterId] = useState("");
  const [typePicker, setTypePicker] = useState(false);
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
  const [invalidFields, setInvalidFields] = useState<ReadonlySet<string>>(new Set());
  const flagInvalid = (message: string, ...keys: string[]) => {
    setSaveError(message);
    setInvalidFields(new Set(keys));
    setTimeout(() => setInvalidFields(new Set()), 600);
  };
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
  const modalOpen = typePicker || modal !== null || repaymentRecord !== null || reclassifyRecord !== null || pasabuyRecord !== null || bulkPasabuyIds !== null;
  useShortcutAction("view.newRecord", () => startNewRecord(), !modalOpen);
  useShortcutAction("modal.save", () => void handleSaveWorkflow(), modal !== null && editing && !reclassifyRecord);
  useShortcutAction("modal.edit", () => setEditing((e) => !e), modal !== null && !reclassifyRecord);
  useShortcutAction("modal.duplicate", () => handleDuplicateWorkflow(), modal !== null && !reclassifyRecord);
  useShortcutAction("modal.delete", () => void handleDeleteWorkflow(), modal !== null && editingId != null && !reclassifyRecord);
  useShortcutAction("modal.close", () => { setModal(null); setCcCoveredIds([]); }, modal !== null && !reclassifyRecord);
  useShortcutAction("mass.selectAll", () => selectAll(receivableRecords.map((item) => item.id)), !modalOpen);
  useShortcutAction("mass.duplicate", () => void handleBulkAction("duplicate"), hasSelection && !modalOpen);
  useShortcutAction("mass.disable", () => void handleBulkAction("disable"), hasSelection && !modalOpen);
  useShortcutAction("mass.delete", () => void handleBulkAction("delete"), hasSelection && !modalOpen);

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
  // Every workflow view is scoped by the shared Daily/Weekly/Monthly/Annually/
  // All Records selector, matching Income and Expense.
  const viewUnit = incomeModeToUnit(viewMode);
  const selectedRange = viewUnit ? computeRange(viewUnit, selectedDate) : undefined;
  const { state: workflowState, refetch, applyLocal } = useWorkflowRecords(section, {
    rangeStart: selectedRange?.start,
    rangeEnd: selectedRange?.end,
  });
  const { state: expenseState, applyLocal: applyExpenseLocal } = useExpenses();
  const selectedPeriodLabel = viewUnit ? rangeLabel(viewUnit, selectedDate) : "All Records";
  // Workflows are income-backed views, so they share the income invalidation.
  const { invalidateIncomeFamily, invalidateExpenseFamily } = useFinanceInvalidation();
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
    if (!filterActive) return true;
    if (isTransfer || isCreditCardPayment) {
      // Two sides: Source/CC account (accountId) and Transfer/Payer account (transactedAccountId).
      return (!accountFilterId || record.accountId === accountFilterId) &&
        (!secondAccountFilterId || record.transactedAccountId === secondAccountFilterId);
    }
    if (isBorrowings) {
      const kind = borrowingKind(record, placeholderIds);
      const borrowSide = kind === "borrowed" ? record.accountId : record.transactedAccountId;
      const otherSide = kind === "borrowed" ? record.transactedAccountId : record.accountId;
      return (!accountFilterId || borrowSide === accountFilterId) &&
        (!secondAccountFilterId || otherSide === secondAccountFilterId);
    }
    if (!accountFilterId) return true;
    if (accountFilterId === "__none__") return !record.accountId;
    return record.accountId === accountFilterId;
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
  const tabIncomes = isReceivables
    ? workflowIncomes.filter((record) => {
        const lent = isMoneyLentCategory(incomeCategoryNameById.get(record.categoryId));
        return receivableTab === "All" || (receivableTab === "Money Lent" ? lent : receivableTab === "Expected Income" && !lent);
      })
    : isBorrowings && borrowType !== "All"
      ? workflowIncomes.filter((record) => borrowingKind(record, placeholderIds) === borrowType)
      : workflowIncomes;
  const tabExpenses = receivableTab === "All" || receivableTab === "Pasabuy" ? receivableExpenseSearch : [];
  const receivableRecords = isReceivables
    ? [
        ...tabIncomes.map((record) => ({ id: record.id, kind: "income" as const, record })),
        ...tabExpenses.map((record) => ({ id: `expense:${record.id}`, kind: "expense" as const, record })),
      ]
    : tabIncomes.map((record) => ({ id: record.id, kind: "income" as const, record }));
  useShortcutAction("view.search", toggleSearch, !modalOpen);
  useShortcutAction("view.filters", () => setFilterActive((prev) => !prev), !modalOpen);
  useEffect(() => {
    setAccountFilterId("");
    setSecondAccountFilterId("");
    setReceivableTab("All");
    setBorrowType("All");
    setShowBorrowAccounts(false);
    setFilterActive(false);
    resetSearch();
  }, [section, resetSearch]);
  useEffect(() => {
    clearSelection();
  }, [section, filterActive, accountFilterId, secondAccountFilterId, searchActive, searchQuery, clearSelection]);
  const enabledWorkflowRecords = tabIncomes.filter((r) => !disabledIds.has(r.id));
  const workflowAmountTotal = enabledWorkflowRecords.reduce((sum, record) => sum + displayAmount(record), 0) + tabExpenses
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
          amount: formatMoney(item.kind === "income" ? receivableAmount(item.record, incomeCategoryNameById.get(item.record.categoryId)) : item.record.pasabuyBalance ?? 0),
        }),
        valueOf: (item) => item.kind === "income" ? receivableAmount(item.record, incomeCategoryNameById.get(item.record.categoryId)) : item.record.pasabuyBalance ?? 0,
      }),
    [receivableRecords, disabledIds, selectedPeriodLabel, incomeCategoryNameById],
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
          : section === "borrowings"
            ? borrowingsApi
            : receivablesApi;
  // Transfer has its own column layout (source + destination account and a
  // computed "Transferred Amount" = Amount × -1); the other workflows share a
  // simpler Name/Date/Account/Category/Amount table.
  const workflowHeaders = isBorrowings
    ? ["Date", "Name", "Type", "Borrow Account", "Borrowed Amount", "Other Account", "Other Amount"]
    : isTransfer
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
        <span key={`${record.id}-amount`} className={`num ${amountStyles.pasabuy}`}>
          {formatMoney(record.pasabuyBalance ?? 0)}
        </span>,
      ];
    }
    const record = item.record;
    if (isBorrowings) {
      const kind = borrowingKind(record, placeholderIds);
      // Signed effect on each side: borrowing debits the Borrow account, a repayment credits it.
      const borrowAmount = kind === "borrowed" ? -Math.abs(record.grossIncome) : Math.abs(record.grossIncome);
      const borrowSide = kind === "borrowed" ? record.accountId : record.transactedAccountId;
      const otherSide = kind === "borrowed" ? record.transactedAccountId : record.accountId;
      return [
        formatDate(record.date),
        stripNotionTag(record.name),
        kind === "borrowed" ? "Borrowed" : "Repayment",
        accountNameById.get(borrowSide ?? "") ?? "—",
        <MoneyValue key={`${record.id}-borrowed`} value={borrowAmount} />,
        accountNameById.get(otherSide ?? "") ?? "—",
        <MoneyValue key={`${record.id}-other`} value={-borrowAmount} />,
      ];
    }
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
      <span
        key={`${record.id}-amount`}
        className={isReceivables
          ? `num ${isMoneyLentCategory(incomeCategoryNameById.get(record.categoryId)) ? amountStyles.lent : amountStyles.income}`
          : "num"}
      >
        {formatMoney(displayAmount(record))}
      </span>,
    ];
  });
  const borrowNet = tabIncomes
    .filter((r) => !disabledIds.has(r.id))
    .reduce((sum, r) => sum + (borrowingKind(r, placeholderIds) === "borrowed" ? -Math.abs(r.grossIncome) : Math.abs(r.grossIncome)), 0);
  const workflowFooterRows = isBorrowings
    ? [["Net", "", "", "", <MoneyValue key="borrow-net" value={borrowNet} />, "", <MoneyValue key="other-net" value={-borrowNet} />]]
    : isTransfer
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

  const selectionHasExpenses = Array.from(selectedIds).some((id) => id.startsWith('expense:'));
  const allSelectedPasabuy = selectedIds.size > 0 && Array.from(selectedIds).every((id) =>
    tabExpenses.some((expense) => id === `expense:${expense.id}`));
  const tableRecordIds = receivableRecords.map((item) => item.kind === "income" ? item.record.id : `expense:${item.record.id}`);

  // Keep header, row selection and shortcuts aligned after refresh or settlement.
  useEffect(() => {
    for (const id of selectedIds) if (!tableRecordIds.includes(id)) toggleRowSelect(id, false);
  }, [tableRecordIds, selectedIds, toggleRowSelect]);
  useShortcutAction('mass.edit', () => void handleBulkAction('edit'), allSelectedPasabuy && !modalOpen);

  function onPasabuyUpdated(records: ExpenseRecord[]) {
    applyExpenseLocal((rows) => rows.map((row) => records.find((record) => record.id === row.id) ?? row));
    for (const record of records) toggleRowSelect(`expense:${record.id}`, false);
    invalidateExpenseFamily();
  }

  function openWorkflowModal(mode: "new" | "edit", title: string, recordId?: string, newMoneyLent = false) {
    const record =
      recordId != null
        ? allWorkflowIncomes.find((r) => r.id === recordId)
        : undefined;
    loadRecord(record, { isTransfer, isCreditCardPayment, isAlkansya, savingsCategoryId });
    if (isBorrowings) {
      const kind = record ? borrowingKind(record, placeholderIds) : "borrowed";
      setBorrowKind(kind);
      form.setWorkflowNameInput(record?.name ?? "Borrow: ");
      form.setWorkflowAmountInput(record ? String(Math.abs(record.grossIncome)) : "");
      form.setReceivingAccountId((kind === "borrowed" ? record?.accountId : record?.transactedAccountId) ?? placeholderAccounts[0]?.id ?? "");
      form.setTransactedAccountId((kind === "borrowed" ? record?.transactedAccountId : record?.accountId) ?? "");
    }
    const loan = newMoneyLent || Boolean(record && isMoneyLentCategory(incomeCategoryNameById.get(record.categoryId)));
    setMoneyLentMode(loan);
    if (loan) {
      form.setWorkflowAmountInput(record ? String(Math.abs(record.grossIncome)) : '');
      form.setWorkflowCategoryIdInput(record?.categoryId ?? moneyLentCategory?.id ?? '');
    }
    setEditing(mode === "new");
    setSaveError(null);
    setModal({ mode, title });
  }

  /** New Borrowings record pre-configured by the initial type chooser (or by "Record repayment" on a borrowed row). */
  function openBorrowNew(kind: BorrowingKind, source?: IncomeRecord) {
    loadRecord(undefined, { isTransfer: false, isCreditCardPayment: false, isAlkansya: false, savingsCategoryId });
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setTypePicker(false);
    setBorrowKind(kind);
    form.setWorkflowNameInput(kind === "borrowed" ? "Borrow: " : `Repayment: ${source ? stripNotionTag(source.name).replace(/^Borrow:\s*/, "") : ""}`);
    form.setWorkflowDateInput(today);
    form.setWorkflowAmountInput(source ? String(Math.abs(source.grossIncome)) : "");
    form.setReceivingAccountId(source?.accountId ?? placeholderAccounts[0]?.id ?? "");
    form.setTransactedAccountId("");
    setEditing(true);
    setSaveError(null);
    setModal({ mode: "new", title: kind === "borrowed" ? "New Borrowed Money" : "New Repayment" });
  }

  /** New Receivables record, pre-configured as Money Lent by the initial chooser. */
  function openLendMoney() {
    setTypePicker(false);
    openWorkflowModal("new", "New Money Lent", undefined, true);
    form.setWorkflowNameInput("Lend Money: ");
  }

  /** "New Record": Borrowings and Receivables ask for the record type first. */
  function startNewRecord() {
    if (isBorrowings || isReceivables) { setTypePicker(true); return; }
    openWorkflowModal("new", `New ${label} Record`);
  }

  function selectReceivableCategory(id: string) {
    form.setWorkflowCategoryIdInput(id);
    const loan = isMoneyLentCategory(incomeCategoryNameById.get(id));
    setMoneyLentMode(loan);
    if (loan) {
      if (workflowAmountInput) form.setWorkflowAmountInput(String(Math.abs(parseNumberInput(workflowAmountInput))));
      form.setWorkflowCapitalExpenditureInput('0');
    }
  }

  async function handleSaveWorkflow() {
    if (saving) return;
    if (moneyLentMode) {
      if (!workflowDateInput || !receivingAccountId || !(parseNumberInput(workflowAmountInput) > 0)) {
        flagInvalid('Enter a date lent, source account, and an amount greater than zero.',
          ...(!workflowDateInput ? ['date'] : []), ...(!receivingAccountId ? ['account'] : []), ...(!(parseNumberInput(workflowAmountInput) > 0) ? ['amount'] : [])); return;
      }
      if (!moneyLentCategory) {
        setSaveError('Create Money Lent in your Notion Income Categories, then sync income categories.'); return;
      }
    }
    // Validate required fields per section
    if (!workflowNameInput.trim()) {
      flagInvalid("Name is required.", "name");
      return;
    }
    if (!isReceivables && !workflowDateInput) {
      flagInvalid("Date is required.", "date");
      return;
    }
    if (isTransfer && !receivingAccountId) {
      flagInvalid("Source Account is required.", "account");
      return;
    }
    if (isTransfer && !transactedAccountId) {
      flagInvalid("Transfer Account is required.", "secondary");
      return;
    }
    if (isBorrowings) {
      if (!receivingAccountId) { flagInvalid("Borrow Account is required. Create an Auxiliary account whose name has 'borrow', 'debt' or 'loan' in it.", "account"); return; }
      if (!transactedAccountId) { flagInvalid(borrowKind === "borrowed" ? "Choose the account that received the money." : "Choose the account you paid from.", "secondary"); return; }
      if (!(parseNumberInput(workflowAmountInput) > 0)) { flagInvalid("Enter an amount greater than zero.", "amount"); return; }
    }
    if (isCreditCardPayment && !receivingAccountId) {
      flagInvalid("CC Account is required.", "account");
      return;
    }
    if (!isReceivables && !isTransfer && !isBorrowings && !isCreditCardPayment && !receivingAccountId) {
      flagInvalid("Account is required.", "account");
      return;
    }
    const payload: Record<string, unknown> = {
      name: workflowNameInput.trim(),
      date: workflowDateInput,
      grossIncome: isTransfer || isBorrowings || moneyLentMode
        ? -Math.abs(parseNumberInput(workflowAmountInput))
        : parseNumberInput(workflowAmountInput),
      capitalExpenditure: moneyLentMode ? 0 : parseNumberInput(workflowCapitalExpenditureInput),
      accountId: receivingAccountId,
    };
    // Transfer & CC Payment carry a transacted/payer account.
    if (secondaryAccountLabel) {
      payload.transactedAccountId = transactedAccountId || null;
    }
    if (isBorrowings) {
      // Borrowed: debit the placeholder, credit where the cash landed. Repayment: the reverse.
      payload.accountId = borrowKind === "borrowed" ? receivingAccountId : transactedAccountId;
      payload.transactedAccountId = borrowKind === "borrowed" ? transactedAccountId : receivingAccountId;
    }
    // Only Receivables chooses a category. Other workflows resolve their fixed
    // category in main, including Savings for Alkansya.
    if (moneyLentMode) {
      payload.categoryId = moneyLentCategory!.id;
      payload.view = 'moneyLent';
      payload.transactedAccountId = null;
      payload.ccPaymentCoveredIds = [];
      payload.isTransaction = false;
    } else if (categoryEditable) {
      payload.categoryId = workflowCategoryIdInput;
    }
    if (isCreditCardPayment) {
      payload.ccPaymentCoveredIds = ccCoveredIds;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const saveApi = moneyLentMode ? incomesApi : workflowApi;
      const res =
        modal?.mode === "edit" && editingId
          ? await saveApi.update(editingId, payload)
          : await saveApi.create(payload);
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

  // Receivables can select both resources. Only its all-Pasabuy selection may edit
  // Expense fields; Income duplicate/delete must never receive namespaced Expense IDs.
  const handleBulkAction = useBulkActions({
    selectedIds,
    applyDisabled,
    clearSelection,
    onDelete: (ids) => { if (!selectionHasExpenses) setDeleteConfirmIds(ids); },
    onEdit: () => {
      if (allSelectedPasabuy) setBulkPasabuyIds(Array.from(selectedIds).map((id) => id.slice('expense:'.length)));
    },
    onDuplicate: async () => {
      if (selectionHasExpenses) return;
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
      borrowings: "borrowings",
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

  const currentRecord = allWorkflowIncomes.find((r) => r.id === editingId);
  const canRepay = currentRecord && isOutstandingMoneyLent(currentRecord, incomeCategoryNameById.get(currentRecord.categoryId));
  const canReclassify = isAlkansya && currentRecord && currentRecord.grossIncome < 0 &&
    currentRecord.capitalExpenditure === 0 && !currentRecord.transactedAccountId && !currentRecord.ccPaymentCoveredIds?.length;
  function finishLoanAction(id: string) {
    applyLocal((rows) => rows.filter((r) => r.id !== id));
    clearSelection(); setModal(null); setRepaymentRecord(null); setReclassifyRecord(null);
    invalidateIncomeFamily();
  }
  async function reclassify() {
    if (!reclassifyRecord || saving) return;
    setSaving(true); setSaveError(null);
    try {
      const result = await incomesApi.reclassifyMoneyLent(reclassifyRecord.id);
      if (!result.success) { setSaveError(result.error.message); setReclassifyRecord(null); return; }
      finishLoanAction(reclassifyRecord.id);
    } catch (err) { setSaveError(err instanceof Error ? err.message : 'Could not reclassify.'); setReclassifyRecord(null); }
    finally { setSaving(false); }
  }

  return (
    <div className="page-stack">
      {saveError && !modal && <p role="alert">{saveError}</p>}
      <PageToolbar
        title={label}
        actions={
          <>
          <FilterToggle active={filterActive} onToggle={() => setFilterActive((prev) => !prev)} shortcutId="view.filters" />
          <SearchToggle active={searchActive} onToggle={toggleSearch} shortcutId="view.search" />
          <button
            type="button"
            className="button button--primary"
            onClick={startNewRecord}
          >
            <Plus size={16} />
            New Record
            <ShortcutHint id="view.newRecord" />
          </button>
          </>
        }
      />
      <SegmentedControl
        label={`${label} view`}
        options={[...["Daily", "Weekly", "Monthly", "Annually", "All Records"], ...(isBorrowings ? ["Borrowed Accounts"] : [])].map((mode) => ({ label: mode, value: mode }))}
        value={isBorrowings && showBorrowAccounts ? "Borrowed Accounts" : viewMode}
        onChange={(mode) => {
          if (mode === "Borrowed Accounts") { setShowBorrowAccounts(true); return; }
          setShowBorrowAccounts(false);
          onViewModeChange(mode as typeof viewMode);
        }}
        shortcutId="view.filterTab"
      />
      {!showBorrowAccounts && (filterActive || searchActive) && (
        <div className={`toolbar-row ${styles.filters}`}>
          {filterActive && isBorrowings && (
            <FilterDropdown
              placeholder="All Types"
              value={borrowType === "All" ? "" : borrowType}
              onChange={(value) => setBorrowType((value || "All") as "All" | BorrowingKind)}
              items={[{ id: "borrowed", label: "Borrowed" }, { id: "repayment", label: "Repayment" }]}
            />
          )}
          {filterActive && isReceivables && (
            <FilterDropdown
              placeholder="All Types"
              value={receivableTab === "All" ? "" : receivableTab}
              onChange={(value) => setReceivableTab((value || "All") as ReceivableTab)}
              items={RECEIVABLE_TABS.filter((tab) => tab !== "All").map((tab) => ({ id: tab, label: tab }))}
            />
          )}
          {filterActive && (isTransfer || isCreditCardPayment || isBorrowings) ? (
            <>
              <FilterDropdown
                placeholder={isTransfer ? "All Source Accounts" : isCreditCardPayment ? "All CC Accounts" : "All Borrow Accounts"}
                value={accountFilterId}
                onChange={setAccountFilterId}
                items={(isTransfer ? nonCreditActiveAccounts : isCreditCardPayment ? creditActiveAccounts : placeholderAccounts)
                  .map((account) => ({ id: account.id, label: account.name, icon: <AccountIcon account={account} /> }))}
              />
              <FilterDropdown
                placeholder={isTransfer ? "All Transfer Accounts" : isCreditCardPayment ? "All Payer Accounts" : "All Other Accounts"}
                value={secondAccountFilterId}
                onChange={setSecondAccountFilterId}
                items={nonCreditActiveAccounts
                  .map((account) => ({ id: account.id, label: account.name, icon: <AccountIcon account={account} /> }))}
              />
            </>
          ) : filterActive && (
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

      {isBorrowings && showBorrowAccounts && (
        <Panel>
          {placeholderAccounts.length ? (
            <DataTable
              headers={["Borrow Account", "Still owed"]}
              rows={placeholderAccounts.map((account) => [
                account.name,
                <OwedValue key={`${account.id}-owed`} amount={-account.currentBalance} />,
              ])}
              footerRows={[["Total owed", <OwedValue key="owed-total" amount={-placeholderAccounts.reduce((sum, a) => sum + a.currentBalance, 0)} />]]}
            />
          ) : (
            <EmptyState title="No Borrow accounts" detail={'Create an Auxiliary account whose name has "borrow", "debt" or "loan" in it, in Notion, then sync.'} />
          )}
        </Panel>
      )}
      {!showBorrowAccounts && <Panel>
        {isLoading && <LoadingBlock label="Querying Notion…" />}
        {workflowRows.length ? (
          <DataTable
            selectable
            recordIds={tableRecordIds}
            selectedIds={selectedIds}
            disabledIds={disabledIds}
            onToggleSelect={toggleRowSelect}
            onBulkAction={handleBulkAction}
            showBulkEdit={allSelectedPasabuy}
            bulkEditLabel="Bulk Pasabuy"
            showBulkDuplicate={!selectionHasExpenses}
            showBulkDelete={!selectionHasExpenses}
            bulkDeleteLabel={deleteLabel}
            bulkDeleteDanger={hardDeleteEnabled}
            headers={workflowHeaders}
            rows={workflowRows}
            footerRows={workflowFooterRows}
            onRowClick={(recordId) => {
              if (recordId.startsWith("expense:")) {
                const expense = receivablePasabuyExpenses.find((candidate) => candidate.id === recordId.slice("expense:".length));
                if (!expense) return;
                setPasabuyRecord(expense);
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
            title={allWorkflowIncomes.length || receivablePasabuyExpenses.length ? "No matching records" : viewUnit ? `No ${label.toLowerCase()} records for ${selectedPeriodLabel}` : `No ${label.toLowerCase()} records`}
            detail={
              isBorrowings
                ? "Add a record when you borrow money or pay it back."
                : allWorkflowIncomes.length
                ? "Try another account or search term."
                : isReceivables
                ? "Receivables include Money Lent, income entries without a receiving account, and paid Pasabuy expenses that still have a balance due."
                : isAlkansya
                  ? "Alkansya holds income records in the Savings category."
                  : `No ${label} entries were found for ${selectedPeriodLabel}.`
            }
          />
        )}
      </Panel>}

      <FormModal
        extraActions={modal?.mode === 'edit' && !editing ? <>
          {isBorrowings && currentRecord && borrowingKind(currentRecord, placeholderIds) === "borrowed" && <button type="button" className="button" disabled={saving} onClick={() => openBorrowNew("repayment", currentRecord)}>Record repayment</button>}
          {canRepay && <button type="button" className="button" disabled={saving} onClick={() => { setRepaymentRecord(currentRecord); setModal(null); }}>Record repayment</button>}
          {canReclassify && <button type="button" className="button" disabled={saving} onClick={() => setReclassifyRecord(currentRecord)}>Reclassify as money lent</button>}
        </> : undefined}
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
        {saveError && <p role="alert" className="page-content__error">{saveError}</p>}
        {moneyLentMode && !moneyLentCategory && <p role="alert" className="page-content__error">Create Money Lent in your Notion Income Categories, then sync income categories.</p>}
        <WorkflowFormFields
          form={form}
          invalidFields={invalidFields}
          label={moneyLentMode ? 'Money Lent' : label}
          amountLabel={moneyLentMode ? 'Amount lent' : amountLabel}
          sourceAccountLabel={moneyLentMode ? 'Source Account' : sourceAccountLabel}
          sourceAccountOptions={sourceAccountOptions}
          secondaryAccountLabel={secondaryAccountLabel}
          nonCreditActiveAccounts={nonCreditActiveAccounts}
          incomeCategories={isReceivables ? receivableIncomeCategories : normalIncomeCategories}
          onCategoryChange={isReceivables ? selectReceivableCategory : undefined}
          isTransfer={isTransfer}
          isBorrowings={isBorrowings}
          borrowKind={borrowKind}
          onBorrowKindChange={setBorrowKind}
          placeholderAccounts={placeholderAccounts}
          sourceAccountRequired={moneyLentMode}
          isCreditCardPayment={isCreditCardPayment}
          isAlkansya={isAlkansya}
          isReceivables={isReceivables && !moneyLentMode}
          categoryEditable={categoryEditable && (!moneyLentMode || modal?.mode === "new")}
          fixedCategory={moneyLentMode ? 'Money Lent' : fixedCategory}
          eligibleCcExpenses={eligibleCcExpenses}
          totalCovered={totalCovered}
        />
      </FormModal>
      {typePicker && isBorrowings && (
        <NewRecordTypeModal
          title="New Borrowings Record"
          onCancel={() => setTypePicker(false)}
          options={[
            { label: "Borrow", description: "Money you borrowed into an account.", onSelect: () => openBorrowNew("borrowed") },
            { label: "Repayment", description: "Money you paid back from an account.", onSelect: () => openBorrowNew("repayment") },
          ]}
        />
      )}
      {typePicker && isReceivables && (
        <NewRecordTypeModal
          title="New Receivables Record"
          onCancel={() => setTypePicker(false)}
          options={[
            { label: "Lend Money", description: "Money you lent to someone, taken from an account.", onSelect: openLendMoney },
            { label: "Expected Income", description: "Money you expect to receive. No account needed.", onSelect: () => { setTypePicker(false); openWorkflowModal("new", `New ${label} Record`); } },
          ]}
        />
      )}
      {pasabuyRecord && <ReceivablePasabuyModal key={pasabuyRecord.id} record={pasabuyRecord}
        onClose={() => setPasabuyRecord(null)} onSaved={(record) => { onPasabuyUpdated([record]); setPasabuyRecord(null); }} />}
      {bulkPasabuyIds && <ReceivablePasabuyBulkModal ids={bulkPasabuyIds}
        onClose={() => { setBulkPasabuyIds(null); clearSelection(); }} onUpdated={onPasabuyUpdated} />}
      {repaymentRecord && <MoneyLentRepayment record={repaymentRecord} accounts={nonCreditActiveAccounts}
        sourceName={accountNameById.get(repaymentRecord.accountId ?? '') ?? 'original account'}
        onClose={() => setRepaymentRecord(null)} onSaved={() => finishLoanAction(repaymentRecord.id)} />}
      {reclassifyRecord && <ConfirmModal title="Reclassify as money lent?"
        message="Move this Savings entry to Money Lent and Receivables. Its amount, source account, and account balance stay the same."
        busy={saving} confirmLabel="Reclassify" onCancel={() => setReclassifyRecord(null)} onConfirm={() => void reclassify()} />}
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
