# Service Map

Use this map for future backend service work. Service source code has not been created yet.

## Read First

- `wiki/tdd/tdd.md`
- `wiki/api/api-specification.md`
- `wiki/database/data-model.md`
- `service/README.md`

## Planned Service Areas

- API routing and controllers.
- Notion API client.
- Notion adapter and property mappers.
- Field access and mutation validation.
- Sync orchestration.
- Direct-save form submission and queued Sync button handling.
- Schema drift checks.
- Conflict handling.
- Error normalization.
- Auth/session support, if selected.
- App metadata storage for sync logs, pending mutations, conflicts, audit events, sessions if needed, and cached snapshots.

## Boundaries

- The backend owns Notion token access.
- The backend rejects writes to read-only/computed fields.
- The backend preserves live Notion select labels exactly in mappings and validation.
- App metadata storage is supporting state only, not finance source of truth.
- Notion remains canonical for finance records.
