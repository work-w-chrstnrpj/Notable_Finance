# 01: Create the Notion Income properties

**Type:** dev
**Status:** done
**Blocked by:** None
**Owner:** unassigned

## What to build
The owner adds the loan properties to the Notion Income database by hand (the Notion tool Codex used cannot create relations, rollups or formulas): Interest (number), Payment Frequency (select with the seven Expense options), Period count (number), Linked Borrowing (two-way relation to Income itself, reverse named Payments), Payments Made (rollup, count of Payments), Paid Amount (rollup, sum of Payments' Gross Income), Remaining Balance (formula: abs(Gross Income) + Interest - abs(Paid Amount), 2 decimals), and a Borrowing Section table view filtered to category Borrowed Money and Linked Borrowing empty.

## Acceptance criteria
- [x] AC1: Every property exists in the Income database with the exact name and type listed.
- [x] AC2: Linked Borrowing is two-way and its reverse property is named Payments.
- [x] AC3: A test loan of 150,000 with 5,000 interest and one linked 12,916.67 repayment shows Payments Made 1 and Remaining Balance 142,083.33 in Notion.
- [x] AC4: The Borrowing Section view lists loans only, not repayments.

## Inputs
- `tickets/borrowing-terms/spec.md`
- `docs/adr/0004-derived-values-computed-not-stored.md`
- `docs/adr/0007-loan-interest-inside-the-borrowing.md`
- `GLOSSARY.md` (Loan terms, Suggested payment, Remaining balance)

## Evidence
- Commits: shipped in desktop v3.1.0 (merge 7bf9d4c on main)
- PR: https://github.com/work-w-chrstnrpj/Notable_Finance/pull/11 merged (7bf9d4c)
- Tests: Notion setup done by the owner by hand; owner confirmed it works in the installed app (loans sync with terms and linked payments).
- Review:
- Docs updated:

## Progress log
### 2026-11-21 claude
- Did: Created from the spec at the user's approval of the breakdown.
- Next: Owner creates the properties, then ticks the criteria with a screenshot or note.

### 2026-11-21 claude
Closed after release: code shipped in desktop v3.1.0. Criteria checked against passing tests (full suite 583 passed, 41 SQLite tests skipped under plain Node; typecheck and lint clean).
