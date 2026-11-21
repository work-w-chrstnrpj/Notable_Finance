# ADR-0007: Loan interest stays inside the borrowing, balances computed from terms

**Status:** accepted
**Date:** 2026-11-21
**Ticket:** borrowing-terms (spec)
**Input:** `tickets/borrowing-terms/spec.md`
**Supersedes:** None

## Context

A Borrowing is one Income row in the auxiliary "Borrowed Money" category, with repayments as separate rows. Interest, Payment Frequency and Period count exist only on Expense. A loan with interest cannot be recorded, and the Borrow account balance (cash in minus cash out) would end at +interest after full repayment.

## Decision

Loan terms (Interest, Payment Frequency, Period count) are stored on the Borrowed Income row and each repayment links to its loan. Interest is never an expense and creates no extra row. Total owed, Suggested payment, Paid amount, Payments made and Remaining balance are computed from the terms and linked repayments (ADR-0004), and the app's "still owed" for a loan with terms uses Remaining balance. The new writable fields sync to Notion.

## Alternatives

- Reuse the Expense record for loans: a loan would count in Expense totals, budgets and Monitoring.
- A separate auxiliary "Borrowed Interest" row per loan: balances reach 0 on payoff, but adds a row and a Notion category per loan and is awkward when interest is edited.
- Local-only terms (like ADR-0006): no Notion change, but terms and links are lost on restore from Notion.

## Consequences

- Loans without terms are unchanged.
- The Borrow account's raw balance no longer equals "still owed" for loans with interest; the app uses Remaining balance.
- Notion needs new Income properties; Notion-side formulas are for viewing only and the app does not read them.
- Repayments need a link field and a picker in the form.
