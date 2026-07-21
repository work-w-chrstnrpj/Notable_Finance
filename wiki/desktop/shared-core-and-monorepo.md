# Shared Core & Monorepo Strategy

How code is shared between the web and desktop apps, and how the monorepo is organized.

## Decision: copy now, extract later

Per project decision, the working web app is **left fully untouched**. Reusable domain logic is **copied** into `notable-finance-app/src/main/domain` (and `src/shared` for types) rather than refactored out of `notable-finance-web/service` immediately. Extracting a shared package is a deliberate future step once the desktop app stabilizes.

Rationale: zero risk to the deployed web app while the desktop app is built under a one-week timeline; the copy is a controlled snapshot that can be reconciled into a shared package later.

## What is reused (copied)

High-value, framework-light logic:

- **Types/DTOs:** `notable-finance-web/service/src/common/finance.types.ts`, `notable-finance-web/application/src/types/finance.ts` → `src/shared`.
- **Field mapping:** `notion-property-mapper.ts`, `mapping.service.ts` (writable/computed/relation taxonomy).
- **Reporting/derivations:** the reduce logic in `notion-reporting.service.ts` (balances, spending, net income, monthly figures) → `src/main/domain`.
- **Notion adapter:** client factory, query, mutation (create/update/soft-delete) → `src/main/notion`.
- **Sync/conflict:** `notion-sync.service.ts`, `conflict.service.ts`, `schema-drift` → `src/main/sync`, adapted from Notion-truth to SQLite-truth.

What is **not** reused: NestJS controllers/guards/DI (HTTP shell), Next.js routing, the HTTP api-client. These are re-expressed as IPC handlers ([`ipc-contract.md`](ipc-contract.md)) and a React renderer.

## Monorepo layout

```
<repo root>/                       # pnpm workspace
├── pnpm-workspace.yaml
├── notable-finance-web/           # existing web app (untouched)
├── notable-finance-app/           # desktop app
└── wiki/                          # shared + desktop docs (this wiki)
```

- **Package manager:** pnpm workspaces.
- `notable-finance-web` keeps its current npm-based setup working during the transition; the workspace is additive.

## Future: extract a shared package

When the desktop app stabilizes, hoist the copied domain logic into a shared workspace package (e.g. `packages/core` + `packages/notion-adapter`) that both apps import, replacing the copy. Track drift between the copy and the web source until then.

## Related

- [`project-structure.md`](project-structure.md) · [`desktop-architecture.md`](desktop-architecture.md) · [`../shared/notion-field-mapping.md`](../shared/notion-field-mapping.md)
