# Spec: Loan terms for Borrowings

**Status:** ready-for-agent
**Owner:** claude

## Problem Statement
A Borrowing is only an amount. The user cannot record that they borrowed ₱150,000 with ₱5,000 interest over 12 months, so the app cannot show what is really owed (₱155,000), what a payment should be (about ₱12,916.67), or what remains after each payment. Interest, Payment Frequency, Period count and Paid Period exist only on Expense, where they do not belong: a loan is not spending and must stay out of Expense totals, budgets and Monitoring.

## Solution
A Borrowed row can carry **Loan terms**: Interest (total, flat), Payment Frequency and Period count. The app computes the total owed (principal plus interest), a **Suggested payment** (total owed divided by Period count, a minimum guide only) and, from the repayments linked to the loan, the Paid amount, Payments made and **Remaining balance**. Repayments stay manual, one row each, in any amount; each is linked to its loan. Interest is part of the loan and is never an expense. Loans without terms behave exactly as today. The new fields sync to Notion.

Decision record: `docs/adr/0007-loan-interest-inside-the-borrowing.md`.

## User Stories
1. As a user, I want to record Interest, Payment Frequency and Period count when I borrow, so that the loan shows what I really owe.
2. As a user, I want a ₱150,000 loan with ₱5,000 interest over 12 months to show ₱155,000 owed, so that I see the true amount.
3. As a user, I want a Suggested payment of ₱12,916.67 for that loan, so that I know the minimum to pay each period.
4. As a user, I want to record each payment manually in any amount, so that I can pay more or less than suggested.
5. As a user, I want a payment to be linked to its loan, so that the loan's balance reflects it.
6. As a user, I want "Record repayment" on a loan to prefill the Suggested payment and the link, so that I only adjust the amount.
7. As a user, I want to see Paid amount, Payments made and Remaining balance on every loan, so that I know where I stand.
8. As a user, I want the Remaining balance to reach 0 only when I have paid principal plus interest, so that interest is never forgotten.
9. As a user, I want an overpayment to show a remaining balance of 0, not a negative number.
10. As a user, I want the Borrow Accounts panel to show what is still owed including unpaid interest, so that the panel matches my loans.
11. As a user, I want loans without terms to look and behave exactly as before, so that my old records are unaffected.
12. As a user, I want interest to never appear in Expense totals, budgets or Monitoring, so that those stay about spending.
13. As a user, I want deleted payments ignored in all balances, so that a soft-deleted payment does not count.
14. As a user, I want the new fields to sync with Notion, so that terms and links survive a restore.
15. As a user, I want a missing or empty term field to load without error, so that partly filled Notion rows never break the app.
16. As a user, I want the chat assistant to create a loan with terms and report its remaining balance, so that chat matches the screen.
17. As a user, I want the Borrowings table to show Remaining balance, so that I do not open each row.

## Implementation Decisions
- **Where the terms live:** on the Borrowed Income row, as Interest, Payment Frequency and Period count (same value sets as Expense, `PaymentFrequency` reused). A repayment row carries a link to its loan. Recorded in ADR-0007.
- **Derived values stay computed (ADR-0004):** total owed, Suggested payment, Paid amount, Payments made and Remaining balance are computed in a shared pure function, never stored. Paid amount is the sum of linked, non-deleted repayments; Payments made is their count.
  - Total owed = principal + Interest. Principal = absolute gross of the Borrowed row.
  - Suggested payment = Total owed / Period count, shown only when Period count is a positive whole number. It is guidance, never enforced.
  - Remaining balance = max(0, Total owed − Paid amount).
- **No interest expense:** interest does not create an Expense or Income row and no new category. The Borrow account's raw balance is still principal-based; the app's "still owed" for a loan with terms is the computed Remaining balance.
- **Borrow Accounts panel:** still owed = Remaining balance of each loan with terms on that account, plus the existing balance-based amount for borrowings without terms. A repayment with no loan link counts against the no-terms amount.
- **Linking (changed 2026-11-21, ticket 07):** the repayment form lets the user pick the loan (any Borrowed row on that Borrow account, with or without terms), and a Borrowed row's modal lists its payments and lets the user link or unlink them (two-way, like the Notion relation); "Record repayment" from a loan preselects it. Repayments can be linked or unlinked after the fact by editing.
- **Local schema:** additive migration adding the three term columns and the link column to the income table, all nullable; writable fields join the base snapshot for three-way merge.
- **Notion mapping:** writable `Interest` (number), `Payment Frequency` (select), `Period count` (number), `Linked Borrowing` (relation to Income itself). `Payments` (reverse relation), `Payments Made`, `Paid Amount` and `Remaining Balance` are computed in Notion, never written. Property names match Expense's naming. The Notion properties are created by the owner by hand before sync is enabled for them; a missing property must degrade, not fail sync.
- **UI:** Borrow form gets Interest, Payment Frequency and Period count (optional as a group; Period count needs Payment Frequency and vice versa). The Borrowings table adds Remaining balance. The record modal shows total owed, Suggested payment, Paid amount, Payments made and Remaining balance.
- **Chat:** the borrowing write and read tools gain the terms, the link and Remaining balance. Computed values are shown read-only on the confirm card.
- **Docs to update:** `wiki/desktop/borrowings.md`, `wiki/shared/notion-field-mapping.md`, `wiki/desktop/local-data-schema.md`, GLOSSARY, CHANGELOG.

## Testing Decisions
Agreed seams (confirmed 2026-11-21):
1. **Loan math** (pure shared function in `shared/borrowings.ts`): no terms, deleted repayments, unlinked repayments, overpayment clamp, zero or invalid Period count, rounding, panel still-owed with mixed loans.
2. **Storage and Notion mapping:** the new fields round-trip through the local repository and the property mapper and extractor; empty or missing values load.
3. **Borrowings screen behaviour** (`components/pages/workflow.test.tsx` pattern): Borrow form term fields, "Record repayment" prefill and link, editable amount, table and panel figures.
4. **Chat parity** (`test/chat-borrowings.test.ts`): create a loan with terms, read Remaining balance.
5. **One Playwright check** (separate from `npm test`; tickets must name it): create ₱150,000 with ₱5,000 interest over 12 months, pay one ₱12,916.67 payment, see ₱142,083.33 remaining.

Good tests exercise behaviour through these interfaces, not React internals. Prior art: `test/borrowings.test.ts`, `test/notion-formulas.test.ts`, `components/pages/expense/expense-formulas.test.tsx`.

## Inputs
- `docs/adr/0004-derived-values-computed-not-stored.md`
- `docs/adr/0007-loan-interest-inside-the-borrowing.md`
- `wiki/desktop/borrowings.md`
- `GLOSSARY.md` (Loan terms, Suggested payment, Remaining balance)

## Out of Scope
- Interest rates, amortization, compounding or interest accrued over time (interest is a flat total).
- Due dates, reminders or a payment schedule.
- Forcing payments to equal the Suggested payment.
- Attaching terms to existing loans in bulk (editing a single loan to add terms is allowed).
- Money Lent receivables with interest.
- Creating the Notion properties from the app.

## Further Notes
- Notion properties (owner creates by hand in "Incomes '24-26"): Interest, Payment Frequency, Period count, Linked Borrowing (two-way, reverse "Payments"), Payments Made, Paid Amount, Remaining Balance, plus a "Borrowing Section" view. The Remaining Balance formula is `abs(prop("Gross Income")) + prop("Interest") - abs(prop("Paid Amount"))`.
- Open for the build: how a loan is shown when its terms are added after repayments already exist (the unlinked payments stay unlinked until the user links them).
