// Minimal DTO builders for derivation tests — override only the fields a test cares about.
import type {
  AccountDto,
  ExpenseCategoryDto,
  ExpenseRecordDto,
  IncomeCategoryDto,
  IncomeRecordDto
} from '../src/shared/finance.types'

export function account(over: Partial<AccountDto> = {}): AccountDto {
  return {
    id: 'acc',
    name: 'Account',
    type: 'Cash',
    icon: null,
    information: '',
    startingBalance: 0,
    currentBalance: 0,
    creditLimit: null,
    availableLimit: null,
    creditPoints: null,
    annualFee: null,
    billingDay: null,
    dueDay: null,
    totalIncomes: null,
    totalExpenses: null,
    totalPasabuy: null,
    totalCcDebtTransfer: null,
    qrCode: null,
    inactive: false,
    ...over
  }
}

export function income(over: Partial<IncomeRecordDto> = {}): IncomeRecordDto {
  return {
    id: 'inc',
    name: 'Income',
    date: '2026-07-10',
    grossIncome: 0,
    capitalExpenditure: 0,
    accountId: 'acc',
    categoryId: 'icat',
    ...over
  }
}

export function expense(over: Partial<ExpenseRecordDto> = {}): ExpenseRecordDto {
  return {
    id: 'exp',
    description: 'Expense',
    purchaseDate: '2026-07-12',
    datePaid: '2026-07-12',
    amount: 0,
    interest: 0,
    accountId: 'acc',
    categoryId: 'ecat',
    paymentStatus: 'Paid',
    paymentFrequency: null,
    periodCount: null,
    paidPeriod: null,
    pasabuyer: null,
    pasabuyStatus: null,
    pasabuyDateOfPayment: null,
    pasabuyPaidPeriod: null,
    pasabuyAccountReceiverId: null,
    pasabuyBalance: 0,
    ...over
  }
}

export function expenseCategory(over: Partial<ExpenseCategoryDto> = {}): ExpenseCategoryDto {
  return {
    id: 'ecat',
    name: 'Category',
    monthlyBudget: 0,
    upcomingBudget: 0,
    auxiliary: 'No',
    spending: 0,
    remaining: 0,
    overview: '',
    totalOverview: 0,
    ...over
  }
}

export function incomeCategory(over: Partial<IncomeCategoryDto> = {}): IncomeCategoryDto {
  return {
    id: 'icat',
    source: 'Source',
    auxiliary: false,
    monthlyEarnings: 0,
    monthlyExpenditure: 0,
    monthlyGross: 0,
    earningPercentage: 0,
    ...over
  }
}
