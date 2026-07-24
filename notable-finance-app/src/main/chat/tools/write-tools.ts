import * as repo from '../../db/repositories'
import { isCreditLike } from '../../domain/resource-utils'
import type {
  ChatDraftDto,
  CreateExpenseInput,
  CreateIncomeInput,
  PaymentFrequency,
  PaymentStatus,
  PasabuyStatus,
  UpdateExpenseInput,
  UpdateIncomeInput
} from '../../../shared/finance.types'
import { putDraft } from '../drafts'
import { resolveDate, todayIso } from '../dates'
import { resolveExpenseProfile, WORKFLOW_LOCKED_CATEGORIES } from '../expense-profile'

export const MASS_EDIT_CAP = 50

export type WriteToolContext = { threadId: string }

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {}
}

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.trim() && Number.isFinite(Number(v))) return Number(v)
  return undefined
}

function optDate(v: unknown): string | undefined {
  if (v == null || v === '') return undefined
  return resolveDate(v) ?? (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined)
}

function findIncomeCategoryBySource(source: string): { id: string; source: string } | null {
  const hit = repo
    .listIncomeCategories()
    .find((c) => c.source.toLowerCase() === source.toLowerCase())
  return hit ? { id: hit.id, source: hit.source } : null
}

function findIncomeCategory(idOrName?: string): { id: string; source: string; auxiliary: boolean } | null {
  if (!idOrName) return null
  const cats = repo.listIncomeCategories()
  const byId = cats.find((c) => c.id === idOrName)
  if (byId) return byId
  const byName = cats.find((c) => c.source.toLowerCase() === idOrName.toLowerCase())
  return byName ?? null
}

function findExpenseCategory(idOrName?: string): { id: string; name: string } | null {
  if (!idOrName) return null
  const cats = repo.listExpenseCategories()
  const byId = cats.find((c) => c.id === idOrName)
  if (byId) return { id: byId.id, name: byId.name }
  const byName = cats.find((c) => c.name.toLowerCase() === idOrName.toLowerCase())
  return byName ? { id: byName.id, name: byName.name } : null
}

function findAccount(idOrName?: string) {
  if (!idOrName) return null
  const accounts = repo.listAccounts(true)
  return (
    accounts.find((a) => a.id === idOrName) ??
    accounts.find((a) => a.name.toLowerCase() === idOrName.toLowerCase()) ??
    null
  )
}

function accountLabel(id: string | null | undefined): string {
  if (!id) return '—'
  return findAccount(id)?.name ?? id
}

function categoryIncomeLabel(id: string | undefined): string {
  if (!id) return '—'
  return findIncomeCategory(id)?.source ?? id
}

function categoryExpenseLabel(id: string | undefined): string {
  if (!id) return '—'
  return findExpenseCategory(id)?.name ?? id
}

function draftResult(draft: ChatDraftDto) {
  return {
    draft,
    status: draft.status,
    missingRequired: draft.missingRequired,
    note:
      draft.status === 'needs_input'
        ? 'Draft incomplete — ask the user for missingRequired fields. Approve is disabled until ready.'
        : 'Draft ready — show confirm card. Do NOT claim the record was saved until the user Approves.'
  }
}

