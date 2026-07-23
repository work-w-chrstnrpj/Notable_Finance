# Canonical Notion Field Mapping

This is the **shared, canonical** classification of every Notion field into `writable`, `computed`, `relation`, or `hidden`. It governs what may be written to Notion by either app and what must be derived or cached. It is sourced from the web app's `mapping.service.ts` / `notion-property-mapper.ts` and verified against the live `Accounts '25` data source.

A full live property dump lives alongside this page as [`notion-schema.json`](notion-schema.json) (exported from the linked Notion databases). Use it to confirm exact property names/types; keep this Markdown as the behavioral classification.

## The rule (applies to both apps)

> **Only `writable` fields are ever written to Notion. `computed` fields (formulas, rollups) and reverse `relation` fields are read-only: pulled and cached for display, or recomputed locally — never written. System fields (`created_time`, `last_edited_time`) are read-only and used only for sync bookkeeping.**

Consequence for sync: because computed fields are never written, they can never cause a write conflict. Each side (the app and Notion's own formula engine) derives its own copy from the same writable inputs, and they converge.

## Field categories

| Category | Examples | Behavior |
| --- | --- | --- |
| `writable` | amount, interest, gross income, capital expenditure, dates, flags, account/category relations (forward), `Starting Balance`, `Credit Limit` | App may create/update these in Notion. |
| `computed` | `Current Balance`, `Available Limit`, `Net Income`, `Total Incomes`, `Total Expenses`, `Monthly Earnings`, `Earning Percentage` | Formula/rollup. Recomputed locally (see below) or cached read-only. Never written. |
| `relation` (reverse) | account `Incomes`, `Expenses`, `Pasabuy`, `CC, Debt or Transfer` | Reverse relations. Read-only. |
| `hidden` | `Transaction Amount`, `Monthly Capital Expenditure Sorter`, `Monthly Net Sorter` | Notion-internal helpers. Not shown in normal UI; never written. |

## Resource-level classification (from `mapping.service.ts`)

| Resource | `readOnly` | Writable fields | Computed fields |
| --- | --- | --- | --- |
| Accounts | yes | — | `currentBalance`, `availableLimit` |
| Income Categories | yes | — | `monthlyEarnings`, `monthlyGross`, `earningPercentage` |
| Expense Categories | yes | — | `spending`, `remaining`, `overview`, `totalOverview` |
| Incomes | no | income inputs | `netIncome`, `transactionAmount` (hidden) |
| Transactions | no | income inputs + `transactedAccount`, `ccPaymentCovered` | `netIncome`, `transactionAmount` (hidden) |
| Expenses | no | expense inputs | (category-derived totals) |

## Accounts `'25` — verified schema (live)

Data source: `collection://bd6f39b1-fae7-837d-a730-878f92946eee`.

**Writable inputs:** `Account Name` (title), `Account Type` (select), `Starting Balance` (₱ number), `Credit Limit` (₱ number), `Annual Fee`, `Billing Day`, `Due Day`, `Credit Points`, `Inactive` (checkbox), label/text fields.

**Computed (formula):** `Current Balance`, `Available Limit`.

**Computed (rollup, sums over related records):** `Total Incomes`, `Total Expenses`, `Total Credit Interest`, `Total CC, Debt & Transfer`, `Total Pasabuy`.

**Reverse relations:** `Incomes`, `Expenses`, `Pasabuy`, `CC, Debt or Transfer`.

### How the account formulas are resolved locally (desktop)

Because `Starting Balance` and `Credit Limit` are stored **inputs** and every delta comes from related income/expense records the app already holds, the desktop app recomputes these offline:

- **Cash / Debit / Savings / e-Wallet / Digital Bank:**
  `Current Balance = Starting Balance + Σ(incomes to account) − Σ(expenses from account)`
- **Credit Account / BYPL:**
  `outstanding = Σ(charges) + Σ(credit interest) − Σ(payments via CC/Debt/Transfer)`
  `Current Balance = −outstanding` (or the app's signed convention); `Available Limit = Credit Limit − outstanding`

The exact credit arithmetic is finalized from the Notion formula during implementation; the **inputs are entirely local**, so the value is always derivable offline. This reuses the reduce logic already in the web app's `notion-reporting.service.ts`.

> Note: the web app *reads* `Current Balance` from Notion's formula. The desktop app *recomputes* it locally so it is correct offline and in real time. Same inputs → same number.

## Related data sources referenced

- Incomes/Transactions: `collection://e1cf39b1-fae7-827e-8a8e-0772b5fe4455`
- Expenses/Pasabuy: `collection://b1ef39b1-fae7-82fe-8645-07f95baa62e2`

When onboarding a **different** workspace (bring-your-own-Notion), these IDs and property names are discovered and verified per user; nothing is hardcoded. See [`../desktop/onboarding-and-notion-connect.md`](../desktop/onboarding-and-notion-connect.md).
