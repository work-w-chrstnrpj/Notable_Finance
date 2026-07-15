# Phase 2 — Implementation Note

**Date:** 2026-07-12
**Author:** System Architect (implementation executed)
**Scope:** P2-1 … P2-3 of `performance-optimization-plan.xlsx`
**Result:** Implemented and verified with deterministic unit tests.

> **Addendum (during P3):** the TTL model introduced here lacked in-flight coalescing. Under real
> concurrent load (a dashboard mount, where `incomes`/`alkansya`/`transfers`/`credit-card-payments` all
> back the same `incomes` collection) this caused a thundering herd against Notion → rate-limit hangs and
> 5xx. Fixed by adding `singleFlight()` to `notion.service.ts` and 2 concurrency tests. Details in
> `p3-implementation-note.md`.

---

## What changed (backend only)

### `service/src/config/configuration.ts` + `config.service.ts`  (P2-1)

- New config `cache.liveTtlMs`, env var **`LIVE_CACHE_TTL_MS`** (default **45000** ms).
- `AppConfigService.liveCacheTtlMs` getter, clamped to a non-negative finite number.
- Documented in `service/.env.example`.

### `service/src/notion/notion.service.ts`  (P2-1, P2-2)

**Per-collection freshness (P2-1).** Replaced the P0 `staleCollections: Map<string, Set<CollectionName>>`
(a binary invalidated-or-not set) with `collectionFreshUntil: Map<string, Map<CollectionName, number>>` —
a per-user, per-collection freshness deadline (epoch ms). This unifies two concerns into one model:

- **TTL expiry:** a collection is fresh while `Date.now() < freshUntil`; after that its next read refetches
  just that collection.
- **Mutation invalidation:** `refreshCacheFor()` deletes the deadline (`invalidateCollection`), making the
  collection immediately stale — same targeted behaviour as P0, now expressed through the freshness map.

Helpers added: `isCollectionFresh`, `markCollectionFresh`, `markAllCollectionsFresh`,
`invalidateCollection`, and a static `ALL_COLLECTIONS` list. `loadLiveCollection()` now marks the
collection fresh after refilling it.

**Per-resource loaders (P2-2).** `loadLive()` no longer inlines the five-database `Promise.all`. Cold
start / explicit sync now go through a dedicated `loadAllCollections()` (the only path that queries all
five databases, in parallel). Warm reads refill **only** the requested resource's collection via the
existing `loadLiveCollection()`, and only when it is stale. Net effect:

| Path | Notion queries |
|------|----------------|
| Cold start (empty cache) | 5 (parallel) |
| Explicit sync (`pull()`) | full clear → 5 |
| Warm read, collection fresh | 0 (served from memory) |
| Warm read, collection stale (expired or mutated) | 1 (that collection only) |

Behaviour preserved: `pull()` still does a full `refreshCache` + reload; `monthlyMonitoring()` still
loads via `loadLive('incomes')` / `loadLive('accounts')` and now benefits from the same freshness model;
the null-client fallback path is unchanged.

---

## Verification (P2-3)

New deterministic suite: `service/src/notion/notion.service.cache.spec.ts`. It injects a **counting
Notion client** (records queries per database; returns empty arrays — only call counts matter) and asserts
through the public `list()` API:

| Test | Asserts |
|------|---------|
| cold start | queries all five databases **exactly once** each |
| within TTL (60s) | three subsequent reads → **0** additional queries (served from memory) |
| stale (TTL=0) | reading `incomes` refetches **only** `incomes` (1 query); the other four stay at 0. Then reading `expenses` refetches only `expenses` |
| workflow resources | `transfers` maps to the `incomes` collection (1 query on `incomes`, 0 on `accounts`) |

```
Test Files  1 passed (1)
      Tests  4 passed (4)
```

Full backend suite: **12 passed / 4 failed** — the 4 failures are the pre-existing stale static-seed
tests in `notion.service.spec.ts` (documented in the P0 note), unchanged by this work. `tsc --noEmit`
clean.

---

## Design decision — CacheManager extraction deferred

P2-2 suggested *considering* extracting a `CacheManager` helper. I kept the cache logic inside
`NotionService`, organised into cohesive private methods (`loadAllCollections`, `loadLiveCollection`,
the freshness helpers). Extracting a standalone `CacheManager` class overlaps directly with **P4-3**
(splitting the `NotionService` god class) — doing it now then again in P4 is churn. The methods are
already grouped and named so the P4 extraction is mechanical. Flagged for P4-3.

---

## Follow-ups

- TTL default is 45s; tune via `LIVE_CACHE_TTL_MS` if Notion rate limits or staleness become a concern.
- P4-3 to lift the cache methods into a dedicated `CacheManager`.
