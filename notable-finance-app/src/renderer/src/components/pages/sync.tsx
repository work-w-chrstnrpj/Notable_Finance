import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  CloudDownload,
  CloudUpload,
  Database,
  GitMerge,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { MetricCard, Panel, Badge, ErrorRow } from "@/components/ui";
import { ConfirmModal } from "@/components/ui/form-modals";
import { StatusPill } from "@/components/ui/date-range";
import { useSyncStatus } from "@/lib/use-data";
import { cx } from "@/lib/finance-helpers";
import type { PullRange, SchemaHealth, SyncState } from "@/types/finance";

// ── Desktop-only: local-first sync controls (initial pull, auto mode, conflicts) ──

type DesktopConflict = {
  recordTable: "incomes" | "expenses";
  recordId: string;
  title: string;
  fields: Array<{ field: string; local: unknown; remote: unknown }>;
};

/** Convert a PullRange preset to an ISO timestamp for the Notion `since` filter. */
function rangeToSince(range: PullRange | ""): string | undefined {
  if (!range || range === "all") return undefined;
  const offsets: Record<string, number> = {
    "1h": 3_600_000,
    "24h": 86_400_000,
    "2d": 172_800_000,
    "1w": 604_800_000,
    "1m": 2_592_000_000,
    "1y": 31_536_000_000,
  };
  return new Date(Date.now() - (offsets[range] ?? 0)).toISOString();
}

const fmt = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));

// ── Three-way merge modal ────────────────────────────────────────────────────

