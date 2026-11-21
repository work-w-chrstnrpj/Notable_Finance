# 01: Create the Notion Income properties

**Type:** dev
**Status:** ready-for-human
**Blocked by:** None
**Owner:** unassigned

## What to build
The owner adds the loan properties to the Notion Income database by hand (the Notion tool Codex used cannot create relations, rollups or formulas): Interest (number), Payment Frequency (select with the seven Expense options), Period count (number), Linked Borrowing (two-way relation to Income itself, reverse named Payments), Payments Made (rollup, count of Payments), Paid Amount (rollup, sum of Payments' Gross Income), Remaining Balance (formula: abs(Gross Income) + Interest - abs(Paid Amount), 2 decimals), and a Borrowing Section table view filtered to category Borrowed Money and Linked Borrowing empty.

## Acceptance criteria
- [ ] AC1: Every property exists in the Income database with the exact name and type listed.
- [ ] AC2: Linked Borrowing is two-way and its reverse property is named Payments.
- [ ] AC3: A test loan of 150,000 with 5,000 interest and one linked 12,916.67 repayment shows Payments Made 1 and Remaining Balance 142,083.33 in Notion.
- [ ] AC4: The Borrowing Section view lists loans only, not repayments.

## Inputs
- `tickets/borrowing-terms/spec.md`
- `docs/adr/0004-derived-values-computed-not-stored.md`
- `docs/adr/0007-loan-interest-inside-the-borrowing.md`
- `GLOSSARY.md` (Loan terms, Suggested payment, Remaining balance)

## Evidence
- Commits:
- PR:
- Tests:
- Review:
- Docs updated:

## Progress log
### 2026-11-21 claude
- Did: Created from the spec at the user's approval of the breakdown.
- Next: Owner creates the properties, then ticks the criteria with a screenshot or note.
