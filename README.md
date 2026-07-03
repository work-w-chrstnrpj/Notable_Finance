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

This repository is in planning mode. Application source code has not been created yet.

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
