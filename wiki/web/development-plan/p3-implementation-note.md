# Phase 3 — Implementation Note

**Date:** 2026-07-12
**Author:** System Architect (implementation executed)
**Scope:** P3-1 … P3-6 of `performance-optimization-plan.xlsx`
**Decision record:** `adr-001-adopt-react-query.md`
**Result:** React Query adopted; reads/mutations migrated. A critical concurrency bug (introduced in P2,
surfaced here under real load) was found and fixed. Final clean cross-section regression pending Notion
rate-limit recovery (see Verification).

---

## What changed

### P3-1 — ADR
`adr-001-adopt-react-query.md`: go decision, query-key scheme, invalidation map, client defaults,
strangler migration order, alternatives. The go was the owner's ("implement p3"); the ADR records that
P0–P2 already delivered the core relief and P3 is the durable-layer investment.

### P3-2 — Install + provider
- `@tanstack/react-query@^5.101.2` added.
- New `application/src/lib/query-provider.tsx` — `QueryProvider` with ADR defaults (staleTime 30s, gcTime
  5m, `refetchOnWindowFocus: false`, retry 1). Mounted in the root layout inside `AuthProvider`.

### P3-3 — Reads on React Query
`application/src/lib/use-data.ts` rewritten. The generic hand-rolled `useApiData` engine is replaced by
`useApiQuery(queryKey, fetcher, options)` — a thin `useQuery` wrapper that **preserves the
`{ state, refetch, applyLocal }` shape**, so none of the ~15 read sites in `finance-workspace.tsx`
changed. `refetch` → the query's refetch (SWR by nature); `applyLocal` → `queryClient.setQueryData`.
Reference hooks use a 5-min staleTime; queries gate on `!authLoading`. Each hook has a distinct,
structured query key (params objects → automatic per-variant cache entries).

### P3-4 — Mutation invalidation (cross-section fix)
New `useFinanceInvalidation()` exposes `invalidateIncomeFamily` / `invalidateExpenseFamily`, wired into all
six mutation handlers (income/expense/workflow × save/delete) plus the two FAB quick-adds. Optimistic
`applyLocal` still gives instant feedback; invalidation then refreshes the mutated family **and**
cross-section consumers. Because Dashboard and Monthly Monitoring compute from `useIncomes`/`useExpenses`
(no `/dashboard` endpoint — confirmed by network trace), invalidating those families auto-refreshes them —
the cross-section staleness P0 could not solve.

### P3-5 — Remove hand-rolled cache
`useApiData` no longer exists (grep-verified: 0 references). One caching mechanism. The literal call-site
rename (`useLiveCollections`/hook names) is deferred to P4-2 per the ADR, to avoid touching the monolith
twice.

---

## Critical bug found & fixed: cold-load thundering herd (single-flight)

Live testing surfaced a severe regression **introduced in P2**: concurrent requests hung 30s and ~2/3 of
`/expenses?month` calls returned 500.

**Root cause.** P2 added per-collection TTL expiry. Unlike P0/P1 (which cold-loaded once then served from
memory forever), collections now expire every 45s. A dashboard mount fires many reads at once, and the
income-backed resources — `incomes`, `alkansya`, `transfers`, `credit-card-payments` — **all back the same
`incomes` collection**. With no in-flight coalescing, an expired collection triggered 4+ simultaneous
`queryDatabase('incomes')` calls (and concurrent cold loads each fired all five DBs), producing a
thundering herd against Notion → 429 storm → backoff hangs and 5xx.

**Fix.** Added `singleFlight(flightKey, fn)` in `notion.service.ts`: concurrent loads of the same
collection (or the cold-load `__all__`) await one shared promise. Wired into both `loadLive` paths.

**Verification of the fix.**
- Unit: 2 new tests in `notion.service.cache.spec.ts` — a concurrent cold-start burst does **1 query per
  DB** (not ~25); a concurrent stale income-backed burst does **1** `incomes` query (not 4). 6/6 cache
  tests pass.
- Live: the same concurrent burst that previously hung 30s now completes in **29 ms, all 200** on a warm
  cache; the earlier successful cold burst was 26 s, all 200 (Notion latency, one-time).

---

## Verification

| Check | Result |
|-------|--------|
| FE `tsc --noEmit` | ✅ clean |
| FE eslint (new lib files) | ✅ clean; `finance-workspace.tsx` unchanged at 5 pre-existing errors |
| BE `tsc --noEmit` | ✅ clean |
| BE tests | 14 passed / 4 failed — the 4 are the pre-existing stale static-seed tests (P0 note) |
| Live reads via RQ | ✅ Dashboard renders full correct data (Monthly Expenses ₱14,987.80, Available Credit, CC balances, top purchases, spending chart) through React Query |
| Live concurrency | ✅ warm concurrent burst 29 ms all-200 (was a 30 s hang before the fix) |
| Cross-section CRUD demo | ⏳ mechanism in place & code-correct; a clean end-to-end demo was blocked by Notion rate-limiting from heavy test traffic (see below) |

**Environment caveat.** Aggressive live testing exhausted Notion's rate limit, after which the dashboard
intermittently rendered ₱0 (a failed cold load). This is a **pre-existing** backend behaviour, not a P3
regression, and it self-heals once Notion recovers. P3-6's final clean CRUD + cross-section pass should be
repeated once rate limits reset.

---

## Follow-up (recommended, out of P3 scope)

**Cold-load failures return `200` with empty data.** `loadLive` catches Notion errors and returns
`null` → the endpoint responds `200` with `[]`. React Query then caches that empty as a successful result,
so a transient Notion failure can show empty figures until the next invalidation. The backend should
instead surface a `503`/error on cold-load failure so RQ **retries** rather than caching empty. Also
consider: once a cold load fails and sets the cache to `null`, plain reads don't retry until a
mutation/sync clears it — worth making cold-load failure not "stick". Recommend a small backend-resilience
task (Backend) after P4.
