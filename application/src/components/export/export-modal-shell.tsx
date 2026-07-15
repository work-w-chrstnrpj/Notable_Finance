"use client";

import type { ReactNode } from "react";
import { FileDown, ImageDown, X } from "lucide-react";

function ExportModalShell({
  title,
  subtitle,
  onClose,
  onPrint,
  onSaveImage,
  busy,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  onPrint: () => void;
  onSaveImage: () => void;
  busy?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal-panel modal-panel--export"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-panel__header fab-shot-hide">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button type="button" className="icon-button" aria-label="Close" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <div className="modal-panel__body export-preview">{children}</div>
        <div className="modal-panel__footer fab-shot-hide">
          <button type="button" className="button" onClick={onSaveImage} disabled={busy}>
            <ImageDown size={16} />
            Save as Image
          </button>
          <button type="button" className="button button--primary" onClick={onPrint} disabled={busy}>
            <FileDown size={16} />
            Print / Save as PDF
          </button>
        </div>
      </section>
    </div>
  );
}

export { ExportModalShell };
