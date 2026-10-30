# Money Lent and full repayment

Desktop-only workflow, approved 2026-10-30. It uses the existing Income and Income Categories databases, with no new finance table, Notion property, or balance formula.

## Setup and entry

Create one Income Category with `Source of Income` exactly **Money Lent** in Notion, then sync income categories. Categories remain read-only in the desktop app. The app treats this category as auxiliary even if its Notion Auxiliary checkbox is unchecked. Existing Transfer and Savings categories continue to serve their workflows.

Use **Receivables → New Record → Categories → Money Lent**, or the **Lend money** shortcut. Money Lent remains available here even though it is auxiliary and excluded from normal Income. Enter the borrower/title, date lent, source account, and a positive amount. Main validates an existing active non-credit account and nonzero finite amount, then stores a negative Gross Income, zero Capital Expenditure, no Transacted Account or CC coverage, and a non-transaction flag. New Receivables drafts can select Money Lent or switch back to a normal category; choosing Money Lent switches to positive Amount lent, required Source Account/date, and hides Capital Expenditure. Existing loan edits keep the Money Lent category locked and retain these invariants.

Receivables includes outstanding Money Lent rows with a source account and negative amount alongside its existing no-account incomes and eligible paid Pasabuy expenses. Only Money Lent display amounts are inverted: rows, totals, and receipts show the positive amount owed. Date, account, search, selection, and receipt exclusions retain their existing semantics. Normal Income and income activity reports exclude auxiliary categories; account balances still include all applicable signed records.

## Existing Alkansya records

Open a negative Savings record in Alkansya and choose **Reclassify as money lent**, then confirm. Main changes only the category and non-transaction flag, preserving the row ID, Notion page identity, amount, source account, date, and notes. The record moves from Alkansya to Receivables without changing the account balance. There is no automatic reclassification of negative Savings entries. Rows with Capital Expenditure, transaction/coverage fields, deleted state, or unresolved conflict cannot be reclassified.

## Full repayment

Open the loan in Receivables and choose **Record repayment**. Choose **Same account** or **Transfer to another account** and set the repayment date. The original lending account is shown as a read-only **Source Account**. Transfer requires selecting a different active non-credit **Transfer Account**; confirmation is disabled until one is selected. Review the source → destination preview and choose **Convert to Transfer**. Same account uses **Confirm full repayment** and restores the original account through soft deletion. Partial repayments, interest, fees, and forgiveness are outside this version.

| Example: ₱1,000 lent from A | Stored result | Balance effect relative to before lending |
| --- | --- | --- |
| Outstanding | Money Lent, Gross Income −₱1,000, Account A | A −₱1,000; receivable +₱1,000 |
| Repaid into A | Same row soft-deleted; amounts zero | A unchanged overall; receivable gone |
| Repaid into B | Same row becomes Transfer, Gross Income −₱1,000, Account A, Transacted Account B | A −₱1,000; B +₱1,000; receivable gone |

Same-account repayment always soft-deletes, even if Settings enables hard deletion. It intentionally removes the historical balance effect. Different-account repayment keeps the source deduction, sets the repayment date on the Transfer, preserves the title, and marks it as a transaction. Existing notes are retained and the original lending date and repayment date are appended to **local** notes. Notes are not a mapped Notion property and are not guaranteed to survive a rebuild of the local database from Notion.

Main performs the settlement and journal write in one SQLite transaction, rejects already-settled/deleted or conflicted rows and loans with incompatible fields, validates receiving/source accounts, and rejects a repayment date before the date lent. A preview includes the expected full amount and source account; changes to either invalidate settlement. Cancel makes no write.

Both actions mark the existing Income row dirty and emit normal Income-family invalidations. Sync updates its existing Notion page, or creates one page with the final state if the original loan never synced. No second repayment income is created. Existing three-way conflict handling applies. No live Notion schema/category changes are performed by the implementation.

Chat explains this workflow and directs lending/repayment to the page. Creating Money Lent through a generic Chat workflow draft is blocked to prevent an incorrect draft preview; no Chat repayment/delete tool is introduced.

## Verification

- `test/money-lent.test.ts`: real migration SQL in isolated SQLite; signed storage, positive presentation, report exclusion, source/destination balances, explicit reclassification, missing categories, stale/invalid/repeated settlement, transaction rollback, and mocked push/pull round trips retaining one Notion page.
- `components/pages/workflow.test.tsx`: positive row/footer/receipt, positive-input creation, both repayment previews and IPC payloads, cancellation and visible failure.
- `e2e/money-lent.spec.ts`: production Electron renderer + preload + SQLite; same-account repayment with hard deletion enabled, cross-account Transfer, and explicit Alkansya reclassification.

Automated checks use isolated profiles and a mocked Notion adapter. Live workspace setup and live Notion sync acceptance remain manual.

Verified on 2026-10-30: full Vitest suite **374 passed, 7 skipped**; three Money Lent Electron journeys passed; desktop typecheck and production build passed. ESLint has no errors (repository warnings remain). Live Notion acceptance was not run.
