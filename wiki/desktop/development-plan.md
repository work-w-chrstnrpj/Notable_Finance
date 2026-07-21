# Desktop Development Plan

Phased plan for **Notable Finance App**. Target: a working offline-first daily driver within ~1 week, layering sync on top so a usable app exists early.

Legend: `Not Started` · `In Progress` · `Done` · `Blocked`.

## Sequencing principle

Build a fully usable **offline** app first (Phases 0–1), then add sync in increasing capability (Phases 2–4), then package (Phase 5). You get value early and never block on the hardest part (reconcile).

## Phases

### Phase 0 — Scaffold & shared logic (foundations)
| # | Work item | Acceptance | Status |
| --- | --- | --- | --- |
| 0.1 | pnpm workspace; `notable-finance-app` with electron-vite (main/preload/renderer) | App window boots with HMR | Not Started |
| 0.2 | better-sqlite3 + drizzle wired; migrations run on start | Empty DB created in userData | Not Started |
| 0.3 | Copy domain/types/mapping/reporting from web into `src/main/domain` + `src/shared` | Unit tests for derivations pass | Not Started |
| 0.4 | contextBridge preload + IPC skeleton | Renderer calls a no-op `window.api` channel | Not Started |

### Phase 1 — Offline app (fully usable, no sync)
| # | Work item | Acceptance | Status |
| --- | --- | --- | --- |
| 1.1 | SQLite schema for all resources + sync columns | Schema matches [`local-data-schema.md`](local-data-schema.md) | Not Started |
| 1.2 | Local CRUD for incomes/expenses/scheduler (instant write, `dirty`) | Create/edit/soft-delete works offline | Not Started |
| 1.3 | Derived values (balances, budgets, net, monthly) computed from SQLite | Numbers match golden tests; update on edit | Not Started |
| 1.4 | Ported renderer pages (Dashboard, Accounts, Income, Expense, Monitoring, Transfer, CC Payment, Alkansya, Receivables) | Sections render from local data | Not Started |
| 1.5 | Multi-window; changes reflect across windows | Two windows stay consistent | Not Started |

### Phase 2 — Onboarding + Push
| # | Work item | Acceptance | Status |
| --- | --- | --- | --- |
| 2.1 | Notion Connect: token via safeStorage; discover + map databases | Token stored in keychain, never in renderer | Not Started |
| 2.2 | Schema verification (drift report) | Verify passes on the mapped workspace | Not Started |
| 2.3 | Push: create/update/soft-delete to Notion (writable fields only) | Dirty records reach Notion; ids stored; idempotent | Not Started |

### Phase 3 — Pull
| # | Work item | Acceptance | Status |
| --- | --- | --- | --- |
| 3.1 | Initial pull populates SQLite | Local store matches Notion after onboarding | Not Started |
| 3.2 | Incremental pull via Search since `last_pull_cursor` | Only changed pages fetched; cursor persists | Not Started |
| 3.3 | Reference cache (accounts/categories) refresh on pull | Selectors reflect Notion | Not Started |

### Phase 4 — Reconcile + Conflict
| # | Work item | Acceptance | Status |
| --- | --- | --- | --- |
| 4.1 | Three-way merge (base/local/remote); auto-merge disjoint fields | Scenario matrix tests pass | Not Started |
| 4.2 | Conflict detection + log + resolver UI (prompt) | Same-field conflict prompts and resolves | Not Started |
| 4.3 | Sync modes (manual + interval push/pull); status indicator; badges | Status/badges per [`offline-and-state-model.md`](offline-and-state-model.md) | Not Started |
| 4.4 | Mutation queue durability + rate-limit backoff | Crash/429 simulations pass | Not Started |

### Phase 5 — Package
| # | Work item | Acceptance | Status |
| --- | --- | --- | --- |
| 5.1 | electron-builder for mac/linux/windows; native rebuild | Installers produced; app runs unsigned | Not Started |
| 5.2 | Playwright + Electron e2e for core flows | E2E suite green | Not Started |
| 5.3 | CHANGELOG + versioning | v0.1.0 tagged | Not Started |

## Milestone summary

- **M1 (offline app):** Phases 0–1 — usable offline, real-time balances.
- **M2 (backup sync):** Phases 2–3 — push + pull working (one-directional feel).
- **M3 (full sync):** Phase 4 — bidirectional reconcile + conflict resolver.
- **M4 (shippable):** Phase 5 — packaged for all three OSes.

## Out of scope (this cycle)

Code-signing/notarization, auto-update infra, shared-package extraction, webhook-driven realtime pull. See [`packaging-and-release.md`](packaging-and-release.md) and [`shared-core-and-monorepo.md`](shared-core-and-monorepo.md).
