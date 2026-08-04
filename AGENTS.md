# Project Agent Rules

Source of product and technical intent: `wiki/web/tdd/tdd.md` and `wiki/shared/product-specification.md` (full web feature detail in `wiki/web/product-specification/product-specification.md`). The local-first desktop app's intent lives under `wiki/desktop/`. Source files remain the final implementation truth once application code exists.

Agents working in this repository must keep implementation and documentation changes aligned with the project goal:

```text
Build a finance UI application where Notion remains the source of truth. The app is an encoding and viewing layer for Dashboard, Accounts, Income, Expense, Monthly Monitoring, Transfer, Credit Card Payment, Alkansya, Receivables, and supporting Notion category/scheduler workflows. Users can create, edit, delete, view, and sync financial records through the app while computation-heavy Notion fields stay hidden from normal forms.
```

## Project Overview

Notable Finance is a personal finance application planned around an existing Notion workspace. Notion remains the canonical store for financial records. The app provides a cleaner UI for day-to-day encoding, viewing, validation, and synchronization across these database groups:

- Accounts
- Income Categories
- Incomes
- Expense Categories
- Expenses
- Transactions
- Expense Scheduler
- Monthly Monitoring

The main app sections are Dashboard, Accounts, Income, Expense, Monthly Monitoring, Transfer, Credit Card Payment, Alkansya, and Receivables. The main workflows are viewing current finance data, entering income, transaction, expense, and scheduled expense records, editing records, deleting records according to the project deletion policy, managing account/category basics, and running a sync flow that pulls from Notion first, writes app changes to Notion, pulls the latest Notion data again, and refreshes the UI from the Notion state.

## Detected Tech Stack

The repository is a monorepo hosting two apps. `notable-finance-web/` is the implemented web app (Next.js frontend + NestJS backend) where Notion is the source of truth. `notable-finance-app/` is the planned local-first desktop app (Electron; local SQLite is the source of truth and Notion is a bidirectional mirror). The two apps share the same finance domain and business logic.

- Application/runtime: Next.js frontend under `notable-finance-web/application/`.
- Service/API layer: NestJS backend service under `notable-finance-web/service/` for Notion integration, validation, sync, and schema checks.
- Desktop (implemented): Electron + local SQLite (better-sqlite3 / Drizzle) under `notable-finance-app/`; design specified in `wiki/desktop/`. Verified by ESLint (errors block CI), TypeScript, Vitest (main + renderer) and Playwright.
- Data store: Notion is the canonical finance data store. PostgreSQL is the primary durable app metadata store for sync logs, sessions if needed, conflicts, pending mutations, audit events, and snapshots. Use Neon Free as the planned PostgreSQL provider while the app remains within free-tier limits. Redis is optional for cache, rate limits, short-lived sessions, or queue coordination if implementation needs it.
- Testing: Recommended tooling is ESLint, TypeScript, Vitest, React Testing Library, Jest or Vitest for NestJS depending on scaffold defaults, Supertest, Playwright, and manual verification against a duplicated Notion space.
- Deployment: Planned targets are Vercel for the frontend, Render for the backend, and Neon Free for PostgreSQL app metadata storage. Must use server-side secret management and never expose Notion secrets in frontend code.

## Repository Map

Update this map whenever the project structure changes.

- `notable-finance-web/`: the web app (Notion is source of truth). Self-contained with its own `package.json` (run web commands here or via `--prefix`). Contains:
  - `notable-finance-web/application/`: user-facing finance UI (Next.js).
  - `notable-finance-web/service/`: backend API, Notion adapter boundary, validation, sync, auth shell, and integration logic (NestJS).
- `notable-finance-app/`: the local-first desktop app (Electron; local SQLite is source of truth, Notion is a bidirectional mirror). Implemented and shipping. Layout after the v2.0.0 refactor — see [`wiki/desktop/project-structure.md`](wiki/desktop/project-structure.md) for the full tree:
  - `src/main/`: owns all data and side effects (`db/`, `domain/`, `notion/`, `sync/`, `chat/`, `settings/`, `updater/`). `src/main/ipc/` is one registrar per domain behind a 22-line composition root, registering via the `handle()` primitive.
  - `src/preload/`: the sole contextBridge, exposing an allow-listed `window.api`.
  - `src/renderer/src/`: React UI. `components/pages/` holds one directory per page with `index.tsx` as composition only; `features/records/` is the shared record-page engine (selection, persisted filters, search, optimistic writes, bulk actions, receipts) used by Income/Expense/Workflow.
  - `src/shared/`: `finance.types.ts` (domain DTOs; the renderer re-exports, never redefines) and `ipc-channels.ts` (single source of truth for request/response channel strings).
  - Styles: `assets/globals.css` is an `@import` list only; rules live in `assets/{base,layout,components,pages}/` and component-local `*.module.css`.