function ConflictModal({
  conflict,
  onClose,
  onResolve,
}: {
  conflict: DesktopConflict;
  onClose: () => void;
  onResolve: (resolution: { perField: Record<string, "local" | "remote"> }) => void;
}) {
  // Result state: which side each field picks. Default to "remote" (Notion) for all.
  const [choices, setChoices] = useState<Record<string, "local" | "remote">>(() => {
    const init: Record<string, "local" | "remote"> = {};
    for (const f of conflict.fields) {
      init[f.field] = "remote";
    }
    return init;
  });
  const [busy, setBusy] = useState(false);

  const setChoice = useCallback((field: string, side: "local" | "remote") => {
    setChoices((prev) => ({ ...prev, [field]: side }));
  }, []);

  const acceptAll = useCallback((side: "local" | "remote") => {
    const next: Record<string, "local" | "remote"> = {};
    for (const f of conflict.fields) next[f.field] = side;
    setChoices(next);
  }, [conflict.fields]);

  const handleSave = async () => {
    setBusy(true);
    await onResolve({ perField: choices });
    setBusy(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="conflict-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="conflict-modal__header">
          <GitMerge size={18} />
          <span className="conflict-modal__title">{conflict.title}</span>
          <Badge tone="neutral">{conflict.recordTable}</Badge>
          <button type="button" className="conflict-modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Quick actions */}
        <div className="conflict-modal__quick">
          <button type="button" className="button" onClick={() => acceptAll("local")}>
            Accept all Local
          </button>
          <button type="button" className="button" onClick={() => acceptAll("remote")}>
            Accept all Notion
          </button>
        </div>

        {/* Three-column merge grid — header and data rows share the same grid */}
        <div className="conflict-merge">
          {/* Column headers — rendered as the first row of the grid */}
          <div className="conflict-merge__row conflict-merge__row--header">
            <div className="conflict-merge__cell conflict-merge__cell--header">
              <span className="conflict-merge__col-label">Local</span>
            </div>
            <div className="conflict-merge__arrow conflict-merge__arrow--spacer" aria-hidden />
            <div className="conflict-merge__cell conflict-merge__cell--header conflict-merge__cell--result">
              <span className="conflict-merge__col-label">Result</span>
            </div>
            <div className="conflict-merge__arrow conflict-merge__arrow--spacer" aria-hidden />
            <div className="conflict-merge__cell conflict-merge__cell--header">
              <span className="conflict-merge__col-label">Notion</span>
            </div>
          </div>

          {/* Field rows */}
          {conflict.fields.map((f) => {
            const chosen = choices[f.field];
            return (
              <div key={f.field} className="conflict-merge__row">
                {/* Local column */}
                <div
                  className={cx(
                    "conflict-merge__cell conflict-merge__cell--local",
                    chosen === "local" && "conflict-merge__cell--active"
                  )}
                  onClick={() => setChoice(f.field, "local")}
                >
                  <span className="conflict-merge__field-name">{f.field}</span>
                  <span className="conflict-merge__field-value">{fmt(f.local)}</span>
                </div>

                {/* Arrow: accept local */}
                <button
                  type="button"
                  className={cx("conflict-merge__arrow", chosen === "local" && "conflict-merge__arrow--active")}
                  onClick={() => setChoice(f.field, "local")}
                  title="Use local value"
                >
                  <ArrowRight size={16} />
                </button>

                {/* Result column */}
                <div className="conflict-merge__cell conflict-merge__cell--result">
                  <span className="conflict-merge__field-value conflict-merge__field-value--result">
                    {fmt(chosen === "local" ? f.local : f.remote)}
                  </span>
                </div>

                {/* Arrow: accept notion */}
                <button
                  type="button"
                  className={cx("conflict-merge__arrow", chosen === "remote" && "conflict-merge__arrow--active")}
                  onClick={() => setChoice(f.field, "remote")}
                  title="Use Notion value"
                >
                  <ArrowLeft size={16} />
                </button>

                {/* Notion column */}
                <div
                  className={cx(
                    "conflict-merge__cell conflict-merge__cell--notion",
                    chosen === "remote" && "conflict-merge__cell--active"
                  )}
                  onClick={() => setChoice(f.field, "remote")}
                >
                  <span className="conflict-merge__field-name">{f.field}</span>
                  <span className="conflict-merge__field-value">{fmt(f.remote)}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="conflict-modal__footer">
          <button type="button" className="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="button button--primary" onClick={() => void handleSave()} disabled={busy}>
            {busy ? "Saving…" : "Save resolution"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Desktop Sync Panel ───────────────────────────────────────────────────────

function DesktopSyncPanel() {
  const [settings, setSettings] = useState<{ mode: "manual" | "auto"; intervalSeconds: number } | null>(null);
  const [conflicts, setConflicts] = useState<DesktopConflict[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [modalConflict, setModalConflict] = useState<DesktopConflict | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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

  const resetAll = async () => {
    setBusy(true);
    setNotice(null);
    setShowResetConfirm(false);
    const r = await window.api.sync.reset();
    setNotice(
      r.ok
        ? `Reset complete. Pulled ${r.data.referenceUpserted} reference rows, ${r.data.inserted} records from Notion.`
        : r.error.message,
    );
    setBusy(false);
  };

  const setMode = async (patch: { mode?: "manual" | "auto"; intervalSeconds?: number }) => {
    const r = await window.api.sync.setMode(patch);
    if (r.ok) setSettings(r.data);
  };

  const resolveOne = async (
    c: DesktopConflict,
    resolution: { all: "local" | "remote" } | { perField: Record<string, "local" | "remote"> },
  ) => {
    const r = await window.api.sync.resolveConflict(c.recordTable, c.recordId, resolution);
    if (r.ok) {
      setConflicts(r.data as DesktopConflict[]);
      setModalConflict(null); // close modal after save
    }
  };

  const resolveAll = async (resolution: "local" | "remote") => {
    setBusy(true);
    const r = await window.api.sync.resolveAllConflicts(resolution);
    if (r.ok) setConflicts(r.data as DesktopConflict[]);
    setBusy(false);
  };

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

        <div className="settings-row">
          <div>
            <p className="settings-toggle__title">Reset local database</p>
            <p className="settings-toggle__hint">
              Delete all local data and re-download everything from Notion. This cannot be undone.
            </p>
          </div>
          <button type="button" className="button button--danger" onClick={() => setShowResetConfirm(true)} disabled={busy}>
            <AlertTriangle size={16} />
            Reset
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
            <div className="conflict-bulk">
              <p className="conflict-bulk__label">{conflicts.length} record{conflicts.length > 1 ? "s" : ""} with conflicts</p>
              <div className="conflict-bulk__actions">
                <button type="button" className="button button--primary" onClick={() => void resolveAll("remote")} disabled={busy}>
                  Accept All from Notion
                </button>
                <button type="button" className="button" onClick={() => void resolveAll("local")} disabled={busy}>
                  Accept All Local
                </button>
              </div>
            </div>
            {conflicts.map((c) => (
              <button
                key={`${c.recordTable}:${c.recordId}`}
                type="button"
                className="conflict-card conflict-card--clickable"
                onClick={() => setModalConflict(c)}
              >
                <div className="conflict-card__head">
                  <GitMerge size={15} />
                  <strong>{c.title}</strong>
                  <Badge tone="neutral">{c.recordTable}</Badge>
                </div>
                <div className="conflict-card__fields-preview">
                  {c.fields.map((f) => (
                    <Badge key={f.field} tone="amber">{f.field}</Badge>
                  ))}
                </div>
                <span className="conflict-card__chevron">→</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reset confirmation modal */}
      {showResetConfirm && (
        <ConfirmModal
          title="Reset local database"
          message="Are you sure you want to reset the local database? All local data will be deleted and re-downloaded from Notion. This action cannot be undone."
          confirmLabel="Reset"
          danger
          busy={busy}
          onConfirm={() => void resetAll()}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {/* Three-way merge modal */}
      {modalConflict && (
        <ConflictModal
          conflict={modalConflict}
          onClose={() => setModalConflict(null)}
          onResolve={(resolution) => void resolveOne(modalConflict, resolution)}
        />
      )}
    </Panel>
  );
}

// ── Sync Page ────────────────────────────────────────────────────────────────

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
  onPullSync: (since?: string) => void;
  onPushSync: () => void;
  onSync: (since?: string) => void;
}) {
  const { state: syncStatusState } = useSyncStatus();
  const syncing = syncState === "syncing";
  const [pullRange, setPullRange] = useState<PullRange | "">("");

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
            <div className="filter-select">
              <label htmlFor="pull-range">Pull range</label>
              <select
                id="pull-range"
                value={pullRange}
                onChange={(e) => setPullRange(e.target.value as PullRange | "")}
                disabled={syncing}
              >
                <option value="">Incremental (last sync)</option>
                <option value="1h">Last hour</option>
                <option value="24h">Last 24 hours</option>
                <option value="2d">Last 2 days</option>
                <option value="1w">Last week</option>
                <option value="1m">Last month</option>
                <option value="1y">Last year</option>
                <option value="all">All time</option>
              </select>
            </div>
            <div className="action-list action-list--sync">
              <button
                type="button"
                className="button"
                onClick={() => onPullSync(rangeToSince(pullRange))}
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
                onClick={() => onSync(rangeToSince(pullRange))}
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
