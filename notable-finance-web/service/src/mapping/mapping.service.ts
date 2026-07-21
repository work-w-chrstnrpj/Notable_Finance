import { Injectable } from '@nestjs/common';
import { ResourceName } from '../common/finance.types';

export interface ResourceMapping {
  resource: ResourceName;
  notionSource: string;
  readOnly: boolean;
  writableFields: string[];
  computedFields: string[];
  hiddenFields: string[];
  /**
   * Income category this workflow is filtered to (for list) and defaults to
   * (for create). When `categoryEditable` is also set, the category is a
   * default that the user may change on write (e.g. Alkansya → move an item
   * out of Savings and back into normal Income).
   */
  fixedCategory?: string;
  categoryEditable?: boolean;
  deletePolicy?: 'incomeSoftDelete' | 'expenseSoftDelete';
}

const incomeWritableFields = [
  'name',
  'date',
  'grossIncome',
  'capitalExpenditure',
  'accountId',
  'categoryId',
];

const transactionWritableFields = [
  ...incomeWritableFields,
  'transactedAccountId',
  'ccPaymentCoveredId',
];

const expenseWritableFields = [
  'description',
  'purchaseDate',
  'datePaid',
  'customEndRange',
  'amount',
  'interest',
  'accountId',
  'categoryId',
  'paymentStatus',
  'paymentFrequency',
  'periodCount',
  'paidPeriod',
  'ccLinkPaymentReceiptId',
  'pasabuyer',
  'pasabuyStatus',
  'pasabuyPaidPeriod',
  'pasabuyDateOfPayment',
  'pasabuyAccountReceiverId',
];

@Injectable()
export class MappingService {
  private readonly mappings = new Map<ResourceName, ResourceMapping>([
    [
      'accounts',
      {
        resource: 'accounts',
        notionSource: "Accounts '25",
        readOnly: true,
        writableFields: [],
        computedFields: ['currentBalance', 'availableLimit'],
        hiddenFields: [],
      },
    ],
    [
      'incomeCategories',
      {
        resource: 'incomeCategories',
        notionSource: "Income Categories '25",
        readOnly: true,
        writableFields: [],
        computedFields: ['monthlyEarnings', 'monthlyGross', 'earningPercentage'],
        hiddenFields: [],
      },
    ],
    [
      'expenseCategories',
      {
        resource: 'expenseCategories',
        notionSource: "Expense Categories '25",
        readOnly: true,
        writableFields: [],
        computedFields: ['spending', 'remaining', 'overview', 'totalOverview'],
        hiddenFields: [],
      },
    ],
    [
      'incomes',
      {
        resource: 'incomes',
        notionSource: "Incomes '25",
        readOnly: false,
        writableFields: incomeWritableFields,
        computedFields: ['netIncome', 'transactionAmount'],
        hiddenFields: ['transactionAmount'],
        deletePolicy: 'incomeSoftDelete',
      },
    ],
    [
      'transactions',
      {
        resource: 'transactions',
        notionSource: "Incomes '25 transaction views",
        readOnly: false,
        writableFields: transactionWritableFields,
        computedFields: ['netIncome', 'transactionAmount'],
        hiddenFields: ['transactionAmount'],
        deletePolicy: 'incomeSoftDelete',
      },
    ],
    [
      'transfers',
      {
        resource: 'transfers',
        notionSource: "Incomes '25 transaction views",
        readOnly: false,
        writableFields: transactionWritableFields,
        computedFields: ['netIncome', 'transactionAmount'],
        hiddenFields: ['transactionAmount'],
        fixedCategory: 'Transfer',
        deletePolicy: 'incomeSoftDelete',
      },
    ],
    [
      'creditCardPayments',
      {
        resource: 'creditCardPayments',
        notionSource: "Incomes '25 transaction views",
        readOnly: false,
        writableFields: transactionWritableFields,
        computedFields: ['netIncome', 'transactionAmount'],
        hiddenFields: ['transactionAmount'],
        fixedCategory: 'Credit Card Payment',
        deletePolicy: 'incomeSoftDelete',
      },
    ],
    [
      'alkansya',
      {
        resource: 'alkansya',
        notionSource: "Incomes '25 transaction views",
        readOnly: false,
        writableFields: transactionWritableFields,
        computedFields: ['netIncome', 'transactionAmount'],
        hiddenFields: ['transactionAmount'],
        fixedCategory: 'Savings',
        categoryEditable: true,
        deletePolicy: 'incomeSoftDelete',
      },
    ],
    [
      'receivables',
      {
        resource: 'receivables',
        notionSource: "Incomes '25 transaction views",
        readOnly: false,
        writableFields: incomeWritableFields,
        computedFields: ['netIncome', 'transactionAmount'],
        hiddenFields: ['transactionAmount'],
        deletePolicy: 'incomeSoftDelete',
      },
    ],
    [
      'expenses',
      {
        resource: 'expenses',
        notionSource: "Expenses '25",
        readOnly: false,
        writableFields: expenseWritableFields,
        computedFields: ['grossPrice', 'installmentAmount', 'paidAmount', 'remainingBalance'],
        hiddenFields: [],
        deletePolicy: 'expenseSoftDelete',
      },
    ],
    [
      'expenseScheduler',
      {
        resource: 'expenseScheduler',
        notionSource: "Expenses '25 scheduler views",
        readOnly: false,
        writableFields: expenseWritableFields,
        computedFields: ['grossPrice', 'installmentAmount', 'paidAmount', 'remainingBalance'],
        hiddenFields: [],
        deletePolicy: 'expenseSoftDelete',
      },
    ],
    [
      'monthlyMonitoring',
      {
        resource: 'monthlyMonitoring',
        notionSource: 'App-calculated month-scoped records',
        readOnly: true,
        writableFields: [],
        computedFields: ['monthlyIncome', 'monthlyExpense', 'grossMargin'],
        hiddenFields: [],
      },
    ],
  ]);

  get(resource: ResourceName) {
    const mapping = this.mappings.get(resource);
    if (!mapping) {
      throw new Error(`Unknown resource mapping: ${resource}`);
    }
    return mapping;
  }

  getAll() {
    return [...this.mappings.values()];
  }

  isReadOnly(resource: ResourceName) {
    return this.get(resource).readOnly;
  }
}
