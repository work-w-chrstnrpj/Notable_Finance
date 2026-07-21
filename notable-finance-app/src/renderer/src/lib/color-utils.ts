/**
 * Color conversion utilities for the theme color picker.
 * All conversions work with standard sRGB color space.
 */

/** Hex color string (e.g. "#5b6cf9") */
export type HexColor = string;

export interface RGBA {
  r: number; // 0–255
  g: number; // 0–255
  b: number; // 0–255
  a: number; // 0–1
}

export interface CMYK {
  c: number; // 0–100
  m: number; // 0–100
  y: number; // 0–100
  k: number; // 0–100
}

/** Parse "#rrggbb" or "#rrggbbaa" to RGBA. */
export function hexToRgba(hex: HexColor): RGBA {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const a = clean.length === 8 ? parseInt(clean.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

/** RGBA to "#rrggbb" (ignores alpha for theme colors). */
export function rgbaToHex({ r, g, b }: RGBA): HexColor {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** RGBA to CMYK. */
export function rgbaToCmyk({ r, g, b }: RGBA): CMYK {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;
  const k = 1 - Math.max(rr, gg, bb);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = ((1 - rr - k) / (1 - k)) * 100;
  const m = ((1 - gg - k) / (1 - k)) * 100;
  const y = ((1 - bb - k) / (1 - k)) * 100;
  return {
    c: Math.round(c),
    m: Math.round(m),
    y: Math.round(y),
    k: Math.round(k * 100),
  };
}

/** CMYK to RGBA. */
export function cmykToRgba(cmyk: CMYK): RGBA {
  const c = cmyk.c / 100;
  const m = cmyk.m / 100;
  const y = cmyk.y / 100;
  const k = cmyk.k / 100;
  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a: 1 };
}

/** Validate and normalize a hex string. Returns null if invalid. */
export function normalizeHex(input: string): HexColor | null {
  let clean = input.trim();
  if (!clean.startsWith("#")) clean = "#" + clean;
  if (/^#([0-9a-fA-F]{3})$/.test(clean)) {
    clean = "#" + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
  }
  if (/^#([0-9a-fA-F]{6})$/.test(clean)) return clean.toLowerCase();
  return null;
}