export function proposeCreateIncome(args: unknown, ctx: WriteToolContext) {
  const a = asRecord(args)
  const missing: string[] = []
  const warnings: string[] = []

  const name = str(a.name) ?? str(a.title)
  const date = optDate(a.date) ?? (str(a.date) ? undefined : todayIso())
  const grossIncome = num(a.grossIncome) ?? num(a.amount)
  const capitalExpenditure = num(a.capitalExpenditure) ?? 0
  const account = findAccount(str(a.accountId) ?? str(a.accountName) ?? str(a.account))
  const cat = findIncomeCategory(str(a.categoryId) ?? str(a.categoryName) ?? str(a.category))

  if (!name) missing.push('Name')
  if (!date) missing.push('Date')
  if (grossIncome === undefined) missing.push('Gross Income')
  if (!account) missing.push('Account')
  else if (isCreditLike(account.type)) warnings.push('Normal income usually uses a non-credit account.')
  if (!cat) missing.push('Category')
  else if (cat.auxiliary) {
    missing.push('Category (use a normal income category — not Transfer/CC Payment/IOU/etc.)')
  }

  const payload: Record<string, unknown> = {
    name: name ?? '',
    date: date ?? '',
    grossIncome: grossIncome ?? 0,
    capitalExpenditure,
    accountId: account?.id ?? null,
    categoryId: cat && !cat.auxiliary ? cat.id : '',
    notes: str(a.notes) ?? null,
    isTransaction: false
  }

  const draft = putDraft({
    threadId: ctx.threadId,
    resource: 'incomes',
    action: 'create',
    kind: 'proposeCreateIncome',
    missingRequired: missing,
    warnings,
    payload,
    display: {
      title: name || 'New income',
      amount: grossIncome ?? null,
      currency: 'PHP',
      date: date ?? null,
      from: cat && !cat.auxiliary ? cat.source : null,
      fromLabel: 'Category',
      to: account?.name ?? null,
      toLabel: 'Account',
      note: capitalExpenditure ? `Capital expenditure ₱${capitalExpenditure}` : null
    },
    summary: `Create income: ${name ?? '?'} · ₱${grossIncome ?? '?'} · ${date ?? '?'} · ${account?.name ?? '?'} · ${cat?.source ?? '?'}`
  })
  return draftResult(draft)
}

