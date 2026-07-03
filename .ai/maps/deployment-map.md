# Deployment Map

Use this map for future deployment, operations, and runtime configuration work.

## Read First

- `wiki/deployment/deployment.md`
- `wiki/tdd/tdd.md`
- `AGENTS.md`

## Planned Deployment Concerns

- Frontend hosting target.
- Backend hosting target.
- Server-side secret management.
- Notion token and data source ID configuration.
- App metadata storage and cache services.
- Schema health smoke checks.
- Logs, redaction, monitoring, and rollback notes.

## Required Boundary

The frontend must never receive Notion secrets. Notion token access belongs only in backend runtime configuration or encrypted server-side storage.
