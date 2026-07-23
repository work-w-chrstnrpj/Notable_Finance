import type { FinanceSectionId } from "@/types/finance";

/** One in-window application tab — own section, shared SQLite via main process. */
export interface AppTab {
  id: string;
  section: FinanceSectionId;
}

export interface AppTabsState {
  tabs: AppTab[];
  activeId: string;
}

export type AppTabsAction =
  | { type: "navigate"; section: FinanceSectionId }
  | { type: "activate"; id: string }
  | { type: "open"; section?: FinanceSectionId }
  | { type: "close"; id: string }
  | { type: "close-active" }
  | { type: "next" }
  | { type: "prev" };

let tabSeq = 0;

export function createTabId(): string {
  tabSeq += 1;
  return `tab-${Date.now().toString(36)}-${tabSeq}`;
}

export function createInitialTabsState(section: FinanceSectionId): AppTabsState {
  const id = createTabId();
  return { tabs: [{ id, section }], activeId: id };
}

function activeIndex(state: AppTabsState): number {
  return Math.max(
    0,
    state.tabs.findIndex((t) => t.id === state.activeId),
  );
}

/** Pure tab-bar reducer — easy to unit test without React. */
export function tabsReducer(state: AppTabsState, action: AppTabsAction): AppTabsState {
  switch (action.type) {
    case "navigate": {
      return {
        ...state,
        tabs: state.tabs.map((t) =>
          t.id === state.activeId ? { ...t, section: action.section } : t,
        ),
      };
    }
    case "activate": {
      if (!state.tabs.some((t) => t.id === action.id)) return state;
      return { ...state, activeId: action.id };
    }
    case "open": {
      const id = createTabId();
      const section = action.section ?? "dashboard";
      return {
        tabs: [...state.tabs, { id, section }],
        activeId: id,
      };
    }
    case "close":
    case "close-active": {
      const id = action.type === "close" ? action.id : state.activeId;
      if (state.tabs.length <= 1) return state;
      const idx = state.tabs.findIndex((t) => t.id === id);
      if (idx < 0) return state;
      const tabs = state.tabs.filter((t) => t.id !== id);
      const activeId =
        state.activeId === id
          ? tabs[Math.max(0, idx - 1)]!.id
          : state.activeId;
      return { tabs, activeId };
    }
    case "next": {
      if (state.tabs.length < 2) return state;
      const i = activeIndex(state);
      return { ...state, activeId: state.tabs[(i + 1) % state.tabs.length]!.id };
    }
    case "prev": {
      if (state.tabs.length < 2) return state;
      const i = activeIndex(state);
      return {
        ...state,
        activeId: state.tabs[(i - 1 + state.tabs.length) % state.tabs.length]!.id,
      };
    }
    default:
      return state;
  }
}

export function activeSection(state: AppTabsState): FinanceSectionId {
  return state.tabs.find((t) => t.id === state.activeId)?.section ?? "dashboard";
}
