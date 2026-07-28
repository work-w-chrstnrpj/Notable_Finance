import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock,
  CloudDownload,
  CloudUpload,
  History as HistoryIcon,
  PlusCircle,
  PenLine,
  Trash2,
  X,
} from "lucide-react";
import { useLiveCollections } from "@/components/hooks";
import { Badge, EmptyState, MetricCard, Panel } from "@/components/ui";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmModal } from "@/components/ui/form-modals";
import { Toast } from "@/components/ui/toast";
import { navigate } from "@/lib/router";
import { setPendingEdit, type PendingEditResource } from "@/lib/pending-edit";
import { syncApi } from "@/lib/api-client";
import { Send } from "lucide-react";
import { useHistory, useFinanceInvalidation } from "@/lib/use-data";
import { historyApi } from "@/lib/api-client";
import { formatMoney, formatDate } from "@/lib/format";
import { calculateNetIncome, getMoneyValueTone, transactionWorkflowCategories } from "@/lib/finance-rules";
import type { ActivityEntry, MutationAction, SyncedResource, UnsyncedItem } from "@/types/finance";

// ── History section ────────────────────────────────────────────────────────
// Two feeds backed by the local store:
//   1. Unsynced Items — local changes (soft deletes + pending hard-delete trash) still
//      waiting to reach Notion. Each row can be discarded (×): cancel never-synced
//      creates, or restore the last synced state for edits/deletes.
//   2. Recently Synced — the durable activity_log of completed sync events, showing
//      the status (Created/Updated/Deleted) and direction (Notion DB → App / App →
//      Notion DB) of each.
//
// When the user clicks an item, a modal opens that mimics the income/expense form layout
// (read-only by default) using the stored payload data.

const RESOURCE_LABEL: Record<SyncedResource, string> = {
  incomes: "Income",
  expenses: "Expense",
};

const ACTION_TONE: Record<MutationAction, "blue" | "amber" | "rose"> = {
  create: "blue",
  update: "amber",
  delete: "rose",
};

const ACTION_LABEL: Record<MutationAction, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
};

function ActionIcon({ action, size = 14 }: { action: MutationAction; size?: number }) {
  if (action === "create") return <PlusCircle size={size} />;
  if (action === "delete") return <Trash2 size={size} />;
  return <PenLine size={size} />;
}

function cleanTitle(title: string | null): string {
  if (!title) return "Untitled record";
  // Soft deletes rewrite the title to "[Deleted: <name>]"; show the original name.
  const match = title.match(/^\[Deleted:\s*(.*)\]$/);
  return match ? match[1] || "Untitled record" : title;
}

function formatWhen(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StateCell({ item }: { item: UnsyncedItem }) {
  if (item.syncState === "conflict") return <Badge tone="amber">Conflict</Badge>;
  if (item.pendingHardDelete) return <Badge tone="rose">Hard delete</Badge>;
  if (!item.notionPageId) return <Badge tone="blue">Never sent</Badge>;
  return <Badge tone="neutral">Pending</Badge>;
}

function DirectionCell({ direction }: { direction: "pull" | "push" }) {
  const pulled = direction === "pull";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
      {pulled ? <CloudDownload size={13} /> : <CloudUpload size={13} />}
      {pulled ? "Notion DB" : "App"}
      <ArrowRight size={11} />
      {pulled ? "App" : "Notion DB"}
    </span>
  );
}

function discardCopy(item: UnsyncedItem): { title: string; message: string } {
  const name = cleanTitle(item.title);
  if (item.action === "create" || (!item.notionPageId && !item.pendingHardDelete)) {
    return {
      title: "Cancel this creation?",
      message: `"${name}" was never sent to Notion. Discarding removes it from this app.`,
    };
  }
  if (item.pendingHardDelete || item.action === "delete") {
    return {
      title: "Undo this deletion?",
      message: `"${name}" will be restored to its last synced state and will not be deleted in Notion on the next push.`,
    };
  }
  return {
    title: "Discard these changes?",
    message: `"${name}" will be restored to its last synced state. Your unsynced edits will be lost.`,
  };
}

// ── Form-view components for record detail modals ───────────────────────────

