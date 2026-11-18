# 05: Backup, activity log, chat parity and docs

**Type:** dev
**Status:** ready-for-agent
**Blocked by:** 02, 03, 04
**Owner:** unassigned

## What to build
Saved budgets are protected and documented. Database backups report them and restore them, and a backup from before this feature still restores cleanly. Saving, editing, deleting and importing saved budgets leave activity entries (counts only). A full local reset warns the user to export saved budgets first. The chat assistant can report budgets on either source and defaults to Notion, so its answers do not change. The docs and changelog describe the feature.

## Acceptance criteria
- [ ] AC1: A database backup and restore keeps saved budgets, and the backup's table counts include them.
- [ ] AC2: Restoring a backup made before this feature works and shows no saved sets.
- [ ] AC3: Save, edit, delete and import each record an activity entry with counts only and no row dumps.
- [ ] AC4: The full local reset confirmation tells the user to export saved budgets first.
- [ ] AC5: The chat read tool and the monitoring report accept an optional budget source that defaults to Notion, and answers are unchanged when it is not given.
- [ ] AC6: No chat write tool for saved budgets is added.
- [ ] AC7: `wiki/desktop/local-data-schema.md`, `wiki/desktop/ipc-contract.md`, `wiki/shared/product-specification.md`, the app changelog and the `GLOSSARY.md` terms (no longer "proposed, not built") are updated, and `AGENTS.md` if the structure changed.
- [ ] AC8: `wiki/desktop/monthly-budget-snapshots.md` status changes from "not implemented" to implemented.
- [ ] AC9: `tickets/features/monthly-budget-snapshots.md` is marked superseded by these tickets.

## Inputs
- `tickets/monthly-budget/spec.md`
- `wiki/desktop/monthly-budget-snapshots.md` (sections 10, 13, 15)
- `docs/adr/0006-saved-budgets-local-only.md`
- Tickets 02, 03 and 04

## Evidence
- Commits:
- PR:
- Tests:
- Review:
- Docs updated:

## Progress log
### 2026-11-18 claude
- Did: Created from the spec at the user's approval of the breakdown.
- Next: Wait for 02, 03 and 04, then claim. Use the existing backup test as prior art for AC1 and AC2.
