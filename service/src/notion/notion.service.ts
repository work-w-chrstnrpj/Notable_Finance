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

@Injectable()
export class NotionService {
  private readonly accounts: AccountDto[] = [
    {
      id: 'acct-bdo-checking',
      name: 'BDO Checking',
      type: 'Cash',
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
      monthlyEarnings: 85000,
      monthlyExpenditure: 5000,
      monthlyGross: 80000,
      earningPercentage: 74.4,
    },
    {
      id: 'inc-freelance',
      source: 'Freelance',
      monthlyEarnings: 25000,
      monthlyExpenditure: 2500,
      monthlyGross: 22500,
      earningPercentage: 20.9,
    },
    {
      id: 'inc-savings',
      source: 'Savings',
      monthlyEarnings: 0,
      monthlyExpenditure: 0,
      monthlyGross: 0,
      earningPercentage: 0,
    },
    {
      id: 'inc-transfer',
      source: 'Transfer',
      monthlyEarnings: 0,
      monthlyExpenditure: 0,
      monthlyGross: 0,
      earningPercentage: 0,
    },
    {
      id: 'inc-cc-payment',
      source: 'Credit Card Payment',
      monthlyEarnings: 0,
      monthlyExpenditure: 0,
      monthlyGross: 0,
      earningPercentage: 0,
    },
    {
      id: 'inc-iou',
      source: 'IOU',
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

  constructor(
    private readonly appConfig: AppConfigService,
    private readonly mappingService: MappingService,
    private readonly validationService: ValidationService,
  ) {}

  list(resource: ResourceName, query: ListQuery = {}) {
    const records = this.getCollection(resource);
    return this.applyQuery(resource, records, query);
  }

  detail(resource: ResourceName, id: string) {
    const record = this.getCollection(resource).find((item) => item.id === id);
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

  create(resource: ResourceName, data: Record<string, unknown>) {
    this.validationService.validateMutation(resource, 'create', data);
    const record = this.makeRecord(resource, data);
    this.getMutableCollection(resource).push(record);
    this.addSyncEvent('create', resource, `Created ${record.id}`);
    return clone(record);
  }

  update(resource: ResourceName, id: string, data: Record<string, unknown>) {
    this.validationService.validateMutation(resource, 'update', data);
    const collection = this.getMutableCollection(resource);
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

  delete(resource: ResourceName, id: string) {
    this.validationService.validateMutation(resource, 'delete');
    const mapping = this.mappingService.get(resource);
    const collection = this.getMutableCollection(resource);
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
      };
    } else if (mapping.deletePolicy === 'expenseSoftDelete' && 'amount' in record) {
      collection[index] = {
        ...record,
        description: `${record.description} [Deleted: ${record.amount}]`,
        amount: 0,
        deleted: true,
      };
    }
    this.addSyncEvent('delete', resource, `Soft-deleted ${id}`);
    return clone(collection[index]);
  }

  pull(resources: ResourceName[], scope?: { month?: string; viewMode?: string }) {
    return resources.reduce<Record<string, FinanceRecord[]>>((snapshot, resource) => {
      snapshot[resource] = this.list(resource, {
        month: scope?.month,
        viewMode: scope?.viewMode,
        expenseViewMode: scope?.viewMode,
      }) as FinanceRecord[];
      return snapshot;
    }, {});
  }

  commit(operations: SyncOperation[], returnFreshSnapshot = false, snapshotMonth?: string) {
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
        const result =
          operation.action === 'create'
            ? this.create(operation.resource, operation.data ?? {})
            : operation.action === 'update'
              ? this.update(operation.resource, this.requireId(operation), operation.data ?? {})
              : this.delete(operation.resource, this.requireId(operation));
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
        ? this.pull(['accounts', 'incomeCategories', 'expenseCategories', 'incomes', 'expenses'], {
            month: snapshotMonth,
            viewMode: 'monthly',
          })
        : undefined,
    };
  }

  syncStatus() {
    return {
      lastSyncAt: this.syncEvents.at(-1)?.timestamp ?? null,
      pendingOperationCount: 0,
      failedOperationCount: this.syncEvents.filter((event) => event.type === 'error').length,
      schemaStatus: this.schemaStatus().status,
    };
  }

  schemaStatus() {
    const missing = this.appConfig.missingRequiredNotionConfig;
    const configured = missing.length === 0;
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

  dashboardSummary(month: string) {
    const incomes = this.filterByMonth(this.incomes, 'date', month).filter(
      (record) => !record.deleted,
    );
    const expenses = this.filterByMonth(this.expenses, 'purchaseDate', month).filter(
      (record) => !record.deleted,
    );
    const totalIncome = roundMoney(
      incomes.reduce((sum, item) => sum + item.grossIncome - item.capitalExpenditure, 0),
    );
    const totalExpense = roundMoney(
      expenses.reduce((sum, item) => sum + item.amount + item.interest, 0),
    );
    const totalCashFlow = roundMoney(
      this.accounts
        .filter((account) => !account.inactive && !this.isCreditLike(account.type))
        .reduce((sum, account) => sum + account.currentBalance, 0),
    );

    return {
      month,
      totalIncome,
      totalExpense,
      grossMargin: roundMoney(totalIncome - totalExpense),
      totalCashFlow,
      activeAccountCount: this.accounts.filter((account) => !account.inactive).length,
      pendingExpenseCount: expenses.filter((expense) => expense.datePaid === null).length,
    };
  }

  monthlyMonitoring(month: string) {
    const incomes = this.filterByMonth(this.incomes, 'date', month).filter(
      (record) => !record.deleted,
    );
    const expenses = this.filterByMonth(this.expenses, 'purchaseDate', month).filter(
      (record) => !record.deleted,
    );
    const monthlyGrossIncome = roundMoney(
      incomes.reduce((sum, item) => sum + item.grossIncome, 0),
    );
    const monthlyIncome = roundMoney(
      incomes.reduce((sum, item) => sum + item.grossIncome - item.capitalExpenditure, 0),
    );
    const monthlyExpense = roundMoney(
      expenses.reduce((sum, item) => sum + item.amount + item.interest, 0),
    );
    const categoryRows = this.expenseCategories.map((category) => {
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
      incomeCategories: this.incomeCategories.map((category) => ({
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

  private getCollection(resource: ResourceName): FinanceRecord[] {
    if (resource === 'accounts') return this.accounts;
    if (resource === 'incomeCategories') return this.incomeCategories;
    if (resource === 'expenseCategories') return this.expenseCategories;
    if (resource === 'monthlyMonitoring') return [this.monthlyMonitoring(this.currentMonth())];
    if (this.isIncomeBacked(resource)) return this.incomes;
    if (this.isExpenseBacked(resource)) return this.expenses;
    return [];
  }

  private getMutableCollection(resource: ResourceName): MutableFinanceRecord[] {
    if (this.isIncomeBacked(resource)) return this.incomes;
    if (this.isExpenseBacked(resource)) return this.expenses;
    throw new ApiException(
      HttpStatus.FORBIDDEN,
      'FORBIDDEN',
      `${resource} is read-only in the app.`,
      { resource },
    );
  }

  private applyQuery(resource: ResourceName, records: FinanceRecord[], query: ListQuery) {
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
            (item) =>
              'source' in item &&
              !['IOU', 'Transfer', 'Old Income Logger', 'Credit Card Payment', 'Debt Payment']
                .map((source) => source.toLowerCase())
                .includes(String(item.source).toLowerCase()),
          );
    }

    if (this.isIncomeBacked(resource)) {
      filtered = this.filterIncomeBacked(resource, filtered as IncomeRecordDto[], query);
    }

    if (this.isExpenseBacked(resource)) {
      filtered = this.filterExpenseBacked(filtered as ExpenseRecordDto[], query);
    }

    return clone(filtered);
  }

  private filterIncomeBacked(
    resource: ResourceName,
    records: IncomeRecordDto[],
    query: ListQuery,
  ) {
    let filtered = records;
    const mapping = this.mappingService.get(resource);
    if (mapping.fixedCategory) {
      const categoryId = this.findIncomeCategoryId(mapping.fixedCategory);
      filtered = filtered.filter((record) => record.categoryId === categoryId);
    }
    if (resource === 'receivables') {
      filtered = filtered.filter((record) => !record.accountId);
    }
    if (query.month) {
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

  private filterExpenseBacked(records: ExpenseRecordDto[], query: ListQuery) {
    let filtered = records;
    const mode = query.expenseViewMode ?? query.viewMode;
    if (query.month && (!mode || mode.toLowerCase() === 'monthly')) {
      filtered = this.filterByMonth(filtered, 'purchaseDate', query.month);
    }
    if (query.accountId) {
      filtered = filtered.filter((record) => record.accountId === query.accountId);
    }
    if (query.categoryId && query.categoryId !== 'all') {
      if (query.categoryId === 'withoutPasabuy') {
        const pasabuyId = this.findExpenseCategoryId('Pasabuy');
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
    if (mode === 'unpaidPasabuy' || mode === 'Unpaid Pasabuy') {
      const pasabuyId = this.findExpenseCategoryId('Pasabuy');
      filtered = filtered.filter(
        (record) =>
          record.categoryId === pasabuyId &&
          (record.datePaid === null || record.pasabuyStatus !== 'Payment fully received'),
      );
    }
    return filtered;
  }

  private makeRecord(resource: ResourceName, data: Record<string, unknown>) {
    const mapping = this.mappingService.get(resource);
    if (this.isIncomeBacked(resource)) {
      const categoryId =
        mapping.fixedCategory !== undefined
          ? this.findIncomeCategoryId(mapping.fixedCategory)
          : String(data.categoryId);
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
        categoryId,
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

  private filterByMonth<T>(
    records: T[],
    field: keyof T,
    month: string,
  ) {
    return records.filter((record) => String(record[field]).startsWith(month));
  }

  private isIncomeBacked(resource: ResourceName) {
    return [
      'incomes',
      'transactions',
      'transfers',
      'creditCardPayments',
      'alkansya',
      'receivables',
    ].includes(resource);
  }

  private isExpenseBacked(resource: ResourceName) {
    return resource === 'expenses' || resource === 'expenseScheduler';
  }

  private findIncomeCategoryId(source: string) {
    const category = this.incomeCategories.find((item) => item.source === source);
    if (!category) {
      throw new ApiException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'INTERNAL_SERVER_ERROR',
        `Required income category is not configured: ${source}`,
      );
    }
    return category.id;
  }

  private findExpenseCategoryId(name: string) {
    const category = this.expenseCategories.find((item) => item.name === name);
    if (!category) {
      throw new ApiException(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'INTERNAL_SERVER_ERROR',
        `Required expense category is not configured: ${name}`,
      );
    }
    return category.id;
  }

  private currentMonth() {
    return new Date().toISOString().slice(0, 7);
  }

  private isCreditLike(type: string) {
    return type === 'Credit Account' || type === 'BYPL';
  }

  private requireId(operation: SyncOperation) {
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

  private addSyncEvent(type: string, resource: string, description: string) {
    this.syncEvents.push({
      id: randomUUID(),
      type,
      resource,
      description,
      timestamp: nowIso(),
    });
  }
}
