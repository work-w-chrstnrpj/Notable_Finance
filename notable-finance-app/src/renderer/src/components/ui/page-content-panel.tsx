import { useCallback, useEffect, useState } from "react";
import type { PageContentResource } from "@shared/finance.types";
import { NotionPreview } from "./notion-preview";

/**
 * Page Content editor — the "flip side" of a record's form modal. Shows a Notion-like
 * information-only preview. Notion remains the editing surface for page-block content; keeping
 * this read-only avoids lossy Markdown round-trips for tables and unsupported block anatomy.
 */
function PageContentPanel({
  resource,
  recordId,
}: {
  resource: PageContentResource;
  recordId: string;
}) {
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await window.api.pageContent.get(resource, recordId);
    if (res.ok) {
      setMarkdown(res.data.markdown);
      setDirty(res.data.dirty);
      setSynced(res.data.synced);
    } else {
      setError(res.error.message);
    }
    setLoading(false);
  }, [resource, recordId]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusText = dirty
    ? "Unsynced — will push to Notion on the next sync."
    : synced
      ? "Up to date with Notion."
      : "Showing the local copy (offline or not yet synced).";

  return (
    <div className="page-content">
      <div className="page-content__status" data-dirty={dirty}>
        {loading ? "Loading page content…" : statusText}
      </div>

      <div className="page-content__body">
        {loading ? (
          <div className="page-content__loading">Loading…</div>
        ) : (
          <NotionPreview markdown={markdown} />
        )}
      </div>

      {error && <p className="page-content__error">{error}</p>}

    </div>
  );
}

export { PageContentPanel };
