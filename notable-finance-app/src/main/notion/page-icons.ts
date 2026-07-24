// Notion page icons applied on every push (create + update).
// Uses Notion native icons: { type: "icon", icon: { name, color } }
// See https://developers.notion.com/reference/emoji-and-icon
// Icon picker names are accepted (spaces / hyphens / case are interchangeable).
import { isPasabuyCategoryName } from '../domain/notion-formulas'
import { INCOME_VIEW_FIXED_CATEGORY } from '../../shared/finance.types'

export type NotionIconColor =
  | 'gray'
  | 'lightgray'
  | 'brown'
  | 'yellow'
  | 'orange'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red'

export type NotionPageIcon = {
  type: 'icon'
  icon: { name: string; color: NotionIconColor }
}

const native = (name: string, color: NotionIconColor): NotionPageIcon => ({
  type: 'icon',
  icon: { name, color }
})

const TRANSFER = INCOME_VIEW_FIXED_CATEGORY.transfers!.toLowerCase()
const CC_PAYMENT = INCOME_VIEW_FIXED_CATEGORY.creditCardPayments!.toLowerCase()

/**
 * Income page icon:
 *  - Receivable (no receiving account) → delivery truck profile / blue
 *  - Transfer category                 → arrow half left right circle / yellow
 *  - Credit Card Payment category      → credit card / red
 *  - Everything else (normal income)   → arrow up circle / green
 */
export function iconForIncome(input: {
  categorySource: string | null | undefined
  accountId: string | null | undefined
}): NotionPageIcon {
  if (!input.accountId) return native('delivery truck profile', 'blue')
  const source = (input.categorySource ?? '').trim().toLowerCase()
  if (source === TRANSFER) return native('arrow half left right circle', 'yellow')
  if (source === CC_PAYMENT) return native('credit card', 'red')
  return native('arrow up circle', 'green')
}

/**
 * Expense page icon:
 *  - Pasabuy category (or local is_pasabuy) → vitruvian man circle / yellow
 *  - Everything else                       → arrow down circle / red
 */
export function iconForExpense(input: {
  categoryName: string | null | undefined
  isPasabuy?: boolean
}): NotionPageIcon {
  if (input.isPasabuy || isPasabuyCategoryName(input.categoryName ?? undefined)) {
    return native('vitruvian man circle', 'yellow')
  }
  return native('arrow down circle', 'red')
}
