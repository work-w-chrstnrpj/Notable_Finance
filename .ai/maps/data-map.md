# Data Map

Use this map for local schema, Notion field mapping, and sync work.

## Read First

- `wiki/desktop/local-data-schema.md`
- `wiki/shared/notion-field-mapping.md`
- `wiki/desktop/sync-and-conflict-design.md`

## Source Areas

- `notable-finance-app/src/main/db/` (schema, migrations, repositories).
- `notable-finance-app/src/main/notion/` (property mapper, page extractors, client).
- `notable-finance-app/src/main/sync/` (pull, push, conflict handling).
- `notable-finance-app/src/main/domain/` (derived balances and reporting).

## Key Boundary

Local SQLite is the working source of truth and Notion is a bidirectional mirror. Writable versus computed field classification lives in `wiki/shared/notion-field-mapping.md` and is enforced in main before any Notion write.

## Code Index

- SQLite schema → `notable-finance-app/src/main/db/schema.ts`
- Migrations → `notable-finance-app/src/main/db/migrations`
- Notion schema expectations → `notable-finance-app/src/main/notion/schema-spec.ts`
- Sync run → `notable-finance-app/src/main/sync/run.ts`
- Derived balances and monitoring → `notable-finance-app/src/main/domain/derivations.ts`
- Report services → `notable-finance-app/src/main/services/reports.ts`
- Pure shared formulas → `notable-finance-app/src/shared/notion-formulas.ts`
- Monitoring split from Notion → `notable-finance-app/src/main/notion/monitoring-split.ts`
- Backup and restore → `notable-finance-app/src/main/services/backup.ts`
