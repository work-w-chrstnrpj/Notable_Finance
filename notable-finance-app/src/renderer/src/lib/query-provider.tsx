
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * App-wide React Query client. Defaults per ADR-001:
 * - staleTime 30s mirrors the backend per-collection TTL (P2), so within that
 *   window reads are served from the RQ cache with no network round-trip.
 * - refetchOnWindowFocus is off — a finance ledger should not refetch just
 *   because the tab regained focus.
 * Reference queries (accounts/categories) override staleTime to 5 min in their
 * own hooks, since that data changes rarely (P1).
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  // One client per browser session; useState keeps it stable across renders and
  // avoids sharing a client between requests during SSR.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
            // Offline-first: local SQLite via IPC works without a network
            // connection. Prevents TanStack Query from pausing queries when
            // navigator.onLine is false.
            networkMode: 'offlineFirst',
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
