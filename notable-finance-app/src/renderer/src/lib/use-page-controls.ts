// Which of a page's header controls the owner hid (page-controls/01). Saved per page in the UI settings.
import { useCallback } from "react";
import { useUiSettings } from "@/lib/ui-settings-context";

export function usePageControls(pageId: string) {
  const { settings, updateSettings } = useUiSettings();
  const state = settings.pageControls[pageId];
  const periodHidden = state?.periodHidden === true;
  const viewsHidden = state?.viewsHidden === true;

  const togglePeriod = useCallback(() => {
    void updateSettings({ pageControls: { [pageId]: { periodHidden: !periodHidden } } });
  }, [pageId, periodHidden, updateSettings]);

  const toggleViews = useCallback(() => {
    void updateSettings({ pageControls: { [pageId]: { viewsHidden: !viewsHidden } } });
  }, [pageId, viewsHidden, updateSettings]);

  return { periodHidden, viewsHidden, togglePeriod, toggleViews };
}
