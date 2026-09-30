import type { ReactNode } from "react";
import { useState, useEffect, useId, useRef } from "react";
import { Copy, Pencil, RefreshCw, Save, Trash2, X } from "lucide-react";
import { cx } from "@/lib/finance-helpers";
import { PageContentPanel } from "./page-content-panel";
import type { ModalState } from "./form-modals";
import type { PageContentResource } from "@shared/finance.types";

/** Shared record dialog. The historical export name preserves page integrations. */
function FlippableModal({
  modal,
  subtitle,
  deleteLabel,
  deleteDanger,
  editing,
  saving,
  error,
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
  const [showContent, setShowContent] = useState(false);
  const hasPageContent = Boolean(pageContentResource && recordId);

  const open = modal !== null;
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setShowContent(false);
  }, [modal?.mode, recordId, modal?.title]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => previous?.focus();
  }, [open]);
  if (!modal) return null;

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div
        className="modal-panel record-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panelRef}
        onKeyDown={event => {
          if (event.key !== "Tab") return;
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]',
          )).filter(el => !el.closest('[hidden]') && !el.closest('fieldset:disabled'));

          const first = controls[0];
          const last = controls[controls.length - 1];
          if (!first) {
            event.preventDefault();
            return;
          }
          if (event.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="modal-panel__header">
          <div>
            <h2 id={titleId}>{modal.title}</h2>
            <p>{editing ? subtitle : "Read-only. Choose Edit to make changes on this device."}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close modal" onClick={onClose} disabled={saving}>
            <X size={17} />
          </button>
        </div>
        {hasPageContent && (
          <div className="record-dialog__sections" role="group" aria-label="Record sections">
            <button type="button" className="button" aria-pressed={!showContent} onClick={() => setShowContent(false)}>
              Details
            </button>
            <button type="button" className="button" aria-pressed={showContent} onClick={() => setShowContent(true)}>
              Page content
            </button>
          </div>
        )}
        <div className="modal-panel__body">
          <div hidden={showContent && hasPageContent}>
            <fieldset className="modal-fieldset" disabled={!editing || saving}>{children}</fieldset>
          </div>
          {showContent && pageContentResource && recordId && (
            <PageContentPanel resource={pageContentResource} recordId={recordId} />
          )}
          {error && <p role="alert" className="page-content__error">{error}</p>}
        </div>
        <div className="modal-panel__footer" hidden={showContent && hasPageContent}>
          {modal.mode === "edit" && (
            <button type="button" className={cx("button", deleteDanger && "button--danger")} onClick={onDelete} disabled={saving}>
              <Trash2 size={16} />{deleteLabel}
            </button>
          )}
          {modal.mode === "edit" && onDuplicate && (
            <button type="button" className="button" onClick={onDuplicate} disabled={saving}>
              <Copy size={16} />Duplicate
            </button>
          )}
          {!editing && modal.mode === "edit" ? (
            <button type="button" className="button button--primary" onClick={onEdit}>
              <Pencil size={16} />Edit
            </button>
          ) : (
            <button type="button" className="button button--primary" onClick={onSave} disabled={saving}>
              {saving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
              {saving ? "Saving…" : "Save"}
            </button>
          )}
        </div>
        <p className="record-dialog__hint">Records save on this device first. Notion updates on sync.</p>
      </div>
    </div>
  );
}
export { FlippableModal };
