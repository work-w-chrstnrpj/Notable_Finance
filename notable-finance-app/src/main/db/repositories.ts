// Local-first CRUD repositories (Phase 1.2). Every write is instant (SQLite is the
// working source of truth), marks the record sync_state='dirty', and journals into
// mutation_queue so offline edits replay in order (wiki/desktop/sync-and-conflict-design.md).
// Soft delete follows the shared rule: rewrite the title, clear amounts, set deleted=1.
import { randomUUID } from 'node:crypto'
import { getSqlite } from './index'
import {
  mapAccount,
  mapExpense,
  mapExpenseCategory,
  mapIncome,
  mapIncomeCategory,
  mapScheduler,
  type AccountRow,
  type ExpenseCategoryRow,
  type ExpenseRow,
  type IncomeCategoryRow,
  type IncomeRow,
  type SchedulerRow
} from './mappers'
import { computeAccountBalances } from '../domain/derivations'
import { advanceDate } from '../domain/schedule'
import { isCreditLike } from '../domain/resource-utils'
import { filterExpensesByQuery, filterIncomeByQuery } from '../domain/query-filters'
import {
  INCOME_VIEW_FIXED_CATEGORY,
  type AccountDto,
  type CreateExpenseInput,
  type CreateIncomeInput,
  type CreateSchedulerInput,
  type ExpenseCategoryOption,
  type ExpenseRecordDto,
  type IncomeCategoryOption,
  type IncomeListParams,
  type IncomeRecordDto,
  type ExpenseListParams,
  type SchedulerRecordDto,
  type UpdateExpenseInput,
  type UpdateIncomeInput,
  type UpdateSchedulerInput
} from '../../shared/finance.types'
import {
  validateCreateExpense,
  validateCreateIncome,
  validateCreateScheduler,
  validateUpdateExpense,
  validateUpdateIncome,
  validateUpdateScheduler,
  ValidationError
} from '../domain/validation'

const now = (): number => Date.now()

