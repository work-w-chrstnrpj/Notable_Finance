// Local derivations — the desktop's SQLite-truth analogue of the web app's reporting.
//
// The web app READS Current Balance / Available Limit / spending from Notion formulas.
// The desktop app is local-first, so it must COMPUTE them from the raw inputs. The
// reduce logic mirrors notable-finance-web/service/src/notion/notion-reporting.service.ts;
// the account-balance math implements the formula table in
// wiki/desktop/local-data-schema.md ("Derived values are computed, not stored").
//
// All functions are pure (records in, numbers out) so they are unit-testable and can run
// offline on every edit. Notion recomputes its own copies via its formulas after a push,
// so the two never conflict on computed fields.
import type {
  AccountDto,
  DashboardSummary,
  ExpenseCategoryDto,
  ExpenseRecordDto,
  IncomeCategoryDto,
  IncomeRecordDto,
  MonthlyMonitoringDto
} from '../../shared/finance.types'
import { filterByMonth, isCreditLike } from './resource-utils'

/** Round to cents the same way the web reporting service does. */
export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100

/** Net income for a single income record: gross minus capital expenditure. */
export const netIncome = (income: Pick<IncomeRecordDto, 'grossIncome' | 'capitalExpenditure'>): number =>
  income.grossIncome - income.capitalExpenditure

const notDeleted = <T extends { deleted?: boolean }>(record: T): boolean => !record.deleted

export interface AccountBalance {
  currentBalance: number
  /** Only meaningful for credit-like accounts; null otherwise. */
  availableLimit: number | null
}

/**
 * Current balance (and available limit) for one account, from all-time records.
 *
 * - Inflow to an account  = Σ net income of incomes deposited to it.
 * - Outflow from an account = Σ (amount + interest) of expenses charged to it.
 * - Non-credit:  balance = starting_balance + inflow − outflow
 * - Credit-like: outstanding = charges + interest − payments;
 *                balance = −outstanding (signed per app convention),
 *                availableLimit = credit_limit − outstanding.
 */
export function computeAccountBalance(
  account: Pick<AccountDto, 'id' | 'type' | 'startingBalance' | 'creditLimit'>,
  incomes: IncomeRecordDto[],
  expenses: ExpenseRecordDto[]
): AccountBalance {
  const mine = <T extends { accountId: string | null; deleted?: boolean }>(records: T[]): T[] =>
    records.filter(notDeleted).filter((r) => r.accountId === account.id)

  const payments = roundMoney(mine(incomes).reduce((sum, i) => sum + netIncome(i), 0))
  const charges = roundMoney(mine(expenses).reduce((sum, e) => sum + e.amount, 0))
  const interest = roundMoney(mine(expenses).reduce((sum, e) => sum + e.interest, 0))

  if (isCreditLike(account.type)) {
    const outstanding = roundMoney(charges + interest - payments)
    return {
      currentBalance: roundMoney(-outstanding),
      availableLimit:
        account.creditLimit === null ? null : roundMoney(account.creditLimit - outstanding)
    }
  }

  return {
    currentBalance: roundMoney(account.startingBalance + payments - charges - interest),
    availableLimit: null
  }
}

/** Map of accountId → derived balance, for a set of accounts against all-time records. */
export function computeAccountBalances(
  accounts: AccountDto[],
  incomes: IncomeRecordDto[],
  expenses: ExpenseRecordDto[]
): Map<string, AccountBalance> {
  return new Map(accounts.map((a) => [a.id, computeAccountBalance(a, incomes, expenses)]))
}

/** Category spending for a month = Σ (amount + interest) of that category's expenses. */
export function categorySpending(categoryId: string, monthExpenses: ExpenseRecordDto[]): number {
  return roundMoney(
    monthExpenses
      .filter((e) => e.categoryId === categoryId)
      .reduce((sum, e) => sum + e.amount + e.interest, 0)
  )
}

export interface FinanceSnapshot {
  incomes: IncomeRecordDto[]
  expenses: ExpenseRecordDto[]
  accounts: AccountDto[]
}

/**
 * Dashboard summary for a month. Totals are month-scoped; totalCashFlow is the all-time
 * balance across active non-credit accounts (mirrors the web dashboardSummary).
 */
export function dashboardSummary(month: string, snap: FinanceSnapshot): DashboardSummary {
  const monthIncomes = filterByMonth(snap.incomes.filter(notDeleted), 'date', month)
  const monthExpenses = filterByMonth(snap.expenses.filter(notDeleted), 'purchaseDate', month)

  const totalIncome = roundMoney(monthIncomes.reduce((sum, i) => sum + netIncome(i), 0))
  const totalExpense = roundMoney(
    monthExpenses.reduce((sum, e) => sum + e.amount + e.interest, 0)
  )

  const balances = computeAccountBalances(snap.accounts, snap.incomes, snap.expenses)
  const totalCashFlow = roundMoney(
    snap.accounts
      .filter((a) => !a.inactive && !isCreditLike(a.type))
      .reduce((sum, a) => sum + (balances.get(a.id)?.currentBalance ?? 0), 0)
  )

  return {
    month,
    totalIncome,
    totalExpense,
    grossMargin: roundMoney(totalIncome - totalExpense),
    totalCashFlow,
    activeAccountCount: snap.accounts.filter((a) => !a.inactive).length,
    pendingExpenseCount: monthExpenses.filter((e) => e.datePaid === null).length
  }
}

export interface MonitoringInput {
  incomes: IncomeRecordDto[]
  expenses: ExpenseRecordDto[]
  expenseCategories: ExpenseCategoryDto[]
  incomeCategories: IncomeCategoryDto[]
}

/** Monthly monitoring for a month — mirrors the web monthlyMonitoring reduce logic. */
export function monthlyMonitoring(month: string, input: MonitoringInput): MonthlyMonitoringDto {
  const monthIncomes = filterByMonth(input.incomes.filter(notDeleted), 'date', month)
  const monthExpenses = filterByMonth(input.expenses.filter(notDeleted), 'purchaseDate', month)

  const monthlyGrossIncome = roundMoney(monthIncomes.reduce((sum, i) => sum + i.grossIncome, 0))
  const monthlyIncome = roundMoney(monthIncomes.reduce((sum, i) => sum + netIncome(i), 0))
  const monthlyExpense = roundMoney(
    monthExpenses.reduce((sum, e) => sum + e.amount + e.interest, 0)
  )

  const expenseCategories = input.expenseCategories.map((category) => {
    const spending = categorySpending(category.id, monthExpenses)
    return {
      id: category.id,
      name: category.name,
      budget: category.monthlyBudget,
      spending,
      remaining: roundMoney(category.monthlyBudget - spending),
      totalOverview: monthlyExpense > 0 ? roundMoney((spending / monthlyExpense) * 100) : 0
    }
  })

  return {
    id: `monitoring-${month}`,
    month,
    monthlyIncome,
    monthlyGrossIncome,
    monthlyExpense,
    grossMargin: roundMoney(monthlyIncome - monthlyExpense),
    forNeeds: roundMoney(monthlyIncome * 0.5),
    forWants: roundMoney(monthlyIncome * 0.3),
    forSavings: roundMoney(monthlyIncome * 0.2),
    incomeCategories: input.incomeCategories.map((category) => ({
      id: category.id,
      source: category.source,
      total: roundMoney(
        monthIncomes
          .filter((i) => i.categoryId === category.id)
          .reduce((sum, i) => sum + netIncome(i), 0)
      )
    })),
    expenseCategories
  }
}
