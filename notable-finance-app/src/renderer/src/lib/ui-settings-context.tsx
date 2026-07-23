import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type UiSettingsContextValue = {
  hardDeleteEnabled: boolean;
  ready: boolean;
  setHardDeleteEnabled: (next: boolean) => Promise<void>;
};

const UiSettingsContext = createContext<UiSettingsContextValue>({
  hardDeleteEnabled: false,
  ready: false,
  setHardDeleteEnabled: async () => undefined,
});

export function UiSettingsProvider({ children }: { children: ReactNode }) {
  const [hardDeleteEnabled, setHardDeleteEnabledState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const api = window.api
    if (!api?.settings) {
      setReady(true)
      return
    }
    void api.settings
      .get()
      .then((res) => {
        if (cancelled || !res.ok) return;
        setHardDeleteEnabledState(res.data.hardDeleteEnabled === true);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setHardDeleteEnabled = useCallback(async (next: boolean) => {
    setHardDeleteEnabledState(next);
    const api = window.api
    if (!api?.settings) return
    const res = await api.settings.update({ hardDeleteEnabled: next });
    if (res.ok) {
      setHardDeleteEnabledState(res.data.hardDeleteEnabled === true);
    }
  }, []);

  return (
    <UiSettingsContext.Provider value={{ hardDeleteEnabled, ready, setHardDeleteEnabled }}>
      {children}
    </UiSettingsContext.Provider>
  );
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
