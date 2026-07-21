"use client";

import type { ReactNode } from "react";
import { Copy, Pencil, RefreshCw, Save, Trash2, X } from "lucide-react";

export type ModalState = {
  mode: "new" | "edit";
  title: string;
} | null;

function FormModal({
  modal,
  subtitle,
  deleteLabel,
  editing,
  saving,
  error,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  onClose,
  children,
}: {
  modal: ModalState;
  subtitle: string;
  deleteLabel: string;
  /** True when inputs are active. New items start editing; edits start read-only. */
  editing: boolean;
  saving: boolean;
  error?: string | null;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  /** Turn the current record into a prefilled new-record draft. */
  onDuplicate?: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!modal) {
    return null;
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="form-modal-title"
        aria-modal="true"
        className="modal-panel"
        role="dialog"
      >
        <div className="modal-panel__header">
          <div>
            <h2 id="form-modal-title">{modal.title}</h2>
            <p>{editing ? subtitle : "Read-only — click Edit to change and save to Notion."}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close modal" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <div className="modal-panel__body">
          <fieldset className="modal-fieldset" disabled={!editing || saving}>
            {children}
          </fieldset>
        </div>
        <div className="modal-panel__footer">
          {modal.mode === "edit" && (
            <button type="button" className="button" onClick={onDelete} disabled={saving}>
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
      </section>
    </div>
  );
}

function SettingsModal({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="modal-panel" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-panel__header">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <div className="modal-panel__body">{children}</div>
        <div className="modal-panel__footer">{footer}</div>
      </section>
    </div>
  );
}

export { FormModal, SettingsModal };
