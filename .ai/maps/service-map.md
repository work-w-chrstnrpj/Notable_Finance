# Service Map

Use this map for backend service work. Service source code now exists under `service/`.

## Read First

- `wiki/tdd/tdd.md`
- `wiki/api/api-specification.md`
- `wiki/database/data-model.md`
- `service/README.md`
- `service/src/app.module.ts`
- `service/src/notion/notion.service.ts`
- `service/src/mapping/mapping.service.ts`
- `service/src/validation/validation.service.ts`

## Planned Service Areas

- API routing and controllers under `service/src/*`.
- Notion adapter boundary in `service/src/notion/`.
- Property/resource mappers in `service/src/mapping/`.
- Field access and mutation validation in `service/src/validation/`.
- Sync orchestration in `service/src/sync/`.
- Direct-save form submission and queued Sync button handling.
- Schema drift checks.
- Conflict handling.
- Error normalization.
- Auth/session support, if selected.
- App metadata storage for sync logs, pending mutations, conflicts, audit events, sessions if needed, and cached snapshots. Current implementation has an in-memory metadata baseline; PostgreSQL persistence is still pending.

## Boundaries

- The backend owns Notion token access.
- The backend rejects writes to read-only/computed fields.
- The backend preserves live Notion select labels exactly in mappings and validation.
- App metadata storage is supporting state only, not finance source of truth.
- Notion remains canonical for finance records.
