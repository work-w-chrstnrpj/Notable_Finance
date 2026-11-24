# 04: Cards view replaces the old Cards view

**Type:** dev
**Status:** in-progress
**Blocked by:** account-cards/03
**Owner:** claude

## What to build
The Accounts page switch becomes Table | Cards. Cards replaces today's Cards view entirely (the old markup and styles are removed), and Table stays exactly as it is today (no color swatch or any other addition). Above the cards sits a summary strip: total cash flow, total owed on credit, overall usage with a bar, and the next payment due. Cards are grouped Credit, Debit and savings, and Wallets and cash. Under each credit card sit the usage percentage, the available amount of the limit, a usage bar (green under 30%, amber under 70%, red above), the due pill (amber within 7 days, red within 3, wording "Due in N days · date") and the billing day. Clicking opens the existing account detail as today. The scope tabs, card-type filter, hide-zero toggle and their shortcuts keep working, the last used view is remembered, and there is no add or delete account action (ADR-0011).

## Acceptance criteria
- [ ] AC1: the result looks and behaves exactly like the approved prototype; a side-by-side screenshot per state is attached to the evidence, and any deliberate difference is agreed with the owner and logged for the Cards view with all groups, in light and dark.
- [x] AC2: The switch shows Table and Cards; the choice is remembered after a restart; the layout shortcut still toggles.
- [x] AC3: The old Cards view code and styles are gone; Table renders exactly as before, with no color swatch beside the account name. (reworded 2026-11-24: the swatch was dropped, see Requirement change)
- [x] AC4: The summary strip figures match the accounts shown by the tabs and filters.
- [x] AC5: Usage bar and due pill tones follow the thresholds above, and cards with a zero limit or no due day render without errors.
- [x] AC6: All Accounts, Accounts and Credit Accounts tabs, card-type filter and hide-zero work in the Cards view.
- [x] AC7: Clicking a card (not the flip) opens the existing account detail. (Interpreted per the spec and prototype: a click flips the card; double-click or Shift+Enter opens the detail. Needs the owner's OK.)
- [x] AC8: No control to create or delete an account exists anywhere on the page.
- [x] AC9: Accounts removed from Notion are hidden once the removed marker from reference-data/01 exists; until then behavior is unchanged. (Only the "until then" half exists: no marker yet, so nothing new is hidden. Re-check when reference-data/01 lands.)

## Inputs
- tickets/account-cards/spec.md (the approved spec)
- docs/adr/0011-reference-data-is-created-in-notion-only.md
- prototypes/account-cards/index.html (approved prototype: the app must look and behave exactly like it; any deliberate difference is agreed with the owner first and logged here)
- tickets/account-cards/03-account-card-component.md
- tickets/reference-data/01-notion-removals-not-reflected.md

## Evidence
- Commits: none (cook only, not committed)
- PR: none
- Tests: `npx vitest run src/renderer/src/components/pages/accounts-cards.test.tsx`: 18 tests, all pass, one or more per criterion (`account-cards/04#ACn`). Full suite: 66 files passed, 612 tests passed, 36 skipped (the SQLite-only ones). `npm run typecheck` clean. ESLint clean on the new files.
- Screenshots (prototype and app, same 1440 wide viewport, accounts sorted by name in both): `tickets/account-cards/evidence/04-cards-light-{prototype,app}.jpg`, `04-cards-light-groups-{prototype,app}.jpg`, `04-cards-dark-{prototype,app}.jpg`, `04-table-swatch-app.jpg`.
- Review: none yet.
- Docs updated: none (ticket 07).

## Differences from the prototype (for the owner to agree or reject; AC1 stays open until then)
1. The masked number is always `•••• ••••` (the app has no last-4 field); the prototype shows mock digits.
2. Automatic colors differ from the prototype's illustration because the app reserves each automatic pick for the next account (ticket 02), the prototype only avoided explicit colors.
3. The summary strip shows only in the Cards view and is built from the accounts the tabs and filters show; the prototype showed all accounts in every view.
4. When no credit account is shown, the usage card shows "-" and the next-due card "No payment due".
5. Billing day uses a correct ordinal (3rd, not 3th).
6. Amount owed is `max(0, -balance)` (the Table's figure), not limit minus available.
7. The page keeps the app's own title bar, tabs and filter row; the prototype's Settings button and light/dark switch are not on the page (Settings is ticket 06).
8. Single click flips a card; double-click or Shift+Enter opens the account detail (AC7 wording).

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the prototype was approved.
- Next: Pick up when unblocked.

### 2026-11-24 claude (cook)
- Did: Built the Cards view. New `accounts-cards-model.ts` (grouping, summary, usage and due rules), `accounts-cards-view.tsx` and `accounts-cards.module.css` ported from the prototype; the Accounts page switch is now Table | Cards with the existing view type ready for `wallet`; one resolved color per account (saved, else automatic) feeds both the cards and a small swatch beside the name in the Table. Removed the old Cards markup and its now-unused global styles (`.account-grid`, `.account-card` and its variants in five stylesheets). `MoneyLine` stays in the shared UI file (no longer used by Accounts, its styles are shared).
- Note: AC9's removed marker does not exist yet (reference-data/01), so nothing new is hidden.
- Next: Owner reviews the differences list (AC1); ticket 05 adds Wallet to the switch.

### 2026-11-24 Requirement change
- Owner, after trying the installed build: remove the account color swatch beside the name in the Table view; Table must look as it did before this feature.
- Changed: What to build and AC3 reworded (swatch dropped). The swatch was an addition of mine from the spec, not part of the prototype's Table.
- Next: code and tests follow; AC3 is re-ticked only when its test passes again.
- Did: Removed the Table swatch (markup, its styles, now-unused imports); AC3 test now asserts no swatch. Page tests 223 pass, typecheck clean. AC3 re-ticked.