function IncomeFormView({ payload }: { payload: Record<string, unknown> }) {
  const { nonCreditActiveAccounts, allIncomeCategories } = useLiveCollections();
  const accountNameById = useMemo(
    () => new Map(nonCreditActiveAccounts.map((a) => [a.id, a.name])),
    [nonCreditActiveAccounts],
  );
  const categoryNameById = useMemo(
    () => new Map(allIncomeCategories.map((c) => [c.id, c.source])),
    [allIncomeCategories],
  );

  const grossIncome = Number(payload.grossIncome ?? 0);
  const capitalExpenditure = Number(payload.capitalExpenditure ?? 0);
  const netIncome = calculateNetIncome(grossIncome, capitalExpenditure);

  const prev = payload._previous as Record<string, unknown> | undefined;

  const prevGrossIncome = prev?.grossIncome != null ? Number(prev.grossIncome) : grossIncome;
  const prevCapEx = prev?.capitalExpenditure != null ? Number(prev.capitalExpenditure) : capitalExpenditure;
  const prevNetIncome = calculateNetIncome(prevGrossIncome, prevCapEx);

  return (
    <div className="form-grid form-grid--single">
      <FieldValue label="Name" value={(payload.name as string) ?? ""} previousValue={prev?.name as string | null ?? null} />
      <FieldValue label="Date" value={(payload.date as string) ?? ""} previousValue={prev?.date as string | null ?? null} />
      <FieldValue label="Gross Income" value={formatMoney(grossIncome)} previousValue={prev?.grossIncome != null ? formatMoney(Number(prev.grossIncome)) : null} />
      <FieldValue label="Capital Expenditure" value={formatMoney(capitalExpenditure)} previousValue={prev?.capitalExpenditure != null ? formatMoney(Number(prev.capitalExpenditure)) : null} />
      <FieldValue label="Account" value={payload.accountId ? (accountNameById.get(payload.accountId as string) ?? "(unknown)") : "— None —"} previousValue={prev?.accountId != null ? (accountNameById.get(prev.accountId as string) ?? "(unknown)") : null} />
      <FieldValue label="Category" value={payload.categoryId ? (categoryNameById.get(payload.categoryId as string) ?? "(unknown)") : "— None —"} previousValue={prev?.categoryId != null ? (categoryNameById.get(prev.categoryId as string) ?? "(unknown)") : null} />
      <FieldValue label="Net Income" value={formatMoney(netIncome)} previousValue={formatMoney(prevNetIncome)} computed />
    </div>
  );
}

function ExpenseFormView({ payload }: { payload: Record<string, unknown> }) {
  const { activeAccounts, expenseCategories } = useLiveCollections();
  const accountNameById = useMemo(
    () => new Map(activeAccounts.map((a) => [a.id, a.name])),
    [activeAccounts],
  );
  const categoryNameById = useMemo(
    () => new Map(expenseCategories.map((c) => [c.id, c.name])),
    [expenseCategories],
  );

  const amount = Number(payload.amount ?? 0);
  const interest = Number(payload.interest ?? 0);
  const grossPrice = amount + interest;
  const prev = payload._previous as Record<string, unknown> | undefined;

  const prevAmount = prev?.amount != null ? Number(prev.amount) : amount;
  const prevInterest = prev?.interest != null ? Number(prev.interest) : interest;
  const prevGrossPrice = prevAmount + prevInterest;

  function pv(key: string): string | null {
    return prev?.[key] != null ? String(prev[key]) : null;
  }

  const items: Array<{ label: string; value: string; previousValue?: string | null; computed?: boolean; tone?: string }> = [
    { label: "Description", value: (payload.description as string) ?? "", previousValue: pv("description") },
    { label: "Purchase Date", value: payload.purchaseDate ? formatDate(payload.purchaseDate as string) : "", previousValue: prev?.purchaseDate ? formatDate(prev.purchaseDate as string) : null },
    { label: "Date Paid", value: payload.datePaid ? formatDate(payload.datePaid as string) : "—", previousValue: prev?.datePaid ? formatDate(prev.datePaid as string) : null },
    { label: "Amount", value: formatMoney(amount), previousValue: prev?.amount != null ? formatMoney(Number(prev.amount)) : null },
    { label: "Interest", value: formatMoney(interest), previousValue: prev?.interest != null ? formatMoney(Number(prev.interest)) : null },
    { label: "Gross Price", value: formatMoney(grossPrice), previousValue: formatMoney(prevGrossPrice), computed: true },
    { label: "Account", value: payload.accountId ? (accountNameById.get(payload.accountId as string) ?? "(unknown)") : "—", previousValue: prev?.accountId != null ? (accountNameById.get(prev.accountId as string) ?? "(unknown)") : null },
    { label: "Category", value: payload.categoryId ? (categoryNameById.get(payload.categoryId as string) ?? "(unknown)") : "—", previousValue: prev?.categoryId != null ? (categoryNameById.get(prev.categoryId as string) ?? "(unknown)") : null },
    { label: "Payment Status", value: (payload.paymentStatus as string) ?? "Unpaid", previousValue: pv("paymentStatus") },
  ];
  if (payload.paymentFrequency) items.push({ label: "Payment Frequency", value: payload.paymentFrequency as string, previousValue: pv("paymentFrequency") });
  if (payload.periodCount != null && Number(payload.periodCount) > 0) items.push({ label: "Period Count", value: String(payload.periodCount), previousValue: prev?.periodCount != null ? String(prev.periodCount) : null });
  if (payload.paidPeriod != null && Number(payload.paidPeriod) > 0) items.push({ label: "Paid Period", value: String(payload.paidPeriod), previousValue: prev?.paidPeriod != null ? String(prev.paidPeriod) : null });
  if (payload.pasabuyer) {
    items.push({ label: "Pasabuyer", value: payload.pasabuyer as string, previousValue: pv("pasabuyer") });
    items.push({ label: "Pasabuy Status", value: (payload.pasabuyStatus as string) ?? "", previousValue: pv("pasabuyStatus") });
    if (payload.pasabuyDateOfPayment) items.push({ label: "Pasabuy DOP", value: payload.pasabuyDateOfPayment as string, previousValue: pv("pasabuyDateOfPayment") });
  }

  return (
    <div className="form-grid form-grid--single">
      {items.map((item, i) => (
        <FieldValue key={i} {...item} />
      ))}
    </div>
  );
}

