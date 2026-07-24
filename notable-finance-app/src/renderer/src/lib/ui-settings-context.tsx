import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { UiSettings } from "../../../shared/finance.types";

const DEFAULT_SETTINGS: UiSettings = {
  hardDeleteEnabled: false,
  chatEnabled: false,
  chatPreferAppleReadOnly: false,
  chatDefaultModel: "gpt-4o-mini",
  devModeEnabled: false,
  profile: { displayName: "Local User", avatarDataUrl: null },
  theme: { mode: "system", primaryColor: "#5b6cf9", secondaryColor: "#0d9488" },
  workspace: {
    selectedDate: null,
    incomeViewMode: "Monthly",
    expenseViewMode: "Monthly",
    sidebarCollapsed: false,
    showFab: true,
    pushFabAutoHideMs: 180_000,
    lastSection: "dashboard",
  },
  incomeFilters: {
    accountId: "",
    categoryId: "",
    filterActive: false,
    annualView: "table",
    groupBy: "month",
  },
  expenseFilters: {
    accountFilterId: "",
    expenseCategoryFilter: "",
    pasabuyerFilter: "",
    filterActive: false,
    annualView: "table",
    groupBy: "month",
  },
  accountsFilters: {
    viewMode: "cards",
    accountScope: "standard",
    hideZeroBalance: false,
    cardTypeFilter: "",
  },
  monitoringFilters: {
    incomeCategoryView: "table",
    expenseCategoryView: "simplified",
    hideZeroIncomeCategories: false,
    zeroFilter: "all",
  },
};

type UiSettingsPatch = {
  hardDeleteEnabled?: boolean;
  chatEnabled?: boolean;
  chatPreferAppleReadOnly?: boolean;
  chatDefaultModel?: string;
  devModeEnabled?: boolean;
  profile?: Partial<UiSettings["profile"]>;
  theme?: Partial<UiSettings["theme"]>;
  workspace?: Partial<UiSettings["workspace"]>;
  incomeFilters?: Partial<UiSettings["incomeFilters"]>;
  expenseFilters?: Partial<UiSettings["expenseFilters"]>;
  accountsFilters?: Partial<UiSettings["accountsFilters"]>;
  monitoringFilters?: Partial<UiSettings["monitoringFilters"]>;
};

type UiSettingsContextValue = {
  settings: UiSettings;
  ready: boolean;
  hardDeleteEnabled: boolean;
  chatEnabled: boolean;
  devModeEnabled: boolean;
  setHardDeleteEnabled: (next: boolean) => Promise<void>;
  setChatEnabled: (next: boolean) => Promise<void>;
  setDevModeEnabled: (next: boolean) => Promise<void>;
  updateSettings: (patch: UiSettingsPatch) => Promise<UiSettings | null>;
};

const UiSettingsContext = createContext<UiSettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  ready: false,
  hardDeleteEnabled: false,
  chatEnabled: false,
  devModeEnabled: false,
  setHardDeleteEnabled: async () => undefined,
  setChatEnabled: async () => undefined,
  setDevModeEnabled: async () => undefined,
  updateSettings: async () => null,
});

export function UiSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UiSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    let cancelled = false;
    const api = window.api;
    if (!api?.settings) {
      setReady(true);
      return;
    }
    void api.settings
      .get()
      .then((res) => {
        if (cancelled || !res.ok) return;
        setSettings(res.data);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateSettings = useCallback(async (patch: UiSettingsPatch) => {
    setSettings((prev) => ({
      ...prev,
      hardDeleteEnabled:
        patch.hardDeleteEnabled === undefined
          ? prev.hardDeleteEnabled
          : patch.hardDeleteEnabled === true,
      chatEnabled:
        patch.chatEnabled === undefined ? prev.chatEnabled : patch.chatEnabled === true,
      chatPreferAppleReadOnly:
        patch.chatPreferAppleReadOnly === undefined
          ? prev.chatPreferAppleReadOnly
          : patch.chatPreferAppleReadOnly === true,
      chatDefaultModel:
        patch.chatDefaultModel === undefined
          ? prev.chatDefaultModel
          : patch.chatDefaultModel.trim() || prev.chatDefaultModel,
      devModeEnabled:
        patch.devModeEnabled === undefined ? prev.devModeEnabled : patch.devModeEnabled === true,
      profile: patch.profile ? { ...prev.profile, ...patch.profile } : prev.profile,
      theme: patch.theme ? { ...prev.theme, ...patch.theme } : prev.theme,
      workspace: patch.workspace ? { ...prev.workspace, ...patch.workspace } : prev.workspace,
      incomeFilters: patch.incomeFilters
        ? { ...prev.incomeFilters, ...patch.incomeFilters }
        : prev.incomeFilters,
      expenseFilters: patch.expenseFilters
        ? { ...prev.expenseFilters, ...patch.expenseFilters }
        : prev.expenseFilters,
      accountsFilters: patch.accountsFilters
        ? { ...prev.accountsFilters, ...patch.accountsFilters }
        : prev.accountsFilters,
      monitoringFilters: patch.monitoringFilters
        ? { ...prev.monitoringFilters, ...patch.monitoringFilters }
        : prev.monitoringFilters,
    }));

    const api = window.api;
    if (!api?.settings) return null;
    const res = await api.settings.update(patch as Partial<UiSettings>);
    if (res.ok) {
      setSettings(res.data);
      return res.data;
    }
    return null;
  }, []);

  const setHardDeleteEnabled = useCallback(
    async (next: boolean) => {
      await updateSettings({ hardDeleteEnabled: next });
    },
    [updateSettings],
  );

  const setChatEnabled = useCallback(
    async (next: boolean) => {
      await updateSettings({ chatEnabled: next });
    },
    [updateSettings],
  );

  const setDevModeEnabled = useCallback(
    async (next: boolean) => {
      await updateSettings({ devModeEnabled: next });
    },
    [updateSettings],
  );

  const value = useMemo<UiSettingsContextValue>(
    () => ({
      settings,
      ready,
      hardDeleteEnabled: settings.hardDeleteEnabled,
      chatEnabled: settings.chatEnabled,
      devModeEnabled: settings.devModeEnabled,
      setHardDeleteEnabled,
      setChatEnabled,
      setDevModeEnabled,
      updateSettings,
    }),
    [settings, ready, setHardDeleteEnabled, setChatEnabled, setDevModeEnabled, updateSettings],
  );

  return <UiSettingsContext.Provider value={value}>{children}</UiSettingsContext.Provider>;
}

export function useUiSettings(): UiSettingsContextValue {
  return useContext(UiSettingsContext);
}

export function deleteActionLabel(hardDeleteEnabled: boolean): string {
  return hardDeleteEnabled ? "Hard Delete" : "Soft Delete";
}

export function deleteConfirmCopy(
  hardDeleteEnabled: boolean,
  count = 1,
): { title: string; message: string; confirmLabel: string } {
  const plural = count > 1;
  if (hardDeleteEnabled) {
    return {
      title: plural ? `Delete ${count} items?` : "Delete this item?",
      message: plural
        ? "Are you sure you want to delete these items? They will be moved to trash in Notion."
        : "Are you sure you want to delete this? It will be moved to trash in Notion.",
      confirmLabel: "Confirm",
    };
  }
  return {
    title: plural ? `Soft-delete ${count} items?` : "Soft-delete this item?",
    message: plural
      ? "Are you sure you want to soft-delete these items? Amounts will be cleared and titles will be marked as deleted in Notion."
      : "Are you sure you want to soft-delete this? The amount will be cleared and the title will be marked as deleted in Notion.",
    confirmLabel: "Confirm",
  };
}
