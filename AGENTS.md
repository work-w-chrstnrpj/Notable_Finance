# Project Agent Rules

Source of product and technical intent: `wiki/tdd/tdd.md` and `wiki/product-specification/product-specification.md`. Source files remain the final implementation truth once application code exists.

Agents working in this repository must keep implementation and documentation changes aligned with the project goal:

```text
Build a finance UI application where Notion remains the source of truth. The app is an encoding and viewing layer for Dashboard, Accounts, Income, Expense, Monthly Monitoring, Transfer, Credit Card Payment, Alkansya, Receivables, and supporting Notion category/scheduler workflows. Users can create, edit, delete, view, and sync financial records through the app while computation-heavy Notion fields stay hidden from normal forms.
```

## Project Overview

Notion Finance is a personal finance application planned around an existing Notion workspace. Notion remains the canonical store for financial records. The app provides a cleaner UI for day-to-day encoding, viewing, validation, and synchronization across these database groups:

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

Implementation has not started. The selected application stack is Next.js for the frontend and NestJS for the backend.

- Application/runtime: Next.js.
- Service/API layer: NestJS backend service for Notion integration.
- Data store: Notion is the canonical finance data store. PostgreSQL is the primary durable app metadata store for sync logs, sessions if needed, conflicts, pending mutations, audit events, and snapshots. Use Neon Free as the planned PostgreSQL provider while the app remains within free-tier limits. Redis is optional for cache, rate limits, short-lived sessions, or queue coordination if implementation needs it.
- Testing: Recommended tooling is ESLint, TypeScript, Vitest, React Testing Library, Jest or Vitest for NestJS depending on scaffold defaults, Supertest, Playwright, and manual verification against a duplicated Notion space.
- Deployment: Planned targets are Vercel for the frontend, Render for the backend, and Neon Free for PostgreSQL app metadata storage. Must use server-side secret management and never expose Notion secrets in frontend code.

## Repository Map

Update this map whenever the project structure changes.

- `application/`: future user-facing finance UI.
- `service/`: future backend API, Notion adapter, validation, sync, auth, and integration logic.
- `shared/`: future shared contracts, DTOs, schemas, constants, and formatting helpers.
- `tests/`: cross-cutting manual and automated tests.
- `tickets/`: planning or task artifacts.
- `wiki/`: project intent, product specification, technical design, data model, diagrams, API, testing, deployment, and operating docs.
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
- Account creation forms must adapt fields based on `Account Type`; credit-card fields are shown only for `Credit Account` and `BYPL` style accounts.
- Expense forms must adapt fields based on selected account and category; credit-card fields appear only for `Credit Account` or `BYPL`, and Pasabuy fields appear only for Pasabuy workflows.
- Delete behavior is resource-specific: incomes and expenses are soft-deleted by rewriting the title to include `[Deleted: Amount]` and clearing the amount; income categories and expense categories are deleted; accounts are marked inactive by setting `Inactive` and are not physically deleted.

## Documentation Rules

- Keep `wiki/tdd/tdd.md` canonical for technical intent.
- Keep `wiki/product-specification/product-specification.md` canonical for product behavior and acceptance criteria.
- Update API, data, diagram, testing, deployment, and project-structure wiki pages when behavior or architecture changes.
- If work is tracked in `wiki/development-plan/development-plan.md`, update the matching status.
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

Application verification commands are not available yet because implementation has not started.

- Lint command: TBD after project scaffolding.
- Typecheck command: TBD after project scaffolding.
- Test command: TBD after project scaffolding.
- Build command: TBD after project scaffolding.
- E2E command: TBD after project scaffolding.
- Documentation-only verification: inspect updated Markdown, run draft cleanup search, and confirm no source code was created.
