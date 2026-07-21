# Local Data Schema (SQLite)

The local-first store for the desktop app. SQLite (via `better-sqlite3` + `drizzle-orm`) is the working source of truth on the device. This document defines the tables, the sync bookkeeping columns, and the rule that derived values are computed, not stored.

## Design rules

1. **Every finance row carries sync bookkeeping** (`id`, `notion_page_id`, `base_snapshot`, `sync_state`, timestamps) — see below.
2. **Local UUID primary keys.** Records created offline get a local UUID before Notion knows about them; `notion_page_id` is filled after first push.
3. **Keep all history forever.** No retention cap; SQLite handles this trivially.
4. **Soft delete, never hard delete** for incomes/expenses (a `deleted` flag + title rewrite).
5. **Reference data is cached read-only** (accounts, categories) — pulled from Notion, not user-editable.
6. **Writable vs computed** columns are tagged per the [canonical mapping](../shared/notion-field-mapping.md).

## Common sync columns

Every synced finance table includes:

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | TEXT (UUID) PK | Local identity, minted offline. |
| `notion_page_id` | TEXT NULL | Notion page id; null until first push. |
| `base_snapshot` | TEXT (JSON) | Writable fields as of last successful sync — the three-way-merge ancestor. |
| `sync_state` | TEXT | `clean` \| `dirty` \| `conflict`. |
| `local_updated_at` | INTEGER (ms) | Set on every local edit. |
| `notion_last_edited_at` | TEXT NULL | Last `last_edited_time` seen from Notion (minute-rounded; a coarse hint only). |
| `deleted` | INTEGER (0/1) | Soft-delete flag; propagated as a title rewrite. |
| `created_at` | INTEGER (ms) | Local creation time. |

## Tables

### `accounts` (reference, read-only cache)
Cached from Notion. Inputs `starting_balance`, `credit_limit`, `account_type`, `inactive` are stored so balances can be recomputed locally. `current_balance` / `available_limit` are **not stored** — they are derived (see below).

```
accounts(
  id, notion_page_id, account_name, account_type,
  starting_balance REAL, credit_limit REAL, inactive INTEGER,
  billing_day, due_day, annual_fee, credit_points,
  notion_last_edited_at, created_at
)
```

### `income_categories`, `expense_categories` (reference, read-only cache)
Cached selectors. `expense_categories` stores `monthly_budget` (input) for local spending/remaining math. `auxiliary` marks categories excluded from normal income forms.

### `incomes` (writable)
```
incomes(
  <common sync columns>,
  title, gross_income REAL, capital_expenditure REAL,
  account_id, category_id, date, notes,
  is_transaction INTEGER,          -- transactions extend incomes
  transacted_account_id, cc_payment_covered_id  -- transaction-only
)
```
Computed (not stored): `net_income = gross_income - capital_expenditure`.

### `expenses` (writable)
```
expenses(
  <common sync columns>,
  title, amount REAL, interest REAL,
  account_id, category_id, purchase_date, date_paid,
  is_pasabuy INTEGER, pasabuyer,        -- Pasabuy flow
  cc_fields...                          -- shown only for Credit Account / BYPL
)
```

### `expense_scheduler` (writable)
Recurring/planned expense definitions that generate `expenses` rows.

### `conflicts` (bookkeeping)
```
conflicts(
  id, record_table, record_id, field,
  base_value, local_value, remote_value,
  detected_at, resolved_at, resolution   -- 'local' | 'remote' | 'manual'
)
```

### `sync_meta` (bookkeeping)
Key/value: `last_pull_cursor`, last sync timestamps, per-resource cursors.

### `app_settings` (local config)
Sync mode (`manual` | `auto`), interval seconds, window prefs, onboarding state. The Notion token is **not** here — it lives in the OS keychain (see [`security.md`](security.md)).

### `mutation_queue` (durability)
Append-only journal of pending local mutations so offline edits replay in order and survive a crash.

## Derived values are computed, not stored

Balances, budget spending, net income, and monthly figures are **never persisted as authoritative values**. They are recomputed from current SQLite rows whenever the underlying records change. This is what makes them real-time and offline, and it guarantees they can never drift from the records.

Reusing the web app's reduce logic (`notion-reporting.service.ts`), against SQLite:

| Derived value | Computation |
| --- | --- |
| Account `Current Balance` (non-credit) | `starting_balance + Σ incomes.to(account) − Σ expenses.from(account)` |
| Account `Current Balance` (credit) | `−(Σ charges + Σ interest − Σ payments)` (signed per app convention) |
| Account `Available Limit` (credit) | `credit_limit − outstanding` |
| Income `Net Income` | `gross_income − capital_expenditure` |
| Category `spending` | `Σ expenses where category_id = c (amount + interest)` |
| Category `remaining` | `monthly_budget − spending` |
| Monthly earnings / gross / net | reductions over scoped income/expense records |

Only **writable inputs** (`starting_balance`, `credit_limit`, amounts, interest, dates, category/account links) are stored and synced; Notion recomputes its own copies of the computed fields via its formulas after a push.

## Migrations

- Drizzle migration files under `main/db/migrations`, applied on app start.
- Migrations must be additive and safe (the local DB holds all of the user's history).
- Schema version tracked in `sync_meta`.

## Bring-your-own-Notion

Property names and database ids per table are **not** hardcoded — they are captured at onboarding and stored in `app_settings` / a mapping table, then validated by schema verification. See [`onboarding-and-notion-connect.md`](onboarding-and-notion-connect.md).
