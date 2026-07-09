import { HttpStatus, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ApiException } from '../common/api-exception';
import {
  AccountDto,
  ExpenseCategoryDto,
  ExpenseRecordDto,
  IncomeCategoryDto,
  IncomeRecordDto,
  ListQuery,
  ResourceName,
  SyncOperation,
} from '../common/finance.types';
import { AppConfigService } from '../config/config.service';
import { MappingService } from '../mapping/mapping.service';
import { ValidationService } from '../validation/validation.service';
import { NotionClientFactory } from './notion-client-factory.service';
import { NotionApiClient } from './notion-api-client';
import {
  pageToAccount,
  pageToExpenseCategory,
  pageToExpenseRecord,
  pageToIncomeCategory,
  pageToIncomeRecord,
  incomeDtoToProperties,
  expenseDtoToProperties,
} from './notion-property-mapper';

export type FinanceRecord =
  | AccountDto
  | IncomeCategoryDto
  | IncomeRecordDto
  | ExpenseCategoryDto
  | ExpenseRecordDto
  | MonthlyMonitoringDto;

type MutableFinanceRecord = IncomeRecordDto | ExpenseRecordDto;

export interface MonthlyMonitoringDto {
  id: string;
  month: string;
  monthlyIncome: number;
  monthlyGrossIncome: number;
  monthlyExpense: number;
  grossMargin: number;
  forNeeds: number;
  forWants: number;
  forSavings: number;
  incomeCategories: Array<{ id: string; source: string; total: number }>;
  expenseCategories: Array<{
    id: string;
    name: string;
    budget: number;
    spending: number;
    remaining: number;
    totalOverview: number;
  }>;
}

const nowIso = () => new Date().toISOString();
const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

interface LiveCache {
  accounts: AccountDto[];
  incomeCategories: IncomeCategoryDto[];
  expenseCategories: ExpenseCategoryDto[];
  incomes: IncomeRecordDto[];
  expenses: ExpenseRecordDto[];
}

@Injectable()
export class NotionService {
  private readonly accounts: AccountDto[] = [
    {
      id: 'acct-bdo-checking',
      name: 'BDO Checking',
      type: 'Cash',
      icon: null,
      information: 'Daily operating account',
      startingBalance: 25000,
      currentBalance: 45230.5,
      creditLimit: null,
      availableLimit: null,
      creditPoints: null,
      annualFee: null,
      billingDay: null,
      dueDay: null,
      inactive: false,
    },
    {
      id: 'acct-bpi-savings',
      name: 'BPI Savings',
      type: 'Savings Account',
      icon: null,
      information: 'Emergency and savings',
      startingBalance: 80000,
      currentBalance: 123450,
      creditLimit: null,
      availableLimit: null,
      creditPoints: null,
      annualFee: null,
      billingDay: null,
      dueDay: null,
      inactive: false,
    },
    {
      id: 'acct-metrobank-card',
      name: 'Metrobank Credit Card',
      type: 'Credit Account',
      icon: null,
      information: 'Primary card',
      startingBalance: 0,
      currentBalance: -45800,
      creditLimit: 150000,
      availableLimit: 104200,
      creditPoints: 1820,
      annualFee: 4500,
      billingDay: 15,
      dueDay: 10,
      inactive: false,
    },
    {
      id: 'acct-bypl',
      name: 'ShopNow BYPL',
      type: 'BYPL',
      icon: null,
      information: 'Installment purchases',
      startingBalance: 0,
      currentBalance: -12800,
      creditLimit: 40000,
      availableLimit: 27200,
      creditPoints: null,
      annualFee: 0,
      billingDay: 3,
      dueDay: 18,
      inactive: false,
    },
    {
      id: 'acct-old-wallet',
      name: 'Old Wallet',
      type: 'Auxiliary',
      icon: null,
      information: 'Legacy account',
      startingBalance: 0,
      currentBalance: 0,
      creditLimit: null,
      availableLimit: null,
      creditPoints: null,
      annualFee: null,
      billingDay: null,
      dueDay: null,
      inactive: true,
    },
  ];

  private readonly incomeCategories: IncomeCategoryDto[] = [
    {
      id: 'inc-employment',
      source: 'Employment',
      auxiliary: false,
      monthlyEarnings: 85000,
      monthlyExpenditure: 5000,
      monthlyGross: 80000,
      earningPercentage: 74.4,
    },
    {
      id: 'inc-freelance',
      source: 'Freelance',
      auxiliary: false,
      monthlyEarnings: 25000,
      monthlyExpenditure: 2500,
      monthlyGross: 22500,
      earningPercentage: 20.9,
    },
    {
      id: 'inc-savings',
      source: 'Savings',
      auxiliary: false,
      monthlyEarnings: 0,
      monthlyExpenditure: 0,
      monthlyGross: 0,
      earningPercentage: 0,
    },
    {
      id: 'inc-transfer',
      source: 'Transfer',
      auxiliary: true,
      monthlyEarnings: 0,
      monthlyExpenditure: 0,
      monthlyGross: 0,
      earningPercentage: 0,
    },
    {
      id: 'inc-cc-payment',
      source: 'Credit Card Payment',
      auxiliary: true,
      monthlyEarnings: 0,
      monthlyExpenditure: 0,
      monthlyGross: 0,
      earningPercentage: 0,
    },
    {
      id: 'inc-iou',
      source: 'IOU',
      auxiliary: true,
      monthlyEarnings: 0,
      monthlyExpenditure: 0,
      monthlyGross: 0,
      earningPercentage: 0,
    },
  ];