- `wiki/`: shared-root documentation with three zones — `wiki/shared/` (product spec, finance glossary, Notion field mapping), `wiki/web/` (web-specific: API, database, deployment, tdd, testing, development plan, diagrams), and `wiki/desktop/` (desktop architecture, sync/conflict, local schema, IPC, offline, onboarding, security, packaging, testing, plan).
- `shared/`: future shared contracts, DTOs, schemas, constants, and formatting helpers.
- `tests/`: cross-cutting manual and automated tests.
- `tickets/`: planning or task artifacts.
- `.agents/`: canonical reusable AI roles, skills, overlays, workflows, and tool policies.
- `.ai/`: context routing, maps, prompt recipes, and generated-index guidance.
- Tool adapters: `.claude/`, `.codex/`, `.cursor/`, `.github/`, `.opencode/`, and other generated folders expose canonical assets in each tool's expected format.

## Core Operating Rules

- Prefer project wiki pages as the source of product intent.
- Prefer exact source files as the source of implementation truth after code exists.
- Use maps, indexes, graphs, and summaries only for discovery.
- Read exact files before changing them.
- Make small, reviewable edits that follow the project structure.
- Run relevant verification before claiming success.
- Ask for approval before destructive, high-risk, production, secret, or migration operations.
- Do not implement application code while the current task is documentation/planning only.
- Create real Next.js and NestJS application code only when the user explicitly asks to implement.

## Product Rules

- Notion is the source of truth for finance records.
- The app is an encoding, viewing, validation, and sync interface over Notion.
- The frontend must never call Notion directly and must never contain Notion secrets.
- Computed Notion fields, formulas, rollups, reverse relations, and system-managed values must not be editable in normal user forms.
- Create, edit, and delete operations must write through the backend to Notion.
- Sync starts by pulling from Notion, then app changes write through the backend to Notion, then the app pulls the latest Notion data again and refreshes UI state from that response.
- Sync must support both direct-save form submissions and explicit queued changes through a Sync button.
- Authentication must support email sign-in and Google sign-in so the app can be used by other people.
- The app should provide a schema verification button after the Notion integration key is configured.
- Canonical mapping docs must preserve live Notion select labels exactly, even when labels are awkward. UI labels may be context-friendly when they remain obvious and close to the original Notion meaning.
- Normal Income forms must not expose transaction-only fields such as `Transacted Account` or `CC Payment Covered`.
- Normal Income category choices must exclude auxiliary income categories currently used for workflows such as `IOU`, `Transfer`, `Old Income Logger`, `Credit Card Payment`, and `Debt Payment`.
- Normal Accounts views must show active accounts only by default, with gallery/card and table views.
- Accounts are read-only app resources by default and remain maintained in Notion; account creation/editing may be revisited only if the product spec changes.
- Expense forms must adapt fields based on selected account and category; credit-card fields appear only for `Credit Account` or `BYPL`, and Pasabuy fields appear only for Pasabuy workflows.
- Delete behavior is resource-specific: incomes and expenses are soft-deleted by rewriting the title to include `[Deleted: Amount]` and clearing the amount; accounts, income categories, and expense categories are read-only app resources and have no normal app delete endpoint.

## Documentation Rules

- Keep `wiki/web/tdd/tdd.md` canonical for web technical intent, and `wiki/desktop/` canonical for the desktop app's technical design.
- Keep `wiki/shared/product-specification.md` canonical for shared product behavior and acceptance criteria, with `wiki/web/product-specification/product-specification.md` for full web feature detail. Shared finance domain terms live in `wiki/shared/finance-domain-glossary.md` and the canonical Notion field taxonomy in `wiki/shared/notion-field-mapping.md`.
- Update API, data, diagram, testing, deployment, and project-structure wiki pages when behavior or architecture changes.
- If work is tracked in `wiki/web/development-plan/development-plan.md` (web) or `wiki/desktop/development-plan.md` (desktop), update the matching status.
- Draft wiki files with `-draft` in the name are not canonical. Fold useful content into canonical pages, then remove the draft file.

