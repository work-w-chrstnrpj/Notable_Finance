# 03: The account card: front, back, finishes and motion

**Type:** dev
**Status:** in-progress
**Blocked by:** account-cards/01, account-cards/02
**Owner:** claude

## What to build
A single reusable account card drawn like a real payment card, used by the Cards and Wallet views. Front: network logo, chip, contactless mark, name and type, masked number, cardholder name (the Profile display name), and the amount owed for credit-like accounts (Credit Account, e-Credit, BNPL) or the balance for the others. Back: limit, available, payments made, purchases, billing and due days and points (or balance and type for non-credit accounts). Accounts with no payment network use the lighter plain look with a type icon and a quiet "Set network" chip. It supports the three finishes, every palette color (light cards switch text and the Visa mark to dark), tilt and glare on hover, and flip on click, scales with its container, and turns the motion off under reduced motion. Network logos are stand-in marks behind one logo component so official marks can be swapped in one place.

## Acceptance criteria
- [x] AC1: the result looks and behaves exactly like the approved prototype; a side-by-side screenshot per state is attached to the evidence, and any deliberate difference is agreed with the owner and logged for the front and back of a credit card, a debit or savings card, and a card with no network.
- [x] AC2: Credit-like accounts show the amount owed on the face; other accounts show their balance.
- [x] AC3: Visa, Mastercard, Amex, JCB and UnionPay each show their mark (Amex as the plain two-line text AMERICAN EXPRESS, no colored box; it takes the card's text color); an unknown network shows its text, an empty one shows the quiet "+ Set network" chip, and a Payment Network of N/A shows "No Available Network" in the same dotted chip (N/A counts as no network for the plain look and the Cards and Wallet views); the page still renders.
- [x] AC4: Glass, Metal and Matte each render as in the prototype, in light and dark themes.
- [x] AC5: Yellow, Silver and White cards use dark text and a dark Visa mark and stay readable.
- [x] AC6: Hover tilts the card and moves the glare; click flips it; with reduced motion on, tilt, glare and the flip animation are off.
- [x] AC7: The card scales smoothly with its container width without clipping text.
- [x] AC8: A test asserts what the owner sees (owed versus balance, no-network state, flip shows the statement figures), not styles.
- [x] AC9: The back of a credit card shows all six figures and the hint line without any text cut off at the bottom edge, at any card width (a card about 985 px wide in the Cards view included).

## Inputs
- tickets/account-cards/spec.md (the approved spec)
- docs/adr/0011-reference-data-is-created-in-notion-only.md
- prototypes/account-cards/index.html (approved prototype: the app must look and behave exactly like it; any deliberate difference is agreed with the owner first and logged here)
- tickets/account-cards/01-read-payment-network.md
- tickets/account-cards/02-card-display-settings-and-auto-color.md

## Evidence
- Commits:
- PR:
- Tests: `npx vitest run` in notable-finance-app: 64 files passed, 585 tests passed, 35 skipped (SQLite-only files); `src/renderer/src/components/ui/account-card/account-card.test.tsx` 16 passed, each named `account-cards/03#ACn`. `npm run typecheck` clean; eslint: 0 errors, 1 complexity warning on `AccountCard` (limit 15, now 33; the repo already has many).
- Review: not run (cook only). Visual evidence, prototype vs app side by side, in `tickets/account-cards/evidence/`: `03-glass-light-*`, `03-metal-dark-*`, `03-matte-light-colors-*` (Yellow, Silver, White), `03-flipped-credit-*`, `03-flipped-noncredit-*`, `03-plain-no-network-*`, `03-hover-*` (each `-prototype.png` and `-app.png`), plus `03-narrow-width-app.jpg`.
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the prototype was approved.
- Next: Pick up when unblocked.

### 2026-11-24 claude
- Did: Claimed. Blockers 01 and 02 are built (uncommitted). Starting the card component, ported from the approved prototype.
- Next: Component + CSS module, network logo component, tests per AC, screenshots next to the prototype.

### 2026-11-24 claude
- Did: Built the account card as a reusable component (front, back, three finishes, plain look, dark-text colors, tilt, glare, flip, reduced motion) with a single network-mark file, ported from the approved prototype. Props default from Settings (finish, saved color, Profile name). Not wired into the Accounts page (ticket 04). Tests per AC; screenshots from a temporary harness (since deleted) next to the prototype at 1440 wide.
- Deviations from the prototype, honestly:
  1. The masked number is always `•••• ••••` (the app has no last-4 field); the prototype showed mock last-4 digits.
  2. The prototype wrote "3th", "1th" for billing days; the app uses correct ordinals (1st, 2nd, 3rd).
  3. The back-face hint reads "Click to flip back" and adds "· double-click to open details" only when the parent passes `onOpen`.
  4. Credit amount owed is `max(0, -balance)` (matches the Table's balance), not `limit - available`; the two agree for the app's data.
  5. Under reduced motion the glare is also hidden (the prototype only stopped tilt and transitions), as AC6 asks.
  6. An unknown network shows its text in the dashed chip (the prototype only had empty/known); the chip gradient id is unique per card.
  7. Accessibility additions: the card is a keyboard-focusable button (Enter or Space flips, Shift+Enter opens) and the hidden face is `aria-hidden`.
- Not verified: Windows and Linux rendering; the pixel-level diff (captures from two tabs were scaled differently, so I compared by eye and by identical card geometry: 389.3 by 245.5 px at 1440 wide in both); the reduced-motion CSS in a real reduced-motion browser (covered by a CSS-text test and a script test); the Wallet-sized card (ticket 05).
- Next: Ticket 04 wires the card into the Cards view. Ticket status left `in-progress`; not committed.

### 2026-11-24 Requirement change
- Owner, after trying the installed build: American Express should show as the text "AMERICAN EXPRESS" only, replacing the logo with the blue background box (as the real card prints it).
- Changed: AC3 reworded for the Amex mark. The prototype's boxed Amex mark was a stand-in; the text-only version is a deliberate, owner-requested difference from the prototype.
- Next: code and test follow; AC3 re-ticked when its test passes.
- Did: Amex mark is now the plain two-line text AMERICAN EXPRESS in the card's text color (no blue box); added a test for it. AC3 re-ticked.

### 2026-11-24 Requirement change
- Owner, after trying the installed build: when the Notion Payment Network value is N/A, do not show "Set network"; show "No Available Network" in the same dotted border.
- Changed: AC3 reworded. An empty value still shows the quiet "+ Set network" chip (not asked to change). N/A is treated as no network everywhere (plain look, Cards groups and meta line, Wallet picker and details).
- Next: code and tests follow; AC3 re-ticked when its tests pass.
- Did: Added a shared N/A check (N/A, n/a, NA, not applicable, not available). The card chip reads "No Available Network" in the same dotted border; N/A counts as no network for the plain look, the Cards groups and meta pill, and the Wallet picker subtitle, panel subtitle and Payment network field. Empty still shows "+ Set network". Three new tests (card, grouping, picker subtitle). AC3 re-ticked.

### 2026-11-27 Requirement change
- Owner, after trying the installed build (Credit group, card flipped): the bottom of the back is cut off. The hint line "Click to flip back · double-click to open details" is clipped by the card edge.
- Changed: added AC9 (back shows everything, nothing cut off, at any width).
- Cause: the back stacks a 23cqw top offset, three rows and the hint in flow; with real font line heights that is taller than the card's 63cqw.
- Next: tighten the back layout in the CSS module (strip higher and thinner, tighter rows, hint pinned to the bottom); re-tick AC9 when verified.
- Did: Back layout tightened in `account-card.module.css`: magnetic strip higher and thinner (6cqw / 9cqw), grid starts at 18.5cqw, row gap 2.4cqw, explicit 1.2 line heights, values never wrap, and the hint is pinned 3.4cqw from the bottom edge so rows can't push it out. New test `account-cards/03#AC9` adds up the container-unit budget (rows end at about 49cqw, hint starts at about 56 of 63). AC9 ticked. `vitest` for the card: 23 passed; typecheck clean.
- Not verified: a live look at the flipped card in the installed app (layout can't be measured in jsdom); please flip a Credit card and check. Not committed.
