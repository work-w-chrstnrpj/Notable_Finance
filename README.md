# Notable Finance

A personal finance application layered over a Notion workspace. Notion is the canonical store for all financial records. The app is a clean encoding, viewing, validation, and sync interface — not a replacement for Notion, but a much better daily driver on top of it.

This monorepo ships **two apps** that share the same finance domain and product intent:

| App | Directory | Source of truth | Status |
|---|---|---|---|
| **Web** (Next.js + NestJS) | `notable-finance-web/` | Notion | v1.1.0 — implemented |
| **Desktop** (Electron + SQLite) | `notable-finance-app/` | Local SQLite; Notion is a bidirectional mirror | v2.2.3 — implemented and shipping |

---

## What the app does

Both apps cover the same sections and finance workflows:

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
| Receivables | Record amounts owed by others; print receipts |

**Core rules that hold for both apps**

- Notion is the canonical finance data store. The app never bypasses it.
- Computed Notion fields (formulas, rollups, reverse relations) are read-only in all forms.
- Accounts, Income Categories, and Expense Categories are read-only reference data maintained in Notion.
- Incomes and expenses are **soft-deleted** — the title is rewritten to `[Deleted: Amount]` and the amount is cleared; records are never hard-deleted.
- Dashboard, Monitoring, Income, and Expense totals are calculated in app code from local records, not read from Notion's calculator formulas.
- The frontend/renderer never touches Notion secrets or calls Notion directly.

---

## Web App (`notable-finance-web/`)

**Stack:** Next.js 14 (App Router) frontend + NestJS backend service. Notion is the source of truth — every read and write goes through the backend to Notion.

### Architecture

```
notable-finance-web/
├── application/          # Next.js frontend (App Router)
│   └── src/
│       ├── app/
│       │   ├── [section]/    # Single catch-all route renders the active section
│       │   ├── login/        # Email sign-in
│       │   ├── register/     # User registration
│       │   └── notion-connect/  # Integration key setup
│       ├── components/
│       │   ├── pages/        # One component per section (dashboard, income, expense, workflow, …)
│       │   ├── layout/       # Workspace shell, navigation
│       │   ├── charts/       # Recharts wrappers
│       │   ├── export/       # Receipt / export UI
│       │   ├── fab/          # Floating action button
│       │   └── ui/           # Shared primitives
│       ├── lib/              # API client (calls /api/v1), query hooks, auth utils
│       └── types/            # Shared finance DTOs
└── service/              # NestJS backend service
    └── src/
        ├── accounts/         # Read-only accounts resource
        ├── incomes/          # Writable incomes
        ├── expenses/         # Writable expenses
        ├── expense-scheduler/
        ├── transactions/     # Transfer / CC Payment / Alkansya / Receivables
        ├── income-categories/
        ├── expense-categories/
        ├── monthly-monitoring/
        ├── dashboard/        # Computed summaries
        ├── sync/             # Pull from Notion, push app changes, re-pull
        ├── conflict/         # Field-level conflict resolution
        ├── schema-drift/     # Schema verification endpoint
        ├── notion/           # Notion API adapter (client, property mapper)
        ├── mapping/          # Field classification (writable vs. read-only vs. computed)
        ├── validation/       # Input validation and mutation guards
        ├── auth/             # Passport JWT strategy, email + Google sign-in
        ├── users/            # User management
        ├── database/         # PostgreSQL (Neon Free) for app metadata
        └── logging/          # Winston structured logging
```

### Web sync flow

1. Pull from Notion → populate/update local state.
2. App changes write through the backend to Notion.
3. Pull latest Notion data again → refresh UI from the pulled Notion state.

The Sync Center page supports both direct-save form submissions and an explicit queued-changes Sync button.

### Web development commands

Run from `notable-finance-web/` (the web root with its own `package.json`):

