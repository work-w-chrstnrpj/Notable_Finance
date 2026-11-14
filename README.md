# Notable Finance

A local-first personal finance desktop app layered over a Notion workspace. Records live in a local SQLite database, so the app works fully offline, and Notion is kept in sync as a bidirectional mirror. It is a clean encoding, viewing, validation, and sync interface — not a replacement for Notion, but a much better daily driver on top of it.

The app is an Electron desktop app in `notable-finance-app/` (current version v3.0.0). Local SQLite is the working source of truth and Notion is a bidirectional mirror.

---

## What the app does

The app covers these sections and finance workflows:

**Sections**

| Section | Purpose |
|---|---|
| Dashboard | Month summary cards (income, expenses, savings, transactions) and account-position metrics |
| Accounts | Read-only view of active accounts — gallery/card and table views |
| Income | Record income entries; view by Daily / Weekly / Monthly |
| Expense | Record expense entries; view by Daily / Weekly / Monthly / Unpaid Pasabuy / To Pay / To Buy / Installments / CC Transactions |
| Monthly Monitoring | Budget vs. actual tracking across needs, wants, savings |
| Transfer | Record a fund transfer between accounts |
| Credit Card Payment | Record a credit card payment and link it to covered expenses |
| Alkansya | Record savings jar deposits |
| Borrowings | Record money you owe: borrowed and repayment entries against Borrow (Auxiliary) accounts, with a Borrowed Accounts view |
| Receivables | Money owed to you: Expected Income, Money Lent (Lend Money) and Pasabuy; print receipts |

CC Payment, Alkansya, Borrowings and Receivables can be hidden or shown from Settings → Sections.

**Core rules**

- Local SQLite is the working source of truth; Notion is a bidirectional mirror reconciled by sync (pull, push, pull) with conflict handling.
- Computed Notion fields (formulas, rollups, reverse relations) are read-only in all forms.
- Accounts, Income Categories, and Expense Categories are read-only reference data maintained in Notion.
- Incomes and expenses are **soft-deleted** — the title is rewritten to `[Deleted: Amount]` and the amount is cleared; records are never hard-deleted.
- Dashboard, Monitoring, Income, and Expense totals are calculated in app code from local records, not read from Notion's calculator formulas.
- The renderer never touches Notion secrets or calls Notion directly; the main process owns all data and side effects.

---

## Desktop App (`notable-finance-app/`)

**Stack:** Electron + electron-vite + React renderer. Local SQLite (`better-sqlite3` + Drizzle ORM) is the source of truth on the device. Notion is a bidirectional mirror — the app works fully offline and syncs on demand or on a configurable interval.

Current version: **v2.2.3** (see [`notable-finance-app/CHANGELOG.md`](notable-finance-app/CHANGELOG.md)).

### Architecture

