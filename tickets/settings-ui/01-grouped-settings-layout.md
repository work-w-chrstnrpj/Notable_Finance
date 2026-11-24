# 01: Grouped, easier-to-use Settings layout

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
Settings becomes a two-pane page: a sticky list of groups on the left, and the chosen group's settings on the right, one group at a time. Every setting row shows a title, one short hint and a single control on the right (switch, button or status badge). The "Click here to [link]" sentences and the duplicate links are gone. Only the look and layout change: every setting does what it does today, and the existing dialogs for Profile, Theme, Interface, Notion and AI chat stay as they are.

Groups:
- **Account:** Profile.
- **Appearance:** Theme, Interface, Sections, Keyboard shortcuts.
- **Notifications.**
- **Notion and data:** Notion Configuration, Saved budgets (with the Notion mirror), Local Data, Schema, Backup and Restore.
- **AI and Chat.**
- **App:** Updates, Developer.

The Notion mirror row shows a status badge (Off, On, Database missing); its page search and backfill confirmation open in a card under that row.

## Acceptance criteria
- [ ] AC1: Settings shows a group list on the left and only the selected group's settings on the right; the list stays in view while the content scrolls.
- [ ] AC2: Every current setting appears in exactly one group, as listed above, and none is lost.
- [ ] AC3: Each row has a title, one short hint and one control on the right; the "Click here to" sentences and inline duplicate links are removed.
- [ ] AC4: Every button, switch and field keeps its current visible label and accessible name, and does what it did before (no logic or behavior change).
- [ ] AC5: The Profile, Theme, Interface, Notion and AI chat dialogs open from the same controls and are unchanged.
- [ ] AC6: The Notion mirror row shows an Off, On or Database missing badge, and its page search and confirm card appear beneath the row.
- [ ] AC7: The page works in light and dark themes with the neutral table and panel shades, and the group list is reachable by keyboard.
- [ ] AC8: The existing tests and the end-to-end tests pass, or are updated only where visible wording changed, and the update is logged.

## Inputs
- Grill session 2026-11-24 (decisions below)
- Settings page and its styles
- tickets/saved-budgets-notion/02-settings-toggle-and-database-setup.md (the mirror row)

## Evidence
- Commits:
- PR:
- Tests:
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Wrote from the grill-with-docs session. The user answered "yes to all" to five recommendations: two-pane layout with six groups; one title, hint and control per row; keep the existing dialogs unchanged; mirror shown as a status badge with its search and confirm card beneath; keep all control labels and update tests only where wording must change, then run the end-to-end tests (they are not part of npm test).
- Decisions: no ADR (easy to reverse), no glossary change.
- Next: /cook-a-ticket settings-ui/01

### 2026-11-24 claude
- Did: Cooked. Settings is now a two-pane page: a sticky group list (Account, Appearance, Notifications, Notion and data, AI and Chat, App) and one group shown at a time. Added shared SettingRow and SettingSwitch pieces so every row is a title, one short hint and one control on the right; removed the "Click here to [link]" sentences and duplicate links; the Sections switches moved to the right of their names. The Notion mirror row shows an Off, On or Database missing badge, with its page search and confirm card in a card beneath. All dialogs, labels and handlers are unchanged. New stylesheet assets/pages/118-settings-layout.css.
- Wording and tests: kept every button and switch label. The e2e test for the Settings page had to click the Appearance and Notion and data groups first, because it expected every panel on one page; updated that one test. Dev Mode's status text is now a badge, and the Dev Mode hint lost its bold on "Dev Logs".
- Checks: typecheck clean, eslint 0 errors, 642 unit tests and all 51 end-to-end tests pass. No test written for the new layout (cook only), so no criteria are ticked. Not looked at in a real window by me.
- Next: try it in the installed app, then /cook-a-ticket [serve] settings-ui/01.

### 2026-11-24 claude
- Did: A second e2e test needed the grouped layout: the Dev Logs shortcut test turns on Dev Mode from Settings, so it now opens the App group first (e2e/keyboard-shortcuts.spec.ts). It passed in an earlier full run by chance of order; it failed on the next two runs. All 51 end-to-end tests pass again.
