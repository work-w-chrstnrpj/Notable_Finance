import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import {
  activeSection,
  createInitialTabsState,
  tabsReducer,
  type AppTab,
  type AppTabsAction,
} from "@/lib/app-tabs";
import {
  currentSection,
  parseSection,
  setNavigateListener,
  syncHashToSection,
} from "@/lib/router";
import { useUiSettings } from "@/lib/ui-settings-context";
import type { FinanceSectionId } from "@/types/finance";

interface AppTabsContextValue {
  tabs: AppTab[];
  activeId: string;
  activeSection: FinanceSectionId;
  dispatch: (action: AppTabsAction) => void;
  openTab: (section?: FinanceSectionId) => void;
  closeTab: (id: string) => void;
  activateTab: (id: string) => void;
}

const AppTabsContext = createContext<AppTabsContextValue | null>(null);

/**
 * In-window application tabs. Each tab has its own section route; all tabs share
 * the same main-process SQLite store and React Query cache, so edits in one tab
 * stay live everywhere (same as multi-window).
 */
export function AppTabsProvider({ children }: { children: ReactNode }) {
  const { settings, ready: settingsReady, updateSettings } = useUiSettings();
  const restoredRef = useRef(false);
  const [state, dispatch] = useReducer(
    tabsReducer,
    undefined,
    () => createInitialTabsState(currentSection()),
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  const section = activeSection(state);

  // Restore last section from SQLite when there is no meaningful hash yet.
  useEffect(() => {
    if (!settingsReady || restoredRef.current) return;
    restoredRef.current = true;
    const last = parseSection(settings.workspace.lastSection);
    const current = currentSection();
    const hashEmpty = !window.location.hash || window.location.hash === "#/" || window.location.hash === "#";
    if (hashEmpty && last !== current) {
      dispatch({ type: "navigate", section: last });
    }
  }, [settingsReady, settings.workspace.lastSection]);

  // Keep the URL hash aligned with the active tab (deep-link + Link hrefs).
  useEffect(() => {
    syncHashToSection(section);
  }, [section, state.activeId]);

  // Persist last section for next launch.
  useEffect(() => {
    if (!settingsReady || !restoredRef.current) return;
    void updateSettings({ workspace: { lastSection: section } });
  }, [section, settingsReady, updateSettings]);

  // Sidebar Link / navigate() updates the *active* tab's section.
  useEffect(() => {
    setNavigateListener((next) => {
      dispatch({ type: "navigate", section: next });
    });
    return () => setNavigateListener(null);
  }, []);

  // Browser back/forward or raw hash edits.
  useEffect(() => {
    const onHash = () => {
      const next = currentSection();
      const current = activeSection(stateRef.current);
      if (next !== current) dispatch({ type: "navigate", section: next });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // File menu accelerators (New Tab / Close Tab / Next / Prev).
  useEffect(() => {
    const api = window.api;
    if (!api?.on) return;
    const off = api.on("tabs:command", (payload) => {
      const action = (payload as { action?: string } | undefined)?.action;
      if (action === "new") dispatch({ type: "open", section: "dashboard" });
      else if (action === "close") {
        const s = stateRef.current;
        if (s.tabs.length <= 1) {
          window.close();
          return;
        }
        dispatch({ type: "close-active" });
      } else if (action === "next") dispatch({ type: "next" });
      else if (action === "prev") dispatch({ type: "prev" });
    });
    return off;
  }, []);

  const openTab = useCallback((next?: FinanceSectionId) => {
    dispatch({ type: "open", section: next ?? "dashboard" });
  }, []);

  const closeTab = useCallback((id: string) => {
    const s = stateRef.current;
    if (s.tabs.length <= 1) {
      window.close();
      return;
    }
    dispatch({ type: "close", id });
  }, []);

  const activateTab = useCallback((id: string) => {
    dispatch({ type: "activate", id });
  }, []);

  const value = useMemo<AppTabsContextValue>(
    () => ({
      tabs: state.tabs,
      activeId: state.activeId,
      activeSection: section,
      dispatch,
      openTab,
      closeTab,
      activateTab,
    }),
    [state.tabs, state.activeId, section, openTab, closeTab, activateTab],
  );

  return <AppTabsContext.Provider value={value}>{children}</AppTabsContext.Provider>;
}

export function useAppTabs(): AppTabsContextValue {
  const ctx = useContext(AppTabsContext);
  if (!ctx) throw new Error("useAppTabs requires AppTabsProvider");
  return ctx;
}

/** Section for the active tab (preferred over hash-only useSection). */
export function useActiveTabSection(): FinanceSectionId {
  return useAppTabs().activeSection;
}
