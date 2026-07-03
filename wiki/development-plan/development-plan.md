# Development Plan

This folder contains the project development tracker for Notion Finance.

Primary tracker:

- [notion-finance-development-plan.xlsx](notion-finance-development-plan.xlsx)

The Excel workbook is the execution plan. It uses one overview sheet plus four workstream sheets:

- `frontend-dev-plan`
- `backend-dev-plan`
- `integration-dev-plan`
- `testing-dev-plan`

## Tracker Fields

Each workstream sheet includes:

| Field | Purpose |
| --- | --- |
| `ID` | Stable work item identifier. |
| `Priority` | Delivery priority from `P0` through `P3`. |
| `Phase` | Planning, foundation, MVP read, MVP write, hardening, or release. |
| `Epic` | Grouping for related work. |
| `Work Item` | Specific task to complete. |
| `Owner Role` | Primary role or roles responsible for the work. |
| `Dependencies` | Required upstream decisions, tasks, access, or contracts. |
| `Acceptance Criteria` | The condition that must be true before the row can be called complete. |
| `Status` | Current implementation state. |
| `Blocked / Decision Needed` | Reason the row cannot proceed or the decision still required. |
| `Verification / Evidence` | How completion should be proven. |
| `Source Docs` | Canonical project documents that justify the row. |
| `Notes` | Practical cautions, constraints, or implementation guidance. |
| `Last Updated` | Last planning update date. |

## Status Legend

| Status | Meaning |
| --- | --- |
| `Not Started` | Planned but not yet started. |
| `In Progress` | Actively being worked. |
| `Implemented` | Complete and verified for the phase. |
| `Blocked` | Waiting on access, dependency, or external action. |
| `Needs Decision` | Requires a product, security, architecture, or delivery choice. |
| `Deferred` | Intentionally postponed out of the current slice. |

## Current Summary

As of 2026-07-03, frontend implementation has started because implementation was explicitly requested. The Next.js frontend foundation now exists under `application/`, with app routing, a workspace shell, typed mock DTOs, frontend field-visibility rules, a backend API client boundary, and initial rule tests. Backend, integration, and testing workstreams remain unstarted.

| Workstream | Total Rows | Not Started | Blocked | Needs Decision |
| --- | ---: | ---: | ---: | ---: |
| Frontend | 17 | 0 | 0 | 0 |
| Backend | 21 | 21 | 0 | 0 |
| Integration | 19 | 19 | 0 | 0 |
| Testing | 17 | 17 | 0 | 0 |

Frontend status detail: 3 `Implemented`, 14 `In Progress`.

## Resolved Decisions

- Authentication should support email sign-in and Google sign-in so other people can use the app.
- Account delete marks the account inactive through `Inactive`; account records are not physically deleted.
- Destructive testing will use a duplicated Notion space provided by the project owner.
- Real Next.js and NestJS code should be created only when the user explicitly says to implement.
- PostgreSQL is the primary durable metadata store, using Neon Free as the planned provider while the app remains within free-tier limits.
- Redis is optional for cache, rate limits, short-lived sessions, or queue coordination if implementation needs it.
- Sync starts by pulling from Notion, then writes updates, then pulls fresh Notion data again.
- Schema verification should be available through a button after the Notion integration key is configured.
- Recommended test tooling is ESLint, TypeScript, Vitest, React Testing Library, Jest or Vitest for NestJS depending on scaffold defaults, Supertest, and Playwright.
- Planned deployment targets are Vercel for the frontend and Render for the backend, with switchable local development and local production-style environment configuration.
- Primary app sections are Dashboard, Accounts, Income, Expense, Monthly Monitoring, Transfer, Credit Card Payment, Alkansya, and Receivables.
- Monthly Monitoring is in app scope as a read-focused monitoring section.
- Accounts show active accounts by default and support gallery/card plus table views.
- Normal Income forms hide transaction-only fields and exclude auxiliary income categories such as `IOU`, `Transfer`, `Old Income Logger`, `Credit Card Payment`, and `Debt Payment`.
- Expense forms adapt to selected account, category, and view; credit-card fields appear only for `Credit Account` or `BYPL`, and Pasabuy fields appear only for Pasabuy flows.
- Transfer and Credit Card Payment are Monthly workflows with fixed, non-editable category values.

## Remaining Planning Work

- Wire the frontend mock DTO surfaces to backend `/api/v1` contracts as those endpoints are implemented.
- Choose exact compact list-view fields versus detail-view fields after the first UI wireframe pass.
- Confirm final Alkansya backing view during implementation discovery.
- Document access details for the duplicated Notion space when it is available.
- Expand Playwright and manual QA coverage after backend contracts are available.

Use the workbook as a gate tracker. A row should move to `Implemented` only when its acceptance criteria are verified and evidence is listed. Do not start implementation rows while required upstream decisions or access are blocked.

Documentation-only verification for this update:

```powershell
rg -n "\\[Project Name\\]|\\[State the project goal here\\.\\]|Suggested Sections|intended to" AGENTS.md wiki
Get-ChildItem -Recurse wiki -Filter *-draft.md
```
