// The account's "Card Numbers & Last 4 Digit" Notion text, e.g. "16, 4056": a card number of 16
// digits whose last four are 4056. Only the count and the last four digits are ever kept, so the
// rest of the number is drawn as dots. Anything that does not parse shows nothing at all.

export interface ParsedCardNumber {
  /** Total digits on the card, 12 to 19. */
  count: number
  /** The last four digits, as text so leading zeros survive. */
  last4: string
}

export const MASK_CHAR = '•'

/** Parse "16, 4056" (flexible spacing). Returns null for anything else. */
export function parseCardNumber(raw: string | null | undefined): ParsedCardNumber | null {
  if (!raw) return null
  const match = /^\s*(\d{1,3})\s*,\s*(\d{4})\s*$/.exec(raw)
  if (!match) return null
  const count = Number(match[1])
  if (!Number.isInteger(count) || count < 12 || count > 19) return null
  return { count, last4: match[2] }
}

/** How a card number of this length is grouped when printed (Amex 15 = 4-6-5, Diners 14 = 4-6-4). */
function groupSizes(count: number): number[] {
  if (count === 15) return [4, 6, 5]
  if (count === 14) return [4, 6, 4]
  const sizes: number[] = []
  let left = count
  while (left > 0) {
    sizes.push(Math.min(4, left))
    left -= 4
  }
  return sizes
}

/** "•••• •••• •••• 4056" for a 16-digit card: every digit but the last four is a dot. */
export function formatMaskedCardNumber(card: ParsedCardNumber): string {
  const chars = [...MASK_CHAR.repeat(card.count - 4), ...card.last4]
  const groups: string[] = []
  let at = 0
  for (const size of groupSizes(card.count)) {
    groups.push(chars.slice(at, at + size).join(''))
    at += size
  }
  return groups.join(' ')
}

/** "•••• 4056": the short form used in a subtitle. */
export function formatLast4(card: ParsedCardNumber): string {
  return `${MASK_CHAR.repeat(4)} ${card.last4}`
}

/** The masked number for an account's raw Notion text, or null when there is nothing valid to show. */
export function maskedCardNumberOrNull(raw: string | null | undefined): string | null {
  const parsed = parseCardNumber(raw)
  return parsed ? formatMaskedCardNumber(parsed) : null
}
