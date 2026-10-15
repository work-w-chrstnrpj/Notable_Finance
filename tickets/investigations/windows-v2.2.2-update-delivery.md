# Investigation Report: Windows v2.2.2 update delivery

## Summary

Owner reports the earlier Expense/Pasabuyer symptoms persist on Windows while the installed Mac build works. Confirmed a Windows update download filename mismatch and repaired v2.2.2 distribution. The affected Windows runtime version and records remain unverified.

## Symptoms

Windows still exhibits the same reported issues; the Mac laptop is working. Exact Windows app version, symptom subset and Pull/Sync error are pending owner response.

## Facts

- Release workflow run `38737974375` succeeded on all platforms at commit `c172d351f33fe191a0eb3ab68782edcc63269b33`.
- Windows `latest.yml` references `Notable-Finance-Setup-2.2.2.exe`; the original GitHub installer asset was `Notable-Finance.Setup.2.2.2.exe`.
- Installed `electron-updater` GitHubProvider resolves the manifest filename, replacing spaces with hyphens. It does not map hyphens to dots.
- Downloaded installer SHA-512 matches the manifest. Extracted `resources/app.asar` reports version 2.2.2 and contains main schema fetching, preload Pasabuyer IPC and renderer dynamic options/shared formula code. The old hardcoded buyer array is absent.
- The installed Mac was packaged locally; it did not depend on this Windows update URL.

## Observations

A successful Windows packaging job did not prove updater downloadability. The filename mismatch can prevent delivery of the new application code. It does not explain an already running genuine v2.2.2 installation without further evidence.

## Suspected Failing Boundary

GitHub release artifact naming versus the Windows updater manifest. Windows runtime/data remains a separate unresolved boundary.

## Primary Investigator

DevOps Engineer: packaging, release metadata and updater resolution.

## Supporting Specialists

Coordinator: published installer extraction, checksum verification and release repair. Backend/data investigation is deferred pending affected Windows version and Sync result.

## Hypotheses

1. **Older Windows app remains installed:** Supported by broken update URL; missing the running Windows version and download/restart evidence. Not confirmed on the owner's machine.
2. **Windows artifact omits application fixes:** Contradicted by installer extraction confirming v2.2.2 and the new code paths. Exact installed file remains unknown.
3. **Windows local data/auth/schema refresh differs:** Possible if genuine v2.2.2 is installed. Missing affected record inputs, Sync result and reference loading errors; no evidence yet establishes a data or platform defect.

## Evidence

- `.github/workflows/release-desktop.yml`
- `notable-finance-app/electron-builder.yml`
- `electron-updater/out/providers/GitHubProvider.js` in installed dependencies
- Published `latest.yml` and extracted Windows installer payload
- Original and repaired installer asset SHA-256: `a1ac2dc99bc4fb6d4dbaafdeba2cde22b005fcac385d0a7b409b114bac4dcf7d`

## Most Likely Root Cause

Confirmed update-delivery defect: upload filename rewriting left the Windows feed pointing at a missing installer asset. Root cause of the owner's remaining Windows symptoms is not yet determined.

## Confidence Level

High for the distribution defect. Unconfirmed for the affected Windows installation.

## Recommended Fixes

Implemented: add the identical Windows installer under the feed's expected name, retaining the old asset; set an explicit space-free Windows artifact name for future packages; verify each generated manifest references an existing upload-safe filename before publication.

Validation: original mismatched names fail the new verifier; filenames containing spaces fail; repaired v2.2.2 names pass; verifier ESLint passes. Published original/alias asset sizes and SHA-256 digests match. No finance data was changed. Application tests were not repeated for packaging-only changes.

## Open Questions

The owner was asked for the version inside the running Windows app, exact remaining symptoms, and any error after Pull/Sync. If running v2.2.2, investigate that installation's inputs and schema/cache refresh rather than assuming the updater repair resolves it. Windows runtime acceptance remains NOT_RUN.

## RCA Needed?

No formal RCA required for this scoped distribution repair unless requested. Continue the runtime investigation when Windows evidence is available.

## Follow-up: owner confirms both running apps are v2.2.2

The owner confirms Windows and macOS both show v2.2.2. Windows Expected payment date is `-`, and Pasabuyer balance/related figures remain wrong despite no Sync error. Therefore the repaired download mismatch does not establish the cause of this runtime issue.

Compared the actual published Windows installer's renderer functions with the installed Mac archive: `expenseAmounts`, installment/paid/remaining/Pasabuy functions, expected-date helpers, `useExpenseForm`, and `makeDeriveExpenseComputed` are identical. Executed the published Windows expected-date function with a populated fixture under Asia/Manila, America/Los_Angeles, Europe/London and UTC: all produced `2027-02-10`. This is function-level verification on macOS, not Windows runtime acceptance.

A source-level candidate remains: form/table account lookup uses `activeAccounts`, excluding inactive, Auxiliary and unsynced accounts. Monthly Expected payment date returns null if the account cannot be resolved or billing/due days are missing. Pasabuy figures additionally depend on category, period count, status, paid periods and receiver. No Windows record inputs have been supplied, so none of these conditions is confirmed on the affected installation.

Prepared `notable-finance-app/scripts/diagnose-expense-formulas.js`, a read-only DevTools diagnostic for one uniquely named record. It calls only local list APIs and emits formula dependencies without description, buyer name, monetary amounts, IDs or tokens. Synthetic complete/inactive/missing-account fixtures passed and verified those private fields are omitted. It does not sync or write. Windows evidence remains pending; no financial formula semantics were changed during this follow-up.

## Owner clarification

The report is from the owner's friend using Windows; the owner is currently on the working Mac and cannot inspect that installation. Friend's account is reported active. Affected entries are monthly installments with both filled and blank BNPL adjustments; all formulas are reported wrong, including Pasabuyer Balance. Treat required fields as reportedly populated, not independently verified. Do not repeat the inactive-account hypothesis as the established cause.

Added a Windows-specific CI job and isolated Electron formula fixtures to obtain actual Windows execution evidence. The saved Notion Pasabuyer Balance contract remains Expense Amount minus (gross installment times Pasabuy paid periods), or zero when fully received. This can differ from an expectation that the remaining balance includes all interest; no formula-rule change is justified without confirming that intent or the friend's schema.