```
notable-finance-app/
├── src/
│   ├── main/                  # Electron main process — owns ALL data and side effects
│   │   ├── index.ts           # App bootstrap, window lifecycle
│   │   ├── windows/           # BrowserWindow management (multi-window + in-window tabs)
│   │   ├── db/                # SQLite connection, Drizzle schema, migration runner
│   │   ├── domain/            # Finance validation, mapping, reporting, balance derivations
│   │   ├── notion/            # Notion adapter: client, property mapper, query, mutation
│   │   ├── sync/              # Reconcile engine, three-way merge, conflict detection,
│   │   │                      #   mutation queue, incremental cursor management
│   │   ├── chat/              # AI chat orchestrator, tools, skills, overlays
│   │   │   ├── skills/        # Finance-specific read/propose tools
│   │   │   └── overlays/      # Persona overlays (/roast, /cheer, /strict, /quiet, …)
│   │   ├── settings/          # App settings + OS keychain token access (safeStorage)
│   │   ├── updater/           # electron-updater (GitHub Releases)
│   │   ├── dev-logs/          # Structured dev-log persistence
│   │   └── ipc/               # IPC registrars (one per domain)
│   │       ├── index.ts       # 22-line composition root
│   │       ├── handle.ts      # handle() primitive
│   │       └── records.ts · sync.ts · notion.ts · chat.ts · settings.ts · updater.ts
│   ├── preload/
│   │   └── index.ts           # contextBridge — typed, allow-listed window.api surface
│   ├── renderer/
│   │   └── src/
│   │       ├── components/
│   │       │   ├── pages/     # One directory per section; index.tsx = composition only
│   │       │   │   ├── dashboard/   # Monthly summary + account metrics
│   │       │   │   ├── accounts/    # Read-only account cards/table
│   │       │   │   ├── income/      # Income CRUD + filters + bulk actions
│   │       │   │   ├── expense/     # Expense CRUD + 9 view modes + filters + bulk actions
│   │       │   │   ├── monitoring/  # Monthly budget tracking
│   │       │   │   ├── workflow/    # Transfer, CC Payment, Alkansya, Receivables
│   │       │   │   ├── chat/        # AI chat sidebar, history, message stream
│   │       │   │   ├── sync/        # Notion connect, schema verify, sync controls, conflict resolver
│   │       │   │   ├── settings/    # Appearance, AI config, backup/restore
│   │       │   │   └── history/     # Activity log, record diff modals
│   │       │   ├── layout/    # Workspace shell, side nav, top bar, online badge
│   │       │   ├── charts/    # Recharts wrappers
│   │       │   ├── fab/       # Floating action button
│   │       │   ├── export/    # Receipt printing, image export
│   │       │   └── ui/        # Shared UI primitives
│   │       ├── features/records/   # Shared record-page engine used by Income/Expense/Workflow
│   │       │   ├── use-record-selection.ts
│   │       │   ├── use-persisted-filters.ts
│   │       │   ├── use-record-search.ts
│   │       │   ├── use-optimistic-records.ts
│   │       │   ├── use-bulk-actions.ts
│   │       │   └── receipt.ts
│   │       ├── lib/           # window.api client wrapper, React Query hooks, router, contexts
│   │       ├── types/         # Re-exports from src/shared — no domain redefinitions here
│   │       └── assets/        # globals.css = @import list only; rules in base/layout/components/pages/
│   └── shared/                # Shared across main + renderer (no Node-only APIs)
│       ├── finance.types.ts   # Domain DTOs — single source of truth
│       ├── ipc-channels.ts    # IPC channel string constants
│       └── notion-formulas.ts # Pure formula functions (balances, installment amounts, etc.)
├── e2e/                       # Playwright + Electron end-to-end tests
├── test/                      # Vitest unit/integration tests (sync, domain, db)
├── scripts/                   # seed-dev.mjs, CSS verification tooling
├── drizzle.config.ts          # Drizzle migration config
├── electron.vite.config.ts    # Build config (main / preload / renderer)
└── electron-builder.yml       # Packaging config (mac / linux / windows)
```

### Process boundaries

| Process | Access | Role |
|---|---|---|
| **Main** | SQLite, filesystem, network, OS keychain | All data, all side effects, all IPC handlers |
| **Preload** | contextBridge only | Typed, allow-listed IPC surface (`window.api`) |
| **Renderer** | `window.api` calls, DOM | React UI — no Node, no DB, no Notion direct access |

### Desktop sync model

- **Offline-first:** every read/write works with no network.
- **Sync now (manual):** pull from Notion → reconcile → push local changes → pull again.
- **Auto sync:** configurable interval; online-gated.
- **Three-way merge:** base snapshot / local / remote — disjoint field edits auto-merge; same-field conflicts prompt the user in the Sync conflict resolver.
- **Sync-state badges:** unsynchronised records show "Not yet synced"; conflicted records show "Conflict".
- **Mutation queue:** dirty writes survive crashes; push retries with exponential backoff on HTTP 429.

### Desktop AI chat (Finance Copilot)

The Chat section is a BYOK (bring-your-own-key) AI assistant backed by the same Notion data:

- Reads: monthly summaries, budget status, expense breakdowns, account balances.
- Proposes: create/edit for income, expenses, and all workflow types — with a confirm step before any write.
- Refuses: finance-delete via chat; missing required fields trigger a clarification instead of an invented value.
- Persona overlays: `/default`, `/roast`, `/cheer`, `/strict`, `/quiet`.
- macOS stretch: Apple Intelligence read-only adapter via a bundled `fm-proxy` binary.

### Desktop development commands

Run from `notable-finance-app/`:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the app in development mode with HMR |
| `npm run build` | Build all processes (main, preload, renderer) |
| `npm run test` | Run Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Build + run Playwright end-to-end tests |
| `npm run lint` | Run ESLint (errors block CI) |
| `npm run typecheck` | TypeScript check for main and renderer |
| `npm run seed` | Seed dev accounts and categories (run the app once first) |
| `npm run rebuild` | Rebuild `better-sqlite3` for Electron's ABI |
| `npm run dist:mac` | Build + package macOS `.dmg` / `.zip` |
| `npm run dist:linux` | Build + package Linux `AppImage` |
| `npm run dist:win` | Build + package Windows NSIS installer |

