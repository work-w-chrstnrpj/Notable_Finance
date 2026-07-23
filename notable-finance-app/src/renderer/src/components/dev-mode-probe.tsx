import { useEffect } from "react";
import { useUiSettings } from "@/lib/ui-settings-context";
import { describeClickTarget, logDevEvent } from "@/lib/dev-log";
import { currentSection } from "@/lib/router";

/**
 * When Dev Mode is on, capture UI clicks (capture phase) and section changes
 * into the in-memory Dev Logs buffer via IPC.
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

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      // Skip pure scrolling chrome / ignored markers
      if (target.closest("[data-dev-log-ignore]")) return;
      const interactive =
        target.closest(
          "button, a, input, select, textarea, label, [role='button'], [role='link'], [role='tab'], .nav a, .sidebar button",
        ) ?? target;
      const desc = describeClickTarget(interactive);
      logDevEvent({
        kind: "click",
        action: desc.action,
        message: desc.message,
        detail: { ...desc.detail, section: currentSection() },
        ok: true,
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [devModeEnabled, ready]);

  return null;
}