## Security Rules

- Do not commit secrets, tokens, private keys, credentials, or production configuration.
- Do not log sensitive input, provider responses, credentials, Notion tokens, or private user data.
- Validate input at trust boundaries.
- Prefer least privilege for accounts, tokens, services, and automation.
- Store Notion tokens only in backend environment variables or encrypted server-side storage.
- Redact sensitive finance payloads from production logs.

## Git And PR Rules

- Check repository status before major edits when Git metadata is available.
- Do not revert user changes unless explicitly asked.
- Keep commits scoped and explain verification in PR notes.
- Avoid force push, reset, clean, or destructive history operations without explicit approval.

## Canonical AI Structure

Canonical reusable AI assets live in `.agents/`:

- `.agents/roles/`: 8 role owners.
- `.agents/skills/`: reusable workflow skills only.
- `.agents/overlays/`: Mentor and Coach overlays.
- `.agents/workflows/`: multi-role workflows.
- `.agents/tools/`: context, verification, adapter, and tool policies.

Tool-specific folders are generated adapters, not source of truth. Update canonical files first, then run `scripts/sync-ai-adapters.ps1` when role, skill, overlay, workflow, or adapter content changes.

## Overlay Usage

Use overlays to change response style without changing work ownership.

Examples:

- `Mentor ELI12: Explain this architecture.`
- `Coach: Critique this plan.`
- `Backend & Database Engineer + Mentor: Explain this API design.`
- `System Architect + Coach: Challenge this architecture proposal.`

## AI Role Usage Guide

Portable role prompts live in `.agents/roles/`. Tool-specific generated adapters live under `.claude/agents/`, `.codex/agents/`, `.cursor/rules/`, `.github/agents/`, and `.opencode/agents/`.

- System Architect: architecture, module boundaries, dataflow, and technical risk.
- Product & Planning Manager: requirements, acceptance criteria, task breakdown, dependencies, and progress coordination.
- Frontend UI/UX Developer: UI, routing, state, accessibility, client behavior, and frontend tests.
- Backend & Database Engineer: APIs, services, validation, auth, persistence, integrations, jobs, queues, and data ingestion.
- DevOps Engineer: CI/CD, deployment, runtime config, automation operations, monitoring, and releases.
- Security Engineer: secrets, auth, authorization, dependency risk, unsafe inputs, logging, and sensitive workflows.
- SQA Engineer: test plans, manual cases, automated tests, regressions, acceptance verification, and bug reports.
- Technical Documentation Specialist: README, API docs, setup, onboarding, operations notes, workflows, integration docs, and changelog docs.

## Skill Usage Guide

Create or keep a standalone skill only when it defines a reusable workflow with clear inputs, steps, boundaries, and outputs.

Do not create standalone skills for every role capability. Put domain-specific capability guidance inside the owning role file under `Embedded Capability Playbooks`.

Reusable skills live in `.agents/skills/`. Tool-specific skill copies are generated for Claude, Cursor, GitHub Copilot, OpenCode, and Windsurf; Codex and Antigravity use `.agents/skills/` directly. Choose the smallest skill that matches the task, then read exact source files before editing.

## Verification Commands

Web app verification commands (run from the repository root, or drop the `notable-finance-web/` prefix when run from inside `notable-finance-web/`, which now holds the web `package.json`):

- Frontend lint command: `npm --prefix notable-finance-web/application run lint`.
- Frontend typecheck command: `npm --prefix notable-finance-web/application run typecheck`.
- Frontend test command: `npm --prefix notable-finance-web/application run test`.
- Frontend build command: `npm --prefix notable-finance-web/application run build`.
- Backend typecheck command: `npm --prefix notable-finance-web/service run typecheck`.
- Backend test command: `npm --prefix notable-finance-web/service run test`.
- Backend build command: `npm --prefix notable-finance-web/service run build`.
- Desktop app commands: TBD until `notable-finance-app/` is scaffolded (planned: pnpm workspace, electron-vite, Vitest + Playwright/Electron e2e).
- E2E command: TBD after project scaffolding.
- Documentation-only verification: inspect updated Markdown, run draft cleanup search, and confirm no source code was created.
