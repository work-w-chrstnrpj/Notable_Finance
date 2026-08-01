import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUiSettings } from "@/lib/ui-settings-context";
import { loadGoogleFont } from "@/lib/font-loader";
import { getPreset, type ThemePresetId } from "@/lib/presets";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeState {
  preset: ThemePresetId;
  mode: ThemeMode;
  primaryColor: string;
  secondaryColor: string;
  setMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  setPreset: (preset: ThemePresetId) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

const STORAGE_KEY = "nf_theme";

interface StoredTheme {
  mode: ThemeMode;
  primaryColor: string;
  secondaryColor: string;
  preset: ThemePresetId;
}

const DEFAULTS: StoredTheme = {
  preset: "default",
  mode: "system",
  primaryColor: "#5b6cf9",
  secondaryColor: "#0d9488",
};

function loadLocalTheme(): StoredTheme {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<StoredTheme>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

function saveLocalTheme(state: StoredTheme) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable */
  }
}

function resolveEffectiveMode(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Theme state: localStorage for instant paint, SQLite (UiSettings) as durable source of truth.
 * Must render under UiSettingsProvider.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, ready, updateSettings } = useUiSettings();
  const [stored, setStored] = useState<StoredTheme>(() => loadLocalTheme());
  const [mounted, setMounted] = useState(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prefer durable SQLite theme once settings load.
  useEffect(() => {
    if (!ready || hydratedRef.current) return;
    hydratedRef.current = true;
    const next = {
      mode: settings.theme.mode,
      primaryColor: settings.theme.primaryColor,
      secondaryColor: settings.theme.secondaryColor,
      preset: settings.theme.preset,
    };
    setStored(next);
    saveLocalTheme(next);
  }, [ready, settings.theme.mode, settings.theme.primaryColor, settings.theme.secondaryColor]);

  useEffect(() => {
    if (!mounted) return;
    const effective = resolveEffectiveMode(stored.mode);
    document.documentElement.setAttribute("data-theme", effective);
    document.documentElement.setAttribute("data-preset", stored.preset);
    document.documentElement.style.setProperty("--blue", stored.primaryColor);
    document.documentElement.style.setProperty("--green", stored.secondaryColor);
    document.documentElement.style.setProperty("--focus", `${stored.primaryColor}47`);
    // Apply font settings from UiSettings
    const fonts = settings.fonts ?? { bodyFont: "", monoFont: "", brandFont: "", receiptFont: "" };
    const bodyFallback = "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    const monoFallback = "'DM Mono', 'SFMono-Regular', Consolas, ui-monospace, monospace";
    const brandFallback = "'Instrument Serif', serif";
    // Dynamically load Google Fonts for any non-local, non-system font
    loadGoogleFont(fonts.bodyFont);
    loadGoogleFont(fonts.monoFont);
    loadGoogleFont(fonts.brandFont);
    loadGoogleFont(fonts.receiptFont);
    document.documentElement.style.setProperty("--font-body", fonts.bodyFont ? `${fonts.bodyFont}, ${bodyFallback}` : bodyFallback);
    document.documentElement.style.setProperty("--font-mono", fonts.monoFont ? `${fonts.monoFont}, ${monoFallback}` : monoFallback);
    document.documentElement.style.setProperty("--font-brand", fonts.brandFont ? `${fonts.brandFont}, ${brandFallback}` : brandFallback);
    document.documentElement.style.setProperty("--font-receipt", fonts.receiptFont ? `${fonts.receiptFont}, ${brandFallback}` : brandFallback);
    /* Apply design preset CSS variables */
    const presetObj = getPreset(stored.preset);
    const presetVars = effective === 'dark' ? presetObj.dark ?? presetObj.light : presetObj.light;
    for (const [key, val] of Object.entries(presetVars)) {
      document.documentElement.style.setProperty(key, val);
    }
  }, [stored, mounted, settings.fonts]);

  useEffect(() => {
    if (stored.mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const effective = resolveEffectiveMode("system");
      document.documentElement.setAttribute("data-theme", effective);
      document.documentElement.setAttribute("data-preset", stored.preset);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [stored.mode]);

  const persist = useCallback(
    (next: StoredTheme) => {
      setStored(next);
      saveLocalTheme(next);
      void updateSettings({ theme: next });
    },
    [updateSettings],
  );

  const setPreset = useCallback(
    (presetId: ThemePresetId) => {
      const p = getPreset(presetId);
      persist({
        ...stored,
        preset: presetId,
        primaryColor: p.suggestedPrimary,
        secondaryColor: p.suggestedSecondary,
      });
      // For non-customizable presets, lock fonts to the preset suggested values
      if (!p.customizable) {
        void updateSettings({
          fonts: {
            bodyFont: p.suggestedBodyFont,
            monoFont: p.suggestedMonoFont,
            brandFont: p.suggestedBrandFont,
            receiptFont: p.suggestedBrandFont,
          },
        });
      }
    },
    [persist, stored, updateSettings],
  );

  const setMode = useCallback(
    (mode: ThemeMode) => {
      persist({ ...stored, mode });
    },
    [persist, stored],
  );

  const setPrimaryColor = useCallback(
    (color: string) => {
      const p = getPreset(stored.preset);
      if (!p.customizable) return;
      persist({ ...stored, primaryColor: color });
    },
    [persist, stored],
  );

  const setSecondaryColor = useCallback(
    (color: string) => {
      const p = getPreset(stored.preset);
      if (!p.customizable) return;
      persist({ ...stored, secondaryColor: color });
    },
    [persist, stored],
  );

  const value = useMemo<ThemeState>(
    () => ({
      mode: stored.mode,
      primaryColor: stored.primaryColor,
      secondaryColor: stored.secondaryColor,
      preset: stored.preset,
      setMode,
      setPrimaryColor,
      setSecondaryColor,
      setPreset,
    }),
    [stored, setMode, setPrimaryColor, setSecondaryColor, setPreset],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