function RecordDetailModal({
  resource,
  payload,
  title,
  subtitle,
  openLabel,
  onOpenRecord,
  onClose,
  footerExtra,
}: {
  resource: SyncedResource;
  payload: Record<string, unknown> | null | undefined;
  title: string;
  subtitle: string;
  openLabel: string;
  onOpenRecord: () => void;
  onClose: () => void;
  footerExtra?: React.ReactNode;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="modal-panel" role="dialog" aria-modal="true">
        <div className="modal-panel__header">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <div className="modal-panel__body">
          {payload ? (
            resource === "incomes" ? (
              <IncomeFormView payload={payload} />
            ) : (
              <ExpenseFormView payload={payload} />
            )
          ) : (
            <p className="empty-state">No record data available.</p>
          )}
        </div>
        <div className="modal-panel__footer" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "0.375rem" }}>
            {footerExtra}
            <button type="button" className="button" onClick={onOpenRecord}>
              <PenLine size={14} /> Open in {openLabel}
            </button>
          </div>
          <button type="button" className="button" onClick={onClose}>
            Close
          </button>
        </div>
      </section>
    </div>
  );
}

// ── Main History page component ─────────────────────────────────────────────

// ── Read-only form field display ──────────────────────────────────────
function FieldValue({ label, value, previousValue, computed, tone }: { label: string; value: string; previousValue?: string | null; computed?: boolean; tone?: string }) {
  const hasDiff = previousValue !== undefined && previousValue !== null && previousValue !== value;
  return (
    <div className="field-value-row">
      <span className="field-value-row__label">{label}:</span>
      {hasDiff ? (
        <span className="field-value-row__value">
          <span className="diff-old">{previousValue}</span>
          <span className="diff-arrow"> → </span>
          <span className="diff-new">{value}</span>
        </span>
      ) : computed ? (
        <strong className="field-value-row__value computed-field__value computed-field__value--ink">{value}</strong>
      ) : (
        <span className="field-value-row__value">{value}</span>
      )}
    </div>
  );
}

