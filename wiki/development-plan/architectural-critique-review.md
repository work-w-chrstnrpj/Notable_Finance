# Architectural Critique Review

**Date:** July 2026
**Reviewer:** System Architect / Senior Full Stack Engineer
**Scope:** Read-only architectural review of the Notion Finance project
**Focus:** UX performance complaint — constant API calls, slow saves, UI blocking during sync

---

## Table of Contents

1. [What This Project Does Well](#what-this-project-does-well)
2. [What Needs Improvement](#what-needs-improvement)
3. [Critical: The API Call / Loading UX Problem](#critical-the-api-call--loading-ux-problem)
4. [State Management Analysis](#state-management-analysis)
5. [Caching Strategy Analysis](#caching-strategy-analysis)
6. [Coupling Analysis](#coupling-analysis)
7. [Minor Issues](#minor-issues)
8. [Actionable Recommendations](#actionable-recommendations)
9. [Summary Matrix](#summary-matrix)

---

## What This Project Does Well

### 1. Clean domain boundary between frontend and backend

The frontend never touches Notion directly. Every Notion interaction goes through `NotionService` on the backend. This is the correct architecture for a Notion-backed app and keeps secrets server-side.

### 2. Property mapping is well-structured

`notion-property-mapper.ts` has clean extraction helpers (`extractTitle`, `extractRelationFirst`, etc.) and separate DTO converters (`pageToIncomeRecord`, `incomeDtoToProperties`). The bidirectional mapping is easy to follow and extend.

### 3. Field classification is disciplined

The project clearly separates writable, read-only, computed, and hidden fields. Normal Income forms correctly exclude `Transacted Account` and `CC Payment Covered`. Expense forms adapt dynamically based on account type and category. This matches the product spec faithfully.

### 4. Soft-delete policy is creative

Rewriting `Name [Deleted: 1234.56]` and clearing the amount is a pragmatic approach for a Notion backend where you can't truly delete records. It's non-destructive and auditable.

### 5. View-mode filtering is correct

`filterExpenseBacked()` handles Unpaid Pasabuy, To pay, Installments, CC Transactions, and calendar views with proper logic. The server-side filtering keeps the frontend simple.

### 6. Client-side calculations are done right

Dashboard, Monthly Monitoring, and category reporting calculate from scoped Income/Expense records rather than relying on Notion formulas. This is correct per the product spec and enables selectable-month reporting.

### 7. Auth is solid

JWT-based auth with per-user Notion configuration, token storage in `localStorage`, and the `AuthProvider`/`useAuth` pattern is standard and correct.

---

## What Needs Improvement

| Severity | Area | Verdict |
|----------|------|---------|
| 🔴 Critical | Backend cache invalidation | Nuclear — deletes everything after every mutation |
| 🔴 Critical | Frontend caching | None — custom hook with no caching layer |
| 🔴 Critical | Optimistic updates | None — UI freezes on every save |
| 🟡 Medium | `loadLive()` granularity | All-or-nothing — fetches all 5 DBs |
| 🟡 Medium | `finance-workspace.tsx` size | 4000+ line monolith |
| 🟡 Medium | `NotionService` size | 957-line god class |
| 🟡 Medium | Reference data fetching | Re-fetched on every page mount |
| 🟡 Medium | Cross-section staleness | No invalidation strategy |
| 🟢 Minor | Hardcoded month list | Static in `finance-data.ts` |
| 🟢 Minor | No pagination/virtualization | All records render at once |
| 🟢 Minor | No debouncing on filter changes | Rapid toggles trigger rapid API calls |
| 🟢 Minor | No error boundaries | Component crash takes down entire app |
| 🟢 Minor | No loading skeletons | Only a text spinner |

---

## Critical: The API Call / Loading UX Problem

### The User Complaint

> Upon a user edit, save or delete an income or expense item, it requires constant API call, which is slow, and while loading and syncing you are unable to create or view any items even though you only change one log item.

### Exact Flow Trace: Saving One Income Record

```
User clicks Save
  → handleSaveIncome() calls incomesApi.update()
    → Backend PATCH /incomes/:id
      → NotionService.update()
        → loadLive() [cache exists → returns null, no re-fetch — good]
        → Validates and writes to Notion API [~1-2s]
        → refreshCache() [DELETES ENTIRE CACHE of all 5 databases]
      → Returns updated record
  → Frontend receives success
  → Calls refetch()
    → Sets state to "loading" [UI shows "Querying Notion…"]
    → GET /incomes
      → NotionService.list()
        → loadLive() [CACHE WAS DELETED → re-fetches ALL 5 Notion databases]
        → [~2-5 seconds of Notion API calls]
        → Returns filtered incomes
    → UI updates
```

### Root Cause: 3 Cascading Problems

#### Problem 1: Backend cache invalidation is nuclear

`refreshCache()` in `notion.service.ts` (line 161-164) deletes the **entire** `LiveCache` for the user — all 5 databases — after every single mutation:

```typescript
private refreshCache(userId?: string): void {
    const key = this.getLiveCacheKey(userId);
    this.liveCaches.delete(key);  // ← nuclear: everything gone
}
```

So editing one income record causes the next read to re-fetch Accounts, Income Categories, Incomes, Expense Categories, and Expenses — even though only Incomes changed.

#### Problem 2: The `loadLive()` method is all-or-nothing

Lines 96-130 of `notion.service.ts` show that when the cache is empty, it always fetches all 5 databases in `Promise.all`:

```typescript
const [accounts, incomeCategories, incomes, expenseCategories, expenses] =
    await Promise.all([
        client.queryDatabase('accounts'),
        client.queryDatabase('incomeCategories'),
        client.queryDatabase('incomes'),
        client.queryDatabase('expenseCategories'),
        client.queryDatabase('expenses'),
    ]);
```

There is no way to refresh just one resource's cache.

#### Problem 3: The frontend has zero optimistic updates

After a successful save, `handleSaveIncome()` (line 1617-1618) does:

```typescript
setModal(null);
await refetch();  // ← shows loading spinner for 2-5 seconds
```

The `refetch()` function in `use-data.ts` (line 100-101) immediately sets `setState({ status: "loading" })`, which renders `<LoadingBlock label="Querying Notion…" />`. The user sees the table disappear and a spinner appear **after** the save already succeeded.

### Net Result

A single edit/save/delete triggers potentially **2 full Notion API roundtrips** (one for the write, one for the cache rebuild), each hitting 5 databases, and the UI is frozen with a loading spinner during the second roundtrip. That's **3-7 seconds of blocked UX** for editing one row.

---

## State Management Analysis

### The `useApiData` Hook

The custom `useApiData` hook in `use-data.ts` is a `useEffect` + `useState` wrapper. It has:

- ❌ **No caching** — every mount or `refetch()` triggers a fresh API call
- ❌ **No stale-while-revalidate** — old data disappears immediately when refetch starts
- ❌ **No request deduplication** — two components calling `useAccounts()` make two API calls
- ❌ **No background refetching** — data is stale until the user manually triggers sync
- ❌ **No optimistic mutation support**

Compare this to what React Query or SWR provide out of the box: caching, deduplication, stale-while-revalidate, optimistic updates, mutation caching, and automatic background refetching.

### Reference Data Re-Fetched on Every Page Navigation

`useLiveCollections()` is called by `DashboardPage`, `IncomePage`, `ExpensePage`, `WorkflowPage`, and `MonthlyMonitoringPage`. Each call triggers 4 separate API calls:

```typescript
const { state: accountsState } = useAccounts(true);
const { state: allIncomeCategoriesState } = useIncomeCategories(false);
const { state: normalIncomeCategoriesState } = useIncomeCategories(true);
const { state: expenseCategoriesState } = useExpenseCategories();
```

These are reference data (accounts, categories) that change very rarely. They should be fetched once at the app level and shared via context, not re-fetched on every page mount.

### Cross-Section Staleness

When a user edits an expense, the `refetch()` call only re-fetches expenses. But the Dashboard, Monthly Monitoring, and potentially other sections that show expense data are now stale. There's no cross-section invalidation strategy. If the user goes to Dashboard after editing an expense, they see stale numbers until they navigate away and back (which triggers a fresh mount + fetch).

---

## Caching Strategy Analysis

### Backend: The `LiveCache`

The backend has a `LiveCache` interface per user:

```typescript
interface LiveCache {
    accounts: AccountDto[];
    incomeCategories: IncomeCategoryDto[];
    expenseCategories: ExpenseCategoryDto[];
    incomes: IncomeRecordDto[];
    expenses: ExpenseRecordDto[];
}
```

Stored in a `Map<string, LiveCache | null>` keyed by userId. This cache is:
- **Populated** on first access (or when empty) by fetching all 5 Notion databases
- **Destroyed** after every mutation (`refreshCache()`)
- **Never refreshed** proactively — only rebuilt from scratch when empty

### Frontend: No Caching Layer

There is no frontend caching at all. The `useApiData` hook stores data in component-local `useState`. When the component unmounts (e.g., navigating to a different section), the data is lost. When the component remounts, a fresh API call is made.

### What a Proper Caching Strategy Looks Like

| Layer | Current | Recommended |
|-------|---------|-------------|
| Backend cache | All-or-nothing, nuclear invalidation | Per-resource TTL or LRU with targeted invalidation |
| Frontend cache | None (component state only) | React Query / SWR with stale-while-revalidate |
| Cache invalidation | Full delete after every mutation | Mutate cache entry directly, background refetch |
| Reference data | Re-fetched per page mount | App-level context, fetched once per session |

---

## Coupling Analysis

### Is the code tightly coupled?

Yes, in several ways:

#### 1. Frontend-Backend coupling on sync flow

The frontend's `refetch()` after every mutation is tightly coupled to the backend's cache invalidation behavior. If the backend changes its caching strategy, the frontend's loading behavior changes.

#### 2. Backend `NotionService` is a god class

It handles listing, creating, updating, deleting, syncing, schema checking, dashboard summary, and monthly monitoring. This is too many responsibilities for one service.

#### 3. All controllers delegate to `NotionService`

Every controller (`IncomesController`, `ExpensesController`, `SyncController`, etc.) simply calls `this.notionService.method()`. There's no business logic layer between the controller and the Notion service.

#### 4. Frontend `finance-workspace.tsx` couples everything

All page components, modal components, utility functions, and shared UI components are in one file. Changes to one page can affect others.

#### 5. `useLiveCollections` couples reference data loading to every page

Every page that needs account or category data must call this hook, which triggers API calls.

---

## Minor Issues

### Hardcoded month list

`finance-data.ts` has a hardcoded `months` array (`2026-01` to `2026-07`). This should be dynamic based on the current date.

### No pagination or virtualization

If a user has hundreds of income/expense records, the entire list is rendered at once. There's no pagination or virtual scrolling. This will degrade performance as data grows.

### No debouncing on filter changes

When the user changes a filter (account, category), it immediately triggers a new API call. There's no debouncing to prevent rapid-fire requests when the user is toggling filters quickly.

### No error boundaries

If a component throws, the entire app crashes. There's no error boundary to catch and display errors gracefully.

### No loading skeletons

The only loading indicator is a text "Querying Notion..." with a spinning icon. There should be skeleton screens that match the layout of the data being loaded to prevent layout shift.

---

## Actionable Recommendations

### Priority 1: Add optimistic updates to the frontend

After a successful save, **immediately update the local state** with the returned record before calling `refetch()`. This makes the UI feel instant:

```typescript
// In handleSaveIncome():
const res = await incomesApi.update(editingId, payload);
if (res.success) {
    setModal(null);
    // Optimistically insert/update the record in local state
    // THEN refetch in the background (no loading spinner)
    refetchBackground(); // refetch without setting loading state
}
```

This requires changing `useApiData`'s `refetch` to support a "silent" mode that doesn't set `loading` state.

### Priority 2: Change backend cache invalidation from nuclear to targeted

Instead of deleting the entire cache after every mutation, **only invalidate the mutated resource**:

```typescript
private refreshCacheFor(userId: string | undefined, resource: ResourceName): void {
    const key = this.getLiveCacheKey(userId);
    const cache = this.liveCaches.get(key);
    if (!cache) return;
    // Only delete the mutated resource, keep the rest
    if (resource === 'incomes' || this.isIncomeBacked(resource)) {
        cache.incomes = []; // mark as stale
    }
    if (resource === 'expenses' || this.isExpenseBacked(resource)) {
        cache.expenses = [];
    }
    // Accounts, categories stay cached
}
```

Or better: **don't invalidate at all for reads**. The `loadLive()` method already populates the cache on first access. Just let the cache expire naturally (e.g., TTL of 30-60 seconds) or only invalidate on explicit sync.

### Priority 3: Skip the full refetch after direct-save mutations

After `incomesApi.update()` returns the updated record, **use that record directly** instead of re-fetching the entire list. The backend already returns the full updated record from `pageToIncomeRecord(page)`. The frontend can merge it into the existing list:

```typescript
// After successful update:
setIncomes(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
// No refetch needed for the current view
```

A background refetch can happen silently to pick up any side effects (e.g., computed fields that changed due to the mutation).

### Priority 4: Hoist `useLiveCollections()` to a context provider

Move the accounts/categories fetching to a `FinanceDataProvider` that wraps the workspace. Every page consumes from this context instead of making its own API calls:

```typescript
// In FinanceWorkspace:
<FinanceDataProvider>
    {activeSection === "income" && <IncomePage />}
    {activeSection === "expense" && <ExpensePage />}
    ...
</FinanceDataProvider>

// In any page:
const { activeAccounts, expenseCategories } = useFinanceData();
// No API calls — just context reads
```

### Priority 5: Split `finance-workspace.tsx` into separate page components

Move each page to its own file:
- `components/pages/dashboard-page.tsx`
- `components/pages/income-page.tsx`
- `components/pages/expense-page.tsx`
- `components/pages/workflow-page.tsx`
- `components/pages/monthly-monitoring-page.tsx`
- `components/pages/accounts-page.tsx`
- `components/pages/sync-page.tsx`
- `components/pages/settings-page.tsx`

Shared UI components (`DataTable`, `FormModal`, `Panel`, `MetricCard`, etc.) go into `components/ui/`.

### Priority 6: Consider React Query or SWR

This is the single highest-leverage change for the UX complaint. React Query would give you:
- Automatic caching with stale-while-revalidate
- Optimistic mutations with rollback
- Background refetching
- Request deduplication
- Loading/skeleton states without full spinners
- Automatic cache invalidation on mutations

The migration path: replace `useApiData` with `useQuery`, replace `refetch()` with `queryClient.invalidateQueries()`, and add `onSuccess` callbacks to mutations that update the cache.

---

## Summary Matrix

| Area | Verdict | Impact |
|------|---------|--------|
| Architecture (FE/BE split) | ✅ Good | — |
| Property mapping | ✅ Good | — |
| Field classification | ✅ Good | — |
| Auth | ✅ Good | — |
| Client-side calculations | ✅ Good | — |
| Backend cache invalidation | 🔴 Nuclear | **Root cause of slow saves** |
| Frontend caching | 🔴 None | **Root cause of loading spinners** |
| Optimistic updates | 🔴 None | **Root cause of UI blocking** |
| `loadLive()` granularity | 🟡 All-or-nothing | Amplifies cache miss cost |
| `finance-workspace.tsx` size | 🟡 4000+ line monolith | Maintainability risk |
| `NotionService` size | 🟡 957-line god class | Maintainability risk |
| Reference data fetching | 🟡 Re-fetched per page mount | Unnecessary network overhead |
| Cross-section staleness | 🟡 No invalidation strategy | Stale Dashboard/Monitoring data |

---

## Conclusion

The user complaint is real and the root cause is clear: **the backend nukes its entire cache after every mutation, and the frontend has no caching or optimistic update layer to compensate.** The fix is three-pronged:

1. **Targeted cache invalidation on the backend** — stop deleting all 5 databases from cache when only 1 changed
2. **Optimistic updates on the frontend** — merge the returned record into local state immediately, refetch silently in background
3. **A proper caching library like React Query** — it solves caching, deduplication, optimistic mutations, and stale-while-revalidate in one shot

All three can be done without changing the core Notion write logic or the sync design.
