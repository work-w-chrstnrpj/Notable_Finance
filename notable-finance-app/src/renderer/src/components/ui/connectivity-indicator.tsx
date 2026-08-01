import { useState, useEffect } from "react";
import { useNetworkStatus } from "@/lib/use-network-status";
import { cx } from "@/lib/finance-helpers";
import { Wifi, WifiOff } from "lucide-react";

/**
 * A compact visual indicator showing the current network connectivity status.
 * Shows a green Online / red Offline badge in the TopBar.
 *
 * The online badge is the happy path, but showing it makes the status
 * explicit rather than ambiguous. When transitioning to offline, the badge
 * appears with a brief delay to avoid flashing on momentary disconnects.
 */
export function ConnectivityIndicator() {
  const online = useNetworkStatus();

  // Wait a beat before showing the offline indicator to avoid flashing
  // on brief network blips.
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    if (!online) {
      const timer = setTimeout(() => setShowOffline(true), 500);
      return () => clearTimeout(timer);
    }
    setShowOffline(false);
  }, [online]);

  if (!online && !showOffline) return null;

  if (online) {
    return (
      <span
        className={cx("connectivity-indicator", "connectivity-indicator--online")}
        title="Connected — Notion sync and cloud AI models are available."
      >
        <Wifi size={12} aria-hidden="true" />
        Online
      </span>
    );
  }

  return (
    <span
      className={cx("connectivity-indicator", "connectivity-indicator--offline")}
      title="No network connection — some features are unavailable (Notion sync, cloud AI models). Local data is still accessible."
    >
      <WifiOff size={12} aria-hidden="true" />
      Offline
    </span>
  );
}
