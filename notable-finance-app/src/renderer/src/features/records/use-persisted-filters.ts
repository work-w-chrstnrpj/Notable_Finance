import { useEffect, useRef, useState } from "react";
import { useDebouncedPersist } from "@/lib/use-debounced-persist";

/**
 * The hydrate-once-then-debounced-persist choreography that Accounts, Monitoring, Income
 * and Expense each carried a hand-rolled copy of (refactor_development_plan.md F2):
 * a local `filtersHydrated` flag, an effect that seeds local state from persisted
 * UiSettings exactly once, and a `useDebouncedPersist` that writes changes back.
 *
 * Deliberately does NOT own the filter values themselves. Each page keeps its own
 * `useState` per filter (they're read and set from many places in the JSX), so this stays a
 * pure lift of the wiring — no change to how any individual filter is stored or updated.
 *
 * `hydrate` is held in a ref so its changing identity never re-triggers hydration; the
 * effect keys off `[ready, hydrated, source]` exactly as the original inline effects did.
 */
export function usePersistedFilters<TSource>({
  ready,
  source,
  hydrate,
  values,
  persist,
}: {
  /** UiSettings has finished loading (its `ready` flag). */
  ready: boolean;
  /** The persisted slice to seed from, e.g. `settings.incomeFilters`. */
  source: TSource;
  /** Seed local state from `source`. Runs exactly once, when `ready` first becomes true. */
  hydrate: (source: TSource) => void;
  /** Current filter values — changes here trigger a debounced `persist`. */
  values: unknown[];
  /** Write the current values back to UiSettings. */
  persist: () => void;
}): boolean {
  const [hydrated, setHydrated] = useState(false);
  const hydrateRef = useRef(hydrate);
  hydrateRef.current = hydrate;

  useEffect(() => {
    if (!ready || hydrated) return;
    hydrateRef.current(source);
    setHydrated(true);
  }, [ready, hydrated, source]);

  useDebouncedPersist(hydrated, values, persist);

  return hydrated;
}
