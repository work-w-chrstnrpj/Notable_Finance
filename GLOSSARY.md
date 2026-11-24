# Glossary

The project's shared language. Agents and people use these words, and only these, for these things. Maintained by the `domain-modeling` skill.

## Terms

**Ticket**:
One tracked unit of work with a type, a status, blockers, acceptance criteria, a progress log and evidence.
_Avoid_: task, story, card

**Acceptance criterion**:
One testable condition on a ticket, numbered `AC1`, `AC2`. Referenced as `<ticket>#AC<n>` by tests and manual cases.

**Test case**:
A manual check in `qa/cases/` that covers one or more acceptance criteria.

**Run**:
One execution of manual cases (`qa/runs/*.md`) or an automated suite (recorded from JUnit XML).

**Flaky test**:
An automated test that both passed and failed on the same code in recent runs.

**Source of truth**:
Local SQLite on the device. Notion is a mirror.
_Avoid_: master copy, primary database
_Source_: docs/adr/0001-local-first-sqlite-source-of-truth.md

**Mirror**:
Notion's role: a bidirectional copy kept in step by sync, and the backup.
_Source_: docs/adr/0003-notion-as-bidirectional-mirror.md

**Sync**:
One pass of pull, then push, then pull, reconciling local and Notion records.

**Dirty**:
A local record changed since its last successful push.

**Base snapshot**:
A record's writable fields as of the last sync; the common ancestor for the three-way merge.

**Conflict**:
A record changed on both sides in incompatible ways; stored and shown for the user to resolve.

**Writable field / Computed field**:
A writable field is an input the app may write to Notion. A computed field (formula, rollup, reverse relation) is never written.
_Source_: wiki/shared/notion-field-mapping.md

**Account**:
A place money lives or is owed. Read-only reference data maintained in Notion; balances are computed.

**Expense Category / Income Category**:
Read-only reference data from Notion. An expense category carries a Monthly Budget.
_Avoid_: tag, bucket

**Auxiliary**:
A category or account used for workflows (Transfer, Money Lent, Borrowed) and excluded from normal income and expense views.

**Monthly Budget**:
The per-expense-category monthly allowance from Notion. Remaining equals budget minus spending.

**Monthly Monitoring**:
The Monitoring page: income, expense and budget versus actual for a period (Monthly, Quarterly, Semi-Annually or Annually), computed locally. The Need/Wants/Savings split is the one value read from Notion.
_Avoid_: report, summary

**Money movement**:
The sidebar group of record pages: Income, Expense, Transfer, CC Payment, Alkansya, Borrowings and Receivables. Dashboard, Accounts and Monitoring sit in Overview, not here.
_Avoid_: "Money Movement tab" (it is a group, not one tab)

**Soft delete**:
Deleting an income or expense by rewriting its title to `[Deleted: Amount]` and clearing the amount.
_Source_: docs/adr/0005-soft-delete-and-read-only-reference-data.md

**Pasabuy**:
Buying on behalf of someone; a reimbursable pass-through excluded from the user's own expense.

**Alkansya**:
The savings workflow; deposits are Savings-category income.

**Money Lent / Receivable / Borrowing**:
Money Lent is a loan the user gave (negative gross income in an auxiliary category) and appears in Receivables. A Borrowing is money the user owes, tracked against Borrow (Auxiliary) accounts.
_Source_: wiki/desktop/money-lent.md, wiki/desktop/borrowings.md

**Loan terms**:
The optional Interest (flat total), Payment Frequency and Period count on a Borrowed row. A loan without terms behaves as a plain borrowing.
_Source_: docs/adr/0007-loan-interest-inside-the-borrowing.md

**Suggested payment**:
Total owed divided by Period count; a minimum guide, never enforced. Repayments are manual and any amount.

**Remaining balance**:
For a loan with terms, `max(0, principal + interest − linked repayments)`, computed locally.
_Source_: docs/adr/0007-loan-interest-inside-the-borrowing.md

**Custom monthly budget**:
A month's budget per expense category, kept in the user's Custom monthly budget database in Notion so a past month is judged against the budget that applied then. Edited only in Notion. The app keeps a read-only local cache (internal table `monthly_budget_snapshots`, formerly "saved budgets"). A month "has a custom budget" when a row covers it.
_Avoid_: saved budget (old name), snapshot, budget history
_Source_: docs/adr/0010-custom-monthly-budget-database-is-source-of-truth.md (supersedes 0006, 0008)

**Budget period**:
The label of one row in the Custom monthly budget database: a month (`Jan 2025`), quarter (`Q1 2024`), half (`H1 2025`) or year (`2026`). Quarter, half and year rows are split evenly across their months, and the most specific row wins for a month (month, quarter, half, year).

**Custom monthly budget database**:
A database the user creates in Notion and whose ID they save in Notion Configuration (key `savedBudgets`): one per user, one row per budget period, one Number column per expense category. It is the only place custom budgets are edited.
_Avoid_: Saved Budgets database (old name), snapshot database
_Source_: docs/adr/0009-saved-budgets-database-is-user-created.md, docs/adr/0010-custom-monthly-budget-database-is-source-of-truth.md

**Budget source**:
The Monitoring toggle choosing where budgets come from: **Default** (each expense category's own monthly budget from the Expense Categories database) or **Custom** (the Custom monthly budget database, falling back to Default for months with no row). Custom is available only when a database ID is saved.
_Avoid_: "Notion" and "Saved" as the two options (old labels)

More finance terms and exact Notion labels: `wiki/shared/finance-domain-glossary.md`.

## Flagged ambiguities

<!-- "account" meant both the login and the billing record. Resolved: login is **User**, billing is **Account**. -->
