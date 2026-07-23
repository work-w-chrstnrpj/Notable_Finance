import { useEffect, useRef } from "react";

/**
 * Debounced persist of a value once the settings store is ready.
 * Skips the first run after `enabled` becomes true (hydration), then saves on changes.
 */
export function useDebouncedPersist(
  enabled: boolean,
  deps: unknown[],
  save: () => void,
  delayMs = 300,
): void {
  const skipNext = useRef(true);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    if (!enabled) return;
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const timer = window.setTimeout(() => saveRef.current(), delayMs);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller passes explicit deps
  }, [enabled, delayMs, ...deps]);
}