export function proposeCreateExpense(args: unknown, ctx: WriteToolContext) {
  const a = asRecord(args)
  const missing: string[] = []
  const warnings: string[] = []

  const description = str(a.description) ?? str(a.name) ?? str(a.title)
  const purchaseDate = optDate(a.purchaseDate) ?? optDate(a.date) ?? todayIso()
  const datePaid = optDate(a.datePaid) ?? null
  const amount = num(a.amount) ?? num(a.expenseAmount)
  const interest = num(a.interest) ?? 0
  const account = findAccount(str(a.accountId) ?? str(a.accountName) ?? str(a.account))
  const cat = findExpenseCategory(str(a.categoryId) ?? str(a.categoryName) ?? str(a.category))
  const forcePasabuy = a.pasabuy === true || a.profile === 'pasabuy'
  const forceCc = a.creditCard === true || a.profile === 'creditCard'

  const { creditCard, pasabuy } = resolveExpenseProfile({
    accountType: account?.type,
    categoryName: cat?.name,
    viewMode: str(a.viewMode),
    forcePasabuy,
    forceCc
  })

  if (!description) missing.push('Purchase description')
  if (!purchaseDate) missing.push('Purchase Date')
  if (amount === undefined) missing.push('Expense Amount')
  if (!account) missing.push('Account')
  if (!cat) missing.push('Category')

  const paymentStatus = (str(a.paymentStatus) as PaymentStatus | undefined) ?? undefined
  const paymentFrequency = (str(a.paymentFrequency) as PaymentFrequency | undefined) ?? undefined
  const periodCount = num(a.periodCount) ?? null
  const paidPeriod = num(a.paidPeriod) ?? null

  if (creditCard && !paymentStatus) missing.push('Payment Status')
  if (creditCard && paymentStatus === 'Installment') {
    if (!paymentFrequency) missing.push('Payment Frequency')
    if (!periodCount) missing.push('Period count')
  }

  const pasabuyer = str(a.pasabuyer) ?? null
  const pasabuyStatus = (str(a.pasabuyStatus) as PasabuyStatus | undefined) ?? null
  if (pasabuy && !pasabuyer) missing.push('Pasabuyer')
  if (pasabuy && !pasabuyStatus) missing.push('Pasabuy Status')

  if (account && creditCard && !isCreditLike(account.type) && forceCc) {
    warnings.push('creditCard profile requested but account is not credit-like.')
  }
  if (account && !creditCard && isCreditLike(account.type)) {
    warnings.push('Account is credit-like — CC fields will apply.')
  }

  const payload: Record<string, unknown> = {
    description: description ?? '',
    purchaseDate: purchaseDate ?? '',
    datePaid,
    amount: amount ?? 0,
    interest: creditCard ? interest : 0,
    accountId: account?.id ?? '',
    categoryId: cat?.id ?? '',
    paymentStatus: creditCard ? paymentStatus ?? 'Unpaid' : paymentStatus ?? 'Unpaid',
    paymentFrequency: creditCard ? paymentFrequency ?? null : null,
    periodCount: creditCard ? periodCount : null,
    paidPeriod: creditCard ? paidPeriod : null,
    isPasabuy: pasabuy,
    pasabuyer: pasabuy ? pasabuyer : null,
    pasabuyStatus: pasabuy ? pasabuyStatus : null,
    pasabuyDateOfPayment: pasabuy ? optDate(a.pasabuyDateOfPayment) ?? null : null,
    pasabuyPaidPeriod: pasabuy ? num(a.pasabuyPaidPeriod) ?? null : null,
    pasabuyAccountReceiverId: pasabuy
      ? findAccount(str(a.pasabuyAccountReceiverId) ?? str(a.pasabuyAccountReceiver))?.id ?? null
      : null,
    ccLinkPaymentReceiptId: creditCard ? str(a.ccLinkPaymentReceiptId) ?? null : null,
    _profile: { base: true, creditCard, pasabuy }
  }

  const gross = (amount ?? 0) + (creditCard ? interest : 0)
  const computedPreview = creditCard
    ? {
        grossPrice: gross,
        installmentAmount:
          paymentStatus === 'Installment' && periodCount && periodCount > 0
            ? Math.round((gross / periodCount) * 100) / 100
            : null
      }
    : pasabuy
      ? { pasabuyer, pasabuyStatus }
      : null

  const draft = putDraft({
    threadId: ctx.threadId,
    resource: 'expenses',
    action: 'create',
    kind: 'proposeCreateExpense',
    missingRequired: missing,
    warnings,
    payload,
    computedPreview,
    display: {
      title: description || 'New expense',
      amount: amount ?? null,
      currency: 'PHP',
      date: purchaseDate ?? null,
      from: account?.name ?? null,
      fromLabel: 'Account',
      to: cat?.name ?? null,
      toLabel: 'Category',
      note: creditCard
        ? `Credit card${paymentStatus ? ` · ${paymentStatus}` : ''}${interest ? ` · interest ₱${interest}` : ''}`
        : pasabuy
          ? `Pasabuy${pasabuyer ? ` · ${pasabuyer}` : ''}`
          : null
    },
    summary: `Create expense (${creditCard ? 'CC' : pasabuy ? 'Pasabuy' : 'base'}): ${description ?? '?'} · ₱${amount ?? '?'} · ${purchaseDate ?? '?'} · ${account?.name ?? '?'} · ${cat?.name ?? '?'}`
  })
  return draftResult(draft)
}

