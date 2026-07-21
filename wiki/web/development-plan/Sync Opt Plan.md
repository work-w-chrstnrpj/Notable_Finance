# Sync Optimization Plan

Created: 2026-07-12
Source: Architectural inquiry — loading time optimization under Notion 3 req/sec constraint

## Problem Statement

Page navigation fires 2-6 Notion API queries per click through the backend cache. Cold start fires 5 parallel queries simultaneously, tripping the 3 req/sec rate limit. Combined with React Query `staleTime: 0`, every navigation triggers a refetch even when the backend cache is fresh.

---

## Fix #1: Extend React Query staleTime

**Goal:** Eliminate redundant refetches on page navigation by letting React Query serve cached data for 5 minutes.

**Instruction:** In `application/src/lib/use-data.ts`, change `staleTime` from `0` (default) to `5 * 60_000` for transactional query hooks (`useIncomes`, `useExpenses`, `useWorkflowRecords`, `useWorkflowRecords`, `useMonthlyMonitoring`, `useExpenseScheduler`). Reference data hooks (`useAccounts`, `useIncomeCategories`, `useExpenseCategories`) already use `REFERENCE_STALE_TIME = 5 * 60_000`.

**Positive impact:**
- Instant page navigation — no loading spinner for 5 minutes after first fetch
- Zero backend load for repeated reads within the stale window
- No spinner flicker when rapidly clicking between Dashboard, Income, Expense
- React Query still refetches in background when data goes stale, so UI eventually updates without a blank screen
- One-line change, zero architecture risk

**Negative impact:**
- Data displayed can be up to 5 minutes behind Notion. If another device or Notion-side change happened, the user won't see it until the background refetch completes or Sync is pressed.
- Stale financial numbers displayed confidently. User might think "I have ₱50,000 income" when the real number is ₱55,000 because a recently-added income hasn't refetched yet.
- If extended too aggressively (e.g., 30 minutes), drift between displayed and real data becomes unacceptable for a finance app.
- The sync button becomes the only guaranteed freshness mechanism — users must understand this contract.

**Mitigation:** Sync button invalidates all queries immediately. UX contract: "data is as fresh as your last sync or last 5 minutes. Press Sync for guaranteed freshness."

**Status:** Unimplemented

---

## Fix #2: Stagger Cold-Start Load

**Goal:** Respect Notion's 3 req/sec limit on first session load by spacing out the 5 initial database queries.

**Instruction:** In `service/src/notion/live-cache-manager.ts`, replace the `Promise.all([...])` call in `loadAllCollections()` with a sequential chain that waits 350-400ms between each `queryDatabase()` call. Alternatively, implement a token-bucket rate limiter that queues Notion requests and executes them with minimum 333ms spacing.

**Positive impact:**
- Respects 3 req/sec limit by design — no 429 rate-limit errors on first load
- Predictable cold-start time: ~1.75-2.0 seconds (5 queries × 350-400ms)
- No retry loops from rate-limit responses that compound the delay
- Other users or integrations sharing the same Notion workspace won't be throttled
- The `singleFlight` pattern already ensures concurrent readers share one load promise

**Negative impact:**
- Cold start is slower than parallel approach when Notion is lenient. Currently, 5 parallel queries might complete in ~500ms if no rate limit is hit. Staggered, it's ~1.75s minimum.
- If one query fails (network blip), the entire chain is delayed by the gaps before it. A parallel approach fails fast on all 5 simultaneously.
- The 350ms gap is a magic number. Too small = still risk rate limits. Too large = unnecessarily slow. Needs tuning based on real-world Notion response times.
- If Notion API response time itself is 200-300ms (common), the actual gap between requests is only 50-150ms in practice, which might still be tight against the limit.

**Mitigation:** Use 400ms gaps for safety margin. Measure actual Notion response times in production and adjust. Cold start only happens once per session.

**Status:** Unimplemented

---

## Fix #3: Sync Button Minimum Interval Cooldown

**Goal:** Prevent accidental double-sync and rate-limit abuse by enforcing a 30-second minimum between sync operations.

**Instruction:** In `application/src/components/finance-workspace.tsx`, track `lastSyncTimestamp` in state. In `runSync()`, check if `Date.now() - lastSyncTimestamp < 30_000` and show a "Synced recently, try again in X seconds" message instead of firing the API call. Display a countdown timer on the Sync button during cooldown.

