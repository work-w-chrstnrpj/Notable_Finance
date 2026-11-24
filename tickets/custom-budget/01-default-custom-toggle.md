# 01: Default and Custom budget toggle in Monitoring

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
The Monitoring budget toggle reads Default and Custom instead of Notion and Saved. Default uses each expense category's own monthly budget; Custom uses the Custom monthly budget database. Custom is disabled until a database ID is saved in Notion Configuration. The stored choice is renamed to default and custom, and a person who had Notion or Saved keeps the equivalent. Settings and the Monitoring labels call it the Custom monthly budget database. Only names and the toggle change here; how budgets are computed stays as it is.

## Acceptance criteria
- [ ] AC1: The Monitoring toggle shows Default and Custom, and the old Notion and Saved labels are gone from the app.
- [ ] AC2: Custom is disabled, with a short reason, while no database ID is saved.
- [ ] AC3: A stored choice of notion becomes default and saved becomes custom, with no change in what the person sees selected.
- [ ] AC4: Budget figures for Default equal the old Notion figures, and for Custom equal the old Saved figures, for the same data.
- [ ] AC5: Labels and hints in Settings, Monitoring and the chat answers use the Custom monthly budget database wording.

## Inputs
- docs/adr/0010-custom-monthly-budget-database-is-source-of-truth.md
- GLOSSARY.md: Custom monthly budget, Budget source, Budget period
- Grill session 2026-11-25

## Evidence
- Commits:
- PR:
- Tests:
- Review:
- Docs updated:

## Progress log
### 2026-11-25 claude
- Did: Created from the grill-with-docs session (the user said "yes to all" to five points).
- Next: /cook-a-ticket custom-budget/01

### 2026-11-25 claude
- Did: Cooked. The budget source values are now default and custom across the shared code, the saved setting (an old notion becomes default, saved becomes custom), reports, the chat tool (accepts custom, or the old saved) and the Monitoring toggle, which shows Default and Custom. Custom is disabled, with a tooltip, until a database ID is saved. Badge texts read Default budgets, Custom budgets and No custom budget. The Settings area is titled Custom monthly budget and the reset text points to it. SegmentedControl gained per-option disabled and title.
- Left for ticket 03: wording tied to local editing (Save budgets, Edit budgets, CSV import text, "Saved budgets" inside the editing dialogs).
- Checks: typecheck clean, eslint 0 errors, 643 unit tests and 51 e2e tests pass (tests updated to the new names). No test written for the disabled Custom option, so no criteria are ticked.