function proposeWorkflowIncome(
  ctx: WriteToolContext,
  kind: string,
  lockedSource: string | null,
  args: unknown,
  opts: {
    requireSource: boolean
    requireTransacted: boolean
    sourceMustBeCredit?: boolean
    sourceMustBeNonCredit?: boolean
    transactedMustBeNonCredit?: boolean
    allowEmptyAccount?: boolean
    defaultSavings?: boolean
  }
) {
  const a = asRecord(args)
  const missing: string[] = []
  const warnings: string[] = []

  const name = str(a.name) ?? str(a.title) ?? str(a.description)
  const date = optDate(a.date) ?? todayIso()
  const grossIncome = num(a.grossIncome) ?? num(a.amount)
  const capitalExpenditure = num(a.capitalExpenditure) ?? 0

  const source = findAccount(
    str(a.accountId) ??
      str(a.sourceAccountId) ??
      str(a.sourceAccount) ??
      str(a.ccAccountId) ??
      str(a.ccAccount) ??
      str(a.account)
  )
  const transacted = findAccount(
    str(a.transactedAccountId) ??
      str(a.transferAccountId) ??
      str(a.transferAccount) ??
      str(a.payerAccountId) ??
      str(a.payerAccount) ??
      str(a.destinationAccount)
  )

  let cat =
    lockedSource != null
      ? findIncomeCategoryBySource(lockedSource)
      : findIncomeCategory(str(a.categoryId) ?? str(a.categoryName) ?? str(a.category))

  if (opts.defaultSavings && !cat) {
    cat = findIncomeCategoryBySource('Savings')
  }

  if (!name) missing.push('Name')
  if (!date) missing.push('Date')
  if (grossIncome === undefined) missing.push('Amount')

  if (opts.requireSource) {
    if (!source) missing.push(opts.sourceMustBeCredit ? 'CC Account' : 'Source Account')
    else if (opts.sourceMustBeCredit && !isCreditLike(source.type)) {
      missing.push('CC Account (must be credit-like)')
    } else if (opts.sourceMustBeNonCredit && isCreditLike(source.type)) {
      missing.push('Source Account (non-credit only)')
    }
  } else if (!opts.allowEmptyAccount && !source) {
    missing.push('Account')
  } else if (source && opts.sourceMustBeNonCredit && isCreditLike(source.type)) {
    missing.push('Account (non-credit only)')
  }

  if (opts.requireTransacted) {
    if (!transacted) {
      missing.push(kind.includes('Cc') || kind.includes('CcPayment') ? 'Payer Account' : 'Transfer Account')
    } else if (opts.transactedMustBeNonCredit && isCreditLike(transacted.type)) {
      missing.push('Payer / Transfer Account (non-credit only)')
    }
  }

  if (!cat) missing.push(lockedSource ? `Category (${lockedSource})` : 'Category')

  const payload: Record<string, unknown> = {
    name: name ?? '',
    date: date ?? '',
    grossIncome: grossIncome ?? 0,
    capitalExpenditure,
    accountId: opts.allowEmptyAccount ? source?.id ?? null : source?.id ?? null,
    categoryId: cat?.id ?? '',
    isTransaction: true,
    transactedAccountId: transacted?.id ?? null,
    ccPaymentCoveredId: str(a.ccPaymentCoveredId) ?? null,
    notes: str(a.notes) ?? null
  }

  const WORKFLOW_TITLES: Record<string, string> = {
    proposeCreateTransfer: 'Transfer',
    proposeCreateCcPayment: 'Credit card payment',
    proposeCreateAlkansya: 'Alkansya (savings)',
    proposeCreateReceivable: 'Receivable'
  }

  const draft = putDraft({
    threadId: ctx.threadId,
    resource: 'incomes',
    action: 'create',
    kind,
    missingRequired: missing,
    warnings,
    payload,
    display: {
      title: name || WORKFLOW_TITLES[kind] || 'New record',
      amount: grossIncome ?? null,
      currency: 'PHP',
      date: date ?? null,
      from: source?.name ?? null,
      fromLabel: opts.sourceMustBeCredit ? 'Credit card' : 'From',
      to: transacted?.name ?? cat?.source ?? null,
      toLabel: transacted ? 'To' : 'Category',
      note: WORKFLOW_TITLES[kind] ?? null
    },
    summary: `${kind}: ${name ?? '?'} · ₱${grossIncome ?? '?'} · ${date ?? '?'} · ${source?.name ?? '—'} → ${transacted?.name ?? '—'}`
  })
  return draftResult(draft)
}

