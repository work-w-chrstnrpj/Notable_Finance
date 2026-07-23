import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  CloudDownload,
  CloudUpload,
  Database,
  GitMerge,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { MetricCard, Panel, Badge, ErrorRow } from "@/components/ui";
import { StatusPill } from "@/components/ui/date-range";
import { useSyncStatus } from "@/lib/use-data";
import { cx } from "@/lib/finance-helpers";
import type { SchemaHealth, SyncState } from "@/types/finance";

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
      <div className="desktop-sync">
        <p className="desktop-sync__lead">
          Writes land in the local database instantly and queue for Notion. Sync reconciles with a
          three-way merge — disjoint edits auto-merge; same-field edits appear below for your decision.
        </p>

        <div className="settings-row">
          <div>
            <p className="settings-toggle__title">Initial pull from Notion</p>
            <p className="settings-toggle__hint">
              {notice ?? "Load your Notion databases into the local store (first-time setup)."}
            </p>
          </div>
          <button type="button" className="button" onClick={() => void initialPull()} disabled={busy}>
            <CloudDownload size={16} />
            {busy ? "Pulling…" : "Pull now"}
          </button>
        </div>

        {settings && (
          <div className="settings-row">
            <div>
              <p className="settings-toggle__title">Auto-sync</p>
              <p className="settings-toggle__hint">
                {settings.mode === "auto"
                  ? "Syncing automatically on a timer."
                  : "Sync only when you press the Sync button."}
              </p>
            </div>
            <div className="desktop-sync__auto">
              <label
                className="desktop-sync__interval"
                data-disabled={settings.mode !== "auto"}
              >
                every
                <input
                  type="number"
                  min={30}
                  step={30}
                  value={settings.intervalSeconds}
                  disabled={settings.mode !== "auto"}
                  onChange={(e) => setSettings({ ...settings, intervalSeconds: Number(e.target.value) })}
                  onBlur={() => settings.mode === "auto" && void setMode({ intervalSeconds: settings.intervalSeconds })}
                />
                sec
              </label>
              <label
                className={cx("switch", settings.mode === "auto" && "switch--on")}
                aria-label="Toggle auto-sync"
              >
                <input
                  type="checkbox"
                  checked={settings.mode === "auto"}
                  onChange={(e) => void setMode({ mode: e.target.checked ? "auto" : "manual" })}
                />
                <span className="switch__track"><span className="switch__thumb" /></span>
              </label>
            </div>
          </div>
        )}

        {conflicts.length > 0 && (
          <div className="conflict-group">
            {conflicts.map((c) => (
              <div key={`${c.recordTable}:${c.recordId}`} className="conflict-card">
                <div className="conflict-card__head">
                  <GitMerge size={15} />
                  <strong>{c.title}</strong>
                  <Badge tone="neutral">{c.recordTable}</Badge>
                </div>
                <div className="conflict-fields">
                  {c.fields.map((f) => (
                    <div key={f.field} className="conflict-field">
                      <Badge tone="amber">{f.field}</Badge>
                      <div className="conflict-field__values">
                        <span>Mine: <b>{fmt(f.local)}</b></span>
                        <span>Notion: <b>{fmt(f.remote)}</b></span>
                      </div>
                      <div className="conflict-field__actions">
                        <button type="button" className="button" onClick={() => void resolve(c, { perField: { [f.field]: "local" } })}>Mine</button>
                        <button type="button" className="button" onClick={() => void resolve(c, { perField: { [f.field]: "remote" } })}>Notion</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="conflict-card__actions">
                  <button type="button" className="button" onClick={() => void resolve(c, { all: "local" })}>Keep all mine</button>
                  <button type="button" className="button" onClick={() => void resolve(c, { all: "remote" })}>Keep all Notion</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

function SyncPage({
  lastSync,
  pendingOperations,
  schemaHealth,
  syncState,
  activeSyncKind,
  onSchemaVerify,
  onPullSync,
  onPushSync,
  onSync,
}: {
  lastSync: string;
  pendingOperations: number;
  schemaHealth: SchemaHealth;
  syncState: SyncState;
  activeSyncKind: "full" | "pull" | "push" | null;
  onSchemaVerify: () => void;
  onPullSync: () => void;
  onPushSync: () => void;
  onSync: () => void;
}) {
  const { state: syncStatusState } = useSyncStatus();
  const syncing = syncState === "syncing";

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
          <div className="sync-actions">
            <div className="action-list action-list--sync">
              <button
                type="button"
                className="button"
                onClick={onPullSync}
                disabled={syncing}
              >
                <CloudDownload
                  size={16}
                  className={activeSyncKind === "pull" ? "icon-busy" : undefined}
                />
                {activeSyncKind === "pull" ? "Pulling…" : "Pull sync only"}
              </button>
              <button
                type="button"
                className="button"
                onClick={onPushSync}
                disabled={syncing}
              >
                <CloudUpload
                  size={16}
                  className={activeSyncKind === "push" ? "icon-busy" : undefined}
                />
                {activeSyncKind === "push" ? "Pushing…" : "Push sync only"}
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={onSync}
                disabled={syncing}
              >
                <RefreshCw
                  size={16}
                  className={activeSyncKind === "full" ? "spin" : undefined}
                />
                {activeSyncKind === "full" ? "Syncing…" : "Full sync"}
              </button>
              <button type="button" className="button" onClick={onSchemaVerify} disabled={syncing}>
                <ShieldCheck size={16} />
                Verify Schema
              </button>
            </div>
            <div className="snapshot-card">
              <p className="snapshot-card__title">Refresh Source</p>
              <p>
                Pull brings Notion → App. Push sends dirty local changes → Notion. Full sync runs
                pull then push (same as the header Sync button).
              </p>
            </div>
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
    </div>
  );
}

export { SyncPage };
