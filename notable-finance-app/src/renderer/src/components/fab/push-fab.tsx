import { useEffect, useRef, useState } from "react";
import { Rocket } from "lucide-react";
import { cx } from "@/lib/finance-helpers";

/**
 * Floating "Push to sync" button (top-right, aligned with the Quick Action FAB).
 *
 * Behaviour:
 * - Appears whenever there are local changes not yet pushed to Notion
 *   (dirtyCount > 0), re-surfacing on every create/update/delete.
 * - Auto-hides `autoHideMs` after the last change if the user never clicks it.
 * - Disappears immediately once a push succeeds (dirtyCount drops to 0).
 * - Plays a little rocket-launch flourish on click.
 */
export function PushSyncFab({
  autoHideMs,
  busy,
  onPush,
}: {
  autoHideMs: number;
  busy: boolean;
  onPush: () => void;
}) {
  const [dirty, setDirty] = useState(0);
  // Bumped to `now` whenever new pending work appears; drives the auto-hide timer.
  const [armedAt, setArmedAt] = useState<number | null>(null);
  const [hidden, setHidden] = useState(false);
  const [launching, setLaunching] = useState(false);
  const prevDirty = useRef(0);

  useEffect(() => {
    const api = window.api;
    if (!api?.sync?.status || !api?.on) return;
    let alive = true;
    const applyDirty = (n: number) => {
      if (!alive) return;
      // Only (re)arm when the pending count grows — pushes that clear it must
      // not re-trigger the button.
      if (n > prevDirty.current) setArmedAt(Date.now());
      prevDirty.current = n;
      setDirty(n);
    };
    void api.sync.status().then((r) => {
      if (r.ok) applyDirty(r.data.dirtyCount ?? 0);
    });
    const offStatus = api.on("sync:status", (p) =>
      applyDirty((p as { dirtyCount?: number }).dirtyCount ?? 0),
    );
    const offRecords = api.on("records:changed", () => {
      // A local write just happened — surface the button right away, then let
      // the follow-up status broadcast reconcile the exact count.
      setArmedAt(Date.now());
      void api.sync!.status().then((r) => {
        if (r.ok) applyDirty(r.data.dirtyCount ?? 0);
      });
    });
    return () => {
      alive = false;
      offStatus();
      offRecords();
    };
  }, []);

  // (Re)start the auto-hide countdown each time we're armed by a fresh change.
  useEffect(() => {
    if (armedAt == null) return;
    setHidden(false);
    const t = window.setTimeout(() => setHidden(true), Math.max(1000, autoHideMs));
    return () => window.clearTimeout(t);
  }, [armedAt, autoHideMs]);

  if (dirty <= 0 || hidden) return null;

  const onClick = () => {
    if (busy) return;
    setLaunching(true);
    onPush();
    window.setTimeout(() => setLaunching(false), 800);
  };

  return (
    <button
      type="button"
      className={cx("push-fab", launching && "push-fab--launching")}
      onClick={onClick}
      disabled={busy}
      aria-label={`Push ${dirty} change${dirty > 1 ? "s" : ""} to Notion`}
      title={`Push ${dirty} pending change${dirty > 1 ? "s" : ""} to Notion`}
    >
      <span className="push-fab__icon" aria-hidden="true">
        <Rocket size={18} />
        <span className="push-fab__trail" aria-hidden="true" />
      </span>
      <span className="push-fab__label">{busy ? "Pushing…" : "Push to sync"}</span>
      <span className="push-fab__count">{dirty}</span>
    </button>
  );
}
