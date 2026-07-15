# Phase 1 — Implementation Note

**Date:** 2026-07-12
**Author:** System Architect (implementation executed)
**Scope:** P1-1 … P1-4 of `performance-optimization-plan.xlsx`
**Result:** Implemented and **verified in the live app**. Reference data is now fetched once per session.

---

## What changed

### New — `application/src/lib/finance-data-context.tsx`  (P1-1, P1-2)

`FinanceDataProvider` + `useFinanceData()`. Fetches the four reference queries once
(`accounts?includeInactive=true`, `income-categories`, `income-categories?normalOnly=true`,
`expense-categories`), derives the sorted lists + id→name maps (memoized), and shares them via
context. Exposes `refreshReferenceData()` (silent refetch) for post-sync updates and a
`referenceLoading` flag. The contract mirrors the old `useLiveCollections()` return shape exactly, so
call sites did not change.

The provider is **auth-gated**: an outer component reads `useAuth()` and only mounts the inner
fetching provider once the user is authenticated (conditional render, not conditional hooks). Before
auth it serves `EMPTY_REFERENCE`, so `/login` never fires these authenticated requests.

### New mount point — `application/src/app/layout.tsx`  (P1-2)

`<FinanceDataProvider>` is mounted in the **root layout**, inside `<AuthProvider>`.

### `application/src/components/finance-workspace.tsx`  (P1-3)

- `useLiveCollections()` is now a one-line alias: `return useFinanceData()`. All existing call sites
  (Dashboard, Income, Expense, Workflow, Monitoring) are unchanged.
- `AccountsPage` now reads `allAccounts` from `useFinanceData()` instead of its own `useAccounts(true)`.
- `runSync()` calls `refreshReferenceData()` after a successful pull so newly synced accounts/categories
  appear without blanking dropdowns.
- Removed the now-unused `useAccounts` / `useIncomeCategories` / `useExpenseCategories` imports.

---

## Key architectural finding (why the first attempt failed)

The first implementation mounted the provider in `app/[section]/layout.tsx`, on the assumption that a
layout at the dynamic `[section]` segment persists across section navigation. **Live network tracing
proved it does not** — a layout *at* a dynamic segment remounts when the param changes, so the provider
re-fetched on every navigation (identical to the pre-P1 behaviour).

Evidence: during client-side (`<Link>`) navigation, root-level `auth/me` did **not** re-fire (root
layout persists) while `user/preferences` (owned by the remounting page) **did**. Only a layout *above*
the dynamic segment — the **root layout** — persists across `[section]` param changes. Moving the
provider to the root layout fixed it. `app/[section]/layout.tsx` was removed.

---

## Verification (live app, authenticated session on :3000)

Measured with the browser network panel. High-water marks captured after a fresh load, then two
client-side navigations performed via the sidebar `<Link>`s.

| Navigation | accounts | income-categories (×2) | expense-categories | section transactional data |
|------------|:--------:|:----------------------:|:------------------:|----------------------------|
| Fresh load `/dashboard` | fetched | fetched | fetched | dashboard reads |
| → CC Payment (client-side) | **no re-fetch** | **no re-fetch** | **no re-fetch** | `credit-card-payments` only |
| → Expense (client-side) | **no re-fetch** | **no re-fetch** | **no re-fetch** | `expenses` only |

- **Before:** 4 reference calls on **every** section navigation.
- **After:** reference data fetched **once per session**; navigation issues only the section's own
  transactional query. Account/category names and filter dropdowns render correctly from the shared
  context. No console errors.

### Checks

| Check | Result |
|-------|--------|
| `application` `tsc --noEmit` | ✅ clean |
| eslint (new/changed files) | ✅ no errors/warnings (workspace retains the same 5 pre-existing `set-state-in-effect` errors, unrelated) |
| Live reference-once behaviour | ✅ verified (table above) |

Note: while diagnosing, a stale `.next/types` directory (from an old production build, `LayoutRoutes = "/"`)
conflicted with the dev types and produced spurious `validator.ts` errors after adding a layout. It's a
gitignored build artifact; removing it resolved the false positives. `next build` regenerates it.

---

## Follow-ups

- Reference data refreshes on Sync (`refreshReferenceData`). If in-app account/category editing is ever
  added, call `refreshReferenceData()` from those mutation paths too.
- The `referenceLoading` flag is available if any page wants a skeleton while reference data warms
  (ties into P5-2).
