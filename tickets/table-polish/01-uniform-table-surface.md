# 01: Uniform table surface and distinct header shade

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
Every table in the app shows one consistent body shade with a clearly different header row, instead of the lighter band that currently starts after the pinned first columns in dark mode. This covers the shared data table, the Monitoring budget table and any other hand-written table found in an audit (Accounts, Dashboard, Receivables panels).

## Acceptance criteria
- [ ] AC1: In dark and light themes, all body cells of a data table share one background, including the pinned first columns on wide tables.
- [ ] AC2: The header row has its own distinct shade, the same on every table.
- [ ] AC3: Row hover and the total row keep their own tint and stay readable.
- [ ] AC4: Pinned columns stay solid when the table scrolls sideways, so content never shows through.
- [ ] AC5: The Monitoring budget table uses the same surface and header shade as the data table.
- [ ] AC6: Every other table found in the audit either matches or is listed in the log as intentionally different.
- [ ] AC7: Tables use the app's original look, made uniform: body cells have no fill of their own, and no row, column or header looks highlighted. ~~Neutral gray shades with no brown or yellow tint~~ replaced: the user saw even neutral gray fills as highlighted.

## Inputs
- Grill session 2026-11-23, item 1
- Table styles and the shared data table component

## Evidence
- Commits:
- PR:
- Tests:
- Review:
- Docs updated:

## Progress log
### 2026-11-23 claude
- Did: Created from the grill-with-docs session of 2026-11-23 and approved by the user in /to-tickets.
- Next: Claim and implement with /implement.

### 2026-11-24 claude
- Did: Cooked. Added theme tokens for table header, body, hover and footer shades (light and dark) and applied them to every cell of the shared data table, so the pinned first columns, scrolling cells and the header no longer differ. Removed the old dark-only pinned-column colors. The data table was the only table used by Money movement, Accounts, Monitoring and History; the other tables (Monitoring budget dialog, receipt, Notion preview) are small modal tables left as they were. Not looked at in a real window yet, and no test written (cook only).
- Next: /cook-a-ticket [serve] to commit and close once you have tried it.

### 2026-11-24 claude
- Requirement change: added AC7. The user tried the installed build and the header and total rows looked brown or yellowish. Cause: my new table shade tokens were warm stone colors (the same family as the dark theme's surfaces). They should be neutral gray, black and white.
- Did: replaced the table shade tokens in both themes with neutral grays. Not looked at in a real window yet.

### 2026-11-24 claude
- Requirement change: none (AC7 already says no brown or yellow tint). The user still saw a yellowish touch after the first fix. Likely causes: the dark theme's older footer rule and the header text and line colors still came from the warm stone palette, and could win over my table shades. Made the table rules more specific and gave the table its own neutral header text and line colors in both themes.
- Did: rebuilt and reinstalled on this laptop. Not looked at in a real window yet.

### 2026-11-24 claude
- Requirement change: AC7 clarified by the user (they chose "lighter gray table"). In dark mode the table should read as a usual mid dark gray, not a near-black block on the navy card. Dark shades are now header #3a3a3c, rows #2a2a2c, hover #323234, total #333335. The card and page background behind the table are unchanged.
- Did: rebuilt and reinstalled. Not looked at in a real window yet.

### 2026-11-24 claude
- Requirement change: AC7 reworded. The user said the table still looks highlighted and asked to go back to the original colors but make them consistent. My separate gray fills for the header, body and total row were the highlight, so they are gone.
- Did: body cells have no fill (the card shows through, as originally). The header is one faint tint over the whole row, hover uses the same faint tint, and the total row looks like the body with a line above it. Only the pinned first two columns of a wide table keep a solid fill, using a new --table-pinned-bg token chosen to match the card (the glass preset draws cards at 54% surface, so it uses that mix). Removed my --table-head-bg, --table-body-bg, --table-hover-bg, --table-foot-bg, --table-head-ink and --table-line tokens.
- Not looked at in a real window by me.
