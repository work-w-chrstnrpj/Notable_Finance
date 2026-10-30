# Desktop UI/UX redesign

Branch: `ui-ux-redesign`. Scope agreed in the design conversation: a presentation refactor plus the CC Transaction behavior change. The interactive proposal is design evidence, not a complete implementation specification or acceptance result.

## Plan and boundaries

1. Preserve existing finance calculations, CRUD, deletion policies, sync, page content, receipts, bulk operations, shortcuts, workspace tabs and multi-window behavior.
2. Preserve theme presets, light/dark/system appearance, custom colors, body/mono/brand/receipt fonts and saved preferences. Use existing theme variables; do not overwrite user settings during the redesign.
3. Replace Unpaid CC navigation with CC Transaction, date-scoped by purchase date (Daily, Weekly, Monthly, Annually), including paid and installment records. Combine Account, Category and Payment Status filters; show Pasabuy Payment Status and Pasabuyer when Category is Pasabuy.
4. Remove standalone Unpaid Pasabuy navigation. Preserve cash-account Pasabuy access through ordinary Expense period views and category/status filters. Show Pasabuy balance, buyer, status, payment date and receiver columns alongside the current view's columns.
5. Group navigation into Overview, Money movement and Workspace. Keep identifiers, shortcuts, enabled Chat/Dev Logs conditions, collapse and tabs.
6. Group Dashboard metrics into monthly activity and current account position. Keep all eight metrics and all supporting panels. Label Alkansya Balance as all time. Keep ranking panels expanded; the proposal's disclosure remains an optional design decision.
7. Replace the record editor's 3D flip with visible Details and Page content section controls. Keep form fields mounted, retain view/edit/duplicate/delete/save actions, and describe saving locally before Notion sync.
8. Refine shared controls, metric cards and tables: theme-aware surfaces, calmer selection, visible selection boxes and horizontal scroll affordance, reduced-motion support.
9. Validate behavior, update documentation, and review the rendered desktop before release. More extensive screen-specific restructuring of Settings, Sync, Monitoring, Accounts and Chat is a later design-review slice; these screens inherit shared styling in this change.

## Implementation boundaries

- Renderer layout owns navigation; `ExpenseToolbar` owns presentation, not finance state.
- `FinanceWorkspace` persists `workspace.ccPeriod` alongside the existing date anchor and view. The top date selector and expense query use the same period.
- Shared record hooks continue to own selection, persisted filters, search, optimistic writes and bulk actions.
- `main/domain/query-filters.ts` owns credit-account scope and purchase-date filtering. CC Transaction has no implicit unpaid-only restriction. Historical Unpaid CC queries retain their historical unpaid semantics for compatibility.
- Saved Unpaid CC workspace mode normalizes to CC Transaction, defaulting to Monthly. A saved Unpaid Pasabuy view switches to Monthly with its Pasabuy category selected when reference data becomes available. Old records remain accessible by adjusting the period/date; the replacement is date-scoped, unlike the historical all-time view.
- Hidden Pasabuy filters do not constrain queries when Category is no longer Pasabuy. Disabled filters do not constrain results.
- Cover expenses remains available for outstanding non-installment records; selecting paid or installment records in the expanded CC view produces an explanatory message instead of opening the cover flow.
- CC receipts retain the existing remaining-balance value, now explicitly labeled Remaining Balance, and show the selected period correctly.
- Main/preload ownership, SQLite schema, Notion writes, accounting derivations and web application behavior are unchanged. No migration is required; settings JSON is normalized with a default for the new period.
- The shared modal retains the historical `FlippableModal` export to avoid unrelated import churn, but implements explicit section switching and focus containment.

## Acceptance and verification

Automated checks:

- Paid, unpaid and installment credit records; exclude cash records from CC Transaction.
- Daily/weekly/monthly/annual inclusive bounds and combined category/payment/Pasabuy status filters.
- Non-credit Pasabuy remains accessible in regular period views.
- Existing table columns, totals, selection, bulk actions and optimistic saves.
- Theme/fonts survive workspace normalization; old CC mode normalizes predictably.
- Details/Page content switching preserves unsaved input and retains record actions.
- TypeScript, lint, production build, Vitest and isolated Electron end-to-end tests.

Manual release acceptance (do not infer from unit tests):

