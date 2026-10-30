# Desktop Testing Strategy

Testing priorities for the local-first app. The bar is **full offline + conflict simulation coverage** for the sync engine, plus **Electron end-to-end** tests for the app as a whole.

## Test layers

| Layer | Tooling | Scope |
| --- | --- | --- |
| Unit | Vitest | Domain/reporting derivations, mapping, validation, three-way-merge diff. |
| Integration | Vitest + real SQLite (temp file) | DB migrations, repositories, sync reconcile against a **mock Notion adapter**. |
| End-to-end | Playwright + Electron | Full app: onboarding, CRUD, offline behavior, sync, conflict resolver UI. |

## Sync engine — the priority

The sync/conflict engine is the highest-risk component and gets scenario-based simulation tests. Using a **mock Notion adapter** (in-memory pages with `last_edited_time`), assert the reconcile outcome for each case in the [scenario matrix](sync-and-conflict-design.md#scenario-matrix):

- New locally (offline) → creates page, stores id, no duplicate on retry.
- New in Notion → inserts locally.
- Edited only locally / only in Notion → push / pull.
- Edited both, **disjoint** fields → auto-merge (no prompt).
- Edited both, **same** field → conflict raised + logged + prompt payload correct.
- Soft-delete vs edit → treated as field change; overlap prompts.
- Rate-limit (simulated 429) → backoff, retry, eventual success, **idempotent** (no dup).
- Crash mid-sync → mutation queue replays; no lost or double-applied edits.

Assert invariants: **computed fields are never written to Notion**; `base_snapshot` advances only on successful sync; derived values always equal a fresh recomputation from records.

## Offline coverage

- All CRUD works with the Notion adapter forced offline.
- Derived values (balance, budget) update instantly offline.
- `sync_state` badges appear/clear correctly through offline→online transitions.
- No data loss across app restarts while offline.

## Derived-value correctness

Golden tests comparing local derivations against expected values for representative accounts (cash and credit), matching the web app's reporting outputs, so the "same logic as web" guarantee is verified.

## E2E flows (Playwright + Electron)

1. First-run onboarding: connect (mock/fixture token), map databases, verify schema, initial pull.
2. Create/edit/soft-delete income and expense; balances update live.
3. Multi-window: change in one window reflects in another.
4. Manual sync and interval sync; status indicator states.
5. Conflict: force a same-field conflict via the mock adapter; resolve via the UI.

## Finance Copilot (Phase 6) — Vitest

Chat lives under `notable-finance-app/src/main/chat/` with unit tests in `notable-finance-app/test/chat-*.test.ts`.

| Suite | Focus |
| --- | --- |
| `chat-read-tools.test.ts` | Month resolve, skill routing, read allowlist, rebudget deltas |
| `chat-write-tools.test.ts` | Propose tools present, delete forbidden, draft cancel |
| `chat-overlays.test.ts` | Slash parse, keyword cheer, budget-guard, Approve quips |
| `chat-hardening.test.ts` | Apple FM probe gates + reason copy, prompt from tools / no propose, full allowlist parity, confirm/clarify rejects, expense profiles (CC/Pasabuy), refuse-delete Taglish |
| `chat-fingerprint.test.ts` | Credential fingerprint helpers |

Hardening invariants (must stay green):

- `CHAT_TOOL_DEFINITIONS` ↔ `executeChatTool` allowlist; no delete tool names.
- Incomplete drafts (`needs_input` / `missingRequired`) never apply via `confirmDraft`.
- Approve with zero BYOK credentials fails (“Select an API credential for writes”).
- Expense profile: CC fields only for credit-like accounts; Pasabuy fields for Pasabuy category / Unpaid Pasabuy view.
- Apple/on-device path only for read-only skills when prefer + available.

Phase 8 agent (planned): mock Notion adapter for forward vs reverse relation mismatch; `sum*` vs truncated `query*`; tool results never contain the Notion token; orchestrator respects agent round cap. See [`chat-diagnostic-copilot.md`](chat-diagnostic-copilot.md).

## CI

- Lint + typecheck + unit + integration on every change.
- E2E on a matrix approximating mac/linux/windows where feasible.
- Native module (`better-sqlite3`) rebuild verified in CI.

## Related

- [`sync-and-conflict-design.md`](sync-and-conflict-design.md) · [`offline-and-state-model.md`](offline-and-state-model.md) · [`local-data-schema.md`](local-data-schema.md)

## UI/UX redesign regression coverage

See [the redesign acceptance checklist](ui-ux-redesign.md#acceptance-and-verification). Added coverage exercises CC period bounds, all credit payment statuses, combined Pasabuy filters, non-credit Pasabuy access, saved theme/font preservation and record section input retention. Existing bulk/optimistic-save tests remain required. Rendered theme, font, accessibility and export acceptance must be checked separately from unit tests.

## Expense calculated-field regression

`src/renderer/src/components/pages/expense/expense-formulas.test.tsx` loads saved records into the real form hook and compares table figures. It covers Paid/Unpaid/Installment Pasabuy, non-even installments, receiver gating, interest-inclusive balance, fully received status, BNPL expected dates and zero-period defaults. `test/notion-formulas.test.ts` keeps the existing account-balance formulas locked. All consumers use `src/shared/notion-formulas.ts`; the main domain module re-exports it.

Before release, open representative records in the packaged app and compare received/balance values with Notion after a successful pull. Expected date remains blank for missing payment frequency or a set Date Paid; monthly dates additionally require account billing/due days. Automated tests do not establish live workspace parity.

`test/pasabuyer-options.test.ts` verifies schema-only (unused) choices, exact labels, rename/removal and empty-list refreshes, durable offline fallback, bad-property handling and database remapping isolation. `expense/pasabuyer-options.test.tsx` exercises the real provider/form and bulk field catalogue across a reference refresh, preserving a retired saved selection. Verify Notion option edits via Sync in the packaged app; options are fetched from schema, never inferred from existing records.

## Windows formula acceptance

Desktop CI includes a Windows-specific job for the shared formula/form regression suites and Electron monthly installment tests. Exercise active synced accounts, monthly frequency, and blank/zero/nonzero BNPL adjustment in the built app. Assert Expense table and record-modal values, including Gross Price, Installment Amount, Paid Amount, Remaining Balance, Expected payment date, Pasabuy Received Amount and Pasabuyer Balance. Use isolated fixture data; never seed a user's profile.

A passing Windows fixture test establishes behavior for those inputs only. It does not establish the values imported by another user's Notion mapping or their imported formula inputs. Keep affected-installation acceptance open until a representative actual record can be compared.

## Money Lent regression coverage

See [Money Lent verification](money-lent.md#verification). Run `npm test -- test/money-lent.test.ts test/page-extractors.test.ts src/renderer/src/components/pages/workflow.test.tsx` from `notable-finance-app/`; build and run `npx playwright test e2e/money-lent.spec.ts` for the three isolated Electron journeys. Full desktop lint/typecheck/Vitest/build remain required. Mocked sync verifies writable relation/sign parity and page identity; it does not establish live Notion acceptance.

## Receivables Pasabuy editing and selection

`src/renderer/src/components/pages/receivables-pasabuy.test.tsx` covers the in-place description/Pasabuy-only editor, sparse Expense updates, cancellation/errors, selectable mixed rows, header/keyboard select-all, child-checkbox keyboard isolation, resource-specific toolbar actions, Disable/Enable receipt totals, bulk field restrictions and partial-failure retries. Existing workflow, Expense form/formula and mass-edit tests cover shared-control regressions.

`e2e/receivables-pasabuy.spec.ts` exercises the built Electron app against an isolated SQLite profile: focused edits preserve hidden Expense values, Space/Enter toggle checkboxes without opening details, header selection includes both record types, and Bulk Pasabuy settles selected Expense rows through the real preload/main path. No live user profile or Notion workspace is modified.

Verified 2026-10-30: 383 Vitest tests passed (7 skipped) and all 47 Electron tests passed. Live Notion acceptance remains separate.

### Money Lent category-picker and repayment UI regression

The Money Lent suite now covers New Record → Categories → auxiliary Money Lent, switching a new draft back to a normal category, required distinct Transfer Account selection, Source Account preservation, and returning from transfer mode to same-account repayment. The cross-account Electron journey creates the loan through the regular category picker, then verifies in-place Transfer conversion and source/destination balances. Verified on 2026-10-30: 386 Vitest tests passed (7 skipped), six focused Money Lent/Receivables Electron journeys passed, and typecheck, lint (no errors), and build passed.

## v2.4.0 release verification (2026-10-31)

Full desktop verification passed: `npm run lint` (0 errors, 105 warnings), `npm run typecheck`, `npm test` (396 passed, 7 skipped), `npm run build`, and `npx playwright test` (all 47 Electron tests passed).

An additional temporary Electron smoke script exercised the real preload/main path in an isolated SQLite profile: credit-account due reminders, a synthetic error inbox entry, dismissal persistence after reload, hiding/restoring Notifications through Settings with the preference preserved after reload, and the record information icon toggling from Details to page content and back. The script and logs are local verification artifacts, not committed regression tests. `test/notifications.test.ts` covers reminder dates, unsettled-credit eligibility, and error-message redaction; `flippable-modal.test.tsx` covers the dialog toggle.

These checks do not establish live Notion parity or owner acceptance. Existing Money Lent and Receivables live-workspace acceptance remains pending.
