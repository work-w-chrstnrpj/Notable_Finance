
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { type HexColor } from "@/lib/color-utils";

type PickerMode = "swatches" | "wheel";

const PRESET_SWATCHES: HexColor[] = [
  // Blues
  "#5b6cf9", "#3b82f6", "#2563eb", "#1d4ed8", "#1e40af",
  // Greens
  "#0d9488", "#10b981", "#059669", "#047857", "#065f46",
  // Purples
  "#7c3aed", "#8b5cf6", "#a78bfa", "#6d28d9", "#5b21b6",
  // Roses
  "#e11d48", "#f43f5e", "#fb7185", "#be123c", "#9f1239",
  // Ambers
  "#d97706", "#f59e0b", "#fbbf24", "#b45309", "#92400e",
  // Neutrals
  "#1c1917", "#44403c", "#79716b", "#a8a29e", "#d6d3d1",
];

const MODE_TABS: { key: PickerMode; label: string }[] = [
  { key: "swatches", label: "Swatches" },
  { key: "wheel", label: "Wheel" },
];

interface ColorPickerProps {
  value: HexColor;
  onChange: (hex: HexColor) => void;
  disabled?: boolean;
}

export function ColorPicker({ value, onChange, disabled }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PickerMode>("swatches");
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on outside click (scoped to backdrop element)
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (backdropRef.current && !backdropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="color-picker">
      {/* Collapsed trigger — always visible */}
      <button
        type="button"
        className={`color-picker__trigger ${open ? "color-picker__trigger--open" : ""} ${disabled ? "color-picker__trigger--disabled" : ""}`}
        onClick={() => { if (!disabled) setOpen((prev) => !prev); }}
        aria-label="Choose color"
        disabled={disabled}
      >
        <span className="color-picker__trigger-swatch" style={{ background: value }} />
        <span className="color-picker__trigger-hex">{value}</span>
      </button>

      {/* Expanded panel — portal modal with backdrop */}
      {open &&
        createPortal(
          <div
            ref={backdropRef}
            className="color-picker__backdrop"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="color-picker__panel">
              {/* Mode tabs */}
              <div className="color-picker__tabs">
                {MODE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`color-picker__tab ${mode === tab.key ? "color-picker__tab--active" : ""}`}
                    onClick={() => setMode(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Mode content */}
              <div className="color-picker__body">
                {mode === "swatches" && (
                  <div className="color-picker__swatches">
                    {PRESET_SWATCHES.map((swatch) => (
                      <button
                        key={swatch}
                        type="button"
                        className={`color-picker__swatch-btn ${value === swatch ? "color-picker__swatch-btn--active" : ""}`}
                        style={{ background: swatch }}
                        onClick={() => {
                          onChange(swatch);
                          setOpen(false);
                        }}
                        aria-label={swatch}
                      />
                    ))}
                  </div>
                )}

                {mode === "wheel" && (
                  <div className="color-picker__wheel">
                    <input
                      type="color"
                      className="color-picker__native"
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