function journal(resource: string, action: string, recordId: string, payload: unknown): void {
  getSqlite()
    .prepare(
      `INSERT INTO mutation_queue (id, resource, action, record_id, payload, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(randomUUID(), resource, action, recordId, JSON.stringify(payload ?? null), now())
}

// ── reference data (read-only cache) ────────────────────────────────────────

export function listIncomeCategories(): IncomeCategoryOption[] {
  const rows = getSqlite()
    .prepare('SELECT id, source, auxiliary FROM income_categories ORDER BY source')
    .all() as IncomeCategoryRow[]
  return rows.map(mapIncomeCategory)
}

export function listExpenseCategories(): ExpenseCategoryOption[] {
  const rows = getSqlite()
    .prepare('SELECT id, name, monthly_budget, auxiliary FROM expense_categories ORDER BY name')
    .all() as ExpenseCategoryRow[]
  return rows.map(mapExpenseCategory)
}

function findIncomeCategoryIdBySource(source: string): string | undefined {
  const row = getSqlite()
    .prepare('SELECT id FROM income_categories WHERE source = ? LIMIT 1')
    .get(source) as { id: string } | undefined
  return row?.id
}

function auxiliaryIncomeCategoryIds(): Set<string> {
  const rows = getSqlite()
    .prepare('SELECT id FROM income_categories WHERE auxiliary = 1')
    .all() as Array<{ id: string }>
  return new Set(rows.map((r) => r.id))
}

// ── incomes (and income-backed views) ───────────────────────────────────────

const INCOME_COLS = `id, title, date, gross_income, capital_expenditure, account_id,
  category_id, notes, is_transaction, transacted_account_id, cc_payment_covered_id, deleted, sync_state`

function allIncomeRows(includeDeleted = false): IncomeRow[] {
  const where = includeDeleted ? '' : 'WHERE deleted = 0'
  return getSqlite()
    .prepare(`SELECT ${INCOME_COLS} FROM incomes ${where} ORDER BY date DESC, created_at DESC`)
    .all() as IncomeRow[]
}

/**
 * List incomes for a view, applying the web app's filterIncomeBacked semantics:
 * fixed category for workflow views, no-account for receivables, auxiliary-category
 * exclusion for the plain income view, and range/month date scoping.
 */
export function listIncomes(params: IncomeListParams = {}): IncomeRecordDto[] {
  const view = params.view ?? 'incomes'
  let records = allIncomeRows(params.includeDeleted).map(mapIncome)

  const fixedCategory = INCOME_VIEW_FIXED_CATEGORY[view]
  if (fixedCategory !== undefined) {
    const categoryId = findIncomeCategoryIdBySource(fixedCategory)
    records = categoryId ? records.filter((r) => r.categoryId === categoryId) : []
  }
  if (view === 'receivables') {
    records = records.filter((r) => !r.accountId)
  }
  if (view === 'incomes') {
    const auxiliary = auxiliaryIncomeCategoryIds()
    records = records.filter((r) => !auxiliary.has(r.categoryId))
  }

  records = filterIncomeByQuery(records, params)
  if (params.accountId) records = records.filter((r) => r.accountId === params.accountId)
  if (params.categoryId) records = records.filter((r) => r.categoryId === params.categoryId)
  return records
}

export function getIncome(id: string): IncomeRecordDto {
  const row = getSqlite()
    .prepare(`SELECT ${INCOME_COLS} FROM incomes WHERE id = ?`)
    .get(id) as IncomeRow | undefined
  if (!row) throw new ValidationError(`income ${id} not found`)
  return mapIncome(row)
}

export function createIncome(input: CreateIncomeInput): IncomeRecordDto {
  validateCreateIncome(input)
  const id = randomUUID()
  const t = now()
  getSqlite()
    .prepare(
      `INSERT INTO incomes (id, notion_page_id, base_snapshot, sync_state, local_updated_at,
         notion_last_edited_at, deleted, created_at, title, gross_income, capital_expenditure,
         account_id, category_id, date, notes, is_transaction, transacted_account_id, cc_payment_covered_id)
       VALUES (?, NULL, NULL, 'dirty', ?, NULL, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id, t, t,
      input.name.trim(),
      input.grossIncome,
      input.capitalExpenditure ?? 0,
      input.accountId ?? null,
      input.categoryId,
      input.date,
      input.notes ?? null,
      input.isTransaction ? 1 : 0,
      input.transactedAccountId ?? null,
      input.ccPaymentCoveredId ?? null
    )
  journal('incomes', 'create', id, input)
  return getIncome(id)
}

const INCOME_PATCH_COLS: Record<string, string> = {
  name: 'title',
  date: 'date',
  grossIncome: 'gross_income',
  capitalExpenditure: 'capital_expenditure',
  accountId: 'account_id',
  categoryId: 'category_id',
  notes: 'notes',
  transactedAccountId: 'transacted_account_id',
  ccPaymentCoveredId: 'cc_payment_covered_id'
}

export function updateIncome(id: string, patch: UpdateIncomeInput): IncomeRecordDto {
  validateUpdateIncome(patch as Record<string, unknown>)
  getIncome(id) // existence check
  applyPatch('incomes', id, patch as Record<string, unknown>, INCOME_PATCH_COLS)
  journal('incomes', 'update', id, patch)
  return getIncome(id)
}

export function softDeleteIncome(id: string): IncomeRecordDto {
  const current = getIncome(id)
  const t = now()
  getSqlite()
    .prepare(
      `UPDATE incomes SET title = ?, gross_income = 0, capital_expenditure = 0,
         deleted = 1, sync_state = 'dirty', local_updated_at = ? WHERE id = ?`
    )
    .run(`[Deleted: ${current.name}]`, t, id)
  journal('incomes', 'delete', id, { title: current.name })
  return getIncome(id)
}

// ── expenses ────────────────────────────────────────────────────────────────

const EXPENSE_COLS = `id, title, purchase_date, date_paid, amount, interest, account_id,
  category_id, payment_status, payment_frequency, period_count, paid_period, is_pasabuy,
  pasabuyer, pasabuy_status, pasabuy_date_of_payment, pasabuy_paid_period,
  pasabuy_account_receiver_id, cc_link_payment_receipt_id, deleted, sync_state`

export function listExpenses(params: ExpenseListParams = {}): ExpenseRecordDto[] {
  const where = params.includeDeleted ? '' : 'WHERE deleted = 0'
  const records = (
    getSqlite()
      .prepare(`SELECT ${EXPENSE_COLS} FROM expenses ${where} ORDER BY purchase_date DESC, created_at DESC`)
      .all() as ExpenseRow[]
  ).map(mapExpense)

  // View-mode + range + secondary filters, copied from the web query service so
  // desktop list outputs match the web app view-for-view.
  const creditAccountIds = new Set(
    (
      getSqlite()
        .prepare('SELECT id, account_type FROM accounts')
        .all() as Array<{ id: string; account_type: string }>
    )
      .filter((a) => isCreditLike(a.account_type))
      .map((a) => a.id)
  )
  const pasabuyCategories = getSqlite()
    .prepare("SELECT id, name FROM expense_categories WHERE name LIKE '%Pasabuy%'")
    .all() as Array<{ id: string; name: string }>
  return filterExpensesByQuery(records, params, {
    creditAccountIds,
    pasabuyCategoryIds: new Set(pasabuyCategories.map((c) => c.id)),
    pasabuyCategoryId: pasabuyCategories.find((c) => c.name === 'Pasabuy')?.id
  })
}

export function getExpense(id: string): ExpenseRecordDto {
  const row = getSqlite()
    .prepare(`SELECT ${EXPENSE_COLS} FROM expenses WHERE id = ?`)
    .get(id) as ExpenseRow | undefined
  if (!row) throw new ValidationError(`expense ${id} not found`)
  return mapExpense(row)
}

export function createExpense(input: CreateExpenseInput): ExpenseRecordDto {
  validateCreateExpense(input)
  const id = randomUUID()
  const t = now()
  getSqlite()
    .prepare(
      `INSERT INTO expenses (id, notion_page_id, base_snapshot, sync_state, local_updated_at,
         notion_last_edited_at, deleted, created_at, title, amount, interest, account_id,
         category_id, purchase_date, date_paid, payment_status, payment_frequency, period_count,
         paid_period, is_pasabuy, pasabuyer, pasabuy_status, pasabuy_date_of_payment,
         pasabuy_paid_period, pasabuy_account_receiver_id, cc_link_payment_receipt_id)
       VALUES (?, NULL, NULL, 'dirty', ?, NULL, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id, t, t,
      input.description.trim(),
      input.amount,
      input.interest ?? 0,
      input.accountId,
      input.categoryId,
      input.purchaseDate,
      input.datePaid ?? null,
      input.paymentStatus ?? 'Unpaid',
      input.paymentFrequency ?? null,
      input.periodCount ?? null,
      input.paidPeriod ?? null,
      input.isPasabuy ? 1 : 0,
      input.pasabuyer ?? null,
      input.pasabuyStatus ?? null,
      input.pasabuyDateOfPayment ?? null,
      input.pasabuyPaidPeriod ?? null,
      input.pasabuyAccountReceiverId ?? null,
      input.ccLinkPaymentReceiptId ?? null
    )
  journal('expenses', 'create', id, input)
  return getExpense(id)
}

const EXPENSE_PATCH_COLS: Record<string, string> = {
  description: 'title',
  purchaseDate: 'purchase_date',
  datePaid: 'date_paid',
  amount: 'amount',
  interest: 'interest',
  accountId: 'account_id',
  categoryId: 'category_id',
  paymentStatus: 'payment_status',
  paymentFrequency: 'payment_frequency',
  periodCount: 'period_count',
  paidPeriod: 'paid_period',
  isPasabuy: 'is_pasabuy',
  pasabuyer: 'pasabuyer',
  pasabuyStatus: 'pasabuy_status',
  pasabuyDateOfPayment: 'pasabuy_date_of_payment',
  pasabuyPaidPeriod: 'pasabuy_paid_period',
  pasabuyAccountReceiverId: 'pasabuy_account_receiver_id',
  ccLinkPaymentReceiptId: 'cc_link_payment_receipt_id'
}

export function updateExpense(id: string, patch: UpdateExpenseInput): ExpenseRecordDto {
  validateUpdateExpense(patch as Record<string, unknown>)
  getExpense(id)
  applyPatch('expenses', id, patch as Record<string, unknown>, EXPENSE_PATCH_COLS)
  journal('expenses', 'update', id, patch)
  return getExpense(id)
}

export function softDeleteExpense(id: string): ExpenseRecordDto {
  const current = getExpense(id)
  const t = now()
  getSqlite()
    .prepare(
      `UPDATE expenses SET title = ?, amount = 0, interest = 0,
         deleted = 1, sync_state = 'dirty', local_updated_at = ? WHERE id = ?`
    )
    .run(`[Deleted: ${current.description}]`, t, id)
  journal('expenses', 'delete', id, { title: current.description })
  return getExpense(id)
}

// ── expense scheduler ───────────────────────────────────────────────────────

const SCHEDULER_COLS = `id, title, amount, account_id, category_id, frequency, next_run_date, active, deleted`

export function listScheduler(): SchedulerRecordDto[] {
  return (
    getSqlite()
      .prepare(`SELECT ${SCHEDULER_COLS} FROM expense_scheduler WHERE deleted = 0 ORDER BY next_run_date`)
      .all() as SchedulerRow[]
  ).map(mapScheduler)
}

export function getScheduler(id: string): SchedulerRecordDto {
  const row = getSqlite()
    .prepare(`SELECT ${SCHEDULER_COLS} FROM expense_scheduler WHERE id = ?`)
    .get(id) as SchedulerRow | undefined
  if (!row) throw new ValidationError(`scheduler ${id} not found`)
  return mapScheduler(row)
}

export function createScheduler(input: CreateSchedulerInput): SchedulerRecordDto {
  validateCreateScheduler(input)
  const id = randomUUID()
  const t = now()
  getSqlite()
    .prepare(
      `INSERT INTO expense_scheduler (id, notion_page_id, base_snapshot, sync_state,
         local_updated_at, notion_last_edited_at, deleted, created_at, title, amount,
         account_id, category_id, frequency, next_run_date, active)
       VALUES (?, NULL, NULL, 'dirty', ?, NULL, 0, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id, t, t,
      input.title.trim(),
      input.amount,
      input.accountId ?? null,
      input.categoryId ?? null,
      input.frequency ?? null,
      input.nextRunDate ?? null,
      input.active === false ? 0 : 1
    )
  journal('expenseScheduler', 'create', id, input)
  return getScheduler(id)
}

const SCHEDULER_PATCH_COLS: Record<string, string> = {
  title: 'title',
  amount: 'amount',
  accountId: 'account_id',
  categoryId: 'category_id',
  frequency: 'frequency',
  nextRunDate: 'next_run_date',
  active: 'active'
}

export function updateScheduler(id: string, patch: UpdateSchedulerInput): SchedulerRecordDto {
  validateUpdateScheduler(patch as Record<string, unknown>)
  getScheduler(id)
  applyPatch('expense_scheduler', id, patch as Record<string, unknown>, SCHEDULER_PATCH_COLS)
  journal('expenseScheduler', 'update', id, patch)
  return getScheduler(id)
}

export function softDeleteScheduler(id: string): SchedulerRecordDto {
  const current = getScheduler(id)
  const t = now()
  getSqlite()
    .prepare(
      `UPDATE expense_scheduler SET title = ?, amount = 0, active = 0,
         deleted = 1, sync_state = 'dirty', local_updated_at = ? WHERE id = ?`
    )
    .run(`[Deleted: ${current.title}]`, t, id)
  journal('expenseScheduler', 'delete', id, { title: current.title })
  return getScheduler(id)
}

/** Materialize a scheduled expense into a real (unpaid) expense and advance next_run_date. */
export function generateFromScheduler(id: string): ExpenseRecordDto {
  const def = getScheduler(id)
  if (!def.accountId || !def.categoryId) {
    throw new ValidationError('scheduler needs an account and category before generating')
  }
  const purchaseDate = def.nextRunDate ?? new Date().toISOString().slice(0, 10)
  const expense = createExpense({
    description: def.title,
    purchaseDate,
    datePaid: null,
    amount: def.amount,
    accountId: def.accountId,
    categoryId: def.categoryId,
    paymentStatus: 'Unpaid'
  })
  updateScheduler(id, { nextRunDate: advanceDate(purchaseDate, def.frequency) })
  return expense
}

// ── accounts (with derived balances, Phase 1.3) ─────────────────────────────

export function listAccounts(includeInactive = false): AccountDto[] {
  const where = includeInactive ? '' : 'WHERE inactive = 0'
  const rows = getSqlite()
    .prepare(
      `SELECT id, account_name, account_type, starting_balance, credit_limit, inactive,
         billing_day, due_day, annual_fee, credit_points
       FROM accounts ${where} ORDER BY account_name`
    )
    .all() as AccountRow[]

  // Balances derive from ALL-TIME records (soft-deleted excluded inside derivations).
  const incomes = allIncomeRows().map(mapIncome)
  const expenses = listExpenses()
  const partial = rows.map((r) => mapAccount(r, { currentBalance: 0, availableLimit: null }))
  const balances = computeAccountBalances(partial, incomes, expenses)
  return partial.map((a) => {
    const b = balances.get(a.id)
    return b ? { ...a, currentBalance: b.currentBalance, availableLimit: b.availableLimit } : a
  })
}

/** All non-deleted incomes/expenses as DTOs — the snapshot the report services reduce over. */
export function financeSnapshot(): {
  incomes: IncomeRecordDto[]
  expenses: ExpenseRecordDto[]
  accounts: AccountDto[]
} {
  return { incomes: allIncomeRows().map(mapIncome), expenses: listExpenses(), accounts: listAccounts(true) }
}

// ── shared patch helper ─────────────────────────────────────────────────────

function applyPatch(
  table: string,
  id: string,
  patch: Record<string, unknown>,
  columnMap: Record<string, string>
): void {
  const sets: string[] = []
  const values: unknown[] = []
  for (const [key, column] of Object.entries(columnMap)) {
    if (key in patch) {
      sets.push(`${column} = ?`)
      const v = patch[key]
      values.push(typeof v === 'boolean' ? (v ? 1 : 0) : (v ?? null))
    }
  }
  if (sets.length === 0) return
  sets.push(`sync_state = 'dirty'`, 'local_updated_at = ?')
  values.push(now(), id)
  getSqlite().prepare(`UPDATE ${table} SET ${sets.join(', ')} WHERE id = ?`).run(...values)
}
