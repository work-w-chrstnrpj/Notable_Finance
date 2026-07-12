"use client";

import { AlertTriangle, ClipboardCheck, Database, RefreshCw, ShieldCheck } from "lucide-react";
import { MetricCard, Panel, Badge, ErrorRow } from "@/components/ui";
import { StatusPill } from "@/components/ui/date-range";
import { useSyncStatus } from "@/lib/use-data";
import type { SchemaHealth, SyncLogEntry, SyncState } from "@/types/finance";

function SyncPage({
  lastSync,
  pendingOperations,
  schemaHealth,
  syncState,
  onSchemaVerify,
  onSync,
}: {
  lastSync: string;
  pendingOperations: number;
  schemaHealth: SchemaHealth;
  syncState: SyncState;
  onSchemaVerify: () => void;
  onSync: () => void;
}) {
  const { state: syncStatusState } = useSyncStatus();

  // Use API sync status when available, fall back to parent props
  const apiStatus =
    syncStatusState.status === "success" ? syncStatusState.data : null;

  const displayLastSync =
    apiStatus?.lastSyncAt?.replace("T", " ").slice(0, 16) ?? lastSync;
  const displayPending =
    apiStatus?.pendingOperations ?? pendingOperations;
  const displayFailed = apiStatus?.failedOperations ?? 1;

  return (
    <div className="page-stack">
      <section className="metric-grid">
        <MetricCard title="Last Successful Sync" value={displayLastSync.split(" ")[1] || "-"} detail={displayLastSync.split(" ")[0] || "-"} icon={RefreshCw} tone="blue" />
        <MetricCard title="Pending Operations" value={`${displayPending}`} detail="Queued changes" icon={ClipboardCheck} tone="amber" />
        <MetricCard title="Failed Operations" value={`${displayFailed}`} detail="Needs review" icon={AlertTriangle} tone="rose" />
        <MetricCard title="Schema Health" value={schemaHealth === "warning" ? "Review" : schemaHealth === "verified" ? "Verified" : "Unchecked"} detail="/api/v1/system/schema-status" icon={Database} tone="green" />
      </section>
      <section className="two-column">
        <Panel title="Sync Actions" action={<StatusPill syncState={syncState} schemaHealth={schemaHealth} />}>
          <div className="action-list">
            <button type="button" className="button button--primary" onClick={onSync}>
              <RefreshCw size={16} className={syncState === "syncing" ? "spin" : undefined} />
              Commit Queue
            </button>
            <button type="button" className="button" onClick={onSchemaVerify}>
              <ShieldCheck size={16} />
              Verify Schema
            </button>
          </div>
          <div className="snapshot-card">
            <p className="snapshot-card__title">Refresh Source</p>
            <p>Local optimistic state is replaced by the fresh backend snapshot after direct-save or queued sync.</p>
          </div>
        </Panel>
        <Panel title="Errors" action={<Badge tone="amber">User safe</Badge>}>
          <div className="error-list">
            <ErrorRow code="VALIDATION_ERROR" detail="Expense Amount is required." />
            <ErrorRow code="SCHEMA_DRIFT_DETECTED" detail="Payment Status option changed." />
            <ErrorRow code="CONFLICT_ERROR" detail="Record changed after the app loaded it." />
            <ErrorRow code="NOTION_RATE_LIMITED" detail="Retry after the backend cooldown." />
            <ErrorRow code="FORBIDDEN" detail="The signed-in user cannot sync this resource." />
          </div>
        </Panel>
      </section>
      <Panel title="Activity Log" action={<Badge tone="neutral">0 entries</Badge>}>
        <div className="activity-list">
          {([] as SyncLogEntry[]).map((entry) => (
            <div className="activity-row" key={entry.id}>
              <Badge tone={entry.type === "error" || entry.type === "conflict" ? "amber" : "blue"}>
                {entry.type}
              </Badge>
              <div>
                <p>{entry.resource}</p>
                <span>{entry.description}</span>
              </div>
              <time>{entry.timestamp}</time>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

export { SyncPage };
