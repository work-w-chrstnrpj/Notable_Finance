# Desktop Development Plan

Phased plan for **Notable Finance App**. Target: a working offline-first daily driver within ~1 week, layering sync on top so a usable app exists early.

Legend: `Not Started` · `In Progress` · `Done` · `Blocked`.

## Sequencing principle

Build a fully usable **offline** app first (Phases 0–1), then add sync in increasing capability (Phases 2–4), then package (Phase 5). You get value early and never block on the hardest part (reconcile).

## Phases

### Phase 0 — Scaffold & shared logic (foundations)
| # | Work item | Acceptance | Status |
| --- | --- | --- | --- |
| 0.1 | pnpm workspace; `notable-finance-app` with electron-vite (main/preload/renderer) | App window boots with HMR | Done |
| 0.2 | better-sqlite3 + drizzle wired; migrations run on start | Empty DB created in userData | Done |
| 0.3 | Copy domain/types/mapping/reporting from web into `src/main/domain` + `src/shared` | Unit tests for derivations pass | Done |
| 0.4 | contextBridge preload + IPC skeleton | Renderer calls a no-op `window.api` channel | Done |

### Phase 1 — Offline app (fully usable, no sync)
| # | Work item | Acceptance | Status |
| --- | --- | --- | --- |
| 1.1 | SQLite schema for all resources + sync columns | Schema matches [`local-data-schema.md`](local-data-schema.md) | Done |
| 1.2 | Local CRUD for incomes/expenses/scheduler (instant write, `dirty`) | Create/edit/soft-delete works offline | Done |
| 1.3 | Derived values (balances, budgets, net, monthly) computed from SQLite | Numbers match golden tests; update on edit | Done |
| 1.4 | Ported renderer pages (Dashboard, Accounts, Income, Expense, Monitoring, Transfer, CC Payment, Alkansya, Receivables) | Sections render from local data | Done |
| 1.5 | Multi-window; changes reflect across windows | Two windows stay consistent | Done |

### Phase 2 — Onboarding + Push
| # | Work item | Acceptance | Status |
| --- | --- | --- | --- |
| 2.1 | Notion Connect: token via safeStorage; discover + map databases | Token stored in keychain, never in renderer | Done |
| 2.2 | Schema verification (drift report) | Verify passes on the mapped workspace | Done |
| 2.3 | Push: create/update/soft-delete to Notion (writable fields only) | Dirty records reach Notion; ids stored; idempotent | Done |

### Phase 3 — Pull
| # | Work item | Acceptance | Status |
| --- | --- | --- | --- |
| 3.1 | Initial pull populates SQLite | Local store matches Notion after onboarding | Done |
| 3.2 | Incremental pull via cursor since `last_pull_cursor` | Only changed pages fetched; cursor persists | Done |
| 3.3 | Reference cache (accounts/categories) refresh on pull | Selectors reflect Notion | Done |

### Phase 4 — Reconcile + Conflict
| # | Work item | Acceptance | Status |
| --- | --- | --- | --- |
| 4.1 | Three-way merge (base/local/remote); auto-merge disjoint fields | Scenario matrix tests pass | Done |
| 4.2 | Conflict detection + log + resolver UI (prompt) | Same-field conflict prompts and resolves | Done |
| 4.3 | Sync modes (manual + interval push/pull); status indicator; badges | Status/badges per [`offline-and-state-model.md`](offline-and-state-model.md) | Done |
| 4.4 | Mutation queue durability + rate-limit backoff | Crash/429 simulations pass | Done |

### Phase 5 — Package
| # | Work item | Acceptance | Status |
| --- | --- | --- | --- |
| 5.1 | electron-builder for mac/linux/windows; native rebuild | Installers produced; app runs unsigned | Done |
| 5.2 | Playwright + Electron e2e for core flows | E2E suite green | Done |
| 5.3 | CHANGELOG + versioning | v0.1.0 tagged | Done¹ |

¹ CHANGELOG + version 0.1.0 done; the `v0.1.0` git tag is deferred to the commit/release step.

### Phase 6 — Chat agent (Finance Copilot)

Design: [`chat-agent-design.md`](chat-agent-design.md) · skills/overlays: [`chat-skills-and-overlays.md`](chat-skills-and-overlays.md).

