# P4 — Module Boundary Plan (workspace monolith + NotionService god class)

**Date:** 2026-07-12 · **Author:** System Architect · **Task:** P4-1
**Feeds:** P4-2 (Frontend), P4-3 (Backend), P4-4 (QA regression)

The two targets are large and interconnected, so this refactor is **incremental** — each move below is a
reviewable step that keeps the app green (typecheck + lint + tests + live smoke) and preserves all public
contracts. No behaviour changes; structure only.

---

## A. Frontend — split `application/src/components/finance-workspace.tsx` (5,856 lines)

### Target layout

```
src/lib/
  finance-helpers.ts        # pure helpers: parseNumberInput, cx, get*Total, tag helpers, cellText…
  finance-events.ts         # DATA_CHANGED_EVENT + emitDataChanged
src/components/ui/          # leaf presentational primitives (no page/domain deps)
  Panel, MetricCard, Badge, MoneyLine, MoneyValue, EmptyState, LoadingBlock,
  Field, ComputedField, FormSectionDivider, PageToolbar, SegmentedControl,
  FilterToggle, FilterSelect, DataTable, FormModal, CategoryDonutChart, …
src/components/charts/      # AnnualBarChart, CategoryDonutChart, SpendingBreakdownCard, buildAnnualGroups
src/components/pages/
  dashboard-page.tsx        # DashboardPage + TopExpensePurchasesCard, TopSpendingCategoriesCard,
                            #   RecentTransactionsList, SpendingBreakdownCard
  accounts-page.tsx         # AccountsPage + AccountDetailModal, AccountIcon, AccountTypeIcon
  income-page.tsx           # IncomePage
  expense-page.tsx          # ExpensePage
  workflow-page.tsx         # WorkflowPage
  monthly-monitoring-page.tsx
  sync-page.tsx
  settings-page.tsx         # SettingsPage + Settings/Notion/Email/Password/Delete/Theme modals
  quick-add.tsx             # WorkspaceFab, QuickAddIncomeModal, QuickAddExpenseModal, export modals
src/components/finance-workspace.tsx  # thin shell: FinanceWorkspace, Sidebar, TopBar, DateRangeSelector
```

### Ownership table

| Module | Owns | Must NOT own |
|--------|------|--------------|
| `lib/finance-helpers.ts` | pure calculations, formatting, parsing | React, JSX, hooks |
| `lib/finance-events.ts` | the cross-component data-changed event | data fetching |
| `components/ui/*` | generic presentational primitives | page/domain logic, data fetching |
| `components/charts/*` | recharts wrappers + chart data shaping | page state |
| `components/pages/*` | one section each: its state, its modals, its handlers | other pages' internals |
| `finance-workspace.tsx` | app shell + section routing + nav | page bodies, shared primitives |

### Extraction sequence (bottom-up — dependencies first)

1. **`lib/finance-helpers.ts`** — pure functions (leaf). *(done this session)*
2. **`lib/finance-events.ts`** — `DATA_CHANGED_EVENT` / `emitDataChanged`. *(done this session)*
3. **`components/ui/*`** — leaf primitives (they only depend on #1). One PR per cluster.
4. **`components/charts/*`** — depend on #1/#3.
5. **`components/pages/*`** — one page per PR; each imports #1–#4 + `useFinanceData` + the data hooks.
6. **Thin shell** — what remains in `finance-workspace.tsx` is `FinanceWorkspace` + Sidebar/TopBar/DateRangeSelector.

Rule: never mix a move with a behaviour change; verify (typecheck+lint+live) after each step.

---

## B. Backend — split `service/src/notion/notion.service.ts` (1,138 lines)

`NotionService`'s public methods (`list`, `detail`, `create`, `update`, `delete`, `pull`, `commit`,
`syncStatus`, `schemaStatus`, `dashboardSummary`, `monthlyMonitoring`, `isGloballyConfigured`) are the
**stable contract** — 9 controllers + `controller-contract.spec.ts` depend on them. All splits sit
*behind* these signatures (NotionService becomes a thin facade delegating to focused collaborators).

### Target collaborators

| Class | Owns (from current lines) | Depends on |
|-------|---------------------------|------------|
| `LiveCacheManager` | cache Maps + freshness + single-flight + loaders + `getCollected*` (91–359) | `NotionClientFactory`, mappers |
| `NotionQueryService` | `applyQuery`, `filterIncomeBacked`, `filterExpenseBacked`, month/range filters, category lookups (830–1088) | `LiveCacheManager` |
| `NotionMutationService` | `create`/`update`/`delete` write logic + `buildNotionProperties` (404–490, 764) | cache, `ValidationService`, client |
| `NotionReportingService` | `dashboardSummary`, `monthlyMonitoring` (656–763) | cache, query service |
| `NotionSyncService` | `pull`, `commit`, `syncStatus`, `schemaStatus`, sync-event log (490–655) | cache, mutation service |
| `NotionService` (facade) | `list`/`detail` + delegation to the above | all collaborators |

### Sequence

1. **`notion-resource-utils.ts`** — pure leaf helpers (`isIncomeBacked`, `isExpenseBacked`, `isCreditLike`,
   `currentMonth`, `filterByMonth`, `filterByRange`) extracted first, bottom-up (mirrors the FE approach).
   *(done this session)*
2. **`LiveCacheManager`** — extract cache state + all freshness/loading/single-flight/`getCollected*`
   methods into a class; NotionService holds one instance and calls through it. Covered by
   `notion.service.cache.spec.ts`. (Its `collectionForResource` now depends only on the pure predicates
   from step 1, so this extraction is cleaner.)
3. `NotionReportingService` — self-contained; move `dashboardSummary`/`monthlyMonitoring`.
4. `NotionQueryService` — move filter/query helpers; `list`/`detail` delegate.
5. `NotionMutationService` — move write logic.
6. `NotionSyncService` — move pull/commit/status.
7. NotionService becomes the facade. Wire all via the Nest module providers.

Rule: after each extraction, `tsc --noEmit`, `vitest run` (incl. the cache + contract specs) must pass;
controller signatures unchanged.

---

## C. Risk & verification

- **Highest risk:** the FE page extractions (shared-state coupling). Mitigation: strict bottom-up order,
  one page per step, live smoke each time.
- **Backend:** contract spec + cache spec guard every step; keep signatures identical.
- **Not in scope:** the cold-load-returns-empty backend-resilience fix (flagged in the P3 note) — separate
  task.

## D. Status of this session

Done, all verified (typecheck + lint + tests + live smoke):
- **P4-1** (this plan).
- FE steps 1–2 — `lib/finance-helpers.ts` (11 pure helpers) and `lib/finance-events.ts`.
- BE step 1 — `notion-resource-utils.ts` (6 pure predicates/filters), 20 call sites rewired.
- BE step 2 — **`LiveCacheManager`** extracted (cache state + freshness + single-flight + loaders +
  `getCollected*`). `NotionService` instantiates it in its constructor (unchanged signature → no spec
  churn), delegates via `this.cache.*`, and shrank **1,138 → 827 lines**. Guarded green by the 6-test
  cache/concurrency spec; overall suite at parity.

Remaining FE steps 3–6 (ui/, charts/, pages/, thin shell) and BE steps 3–7 (reporting → query →
mutation → sync → facade) follow this sequence incrementally. **P4-2 and P4-3 remain In Progress**;
P4-4 (full post-refactor regression) runs once they complete.