**Positive impact:**
- Prevents accidental double-sync that wastes Notion API quota
- Prevents impatient users from hammering the button and tripping rate limits
- Simple guard — timestamp comparison, no complex state machine
- 30-second window is short enough that it doesn't feel restrictive
- Very low implementation effort

**Negative impact:**
- If a real change happened in Notion 10 seconds ago and user presses Sync, they're told to wait. Frustrating in the rare case where immediate freshness is actually needed.
- The 30-second number is arbitrary. Too short = still allows rate-limit risk if user syncs, makes a Notion change, syncs again. Too long = feels unresponsive.
- Doesn't address the real problem: implicit Notion reads through page navigation. The sync button is explicit; the read path is implicit and happens more frequently.
- Adds UI friction for power users who sync frequently by habit.

**Mitigation:** Make the interval configurable via environment variable. Or track actual Notion API call timestamps on the backend and reject requests that would exceed 3 req/sec, rather than using a fixed cooldown.

**Status:** Unimplemented

---

## Fix #4: Stale-While-Revalidate for Read-Only Views

**Goal:** Never show a blank/loading screen after the first load. Render cached data immediately, refresh in background, update silently.

**Instruction:** In React Query hooks, rely on the default `stale-while-revalidate` behavior (already the default when `staleTime > 0`). In view components, use `query.isFetching` (not `query.isLoading`) to show a subtle background refresh indicator — thin progress bar at top of page or small spinner in the corner — instead of a full-page loading state. Apply selectively to read-only summary views: Dashboard, Monthly Monitoring, and Accounts. Do NOT apply to transactional lists (Income, Expense) where silent data changes mid-view are dangerous.

**Positive impact:**
- User never sees a blank/loading screen after the first load. Every navigation feels instant.
- Background refresh keeps data reasonably fresh without blocking the UI.
- The `isFetching` flag provides a clean way to show "refreshing..." without architectural changes.
- Standard React Query pattern — battle-tested and well-documented.
- Read-only summaries (Dashboard, Monthly Monitoring) tolerate staleness well — numbers are informational, not actionable.

**Negative impact:**
- **The flash problem:** If the background refresh returns different data (e.g., a record was deleted), the UI updates mid-view. User might be reading a row and it suddenly disappears. Jarring.
- User might act on stale data: "I see ₱10,000 in my account, I'll transfer ₱9,000" — but the real balance is ₱5,000 because a pending transaction just synced.
- For transactional views specifically, displaying stale numbers with confidence is dangerous. The user trusts what they see.
- Adds visual complexity: refresh indicator must be noticeable enough to inform but subtle enough not to annoy.
- If applied to Income/Expense lists, creates confusion about which data is "real."

**Mitigation:** Apply only to Dashboard, Monthly Monitoring, and Accounts (read-only summaries). For Income/Expense lists, show a banner: "Data refreshed at {time} — press Sync for latest" instead of silent updates. Never silently update transactional lists.

**Status:** Unimplemented

---

## Summary Matrix

| Fix | Impact on Loading | Implementation Effort | Risk | Best For |
|---|---|---|---|---|
| **#1. staleTime** | ★★★★★ Instant navigation | 1 line change | Low | All views |
| **#2. Stagger cold start** | ★★★☆☆ Reliable first load | ~20 lines | Low-Medium | First session only |
| **#3. Sync cooldown** | ★★☆☆☆ Prevents abuse | ~10 lines | Very Low | Sync button only |
| **#4. Stale-while-revalidate** | ★★★★★ No blank screens | ~15 lines per view | Medium | Read-only views only |

## Recommended Implementation Order

1. **Fix #1** (staleTime) — immediate, maximum impact, zero risk
2. **Fix #2** (stagger cold start) — addresses the root rate-limit issue
3. **Fix #4** (stale-while-revalidate) — polish for Dashboard/Monthly Monitoring only
4. **Fix #3** (sync cooldown) — defense-in-depth, implement if double-sync becomes a habit

Fix #1 + Fix #2 together eliminate ~90% of loading frustration. Fix #4 is polish. Fix #3 is optional.