export function proposeCreateTransfer(args: unknown, ctx: WriteToolContext) {
  return proposeWorkflowIncome(ctx, 'proposeCreateTransfer', WORKFLOW_LOCKED_CATEGORIES.transfer, args, {
    requireSource: true,
    requireTransacted: true,
    sourceMustBeNonCredit: true,
    transactedMustBeNonCredit: true
  })
}

export function proposeCreateCcPayment(args: unknown, ctx: WriteToolContext) {
  return proposeWorkflowIncome(
    ctx,
    'proposeCreateCcPayment',
    WORKFLOW_LOCKED_CATEGORIES.ccPayment,
    args,
    {
      requireSource: true,
      requireTransacted: true,
      sourceMustBeCredit: true,
      transactedMustBeNonCredit: true
    }
  )
}

export function proposeCreateAlkansya(args: unknown, ctx: WriteToolContext) {
  return proposeWorkflowIncome(
    ctx,
    'proposeCreateAlkansya',
    WORKFLOW_LOCKED_CATEGORIES.alkansyaDefault,
    args,
    {
      requireSource: true,
      requireTransacted: false,
      sourceMustBeNonCredit: true,
      defaultSavings: true
    }
  )
}

export function proposeCreateReceivable(args: unknown, ctx: WriteToolContext) {
  return proposeWorkflowIncome(ctx, 'proposeCreateReceivable', null, args, {
    requireSource: false,
    requireTransacted: false,
    allowEmptyAccount: true
  })
}

export function proposeUpdateIncome(args: unknown, ctx: WriteToolContext) {
  const a = asRecord(args)
  const missing: string[] = []
  const id = str(a.id) ?? str(a.recordId)
  if (!id) missing.push('Income id')
  else {
    try {
      repo.getIncome(id)
    } catch {
      missing.push('Income id (not found)')
    }
  }

  const patch: Record<string, unknown> = {}
  if (str(a.name) ?? str(a.title)) patch.name = str(a.name) ?? str(a.title)
  if (optDate(a.date) || str(a.date)) patch.date = optDate(a.date) ?? str(a.date)
  if (num(a.grossIncome) !== undefined || num(a.amount) !== undefined) {
    patch.grossIncome = num(a.grossIncome) ?? num(a.amount)
  }
  if (num(a.capitalExpenditure) !== undefined) patch.capitalExpenditure = num(a.capitalExpenditure)
  const account = findAccount(str(a.accountId) ?? str(a.accountName))
  if (account) patch.accountId = account.id
  const cat = findIncomeCategory(str(a.categoryId) ?? str(a.categoryName))
  if (cat) patch.categoryId = cat.id
  if (str(a.notes) !== undefined) patch.notes = str(a.notes) ?? null

  if (Object.keys(patch).length === 0) missing.push('Update fields (what to change?)')

  const draft = putDraft({
    threadId: ctx.threadId,
    resource: 'incomes',
    action: 'update',
    kind: 'proposeUpdateIncome',
    missingRequired: missing,
    warnings: [],
    payload: { id, ...patch },
    targetIds: id ? [id] : [],
    display: {
      title: (patch.name as string) || 'Update income',
      amount: typeof patch.grossIncome === 'number' ? patch.grossIncome : null,
      currency: 'PHP',
      date: (patch.date as string) ?? null,
      from: categoryIncomeLabel(patch.categoryId as string | undefined),
      fromLabel: 'Category',
      to: accountLabel(patch.accountId as string | undefined),
      toLabel: 'Account',
      note: `Changing: ${Object.keys(patch).join(', ') || '—'}`
    },
    summary: `Update income ${id ?? '?'}: ${Object.keys(patch).join(', ') || '—'}`
  })
  return draftResult(draft)
}

