
import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function Toast({
  message,
  onDismiss,
  duration,
}: {
  message: string;
  onDismiss: () => void;
  duration?: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(enterTimer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // Wait for exit animation
    }, duration ?? 4000);
    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  return (
    <div className={`toast ${visible ? "toast--visible" : ""}`} role="alert">
      <AlertTriangle size={16} className="toast__icon" />
      <span className="toast__message">{message}</span>
      <button
        type="button"
        className="toast__close"
        onClick={() => {
          setVisible(false);
          setTimeout(onDismiss, 300);
        }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
