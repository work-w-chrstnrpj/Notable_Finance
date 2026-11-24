# 11: Card Numbers & Last 4 Digit on the account card

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
The app reads a new text property on the Notion Accounts database named "Card Numbers & Last 4 Digit" (the owner creates it in Notion, like Payment Network). A value such as `16, 4056` means a 16-digit card number ending in 4056, and the card shows it as `•••• •••• •••• 4056` (a 16-digit card groups as 4-4-4-4, a 15-digit one as 4-6-5, a 14-digit one as 4-6-4, other lengths in groups of four with the remainder last). Only the count and the last four digits are ever kept or shown. When the value is empty or not valid, nothing is shown at all: no dots and no number line. This replaces the always-shown `•••• ••••`. The number also shows in the Wallet details line (`Credit Account · Visa · •••• 4056`). The field is read-only and never written to Notion (ADR-0011).

## Acceptance criteria
- [x] AC1: A failing test first: the value `16, 4056` produces 12 masked digits followed by 4056, grouped in fours.
- [x] AC2: A 15-digit value groups 4-6-5, a 14-digit value 4-6-4, and other lengths in groups of four; only the last four digits are real.
- [x] AC3: An empty or invalid value (not `<count>, <4 digits>`, a count under 12 or over 19, or non-digits) shows no number line on the card or in the Wallet line.
- [x] AC4: The value is read on every sync and kept with the account; an existing database upgrades without losing data.
- [x] AC5: Nothing about the field is pushed to Notion, and a missing property in Notion never blocks a sync.
- [x] AC6: The Notion field mapping document and the glossary list the new property.
- [x] AC7: The Cards view, the flipped card, the Wallet view and the plain (no-network) look all render cleanly with and without a value.

## Inputs
- tickets/account-cards/01-read-payment-network.md (the same pattern)
- docs/adr/0011-reference-data-is-created-in-notion-only.md
- Owner request 2026-11-24: "Card Numbers & Last 4 Digit" property, value like `16, 4056`; not set means no dots.

## Evidence
- Commits:
- PR:
- Tests: `npx vitest run` 70 files passed, 666 tests passed, 36 skipped (SQLite-only); new `test/card-numbers.test.ts` (7 tests, `account-cards/11#AC1-AC6`), card tests `account-cards/11#AC1/AC2/AC3/AC7` in `account-card.test.tsx`, Wallet line tests `account-cards/11#AC1/AC3` in `accounts-wallet.test.tsx`; `npm run typecheck` clean; eslint 0 errors on touched files.
- Review:
- Docs updated: `wiki/shared/notion-field-mapping.md` (new read-only input), `GLOSSARY.md` (Card number).

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the owner's request ("Yes, both").
- Next: Implement and test.
- Did: Migration 0018 adds `accounts.card_numbers` (journal `when` after 0017, so the backup-restore test's `created_at >=` rollback covers it; `backup.test.ts` and `budgets-repo.test.ts` roll it back too). Notion property `Card Numbers & Last 4 Digit` is read as rich text on every sync (optional, warning-only in the schema check, never written). New pure `src/shared/card-number.ts` parses `<12-19>, <4 digits>` and masks it (16 -> 4-4-4-4, 15 -> 4-6-5, 14 -> 4-6-4, otherwise fours with the remainder last). The card draws the number only when valid (smaller type so a full number clears the network mark); nothing at all otherwise, cardholder and network keep their place. The Wallet details line appends `•••• 4056` only when valid. The finish-preview sample card now carries `16, 7730` like the prototype's sample.
- Changed an earlier ticket's test: `payment-network.test.ts` AC4 now applies 0018 before reading accounts (the app reads `card_numbers`).
- Not verified: a screenshot of the long number next to the American Express text mark on the real card (type size was chosen by arithmetic, 3.9cqw, not by eye); `backup.test.ts` and `budgets-repo.test.ts` edits are SQLite/Electron-only and were not run. The Notion property must be created by the owner as a **Text** property named exactly `Card Numbers & Last 4 Digit`.
