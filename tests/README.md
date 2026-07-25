# Tests

This folder holds cross-cutting automated and manual verification assets.

## Notable Finance Desktop App — Keyboard Shortcut Tests

Three files were created to test the keyboard shortcut system in the desktop app:

### 1. Manual Test Cases (CSV/Excel)

**File:** `notable-finance-desktop-keyboard-shortcuts.csv`

A comprehensive spreadsheet of all 117+ keyboard shortcut test cases for the Notable Finance desktop app (`notable-finance-app/`). Open in any spreadsheet app (Excel, Numbers, Google Sheets) to execute manually.

Columns: TestID, Category, SubCategory, ShortcutID, Combo (Mac), Combo (Win), View/Context, Description, Preconditions, TestSteps, ExpectedResult, Status (fill in PASS/FAIL/BLOCKED), Notes.

Organised by:
- **Navigation** (NAV-001–015): Section jump shortcuts (`⌘+1…9`, `⌘+⇧+H/C/O/L/S`)
- **Section Views** (VIEW-001–027): Filter tabs, layout toggles, search, filters, new record
- **Record Modal** (MODAL-001–015): Save, edit, duplicate, delete, close inside modals
- **Mass Selection** (SEL-001–014): Select all, duplicate, edit, disable, delete for rows
- **Sync** (SYNC-001–004): Push, pull, full sync
- **Editing** (EDIT-001–006): Undo/redo stack behavior
- **General** (GEN-001–006): Cheat sheet, modifier reveal
- **Sequence** (SEQ-001–010): Chaining multiple shortcuts (duplicate→undo, create→save→undo, etc.)
- **Scope Guard** (SCOPE-001–006): Priority/resolution when multiple scopes conflict
- **Cross-View** (VIEW-CROSS-001–006): Shortcut availability per view
- **Edge Cases** (EDGE-001–006): Stress tests, rapid presses, empty stacks
- **Platform** (MAC-001, WIN-001): Platform-specific verification

### 2. Automated Unit Tests

**File:** `../notable-finance-app/test/shortcuts.test.ts`

21 unit tests that verify the shortcut registry integrity:
- Unique IDs and groups
- Valid scopes and well-formed combos
- No duplicate combos within the same scope
- All navigation section shortcuts present
- Combo display rendering (Mac and Win)
- Scope priority ordering
- OS-level reserved combo conflicts
- `whileTyping` flag correctness

Run with: `npm --prefix notable-finance-app run test`

### 3. Automated E2E Tests

**File:** `../notable-finance-app/e2e/keyboard-shortcuts.spec.ts`

Playwright E2E tests that launch the Electron app and press real keyboard shortcuts:
- All 13 navigation shortcuts (verified by hash + active nav item)
- Cheat sheet open/close (⌘+/, Escape)
- Modifier reveal (holding ⌘/Ctrl shows shortcut hints)
- Income/Expense view shortcuts (⌘+N, ⌘+F, ⌘+Shift+F)
- Accounts view shortcuts (⌘+Ctrl+~, ⌘+Ctrl+0)
- Record modal shortcuts (⌘+D duplicate, ⌘+S save, ⌘+Backspace delete)
- Scope guard (navigation suppressed while modal open)
- Sync shortcut (⌘+Shift+Enter)
- Undo/Redo no-op on empty stack

Prerequisite: `npm --prefix notable-finance-app run build`
Run with: `npm --prefix notable-finance-app run test:e2e`

---

## Planned Coverage

- Unit tests for mappers, validators, field access rules, and sync state handling.
- Integration tests for backend API behavior with mocked Notion responses.
- Contract tests for API request and response shapes.
- End-to-end tests for pull, create, edit, delete, and sync workflows.
- Manual test cases for a non-production Notion workspace/page.

## Rules

- Do not run destructive tests against the real finance Notion workspace.
- Verify that computed fields are hidden from forms and rejected in mutation payloads.
- Verify that income and expense delete behavior follows the title/amount mutation policy.
- Verify that sync pushes to Notion, pulls fresh data, and refreshes UI state.
- Add concrete commands after the implementation stack is selected.
