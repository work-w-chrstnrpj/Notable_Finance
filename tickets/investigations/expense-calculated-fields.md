# Investigation Report: Expense calculated fields

## Summary

Investigated the reported v2.1.1 regression against v2.0.0 and current v2.2.1. Fixed reproducible renderer formula differences and a zero-period expected-date defect on the current branch. No release version was changed: v2.1.2 is already tagged and published in repository history.

## Symptoms

Owner reports missing/incorrect Expected payment date, Pasabuy Received Amount, Pasabuyer Balance and other computed values when opening Expense records after BNPL support.

## Facts

- v2.1.1 added BNPL adjustment and an excess SQL placeholder in new Expense imports. Commit a5adfd0 (v2.1.2) already corrected that import failure.
- Main-process expense formulas were unchanged between v2.0.0 and v2.1.1. Inputs remain mapped through pull, SQLite and DTOs.
- Renderer installment calculation required Payment Status = Installment. Main/Notion formulas require a period count independently of that status.
- Renderer paid/remaining and Pasabuy formulas differed from the main formulas and rounded installments before multiplication. Fully received status could invent a full received amount without matching paid periods.
- Expected-date calculation already receives frequency/BNPL/Date Paid in all current call sites. It incorrectly used zero periods literally rather than Notion's default of one.

## Observations

The import failure can leave stale local records. Separate renderer defects cause the same record to display different computed values from local account balances. These formula differences predate BNPL; the owner's exact version-specific failure cannot be attributed solely to them without the affected record inputs.

## Suspected Failing Boundary

Expense renderer computation; historical new-record sync import.

## Primary Investigator

Backend & Database Engineer: backend/sync history and formula audit. Coordinator: renderer reproduction and implementation.

## Supporting Specialists

No additional specialist required. Regression tests exercise the form hook and table producer.

## Hypotheses

1. **Failed Expense import:** Supported by v2.1.1 SQL mismatch; contradicted as a remaining current-code defect because v2.1.2 already fixes it. Missing: owner's running version and successful pull evidence.
2. **Renderer formula divergence:** Supported by seven failing regression assertions before the fix and existing main formula tests/schema export. Confirmed for tested input combinations; predates v2.1.1.
3. **New expected-date guard suppresses output:** v2.1.1 intentionally blanks dates for missing frequency or set Date Paid. All current call sites pass those fields. Missing: affected record's frequency, dates and account billing/due days. Do not remove the documented guard.

## Evidence

- `wiki/shared/notion-schema.json`: saved formula definitions.
- `notable-finance-app/src/shared/notion-formulas.ts`: existing main formula implementation, moved unchanged with a shared aggregation helper.
- `notable-finance-app/src/renderer/src/components/pages/expense/expense-formulas.test.tsx`: seven failures before change; eight passing tests afterward.
- `notable-finance-app/CHANGELOG.md`: v2.1.1 BNPL behavior and v2.1.2 import fix.

## Most Likely Root Cause

Confirmed renderer formula divergence for the reproduced Pasabuy/paid/remaining cases, plus incorrect zero-period expected-date default. Historical sync import failure is also confirmed in v2.1.1. Full attribution of the owner's specific records remains unverified.

## Confidence Level

High for reproduced defects; medium for correspondence to the owner's exact records.

## Recommended Fixes

Implemented shared pure formulas for main balances, Expense forms, quick-add and credit/installment tables; removed duplicate renderer formulas; display installment amount whenever available. Default zero periods to one for expected date. No schema/data migration required.

## Verification

- `npm --prefix notable-finance-app test`: 343 passed, seven skipped (43 files passed, one skipped), including Pasabuyer schema regression coverage.
- `npm --prefix notable-finance-app run lint`: zero errors, 97 warnings.
- `npm --prefix notable-finance-app run typecheck`: passed.
- `npm --prefix notable-finance-app run test:e2e`: all 37 Electron checks passed.
- `npm --prefix notable-finance-app run pack`: production build/package passed; empty CSS import warnings remain.

## Open Questions

The installed app fetched six live Pasabuyer schema choices; bundle hashes, data preservation and SQLite integrity were verified. Full formula comparison against affected Notion records and packaged-app visual acceptance remain unrun. A blank expected date requires checking frequency, Date Paid, purchase date and account billing/due configuration before treating it as a formula failure. No private finance records were read or mutated.

## RCA Needed?

No. This focused investigation and regression coverage document the source defects; a formal incident RCA is unnecessary unless requested.
