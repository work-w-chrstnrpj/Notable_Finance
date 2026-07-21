# Phase 0 — Implementation Note

**Date:** 2026-07-12
**Author:** System Architect (implementation handoff executed)
**Scope:** P0-1 … P0-7 of `performance-optimization-plan.xlsx`
**Result:** Code tasks P0-1…P0-6 implemented and statically verified. P0-7 (live QA) blocked on a configured environment.

---

## What changed

### Backend — `service/src/notion/notion.service.ts`  (P0-1, P0-2)

- Added a `CollectionName` type and a per-user `staleCollections: Map<string, Set<CollectionName>>`.
- **P0-1 — targeted invalidation.** New `refreshCacheFor(userId, resource)` marks only the mutated
  resource's collection stale (incomes **or** expenses) instead of deleting the whole 5-collection
  cache. `create()`, `update()`, and `delete()` now call it. `pull()` still uses the full
  `refreshCache()` (correct for explicit sync). Accounts/categories stay warm across income/expense edits.
- **P0-2 — single-collection refill.** `loadLive()` now detects a stale collection on the next read and
  refills just that one via a new `loadLiveCollection()` (one `queryDatabase` call), instead of the
  all-or-nothing `Promise.all` over five databases. Cold start still loads all five.
- Fallback behaviour preserved: if the whole cache is absent or the client is unavailable,
  `refreshCacheFor` degrades to a full clear so the next read cold-loads correctly.

### Frontend — `application/src/lib/use-data.ts`  (P0-3, P0-4)

- **P0-3 — silent refetch.** `refetch({ silent })` no longer sets `status:"loading"` when silent, so the
  visible table is not blanked (stale-while-revalidate). On silent failure with no fallback it keeps the
  prior data instead of erroring.
- **P0-4 — optimistic merge.** New `applyLocal(updater)` synchronously updates the displayed data with no
  network call (no-op unless already loaded). `useApiData` now returns `{ state, refetch, applyLocal }`;
  `useIncomes` / `useExpenses` / `useWorkflowRecords` expose it automatically.

### Frontend — `application/src/components/finance-workspace.tsx`  (P0-5, P0-6)

- **P0-5 — optimistic create/update.** `handleSaveIncome`, `handleSaveExpense`, `handleSaveWorkflow` now
  close the modal, splice the returned record (`res.data`, already the full mapped record) into the list
  via `applyLocal`, then `refetch({ silent: true })`. The blocking `await refetch()` is gone.
- **P0-6 — optimistic delete.** The three delete handlers remove the row by id immediately via `applyLocal`,
  then reconcile with a silent refetch. (`delete` returns `ApiResult<void>`, so the held `editingId` is used.)

---

## Verification performed (static)

| Check | Result |
|-------|--------|
| `service` `tsc --noEmit` | ✅ clean |
| `application` `tsc --noEmit` | ✅ clean |
| `application` eslint (changed files) | ✅ no **new** errors (the 5 pre-existing `set-state-in-effect` errors at lines 1911/2356 etc. exist on the clean tree and are unrelated) |
| `service` `vitest run` | ➖ parity — same **8 passed / 4 failed** as the clean tree (see below) |

### Pre-existing failing backend tests (NOT caused by this change)

`service/src/notion/notion.service.spec.ts` uses a **null Notion client** and asserts against static
seed data ("July Salary", `income-july-salary`, account `acct-old-wallet`, monthly totals). That static
fallback no longer exists in the service, so 4 of those tests fail **identically on the untouched
`development` branch**. Out of scope for P0 — flag to SQA to refresh or delete these stale fixtures.

---

## P0-7 — live QA (BLOCKED, handoff to sqa-engineer)

The optimistic/non-blocking behaviour is only observable against a **running backend with valid Notion
credentials and the Neon database**. That environment could not be stood up in the implementation session
(no credentials handled here; note the pending **Neon password rotation** in project memory — resolve that
first). Manual script for the sqa-engineer once the env is up:

1. Start the backend (`service`) with a configured `.env`, then the frontend (`application`, port 3000).
2. Open the browser network tab **and** the backend logs.
3. **Edit** one income row → Save. Expect: modal closes and the row updates in **<0.5s**, **no**
   "Querying Notion…" spinner, and the backend issues **one** `queryDatabase('incomes')` on the follow-up
   read — **not** five. Repeat for **create** and **soft-delete**.
4. Immediately start a second CRUD without waiting — confirm it is **not blocked**.
5. Record before/after: perceived save latency (target ~3–7s → <0.5s) and Notion calls per edit
   (target: 2 full 5-DB round-trips → 1 write + 1 single-collection read).

---

## Follow-ups surfaced

- **Cross-section staleness is not fully solved by P0.** Editing an expense refreshes the expense list, but
  the Dashboard / Monthly Monitoring pages (separate mounts) still reconcile only on navigation. This is by
  design — the durable fix is the React Query invalidation map in **P3**.
- Stale backend test fixtures (above) — SQA to address.
