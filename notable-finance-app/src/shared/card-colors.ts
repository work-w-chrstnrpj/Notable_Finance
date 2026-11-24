// Account card colors: the one shared palette plus the pure "Auto" color rules (ADR-0011).
// Colors are a local display preference. Nothing here is read from or written to Notion.
// Shades match the approved prototype (prototypes/account-cards/index.html).

export const CARD_FINISHES = ['glass', 'metal', 'matte'] as const
export type CardFinish = (typeof CARD_FINISHES)[number]
export const DEFAULT_CARD_FINISH: CardFinish = 'glass'

export interface CardColor {
  name: string
  /** Gradient start. */
  dark: string
  /** Gradient end. */
  mid: string
  /** Soft highlight used for glow and accents. */
  highlight: string
  /** Text and logo tone that stays readable on this color. */
  ink: 'light' | 'dark'
}

const c = (name: string, dark: string, mid: string, highlight: string, ink: 'light' | 'dark' = 'light'): CardColor => ({
  name,
  dark,
  mid,
  highlight,
  ink
})

/** The 18 named colors, in the order the Settings swatches show them. */
export const CARD_COLORS: readonly CardColor[] = [
  c('Red', '#991b1b', '#ef4444', '#fecaca'),
  c('Orange', '#c2410c', '#fb923c', '#fed7aa'),
  c('Yellow', '#a16207', '#facc15', '#fef9c3', 'dark'),
  c('Green', '#166534', '#22c55e', '#bbf7d0'),
  c('Forest', '#14532d', '#15803d', '#86efac'),
  c('Teal', '#115e59', '#14b8a6', '#99f6e4'),
  c('Sky', '#0b4f8a', '#2a8bd1', '#bfe6ff'),
  c('Blue', '#1e40af', '#3b82f6', '#bfdbfe'),
  c('Navy', '#0a1a3d', '#123a8f', '#e0a020'),
  c('Purple', '#4c1d95', '#8b5cf6', '#ddd6fe'),
  c('Pink', '#9d174d', '#ec4899', '#fbcfe8'),
  c('Ruby', '#7b1e2b', '#c0392b', '#f4a259'),
  c('Gold', '#744210', '#b7791f', '#f6d77a'),
  c('Brown', '#44250f', '#8b5a2b', '#e3c9a8'),
  c('Black', '#09090b', '#27272a', '#52525b'),
  c('Graphite', '#3f3f46', '#71717a', '#d4d4d8'),
  c('Silver', '#9ca3af', '#e5e7eb', '#ffffff', 'dark'),
  c('White', '#e7e5e4', '#fafaf9', '#ffffff', 'dark')
]

export const CARD_COLOR_NAMES: readonly string[] = CARD_COLORS.map((x) => x.name)

/** Neutral colors are a manual choice only: Auto never picks them. */
const NEUTRAL = new Set(['Black', 'Graphite', 'Silver', 'White'])
export const AUTO_CARD_COLORS: readonly string[] = CARD_COLOR_NAMES.filter((n) => !NEUTRAL.has(n))
export const CASH_CARD_COLOR = 'Graphite'

export function isCardColorName(value: unknown): value is string {
  return typeof value === 'string' && CARD_COLOR_NAMES.includes(value)
}

export function isCardFinish(value: unknown): value is CardFinish {
  return typeof value === 'string' && (CARD_FINISHES as readonly string[]).includes(value)
}

export function cardColorByName(name: string | null | undefined): CardColor | null {
  return CARD_COLORS.find((x) => x.name === name) ?? null
}

/** Keep only entries that name a real palette color (unknown colors fall back to Auto). */
export function coerceAccountColors(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [id, name] of Object.entries(raw as Record<string, unknown>)) {
    if (id && isCardColorName(name)) out[id] = name
  }
  return out
}

export interface ColorableAccount {
  id: string
  name: string
  type: string
}

/** Same hash as the prototype so a name always starts at the same palette position. */
function hashName(name: string): number {
  return [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
}

/**
 * Auto color for one account: Cash is Graphite; otherwise start at a hash of the name and
 * take the first colored palette entry no other account uses. If every color is taken the
 * hash-start color is reused.
 */
export function pickAutoCardColor(account: ColorableAccount, used: ReadonlySet<string>): string {
  if (account.type === 'Cash') return CASH_CARD_COLOR
  const start = hashName(account.name) % AUTO_CARD_COLORS.length
  for (let i = 0; i < AUTO_CARD_COLORS.length; i++) {
    const name = AUTO_CARD_COLORS[(start + i) % AUTO_CARD_COLORS.length]
    if (!used.has(name)) return name
  }
  return AUTO_CARD_COLORS[start]
}

/**
 * Fill in a color for every account that has none. Explicit (saved) choices are never
 * changed, and accounts are visited in the order given, so the result is stable as long as
 * the first picks are saved. Returns the full map and whether anything new was assigned.
 */
export function assignAutoCardColors(
  accounts: readonly ColorableAccount[],
  saved: Readonly<Record<string, string>>
): { colors: Record<string, string>; changed: boolean } {
  const colors: Record<string, string> = {}
  for (const a of accounts) {
    if (isCardColorName(saved[a.id])) colors[a.id] = saved[a.id]
  }
  const used = new Set(Object.values(colors))
  let changed = false
  for (const a of accounts) {
    if (colors[a.id]) continue
    const name = pickAutoCardColor(a, used)
    colors[a.id] = name
    used.add(name)
    changed = true
  }
  // Keep saved entries for accounts not in this list (e.g. inactive or filtered out).
  for (const [id, name] of Object.entries(saved)) {
    if (!(id in colors) && isCardColorName(name)) colors[id] = name
  }
  return { colors, changed }
}