export function proposeUpdateExpense(args: unknown, ctx: WriteToolContext) {
  const a = asRecord(args)
  const missing: string[] = []
  const id = str(a.id) ?? str(a.recordId)
  if (!id) missing.push('Expense id')
  else {
    try {
      repo.getExpense(id)
    } catch {
      missing.push('Expense id (not found)')
    }
  }

  const patch: Record<string, unknown> = {}
  if (str(a.description) ?? str(a.name)) patch.description = str(a.description) ?? str(a.name)
  if (optDate(a.purchaseDate) || optDate(a.date)) {
    patch.purchaseDate = optDate(a.purchaseDate) ?? optDate(a.date)
  }
  if (a.datePaid !== undefined) patch.datePaid = optDate(a.datePaid) ?? null
  if (num(a.amount) !== undefined) patch.amount = num(a.amount)
  if (num(a.interest) !== undefined) patch.interest = num(a.interest)
  const account = findAccount(str(a.accountId) ?? str(a.accountName))
  if (account) patch.accountId = account.id
  const cat = findExpenseCategory(str(a.categoryId) ?? str(a.categoryName))
  if (cat) patch.categoryId = cat.id
  if (str(a.paymentStatus)) patch.paymentStatus = str(a.paymentStatus)
  if (str(a.pasabuyer)) patch.pasabuyer = str(a.pasabuyer)
  if (str(a.pasabuyStatus)) patch.pasabuyStatus = str(a.pasabuyStatus)

  if (Object.keys(patch).length === 0) missing.push('Update fields (what to change?)')

  const draft = putDraft({
    threadId: ctx.threadId,
    resource: 'expenses',
    action: 'update',
    kind: 'proposeUpdateExpense',
    missingRequired: missing,
    warnings: [],
    payload: { id, ...patch },
    targetIds: id ? [id] : [],
    display: {
      title: (patch.description as string) || 'Update expense',
      amount: typeof patch.amount === 'number' ? patch.amount : null,
      currency: 'PHP',
      date: (patch.purchaseDate as string) ?? null,
      from: accountLabel(patch.accountId as string | undefined),
      fromLabel: 'Account',
      to: categoryExpenseLabel(patch.categoryId as string | undefined),
      toLabel: 'Category',
      note: `Changing: ${Object.keys(patch).join(', ') || '—'}`
    },
    summary: `Update expense ${id ?? '?'}: ${Object.keys(patch).join(', ') || '—'}`
  })
  return draftResult(draft)
}

function proposeMassUpdate(
  ctx: WriteToolContext,
  resource: 'incomes' | 'expenses',
  kind: string,
  args: unknown
) {
  const a = asRecord(args)
  const missing: string[] = []
  const idsRaw = Array.isArray(a.ids) ? a.ids : Array.isArray(a.targetIds) ? a.targetIds : []
  const ids = idsRaw.map((x) => String(x)).filter(Boolean)
  if (ids.length === 0) missing.push('Target ids')
  if (ids.length > MASS_EDIT_CAP) {
    missing.push(`Too many ids (max ${MASS_EDIT_CAP})`)
  }

  const patch = asRecord(a.patch ?? a.fields ?? a)
  delete patch.ids
  delete patch.targetIds
  delete patch.patch
  delete patch.fields
  delete patch.id

  // Normalize a few aliases
  if (resource === 'incomes') {
    if (patch.amount != null && patch.grossIncome == null) patch.grossIncome = patch.amount
    if (patch.date && typeof patch.date === 'string') {
      patch.date = optDate(patch.date) ?? patch.date
    }
  } else {
    if (patch.date && !patch.purchaseDate) {
      patch.purchaseDate = optDate(patch.date) ?? patch.date
    }
  }

  const cleanPatch: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) cleanPatch[k] = v
  }
  if (Object.keys(cleanPatch).length === 0) missing.push('Patch fields')

  const draft = putDraft({
    threadId: ctx.threadId,
    resource,
    action: 'update',
    kind,
    missingRequired: missing,
    warnings: ids.length > 10 ? [`Mass update of ${ids.length} rows — review carefully.`] : [],
    payload: cleanPatch,
    targetIds: ids.slice(0, MASS_EDIT_CAP),
    summary: `Mass update ${ids.length} ${resource}: ${Object.keys(cleanPatch).join(', ') || '—'}`
  })
  return draftResult(draft)
}

