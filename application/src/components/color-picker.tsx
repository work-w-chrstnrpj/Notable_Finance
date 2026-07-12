"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  hexToRgba,
  rgbaToHex,
  rgbaToCmyk,
  cmykToRgba,
  normalizeHex,
  type HexColor,
} from "@/lib/color-utils";

type PickerMode = "swatches" | "hex" | "rgba" | "cmyk" | "wheel";

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
  { key: "hex", label: "Hex" },
  { key: "rgba", label: "RGBA" },
  { key: "cmyk", label: "CMYK" },
  { key: "wheel", label: "Wheel" },
];

interface ColorPickerProps {
  value: HexColor;
  onChange: (hex: HexColor) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<PickerMode>("swatches");
  const panelRef = useRef<HTMLDivElement>(null);
  const rgba = hexToRgba(value);
  const cmyk = rgbaToCmyk(rgba);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // ── Hex input ──
  const [hexInput, setHexInput] = useState(value);
  const commitHex = useCallback(() => {
    const normalized = normalizeHex(hexInput);
    if (normalized) onChange(normalized);
    else setHexInput(value);
  }, [hexInput, value, onChange]);

  // ── RGBA inputs ──
  const [r, setR] = useState(String(rgba.r));
  const [g, setG] = useState(String(rgba.g));
  const [b, setB] = useState(String(rgba.b));

  const commitRgba = useCallback(() => {
    const rv = Math.max(0, Math.min(255, parseInt(r) || 0));
    const gv = Math.max(0, Math.min(255, parseInt(g) || 0));
    const bv = Math.max(0, Math.min(255, parseInt(b) || 0));
    onChange(rgbaToHex({ r: rv, g: gv, b: bv, a: 1 }));
  }, [r, g, b, onChange]);

  // ── CMYK inputs ──
  const [c, setC] = useState(String(cmyk.c));
  const [m, setM] = useState(String(cmyk.m));
  const [y, setY] = useState(String(cmyk.y));
  const [k, setK] = useState(String(cmyk.k));

  const commitCmyk = useCallback(() => {
    const cv = Math.max(0, Math.min(100, parseInt(c) || 0));
    const mv = Math.max(0, Math.min(100, parseInt(m) || 0));
    const yv = Math.max(0, Math.min(100, parseInt(y) || 0));
    const kv = Math.max(0, Math.min(100, parseInt(k) || 0));
    onChange(rgbaToHex(cmykToRgba({ c: cv, m: mv, y: yv, k: kv })));
  }, [c, m, y, k, onChange]);

  return (
    <div className="color-picker" ref={panelRef}>
      {/* Collapsed trigger — always visible */}
      <button
        type="button"
        className={`color-picker__trigger ${open ? "color-picker__trigger--open" : ""}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Choose color"
      >
        <span className="color-picker__trigger-swatch" style={{ background: value }} />
        <span className="color-picker__trigger-hex">{value}</span>
      </button>

      {/* Expanded panel — only when open */}
      {open && (
        <div className="color-picker__panel">
          {/* Mode tabs */}
          <div className="color-picker__tabs">
            {MODE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`color-picker__tab ${mode === tab.key ? "color-picker__tab--active" : ""}`}
                onClick={() => {
                  setMode(tab.key);
                  if (tab.key === "hex") setHexInput(value);
                  if (tab.key === "rgba") {
                    setR(String(rgba.r));
                    setG(String(rgba.g));
                    setB(String(rgba.b));
                  }
                  if (tab.key === "cmyk") {
                    setC(String(cmyk.c));
                    setM(String(cmyk.m));
                    setY(String(cmyk.y));
                    setK(String(cmyk.k));
                  }
                }}
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

            {mode === "hex" && (
              <div className="color-picker__field-row">
                <label className="color-picker__field-label">Hex Code</label>
                <input
                  type="text"
                  className="color-picker__text-input"
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                  onBlur={commitHex}
                  onKeyDown={(e) => e.key === "Enter" && commitHex()}
                  placeholder="#5b6cf9"
                  maxLength={7}
                  autoFocus
                />
              </div>
            )}

            {mode === "rgba" && (
              <div className="color-picker__fields">
                {[
                  { label: "R", value: r, set: setR, max: 255 },
                  { label: "G", value: g, set: setG, max: 255 },
                  { label: "B", value: b, set: setB, max: 255 },
                ].map((field) => (
                  <div key={field.label} className="color-picker__field">
                    <label className="color-picker__field-label">{field.label}</label>
                    <input
                      type="number"
                      className="color-picker__number-input"
                      value={field.value}
                      min={0}
                      max={field.max}
                      onChange={(e) => field.set(e.target.value)}
                      onBlur={commitRgba}
                    />
                  </div>
                ))}
              </div>
            )}

            {mode === "cmyk" && (
              <div className="color-picker__fields">
                {[
                  { label: "C", value: c, set: setC },
                  { label: "M", value: m, set: setM },
                  { label: "Y", value: y, set: setY },
                  { label: "K", value: k, set: setK },
                ].map((field) => (
                  <div key={field.label} className="color-picker__field">
                    <label className="color-picker__field-label">{field.label}</label>
                    <input
                      type="number"
                      className="color-picker__number-input"
                      value={field.value}
                      min={0}
                      max={100}
                      onChange={(e) => field.set(e.target.value)}
                      onBlur={commitCmyk}
                    />
                  </div>
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
      )}
    </div>
  );
}
