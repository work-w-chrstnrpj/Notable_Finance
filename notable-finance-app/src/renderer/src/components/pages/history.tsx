import { useEffect, useState } from "react";
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
import { Badge, EmptyState, MetricCard, Panel } from "@/components/ui";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmModal } from "@/components/ui/form-modals";
import { useHistory, useFinanceInvalidation } from "@/lib/use-data";
import { historyApi } from "@/lib/api-client";
import type { MutationAction, SyncedResource, UnsyncedItem } from "@/types/finance";

// ── History section ────────────────────────────────────────────────────────
// Two feeds backed by the local store:
//   1. Unsynced Items — local changes (soft deletes + pending hard-delete trash) still
//      waiting to reach Notion. Each row can be discarded (×): cancel never-synced
//      creates, or restore the last synced state for edits/deletes.
//   2. Recently Synced — the durable activity_log of completed sync events, showing
//      the status (Created/Updated/Deleted) and direction (Notion DB → App / App →
//      Notion DB) of each.

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

function HistoryPage() {
  const { state, refetch } = useHistory();
  const { invalidateIncomeFamily, invalidateExpenseFamily } = useFinanceInvalidation();
  const [discardItem, setDiscardItem] = useState<UnsyncedItem | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const [discardError, setDiscardError] = useState<string | null>(null);

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
      void refetch();
      if (discardItem.resource === "incomes") invalidateIncomeFamily();
      else invalidateExpenseFamily();
    } catch (err) {
      setDiscardError(err instanceof Error ? err.message : "Could not discard this change.");
    } finally {
      setDiscarding(false);
    }
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
            headers={["Status", "Record", "Type", "State", "Changed", ""]}
            unsortableColumns={[3, 5]}
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
            headers={["Status", "Record", "Type", "Direction", "When"]}
            unsortableColumns={[3]}
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
        <div className="save-notice" role="alert" style={{ marginTop: "0.5rem" }}>
          {discardError}
        </div>
      )}
    </div>
  );
}

export { HistoryPage };