Locked: **Hybrid providers (C)**; confirm-before-write; no finance delete via chat; clarify missing fields; expense profiles + workflows. Chat **Settings-togglable**; Configure AI with **Name + API Key** (many keys). **Chat mode**: side nav = history, **Go Back to Main** to finance UI; deletable chat history.

| # | Work item | Acceptance | Status |
| --- | --- | --- | --- |
| 6.0 | Design freeze (Chat mode nav, Name/API Key, skills incl. monitoring-summary + rebudget, overlays) | Design + skills/overlays docs reviewed; freeze checklist in chat-agent-design.md | **Done** (2026-07-24) |
| 6.1 | Chat mode (history side nav + Go Back to Main) + Enable Chat + Configure AI (Name + API Key) + history CRUD + read-only send | Mode switch; named keys; New/delete chat; Q&A; no finance writes yet | **Done** (2026-07-24) |
| 6.2 | Read tools (summaries, queries with expense viewMode, budget status) + **`monitoring-summary`** + **`rebudget`** (no writes) | Month/year monitoring answers; rebudget plan table only | **Done** (2026-07-24) |
| 6.3 | Propose create/update: income, expense profiles (base/CC/Pasabuy), **all workflows** (Transfer, CC Payment, Alkansya, Receivables); confirm; clarify; refuse finance-delete | Approve writes dirty rows; incomplete prompts ask for fields; Cancel no-ops; delete refused | **Done** (2026-07-24) |
| 6.4 | Persona overlays + slash modes (`/default`, `/roast`, `/cheer`, `/strict`, `/quiet`) | Tone changes; budget/dating/income heuristics work | **Done** (2026-07-24) |
| 6.5 | Apple Intelligence read-only adapter (macOS stretch) | Bundled `fm-proxy` / Foundation Models; real compatibility probe | **Done** (2026-07-24; real FM bridge) |
| 6.6 | Hardening: allowlist tests, confirm/clarify gates, profile field tests, docs (IPC/security/testing) | Tests green; contracts updated | **Done** (2026-07-24) |

### Phase 7 — Maintenance & hardening (v1.2.0)
| # | Work item | Acceptance | Status |
| --- | --- | --- | --- |
| 7.1 | Bugfixes: Accounts table row click (`recordIds`), Notion callout render crash (regex callback arity), CC/Pasabuy sections keep-visible-while-fields-filled | Row click opens detail; expense renders with callouts; sections hide only after fields cleared | Done |
| 7.2 | Local backup & restore (`backup:export/inspect/import` + Settings panel); offline-capable single-file SQLite snapshot; version guard | Export/import roundtrip test green; newer-version imports refused | Done |
| 7.3 | Online state badge (green Online / red Offline) | Both states visible in TopBar | Done |
| 7.4 | Chat improvements: topic-guard lexicon (tipid tips + Taglish terms), year-level queries (`year` param), financial-insight routing, data-digest memory across turns, richer system prompt (formulas/app context/date), dynamic empty-state greeting | Guard/lexicon tests green; follow-up turns carry digested data | Done |
| 7.5 | Fix fresh-install migration crash — 0011 had two statements in one chunk (better-sqlite3 rejects multi-statement prepare) | Fresh DB migrates through 0011 (verified under Electron-node vitest) | Done |

## Milestone summary

- **M1 (offline app):** Phases 0–1 — usable offline, real-time balances.
- **M2 (backup sync):** Phases 2–3 — push + pull working (one-directional feel).
- **M3 (full sync):** Phase 4 — bidirectional reconcile + conflict resolver.
- **M4 (shippable):** Phase 5 — packaged for all three OSes.
- **M5 (chat copilot):** Phase 6 — confirm-gated NL Q&A and create/edit over local data.

## Out of scope (this cycle)

Code-signing/notarization, auto-update infra, shared-package extraction, webhook-driven realtime pull. See [`packaging-and-release.md`](packaging-and-release.md) and [`shared-core-and-monorepo.md`](shared-core-and-monorepo.md).

Phase 6 also excludes: auto-commit writes, chat-driven **finance** delete, Apple-backed write tool loops, MCP-as-required-runtime, and RAG-over-SQLite as the primary retrieval path (see design doc). Incomplete create/edit prompts must clarify required fields (including CC/Pasabuy/workflow fields) rather than inventing them. **Chat conversation** delete (thread / all history) is allowed and required.
