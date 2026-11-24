# 01: Read Payment Network from Notion into the account

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
The account's Payment Network (the Notion Select on the Accounts database) is read on every sync and kept with the account, like its other Notion fields, so the app can show which network each card uses. An empty value stays empty and an unknown value is kept as plain text. Nothing is written back to Notion and the Notion schema does not change.

## Acceptance criteria
- [x] AC1: A failing test first: a Notion account page with Payment Network `Visa` produces an account whose network is `Visa`.
- [x] AC2: After a sync, each account the app shows carries its Payment Network; an account with no value shows none.
- [x] AC3: An unknown value (a network the app has no logo for) is kept as its text and does not break the pull or the page.
- [x] AC4: An existing database upgrades without losing any account data, and accounts get their network on the next sync.
- [x] AC5: Nothing about the network is ever pushed to Notion (read-only reference data, ADR-0011).
- [x] AC6: The Notion field mapping document lists Payment Network.

## Inputs
- tickets/account-cards/spec.md (the approved spec)
- docs/adr/0011-reference-data-is-created-in-notion-only.md

## Evidence
- Commits:
- PR:
- Tests: `npx vitest run test/payment-network.test.ts` (7 passed, one test per AC); full `npm test` 561 passed, 31 skipped (3 db-dependent files skipped); `npm run typecheck` clean
- Review:
- Docs updated: wiki/shared/notion-field-mapping.md

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the prototype was approved.
- Next: Pick up when unblocked.
### 2026-11-24 claude
- Did: Claimed; reading schema, extractor, pull, DTO and mapper.
- Next: Implement and test each AC.
### 2026-11-24 claude
- Did: Added Payment Network end to end: Notion property name, optional schema entry (warning-only, never push-blocking), `payment_network` column with migration 0017, extractor, pull upsert, DTO and renderer type, mapper, list query, wiki mapping. Tests in `test/payment-network.test.ts` cover AC1 to AC6. Added `paymentNetwork: null` to existing account fixtures. Updated the two tests that fake an older database (budgets-repo, backup) to roll back 0017 too; they are skipped in this environment, so that edit is not run.
- Next: Review and serve (commit). Ticket 03 consumes `paymentNetwork`.
