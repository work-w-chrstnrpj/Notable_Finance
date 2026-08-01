import * as repo from '../../db/repositories'
import * as reports from '../../services/reports'
import { requireMonth, resolveMonth, currentMonth } from '../dates'

/**
 * Month filter for list queries: resolve phrases like "this month", but if the
 * model passes something unparseable, drop the filter instead of throwing so
 * the query still returns data (a common, low-stakes model mistake).
 */
function optionalMonthFilter(raw: unknown): string | undefined {
  if (raw == null || raw === '') return undefined
  return resolveMonth(raw) ?? undefined
}

/**
 * Year-only filter ("2026"): expands to the full Jan 1 – Dec 31 range so
 * year-level questions like "total expense for 2026" are answerable without
 * the model computing date boundaries.
 */
function yearRange(raw: unknown): { rangeStart?: string; rangeEnd?: string } {
  const y = str(raw)
  if (!y || !/^\d{4}$/.test(y)) return {}
  return { rangeStart: `${y}-01-01`, rangeEnd: `${y}-12-31` }
}
import { resolveExpenseProfile } from '../expense-profile'

const MAX_ROWS = 40

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {}
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function bool(v: unknown): boolean {
  return v === true
}

function slimIncome(r: ReturnType<typeof repo.listIncomes>[number]) {
  return {
    id: r.id,
    name: r.name,
    date: r.date,
    grossIncome: r.grossIncome,
    capitalExpenditure: r.capitalExpenditure,
    accountId: r.accountId,
    categoryId: r.categoryId
  }
}

function slimExpense(r: ReturnType<typeof repo.listExpenses>[number]) {
  return {
    id: r.id,
    description: r.description,
    purchaseDate: r.purchaseDate,
    datePaid: r.datePaid,
    amount: r.amount,
    interest: r.interest,
    accountId: r.accountId,
    categoryId: r.categoryId,
    paymentStatus: r.paymentStatus,
    pasabuyer: r.pasabuyer,
    pasabuyStatus: r.pasabuyStatus
  }
}

export function getDashboardSummary(args: unknown) {
  const a = asRecord(args)
  const month = requireMonth(a.month ?? currentMonth())
  return reports.dashboard(month)
}

export function getMonthlyMonitoringSnapshot(args: unknown) {
  const a = asRecord(args)
  const month = requireMonth(a.month ?? currentMonth())
  return reports.monitoring(month)
}

export function listAccountsTool(args: unknown) {
  const a = asRecord(args)
  const includeInactive = bool(a.includeInactive)
  return repo.listAccounts(includeInactive).map((acc) => ({
    id: acc.id,
    name: acc.name,
    type: acc.type,
    inactive: acc.inactive,
    currentBalance: acc.currentBalance,
    creditLimit: acc.creditLimit,
    availableLimit: acc.availableLimit
  }))
}

export function listIncomeCategoriesTool(args: unknown) {
  const a = asRecord(args)
  const normalOnly = a.normalOnly !== false
  let cats = repo.listIncomeCategories()
  if (normalOnly) {
    cats = cats.filter((c) => !c.auxiliary)
  }
  return cats.map((c) => ({
    id: c.id,
    source: c.source,
    auxiliary: c.auxiliary
  }))
}

export function listExpenseCategoriesTool(_args: unknown) {
  return repo.listExpenseCategories().map((c) => ({
    id: c.id,
    name: c.name,
    monthlyBudget: c.monthlyBudget,
    auxiliary: c.auxiliary
  }))
}

export function queryIncomes(args: unknown) {
  const a = asRecord(args)
  const month = optionalMonthFilter(a.month)
  const yRange = yearRange(a.year)
  const records = repo.listIncomes({
    month,
    rangeStart: str(a.rangeStart) ?? yRange.rangeStart,
    rangeEnd: str(a.rangeEnd) ?? yRange.rangeEnd,
    accountId: str(a.accountId),
    categoryId: str(a.categoryId),
    view: (str(a.view) as
      | 'incomes'
      | 'transfers'
      | 'creditCardPayments'
      | 'alkansya'
      | 'receivables'
      | undefined) ?? 'incomes'
  })
  const total = records.reduce((s, r) => s + (r.grossIncome || 0), 0)
  return {
    count: records.length,
    totalGrossIncome: total,
    truncated: records.length > MAX_ROWS,
    records: records.slice(0, MAX_ROWS).map(slimIncome)
  }
}