| Command | Purpose |
|---|---|
| `npm run bootstrap` | Install frontend and backend dependencies |
| `npm run dev` | Start frontend and backend development servers together |
| `npm run dev:frontend` | Start the Next.js frontend dev server only |
| `npm run dev:backend` | Start the NestJS backend in watch mode only |
| `npm run build` | Build frontend and backend for deployment |
| `npm run start:frontend` | Start the built frontend |
| `npm run start:backend` | Start the built backend from `service/dist` |
| `npm run lint` | Run frontend and backend lint checks |
| `npm run typecheck` | Run frontend and backend TypeScript checks |
| `npm run test` | Run frontend and backend tests |
| `npm run verify` | Lint + typecheck + test (full CI gate) |

### Web environment setup

```bash
cp notable-finance-web/service/.env.example notable-finance-web/service/.env
# Fill in NOTION_TOKEN, NOTION_DATABASE_IDs, DATABASE_URL (Neon), JWT_SECRET, etc.
```

Never commit `.env`, Notion tokens, database credentials, or any provider secrets.

### Web deployment targets

- **Frontend:** Vercel
- **Backend:** Render
- **App metadata DB:** Neon Free (PostgreSQL)

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
├── notable-finance-web/      # Web app (Next.js frontend + NestJS backend)
│   ├── application/          # Next.js frontend
│   ├── service/              # NestJS backend service
│   └── package.json          # Web root — run web commands here
├── notable-finance-app/      # Desktop app (Electron + SQLite)
│   ├── src/                  # main / preload / renderer / shared
│   ├── e2e/                  # Playwright + Electron tests
│   ├── test/                 # Vitest unit/integration tests
│   └── package.json
├── wiki/
│   ├── shared/               # Product spec, finance glossary, Notion field mapping
│   ├── web/                  # Web TDD, API docs, database, deployment, development plan
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
| [`wiki/shared/product-specification.md`](wiki/shared/product-specification.md) | Shared product intent (both apps) |
| [`wiki/web/product-specification/product-specification.md`](wiki/web/product-specification/product-specification.md) | Full web feature specification |
| [`wiki/web/tdd/tdd.md`](wiki/web/tdd/tdd.md) | Web technical design document |
| [`wiki/desktop/desktop-architecture.md`](wiki/desktop/desktop-architecture.md) | Desktop architecture |
| [`wiki/desktop/development-plan.md`](wiki/desktop/development-plan.md) | Desktop phased development plan and status |
| [`wiki/desktop/project-structure.md`](wiki/desktop/project-structure.md) | Desktop project structure (detailed tree) |
| [`wiki/desktop/sync-and-conflict-design.md`](wiki/desktop/sync-and-conflict-design.md) | Three-way merge and conflict handling |
| [`wiki/desktop/local-data-schema.md`](wiki/desktop/local-data-schema.md) | SQLite schema and derived values |
| [`wiki/desktop/ipc-contract.md`](wiki/desktop/ipc-contract.md) | IPC channel contract (main ↔ renderer) |
| [`wiki/shared/notion-field-mapping.md`](wiki/shared/notion-field-mapping.md) | Canonical Notion field taxonomy |
| [`wiki/shared/finance-domain-glossary.md`](wiki/shared/finance-domain-glossary.md) | Finance domain term definitions |
| [`notable-finance-app/CHANGELOG.md`](notable-finance-app/CHANGELOG.md) | Desktop release history |
| [`CHANGELOG.md`](CHANGELOG.md) | Web release history |
| [`AGENTS.md`](AGENTS.md) | AI agent operating rules for this repo |

---

## Core rules

- **Notion is the canonical finance data store.** The app never replaces or bypasses it.
- **The frontend/renderer must never contain Notion secrets** and must never call Notion directly.
- **The backend/main process owns all Notion API access**, validation, field mapping, and sync.
- **Computed Notion fields are never editable** in normal user forms — formulas, rollups, reverse relations, and system-managed values are read-only.
- **Sync flow:** pull from Notion → write app changes to Notion → pull latest → refresh UI from pulled data.
- **Soft-delete only:** incomes and expenses are never hard-deleted; title is rewritten and amount is cleared.
- **Draft wiki files are not canonical.** Fold useful content into canonical pages, then remove the draft.
- **No secrets in commits.** Notion tokens, database credentials, JWT secrets, and provider keys stay in environment variables and the OS keychain.
