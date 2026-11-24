# 02: Card finish, account colors and automatic color in local settings

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
The app remembers a card finish (Glass, Metal or Matte, default Glass) and a color per account, locally with the other UI settings and never in Notion. There is one shared 18-color palette (Red, Orange, Yellow, Green, Forest, Teal, Sky, Blue, Navy, Purple, Pink, Ruby, Gold, Brown, Black, Graphite, Silver, White), each with dark, mid and highlight shades; Yellow, Silver and White carry dark text. An account with no chosen color gets an automatic one: the first colored (not Black, Graphite, Silver or White) palette color no other account uses, starting from a hash of its name; Cash starts at Graphite. The pick is saved the first time the account is seen so it never changes when other cards are recolored.

## Acceptance criteria
- [x] AC1: Finish and per-account colors are saved and read back after a restart; an unknown finish or color falls back to the default.
- [x] AC2: Automatic color is the same for the same account every time, never repeats a color another account has while one is free, and skips Black, Graphite, Silver and White.
- [x] AC3: A Cash account's automatic color is Graphite.
- [x] AC4: An automatic pick is saved on first sight and does not change when another account is recolored or added.
- [x] AC5: An explicit choice is never overridden by Auto; choosing Auto again clears it and assigns a fresh automatic color.
- [x] AC6: Nothing about finish or colors is written to or read from Notion.
- [x] AC7: The palette values match the approved prototype's palette.

## Inputs
- tickets/account-cards/spec.md (the approved spec)
- docs/adr/0011-reference-data-is-created-in-notion-only.md
- prototypes/account-cards/index.html (approved prototype: the app must look and behave exactly like it; any deliberate difference is agreed with the owner first and logged here)

## Evidence
- Commits:
- PR:
- Tests: `npx vitest run` (63 files passed, 3 skipped); `test/card-colors.test.ts` names every criterion (account-cards/02#AC1 to #AC7). Four of its tests need SQLite and are skipped under plain node (native binding built for Electron); they pass under Electron's node: `ELECTRON_RUN_AS_NODE=1 ./node_modules/electron/dist/Electron.app/Contents/MacOS/Electron node_modules/vitest/vitest.mjs run test/card-colors.test.ts` (12 passed). `npm run typecheck` clean.
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the prototype was approved.
- Next: Pick up when unblocked.

### 2026-11-24 claude (cook)
- Did: Claimed. Starting on UiSettings cardFinish/accountColors, shared palette, pure auto-color, first-pick persistence.
- Next: implement and test each AC.

### 2026-11-24 claude (cook, done building)
- Did: Added the shared palette and pure auto-color rules (`src/shared/card-colors.ts`), `cardFinish` and `accountColors` in UiSettings (types, defaults, coercion, patch where `null` clears a color, renderer context plumbing), and `ensureAccountColors` in the main process that saves each account's first automatic pick. It runs when settings are read or updated and when the accounts list is fetched, so a new account from Notion is assigned the first time it shows up and a cleared color is re-assigned at once. Tests written per criterion; all seven criteria ticked.
- Decision: auto picks are assigned in name order among Notion-backed accounts, so first picks are repeatable; saved picks never move.
- Next: ticket 03 reads colors via `settings.accountColors`. The renderer's copy of settings is loaded at start and replaced by each settings update, so after a sync adds a new account the card should fall back to `assignAutoCardColors(accounts, settings.accountColors)` (same result as the saved pick) until settings are re-read. Nothing committed.

### 2026-11-24 claude (from account-cards/06)
- Did: Ticket 06 added `customAccountColors` (ids whose color was chosen by hand) to the saved UI settings, and made the automatic first-pick save through its own patch key so it never marks an account Custom. The 02 criteria still hold; its tests pass.
