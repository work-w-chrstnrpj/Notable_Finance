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
import { pasabuyReceivedAmount, round2, transactionAmount } from './notion-formulas'

/** Round to cents the same way the web reporting service does. */
export const roundMoney = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100) / 100

/** Net income for a single income record: gross minus capital expenditure (display insight only). */
export const netIncome = (income: Pick<IncomeRecordDto, 'grossIncome' | 'capitalExpenditure'>): number =>
  income.grossIncome - income.capitalExpenditure

const notDeleted = <T extends { deleted?: boolean }>(record: T): boolean => !record.deleted

export interface AccountBalance {
  currentBalance: number
  /** Only meaningful for credit-like accounts; null otherwise. */
  availableLimit: number | null
  /** Total Cash Inflow: Σ gross income linked to this account (= "Total Payment Made" for credit). */
  totalIncomes: number
  /** Total Cash Outflow: Σ gross expense (amount + interest) charged to this account (= "Total Purchase Made"). */
  totalExpenses: number
}

/** Category-name lookups needed by the Transaction Amount / Pasabuy Received formulas. */
export interface BalanceContext {
  incomeCategoryName: (id: string) => string | undefined
  expenseCategoryName: (id: string) => string | undefined
}

const EMPTY_CONTEXT: BalanceContext = {
  incomeCategoryName: () => undefined,
  expenseCategoryName: () => undefined
}

/**
 * Current Balance for one account — an exact local port of the Notion "Current Balance"
 * formula (see domain/notion-formulas.ts). ONE formula for every account type, no Starting
 * Balance, with each term aggregated by the RELATION Notion uses:
 *
 *   CurrentBalance =  ΣGrossIncome        [income.accountId = acc]              (Total Incomes)
 *                   − Σ(Amount + Interest)[expense.accountId = acc]             (Total Expenses + Credit Interest)
 *                   + ΣPasabuyReceived    [expense.pasabuyAccountReceiverId=acc](Total Pasabuy)
 *                   + ΣTransactionAmount  [income.transactedAccountId = acc]    (Total CC, Debt & Transfer)
 *
 *   AvailableLimit = creditLimit>0 ? min(creditLimit + currentBalance, creditLimit) : null
 */
export function computeAccountBalance(
  account: Pick<AccountDto, 'id' | 'type' | 'creditLimit'>,
  incomes: IncomeRecordDto[],
  expenses: ExpenseRecordDto[],
  ctx: BalanceContext = EMPTY_CONTEXT
): AccountBalance {
  const liveIncomes = incomes.filter(notDeleted)
  const liveExpenses = expenses.filter(notDeleted)

  // Total Incomes — gross income linked via the Accounts relation.
  const totalIncomes = round2(
    liveIncomes.filter((i) => i.accountId === account.id).reduce((s, i) => s + i.grossIncome, 0)
  )
  // Total Expenses + Total Credit Interest — via the Expenses relation.
  const chargedExpenses = liveExpenses.filter((e) => e.accountId === account.id)
  const totalExpenseAmount = round2(chargedExpenses.reduce((s, e) => s + e.amount, 0))
  const totalInterest = round2(chargedExpenses.reduce((s, e) => s + e.interest, 0))
  // Total Pasabuy — Pasabuy Received Amount via the Pasabuy Account Receiver relation.
  const totalPasabuy = round2(
    liveExpenses
      .filter((e) => e.pasabuyAccountReceiverId === account.id)
      .reduce((s, e) => s + pasabuyReceivedAmount(e, ctx.expenseCategoryName(e.categoryId)), 0)
  )
  // Total CC, Debt & Transfer — Transaction Amount via the Transacted Account relation.
  const totalTransfer = round2(
    liveIncomes
      .filter((i) => i.transactedAccountId === account.id)
      .reduce((s, i) => s + transactionAmount(i, ctx.incomeCategoryName(i.categoryId)), 0)
  )

  const currentBalance = round2(
    totalIncomes - (totalExpenseAmount + totalInterest) + totalPasabuy + totalTransfer
  )

  const availableLimit =
    account.creditLimit && account.creditLimit > 0
      ? round2(Math.min(account.creditLimit + currentBalance, account.creditLimit))
      : null

  return {
    currentBalance,
    availableLimit,
    totalIncomes,
    totalExpenses: round2(totalExpenseAmount + totalInterest)
  }
}

/** Map of accountId → derived balance, for a set of accounts against all-time records. */
export function computeAccountBalances(
  accounts: AccountDto[],
  incomes: IncomeRecordDto[],
  expenses: ExpenseRecordDto[],
  ctx: BalanceContext = EMPTY_CONTEXT
): Map<string, AccountBalance> {
  return new Map(accounts.map((a) => [a.id, computeAccountBalance(a, incomes, expenses, ctx)]))
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
export function dashboardSummary(
  month: string,
  snap: FinanceSnapshot,
  ctx?: BalanceContext
): DashboardSummary {
  const monthIncomes = filterByMonth(snap.incomes.filter(notDeleted), 'date', month)
  const monthExpenses = filterByMonth(snap.expenses.filter(notDeleted), 'purchaseDate', month)

  const totalIncome = roundMoney(monthIncomes.reduce((sum, i) => sum + netIncome(i), 0))
  const totalExpense = roundMoney(
    monthExpenses.reduce((sum, e) => sum + e.amount + e.interest, 0)
  )

  const balances = computeAccountBalances(snap.accounts, snap.incomes, snap.expenses, ctx)
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
