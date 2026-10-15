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

`src/renderer/src/components/pages/expense/expense-formulas.test.tsx` loads saved records into the real form hook and compares table figures. It covers Paid/Unpaid/Installment Pasabuy, non-even installments, receiver gating, interest/principal distinction, fully received status, BNPL expected dates and zero-period defaults. `test/notion-formulas.test.ts` keeps the existing account-balance formulas locked. All consumers use `src/shared/notion-formulas.ts`; the main domain module re-exports it.

Before release, open representative records in the packaged app and compare received/balance values with Notion after a successful pull. Expected date remains blank for missing payment frequency or a set Date Paid; monthly dates additionally require account billing/due days. Automated tests do not establish live workspace parity.

`test/pasabuyer-options.test.ts` verifies schema-only (unused) choices, exact labels, rename/removal and empty-list refreshes, durable offline fallback, bad-property handling and database remapping isolation. `expense/pasabuyer-options.test.tsx` exercises the real provider/form and bulk field catalogue across a reference refresh, preserving a retired saved selection. Verify Notion option edits via Sync in the packaged app; options are fetched from schema, never inferred from existing records.

## Windows formula acceptance

Desktop CI includes a Windows-specific job for the shared formula/form regression suites and Electron monthly installment tests. Exercise active synced accounts, monthly frequency, and blank/zero/nonzero BNPL adjustment in the built app. Assert Expense table and record-modal values, including Gross Price, Installment Amount, Paid Amount, Remaining Balance, Expected payment date, Pasabuy Received Amount and Pasabuyer Balance. Use isolated fixture data; never seed a user's profile.

A passing Windows fixture test establishes behavior for those inputs only. It does not establish the values imported by another user's Notion mapping or their expected Pasabuyer formula semantics. Keep affected-installation acceptance open until a representative actual record can be compared.
