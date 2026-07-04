# Deployment Guide

## Current Status

Deployment is not configured because implementation has not started. This guide records deployment requirements and decisions that must be satisfied later.

Planned deployment targets:

- Frontend: Vercel.
- Backend: Render.
- PostgreSQL metadata store: Neon Free, while usage remains within free-tier limits.
- Local testing: dev and prod-style environment configurations must be switchable for local verification.

## Deployment Requirements

- The frontend and backend must be deployable with server-side secret management.
- The Notion token must exist only in backend runtime configuration or encrypted server-side storage.
- The frontend must call only the backend API.
- Production logs must redact secrets and avoid unnecessary sensitive finance payloads.
- A schema health check must run before production use.

## Planned Environments

| Environment | Purpose |
| --- | --- |
| Local Development | Developer testing against local services and development configuration |
| Local Production-Style | Local verification using production-like configuration without touching production data unless explicitly intended |
| Development | Shared integration testing if needed |
| Staging | Pre-production validation against the duplicated Notion space |
| Production | Real finance workspace |

## Required Configuration

Exact names may change after project scaffolding, but backend configuration should include:

```text
NOTION_TOKEN
NOTION_VERSION
NOTION_ACCOUNTS_DATA_SOURCE_ID
NOTION_INCOME_CATEGORIES_DATA_SOURCE_ID
NOTION_INCOMES_DATA_SOURCE_ID
NOTION_EXPENSE_CATEGORIES_DATA_SOURCE_ID
NOTION_EXPENSES_DATA_SOURCE_ID
NOTION_MONTHLY_MONITORING_DATA_SOURCE_ID # optional/schema context only; selected-month reporting is app-calculated
DATABASE_URL
REDIS_URL # optional, only if Redis is enabled
AUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

Configure PostgreSQL app metadata storage server-side from the start using Neon Free while usage remains within free-tier limits. Redis is optional and should be configured only for cache, rate limits, short-lived session helpers, or queue coordination. If auth, cache, or webhooks are added, configure their secrets server-side as well.

## Free-Tier Storage Plan

- Use Neon Free for the PostgreSQL app metadata store.
- Keep Notion as the finance source of truth; do not duplicate the full Notion workspace into PostgreSQL as canonical data.
- Keep metadata compact by storing sync state, pending mutations, conflicts, audit events, sessions if needed, and limited cache snapshots only.
- Add retention rules for sync logs, audit events, and snapshots before production use so the app can stay within free-tier storage.
- Start without Redis unless implementation needs temporary cache, rate limits, short-lived session helpers, or queue coordination.

## Smoke Checks

Before production use:

- Backend health endpoint returns healthy.
- Notion schema status returns healthy for app-scoped data sources and views.
- The schema verification button reports a healthy state after the Notion integration key is configured.
- Frontend can pull and display data without receiving Notion secrets.
- Non-production create/edit/delete sync succeeds in staging for supported transactional records.
- Account and category create/edit/delete flows are absent from the app and remain Notion-only maintenance.
- Logs do not expose tokens or raw sensitive payloads.

## Rollback Notes

Rollback strategy is TBD after deployment target selection. Because Notion remains the source of truth, rollback must account for already-applied Notion mutations. Income and expense delete operations are title/amount mutations rather than archive operations, so recovery should rely on sync audit logs and Notion page history where available.

## Operational Risks

- Notion schema drift can break mappings.
- Notion API failures or rate limits can delay sync.
- Incorrect environment configuration can point staging or local production-style testing at production data.
- Token exposure would compromise private financial data.
- Deleting or renaming category records directly in Notion can break selectors, filters, and category reporting.
