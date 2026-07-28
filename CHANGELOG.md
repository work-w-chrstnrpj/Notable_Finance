# Changelog

All notable changes to Notable Finance will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Bulk CC Pay / Bulk Pasabuy quick-action presets in Bulk Edit modal
- Pending edit navigation from History page to edit modals on Income/Expense/Workflow pages
- Record detail modals in History page with field-level diff display
- Push Unsynced / Cancel Syncing Unsynced bulk actions in History page

### Changed
- Release v1.1.0

---

## [1.1.0] - 2026-07-29

### Added
- Sync conflict display now distinguishes null (∅ empty) vs `""` blank vs literal values
- Sync conflict field values resolved server-side (account/category FK UUIDs → display names)
- Source account excluded from Transfer account dropdown
- Transfer name prefill: "Transfer" (auto-negates grossIncome)
- CC Payment name prefill: "CC Payment —"
- Receipt font independently configurable via `receiptFont` in UiFontSettings (default "Instrument Serif")
- Expense form validation: Account & Category required with red * and shake animation
- Position-based → ID-based (UUID) refactor across data-table, income, expense, workflow, accounts pages for search-then-disable bug fix
- Cover the expense feature: mass linking of CC expenses to CC Payment receipts via CoverExpensesModal
- Unpaid Pasabuy view: Account column added between Name and Pasabuyer Balance
- Bulk toolbar repositioned to prevent overlap with side nav
- CoverExpensesModal UI refinement: custom radio indicators, tighter rows, + New ghost button
- "Mass Edit" → "Bulk Edit" rename across expense and income pages
- Bulk Edit modal preset quick-action buttons: Bulk CC Pay and Bulk Pasabuy
- Toast notification system replacing inline save notices across expense, income, history, and finance-workspace pages
- Sync success/failure toasts in finance-workspace (push, pull, full sync)
- `receiptFont` CSS variable (`--font-receipt`) applied on receipt div
- Database migration 0009: adds `payload` column to `activity_log` for full record payloads in history
- History page: record detail modals with read-only form views and old→new diff display
- Pending edit system for History→page auto-open edit modal navigation

### Changed
- Sync conflict display now clearly distinguishes null (∅ empty) vs `""` blank vs literal values
- Account balance computation uses raw sums with single final rounding to prevent ±0.01 drift
- `transactionAmount()` removes intermediate rounding for correctness
- Filter state fully reset when switching Daily/Weekly/Monthly view mode
- `selectedIds`/`disabledIds` changed from `Set<number>` to `Set<string>` (UUIDs) across all pages
- Position-based row lookups replaced with ID-based `.find()` / `.filter()` throughout
- Mass toolbar positioning centering changed from translateX to margin auto + width fit-content

## [0.2.0] - 2026-07-14

### Added
- Performance optimization (P0-P5) for backend and frontend
- Expense view formalization (Daily, Weekly, Monthly, Unpaid Pasabuy, To pay, To buy, Installments, CC Transactions)
- Search box and error messaging
- Print receipt support for Receivables
- Light/dark mode and theme color settings
- Background blurring for visual focus
- Recent transaction customization
- Winston structured logging
- Configuration validation at startup
- Passport JWT strategy
- Common finance types for API contracts

### Changed
- Filter UI refactored to collapsible toolbar rows
- Expense filter validation updates
- Icons and dark mode fixes

### Fixed
- Unpaid expense filter issues
- 45-second data disappearance issue
- Expense view validation and filter logic

## [0.1.0] - 2026-07-12

### Added
- Initial Next.js frontend foundation
- Initial NestJS backend foundation
- Dashboard, Accounts, Income, Expense, Monthly Monitoring pages
- Transfer, Credit Card Payment, Alkansya, Receivables workflows
- Notion database mapping and field classification
- API specification and technical design documentation
- Development plan and performance optimization plan

### Changed
- N/A (initial release)

### Fixed
- N/A (initial release)

---

**Legend:**
- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` in case of vulnerabilities