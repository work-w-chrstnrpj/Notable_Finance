# 08: Check the app against the approved prototype

**Type:** qa
**Status:** ready-for-agent
**Blocked by:** account-cards/05, account-cards/06
**Owner:** unassigned

## What to build
A side-by-side check that the finished app looks and behaves exactly like the approved prototype. For each item, screenshots of the prototype and the app in the same state are compared, in light and dark: card proportions, gradients and finishes (Glass, Metal, Matte), chip and logos, typography and spacing, the summary strip, usage bar and pill colors, hover tilt and glare, flip, the Wallet layout, the Settings previews and the swatch tooltips. Anything that differs is fixed or, if the owner agrees, logged as a deliberate difference.

## Acceptance criteria
- [ ] AC1: Screenshots of prototype and app are attached for: Cards view, a flipped card, Wallet with a credit and a non-credit account, Settings finish previews, Settings colors with a tooltip.
- [ ] AC2: Each of the three finishes is compared in light and dark.
- [ ] AC3: Yellow, Silver, White, Black and a vivid color are compared.
- [ ] AC4: Hover tilt, glare and the flip are checked by hand and noted.
- [ ] AC5: Every difference is either fixed or recorded with the owner's agreement; none is left silent.
- [ ] AC6: The check is repeated on at least one non-macOS build or its result is recorded as not checked.

## Inputs
- tickets/account-cards/spec.md (the approved spec)
- docs/adr/0011-reference-data-is-created-in-notion-only.md
- prototypes/account-cards/index.html (approved prototype: the app must look and behave exactly like it; any deliberate difference is agreed with the owner first and logged here)
- tickets/account-cards/05-wallet-view.md
- tickets/account-cards/06-settings-card-finish-and-colors.md

## Evidence
- Commits:
- PR:
- Tests:
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the prototype was approved.
- Next: Pick up when unblocked.