  private readonly incomes: IncomeRecordDto[] = [
    {
      id: 'income-july-salary',
      name: 'July Salary',
      date: '2026-07-15',
      grossIncome: 85000,
      capitalExpenditure: 5000,
      accountId: 'acct-bdo-checking',
      categoryId: 'inc-employment',
    },
    {
      id: 'income-project-retainer',
      name: 'Project Retainer',
      date: '2026-07-05',
      grossIncome: 25000,
      capitalExpenditure: 2500,
      accountId: 'acct-bpi-savings',
      categoryId: 'inc-freelance',
    },
  ];

  private readonly expenseCategories: ExpenseCategoryDto[] = [
    {
      id: 'exp-housing',
      name: 'Housing',
      monthlyBudget: 15000,
      upcomingBudget: 15000,
      auxiliary: 'No',
      spending: 12500,
      remaining: 2500,
      overview: '83% used',
      totalOverview: 83.33,
    },
    {
      id: 'exp-food',
      name: 'Food & Dining',
      monthlyBudget: 9000,
      upcomingBudget: 9500,
      auxiliary: 'No',
      spending: 5200,
      remaining: 3800,
      overview: '58% used',
      totalOverview: 57.78,
    },
    {
      id: 'exp-pasabuy',
      name: 'Pasabuy',
      monthlyBudget: 6000,
      upcomingBudget: 6000,
      auxiliary: 'Yes',
      spending: 3500,
      remaining: 2500,
      overview: '58% used',
      totalOverview: 58.33,
    },
  ];

  private readonly expenses: ExpenseRecordDto[] = [
    {
      id: 'expense-rent',
      description: 'Monthly Rent',
      purchaseDate: '2026-07-01',
      datePaid: '2026-07-01',
      amount: 12500,
      interest: 0,
      accountId: 'acct-bdo-checking',
      categoryId: 'exp-housing',
      paymentStatus: 'Paid',
      paymentFrequency: 'Monthly',
      periodCount: null,
      paidPeriod: null,
      pasabuyer: null,
      pasabuyStatus: null,
      pasabuyDateOfPayment: null,
      pasabuyPaidPeriod: null,
      pasabuyAccountReceiverId: null,
    },
    {
      id: 'expense-groceries',
      description: 'Groceries',
      purchaseDate: '2026-07-03',
      datePaid: null,
      amount: 3500,
      interest: 0,
      accountId: 'acct-bdo-checking',
      categoryId: 'exp-food',
      paymentStatus: 'Unpaid',
      paymentFrequency: null,
      periodCount: null,
      paidPeriod: null,
      pasabuyer: null,
      pasabuyStatus: null,
      pasabuyDateOfPayment: null,
      pasabuyPaidPeriod: null,
      pasabuyAccountReceiverId: null,
    },
    {
      id: 'expense-pasabuy',
      description: 'Pasabuy Purchase',
      purchaseDate: '2026-07-05',
      datePaid: null,
      amount: 8000,
      interest: 0,
      accountId: 'acct-bypl',
      categoryId: 'exp-pasabuy',
      paymentStatus: 'Installment',
      paymentFrequency: 'Monthly',
      periodCount: 2,
      paidPeriod: 1,
      pasabuyer: 'Maimai',
      pasabuyStatus: 'Payment partially received (installment)',
      pasabuyDateOfPayment: '2026-07-12',
      pasabuyPaidPeriod: 1,
      pasabuyAccountReceiverId: 'acct-bdo-checking',
    },
  ];

  private readonly syncEvents: Array<{
    id: string;
    type: string;
    resource: string;
    description: string;
    timestamp: string;
  }> = [];

