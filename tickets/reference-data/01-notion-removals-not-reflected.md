# 01: Accounts and categories removed in Notion still show in the app

**Type:** bug
**Status:** needs-triage
**Blocked by:** None
**Owner:** unassigned
**Severity:** S3
**Found in:** desktop app on `development` (2d4b6df); sync pull, reference data
**Found during:** grill session 2026-11-24 (Accounts cards view)

## What is wrong
Deleting (trashing or archiving) an Account, Income Category or Expense Category in Notion does not remove it from the app. The pull upserts these three reference tables on every sync, but the presence pass that detects removals only checks incomes and expenses, so a removed account or category stays in lists, pickers and totals forever.

Expected behavior is set by [ADR-0011](../../docs/adr/0011-reference-data-is-created-in-notion-only.md): the next sync marks the row removed locally. It is hidden from lists and pickers but never hard-deleted, because past incomes, expenses and transfers still point at it.

## Steps to reproduce
1. Connect and sync so the app has an account (or category) from Notion.
2. In Notion, move that account or category page to Trash.
3. Run Sync in the app.

## Expected
The account or category no longer appears in Accounts, pickers or totals. Existing records that used it still display its name.

## Actual
Not yet reproduced by a test; reported by the owner from manual use. Code reading agrees: `notable-finance-app/src/main/sync/pull.ts` `pullAll` calls `pullAccounts`, `pullIncomeCategories`, `pullExpenseCategories` (upsert only), and `reconcileMissingFromNotion` (via `notion-gone.ts`) is called only for `incomes` and `expenses`. The accounts table has `inactive` (a Notion field) but no marker for "gone from Notion".

## Acceptance criteria
- [ ] AC1: A failing test first: a local account, income category and expense category whose Notion page is absent from the full remote set are detected as removed.
- [ ] AC2: After a sync, a removed account or category is hidden from the Accounts page, every account or category picker, the Dashboard and totals; it is not hard-deleted.
- [ ] AC3: Existing incomes, expenses and transfers that reference a removed row still show its name.
- [ ] AC4: A removed marker is distinct from Notion's Inactive flag; restoring the page in Notion un-removes it on the next sync.
- [ ] AC5: If the presence check fails (network, rate limit), the pull still completes and the error is reported, as for incomes and expenses today. Nothing is marked removed on a failed or partial remote read.
- [ ] AC6: The sync activity history records each removal.

## Inputs
- docs/adr/0011-reference-data-is-created-in-notion-only.md
- notable-finance-app/src/main/sync/pull.ts, notion-gone.ts
- docs/adr/0005-soft-delete-and-read-only-reference-data.md

## Progress log
- 2026-11-24: filed from the Accounts cards grill session; severity S3 (non-core flow wrong; workaround is to mark the account Inactive in Notion). Needs a human to triage.

## Evidence
- Commits:
- PR:
- Tests:
- Review:
