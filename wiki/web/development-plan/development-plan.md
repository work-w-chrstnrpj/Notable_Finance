# Development Plan

This folder contains the project development tracker for Notable Finance.

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

As of 2026-07-14, frontend and backend implementation have advanced with v0.2.0 release. On the backend, startup configuration validation, Passport JWT strategy, PostgreSQL metadata repository design, error normalization classes, and Winston structured logging were completed. The Next.js frontend foundation exists under `application/`. The NestJS backend foundation exists under `service/`, with `/api/v1` route modules, server-side configuration loading, field mapping, mutation validation, read-only reference endpoints, app-calculated dashboard/monthly monitoring responses, sync orchestration over a development Notion-shaped repository, and automated backend tests. Live Notion API writes, live schema verification, PostgreSQL metadata persistence, and production auth hardening remain in progress or blocked on external configuration/access. Recent frontend changes include expense view filter validation updates, filter UI refactoring to collapsible toolbar rows, print receipt support for Receivables, useApiQuery stale-while-revalidate fix, and toast notification position move to top-right. See [release-memo-v0.2.0.md](release-memo-v0.2.0.md) for detailed release notes.

| Workstream | Total Rows | Not Started | In Progress | Implemented | Blocked | Needs Decision | Deferred |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Frontend | 17 | 0 | 14 | 3 | 0 | 0 | 0 |
| Backend | 21 | 0 | 8 | 11 | 2 | 0 | 0 |
| Integration | 19 | 19 | 0 | 0 | 0 | 0 | 0 |
| Testing | 17 | 17 | 0 | 0 | 0 | 0 | 0 |

Frontend status detail: 3 `Implemented`, 14 `In Progress`.
Backend status detail: 11 `Implemented`, 8 `In Progress`, 2 `Blocked`.

## Resolved Decisions

- Authentication should support email sign-in and Google sign-in so other people can use the app.
- Accounts, Income Categories, and Expense Categories are maintained in Notion only. The app queries them as read-only reference/configuration data and does not expose add, edit, or delete flows for them.
- Destructive testing will use a duplicated Notion space provided by the project owner.
- Real Next.js and NestJS code should be created only when the user explicitly says to implement.
- PostgreSQL is the primary durable metadata store, using Neon Free as the planned provider while the app remains within free-tier limits.
- Redis is optional for cache, rate limits, short-lived sessions, or queue coordination if implementation needs it.
- Sync starts by pulling from Notion, then writes updates, then pulls fresh Notion data again.
- Schema verification should be available through a button after the Notion integration key is configured.
- Recommended test tooling is ESLint, TypeScript, Vitest, React Testing Library, Jest or Vitest for NestJS depending on scaffold defaults, Supertest, and Playwright.
- Planned deployment targets are Vercel for the frontend and Render for the backend, with switchable local development and local production-style environment configuration.
- Primary app sections are Dashboard, Accounts, Income, Expense, Monthly Monitoring, Transfer, Credit Card Payment, Alkansya, and Receivables.
- Monthly Monitoring is in app scope as a read-focused monitoring section, but app reports should be calculated from scoped Income and Expense records rather than from Notion Monthly Monitoring formulas/rollups.
- Accounts show active accounts by default and support gallery/card plus table views.
- Accounts do not show the month selector because account balance snapshots by month are out of app scope.
- Normal Income forms hide transaction-only fields and exclude auxiliary income categories such as `IOU`, `Transfer`, `Old Income Logger`, `Credit Card Payment`, and `Debt Payment`.
- Income shows the month selector only for Monthly view. Daily, Weekly, and Annually use current-date/current-period scope.
- Normal Income displays hide `Transaction Amount`, show `Capital Expenditure`, and calculate `Net Income` in the app from gross income less capital expenditure.
- Expense forms adapt to selected account, category, and view; credit-card fields appear only for `Credit Account` or `BYPL`, and Pasabuy fields appear only for Unpaid Pasabuy/category flows.
- Expense supports Daily, Weekly, Monthly, Unpaid Pasabuy, To pay, To buy, Installments, and CC Transactions. Annually is intentionally removed from Expense scope.
- Expense shows the month selector only for Monthly view, and Monthly Expense reporting uses `Purchase Date` as its month anchor.
- Expense filters include All, W/out Pasabuy, and specific categories; Unpaid Pasabuy can be filtered by `Pasabuyer`.
- Dashboard, Monthly Monitoring, Income, Expense, and category reporting calculate derivable selected-month values in app/shared source code from scoped Notion records. Notion Monthly Monitoring, Income Category, and Expense Category formulas/rollups are not used as historical reporting APIs.
- Transfer and Credit Card Payment are Monthly workflows with fixed, non-editable category values and account selectors filtered by payment context.
- Alkansya uses the `Savings` category with negative amount values for now.
- Receivables use normal Income-style fields and move to Income logs when a receiving account is selected.

## Remaining Planning Work

- Continue backend implementation by replacing the in-memory Notion-shaped development repository with the live Notion adapter once integration credentials and duplicated Notion workspace access are available.
- Wire the UI/API contract so the month selector appears only where it changes query scope; keep Accounts and Categories as read-only app resources; calculate Dashboard, Monthly Monitoring, and category reporting from scoped records instead of Notion calculator formulas.
- Wire the frontend mock DTO surfaces to backend `/api/v1` contracts as those endpoints are implemented.
- Choose exact compact list-view fields versus detail-view fields after the first UI wireframe pass.
- Confirm live Notion category IDs and relation mappings when backend integration starts.
- Document access details for the duplicated Notion space when it is available.
- Expand Playwright and manual QA coverage after backend contracts are available.

Use the workbook as a gate tracker. A row should move to `Implemented` only when its acceptance criteria are verified and evidence is listed. Do not start implementation rows while required upstream decisions or access are blocked.

> Last updated: 2026-07-14 — reflects current codebase state

Documentation-only verification for this update:

```powershell
rg -n "\\[Project Name\\]|\\[State the project goal here\\.\\]|Suggested Sections|intended to" AGENTS.md wiki
Get-ChildItem -Recurse wiki -Filter *-draft.md
```
