import type { ChatDraftDto, ChatOverlayId } from '../../../shared/finance.types'
import {
  CHEER_KEYWORDS,
  INCOME_CELEBRATE_THRESHOLD,
  SPEND_WINCE_THRESHOLD
} from './catalog'

export type AutoHooks = {
  keywordCheer: boolean
  budgetGuardNotes: string[]
  incomeCelebrate: boolean
  spendWince: boolean
  overBudget: boolean
}

export function detectKeywordCheer(text: string): boolean {
  const lower = text.toLowerCase()
  return CHEER_KEYWORDS.some((k) => lower.includes(k))
}

/**
 * Effective voice for the model: keyword-cheer biases to cheer unless user
 * forced /roast or /strict (or /quiet).
 */
export function effectiveOverlayForPrompt(
  active: ChatOverlayId,
  keywordCheer: boolean
): ChatOverlayId {
  if (active === 'roast' || active === 'strict' || active === 'quiet') return active
  if (keywordCheer && active === 'default') return 'cheer'
  if (keywordCheer && active === 'cheer') return 'cheer'
  return active
}

type BudgetRow = {
  name?: string
  budget?: number
  spending?: number
  remaining?: number
  overBudget?: boolean
}

function collectBudgetNotesFromPayload(payload: unknown, into: string[]): void {
  if (!payload || typeof payload !== 'object') return
  const obj = payload as Record<string, unknown>

  const categories = obj.categories
  if (Array.isArray(categories)) {
    for (const row of categories as BudgetRow[]) {
      if (row.overBudget === true || (typeof row.spending === 'number' && typeof row.budget === 'number' && row.budget > 0 && row.spending > row.budget)) {
        const name = row.name ?? 'Category'
        const budget = row.budget ?? 0
        const spending = row.spending ?? 0
        into.push(
          `${name}: spent ₱${spending.toLocaleString()} vs budget ₱${budget.toLocaleString()}`
        )
      }
    }
  }

  // Nested draft warnings from proposeCreateExpense
  const draft = obj.draft as ChatDraftDto | undefined
  if (draft?.warnings?.length) {
    for (const w of draft.warnings) {
      if (/budget|over/i.test(w)) into.push(w)
    }
  }
}

export function detectBudgetGuardFromToolResults(results: unknown[]): string[] {
  const notes: string[] = []
  for (const r of results) collectBudgetNotesFromPayload(r, notes)
  return [...new Set(notes)]
}

export function formatBudgetGuardAppendix(
  overlay: ChatOverlayId,
  notes: string[]
): string | null {
  if (notes.length === 0) return null
  const body = notes.slice(0, 3).join('; ')
  if (overlay === 'quiet') return `Budget: ${body}.`
  if (overlay === 'strict') return `Budget warning: ${body}.`
  if (overlay === 'roast') {
    return `Ayan — budget check: ${body}. Magtipid ka naman!`
  }
  return `Paalala sa budget: ${body}.`
}

export function buildApproveQuip(input: {
  overlay: ChatOverlayId
  draft: ChatDraftDto
  keywordCheer?: boolean
}): string | null {
  const { overlay, draft } = input
  if (overlay === 'quiet') {
    return draft.action === 'create' ? 'Logged.' : 'Updated.'
  }

  const amount =
    typeof draft.payload.grossIncome === 'number'
      ? draft.payload.grossIncome
      : typeof draft.payload.amount === 'number'
        ? draft.payload.amount
        : null

  const isIncome = draft.resource === 'incomes'
  const isExpense = draft.resource === 'expenses'
  const celebrate = isIncome && amount != null && amount >= INCOME_CELEBRATE_THRESHOLD
  const wince = isExpense && amount != null && amount >= SPEND_WINCE_THRESHOLD
  const cheerBias = input.keywordCheer === true || overlay === 'cheer'

  if (overlay === 'strict') {
    if (celebrate) return `Saved. Income amount ₱${amount!.toLocaleString()}.`
    if (wince) return `Saved. Expense amount ₱${amount!.toLocaleString()} — review discretionary spend.`
    return 'Saved.'
  }

  if (celebrate) {
    if (overlay === 'roast') return 'Added. Ang laki — ingat sa gastos ha. Grabe paldo!'
    return 'Added it. Grabe paldo!'
  }

  if (cheerBias && isExpense) {
    return 'Dasurv mo yan. Naka-log na.'
  }

  if (wince || overlay === 'roast') {
    if (isExpense) {
      return overlay === 'roast'
        ? 'Okay, naka-lista. Ang gastos mo naman — tipid mode next!'
        : 'Okay na, naka-lista. Magtipid ka nga!'
    }
  }

  if (overlay === 'cheer') return 'Good call — logged.'
  if (isIncome) return 'Added. Nice.'
  if (isExpense) return 'Logged. All good.'
  return 'Done.'
}

export function buildCancelAck(overlay: ChatOverlayId): string {
  if (overlay === 'quiet' || overlay === 'strict') return 'Cancelled.'
  return 'Cancelled — nothing saved.'
}