export function queryExpenses(args: unknown) {
  const a = asRecord(args)
  const month = optionalMonthFilter(a.month)
  const yRange = yearRange(a.year)
  const records = repo.listExpenses({
    month,
    rangeStart: str(a.rangeStart) ?? yRange.rangeStart,
    rangeEnd: str(a.rangeEnd) ?? yRange.rangeEnd,
    accountId: str(a.accountId),
    categoryId: str(a.categoryId),
    paymentStatus: str(a.paymentStatus),
    expenseViewMode: str(a.expenseViewMode) ?? str(a.viewMode) ?? 'Monthly',
    pasabuyer: str(a.pasabuyer)
  })
  const totalAmount = records.reduce((s, r) => s + (r.amount || 0) + (r.interest || 0), 0)
  return {
    count: records.length,
    totalAmount,
    viewMode: str(a.expenseViewMode) ?? str(a.viewMode) ?? 'Monthly',
    truncated: records.length > MAX_ROWS,
    records: records.slice(0, MAX_ROWS).map(slimExpense)
  }
}

export function getCategoryBudgetStatus(args: unknown) {
  const a = asRecord(args)
  const month = requireMonth(a.month ?? currentMonth())
  const snap = reports.monitoring(month)
  const categoryId = str(a.categoryId)
  const categoryName = str(a.categoryName)?.toLowerCase()

  let rows = snap.expenseCategories
  if (categoryId) rows = rows.filter((c) => c.id === categoryId)
  if (categoryName) {
    rows = rows.filter((c) => c.name.toLowerCase().includes(categoryName))
  }

  return {
    month: snap.month,
    monthlyExpense: snap.monthlyExpense,
    categories: rows.map((c) => ({
      id: c.id,
      name: c.name,
      budget: c.budget,
      spending: c.spending,
      remaining: c.remaining,
      overBudget: c.spending > c.budget && c.budget > 0
    }))
  }
}

const APP_TOPICS: Record<string, string> = {
  transfer:
    'Transfer moves money between two non-credit accounts using the locked Transfer income category. Use the Transfer workflow page. Chat cannot delete records.',
  'credit card payment':
    'Credit Card Payment logs a payment from a non-credit payer account to a credit-like account (locked Credit Card Payment category). Use the CC Payment workflow. Chat cannot delete records.',
  alkansya:
    'Alkansya is the savings workflow (locked Savings-style category). Use the Alkansya page to log savings moves. Chat cannot delete records.',
  receivables:
    'Receivables tracks money owed to you (income-backed, often without a receiving account). Use the Receivables workflow. Chat cannot delete records.',
  pasabuy:
    'Pasabuy expenses track purchases you make for someone else (Pasabuyer, status, receiver). Use Expense with a Pasabuy category or Unpaid Pasabuy view. Chat cannot delete records.',
  'soft delete':
    'Soft delete clears the amount and rewrites the title with [Deleted: Amount], then syncs that state to Notion. Soft delete is the default.',
  'hard delete':
    'Hard delete (when enabled in Settings → Interface) removes the local row and moves the Notion page to trash on push. Toggle carefully.',
  sync: 'Sync pulls from Notion, pushes dirty local changes, then refreshes from Notion. Notion remains the finance source of truth for the web path; this desktop app is local-first with Notion as a bidirectional mirror.',
  chat: 'Chat is an opt-in Finance Copilot. It can read local SQLite via tools and later propose creates/edits with confirm. It never deletes finance records. You can delete chat history only.',
  monitoring:
    'Monthly Monitoring shows income/expense/net and category budget vs spending for a YYYY-MM month. Budgets are maintained on categories / Monitoring UI — Chat rebudget plans do not write.',
  budget:
    'Category monthly budgets live on expense categories. Spending is derived from expenses in the month. Rebudget in Chat is advice only — apply changes in Monthly Monitoring / Notion as product allows.'
}

export function explainAppTopic(args: unknown) {
  const a = asRecord(args)
  const topic = (str(a.topic) ?? '').toLowerCase()
  if (!topic) {
    return {
      found: false,
      message: 'Which topic? Examples: Transfer, Pasabuy, Soft delete, Hard delete, Sync, Monitoring, Rebudget.'
    }
  }
  for (const [key, text] of Object.entries(APP_TOPICS)) {
    if (topic.includes(key) || key.includes(topic)) {
      return { found: true, topic: key, explanation: text }
    }
  }
  return {
    found: false,
    message: `No canned explanation for "${topic}". Try Transfer, CC Payment, Alkansya, Receivables, Pasabuy, Soft delete, Hard delete, Sync, Monitoring, or Chat.`,
    knownTopics: Object.keys(APP_TOPICS)
  }
}

