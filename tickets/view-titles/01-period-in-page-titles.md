# 01: Page titles follow the selected period

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
On every record page the title shows the selected period, like Monitoring does: "Daily Income", "Weekly Expense", "Monthly Transfer", "Quarterly Alkansya". The All Records view reads "All Income Records", "All Expense Records" and so on. The title changes as soon as the period changes.

## Acceptance criteria
- [x] AC1: Income, Expense, Transfer, Credit Card Payment, Alkansya, Borrowings and Receivables titles read "<Period> <Page>" for Daily, Weekly, Monthly and Quarterly.
- [x] AC2: Semi-Annually and Annually read "Semi-Annual <Page>" and "Annual <Page>", the same words Monitoring uses.
- [x] AC3: All Records reads "All <Page> Records".
- [x] AC4: The title updates as soon as the period changes; Monitoring's own title is unchanged.
- [x] AC5: Expense special views (To pay, To buy, Installments, CC Transaction, Pasabuy) and the Borrowings Borrowed Accounts tab keep the plain page title.
- [x] AC6: Tests and e2e checks that look for the old titles are updated.

## Inputs
- Request in /cook-a-ticket season, 2026-11-24, answered "yes to all" to the four decisions (plain titles for special views, Borrowed Accounts stays "Borrowings", page label as used today, receipts and exports unchanged).

## Evidence
- Commits:
- PR:
- Tests: npx vitest run (full suite: 82 files passed, 820 tests; new view-titles.test.tsx); npm run typecheck clean. Playwright e2e not run; the two specs that looked for the old exact titles were changed to match the new ones.
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Created from a season request on the filter-options work. It is a different job (page titles, not filters), so it has its own ticket.
- Next: Implement a shared title helper and use it on the record pages.

### 2026-11-24 claude
- Did: Added a shared helper that builds the title from the page name and period, and used it on Income, Expense and the workflow pages (Transfer, Credit Card Payment, Alkansya, Borrowings, Receivables). Semi-Annually and Annually read 'Semi-Annual' and 'Annual', All Records reads 'All <Page> Records'. Expense special views and the Borrowed Accounts tab keep the plain title. Updated the page-controls and workflow tests and two e2e specs that looked for the old titles; added view-titles.test.tsx. The Credit Card Payment page title is the full 'Credit Card Payment' label (its sidebar short label 'CC Payment' is not used on the page).
- Next: Try it in the app; then /cook-a-ticket [serve] to commit and close.
