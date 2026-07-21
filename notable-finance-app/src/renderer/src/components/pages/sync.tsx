
import { useEffect, useState } from "react";
import { AlertTriangle, ClipboardCheck, CloudDownload, Database, GitMerge, RefreshCw, ShieldCheck } from "lucide-react";
import { MetricCard, Panel, Badge, ErrorRow } from "@/components/ui";
import { StatusPill } from "@/components/ui/date-range";
import { useSyncStatus } from "@/lib/use-data";
import type { SchemaHealth, SyncLogEntry, SyncState } from "@/types/finance";

// ── Desktop-only: local-first sync controls (initial pull, auto mode, conflicts) ──
// This panel is the one intentional addition over the web page: it surfaces the
// desktop's local-first machinery (bring-your-own-Notion initial pull, interval sync,
// and the three-way-merge conflict resolver). Everything else matches the web app.

type DesktopConflict = {
  recordTable: "incomes" | "expenses";
  recordId: string;
  title: string;
  fields: Array<{ field: string; local: unknown; remote: unknown }>;
};

function DesktopSyncPanel() {
  const [settings, setSettings] = useState<{ mode: "manual" | "auto"; intervalSeconds: number } | null>(null);
  const [conflicts, setConflicts] = useState<DesktopConflict[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const reload = async () => {
    const [s, c] = await Promise.all([window.api.sync.getSettings(), window.api.sync.listConflicts()]);
    if (s.ok) setSettings(s.data);
    if (c.ok) setConflicts(c.data as DesktopConflict[]);
  };

  useEffect(() => {
    void reload();
    const off = window.api.on("sync:status", () => void reload());
    return off;
  }, []);

  const initialPull = async () => {
    setBusy(true);
    setNotice(null);
    const r = await window.api.sync.initialPull();
    setNotice(
      r.ok
        ? `Pulled ${r.data.referenceUpserted} reference rows, ${r.data.inserted} records.`
        : r.error.message,
    );
    setBusy(false);
  };

  const setMode = async (patch: { mode?: "manual" | "auto"; intervalSeconds?: number }) => {
    const r = await window.api.sync.setMode(patch);
    if (r.ok) setSettings(r.data);
  };

  const resolve = async (
    c: DesktopConflict,
    resolution: { all: "local" | "remote" } | { perField: Record<string, "local" | "remote"> },
  ) => {
    const r = await window.api.sync.resolveConflict(c.recordTable, c.recordId, resolution);
    if (r.ok) setConflicts(r.data as DesktopConflict[]);
  };

  const fmt = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));

  return (
    <Panel
      title="Local-First Sync (Desktop)"
      action={
        conflicts.length > 0
          ? <Badge tone="amber">{conflicts.length} conflict{conflicts.length > 1 ? "s" : ""}</Badge>
          : <Badge tone="green">No conflicts</Badge>
      }
    >
      <div className="action-list">
        <button type="button" className="button" onClick={() => void initialPull()} disabled={busy}>
          <CloudDownload size={16} />
          {busy ? "Pulling…" : "Initial Pull from Notion"}
        </button>
        {settings && (
          <>
            <label className="settings-toggle__hint" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <input
                type="checkbox"
                checked={settings.mode === "auto"}
                onChange={(e) => void setMode({ mode: e.target.checked ? "auto" : "manual" })}
              />
              Auto-sync every
            </label>
            <input
              type="number"
              min={30}
              step={30}
              value={settings.intervalSeconds}
              disabled={settings.mode !== "auto"}
              style={{ width: 80 }}
              onChange={(e) => setSettings({ ...settings, intervalSeconds: Number(e.target.value) })}
              onBlur={() => settings.mode === "auto" && void setMode({ intervalSeconds: settings.intervalSeconds })}
            />
            <span className="settings-toggle__hint">seconds</span>
          </>
        )}
      </div>
      {notice && <p className="settings-toggle__hint">{notice}</p>}
      <div className="snapshot-card">
        <p className="snapshot-card__title">Offline-first</p>
        <p>
          Writes land in the local database instantly and queue for Notion. Sync reconciles with a
          three-way merge: disjoint edits auto-merge; same-field edits appear below for your decision.
        </p>
      </div>
      {conflicts.map((c) => (
        <div key={`${c.recordTable}:${c.recordId}`} className="snapshot-card">
          <p className="snapshot-card__title">
            <GitMerge size={13} style={{ verticalAlign: "text-bottom", marginRight: 4 }} />
            {c.title} <Badge tone="neutral">{c.recordTable}</Badge>
          </p>
          {c.fields.map((f) => (
            <div key={f.field} className="activity-row">
              <Badge tone="amber">{f.field}</Badge>
              <div>
                <p>Mine: {fmt(f.local)} · Notion: {fmt(f.remote)}</p>
              </div>
              <span className="action-list">
                <button type="button" className="button" onClick={() => void resolve(c, { perField: { [f.field]: "local" } })}>Mine</button>
                <button type="button" className="button" onClick={() => void resolve(c, { perField: { [f.field]: "remote" } })}>Notion</button>
              </span>
            </div>
          ))}
          <div className="action-list">
            <button type="button" className="button" onClick={() => void resolve(c, { all: "local" })}>Keep all mine</button>
            <button type="button" className="button" onClick={() => void resolve(c, { all: "remote" })}>Keep all Notion</button>
          </div>
        </div>
      ))}
    </Panel>
  );
}

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
      <DesktopSyncPanel />
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
