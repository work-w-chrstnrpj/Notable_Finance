import { Injectable } from '@nestjs/common';
import { LiveCacheManager } from './live-cache-manager';
import { NotionQueryService } from './notion-query.service';
import {
  ExpenseCategoryDto,
  ExpenseRecordDto,
  IncomeCategoryDto,
  IncomeRecordDto,
  MonthlyMonitoringDto,
} from '../common/finance.types';
import { isCreditLike } from './notion-resource-utils';

const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

/**
 * Owns reporting calculations: dashboardSummary, monthlyMonitoring.
 * Extracted from NotionService (P4-3 step 3) so the service is smaller
 * and reporting logic lives in one cohesive place.
 *
 * Depends on LiveCacheManager + NotionQueryService (not NotionService)
 * to avoid circular DI: NotionService ↔ NotionReportingService.
 */
@Injectable()
export class NotionReportingService {
  constructor(
    private readonly cache: LiveCacheManager,
    private readonly queryService: NotionQueryService,
  ) {}

  async dashboardSummary(month: string, userId?: string): Promise<{
    month: string;
    totalIncome: number;
    totalExpense: number;
    grossMargin: number;
    totalCashFlow: number;
    activeAccountCount: number;
    pendingExpenseCount: number;
  }> {
    // Ensure cache is warm for incomes and accounts
    await this.cache.loadLive(userId, 'incomes');
    await this.cache.loadLive(userId, 'accounts');

    const incomes = this.queryService.applyQuery(
      'incomes',
      this.cache.getCollectedIncomes(userId),
      { month },
      userId,
    ).filter(
      (record) => !('deleted' in record) || !record.deleted,
    ) as IncomeRecordDto[];

    const expenses = this.queryService.applyQuery(
      'expenses',
      this.cache.getCollectedExpenses(userId),
      { month },
      userId,
    ).filter(
      (record) => !('deleted' in record) || !record.deleted,
    ) as ExpenseRecordDto[];

    const accounts = this.cache.getCollectedAccounts(userId);
    const totalIncome = roundMoney(
      incomes.reduce((sum, item) => sum + item.grossIncome - item.capitalExpenditure, 0),
    );
    const totalExpense = roundMoney(
      expenses.reduce((sum, item) => sum + item.amount + item.interest, 0),
    );
    const totalCashFlow = roundMoney(
      accounts
        .filter((account) => !account.inactive && !isCreditLike(account.type))
        .reduce((sum, account) => sum + account.currentBalance, 0),
    );

    return {
      month,
      totalIncome,
      totalExpense,
      grossMargin: roundMoney(totalIncome - totalExpense),
      totalCashFlow,
      activeAccountCount: accounts.filter((account) => !account.inactive).length,
      pendingExpenseCount: expenses.filter((expense) => expense.datePaid === null).length,
    };
  }

  async monthlyMonitoring(month: string, userId?: string): Promise<MonthlyMonitoringDto> {
    // Ensure cache is warm for incomes and accounts
    await this.cache.loadLive(userId, 'incomes');
    await this.cache.loadLive(userId, 'accounts');

    const incomes = this.queryService.applyQuery(
      'incomes',
      this.cache.getCollectedIncomes(userId),
      { month },
      userId,
    ).filter(
      (record) => !('deleted' in record) || !record.deleted,
    ) as IncomeRecordDto[];

    const expenses = this.queryService.applyQuery(
      'expenses',
      this.cache.getCollectedExpenses(userId),
      { month },
      userId,
    ).filter(
      (record) => !('deleted' in record) || !record.deleted,
    ) as ExpenseRecordDto[];

    const expenseCategories = this.cache.getCollectedExpenseCategories(userId);
    const incomeCategories = this.cache.getCollectedIncomeCategories(userId);

    const monthlyGrossIncome = roundMoney(
      incomes.reduce((sum, item) => sum + item.grossIncome, 0),
    );
    const monthlyIncome = roundMoney(
      incomes.reduce((sum, item) => sum + item.grossIncome - item.capitalExpenditure, 0),
    );
    const monthlyExpense = roundMoney(
      expenses.reduce((sum, item) => sum + item.amount + item.interest, 0),
    );
    const categoryRows = expenseCategories.map((category: ExpenseCategoryDto) => {
      const spending = roundMoney(
        expenses
          .filter((expense) => expense.categoryId === category.id)
          .reduce((sum, expense) => sum + expense.amount + expense.interest, 0),
      );
      return {
        id: category.id,
        name: category.name,
        budget: category.monthlyBudget,
        spending,
        remaining: roundMoney(category.monthlyBudget - spending),
        totalOverview:
          monthlyExpense > 0 ? roundMoney((spending / monthlyExpense) * 100) : 0,
      };
    });

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
      incomeCategories: incomeCategories.map((category: IncomeCategoryDto) => ({
        id: category.id,
        source: category.source,
        total: roundMoney(
          incomes
            .filter((income) => income.categoryId === category.id)
            .reduce((sum, income) => sum + income.grossIncome - income.capitalExpenditure, 0),
        ),
      })),
      expenseCategories: categoryRows,
    };
  }
}
