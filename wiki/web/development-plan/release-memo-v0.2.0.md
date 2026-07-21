# Release Memo — v0.2.0

**Release Date:** 2026-07-14
**Release Type:** Feature Release
**Previous Release:** v0.1.0 (2026-07-12)

## Executive Summary

Notable Finance v0.2.0 delivers significant performance optimizations, expense view improvements, and backend enhancements. This release focuses on optimizing the sync and caching layer, improving expense filter functionality, and adding user experience improvements like search and error messaging.

## Key Changes

### Performance Optimization (P0-P5)

**Backend Optimizations:**
- **Targeted cache invalidation** — Income/expense mutations now invalidate only the affected collection instead of clearing the entire 5-collection cache
- **Single-collection refill** — After targeted invalidation, only the stale collection is refilled on next read
- **Live cache manager** — New dedicated cache management service with collection-level invalidation
- **Notion mutation service** — Separated mutation logic from query service for better separation of concerns
- **Notion query service** — Separated query logic with optimized database queries
- **Notion reporting service** — Dedicated service for app-calculated dashboard and monthly monitoring responses

**Frontend Optimizations:**
- **Stale-while-revalidate** — Silent refetches no longer blank the visible table
- **Optimistic merge** — Local updates apply immediately without waiting for network
- **Optimistic create/update/delete** — Form submissions and deletions update UI instantly
- **React Query integration** — Adopted React Query for data fetching with stale-while-revalidate behavior

### Expense View Improvements

- **Formalized expense views** — Expense views now support Daily, Weekly, Monthly, Unpaid Pasabuy, To pay, To buy, Installments, and CC Transactions
- **Filter validation updates** — Improved filter logic for expense views
- **Collapsible toolbar rows** — Filter UI refactored to collapsible toolbar rows for better space utilization
- **Unpaid expense filter fixes** — Fixed filtering for unpaid expenses
- **Search box and error messaging** — Added search functionality and improved error messages

### Backend Enhancements

- **Configuration validation** — Startup configuration validation for required environment variables
- **Passport JWT strategy** — JWT authentication strategy implementation
- **PostgreSQL metadata repository** — Design for metadata persistence (implementation in progress)
- **Error normalization classes** — Consistent error response formatting
- **Winston structured logging** — Structured logging implementation
- **Finance types** — Common finance types for API contracts

### User Experience

- **Print receipt support** — Added print receipt functionality for Receivables
- **Theme settings** — Light/dark mode and theme color settings
- **Background blurring** — Added blurring of background for better visual focus
- **Icons and dark mode fixes** — Fixed icon display in dark mode
- **Recent transaction customization** — Customized recent transaction display

## Files Changed

| Category | Files | Changes |
|----------|-------|---------|
| Frontend | 42 files | +8,247 / -6,663 |
| Backend | 18 files | +1,947 / -12 |
| Documentation | 12 files | +1,822 / -0 |
| **Total** | **79 files** | **+12,016 / -6,663** |

## New Dependencies

### Frontend
- `@tanstack/react-query` ^5.101.2 — Data fetching with stale-while-revalidate
- `html-to-image` ^1.11.13 — Print receipt functionality
- `lucide-react` ^1.23.0 — Icon library
- `recharts` ^3.9.1 — Charting library

### Backend
- `winston` ^3.17.0 — Structured logging
- `uuid` ^11.1.0 — UUID generation
- `pg` ^8.13.0 — PostgreSQL client

## Known Issues

1. **Live Notion integration** — Backend still uses development repository; live Notion API writes require integration credentials
2. **PostgreSQL persistence** — Metadata repository design complete but implementation blocked on Neon Free setup
3. **Authentication** — JWT strategy implemented but email/Google sign-in not yet wired
4. **Playwright tests** — E2E tests not yet configured

## Verification Performed

| Check | Result |
|-------|--------|
| Frontend lint | ✅ Clean |
| Frontend typecheck | ✅ Clean |
| Frontend tests | ✅ Passing |
| Backend lint | ✅ Clean |
| Backend typecheck | ✅ Clean |
| Backend tests | ✅ Passing |

## Next Steps (v0.3.0)

1. **Live Notion integration** — Connect to live Notion API with integration credentials
2. **PostgreSQL metadata storage** — Implement metadata persistence with Neon Free
3. **Authentication flow** — Complete email and Google sign-in implementation
4. **E2E testing** — Configure Playwright tests for critical workflows
5. **Sync button** — Implement explicit queued changes through Sync button
6. **Schema verification** — Add schema verification button after Notion integration key configuration

## Deployment Notes

- **Frontend:** Deploy to Vercel
- **Backend:** Deploy to Render
- **Database:** Neon Free for PostgreSQL metadata storage
- **Environment variables:** Ensure all required environment variables are configured in deployment environment

## Rollback Plan

If issues are discovered after deployment:

1. Revert to v0.1.0 tag
2. Redeploy frontend to Vercel
3. Redeploy backend to Render
4. No database migrations to rollback (PostgreSQL not yet implemented)

---

**Prepared by:** Technical Documentation Specialist
**Reviewed by:** System Architect, Backend & Database Engineer, Frontend UI/UX Developer
**Last updated:** 2026-07-14