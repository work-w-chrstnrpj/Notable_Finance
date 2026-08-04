import { useState, useEffect } from "react";

/**
 * Tracks online/offline status in the renderer by combining:
 * - `navigator.onLine` + `window` `online`/`offline` events
 * - Electron main process `net.isOnline()` via `sync:status` broadcasts
 *
 * Returns `true` when the device has network connectivity. Data from local
 * SQLite (IPC) works regardless — this is purely for features that need a
 * network round-trip (Notion sync, API-key chat models).
 */
export function useNetworkStatus(): boolean {
  // Start with navigator.onLine (false when WiFi is off)
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Also listen to Electron's net.isOnline() via sync:status broadcasts.
    // This is more reliable in Electron than navigator.onLine alone.
    const api = window.api;
    let off: (() => void) | undefined;
    if (api?.on) {
      off = api.on("sync:status", (payload: unknown) => {
        const status = payload as { online?: boolean };
        if (typeof status.online === "boolean") {
          setOnline(status.online);
        }
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      off?.();
    };
  }, []);

  return online;
}
