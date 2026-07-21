# Desktop Testing Strategy

Testing priorities for the local-first app. The bar is **full offline + conflict simulation coverage** for the sync engine, plus **Electron end-to-end** tests for the app as a whole.

## Test layers

| Layer | Tooling | Scope |
| --- | --- | --- |
| Unit | Vitest | Domain/reporting derivations, mapping, validation, three-way-merge diff. |
| Integration | Vitest + real SQLite (temp file) | DB migrations, repositories, sync reconcile against a **mock Notion adapter**. |
| End-to-end | Playwright + Electron | Full app: onboarding, CRUD, offline behavior, sync, conflict resolver UI. |

## Sync engine — the priority

The sync/conflict engine is the highest-risk component and gets scenario-based simulation tests. Using a **mock Notion adapter** (in-memory pages with `last_edited_time`), assert the reconcile outcome for each case in the [scenario matrix](sync-and-conflict-design.md#scenario-matrix):

- New locally (offline) → creates page, stores id, no duplicate on retry.
- New in Notion → inserts locally.
- Edited only locally / only in Notion → push / pull.
- Edited both, **disjoint** fields → auto-merge (no prompt).
- Edited both, **same** field → conflict raised + logged + prompt payload correct.
- Soft-delete vs edit → treated as field change; overlap prompts.
- Rate-limit (simulated 429) → backoff, retry, eventual success, **idempotent** (no dup).
- Crash mid-sync → mutation queue replays; no lost or double-applied edits.

Assert invariants: **computed fields are never written to Notion**; `base_snapshot` advances only on successful sync; derived values always equal a fresh recomputation from records.

## Offline coverage

- All CRUD works with the Notion adapter forced offline.
- Derived values (balance, budget) update instantly offline.
- `sync_state` badges appear/clear correctly through offline→online transitions.
- No data loss across app restarts while offline.

## Derived-value correctness

Golden tests comparing local derivations against expected values for representative accounts (cash and credit), matching the web app's reporting outputs, so the "same logic as web" guarantee is verified.

## E2E flows (Playwright + Electron)

1. First-run onboarding: connect (mock/fixture token), map databases, verify schema, initial pull.
2. Create/edit/soft-delete income and expense; balances update live.
3. Multi-window: change in one window reflects in another.
4. Manual sync and interval sync; status indicator states.
5. Conflict: force a same-field conflict via the mock adapter; resolve via the UI.

## CI

- Lint + typecheck + unit + integration on every change.
- E2E on a matrix approximating mac/linux/windows where feasible.
- Native module (`better-sqlite3`) rebuild verified in CI.

## Related

- [`sync-and-conflict-design.md`](sync-and-conflict-design.md) · [`offline-and-state-model.md`](offline-and-state-model.md) · [`local-data-schema.md`](local-data-schema.md)