- Light, dark, system appearance and all existing presets; custom colors and all font roles survive reload.
- Narrow desktop windows and 200% zoom; long labels and large monetary values remain readable.
- Keyboard-only operation, focus return, shortcuts, reduced motion and screen-reader labels.
- All Expense modes, CC periods, all status combinations, category changes and old saved-view upgrade.
- Cover / Bulk CC Pay eligibility, receipts, printing, duplicate and deletion settings.
- Actual offline/dirty/conflict/sync states, separate windows, export layouts and settings access.

Implementation is reviewable on the branch. Manual visual/accessibility acceptance is still required before calling the redesign release-ready.

## Verification record — 2026-09-30

- `npm --prefix notable-finance-app run typecheck`: passed.
- `npm --prefix notable-finance-app run lint`: passed with 95 warnings, zero errors. Existing complexity/size/hook warnings remain; this is not a warning-free baseline.
- `npm --prefix notable-finance-app run build`: passed; existing empty CSS import warnings remain.
- `npm --prefix notable-finance-app run test`: 285 passed, 7 skipped. The backup suite skips when the Node SQLite native binding is unavailable; those seven tests are not claimed as verified.
- From `notable-finance-app/`, `npm exec -- playwright test`: 35 passed, using isolated temporary user data. Includes the new CC period/filter journey and existing CRUD/shortcut/multi-window checks.
- Unit tests requiring a localhost HTTP server and Electron tests required sandbox permission. Their successful reruns are the recorded results.
- Inspected generated Dashboard and CC Transaction screenshots from the light-theme fixture. This does not constitute full theme/font/accessibility acceptance.
- `git diff --check`: passed. No commit, push, production-data operation, or schema migration performed.

The implemented slice covers the shared foundations, shell grouping, Dashboard hierarchy, record sections and CC Transaction changes. Dedicated screen-by-screen makeovers beyond these shared changes remain review work, not completed delivery.

### Follow-up appearance and organization checks

- Expense View and CC Period controls now precede search and filters, making the scope of the results clear before narrowing them.
- Settings places Theme beside Interface, retaining all appearance and font controls. Sync Center uses clearer local-save wording and places database reset in a separate Maintenance section; its existing confirmation remains intact.
- System appearance changes now reapply preset color tokens. Previously applied preset tokens are cleared when presets change, preventing stale overrides.
- Added theme regression coverage for all six presets in light/dark modes, preserved font choices, and system appearance changes. Targeted theme and Expense tests: 27 passed.
- Typecheck, production build and lint passed after these changes. Lint retains warnings; no lint errors.
- Isolated Electron app acceptance suite: 7 passed, including custom accent and four font settings surviving reload, dark appearance, and a narrow window without horizontal document overflow. The screenshot waits for the navigation drawer transition to finish; the settled dark Dashboard image was inspected.
- These checks supplement the earlier full-suite record; full manual accessibility, 200% zoom, and screen-by-screen visual acceptance remain pending.

### Expense header revision

Expense views use the shared header segmented control again, ordered Daily, Weekly, Monthly, Annually, All Records, CC Transactions, To Pay, To Buy, Installments. All Records removes the date bounds and lists every available expense. The CC period selector offers Daily, Weekly, Monthly, Annually, and All Records; its All Records option includes every available credit-account transaction. The optional payment/Pasabuy filters remain available. CC Transactions includes every credit-account payment status within the selected purchase-date period; selecting the view clears previous filters. The persisted internal `CC Transaction` key remains unchanged for compatibility.

### Expense review corrections

- CC descriptions and amounts no longer inherit unconditional unpaid coloring: paid and cancelled entries use normal text.
- Row selection controls are hidden at rest and shown on hover, keyboard focus, or selection; touch controls and the select-all checkbox remain visible.
- Expense header tabs occupy the same full-width layout as Income.
- CC period selection sits in the filter row with no visible Period title, retaining its accessible name.
- Expense account, category, payment, Pasabuy and period selectors share a 220px width, 36px height, border, radius, and typography through a shared filter-row CSS module used by both Expense and Income.

Income account and category filters now use the same shared sizing and styling as Expense (220px wide, 36px high), preventing the two screens from drifting apart.

### Header, monthly summary and branding refinements

The CC period selector now follows Filters visibility. This month contains four cards: Income, Expenses, Savings, and Monthly Total Transactions (the existing credit-account total); the separate CC total strip is removed. The top bar retains connectivity, Last Sync and Sync, with matching connectivity/Sync dimensions; schema verification remains in Settings. The supplied new-logo/notable-finance.png supplies the sidebar, favicon and app icon. build/icon.icns contains packaging sizes generated from the supplied 167px artwork; a higher-resolution source would improve large-icon sharpness.

