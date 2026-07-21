# Shared Product Specification

This document is the **shared** product intent for both Notable Finance apps. The finance features, workflows, validation rules, and acceptance criteria are **identical** across web and desktop — they are canonically specified in the web product spec, which this document does not duplicate:

- Canonical feature/workflow detail: [`web/product-specification/product-specification.md`](../web/product-specification/product-specification.md)

What follows is (1) the shared product summary and (2) the **desktop-specific deltas** — the behaviors that differ because the desktop app is local-first.

## Product summary

Notable Finance is a personal finance application layered over a user's existing Notion workspace. It provides a clean UI for day-to-day encoding, viewing, validation, and synchronization of financial records across these Notion database groups: Accounts, Income Categories, Incomes, Expense Categories, Expenses, Transactions, Expense Scheduler, and Monthly Monitoring.

Primary sections (identical in both apps): **Dashboard, Accounts, Income, Expense, Monthly Monitoring, Transfer, Credit Card Payment, Alkansya, and Receivables.**

Core product rules that hold for **both** apps:

- The app is an encoding, viewing, validation, and sync interface over a Notion workspace.
- Computed Notion fields (formulas, rollups, reverse relations, system values) are never editable in normal forms. See [`notion-field-mapping.md`](notion-field-mapping.md).
- Accounts, Income Categories, and Expense Categories are read-only reference data maintained in Notion.
- Incomes and expenses are **soft-deleted** by rewriting the title to include `[Deleted: Amount]` and clearing the amount; they are never hard-deleted.
- Dashboard, Monthly Monitoring, Income, Expense, and category reporting values are **calculated in app code from scoped records**, not read from Notion's calculator formulas.

## Desktop deltas (local-first)

The desktop app delivers the same features with these behavioral differences:

1. **Local source of truth.** The desktop app's own SQLite database is the working source of truth on that device. Notion becomes a bidirectional mirror/backup rather than the store queried on every action. See [`../desktop/desktop-architecture.md`](../desktop/desktop-architecture.md).

2. **Offline-first.** Every read and write works with no network. Creating, editing, and (soft-)deleting records is always available; sync happens separately in the background or on demand. See [`../desktop/offline-and-state-model.md`](../desktop/offline-and-state-model.md).

3. **Real-time derived values.** Because balances, budget spending, net income, and monthly figures are computed locally from the current SQLite state, they update **the instant a record changes**, before any sync. Account balance and budget spending are always current locally. See [`../desktop/local-data-schema.md`](../desktop/local-data-schema.md#derived-values-are-computed-not-stored).

4. **Configurable sync.** The user writes locally and instantly; syncing to/from Notion is either **manual** (a Sync action) or **automated** on a configurable interval that both pushes local changes and pulls remote changes. Remote (Notion-side) edits surface in the app **only after a pull completes**.

5. **Sync-state visibility.** Records not yet pushed to Notion are visibly marked "not yet synced." The UI never shows stale data without a badge. See [`../desktop/offline-and-state-model.md`](../desktop/offline-and-state-model.md).

6. **Bring-your-own-Notion (multi-workspace capable).** The desktop app is single-user per installation but not hardcoded to one workspace. On first run the user connects their own Notion integration and maps/verifies their databases; nothing is baked in. This makes the app shareable to other people using their own Notion. See [`../desktop/onboarding-and-notion-connect.md`](../desktop/onboarding-and-notion-connect.md).

7. **Conflict handling.** Because a record can change both locally and in Notion, the desktop app reconciles with a three-way merge and **prompts the user** to resolve true same-field conflicts. In normal single-user operation these are rare. See [`../desktop/sync-and-conflict-design.md`](../desktop/sync-and-conflict-design.md).

## Non-functional requirements (desktop)

- **Platforms:** macOS, Linux, Windows. Distribution is personal (unsigned) for now; code-signing/notarization is a future step when the app is shared. See [`../desktop/packaging-and-release.md`](../desktop/packaging-and-release.md).
- **Data retention:** all history is kept locally, indefinitely.
- **At-rest protection:** relies on OS full-disk encryption; the Notion token is stored in the OS keychain via Electron `safeStorage`. See [`../desktop/security.md`](../desktop/security.md).
- **Performance target:** local reads/writes and derived-value recomputation are instant (single-digit ms) against SQLite.

## Out of scope (initial desktop)

- Real-time (webhook-driven) Notion push; sync is pull-on-interval/manual.
- Automatic de-duplication of records created independently on both sides (a Notion-created record and a locally-created record are distinct records).
- Code-signing/notarization and public auto-update infrastructure (documented as future in packaging).
