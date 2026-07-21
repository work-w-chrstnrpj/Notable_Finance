# Changelog

All notable changes to Notable Finance will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Sync button for explicit queued changes
- Schema verification button after Notion integration key configuration
- Email and Google sign-in authentication
- PostgreSQL metadata persistence with Neon Free
- Playwright E2E tests

### Changed
- Backend switched from development repository to live Notion API
- Frontend data fetching migrated to React Query

### Fixed
- Targeted cache invalidation for income/expense mutations
- Stale-while-revalidate behavior for silent refetches
- Optimistic UI updates for create/update/delete operations

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