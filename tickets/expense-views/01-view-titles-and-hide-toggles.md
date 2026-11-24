# 01: Expense special-view titles and Settings toggles to hide them

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
The Expense page header names the special views: Pasabuy reads "Pasabuy Expenses" and CC Transaction reads "Credit Card Expenses"; To Pay, To Buy and Installments read their own names. Settings gets an "Expense views" panel with a switch per view (CC Transactions, Pasabuy, To Pay, To Buy, Installments) that hides or shows it in the Expense view picker.

## Acceptance criteria
- [x] AC1: The Expense header title reads "Pasabuy Expenses", "Credit Card Expenses", "Installments", "To Pay" and "To Buy" for those views; period views are unchanged.
- [x] AC2: Settings → Expense views has a switch per view; turning one off removes it from the picker, turning it on restores it.
- [x] AC3: The choice is saved locally and survives restart; unknown names are dropped.
- [x] AC4: If the open view gets hidden, Expense falls back to Monthly.

## Inputs
- Request 2026-11-24: "header title ... then the toggle". Read as five views with the title of each; "Installments To Pay, and To Buy" read as Installments, To Pay, To Buy.

## Evidence
- Commits:
- PR:
- Tests: npx vitest run (new expense-views-hidden.test.tsx, updated view-titles.test.tsx); npm run typecheck clean.
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Title map in lib/view-title.ts; hiddenExpenseViews setting (types, main normalize/save, renderer context); Settings panel; picker and tab shortcuts filter hidden views.
- Next: Try in the app; commit and close.

### 2026-11-24 claude
- Requirement change: Monitoring Budget, Quarterly / Semi-Annually / Annually views look for their own row in the Custom database first (Q1 2026, H1 2026, 2026) and use it as written. With no such row they add the monthly budgets of the range (H1 = Jan to Jun), and the badge says so ("H1 2026 not found: adding Jan–Jun monthly budgets"). Monthly view and the Default (Notion) source are unchanged.
- Did: New cache table period_budget_snapshots (migration 0019) filled on each Custom pull; new budgets:listPeriods IPC; resolveBudgets and the badge take the period row; tests in saved-budgets.test.ts and saved-budgets-mirror.test.ts; older badge expectations updated. A category the period row leaves blank still adds up its months.
- Next: Sync once so existing period rows get cached, then check a Semi-Annual view.

### 2026-11-24 claude
- Requirement change: column widths the owner drags on the Income, Expense and workflow tables persist across restarts, per table and view, until changed again.
- Did: DataTable takes a tableId and keeps widths in localStorage (nf_column_widths:<id>); Income, Expense and the workflow pages pass page:view. Test: data-table-widths.test.tsx.
