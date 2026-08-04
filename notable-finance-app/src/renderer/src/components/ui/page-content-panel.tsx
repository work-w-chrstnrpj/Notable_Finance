import { useCallback, useEffect, useState } from "react";
import { Eraser, Eye, Pencil, RefreshCw, Save } from "lucide-react";
import type { PageContentResource } from "@shared/finance.types";
import { NotionPreview } from "./notion-preview";

/**
 * Page Content editor — the "flip side" of a record's form modal. Shows a Notion-like
 * preview by default, and lets the user switch to raw Markdown editing.
 * Saves are local-first: they mark the content dirty and the next sync pushes it to Notion
 * (History logs "Page content information is edited"). Clearing empties the body but never
 * deletes the page.
 */
function PageContentPanel({
  resource,
  recordId,
}: {
  resource: PageContentResource;
  recordId: string;
}) {
  const [markdown, setMarkdown] = useState("");
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  async function onSave() {
    setSaving(true);
    setError(null);
    const res = await window.api.pageContent.save(resource, recordId, markdown);
    if (res.ok) {
      setMarkdown(res.data.markdown);
      setDirty(res.data.dirty);
      setSynced(false);
      setShowMarkdown(false);
    } else {
      setError(res.error.message);
    }
    setSaving(false);
  }

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
        ) : showMarkdown ? (
          <textarea
            className="page-content__editor"
            value={markdown}
            readOnly={saving}
            placeholder={
              markdown.length === 0
                ? "Write notes in Markdown — # heading, - bullet, - [ ] to-do, **bold**, *italic*…"
                : ""
            }
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
          />
        ) : (
          <NotionPreview markdown={markdown} />
        )}
      </div>

      {error && <p className="page-content__error">{error}</p>}

      <div className="page-content__actions">
        {showMarkdown ? (
          <>
            <button
              type="button"
              className="button"
              onClick={() => setMarkdown("")}
              disabled={saving || markdown.length === 0}
              title="Clear the page content (the page itself is kept)"
            >
              <Eraser size={16} />
              Clear
            </button>
            <button
              type="button"
              className="button"
              onClick={() => setShowMarkdown(false)}
              disabled={saving}
            >
              <Eye size={16} />
              Preview
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => void onSave()}
              disabled={saving}
            >
              {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="button"
            onClick={() => setShowMarkdown(true)}
            disabled={loading}
          >
            <Pencil size={16} />
            Edit Markdown
          </button>
        )}
      </div>
    </div>
  );
}

export { PageContentPanel };
