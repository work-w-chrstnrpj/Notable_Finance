# ADR-001 — Adopt TanStack React Query as the frontend data layer

**Status:** Accepted (2026-07-12) · **Deciders:** System Architect, project owner
**Relates to:** P3 of `performance-optimization-plan.xlsx`; supersedes the hand-rolled `useApiData` cache
**Gate:** P3-1 go/no-go

---

## Context

P0–P2 already delivered the core UX relief the critique demanded: optimistic CRUD with no blocking
spinners (P0), reference data fetched once per session (P1), and a per-collection TTL backend cache (P2).
So the "Phase 0 relief is insufficient" trigger does **not** strictly hold. The project owner has
nonetheless directed adoption of the durable caching layer ("the team wants the durable layer" trigger),
for the structural benefits P0–P2 cannot fully provide:

- **Request deduplication** — today two components calling `useAccounts()` fire two requests.
- **Cross-section invalidation** — editing an expense still leaves Dashboard / Monthly Monitoring stale
  until remount (the one thing P0 could not cleanly solve; called out in the P0 note).
- **Automatic rollback** on failed optimistic mutations.
- **Background refetch / stale-while-revalidate** as a first-class, uniform behaviour.

## Decision

Adopt **`@tanstack/react-query` v5**. Migrate reads to `useQuery` and add mutation-driven invalidation.
Execute as a **strangler**, not a big-bang, to keep the 5,856-line `finance-workspace.tsx` low-risk until
P4 splits it.

### Strangler seam

`useApiData` currently returns `{ state: AsyncState<T>, refetch, applyLocal }` and is consumed in ~15
read sites and 6 mutation handlers across the monolith. The migration **reimplements the read hooks on
`useQuery` while preserving that exact return shape** via a tiny adapter (`toAsyncState`). Consequences:

- The monolith's read consumers and mutation handlers **do not change** in P3.
- The hand-rolled `useEffect`/`useState` cache engine inside `useApiData` is **replaced** by React Query —
  there is one caching mechanism, satisfying the P3-5 intent.
- The literal removal of the `useApiData` *name* (pure rename to `useQuery` at call sites) is deferred to
  **P4-2**, when those call sites are being moved into per-page files anyway. Doing it now would touch the
  monolith twice.

### Query key scheme

| Hook | Query key |
|------|-----------|
| `useDashboardData(month)` | `["dashboard", month]` |
| `useAccounts(includeInactive)` | `["accounts", { includeInactive }]` |
| `useAccount(id)` | `["account", id]` |
| `useIncomeCategories(normalOnly)` | `["incomeCategories", { normalOnly }]` |
| `useExpenseCategories()` | `["expenseCategories"]` |
| `useIncomes(params)` | `["incomes", params]` |
| `useExpenses(params)` | `["expenses", params]` |
| `useWorkflowRecords(section, params)` | `["workflow", section, params]` |
| `useTransfers/CreditCardPayments/Alkansya/Receivables(params)` | `["workflow", <section>, params]` |
| `useSyncStatus()` | `["syncStatus"]` |
| `useSchemaStatus()` | `["schemaStatus"]` |
| `useMonthlyMonitoring(month)` | `["monthlyMonitoring", month]` |
| `useExpenseScheduler()` | `["expenseScheduler"]` |

Params objects are serialized structurally by React Query, so distinct filter/month combinations get
distinct cache entries automatically (this replaces the manual `key` string).

### Invalidation map (on mutation success)

| Mutation | Invalidate query keys |
|----------|-----------------------|
| Income (incl. income-backed workflows: transfer, CC payment, alkansya, receivables) | `["incomes"]`, `["workflow"]`, `["dashboard"]`, `["monthlyMonitoring"]` |
| Expense (incl. scheduler) | `["expenses"]`, `["expenseScheduler"]`, `["dashboard"]`, `["monthlyMonitoring"]` |
| Account / category (not yet mutated in-app) | `["accounts"]` / `["incomeCategories"]`/`["expenseCategories"]` + `["dashboard"]`, `["monthlyMonitoring"]` |

Invalidation is by key **prefix**, so every filtered/month variant of a family is covered. React Query
refetches only *active* (mounted) queries immediately and marks inactive ones stale for their next mount —
which is exactly the fix for cross-section staleness at minimal cost.

### Client defaults

```
staleTime: 30_000            // matches the backend per-collection TTL (P2)
gcTime:    5 * 60_000
refetchOnWindowFocus: false  // a finance ledger should not refetch on tab focus
retry: 1
```

Reference queries (`accounts`, `*Categories`) override `staleTime` to `5 * 60_000` — they change rarely
(established in P1).

### Auth gating

Every query sets `enabled: !authLoading` (and, for authenticated endpoints, `!!user`), mirroring the
current `useApiData` guard so requests never fire before the Bearer token is set.

## Migration order

1. **P3-2** Install `@tanstack/react-query`; mount `QueryClientProvider` in the root layout (inside
   `AuthProvider`) with the defaults above.
2. **P3-3** Reimplement the read hooks in `use-data.ts` on `useQuery` (+ `toAsyncState` adapter). Keep the
   `{ state, refetch, applyLocal }` shape. `applyLocal` → `queryClient.setQueryData`; `refetch` → the
   query's `refetch` (silent by nature — RQ keeps prior data during background refetch).
3. **P3-4** Add invalidation (per the map) to the 6 mutation handlers + the FAB quick-add, replacing the
   hand-rolled silent-refetch reconciliation. Keep optimistic `setQueryData` for instant feedback.
4. **P3-5** Remove the hand-rolled `useApiData` engine (now an RQ adapter). Full call-site rename deferred
   to P4-2 (documented above).
5. **P3-6** Regression: all CRUD, rollback on forced failure, dedup, cross-section freshness.

## Consequences

**Positive:** dedup, cross-section invalidation, rollback, uniform SWR; less bespoke cache code; a
standard, well-documented data layer for future contributors.
**Negative / cost:** one runtime dependency (~13 kB gz core); a devtools-less prod bundle bump; the team
must learn RQ key conventions (captured above).
**Neutral:** P1's `FinanceDataProvider` still provides the derived/memoized reference shape, but RQ's
global cache now also enforces "fetch once" independent of mount location.

## Alternatives considered

- **Keep hand-rolled `useApiData`, add dedup/invalidation manually.** Rejected: reinvents a mature library;
  cross-section invalidation and rollback are error-prone to hand-build.
- **SWR.** Viable and lighter, but React Query's mutation/optimistic/invalidation API is a better fit for
  this CRUD-heavy app.
- **Do nothing (stop after P2).** Legitimate — P0–P2 fixed the complaint. Overridden by the owner's
  decision to invest in the durable layer.
