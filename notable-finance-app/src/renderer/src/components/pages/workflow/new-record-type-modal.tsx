import { X } from "lucide-react";
import { useShortcutAction } from "@/lib/shortcuts/context";

/** Initial "what kind of record?" chooser. The pick pre-configures the form that follows. */
export function NewRecordTypeModal({
  title,
  options,
  onCancel,
}: {
  title: string;
  options: Array<{ label: string; description: string; onSelect: () => void }>;
  onCancel: () => void;
}) {
  useShortcutAction("modal.close", onCancel);
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section className="modal-panel modal-panel--confirm" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-panel__header">
          <div>
            <h2>{title}</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Close" onClick={onCancel}>
            <X size={17} />
          </button>
        </div>
        <div className="modal-panel__body">
          <div className="form-grid form-grid--single">
            {options.map((option) => (
              <button key={option.label} type="button" className="button" onClick={option.onSelect} style={{ justifyContent: "center", textAlign: "center", flexDirection: "column", alignItems: "center", height: "auto", padding: "0.75rem 1rem" }}>
                <strong>{option.label}</strong>
                <span style={{ opacity: 0.7, fontWeight: 400 }}>{option.description}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
