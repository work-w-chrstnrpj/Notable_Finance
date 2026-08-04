import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronLeft, Copy, Info, Pencil, RefreshCw, Save, Trash2, X } from "lucide-react";
import { cx } from "@/lib/finance-helpers";
import { PageContentPanel } from "./page-content-panel";
import type { ModalState } from "./form-modals";
import type { PageContentResource } from "@shared/finance.types";

/**
 * FlippableModal wraps a form modal with a 3D card flip animation.
 * Front face: the form. Back face: the Notion page content editor.
 * Pressing the [i] button on the front flips to the back.
 * Pressing the back arrow on the back flips to the front.
 */
function FlippableModal({
  modal,
  subtitle,
  deleteLabel,
  deleteDanger,
  editing,
  saving,
  // Accepted for prop-shape parity with FormModal; this variant doesn't render an inline
  // error (callers surface save errors via Toast instead).
  error: _error,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  onClose,
  children,
  pageContentResource,
  recordId,
}: {
  modal: ModalState;
  subtitle: string;
  deleteLabel: string;
  deleteDanger?: boolean;
  editing: boolean;
  saving: boolean;
  error?: string | null;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  onClose: () => void;
  children: ReactNode;
  pageContentResource?: PageContentResource;
  recordId?: string | null;
}) {
  const [flipped, setFlipped] = useState(false);
  const hasPageContent = Boolean(pageContentResource && recordId);

  if (!modal) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="modal-panel--flip-container">
        <div className="modal-panel modal-panel--flipper" data-flipped={flipped}>
          {/* ── Front face: form ─────────────────────────────────────── */}
          <div className="modal-panel__face modal-panel__face--front">
            <div className="modal-panel__header">
              <div>
                <h2 id="form-modal-title">{modal.title}</h2>
                <p>{editing ? subtitle : "Read-only — click Edit to change and save to Notion."}</p>
              </div>
              <div className="modal-header-actions">
                {hasPageContent && (
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Page content"
                    onClick={() => setFlipped((v) => !v)}
                  >
                    <Info size={17} />
                  </button>
                )}
                <button type="button" className="icon-button" aria-label="Close modal" onClick={onClose}>
                  <X size={17} />
                </button>
              </div>
            </div>
            <div className="modal-panel__body">
              <fieldset className="modal-fieldset" disabled={!editing || saving}>
                {children}
              </fieldset>
            </div>
            <div className="modal-panel__footer">
              {modal.mode === "edit" && (
                <button
                  type="button"
                  className={cx("button", deleteDanger && "button--danger")}
                  onClick={onDelete}
                  disabled={saving}
                >
                  <Trash2 size={16} />
                  {deleteLabel}
                </button>
              )}
              {modal.mode === "edit" && onDuplicate && (
                <button type="button" className="button" onClick={onDuplicate} disabled={saving}>
                  <Copy size={16} />
                  Duplicate
                </button>
              )}
              {!editing && modal.mode === "edit" ? (
                <button type="button" className="button button--primary" onClick={onEdit}>
                  <Pencil size={16} />
                  Edit
                </button>
              ) : (
                <button type="button" className="button button--primary" onClick={onSave} disabled={saving}>
                  {saving ? (
                    <RefreshCw size={16} className="spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {saving ? "Saving…" : "Save"}
                </button>
              )}
            </div>
          </div>

          {/* ── Back face: page content ──────────────────────────────── */}
          <div className="modal-panel__face modal-panel__face--back">
            <div className="modal-panel__header">
              <div>
                <h2 id="page-content-title">Page Content</h2>
                <p>Edit the Notion page body as Markdown</p>
              </div>
              <button
                type="button"
                className="icon-button"
                aria-label="Back to form"
                onClick={() => setFlipped(false)}
              >
                <ChevronLeft size={17} />
              </button>
            </div>
            <div className="modal-panel__body">
              {pageContentResource && recordId && (
                <PageContentPanel resource={pageContentResource} recordId={recordId} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { FlippableModal };