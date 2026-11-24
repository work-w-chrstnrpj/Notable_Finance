# 05: Wallet view

**Type:** dev
**Status:** in-progress
**Blocked by:** account-cards/04
**Owner:** claude

## What to build
The switch gains a third view, Wallet: a picker list on the left and one large card on the right. The list is grouped like Cards; each row has a small card thumbnail in the account's color, the name, the percent used and due date (or the network for other accounts), a thin usage bar for credit accounts, and the amount owed or balance. The selected account shows as a large card (it still tilts and flips) beside its usage ring, key figures and card color, then a spending line and recent activity. Rows never overlap, the list scrolls on its own, and up and down arrow keys move the selection. Filters and tabs from the page apply.

## Acceptance criteria
- [ ] AC1: the result looks and behaves exactly like the approved prototype; a side-by-side screenshot per state is attached to the evidence, and any deliberate difference is agreed with the owner and logged for Wallet with a credit account and a non-credit account selected, in light and dark.
- [x] AC2: Clicking a row selects it and shows its large card and details; the selected row is clearly marked.
- [x] AC3: Up and down arrow keys move the selection and keep it in view.
- [x] AC4: Nothing overlaps at common desktop widths, and the list scrolls without moving the details.
- [x] AC5: Tabs, card-type filter and hide-zero change the list, and the selection moves to the first account when the selected one is filtered out.
- [x] AC6: The remembered view can be Wallet, and the layout shortcut cycles Table, Cards, Wallet.
- [x] AC7: Recent activity and spending use the account's real records, not sample data.

## Inputs
- tickets/account-cards/spec.md (the approved spec)
- docs/adr/0011-reference-data-is-created-in-notion-only.md
- prototypes/account-cards/index.html (approved prototype: the app must look and behave exactly like it; any deliberate difference is agreed with the owner first and logged here)
- tickets/account-cards/04-cards-view-replaces-old.md

## Evidence
- Commits: none (cook only; uncommitted)
- PR: none
- Tests: `npx vitest run` (full): 67 files passed, 3 skipped; 639 tests passed, 36 skipped (the skipped ones need SQLite under Electron). `src/renderer/src/components/pages/accounts-wallet.test.tsx` has 27 tests named `account-cards/05#ACn`, all passing. `npm run typecheck` clean. `npx eslint .`: 0 errors, 120 warnings (new: complexity 20 on the `Details` component).
- Screenshots (prototype and app, same state, 1440 wide, in `tickets/account-cards/evidence/`): `05-wallet-credit-light-*`, `05-wallet-noncredit-light-*`, `05-wallet-credit-dark-*`, `05-wallet-noncredit-dark-*` (each as `-app.jpg` and `-prototype.jpg`).
- Live checks in the browser pane (real app with a scripted data bridge, since deleted): geometry at 1100, 1280 and 1440 wide shows the picker (300px) and the panel never overlap and nothing in the panel runs past its edge; the picker scrolls on its own; two Down arrow presses moved the choice two rows and kept it in view.
- Review: not run (`review` modifier not given).
- Docs updated: none yet (ticket 07 covers the wiki).

### Differences from the approved prototype (for the owner to agree or reject; AC1 stays open until then)
1. The line under the account name above the big card has no "•••• 7730" (the app has no last-4 field); the card face shows `•••• ••••` as in ticket 03.
2. The label reads "Card color" (the project glossary spelling); the prototype said "Card colour".
3. The picker's second line ("29% used · due Dec 11") stays on one line and ends in "…" when the picker is narrow. In the prototype it wraps to two lines when the picker has a scrollbar, which made rows taller and the picker scroll, a loop the prototype itself falls into in the browser pane.
4. Page text inside Wallet is set to the prototype's 14px with 1.45 line height (the app's own page text is 15px, normal line height), so rows and spacing match.
5. The picker's maximum height is the window height minus 140px, not minus 32px, because the app's top bar and page padding already use about 108px; otherwise the bottom rows would sit off screen while the picker sticks.
6. The big card is 440px wide when the panel is as wide as the prototype's, and shrinks (down to 300px) when the sidebar leaves less room; the large figures shrink to fit their column; the details drop under the card below 920px of content width and the picker drops above the panel below 700px (container widths, not window widths).
7. The spending line and recent activity are the account's real records, not the prototype's sample rows. Money out shows as `-₱3,420.50` (the app's money format; the prototype printed `₱-3,420.50`). Each row's icon is the category's own icon.
8. The spending line is the account's expenses of the last 24 days; recent activity is the 5 newest of its expenses, income, transfers and card payments from the last 90 days. With none, it says so ("No spending in the last 24 days.", "No recent activity on this account.").
9. Amount owed is the figure the Table uses (the negative balance), as in tickets 03 and 04, not limit minus available as in the prototype.
10. When the chosen account drops out of the list (a tab or filter changed), the first account listed becomes the choice and stays chosen; it does not jump back later.
11. The picker's row change and the card's rise animation are switched off under reduced motion (the prototype only stopped tilt and transitions).
12. Colors: automatic colors differ from the prototype's illustration (ticket 02's rule). In dark theme a Black or Graphite card's selected-row ring is hard to see, as in the prototype.
13. The prototype screenshots were taken from a static copy in the browser pane, where its font files do not load, so letter shapes differ slightly from the app's bundled Inter.
14. Ticket 04's own tests were updated: its switch now lists Wallet, and its layout-shortcut test now expects the shortcut to leave Cards for Wallet (it cycles Table, Cards, Wallet).

## Progress log
### 2026-11-24 claude
- Did: Ticket written from the spec after the prototype was approved.
- Next: Pick up when unblocked.
### 2026-11-24 claude (cook)
- Did: Claimed the ticket. Read the prototype's Wallet, tickets 03 and 04, the Accounts page and the data hooks. Record source for AC7: the existing per-account lists (expenses, income, transfers, credit card payments) with an account and a 90-day range; the spending line covers the last 24 days of expenses and activity is the newest 5 of all four. Switch becomes Table | Cards | Wallet; the saved view setting accepts `wallet`; the layout shortcut cycles Table, Cards, Wallet.
- Next: Build the model, view and styles, then tests per criterion, then screenshots next to the prototype.
### 2026-11-24 claude (cook, done building)
- Did: Built the Wallet view: picker rail with group labels, thumbnails, usage bars and amounts; large flippable card with usage ring, card color and figures; spending line and recent activity from the account's real records (expenses, income, transfers, card payments, via the existing per-account lists). Switch is now Table | Cards | Wallet, the saved view accepts `wallet`, the layout shortcut cycles Table, Cards, Wallet, arrow keys move the choice. 27 tests (one or more per AC2 to AC7), full suite, typecheck and lint green. Side-by-side screenshots (light and dark, credit and non-credit) in the evidence folder; temporary data bridge and server removed, `.claude/launch.json` back to its committed content.
- Next: Owner reviews the screenshots and the 14 differences above; AC1 is ticked once they are agreed or fixed. Ticket stays in-progress (not served: nothing committed, board not refreshed).
