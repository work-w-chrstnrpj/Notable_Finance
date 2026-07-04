# Notion Finance

Notion Finance is a planned finance UI application where Notion remains the source of truth. The app will provide a cleaner encoding, viewing, validation, and sync experience over an existing Notion finance workspace.

## Scope

The planned app covers these Notion-backed workflows:

- Accounts
- Income Categories
- Incomes
- Transactions
- Expense Categories
- Expenses
- Expense Scheduler

Monthly Monitoring is not shown in the app. Users should be able to create, edit, delete, view, and sync supported finance records through the app. Computation-heavy Notion fields should stay hidden from normal forms and appear only as read-only values where useful.

## Current Status

This repository now contains a Next.js frontend in `application/` and a NestJS backend service in `service/`.

## Development Commands

Run these commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run bootstrap` | Install frontend and backend dependencies. |
| `npm run deps:frontend` | Install only frontend dependencies. |
| `npm run deps:backend` | Install only backend dependencies. |
| `npm run dev:frontend` | Start the Next.js frontend development server. |
| `npm run dev:frontent` | Alias for `dev:frontend` to match the common typo. |
| `npm run dev:backend` | Start the NestJS backend service in watch mode. |
| `npm run dev:service` | Alias for `dev:backend`. |
| `npm run dev` | Start frontend and backend development servers together. |
| `npm run build:frontend` | Build the frontend for deployment. |
| `npm run build:backend` | Build the backend service for deployment. |
| `npm run build` | Build frontend and backend. |
| `npm run start:frontend` | Start the built frontend with Next.js. |
| `npm run start:backend` | Start the built backend service from `service/dist`. |
| `npm run lint` | Run frontend and backend lint checks. |
| `npm run typecheck` | Run frontend and backend TypeScript checks. |
| `npm run test` | Run frontend and backend tests. |
| `npm run verify` | Run lint, typecheck, and test for both projects. |

Read these first:

- `wiki/product-specification/product-specification.md`
- `wiki/tdd/tdd.md`
- `wiki/project-structure/project-structure.md`
- `wiki/development-plan/development-plan.md`
- `AGENTS.md`

## Core Rules

- Notion is the canonical finance data store.
- The frontend must never contain Notion secrets.
- The backend must own Notion API access, validation, mapping, and sync.
- Sync must push app changes to Notion, pull latest Notion data, and refresh the UI from the pulled data.
- Draft wiki files are not canonical and should be folded into canonical docs, then removed.
