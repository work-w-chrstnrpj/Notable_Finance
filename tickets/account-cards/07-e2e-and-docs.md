# 07: End-to-end check and docs for the account cards

**Type:** automation
**Status:** ready-for-agent
**Blocked by:** account-cards/05, account-cards/06
**Owner:** unassigned

## What to build
An end-to-end run that opens Accounts, switches between Table, Cards and Wallet, changes the card finish and one account color in Settings, and sees them applied. Docs are updated: the Notion field mapping, the desktop wiki pages that describe the Accounts page and Settings, and the glossary and ADR cross-links.

## Acceptance criteria
- [ ] AC1: The end-to-end run switches to Wallet, picks an account, and sees its details.
- [ ] AC2: The end-to-end run changes the card finish and an account color in Settings and sees both on the Accounts page.
- [ ] AC3: The existing end-to-end suite passes, with only visible-wording changes updated and logged (UI text changes can pass unit tests but fail this separate run).
- [ ] AC4: The wiki pages for Accounts, Settings and the field mapping describe the new views, finish, colors and Payment Network.
- [ ] AC5: The glossary and ADR-0011 match what shipped.

## Inputs
- tickets/account-cards/spec.md (the approved spec)
- docs/adr/0011-reference-data-is-created-in-notion-only.md
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