function HistoryPage() {
  const { state, refetch } = useHistory();
  const { invalidateIncomeFamily, invalidateExpenseFamily } = useFinanceInvalidation();
  const [discardItem, setDiscardItem] = useState<UnsyncedItem | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const [discardError, setDiscardError] = useState<string | null>(null);
  const [selectedUnsynced, setSelectedUnsynced] = useState<UnsyncedItem | null>(null);
  const [selectedSynced, setSelectedSynced] = useState<ActivityEntry | null>(null);
  const [pushItemLoading, setPushItemLoading] = useState(false);
  const [bulkPushing, setBulkPushing] = useState(false);
  const [bulkCancelling, setBulkCancelling] = useState(false);

  // Refresh when local records change or a sync completes, so the feeds stay live.
  useEffect(() => {
    const api = window.api;
    if (!api?.on) return;
    const off = [
      api.on("records:changed", () => void refetch()),
      api.on("derived:updated", () => void refetch()),
      api.on("sync:status", () => void refetch()),
    ];
    return () => off.forEach((fn) => fn());
  }, [refetch]);

  const data =
    state.status === "success"
      ? state.data
      : { unsynced: [], recent: [], lastPullAt: null, lastPushAt: null };

  const deletedPending = data.unsynced.filter((i) => i.deleted).length;

  async function confirmDiscard() {
    if (!discardItem) return;
    setDiscarding(true);
    setDiscardError(null);
    try {
      const res = await historyApi.discardUnsynced(discardItem.resource, discardItem.recordId);
      if (!res.success) {
        setDiscardError(res.error.message || "Could not discard this change.");
        return;
      }
      setDiscardItem(null);
      setSelectedUnsynced(null);
      void refetch();
      if (discardItem.resource === "incomes") invalidateIncomeFamily();
      else invalidateExpenseFamily();
    } catch (err) {
      setDiscardError(err instanceof Error ? err.message : "Could not discard this change.");
    } finally {
      setDiscarding(false);
    }
  }

  async function pushSingleItem(item: UnsyncedItem) {
    setPushItemLoading(true);
    setDiscardError(null);
    try {
      // Do a full push to send all pending changes (including this item) to Notion
      const res = await syncApi.pushOnly();
      if (!res.success) {
        setDiscardError(res.error.message || "Failed to push changes.");
        return;
      }
      setSelectedUnsynced(null);
      void refetch();
    } catch (err) {
      setDiscardError(err instanceof Error ? err.message : "Network error pushing changes.");
    } finally {
      setPushItemLoading(false);
    }
  }

  async function pushAllUnsynced() {
    setBulkPushing(true);
    setDiscardError(null);
    try {
      const res = await syncApi.pushOnly();
      if (!res.success) {
        setDiscardError(res.error.message || "Failed to push changes.");
        return;
      }
      void refetch();
    } catch (err) {
      setDiscardError(err instanceof Error ? err.message : "Network error pushing changes.");
    } finally {
      setBulkPushing(false);
    }
  }

  async function cancelAllUnsynced() {
    setBulkCancelling(true);
    setDiscardError(null);
    try {
      let lastErr: string | null = null;
      for (const item of data.unsynced) {
        const res = await historyApi.discardUnsynced(item.resource, item.recordId);
        if (!res.success) lastErr = res.error.message || "Failed to discard item";
      }
      if (lastErr) {
        setDiscardError(lastErr);
        return;
      }
      void refetch();
      invalidateIncomeFamily();
      invalidateExpenseFamily();
    } catch (err) {
      setDiscardError(err instanceof Error ? err.message : "Network error discarding changes.");
    } finally {
      setBulkCancelling(false);
    }
  }

  // Build a categoryId → workflow section map once
  const { allIncomeCategories } = useLiveCollections();
  const categoryRouteById = useMemo(() => {
    // reverse: workflow section label → section route
    const sectionByCategoryName: Record<string, string> = {};
    for (const [section, name] of Object.entries(transactionWorkflowCategories)) {
      if (name) sectionByCategoryName[name] = section;
    }
    const map = new Map<string, string>();
    for (const cat of allIncomeCategories) {
      const section = sectionByCategoryName[cat.source];
      if (section) map.set(cat.id, section);
    }
    return map;
  }, [allIncomeCategories]);

  const SECTION_PENDING_RESOURCE: Record<string, PendingEditResource> = {
    transfer: "transfers",
    "credit-card-payment": "creditCardPayments",
    alkansya: "alkansya",
    receivables: "receivables",
    income: "incomes",
    expense: "expenses",
  };

  const SECTION_LABEL: Record<string, string> = {
    transfer: "Transfer",
    "credit-card-payment": "Credit Card Payment",
    alkansya: "Alkansya",
    receivables: "Receivables",
    income: "Income",
    expense: "Expense",
  };

  /** Determine the correct route, button label, and pending-edit resource for a record. */
  function openTarget(resource: SyncedResource, payload: Record<string, unknown> | null | undefined): { route: string; label: string; pendingResource: PendingEditResource } {
    if (resource === "expenses") {
      return { route: "expense", label: "Expense", pendingResource: "expenses" };
    }
    // For incomes, check if the category maps to a workflow section
    if (resource === "incomes" && payload) {
      const categoryId = payload.categoryId as string | undefined;
      if (categoryId) {
        const section = categoryRouteById.get(categoryId);
        if (section && SECTION_PENDING_RESOURCE[section]) {
          return {
            route: section,
            label: SECTION_LABEL[section] ?? "Income",
            pendingResource: SECTION_PENDING_RESOURCE[section],
          };
        }
      }
    }
    return { route: "income", label: "Income", pendingResource: "incomes" };
  }

  function openRecordInPage(resource: SyncedResource, recordId: string, payload: Record<string, unknown> | null | undefined) {
    const target = openTarget(resource, payload);
    setPendingEdit(target.pendingResource, recordId);
    navigate("/" + target.route);
  }

  return (
    <div className="page-stack">
      <section className="metric-grid">
        <MetricCard
          title="Unsynced Items"
          value={`${data.unsynced.length}`}
          detail="Waiting to reach Notion"
          icon={HistoryIcon}
          tone="amber"
        />
        <MetricCard
          title="Pending Deletions"
          value={`${deletedPending}`}
          detail="Soft/hard deletes waiting to sync"
          icon={Trash2}
          tone="rose"
        />
        <MetricCard
          title="Last Pull"
          value={data.lastPullAt ? formatWhen(data.lastPullAt).split(",")[1]?.trim() ?? "—" : "—"}
          detail={`Notion DB → App · ${data.lastPullAt ? formatWhen(data.lastPullAt).split(",")[0] : "never"}`}
          icon={CloudDownload}
          tone="blue"
        />
        <MetricCard
          title="Last Push"
          value={data.lastPushAt ? formatWhen(data.lastPushAt).split(",")[1]?.trim() ?? "—" : "—"}
          detail={`App → Notion DB · ${data.lastPushAt ? formatWhen(data.lastPushAt).split(",")[0] : "never"}`}
          icon={CloudUpload}
          tone="green"
        />
      </section>

      <Panel
        title="Unsynced Items"
        action={
          <Badge tone={data.unsynced.length ? "amber" : "green"}>
            {data.unsynced.length} pending
          </Badge>
        }
      >
        {data.unsynced.length === 0 ? (
          <EmptyState
            title="Everything is synced"
            detail="Changes you make in this app appear here until they reach Notion. Use × to discard an unsynced change."
          />
        ) : (
          <DataTable
            recordIds={data.unsynced.map((i) => i.recordId)}
            headers={["Status", "Record", "Type", "State", "Changed", ""]}
            unsortableColumns={[3, 5]}
            onRowClick={(recordId) => {
              const found = data.unsynced.find((i) => i.recordId === recordId);
              if (found) setSelectedUnsynced(found);
            }}
            rows={data.unsynced.map((item) => [
              <Badge tone={ACTION_TONE[item.action]} key="s">
                <ActionIcon action={item.action} /> {ACTION_LABEL[item.action]}
              </Badge>,
              cleanTitle(item.title),
              RESOURCE_LABEL[item.resource],
              <StateCell item={item} key="st" />,
              formatWhen(item.localUpdatedAt),
              <button
                key="discard"
                type="button"
                className="icon-button"
                aria-label={`Discard unsynced ${ACTION_LABEL[item.action].toLowerCase()} for ${cleanTitle(item.title)}`}
                title={
                  item.action === "create"
                    ? "Cancel creation"
                    : item.action === "delete"
                      ? "Undo deletion"
                      : "Discard changes"
                }
                onClick={(event) => {
                  event.stopPropagation();
                  setDiscardError(null);
                  setDiscardItem(item);
                }}
              >
                <X size={15} />
              </button>,
            ])}
          />
        )}
        {data.unsynced.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button
              type="button"
              className="button"
              onClick={cancelAllUnsynced}
              disabled={bulkCancelling || bulkPushing}
              style={{ fontSize: "0.8125rem" }}
            >
              <X size={14} />
              {bulkCancelling ? "Cancelling…" : "Cancel Syncing Unsynced"}
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={pushAllUnsynced}
              disabled={bulkPushing || bulkCancelling}
              style={{ fontSize: "0.8125rem" }}
            >
              <Send size={14} />
              {bulkPushing ? "Pushing…" : "Push Unsynced"}
            </button>
          </div>
        )}
      </Panel>

      <Panel
        title="Recently Synced"
        action={
          <Badge tone="neutral">
            <Clock size={12} /> Last 2 syncs · {data.recent.length}{" "}
            {data.recent.length === 1 ? "item" : "items"}
          </Badge>
        }
      >
        {data.recent.length === 0 ? (
          <EmptyState
            title="No sync activity yet"
            detail="Each sync shows the items it moved here (this sync and the one before it), with status and direction."
          />
        ) : (
          <DataTable
            recordIds={data.recent.map((e) => e.id)}
            headers={["Status", "Record", "Type", "Direction", "When"]}
            unsortableColumns={[3]}
            onRowClick={(recordId) => {
              const found = data.recent.find((e) => e.id === recordId);
              if (found) setSelectedSynced(found);
            }}
            rows={data.recent.map((entry) => [
              <Badge tone={ACTION_TONE[entry.action]} key="s">
                <ActionIcon action={entry.action} /> {ACTION_LABEL[entry.action]}
              </Badge>,
              cleanTitle(entry.title),
              RESOURCE_LABEL[entry.resource],
              <DirectionCell direction={entry.direction} key="d" />,
              formatWhen(entry.at),
            ])}
          />
        )}
      </Panel>

      {/* ── Unsynced item detail modal ── */}
      {selectedUnsynced && (
        <RecordDetailModal
          resource={selectedUnsynced.resource}
          payload={selectedUnsynced.payload}
          title={`Unsynced ${RESOURCE_LABEL[selectedUnsynced.resource]}`}
          subtitle={`${ACTION_LABEL[selectedUnsynced.action]} — ${cleanTitle(selectedUnsynced.title)}`}
          openLabel={openTarget(selectedUnsynced.resource, selectedUnsynced.payload).label}
          onOpenRecord={() => {
            setSelectedUnsynced(null);
            openRecordInPage(selectedUnsynced.resource, selectedUnsynced.recordId, selectedUnsynced.payload);
          }}
          onClose={() => {
            setSelectedUnsynced(null);
            setDiscardError(null);
          }}
          footerExtra={
            <>
              <button
                type="button"
                className="button button--danger"
                onClick={() => setDiscardItem(selectedUnsynced)}
                disabled={pushItemLoading || discarding}
              >
                <Trash2 size={14} /> Discard
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={() => void pushSingleItem(selectedUnsynced)}
                disabled={pushItemLoading || discarding}
              >
                <Send size={14} /> {pushItemLoading ? "Pushing…" : "Push this item"}
              </button>
            </>
          }
        />
      )}

      {/* ── Synced item detail modal ── */}
      {selectedSynced && (
        <RecordDetailModal
          resource={selectedSynced.resource}
          payload={selectedSynced.payload}
          title={`Synced ${RESOURCE_LABEL[selectedSynced.resource]}`}
          subtitle={`${ACTION_LABEL[selectedSynced.action]} · ` + (
            selectedSynced.direction === "pull"
              ? "Notion DB → App"
              : "App → Notion DB"
          )}
          openLabel={openTarget(selectedSynced.resource, selectedSynced.payload).label}
          onOpenRecord={() => {
            setSelectedSynced(null);
            openRecordInPage(selectedSynced.resource, selectedSynced.recordId, selectedSynced.payload);
          }}
          onClose={() => setSelectedSynced(null)}
        />
      )}

      {/* ── Discard confirmation modal ── */}
      {discardItem && (
        <ConfirmModal
          {...discardCopy(discardItem)}
          confirmLabel="Discard"
          danger
          busy={discarding}
          onCancel={() => {
            if (!discarding) {
              setDiscardItem(null);
              setDiscardError(null);
            }
          }}
          onConfirm={() => {
            void confirmDiscard();
          }}
        />
      )}
      {discardError && (
        <Toast tone="error" message={discardError} onDismiss={() => setDiscardError(null)} />
      )}
    </div>
  );
}

export { HistoryPage };
