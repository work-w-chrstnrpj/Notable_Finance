// Input validation — lives in main because the renderer is untrusted-by-design
// (wiki/desktop/desktop-architecture.md). Mirrors the required-field rules the web
// service enforces before writing to Notion.
import type {
  CreateExpenseInput,
  CreateIncomeInput,
  CreateSchedulerInput
} from '../../shared/finance.types'

export class ValidationError extends Error {
  readonly code = 'E_VALIDATION'
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ISO_MONTH = /^\d{4}-\d{2}$/

export function assertIsoDate(value: unknown, field: string): void {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) {
    throw new ValidationError(`${field} must be an ISO date (YYYY-MM-DD)`)
  }
}

export function assertOptionalIsoDate(value: unknown, field: string): void {
  if (value === undefined || value === null) return
  assertIsoDate(value, field)
}

export function assertMonth(value: unknown, field = 'month'): void {
  if (typeof value !== 'string' || !ISO_MONTH.test(value)) {
    throw new ValidationError(`${field} must be a month (YYYY-MM)`)
  }
}

export function assertFiniteNumber(value: unknown, field: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError(`${field} must be a finite number`)
  }
}

export function assertOptionalFiniteNumber(value: unknown, field: string): void {
  if (value === undefined || value === null) return
  assertFiniteNumber(value, field)
}

export function assertNonEmptyString(value: unknown, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${field} is required`)
  }
}

export function validateCreateIncome(input: CreateIncomeInput): void {
  assertNonEmptyString(input.name, 'name')
  assertIsoDate(input.date, 'date')
  assertFiniteNumber(input.grossIncome, 'grossIncome')
  assertOptionalFiniteNumber(input.capitalExpenditure, 'capitalExpenditure')
  assertNonEmptyString(input.categoryId, 'categoryId')
}

export function validateUpdateIncome(patch: Record<string, unknown>): void {
  if ('name' in patch) assertNonEmptyString(patch.name, 'name')
  if ('date' in patch) assertIsoDate(patch.date, 'date')
  if ('grossIncome' in patch) assertFiniteNumber(patch.grossIncome, 'grossIncome')
  if ('capitalExpenditure' in patch)
    assertOptionalFiniteNumber(patch.capitalExpenditure, 'capitalExpenditure')
}

export function validateCreateExpense(input: CreateExpenseInput): void {
  assertNonEmptyString(input.description, 'description')
  assertIsoDate(input.purchaseDate, 'purchaseDate')
  assertOptionalIsoDate(input.datePaid ?? null, 'datePaid')
  assertFiniteNumber(input.amount, 'amount')
  assertOptionalFiniteNumber(input.interest, 'interest')
  assertNonEmptyString(input.accountId, 'accountId')
  assertNonEmptyString(input.categoryId, 'categoryId')
}

export function validateUpdateExpense(patch: Record<string, unknown>): void {
  if ('description' in patch) assertNonEmptyString(patch.description, 'description')
  if ('purchaseDate' in patch) assertIsoDate(patch.purchaseDate, 'purchaseDate')
  if ('datePaid' in patch) assertOptionalIsoDate(patch.datePaid, 'datePaid')
  if ('amount' in patch) assertFiniteNumber(patch.amount, 'amount')
  if ('interest' in patch) assertOptionalFiniteNumber(patch.interest, 'interest')
}

export function validateCreateScheduler(input: CreateSchedulerInput): void {
  assertNonEmptyString(input.title, 'title')
  assertFiniteNumber(input.amount, 'amount')
  assertOptionalIsoDate(input.nextRunDate ?? null, 'nextRunDate')
}

export function validateUpdateScheduler(patch: Record<string, unknown>): void {
  if ('title' in patch) assertNonEmptyString(patch.title, 'title')
  if ('amount' in patch) assertFiniteNumber(patch.amount, 'amount')
  if ('nextRunDate' in patch) assertOptionalIsoDate(patch.nextRunDate, 'nextRunDate')
}
