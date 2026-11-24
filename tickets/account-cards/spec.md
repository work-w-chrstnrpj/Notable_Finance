# Spec: Accounts as cards (Cards and Wallet views)

**Status:** ready-for-agent
**Owner:** claude

## Problem Statement
The Accounts page shows each account as a plain box of labelled numbers. It does not look like the cards and wallets the owner actually holds, a credit card's amount owed, usage, and due date are hard to take in at a glance, and the owner's Notion Accounts database already records each card's Payment Network (Visa, Mastercard and so on), which the app ignores.

## Solution
The Accounts page offers three views, chosen with one switch: **Table** (unchanged), **Cards** (replaces today's Cards view) and **Wallet**. Every account is drawn as a realistic payment card with its network logo, chip, name and type; credit cards show the amount owed on the card, with the usage bar, available amount and due-date pill beneath it. Cards tilt and catch a glare on hover and flip on click to show the statement figures on the back. Wallet is a picker list on the left and one large card on the right, with its usage ring, key figures, spending line and recent activity. In Settings the owner chooses a **card finish** (Glass, Metal or Matte) for all cards and a **card color** per account from an 18-color palette, or leaves it on Auto. Accounts are still created, edited and removed in Notion only.

The approved visual reference is `prototypes/account-cards/index.html`. **The owner wants the real app to look and behave exactly like it**: same card proportions, gradients, finishes, chip, logos, typography, spacing, hover tilt and glare, flip, Wallet layout, usage bar and pill colors, and swatch tooltips, in light and dark. The prototype's code is throwaway, but its look is the contract; any deliberate difference must be agreed with the owner first and logged on the ticket.

## User Stories
1. As the owner, I want each account shown as a card, so that Accounts feels like my real wallet.
2. As the owner, I want the card to show its payment network logo, so that I can tell a Visa from a Mastercard at a glance.
3. As the owner, I want a credit card to show the amount owed on its face, so that the number I care about is the first thing I see.
4. As the owner, I want a usage bar, the available amount, the credit limit and a due-date pill under each credit card, so that I know how much room is left and what is due soon.
5. As the owner, I want the due pill to turn amber and then red as the due date nears, so that I do not miss a payment.
6. As the owner, I want to flip a card to see limit, available, payments made, purchases, billing and due days and points, so that detail is one click away.
7. As the owner, I want cards to tilt and catch the light as I hover, so that the page feels polished.
8. As the owner, I want a Wallet view with a list of accounts on the left and one large card with its details on the right, so that I can inspect one account without scrolling a wall of cards.
9. As the owner, I want to pick an account in Wallet with one click or the up and down arrow keys, so that choosing is easy and nothing overlaps.
10. As the owner, I want to keep the Table view exactly as it is, so that I can still scan and compare numbers.
11. As the owner, I want the view I last used to be remembered, so that Accounts opens the way I left it.
12. As the owner, I want the existing All Accounts, Accounts and Credit Accounts tabs, card-type filter and hide-zero-balance toggle to keep working in Cards and Wallet, so that I do not lose any filtering.
13. As the owner, I want a summary strip (total cash flow, total owed on credit, overall usage, next payment due), so that the page also answers the big questions.
14. As the owner, I want accounts grouped as Credit, Debit and savings, and Wallets and cash, so that the page is easy to scan.
15. As the owner, I want an account with no payment network to show a quiet "No network" state instead of a broken logo, so that incomplete data still looks right.
16. As the owner, I want to choose the card finish (Glass, Metal, Matte) in Settings, so that I can pick the look I like once for every card.
17. As the owner, I want to choose a color for each account in Settings from a named palette (Red, Orange, Yellow, Green, Blue, Purple, Pink, Brown, Black, Silver, White and more), so that each card matches the real one.
18. As the owner, I want the color's name to show when I hover a swatch, so that I know which color I am choosing.
19. As the owner, I want an account I have not colored to get an automatic color that no other card uses, so that a new card from Notion looks distinct without any setup.
20. As the owner, I want an automatic color to stay the same once assigned, so that cards do not change color when I recolor another account.
21. As the owner, I want light cards (Yellow, Silver, White) to use dark text and logos, so that everything stays readable.
22. As the owner, I want opening an account card to still show the existing account detail, so that nothing I use today is lost.
23. As the owner, I want the cards to work in light and dark themes and respect reduced-motion, so that the page is comfortable on any setup.
24. As the owner, I want no way to create or delete accounts in the app, so that Notion stays the only place that happens (ADR-0011).

## Implementation Decisions
- **Data (Notion → app):** the account's Payment Network (a Notion Select) is read into the account record and its DTO on every sync, like the other account fields. It is nullable, and an unknown value is kept as plain text (shown as "No network" logo-wise, with the name visible). The Notion Accounts database already has the property; no Notion schema change. Update `wiki/shared/notion-field-mapping.md`.
- **Display preferences (local only, ADR-0011):** `UiSettings` gains `cardFinish` (`glass` | `metal` | `matte`, default `glass`) and `accountColors` (map of account id to a palette color name). Both live in `ui.settings`, are never written to Notion and are not synced.
- **Automatic color:** an account with no entry in `accountColors` gets the first color in the palette that no other account uses, starting from a hash of its name, from the colored (non-neutral) part of the palette; Cash accounts start at Graphite. The pick is written to `accountColors` the first time the account is seen, so it is stable. Black, Graphite, Silver and White are manual choices only.
- **Palette:** 18 named colors (Red, Orange, Yellow, Green, Forest, Teal, Sky, Blue, Navy, Purple, Pink, Ruby, Gold, Brown, Black, Graphite, Silver, White), each with a dark, mid and highlight shade; Yellow, Silver and White also carry a dark text color. One shared definition used by the cards and the Settings swatches.
- **Accounts page:** the switch becomes Table | Cards | Wallet; `viewMode` in the persisted accounts filters gains `wallet`. The old Cards markup and its styles are removed, not kept alongside. Table is unchanged, with no color swatch or other addition (owner decision 2026-11-24). Tabs, card-type filter, hide-zero and their keyboard shortcuts (including the cards/table toggle) keep working; the layout toggle shortcut cycles through all three.
- **Card face:** network logo, chip, contactless mark, name, type, masked number, cardholder name, amount owed (credit-like accounts: Credit Account, e-Credit, BNPL) or balance (others). Accounts with no network use the lighter "plain" look with a type icon. The masked number shows `•••• ••••` because the app has no last-4 field; adding one is out of scope. The cardholder line uses the Profile display name.
- **Brand marks:** the prototype's network logos are stand-ins. Official Visa, Mastercard, Amex, JCB and UnionPay marks need brand assets and usage rules; until then the stand-in marks ship behind a single logo component so they can be swapped in one place.
- **Settings:** a new "Accounts" entry in the grouped Settings layout (`settings-ui/01`), under Appearance, holding Card finish (three live previews) and Account colors (one row per account, Auto plus swatches, instant name tooltip). It must be reachable by keyboard.
- **Wallet:** a list grouped Credit, Debit and savings, Wallets and cash; the selected account shows a hero card and details. Selection is remembered during the session; arrow keys move it.
- **Effects:** tilt, glare and flip are disabled under `prefers-reduced-motion`. Cards scale with their container, not the window.
- **Out of the app:** there is no add or delete account action anywhere (ADR-0011). The bug that a removal in Notion is not reflected is tracked separately as `reference-data/01`; the cards view must simply hide accounts once that marker exists.
- **ADRs:** ADR-0001, ADR-0003, ADR-0005, ADR-0011.

## Testing Decisions
Proposed seams (to confirm with the owner), highest first:
1. **Accounts page, rendered with React Testing Library** (the existing `*.test.tsx` pattern): the Table | Cards | Wallet switch and its persistence, filters and tabs in each view, owed versus balance on the card face, "No network" state, the due pill tone, the flip, Wallet selection by click and arrow keys, no add or delete control.
2. **Local settings through the main-process settings module** (`ui.settings` read, write, defaults and coercion): `cardFinish` and `accountColors` round trip, an unknown finish or color falls back to the default.
3. **Automatic color assignment** as a pure function: stable for the same input, never reuses a color another account has while one is free, skips the neutral colors, Cash starts at Graphite, an explicit choice is never overridden.
4. **Account pull**: Payment Network from a Notion page reaches the account DTO, including empty and unknown values (the existing page-extractor and `pullAccounts` pattern).
5. **End-to-end (Playwright, runs separately from `npm test`):** open Accounts, switch to Wallet, change a card finish and an account color in Settings and see it applied. Remember that UI text changes can pass locally and fail the separate e2e run.

A good test here asserts what the owner sees or what is persisted, never class names or inline styles. Visual polish (tilt, glare, gradients) is verified by a screenshot in the ticket evidence, not by tests. Prior art: `expense.test.tsx`, `table-resize.test.tsx`, `search-toggle.test.tsx`, and the `accountsFilters` persistence in `ui-settings-context`.

## Inputs
- `prototypes/account-cards/index.html` (approved prototype, 2026-11-24)
- `docs/adr/0011-reference-data-is-created-in-notion-only.md`
- `tickets/reference-data/01-notion-removals-not-reflected.md`
- `tickets/settings-ui/01-grouped-settings-layout.md` (where the Settings entry goes)
- `GLOSSARY.md`: Account, Reference data, Payment network, Card color / Card finish

## Out of Scope
- Creating, editing or deleting accounts, in any view (ADR-0011).
- Writing card colors or finish to Notion.
- A last-4-digits field, card expiry, or editable cardholder name.
- Official network brand assets (the stand-in marks ship first).
- Fixing removals in Notion not reaching the app (`reference-data/01`).
- Any change to the Table view.
- A mobile or tablet layout beyond the app's existing responsive behavior.

## Further Notes
- `settings-ui/01` is still in progress; the Settings entry should land in whichever Settings layout is current when the ticket is worked.
- Suggested ticket order: Payment Network read, display settings and auto color, card component, Cards view replacing the old one, Wallet view, Settings entry, then docs and e2e.
- Windows and Linux builds must be checked for the glare and 3D effects, as the prototype was only viewed in a Chromium pane.