### Running the desktop app for the first time

```bash
# From the repo root
pnpm install                               # installs all workspaces; approves native builds
pnpm --filter notable-finance-app rebuild  # compile better-sqlite3 for Electron's ABI
pnpm --filter notable-finance-app dev      # boots the window with HMR
pnpm --filter notable-finance-app seed     # OPTIONAL: seed dev accounts/categories
```

### Desktop packaging notes

- macOS builds are **unsigned** — right-click → Open once to pass Gatekeeper.
- Windows / Linux installers must be built on their respective OS (no cross-build tooling).
- Updates are distributed through GitHub Releases (`electron-updater`).
- Drizzle migration SQL is bundled as a resource and applied at startup in the packaged app.

---

## Repository layout

```
Notable Finance/
├── notable-finance-app/      # Desktop app (Electron + SQLite)
│   ├── src/                  # main / preload / renderer / shared
│   ├── e2e/                  # Playwright + Electron tests
│   ├── test/                 # Vitest unit/integration tests
│   └── package.json
├── wiki/
│   ├── shared/               # Product spec, finance glossary, Notion field mapping
│   └── desktop/              # Desktop architecture, sync/conflict, local schema, IPC, packaging
├── shared/                   # Future shared contracts and DTOs (not yet extracted)
├── tests/                    # Cross-cutting manual and automated tests
├── tickets/                  # Planning and investigation artifacts
├── scripts/                  # sync-ai-adapters.ps1 and other project scripts
├── .agents/                  # Canonical AI roles, skills, overlays, workflows, tool policies
└── .ai/                      # Context routing, maps, indexes for AI tooling
```

---

## Key documentation

| Document | Purpose |
|---|---|
| [`wiki/shared/product-specification.md`](wiki/shared/product-specification.md) | Product intent and acceptance criteria |
| [`wiki/desktop/borrowings.md`](wiki/desktop/borrowings.md) | Borrowings and Receivables behavior |
| [`wiki/desktop/desktop-architecture.md`](wiki/desktop/desktop-architecture.md) | Desktop architecture |
| [`wiki/desktop/development-plan.md`](wiki/desktop/development-plan.md) | Desktop phased development plan and status |
| [`wiki/desktop/project-structure.md`](wiki/desktop/project-structure.md) | Desktop project structure (detailed tree) |
| [`wiki/desktop/sync-and-conflict-design.md`](wiki/desktop/sync-and-conflict-design.md) | Three-way merge and conflict handling |
| [`wiki/desktop/local-data-schema.md`](wiki/desktop/local-data-schema.md) | SQLite schema and derived values |
| [`wiki/desktop/ipc-contract.md`](wiki/desktop/ipc-contract.md) | IPC channel contract (main ↔ renderer) |
| [`wiki/shared/notion-field-mapping.md`](wiki/shared/notion-field-mapping.md) | Canonical Notion field taxonomy |
| [`wiki/shared/finance-domain-glossary.md`](wiki/shared/finance-domain-glossary.md) | Finance domain term definitions |
| [`notable-finance-app/CHANGELOG.md`](notable-finance-app/CHANGELOG.md) | Desktop release history |
| [`AGENTS.md`](AGENTS.md) | AI agent operating rules for this repo |

---

## Core rules

- **Local SQLite is the working source of truth; Notion is the mirror.** Sync reconciles both with a three-way merge and surfaces conflicts.
- **The renderer must never contain Notion secrets** and must never call Notion directly.
- **The main process owns all Notion API access**, validation, field mapping, and sync.
- **Computed Notion fields are never editable** in normal user forms — formulas, rollups, reverse relations, and system-managed values are read-only.
- **Sync flow:** pull from Notion → push local changes to Notion → pull latest → refresh the UI from local data.
- **Soft-delete by default:** incomes and expenses are soft-deleted (title rewritten, amount cleared) unless hard delete is enabled in Settings.
- **Draft wiki files are not canonical.** Fold useful content into canonical pages, then remove the draft.
- **No secrets in commits.** Notion tokens and AI provider keys stay in the OS keychain, never in the repo.
