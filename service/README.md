# Service

This folder is reserved for the future backend service.

Planned responsibilities:

- HTTP API for the finance UI.
- Server-side Notion API client and adapter.
- Notion data source and property mapping.
- Input validation and writable-field enforcement.
- Sync flow that supports both direct-save form submissions and queued Sync button commits.
- Post-write pull flow that returns refreshed UI state from Notion.
- Schema drift checks and conflict detection.
- Authentication/authorization if selected for MVP.
- App metadata storage for sync logs, pending mutations, conflicts, audit events, sessions if needed, and cached snapshots.

Rules:

- Keep Notion tokens server-side only.
- Reject writes to computed, rollup, formula, reverse-relation, and system-managed fields.
- Preserve live Notion select labels exactly in mappings, validation options, and app-facing labels.
- Do not treat metadata/cache storage as the finance source of truth.
- Do not add framework-specific files until the implementation scaffolding task begins.