  private liveCaches = new Map<string, LiveCache | null>();

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly mappingService: MappingService,
    private readonly validationService: ValidationService,
    private readonly clientFactory: NotionClientFactory,
  ) {}

  private getLiveCacheKey(userId?: string): string {
    return userId ?? '__env__';
  }

  private async loadLive(userId: string | undefined, resource: ResourceName): Promise<NotionApiClient | null> {
    const key = this.getLiveCacheKey(userId);

    if (this.liveCaches.has(key) && resource !== 'monthlyMonitoring') {
      return null;
    }

    const client = await this.clientFactory.getClient(userId);
    if (!client) return null;

    const [accounts, incomeCategories, incomes, expenseCategories, expenses] =
      await Promise.all([
        client.queryDatabase('accounts'),
        client.queryDatabase('incomeCategories'),
        client.queryDatabase('incomes'),
        client.queryDatabase('expenseCategories'),
        client.queryDatabase('expenses'),
      ]);

    this.liveCaches.set(key, {
      accounts: accounts.map(pageToAccount),
      incomeCategories: incomeCategories.map(pageToIncomeCategory),
      incomes: incomes.map(pageToIncomeRecord),
      expenseCategories: expenseCategories.map(pageToExpenseCategory),
      expenses: expenses.map(pageToExpenseRecord),
    });

    return client;
  }

  private async getLiveClient(userId?: string): Promise<NotionApiClient | null> {
    const key = this.getLiveCacheKey(userId);
    if (this.liveCaches.has(key)) {
      return this.clientFactory.getClient(userId);
    }
    const client = await this.loadLive(userId, 'accounts');
    return client;
  }

  private async loadLiveSingle(
    userId: string | undefined,
    resource: ResourceName,
    pageId: string,
  ): Promise<FinanceRecord | null> {
    const client = await this.clientFactory.getClient(userId);
    if (!client) return null;
    try {
      const page = await client.retrievePage(pageId);
      if (resource === 'accounts') return pageToAccount(page);
      if (resource === 'incomeCategories') return pageToIncomeCategory(page);
      if (resource === 'expenseCategories') return pageToExpenseCategory(page);
      if (this.isIncomeBacked(resource)) return pageToIncomeRecord(page);
      if (this.isExpenseBacked(resource)) return pageToExpenseRecord(page);
      return null;
    } catch {
      return null;
    }
  }

  private refreshCache(userId?: string): void {
    const key = this.getLiveCacheKey(userId);
    this.liveCaches.delete(key);
  }

  get isGloballyConfigured(): boolean {
    return this.clientFactory.isGloballyConfigured;
  }

  private getCollectedAccounts(userId?: string): AccountDto[] {
    const cache = this.liveCaches.get(this.getLiveCacheKey(userId));
    if (cache) return cache.accounts;
    return this.accounts;
  }

  private getCollectedIncomeCategories(userId?: string): IncomeCategoryDto[] {
    const cache = this.liveCaches.get(this.getLiveCacheKey(userId));
    if (cache) return cache.incomeCategories;
    return this.incomeCategories;
  }

  private getCollectedIncomes(userId?: string): IncomeRecordDto[] {
    const cache = this.liveCaches.get(this.getLiveCacheKey(userId));
    if (cache) return cache.incomes;
    return this.incomes;
  }

  private getCollectedExpenseCategories(userId?: string): ExpenseCategoryDto[] {
    const cache = this.liveCaches.get(this.getLiveCacheKey(userId));
    if (cache) return cache.expenseCategories;
    return this.expenseCategories;
  }

  private getCollectedExpenses(userId?: string): ExpenseRecordDto[] {
    const cache = this.liveCaches.get(this.getLiveCacheKey(userId));
    if (cache) return cache.expenses;
    return this.expenses;
  }

  async list(resource: ResourceName, query: ListQuery = {}, userId?: string): Promise<FinanceRecord[]> {
    if (resource === 'monthlyMonitoring') {
      const month = query.month ?? this.currentMonth();
      return [await this.monthlyMonitoring(month, userId)] as FinanceRecord[];
    }
    await this.loadLive(userId, resource);
    const records = this.getCollection(resource, userId);
    return this.applyQuery(resource, records, query, userId);
  }

  async detail(resource: ResourceName, id: string, userId?: string): Promise<FinanceRecord> {
    await this.loadLive(userId, resource);
    const cache = this.liveCaches.get(this.getLiveCacheKey(userId));
    if (cache) {
      const record = this.getCollection(resource, userId).find((item) => item.id === id);
      if (record) return clone(record);
      const liveRecord = await this.loadLiveSingle(userId, resource, id);
      if (liveRecord) return clone(liveRecord);
    }
    const record = this.getCollection(resource, userId).find((item) => item.id === id);
    if (!record) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        `${resource} record was not found.`,
        { resource, id },
      );
    }
    return clone(record);
  }

  async create(resource: ResourceName, data: Record<string, unknown>, userId?: string): Promise<FinanceRecord> {
    await this.loadLive(userId, resource);
    this.validationService.validateMutation(resource, 'create', data);
    const record = this.makeRecord(resource, data);

    const client = await this.getLiveClient(userId);
    if (client) {
      try {
        const properties = this.buildNotionProperties(resource, data);
        const page = client.isConfigured
          ? await client.createPage(resource, properties)
          : null;

        if (page) {
          this.refreshCache(userId);
          const createdRecord = this.isIncomeBacked(resource)
            ? (pageToIncomeRecord(page) as FinanceRecord)
            : (pageToExpenseRecord(page) as FinanceRecord);
          this.addSyncEvent('create', resource, `Created ${createdRecord.id}`);
          return clone(createdRecord);
        }
      } catch (error) {
        this.logError('create', resource, error);
        throw error;
      }
    }

    this.getMutableCollection(resource, userId).push(record as MutableFinanceRecord);
    this.addSyncEvent('create', resource, `Created ${record.id}`);
    return clone(record);
  }

  async update(resource: ResourceName, id: string, data: Record<string, unknown>, userId?: string): Promise<FinanceRecord> {
    await this.loadLive(userId, resource);
    this.validationService.validateMutation(resource, 'update', data);

    const client = await this.getLiveClient(userId);
    if (client) {
      try {
        const properties = this.buildNotionProperties(resource, data);
        const page = await client.updatePage(id, properties);
        this.refreshCache(userId);

        const updatedRecord = this.isIncomeBacked(resource)
          ? (pageToIncomeRecord(page) as FinanceRecord)
          : (pageToExpenseRecord(page) as FinanceRecord);

        this.addSyncEvent('update', resource, `Updated ${id}`);
        return clone(updatedRecord);
      } catch (error) {
        this.logError('update', resource, error);
        throw error;
      }
    }

    const collection = this.getMutableCollection(resource, userId);
    const index = collection.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        `${resource} record was not found.`,
        { resource, id },
      );
    }
    collection[index] = { ...collection[index], ...data } as MutableFinanceRecord;
    this.addSyncEvent('update', resource, `Updated ${id}`);
    return clone(collection[index]);
  }

  async delete(resource: ResourceName, id: string, userId?: string): Promise<FinanceRecord> {
    await this.loadLive(userId, resource);
    this.validationService.validateMutation(resource, 'delete');
    const mapping = this.mappingService.get(resource);

    const client = await this.getLiveClient(userId);
    if (client) {
      try {
        const record = await this.detail(resource, id, userId);
        const softDeleteData =
          mapping.deletePolicy === 'incomeSoftDelete' && 'grossIncome' in record
            ? {
                name: `${(record as IncomeRecordDto).name} [Deleted: ${(record as IncomeRecordDto).grossIncome}]`,
                grossIncome: 0,
              }
            : mapping.deletePolicy === 'expenseSoftDelete' && 'amount' in record
              ? {
                  description: `${(record as ExpenseRecordDto).description} [Deleted: ${(record as ExpenseRecordDto).amount}]`,
                  amount: 0,
                }
              : {};

        const properties = this.buildNotionProperties(resource, softDeleteData as Record<string, unknown>);
        const page = await client.updatePage(id, properties);
        this.refreshCache(userId);

        const deletedRecord = this.isIncomeBacked(resource)
          ? (pageToIncomeRecord(page) as FinanceRecord)
          : (pageToExpenseRecord(page) as FinanceRecord);

        Object.assign(deletedRecord, { deleted: true });
        this.addSyncEvent('delete', resource, `Soft-deleted ${id}`);
        return clone(deletedRecord);
      } catch (error) {
        this.logError('delete', resource, error);
        throw error;
      }
    }

    const collection = this.getMutableCollection(resource, userId);
    const index = collection.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new ApiException(
        HttpStatus.NOT_FOUND,
        'NOT_FOUND',
        `${resource} record was not found.`,
        { resource, id },
      );
    }
    const record = collection[index];
    if (mapping.deletePolicy === 'incomeSoftDelete' && 'grossIncome' in record) {
      collection[index] = {
        ...record,
        name: `${record.name} [Deleted: ${record.grossIncome}]`,
        grossIncome: 0,
        deleted: true,
      } as MutableFinanceRecord;
    } else if (mapping.deletePolicy === 'expenseSoftDelete' && 'amount' in record) {
      collection[index] = {
        ...record,
        description: `${record.description} [Deleted: ${record.amount}]`,
        amount: 0,
        deleted: true,
      } as MutableFinanceRecord;
    }
    this.addSyncEvent('delete', resource, `Soft-deleted ${id}`);
    return clone(collection[index]);
  }

  async pull(
    resources: ResourceName[],
    scope?: { month?: string; viewMode?: string },
    userId?: string,
  ): Promise<Record<string, FinanceRecord[]>> {
    this.refreshCache(userId);
    await this.loadLive(userId, 'accounts');
    const snapshot: Record<string, FinanceRecord[]> = {};
    for (const resource of resources) {
      snapshot[resource] = (await this.list(resource, {
        month: scope?.month,
        viewMode: scope?.viewMode,
        expenseViewMode: scope?.viewMode,
      }, userId)) as FinanceRecord[];
    }
    return snapshot;
  }

  async commit(
    operations: SyncOperation[],
    returnFreshSnapshot = false,
    snapshotMonth?: string,
    userId?: string,
  ): Promise<{
    applied: Array<{ clientOperationId: string; resource: ResourceName; id: string }>;
    failed: Array<{
      clientOperationId: string;
      resource: ResourceName;
      code: string;
      message: string;
      details?: Record<string, unknown>;
    }>;
    freshSnapshot?: Record<string, FinanceRecord[]>;
  }> {
    const applied: Array<{ clientOperationId: string; resource: ResourceName; id: string }> = [];
    const failed: Array<{
      clientOperationId: string;
      resource: ResourceName;
      code: string;
      message: string;
      details?: Record<string, unknown>;
    }> = [];

    for (const operation of operations) {
      try {
        const result: FinanceRecord =
          operation.action === 'create'
            ? await this.create(operation.resource, operation.data ?? {}, userId)
            : operation.action === 'update'
              ? await this.update(operation.resource, this.requireId(operation), operation.data ?? {}, userId)
              : await this.delete(operation.resource, this.requireId(operation), userId);

        applied.push({
          clientOperationId: operation.clientOperationId,
          resource: operation.resource,
          id: result.id,
        });
      } catch (error) {
        const response =
          error instanceof ApiException
            ? (error.getResponse() as {
                code: string;
                message: string;
                details?: Record<string, unknown>;
              })
            : {
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Unexpected sync operation failure.',
              };
        failed.push({
          clientOperationId: operation.clientOperationId,
          resource: operation.resource,
          code: response.code,
          message: response.message,
          details: response.details,
        });
      }
    }

    this.addSyncEvent(
      failed.length > 0 ? 'error' : 'pull',
      'sync',
      `Committed ${applied.length} operations with ${failed.length} failures`,
    );

    return {
      applied,
      failed,
      freshSnapshot: returnFreshSnapshot
        ? await this.pull(
            ['accounts', 'incomeCategories', 'expenseCategories', 'incomes', 'expenses'],
            {
              month: snapshotMonth,
              viewMode: 'monthly',
            },
            userId,
          )
        : undefined,
    };
  }

  async syncStatus(userId?: string): Promise<{
    lastSyncAt: string | null;
    pendingOperationCount: number;
    failedOperationCount: number;
    schemaStatus: string;
  }> {
    const client = await this.clientFactory.getClient(userId);
    const schema = await this.schemaStatus(userId);
    return {
      lastSyncAt: this.syncEvents.at(-1)?.timestamp ?? null,
      pendingOperationCount: 0,
      failedOperationCount: this.syncEvents.filter((event) => event.type === 'error').length,
      schemaStatus: client ? 'live' : (this.clientFactory.isGloballyConfigured ? 'live' : schema.status),
    };
  }

  async schemaStatus(userId?: string): Promise<{
    status: string;
    checkedAt: string;
    configured: boolean;
    missing: string[];
    checks: Array<{
      resource: string;
      notionSource: string;
      status: string;
      requiredWritableFields: string[];
      readOnly: boolean;
    }>;
  }> {
    const client = await this.clientFactory.getClient(userId);
    const missing = this.appConfig.missingRequiredNotionConfig;
    const configured = client !== null;

    if (client) {
      const checks = this.mappingService.getAll().map((mapping) => ({
        resource: mapping.resource,
        notionSource: mapping.notionSource,
        status: 'live' as const,
        requiredWritableFields: mapping.writableFields,
        readOnly: mapping.readOnly,
      }));
      return {
        status: configured ? 'configured' : 'notConfigured',
        checkedAt: nowIso(),
        configured,
        missing,
        checks,
      };
    }

    return {
      status: configured ? 'configured' : 'notConfigured',
      checkedAt: nowIso(),
      configured,
      missing,
      checks: this.mappingService.getAll().map((mapping) => ({
        resource: mapping.resource,
        notionSource: mapping.notionSource,
        status: configured ? 'pendingLiveVerification' : 'notChecked',
        requiredWritableFields: mapping.writableFields,
        readOnly: mapping.readOnly,
      })),
    };
  }

  async dashboardSummary(month: string, userId?: string): Promise<{
    month: string;
    totalIncome: number;
    totalExpense: number;
    grossMargin: number;
    totalCashFlow: number;
    activeAccountCount: number;
    pendingExpenseCount: number;
  }> {
    await this.loadLive(userId, 'incomes');
    await this.loadLive(userId, 'accounts');

    const incomes = (await this.list('incomes', { month }, userId)).filter(
      (record) => !('deleted' in record) || !record.deleted,
    ) as IncomeRecordDto[];

    const expenses = (await this.list('expenses', { month }, userId)).filter(
      (record) => !('deleted' in record) || !record.deleted,
    ) as ExpenseRecordDto[];

    const accounts = this.getCollectedAccounts(userId);
    const totalIncome = roundMoney(
      incomes.reduce((sum, item) => sum + item.grossIncome - item.capitalExpenditure, 0),
    );
    const totalExpense = roundMoney(
      expenses.reduce((sum, item) => sum + item.amount + item.interest, 0),
    );
    const totalCashFlow = roundMoney(
      accounts
        .filter((account) => !account.inactive && !this.isCreditLike(account.type))
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
    await this.loadLive(userId, 'incomes');
    await this.loadLive(userId, 'accounts');

    const incomes = (await this.list('incomes', { month }, userId)).filter(
      (record) => !('deleted' in record) || !record.deleted,
    ) as IncomeRecordDto[];

    const expenses = (await this.list('expenses', { month }, userId)).filter(
      (record) => !('deleted' in record) || !record.deleted,
    ) as ExpenseRecordDto[];

    const expenseCategories = this.getCollectedExpenseCategories(userId);
    const incomeCategories = this.getCollectedIncomeCategories(userId);

    const monthlyGrossIncome = roundMoney(
      incomes.reduce((sum, item) => sum + item.grossIncome, 0),
    );
    const monthlyIncome = roundMoney(
      incomes.reduce((sum, item) => sum + item.grossIncome - item.capitalExpenditure, 0),
    );
    const monthlyExpense = roundMoney(
      expenses.reduce((sum, item) => sum + item.amount + item.interest, 0),
    );
    const categoryRows = expenseCategories.map((category) => {
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
      incomeCategories: incomeCategories.map((category) => ({
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

  private buildNotionProperties(
    resource: ResourceName,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    if (this.isIncomeBacked(resource)) {
      const mapping = this.mappingService.get(resource);
      const categoryOverride =
        mapping.fixedCategory !== undefined
          ? this.findIncomeCategoryId(mapping.fixedCategory)
          : undefined;
      return incomeDtoToProperties(data, { categoryOverride });
    }

    if (this.isExpenseBacked(resource)) {
      return expenseDtoToProperties(data);
    }

    throw new ApiException(
      HttpStatus.INTERNAL_SERVER_ERROR,
      'INTERNAL_SERVER_ERROR',
      `Cannot build Notion properties for resource: ${resource}`,
      { resource },
    );
  }

  private getCollection(resource: ResourceName, userId?: string): FinanceRecord[] {
    if (resource === 'accounts') return this.getCollectedAccounts(userId);
    if (resource === 'incomeCategories') return this.getCollectedIncomeCategories(userId);
    if (resource === 'expenseCategories') return this.getCollectedExpenseCategories(userId);
    if (this.isIncomeBacked(resource)) return this.getCollectedIncomes(userId);
    if (this.isExpenseBacked(resource)) return this.getCollectedExpenses(userId);
    return [];
  }

  private getMutableCollection(resource: ResourceName, userId?: string): MutableFinanceRecord[] {
    if (this.isIncomeBacked(resource)) return this.getCollectedIncomes(userId);
    if (this.isExpenseBacked(resource)) return this.getCollectedExpenses(userId);
    throw new ApiException(
      HttpStatus.FORBIDDEN,
      'FORBIDDEN',
      `${resource} is read-only in the app.`,
      { resource },
    );
  }

  private findIncomeCategoryId(source: string): string {
    const category = this.getCollectedIncomeCategories().find((item) => item.source === source);
    if (!category) {
      throw new ApiException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'INTERNAL_SERVER_ERROR',
        `Required income category is not configured: ${source}`,
      );
    }
    return category.id;
  }

  private findExpenseCategoryId(name: string): string {
    const category = this.getCollectedExpenseCategories().find((item) => item.name === name);
    if (!category) {
      throw new ApiException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'INTERNAL_SERVER_ERROR',
        `Required expense category is not configured: ${name}`,
      );
    }
    return category.id;
  }

  private async applyQuery(
    resource: ResourceName,
    records: FinanceRecord[],
    query: ListQuery,
    userId?: string,
  ): Promise<FinanceRecord[]> {
    let filtered = records.filter((item) => !('deleted' in item) || !item.deleted);

    if (resource === 'accounts') {
      const includeInactive = (query as Record<string, unknown>).includeInactive === 'true';
      filtered = includeInactive
        ? filtered
        : filtered.filter((item) => 'inactive' in item && !item.inactive);
    }

    if (resource === 'incomeCategories') {
      const includeAuxiliary =
        query.includeAuxiliary === 'true' || query.normalOnly !== 'true';
      filtered = includeAuxiliary
        ? filtered
        : filtered.filter(
            (item) => 'auxiliary' in item && !item.auxiliary,
          );
    }

    if (this.isIncomeBacked(resource)) {
      filtered = this.filterIncomeBacked(resource, filtered as IncomeRecordDto[], query, userId);
    }

    if (this.isExpenseBacked(resource)) {
      filtered = this.filterExpenseBacked(filtered as ExpenseRecordDto[], query, userId);
    }

    return clone(filtered);
  }

  private filterIncomeBacked(
    resource: ResourceName,
    records: IncomeRecordDto[],
    query: ListQuery,
    userId?: string,
  ): IncomeRecordDto[] {
    let filtered = records;

    // Workflow views (transfer, credit-card-payment, alkansya) are the Incomes
    // data source filtered to their fixed income category. Receivables are
    // Incomes with no receiving (primary) account yet.
    const mapping = this.mappingService.get(resource);
    if (mapping.fixedCategory !== undefined) {
      const categoryId = this.tryFindIncomeCategoryId(mapping.fixedCategory, userId);
      filtered = categoryId
        ? filtered.filter((record) => record.categoryId === categoryId)
        : [];
    }
    if (resource === 'receivables') {
      filtered = filtered.filter((record) => !record.accountId);
    }
    // The normal Income view excludes auxiliary/workflow-category records so
    // transfers, CC payments, savings, etc. do not appear as plain income.
    if (resource === 'incomes') {
      const auxiliaryIds = this.getAuxiliaryIncomeCategoryIds(userId);
      filtered = filtered.filter(
        (record) => !auxiliaryIds.has(record.categoryId),
      );
    }

    // Daily/Weekly/Monthly/Annually views pass an explicit [rangeStart,rangeEnd];
    // fall back to the month prefix when no range is supplied.
    if (query.rangeStart || query.rangeEnd) {
      filtered = this.filterByRange(filtered, 'date', query.rangeStart, query.rangeEnd);
    } else if (query.month) {
      filtered = this.filterByMonth(filtered, 'date', query.month);
    }
    if (query.accountId) {
      filtered = filtered.filter((record) => record.accountId === query.accountId);
    }
    if (query.categoryId) {
      filtered = filtered.filter((record) => record.categoryId === query.categoryId);
    }
    return filtered;
  }

  private tryFindIncomeCategoryId(source: string, userId?: string): string | undefined {
    const target = source.toLowerCase();
    return this.getCollectedIncomeCategories(userId).find(
      (item) => item.source.toLowerCase() === target,
    )?.id;
  }

  private getAuxiliaryIncomeCategoryIds(userId?: string): Set<string> {
    return new Set(
      this.getCollectedIncomeCategories(userId)
        .filter((item) => item.auxiliary)
        .map((item) => item.id),
    );
  }

  private filterExpenseBacked(
    records: ExpenseRecordDto[],
    query: ListQuery,
    userId?: string,
  ): ExpenseRecordDto[] {
    let filtered = records;
    const mode = this.normalizeExpenseViewMode(query.expenseViewMode ?? query.viewMode);
    const creditAccountIds = this.getCreditAccountIds(userId);
    const today = new Date().toISOString().slice(0, 10);

    // ── View-mode semantics (each is independent of purchase-date range unless
    //    it is one of the calendar views). ─────────────────────────────────
    switch (mode) {
      case 'unpaidPasabuy':
        // Any expense still owed to a pasabuyer, regardless of purchase date.
        filtered = filtered.filter(
          (r) =>
            r.pasabuyStatus === 'Payment not yet receive' ||
            r.pasabuyStatus === 'Payment partially received',
        );
        break;
      case 'toPay':
        // Not yet paid — Date Paid empty, regardless of purchase date.
        filtered = filtered.filter((r) => !r.datePaid);
        break;
      case 'toBuy':
        // Wishlist/planned — no purchase date (or future) OR missing category/account.
        filtered = filtered.filter(
          (r) =>
            !r.purchaseDate ||
            r.purchaseDate > today ||
            !r.categoryId ||
            !r.accountId,
        );
        break;
      case 'installments':
        // Installment plans on a credit account, regardless of purchase date.
        filtered = filtered.filter(
          (r) =>
            r.paymentStatus === 'Installment' &&
            creditAccountIds.has(r.accountId),
        );
        break;
      case 'ccTransactions':
        // Outstanding credit-card charges: unpaid or not-yet-paid on a credit account.
        filtered = filtered.filter(
          (r) =>
            creditAccountIds.has(r.accountId) &&
            (r.paymentStatus === 'Unpaid' || !r.datePaid),
        );
        break;
      case 'daily':
      case 'weekly':
      case 'monthly':
      default:
        if (query.rangeStart || query.rangeEnd) {
          filtered = this.filterByRange(filtered, 'purchaseDate', query.rangeStart, query.rangeEnd);
        } else if (query.month) {
          filtered = this.filterByMonth(filtered, 'purchaseDate', query.month);
        }
        break;
    }

    // ── Common secondary filters ─────────────────────────────────────────
    if (query.accountId) {
      filtered = filtered.filter((record) => record.accountId === query.accountId);
    }
    if (query.categoryId && query.categoryId !== 'all') {
      if (query.categoryId === 'withoutPasabuy') {
        const pasabuyId = this.tryFindExpenseCategoryId('Pasabuy', userId);
        filtered = filtered.filter((record) => record.categoryId !== pasabuyId);
      } else {
        filtered = filtered.filter((record) => record.categoryId === query.categoryId);
      }
    }
    if (query.pasabuyer) {
      filtered = filtered.filter((record) => record.pasabuyer === query.pasabuyer);
    }
    if (query.paymentStatus) {
      filtered = filtered.filter((record) => record.paymentStatus === query.paymentStatus);
    }
    return filtered;
  }

  private normalizeExpenseViewMode(mode?: string): string {
    switch ((mode ?? '').toLowerCase().replace(/\s+/g, '')) {
      case 'unpaidpasabuy':
        return 'unpaidPasabuy';
      case 'topay':
        return 'toPay';
      case 'tobuy':
        return 'toBuy';
      case 'installments':
      case 'installment':
        return 'installments';
      case 'cctransactions':
      case 'cctransaction':
        return 'ccTransactions';
      case 'daily':
        return 'daily';
      case 'weekly':
        return 'weekly';
      case 'monthly':
        return 'monthly';
      default:
        return 'monthly';
    }
  }

  private getCreditAccountIds(userId?: string): Set<string> {
    return new Set(
      this.getCollectedAccounts(userId)
        .filter((a) => this.isCreditLike(a.type))
        .map((a) => a.id),
    );
  }

  private tryFindExpenseCategoryId(name: string, userId?: string): string | undefined {
    const target = name.toLowerCase();
    return this.getCollectedExpenseCategories(userId).find(
      (item) => item.name.toLowerCase() === target,
    )?.id;
  }

  private makeRecord(resource: ResourceName, data: Record<string, unknown>): FinanceRecord {
    if (this.isIncomeBacked(resource)) {
      const grossIncome = Number(data.grossIncome ?? 0);
      const adjustedGross =
        resource === 'alkansya' && grossIncome > 0 ? grossIncome * -1 : grossIncome;
      return {
        id: randomUUID(),
        name: String(data.name),
        date: String(data.date),
        grossIncome: adjustedGross,
        capitalExpenditure: Number(data.capitalExpenditure ?? 0),
        accountId:
          data.accountId === undefined || data.accountId === null
            ? null
            : String(data.accountId),
        categoryId: String(data.categoryId),
        transactedAccountId:
          data.transactedAccountId === undefined || data.transactedAccountId === null
            ? null
            : String(data.transactedAccountId),
        ccPaymentCoveredId:
          data.ccPaymentCoveredId === undefined || data.ccPaymentCoveredId === null
            ? null
            : String(data.ccPaymentCoveredId),
      } satisfies IncomeRecordDto;
    }

    return {
      id: randomUUID(),
      description: String(data.description),
      purchaseDate: String(data.purchaseDate),
      datePaid: data.datePaid === undefined || data.datePaid === null ? null : String(data.datePaid),
      amount: Number(data.amount),
      interest: Number(data.interest ?? 0),
      accountId: String(data.accountId),
      categoryId: String(data.categoryId),
      paymentStatus: (data.paymentStatus ?? 'Unpaid') as ExpenseRecordDto['paymentStatus'],
      paymentFrequency: (data.paymentFrequency ?? null) as ExpenseRecordDto['paymentFrequency'],
      periodCount: data.periodCount === undefined ? null : Number(data.periodCount),
      paidPeriod: data.paidPeriod === undefined ? null : Number(data.paidPeriod),
      ccLinkPaymentReceiptId:
        data.ccLinkPaymentReceiptId === undefined || data.ccLinkPaymentReceiptId === null
          ? null
          : String(data.ccLinkPaymentReceiptId),
      pasabuyer:
        data.pasabuyer === undefined || data.pasabuyer === null ? null : String(data.pasabuyer),
      pasabuyStatus: (data.pasabuyStatus ?? null) as ExpenseRecordDto['pasabuyStatus'],
      pasabuyDateOfPayment:
        data.pasabuyDateOfPayment === undefined || data.pasabuyDateOfPayment === null
          ? null
          : String(data.pasabuyDateOfPayment),
      pasabuyPaidPeriod:
        data.pasabuyPaidPeriod === undefined ? null : Number(data.pasabuyPaidPeriod),
      pasabuyAccountReceiverId:
        data.pasabuyAccountReceiverId === undefined || data.pasabuyAccountReceiverId === null
          ? null
          : String(data.pasabuyAccountReceiverId),
    } satisfies ExpenseRecordDto;
  }

  private filterByMonth<T>(records: T[], field: keyof T, month: string): T[] {
    return records.filter((record) => String(record[field]).startsWith(month));
  }

  /**
   * Inclusive date-range filter on an ISO date string field. Records with an
   * empty date value are excluded. Bounds are compared lexicographically,
   * which is correct for zero-padded YYYY-MM-DD strings.
   */
  private filterByRange<T>(
    records: T[],
    field: keyof T,
    start?: string,
    end?: string,
  ): T[] {
    return records.filter((record) => {
      const value = record[field] ? String(record[field]).slice(0, 10) : '';
      if (!value) return false;
      if (start && value < start) return false;
      if (end && value > end) return false;
      return true;
    });
  }

  private isIncomeBacked(resource: ResourceName): boolean {
    return [
      'incomes',
      'transactions',
      'transfers',
      'creditCardPayments',
      'alkansya',
      'receivables',
    ].includes(resource);
  }

  private isExpenseBacked(resource: ResourceName): boolean {
    return resource === 'expenses' || resource === 'expenseScheduler';
  }

  private currentMonth(): string {
    return new Date().toISOString().slice(0, 7);
  }

  private isCreditLike(type: string): boolean {
    return type === 'Credit Account' || type === 'BYPL';
  }

  private requireId(operation: SyncOperation): string {
    if (!operation.id) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'Sync operation id is required for update and delete actions.',
        { operation },
      );
    }
    return operation.id;
  }

  private addSyncEvent(type: string, resource: string, description: string): void {
    this.syncEvents.push({
      id: randomUUID(),
      type,
      resource,
      description,
      timestamp: nowIso(),
    });
  }

  private logError(action: string, resource: ResourceName, error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unknown error';
    this.appConfig['logger']?.error?.(`Failed to ${action} ${resource}: ${message}`);
  }
}
