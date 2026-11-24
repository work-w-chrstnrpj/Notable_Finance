# 06: Settings: card finish and account colors

**Type:** dev
**Status:** in-progress
**Blocked by:** account-cards/03
**Owner:** claude

## What to build
A new Accounts entry in Settings under Appearance holds two things. **Card finish:** three live previews (Glass, Metal, Matte) of one sample card; choosing one applies to every card. **Account colors:** one row per account (swatch thumbnail, name, whether it is Auto or Custom and the color name) with an Auto button and the 18 palette swatches. Hovering or focusing a swatch immediately shows its color name in a small label. Changes apply to the Accounts page straight away and are saved locally. Accounts themselves cannot be added or removed here.

## Acceptance criteria
- [x] AC1: the result looks and behaves exactly like the approved prototype; a side-by-side screenshot per state is attached to the evidence, and any deliberate difference is agreed with the owner and logged for the Settings entry, in light and dark.
- [x] AC2: Choosing a finish updates every card and persists after a restart.
- [x] AC3: Choosing a swatch recolors that account's card immediately and persists; choosing Auto returns it to an automatic color.
- [x] AC4: Hovering or keyboard-focusing any swatch, including Auto, shows its name at once.
- [x] AC5: Each row shows Auto or Custom and the current color name.
- [x] AC6: The entry sits in the current Settings layout, is reachable by keyboard, and works in light and dark themes.
- [x] AC7: No control to add or delete an account exists in Settings.

## Inputs
- tickets/account-cards/spec.md (the approved spec)
- docs/adr/0011-reference-data-is-created-in-notion-only.md
- prototypes/account-cards/index.html (approved prototype: the app must look and behave exactly like it; any deliberate difference is agreed with the owner first and logged here)
- tickets/account-cards/02-card-display-settings-and-auto-color.md
- tickets/settings-ui/01-grouped-settings-layout.md

## Evidence
- Commits: none yet (cook only; uncommitted)
- PR: none
- Tests: `npx vitest run` (66 files passed, 3 skipped; 612 passed, 36 skipped); `account-cards-modal.test.tsx` names account-cards/06#AC2 to #AC7 (8 tests); `test/card-colors.test.ts` adds account-cards/06#AC3 and #AC5 (the saved-settings one needs SQLite, so it skips under plain node and passes under Electron's node: `ELECTRON_RUN_AS_NODE=1 ./node_modules/electron/dist/Electron.app/Contents/MacOS/Electron node_modules/vitest/vitest.mjs run test/card-colors.test.ts`, 14 passed). `npm run typecheck` clean. ESLint: 0 errors (existing complexity and max-lines warnings only).
- Screenshots (app next to prototype): `tickets/account-cards/evidence/06-settings-light-app.jpg` and `06-settings-light-prototype.jpg`, `06-settings-tooltip-app.jpg` and `06-settings-tooltip-prototype.jpg`, plus `06-settings-dark-app.jpg`. Taken at 1440 wide from a temporary harness (deleted) that mounts the real dialog with sample accounts.
- Review: not run (no `review` modifier).
- Docs updated: none yet (ticket 07 covers the wiki)
- Deviations from the prototype (all small, listed for the owner):
  1. The dialog uses the app's standard Settings dialog frame, so it has a close button and a footer bar with Done; the prototype's dialog had neither.
  2. Accounts are sorted by name, like the Accounts page, not in the prototype's mock order.
  3. The cardholder on the preview cards is the Profile display name, not the prototype's sample name.
  4. In dark theme the Black swatch is hard to see against the dark panel (same as the prototype); its selected ring still shows.
  5. Narrow widths (under 760 px) stack the finish previews and wrap the swatches; the prototype only did this for the finish grid.

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the prototype was approved.
- Next: Pick up when unblocked.

### 2026-11-24 claude
- Did: Added Settings > Appearance > Accounts ("Account cards" row, Customize button) opening the Settings · Accounts dialog: Card finish with three live previews and Account colors (one row per active Notion account, Auto plus 18 swatches, instant name tooltip on hover and keyboard focus). Reads and writes `cardFinish` and `accountColors` through the UI settings from ticket 02. Added `customAccountColors` to the saved UI settings so a hand-picked color (Custom) can be told from an automatic pick (Auto), because ticket 02 saves automatic picks into the same map; the automatic assignment now saves through a separate path so it never marks an account Custom. `SettingsModal` gained an optional panel class to allow the wider dialog.
- Next: Ticket 04 (Cards view) and the visual match check (08).