export function getExpenseFieldSchema(args: unknown) {
  const a = asRecord(args)
  const accountId = str(a.accountId)
  const categoryId = str(a.categoryId)
  const categoryNameHint = str(a.categoryName)
  const viewMode = str(a.viewMode) ?? str(a.expenseViewMode) ?? 'Monthly'
  const accountTypeHint = str(a.accountType)

  let accountType: string | null = accountTypeHint ?? null
  if (!accountType && accountId) {
    try {
      const acc = repo.listAccounts(true).find((x) => x.id === accountId)
      accountType = acc?.type ?? null
    } catch {
      accountType = null
    }
  }

  let categoryName = categoryNameHint ?? ''
  if (categoryId) {
    try {
      const cat = repo.listExpenseCategories().find((c) => c.id === categoryId)
      if (cat) categoryName = cat.name
    } catch {
      // keep hint
    }
  }

  const { creditCard, pasabuy } = resolveExpenseProfile({
    accountType,
    categoryName,
    viewMode
  })

  return {
    profile: {
      base: true,
      creditCard,
      pasabuy
    },
    viewMode,
    accountType,
    categoryName: categoryName || null,
    requiredBase: [
      'Purchase description',
      'Purchase Date',
      'Accounts',
      'Categories',
      'Expense Amount'
    ],
    requiredCreditCard: creditCard
      ? ['Payment Status (often)', 'Payment Frequency / periods when Installment']
      : [],
    requiredPasabuy: pasabuy ? ['Pasabuyer', 'Pasabuy Status'] : [],
    note: 'Use this schema to clarify incomplete expense drafts. Writes require Approve.'
  }
}

/**
 * Same-total rebudget plan. Adjustments are category name → delta (must sum ~0).
 * Does not write anything.
 */
export function validateRebudgetAdjustments(
  adjustments: Array<{ categoryName: string; delta: number }>
): { ok: true } | { ok: false; deltaSum: number; error: string } {
  const deltaSum = adjustments.reduce((s, x) => s + x.delta, 0)
  if (adjustments.length > 0 && Math.abs(deltaSum) > 0.01) {
    return {
      ok: false,
      deltaSum,
      error:
        'Adjustments must sum to 0 to keep the same total budget envelope. Fix deltas or apply in Monthly Monitoring if you want a different total.'
    }
  }
  return { ok: true }
}

export function planRebudget(args: unknown) {
  const a = asRecord(args)
  const month = requireMonth(a.month ?? currentMonth())
  const snap = reports.monitoring(month)
  const adjustmentsRaw = Array.isArray(a.adjustments) ? a.adjustments : []

  type Adj = { categoryName: string; delta: number }
  const adjustments: Adj[] = []
  for (const item of adjustmentsRaw) {
    const row = asRecord(item)
    const categoryName = str(row.categoryName) ?? str(row.name)
    const delta = num(row.delta)
    if (!categoryName || delta === undefined) continue
    adjustments.push({ categoryName, delta })
  }

  const byName = new Map(snap.expenseCategories.map((c) => [c.name.toLowerCase(), c]))
  const totalBudget = snap.expenseCategories.reduce((s, c) => s + (c.budget || 0), 0)
  const validity = validateRebudgetAdjustments(adjustments)
  if (!validity.ok) {
    return {
      ok: false as const,
      month,
      totalBudget,
      deltaSum: validity.deltaSum,
      error: validity.error
    }
  }

  const plan = snap.expenseCategories.map((c) => {
    const match = adjustments.find((x) => c.name.toLowerCase() === x.categoryName.toLowerCase())
    const delta = match?.delta ?? 0
    const suggestedBudget = Math.max(0, (c.budget || 0) + delta)
    return {
      categoryId: c.id,
      categoryName: c.name,
      oldBudget: c.budget,
      spending: c.spending,
      remaining: c.remaining,
      delta,
      suggestedBudget,
      overspentVsSuggested: c.spending > suggestedBudget && suggestedBudget >= 0
    }
  })

  const unknown = adjustments
    .filter((x) => !byName.has(x.categoryName.toLowerCase()))
    .map((x) => x.categoryName)

  const suggestedTotal = plan.reduce((s, r) => s + r.suggestedBudget, 0)

  return {
    ok: true as const,
    month,
    totalBudget,
    suggestedTotal,
    sameTotal: Math.abs(suggestedTotal - totalBudget) < 0.01,
    unknownCategories: unknown,
    plan,
    reminder:
      'This is a plan only. Apply budget changes yourself in Monthly Monitoring. Chat will not write budgets.'
  }
}

export function resolveMonthTool(args: unknown) {
  const a = asRecord(args)
  const resolved = resolveMonth(a.phrase ?? a.month)
  return {
    input: a.phrase ?? a.month ?? null,
    resolved,
    currentMonth: currentMonth()
  }
}
