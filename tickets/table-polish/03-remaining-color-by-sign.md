# 03: Color the Remaining column by sign in Monitoring

**Type:** dev
**Status:** in-progress
**Blocked by:** None
**Owner:** claude

## What to build
In the Monitoring Monthly Budget table, the Remaining amounts show in red when negative and green when positive. Zero keeps the normal text color. The Total row follows the same rule. Only the color changes; amounts, sorting and everything else stay as they are.

## Acceptance criteria
- [ ] AC1: In the Simplified and Breakdown views, a negative Remaining amount is red and a positive one is green, using the same number font and the same red and green as money amounts elsewhere in the app (for example CC Payment), using the same number font and the same red and green as money amounts elsewhere in the app (for example CC Payment), in light and dark themes.
- [ ] AC2: A zero Remaining amount keeps the normal text color.
- [ ] AC3: The Total row's Remaining amount follows the same rule.
- [ ] AC4: The text of the amounts is unchanged and sorting the Remaining column still works.

## Inputs
- Monitoring page, Monthly Budget table
- User request 2026-11-24 (screenshot of the Monthly Budget table)

## Evidence
- Commits:
- PR:
- Tests:
- Review:
- Docs updated:

## Progress log
### 2026-11-24 claude
- Did: Created from the user's request and started at once, because the change is small and the request names the colors.

### 2026-11-24 claude
- Did: Cooked. Remaining amounts in the Simplified and Breakdown views, and their Total rows, now go through a small RemainingAmount piece that colors the number: red-orange when negative (#e8590c light, #ff7a45 dark), yellow-green when positive (#5f8f0a light, #b5d932 dark), normal text at zero. The text and sort behavior are unchanged. The Cards view's "Remaining" text is not colored.
- Checks: typecheck clean, 644 unit tests and all e2e tests pass; reinstalled on this laptop. No test written (cook only) and not seen in a real window by me, so no criteria are ticked.

### 2026-11-24 claude
- Requirement change: the user changed their mind: plain red and green only, not red-orange and yellow-green. AC1 and the description reworded.
- Did: red is #d92d20 (light) and #ff4d4f (dark); green is #178a3a (light) and #32d46b (dark). Reinstalled on this laptop.

### 2026-11-24 claude
- Requirement change: the user showed the CC Payment amounts and asked for the same look: the number (monospace) font and the app's own green and red. AC1 reworded.
- Did: removed my custom RemainingAmount colors and used the app's existing MoneyValue for every Remaining cell and Total, so the font and colors are the same as everywhere else. As a side effect the column now sorts by the number itself. Reinstalled on this laptop.

### 2026-11-24 claude
- Requirement change: the user showed the CC Payment amounts and asked for the same look: the number (monospace) font and the app's own green and red. AC1 reworded.
- Did: removed my custom RemainingAmount colors and used the app's existing MoneyValue for every Remaining cell and Total, so the font and colors are the same as everywhere else. As a side effect the column now sorts by the number itself. Reinstalled on this laptop.
