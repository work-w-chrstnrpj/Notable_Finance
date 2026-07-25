import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eraser, Bug } from "lucide-react";
import { useUiSettings } from "@/lib/ui-settings-context";
import { navigate } from "@/lib/router";
import { cx } from "@/lib/finance-helpers";
import type { DevLogEntry, DevLogKind } from "@shared/finance.types";

const KINDS: Array<DevLogKind | "all"> = ["all", "api", "operation", "system"];

function formatTime(at: number): string {
  const d = new Date(at);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

function DevLogsPage() {
  const { settings, devModeEnabled } = useUiSettings();
  const [entries, setEntries] = useState<DevLogEntry[]>([]);
  const [kind, setKind] = useState<DevLogKind | "all">("all");
  const [paused, setPaused] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    if (!devModeEnabled) {
      const last = settings.workspace.lastSection;
      navigate(`/${last && last !== "dev-logs" && last !== "chat" ? last : "dashboard"}`);
    }
  }, [devModeEnabled, settings.workspace.lastSection]);

  const refresh = useCallback(async () => {
    const res = await window.api.devLogs.list();
    if (res.ok) setEntries(res.data);
  }, []);

  useEffect(() => {
    if (!devModeEnabled) return;
    void refresh();
    const off = window.api.on("devLogs:entry", (payload) => {
      if (pausedRef.current) return;
      const entry = payload as DevLogEntry;
      setEntries((prev) => {
        if (prev.some((e) => e.id === entry.id)) return prev;
        const next = [...prev, entry];
        return next.length > 500 ? next.slice(-500) : next;
      });
    });
    return off;
  }, [devModeEnabled, refresh]);

  useEffect(() => {
    if (!paused) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, paused]);

  const filtered = useMemo(
    () => (kind === "all" ? entries : entries.filter((e) => e.kind === kind)),
    [entries, kind],
  );

  async function onClear() {
    await window.api.devLogs.clear();
    setEntries([]);
  }

  if (!devModeEnabled) return null;

  return (
    <div className="dev-logs" data-dev-log-ignore="">
      <header className="dev-logs__header">
        <div>
          <h2 className="dev-logs__title">
            <Bug size={18} />
            Dev Logs
          </h2>
          <p className="dev-logs__hint">
            In-memory only — cleared when the app quits or Dev Mode is turned off. Secrets are
            redacted.
          </p>
        </div>
        <div className="dev-logs__actions">
          <label className="dev-logs__pause">
            <input
              type="checkbox"
              checked={paused}
              onChange={(e) => setPaused(e.target.checked)}
            />
            Pause live
          </label>
          <button type="button" className="button" onClick={() => void refresh()}>
            Refresh
          </button>
          <button type="button" className="button" onClick={() => void onClear()}>
            <Eraser size={14} />
            Clear
          </button>
        </div>
      </header>

      <div className="dev-logs__filters" role="tablist" aria-label="Log kind">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={kind === k}
            className={cx("dev-logs__chip", kind === k && "dev-logs__chip--active")}
            onClick={() => setKind(k)}
          >
            {k}
          </button>
        ))}
        <span className="dev-logs__count">{filtered.length} shown</span>
      </div>

      <div className="dev-logs__stream" role="log" aria-live="polite">
        {filtered.length === 0 && (
          <p className="dev-logs__empty">No entries yet. Failed API calls, sync errors, and chat failures will appear here.</p>
        )}
        {filtered.map((e) => (
          <article
            key={e.id}
            className={cx(
              "dev-logs__row",
              e.ok === false && "dev-logs__row--error",
              `dev-logs__row--${e.kind}`,
            )}
          >
            <div className="dev-logs__meta">
              <time dateTime={new Date(e.at).toISOString()}>{formatTime(e.at)}</time>
              <span className="dev-logs__kind">{e.kind}</span>
              <span className="dev-logs__source">{e.source}</span>
              {e.durationMs != null && (
                <span className="dev-logs__dur">{e.durationMs}ms</span>
              )}
            </div>
            <p className="dev-logs__action">{e.action}</p>
            <p className="dev-logs__message">{e.message}</p>
            {e.detail && Object.keys(e.detail).length > 0 && (
              <pre className="dev-logs__detail">{JSON.stringify(e.detail, null, 2)}</pre>
            )}
          </article>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export { DevLogsPage };