export function proposeMassUpdateIncomes(args: unknown, ctx: WriteToolContext) {
  return proposeMassUpdate(ctx, 'incomes', 'proposeMassUpdateIncomes', args)
}

export function proposeMassUpdateExpenses(args: unknown, ctx: WriteToolContext) {
  return proposeMassUpdate(ctx, 'expenses', 'proposeMassUpdateExpenses', args)
}

export function toCreateIncomeInput(payload: Record<string, unknown>): CreateIncomeInput {
  return {
    name: String(payload.name ?? ''),
    date: String(payload.date ?? ''),
    grossIncome: Number(payload.grossIncome ?? 0),
    capitalExpenditure: Number(payload.capitalExpenditure ?? 0),
    accountId: (payload.accountId as string | null | undefined) ?? null,
    categoryId: String(payload.categoryId ?? ''),
    notes: (payload.notes as string | null | undefined) ?? null,
    isTransaction: payload.isTransaction === true,
    transactedAccountId: (payload.transactedAccountId as string | null | undefined) ?? null,
    ccPaymentCoveredId: (payload.ccPaymentCoveredId as string | null | undefined) ?? null
  }
}

export function toCreateExpenseInput(payload: Record<string, unknown>): CreateExpenseInput {
  return {
    description: String(payload.description ?? ''),
    purchaseDate: String(payload.purchaseDate ?? ''),
    datePaid: (payload.datePaid as string | null | undefined) ?? null,
    amount: Number(payload.amount ?? 0),
    interest: Number(payload.interest ?? 0),
    accountId: String(payload.accountId ?? ''),
    categoryId: String(payload.categoryId ?? ''),
    paymentStatus: (payload.paymentStatus as PaymentStatus | undefined) ?? 'Unpaid',
    paymentFrequency: (payload.paymentFrequency as PaymentFrequency | null | undefined) ?? null,
    periodCount: (payload.periodCount as number | null | undefined) ?? null,
    paidPeriod: (payload.paidPeriod as number | null | undefined) ?? null,
    isPasabuy: payload.isPasabuy === true,
    pasabuyer: (payload.pasabuyer as string | null | undefined) ?? null,
    pasabuyStatus: (payload.pasabuyStatus as PasabuyStatus | null | undefined) ?? null,
    pasabuyDateOfPayment: (payload.pasabuyDateOfPayment as string | null | undefined) ?? null,
    pasabuyPaidPeriod: (payload.pasabuyPaidPeriod as number | null | undefined) ?? null,
    pasabuyAccountReceiverId:
      (payload.pasabuyAccountReceiverId as string | null | undefined) ?? null,
    ccLinkPaymentReceiptId: (payload.ccLinkPaymentReceiptId as string | null | undefined) ?? null
  }
}

export function toUpdateIncomePatch(payload: Record<string, unknown>): UpdateIncomeInput {
  const { id: _id, ...rest } = payload
  return rest as UpdateIncomeInput
}

export function toUpdateExpensePatch(payload: Record<string, unknown>): UpdateExpenseInput {
  const { id: _id, ...rest } = payload
  return rest as UpdateExpenseInput
}

export function formatDraftForHuman(draft: ChatDraftDto): string {
  const lines = [
    draft.summary,
    draft.missingRequired.length
      ? `Missing: ${draft.missingRequired.join(', ')}`
      : 'Ready to Approve.',
    `Accounts hint: ${accountLabel(draft.payload.accountId as string)} / ${accountLabel(draft.payload.transactedAccountId as string)}`,
    draft.resource === 'incomes'
      ? `Category: ${categoryIncomeLabel(draft.payload.categoryId as string)}`
      : `Category: ${categoryExpenseLabel(draft.payload.categoryId as string)}`
  ]
  return lines.join('\n')
}