The header now uses three aligned regions: connectivity on the left, the date selector centered in the header, and Last Sync/Sync on the right. On narrow layouts the date selector remains centered on a second row to avoid overlapping controls.

Chat dashboard summaries now use the same definitions as the Dashboard cards: gross income and expenses excluding Pasabuy pass-through records. Assistant replies provide Copy and native Share actions beneath the reply.

### October 1 review corrections

To Pay supports All Credit Accounts and All Debit Accounts (all non-credit account types). Group filtering applies before table totals and selection, without passing synthetic IDs to the data API. Inactive search has no outline; header selection appears on hover, focus or existing selection. Accounts filter controls share a 36px height. Daily and Weekly use a single day calendar, including month navigation and leap-day support; date selector and popup share a 280px width.


## Workflow account filters and search

Alkansya, Transfer, Credit Card Payment, and Receivables expose the same Filters and Search controls as Income/Expense, including the matching keyboard shortcuts. Filters and search combine within the current workflow scope. Transfer/CC Payment retain the selected month. Alkansya and Receivables have Daily, Weekly, Monthly, Annually, and All Records view tabs. All Records removes date bounds and shows every available record; the global date selector is hidden in that mode. Alkansya and income-backed Receivables use Income Date; Pasabuy expense rows in Receivables use Date Paid. Account filters match either source/destination for Transfer and either credit/payer account for CC Payment. No Account means an empty receiving account, including Receivables. Closing Filters removes its constraint; closing Search clears its query. Navigating between workflows resets these controls. Table rows, visible totals, select-all, bulk duplication, and Receivables receipts use the filtered rows.

Income and Expense also offer All Records alongside Daily, Weekly, Monthly, and Annually. The option removes date bounds while retaining the page's normal deleted-record exclusion and any enabled filters. CC Transactions has the same All Records date scope. Monthly Monitoring remains period-based because its budgets and forecasts are scaled to the selected period.

Alkansya's category is read-only Savings in create and edit forms. Creates and duplicates omit a category override so main resolves the canonical Savings category; editing retains the existing Savings category. Receivables keeps its category selector.

Receivables also lists paid Pasabuy expenses when the expense category is exactly `Pasabuy`, Payment Status is `Paid`, Date Paid is set, and Pasabuy Status is not `Payment fully received`. These rows represent the remaining Pasabuyer Balance and use Date Paid in the list/receipt. Clicking one opens a focused Pasabuy receivable modal in place. It shows only Purchase description, Pasabuyer, Pasabuy Status, Date of Payment, Account Receiver, paid period, and the computed received amount/balance. Edit saves a sparse patch to the original Expense row; hidden purchase, account, amount, category and credit-payment inputs are untouched. The full Expense editor remains available from Expense. Existing Income-backed Receivables and Money Lent keep their own editors.

All Receivables rows are selectable, including Pasabuy Expenses. Header and keyboard select-all use the same visible rows, and keyboard activation of a checkbox does not open its row. Selection is pruned when records leave the view. Disable/Enable applies to either record type and updates visible totals and printable receipts. **Bulk Pasabuy** appears only when every selected visible item is a Pasabuy Expense. It opens the shared Expense bulk-editor with only the five Pasabuy input fields and the existing fully-received/date-today/paid-period-one preset; receiver starts blank and can be selected or cleared. A partial failure keeps failed IDs for retry without reapplying successful rows. Income-only selections retain Duplicate/Delete; expense or mixed selections do not expose those Income actions. No namespaced Expense IDs are sent to Income writes.

## Money Lent in Receivables

Receivables also includes account-linked negative `Money Lent` Income rows. **New Record → Categories** includes the auxiliary **Money Lent** category; choosing it switches to positive Amount lent and a required Source Account/date while hiding Capital Expenditure. **Lend money** opens the same fields with Money Lent preselected. New drafts can switch categories; existing loans retain a locked Money Lent category. Tables, totals and printable receipts show a positive amount owed. Existing Add Receivable and Pasabuy behavior remains available. Opening a loan offers **Record repayment** with explicit Same account / Transfer to another account paths. The original account is displayed as read-only Source Account; Transfer Account is required for the transfer path and excludes the source. A source → destination preview and **Convert to Transfer** action make the direction explicit. Same-account confirmation soft-deletes; Transfer converts the same row. Eligible negative Alkansya entries offer **Reclassify as money lent**. See [Money Lent](money-lent.md) for data rules and limitations.
