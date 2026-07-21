# Phase 4 — Implementation Note

**Date:** 2026-07-12
**Author:** System Architect (implementation executed)
**Scope:** P4-1 … P4-4 of `performance-optimization-plan.xlsx`
**Plan:** `p4-boundary-plan.md`
**Result:** Boundary plan complete; first bottom-up extractions landed and verified. The two large splits
(FE monolith, BE god class) continue incrementally per the plan — P4-2/P4-3 remain **In Progress**.

---

## Why incremental, not big-bang

`finance-workspace.tsx` is 5,856 lines (8 page components + ~30 shared UI primitives, all sharing
`FormModal`/`DataTable`/`useLiveCollections`/helpers). `NotionService` is 1,138 lines feeding 9
controllers. The plan itself mandates incremental delivery ("one page per PR", "land incrementally"). A
single-pass rewrite of a working, verified app would be high-risk and hard to review. So P4 proceeds
**bottom-up**: extract leaf dependencies first, verify, then move the larger units on top of them.

---

## What landed this session

### P4-1 — Boundary plan
`p4-boundary-plan.md`: target file layouts, ownership tables, interfaces, and the exact incremental
sequence for both the frontend split and the backend split, with the stable-contract rules.

### P4-2 (Frontend) — steps 1–2 of 6
- **`src/lib/finance-helpers.ts`** — 11 pure helpers extracted from the monolith (`applyNotionTag`,
  `applyIncomeTag`, `stripNotionTag`, `getMonthLabel`, `cx`, `parseNumberInput`,
  `parseOptionalNumberInput`, `getIncomeGrossTotal`, `getIncomeCapitalExpenditureTotal`,
  `getIncomeNetTotal`, `getExpenseTotal`). No React/JSX.
- **`src/lib/finance-events.ts`** — `DATA_CHANGED_EVENT` + `emitDataChanged` (now SSR-guarded).
- `finance-workspace.tsx` imports both; the local definitions are removed.

### P4-3 (Backend) — steps 1–2 of 7
- **Step 1 — `src/notion/notion-resource-utils.ts`** — 6 pure, stateless helpers (`isIncomeBacked`,
  `isExpenseBacked`, `isCreditLike`, `currentMonth`, `filterByMonth`, `filterByRange`) extracted from
  `NotionService`; 20 `this.*` call sites rewired to the imports; private methods removed. This is the
  leaf that `LiveCacheManager` depends on, so doing it first de-risked that extraction.
- **Step 2 — `src/notion/live-cache-manager.ts`** — the entire cache concern (state Maps, freshness/TTL,
  single-flight, cold/collection loaders, `getCollected*`) moved into a cohesive `LiveCacheManager`.
  `NotionService` instantiates it in its constructor from its own injected deps (**constructor signature
  unchanged → neither spec needed editing**) and delegates via `this.cache.*`. `detail`'s single direct
  cache-state read became `this.cache.hasEntry(userId)`. `NotionService` shrank **1,138 → 827 lines**;
  the manager is 326 lines. The unused `LiveCache`/`CollectionName` types were removed from the service.

---

## Verification

| Check | Result |
|-------|--------|
| FE `tsc --noEmit` | ✅ clean |
| FE eslint (new lib files) | ✅ clean; `finance-workspace.tsx` unchanged at its 5 pre-existing errors |
| BE `tsc --noEmit` | ✅ clean |
| BE tests | 14 passed / 4 failed — **parity** (the 4 are the pre-existing stale static-seed tests) |
| Live smoke | ✅ `/income` renders fully (filters, view tabs, records table, FAB) with **no console errors** — it exercises the extracted `parseNumberInput`/`cx`/`applyIncomeTag`/`emitDataChanged`/`getMonthLabel` |

Both extractions are pure refactors — identical runtime behaviour, guarded by the existing type/lint/test
suites. (The `/income` list showed a loading/empty state due to the residual Notion rate-limit from P3
testing, not a refactor break.)

---

## Remaining P4 work (sequenced in `p4-boundary-plan.md`)

- **FE steps 3–6:** `components/ui/*` (leaf primitives), `components/charts/*`, `components/pages/*`
  (one page per step), then reduce `finance-workspace.tsx` to a thin shell.
- **BE steps 3–7:** `NotionReportingService`, `NotionQueryService`, `NotionMutationService`,
  `NotionSyncService`, then NotionService as a facade — all behind unchanged controller contracts
  (guarded by `controller-contract.spec.ts` + `notion.service.cache.spec.ts`).
- **P4-4:** full functional regression once the splits complete.

Each remaining step is independently reviewable and keeps the app green.
