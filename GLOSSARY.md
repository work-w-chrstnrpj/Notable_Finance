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

**Saved budget** (proposed):
A local-only, per-month copy of category budgets, not yet built.
_Source_: wiki/desktop/monthly-budget-snapshots.md

More finance terms and exact Notion labels: `wiki/shared/finance-domain-glossary.md`.

## Flagged ambiguities

<!-- "account" meant both the login and the billing record. Resolved: login is **User**, billing is **Account**. -->
