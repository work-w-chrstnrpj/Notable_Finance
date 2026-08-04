import { useEffect, useRef, useState } from "react";
import { downloadNodeAsPng, nodeToPngDataUrl, printNode } from "@/lib/export-node";
import { ExportModalShell } from "@/components/export/export-modal-shell";
import { LoadingBlock, EmptyState } from "@/components/ui";

/**
 * Monthly Insight snapshot export for the FAB (refactor_development_plan.md Phase 6.3 —
 * pure move out of fab/index.tsx, unchanged).
 */
function InsightShotModal({
  insight,
  onClose,
}: {
  insight: { monthLabel: string; viewLabel: string; getNode: () => HTMLElement | null };
  onClose: () => void;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [status, setStatus] = useState<"capturing" | "ready" | "error">(
    "capturing",
  );

  useEffect(() => {
    let cancelled = false;
    const node = insight.getNode();
    if (!node) {
      queueMicrotask(() => {
        if (!cancelled) setStatus("error");
      });
      return;
    }
    nodeToPngDataUrl(node)
      .then((url) => {
        if (!cancelled) {
          setSnapshot(url);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [insight]);

  return (
    <ExportModalShell
      title={insight.viewLabel}
      subtitle={`A clean snapshot of your ${insight.viewLabel.toLowerCase().replace(" insight shot", "")} monitoring.`}
      busy={status !== "ready"}
      onClose={onClose}
      onPrint={() => surfaceRef.current && printNode(surfaceRef.current)}
      onSaveImage={() =>
        surfaceRef.current &&
        downloadNodeAsPng(surfaceRef.current, `notable-insight-${insight.monthLabel}`)
      }
    >
      {status === "capturing" && <LoadingBlock label="Building snapshot…" />}
      {status === "error" && (
        <EmptyState
          title="Couldn't build the snapshot"
          detail="Open the monitoring view and try again."
        />
      )}
      {status === "ready" && snapshot && (
        <div className="insight-shot" ref={surfaceRef}>
          <div className="insight-shot__head">
            <span className="insight-shot__brand">NOTABLE FINANCE</span>
            <span className="insight-shot__title">Monitoring</span>
            <span className="insight-shot__month">{insight.monthLabel}</span>
          </div>
          <div className="insight-shot__body">
            <img className="insight-shot__image" src={snapshot} alt="Monitoring snapshot" />
          </div>
        </div>
      )}
    </ExportModalShell>
  );
}

export { InsightShotModal };
