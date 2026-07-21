"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeState {
  mode: ThemeMode;
  primaryColor: string;
  secondaryColor: string;
  setMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

const STORAGE_KEY = "nf_theme";

interface StoredTheme {
  mode: ThemeMode;
  primaryColor: string;
  secondaryColor: string;
}

const DEFAULTS: StoredTheme = {
  mode: "system",
  primaryColor: "#5b6cf9",
  secondaryColor: "#0d9488",
};

function loadTheme(): StoredTheme {
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

function saveTheme(state: StoredTheme) {
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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = useState<StoredTheme>(DEFAULTS);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setStored(loadTheme());
    setMounted(true);
  }, []);

  // Apply data-theme attribute and CSS custom properties
  useEffect(() => {
    if (!mounted) return;
    const effective = resolveEffectiveMode(stored.mode);
    document.documentElement.setAttribute("data-theme", effective);
    document.documentElement.style.setProperty("--blue", stored.primaryColor);
    document.documentElement.style.setProperty("--green", stored.secondaryColor);
    document.documentElement.style.setProperty("--focus", `${stored.primaryColor}47`); // 28% opacity hex
  }, [stored, mounted]);

  // Listen for system color scheme changes
  useEffect(() => {
    if (stored.mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const effective = resolveEffectiveMode("system");
      document.documentElement.setAttribute("data-theme", effective);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [stored.mode]);

  const setMode = useCallback((mode: ThemeMode) => {
    setStored((prev) => {
      const next = { ...prev, mode };
      saveTheme(next);
      return next;
    });
  }, []);

  const setPrimaryColor = useCallback((color: string) => {
    setStored((prev) => {
      const next = { ...prev, primaryColor: color };
      saveTheme(next);
      return next;
    });
  }, []);

  const setSecondaryColor = useCallback((color: string) => {
    setStored((prev) => {
      const next = { ...prev, secondaryColor: color };
      saveTheme(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeState>(
    () => ({
      mode: stored.mode,
      primaryColor: stored.primaryColor,
      secondaryColor: stored.secondaryColor,
      setMode,
      setPrimaryColor,
      setSecondaryColor,
    }),
    [stored, setMode, setPrimaryColor, setSecondaryColor],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeState {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
