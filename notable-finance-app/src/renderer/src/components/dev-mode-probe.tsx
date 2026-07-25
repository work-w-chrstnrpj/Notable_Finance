import { useEffect } from "react";
import { useUiSettings } from "@/lib/ui-settings-context";
import { logDevEvent } from "@/lib/dev-log";
import { currentSection } from "@/lib/router";

/**
 * When Dev Mode is on, log a system event on mount so the Dev Logs buffer has
 * a visible probe-attached marker.  Click and navigation noise was removed —
 * only failures and meaningful operations are logged elsewhere.
 */
export function DevModeProbe() {
  const { devModeEnabled, ready } = useUiSettings();

  useEffect(() => {
    if (!ready || !devModeEnabled) return;

    logDevEvent({
      kind: "system",
      action: "devMode:on",
      message: "Dev Mode probe attached in renderer",
      detail: { section: currentSection() },
      ok: true,
    });
  }, [devModeEnabled, ready]);

  return null;
}
