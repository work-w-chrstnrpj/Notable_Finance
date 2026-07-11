import type {
  AccountDto,
  ExpenseCategoryDto,
  ExpenseRecordDto,
  IncomeCategoryDto,
  IncomeRecordDto,
} from '../common/finance.types';

// ── Notion property names ───────────────────────────────────────

export const NOTION_PROPERTY_NAMES = {
  accounts: {
    name: 'Account Name',
    type: 'Account Type',
    icon: null,
    information: 'Account Information',
    startingBalance: 'Starting Balance',
    currentBalance: 'Current Balance',
    creditLimit: 'Credit Limit',
    availableLimit: 'Available Limit',
    creditPoints: 'Credit Points',
    annualFee: 'Annual Fee',
    billingDay: 'Billing Day',
    dueDay: 'Due Day',
    inactive: 'Inactive',
  },
  incomeCategories: {
    source: 'Source of Income',
    auxiliary: 'Auxiliary',
    monthlyEarnings: 'Monthly Earnings',
    monthlyExpenditure: 'Monthly Expenditure',
    monthlyGross: 'Monthly Gross Earnings',
    earningPercentage: 'Earning Percentage',
  },
  incomes: {
    name: 'Name',
    date: 'Date',
    grossIncome: 'Gross Income',
    capitalExpenditure: 'Capital Expenditure',
    accountId: 'Accounts',
    categoryId: 'Categories',
    transactedAccountId: 'Transacted Account',
    ccPaymentCoveredId: 'CC Payment Covered',
  },
  expenseCategories: {
    name: 'Categories',
    monthlyBudget: 'Monthly Budget',
    upcomingBudget: 'Upcoming Budget',
    auxiliary: 'Auxiliary',
    spending: 'Spending',
    remaining: 'Remaining',
    overview: 'Overview',
    totalOverview: 'Total Overview',
  },
  expenses: {
    description: 'Purchase description',
    purchaseDate: 'Purchase Date',
    datePaid: 'Date Paid',
    customEndRange: 'Custom end range',
    amount: 'Expense Amount',
    interest: 'Interest',
    accountId: 'Accounts',
    categoryId: 'Categories',
    paymentStatus: 'Payment Status',
    paymentFrequency: 'Payment Frequency',
    periodCount: 'Period count',
    paidPeriod: 'Paid period',
    ccLinkPaymentReceiptId: 'CC Link Payment Receipt',
    pasabuyer: 'Pasabuyer',
    pasabuyStatus: 'Pasabuy Status',
    pasabuyDateOfPayment: 'Pasabuy Date of Payment',
    pasabuyPaidPeriod: 'Pasabuy paid period',
    pasabuyAccountReceiverId: 'Pasabuy Account Receiver',
    pasabuyBalance: 'Pasabuyer Balance',
  },
} as const;

// ── Extraction helpers ──────────────────────────────────────────

function getProp(props: Record<string, unknown>, name: string): unknown {
  return props[name] as unknown;
}

function extractTitle(props: Record<string, unknown>, name: string): string {
  const p = getProp(props, name) as Record<string, unknown> | undefined;
  if (!p) return '';
  const title = p.title as Array<Record<string, unknown>> | undefined;
  return title?.[0]?.plain_text as string ?? '';
}

function extractRichText(props: Record<string, unknown>, name: string): string {
  const p = getProp(props, name) as Record<string, unknown> | undefined;
  if (!p) return '';
  const richText = p.rich_text as Array<Record<string, unknown>> | undefined;
  return richText?.[0]?.plain_text as string ?? '';
}

function extractNumber(
  props: Record<string, unknown>,
  name: string,
): number | null {
  const p = getProp(props, name) as Record<string, unknown> | undefined;
  if (!p) return null;
  const val = p.number as number | null | undefined;
  return val ?? null;
}

function extractSelect(
  props: Record<string, unknown>,
  name: string,
): string | null {
  const p = getProp(props, name) as Record<string, unknown> | undefined;
  if (!p) return null;
  const select = p.select as Record<string, unknown> | null | undefined;
  return select?.name as string ?? null;
}

function extractCheckbox(
  props: Record<string, unknown>,
  name: string,
): boolean {
  const p = getProp(props, name) as Record<string, unknown> | undefined;
  if (!p) return false;
  return (p.checkbox as boolean) ?? false;
}

function extractDate(
  props: Record<string, unknown>,
  name: string,
): string | null {
  const p = getProp(props, name) as Record<string, unknown> | undefined;
  if (!p) return null;
  const date = p.date as Record<string, unknown> | null | undefined;
  return date?.start as string ?? null;
}

function extractRelationFirst(
  props: Record<string, unknown>,
  name: string,
): string | null {
  const p = getProp(props, name) as Record<string, unknown> | undefined;
  if (!p) return null;
  const relation = p.relation as Array<Record<string, unknown>> | undefined;
  return relation?.[0]?.id as string ?? null;
}

function extractFormulaValue(
  props: Record<string, unknown>,
  name: string,
): number | string | boolean | null {
  const p = getProp(props, name) as Record<string, unknown> | undefined;
  if (!p) return null;
  const formula = p.formula as Record<string, unknown> | undefined;
  if (!formula) return null;
  const type = formula.type as string;
  if (type === 'number') return (formula.number as number) ?? null;
  if (type === 'string') return (formula.string as string) ?? null;
  if (type === 'boolean') return (formula.boolean as boolean) ?? null;
  if (type === 'date') {
    const d = formula.date as Record<string, unknown> | null | undefined;
    return d?.start as string ?? null;
  }
  return null;
}

function extractRollupValue(
  props: Record<string, unknown>,
  name: string,
): number | null {
  const p = getProp(props, name) as Record<string, unknown> | undefined;
  if (!p) return null;
  const rollup = p.rollup as Record<string, unknown> | undefined;
  if (!rollup) return null;
  if (rollup.type === 'number') return (rollup.number as number) ?? null;
  if (rollup.type === 'array') return null;
  return null;
}

function extractNumberOrFormula(
  props: Record<string, unknown>,
  name: string,
): number | null {
  const p = getProp(props, name) as Record<string, unknown> | undefined;
  if (!p) return null;
  if (p.type === 'number') return (p.number as number) ?? null;
  if (p.type === 'formula') {
    const formula = p.formula as Record<string, unknown> | undefined;
    if (formula?.type === 'number') return (formula.number as number) ?? null;
  }
  if (p.type === 'rollup') {
    const rollup = p.rollup as Record<string, unknown> | undefined;
    if (rollup?.type === 'number') return (rollup.number as number) ?? null;
  }
  return null;
}

function extractIcon(page: Record<string, unknown>): string | null {
  const icon = page.icon as Record<string, unknown> | null | undefined;
  if (!icon) return null;
  if (icon.type === 'emoji') return icon.emoji as string ?? null;
  const external = icon.external as Record<string, unknown> | undefined;
  if (external) return external.url as string ?? null;
  return null;
}

// ── Page → DTO converters ───────────────────────────────────────

export function pageToAccount(page: Record<string, unknown>): AccountDto {
  const props = page.properties as Record<string, unknown> ?? {};
  const names = NOTION_PROPERTY_NAMES.accounts;
  return {
    id: page.id as string,
    name: extractTitle(props, names.name),
    type: (extractSelect(props, names.type) ?? 'Cash') as AccountDto['type'],
    icon: extractIcon(page),
    information: extractRichText(props, names.information),
    startingBalance: extractNumber(props, names.startingBalance) ?? 0,
    currentBalance: extractNumberOrFormula(props, names.currentBalance) ?? 0,
    creditLimit: extractNumber(props, names.creditLimit),
    availableLimit: extractNumberOrFormula(props, names.availableLimit),
    creditPoints: extractNumber(props, names.creditPoints),
    annualFee: extractNumber(props, names.annualFee),
    billingDay: extractNumber(props, names.billingDay),
    dueDay: extractNumber(props, names.dueDay),
    inactive: extractCheckbox(props, names.inactive),
  };
}

export function pageToIncomeCategory(
  page: Record<string, unknown>,
): IncomeCategoryDto {
  const props = page.properties as Record<string, unknown> ?? {};
  const names = NOTION_PROPERTY_NAMES.incomeCategories;
  return {
    id: page.id as string,
    source: extractTitle(props, names.source),
    auxiliary: extractCheckbox(props, names.auxiliary),
    monthlyEarnings: extractNumberOrFormula(props, names.monthlyEarnings) ?? 0,
    monthlyExpenditure:
      extractNumberOrFormula(props, names.monthlyExpenditure) ?? 0,
    monthlyGross: extractNumberOrFormula(props, names.monthlyGross) ?? 0,
    earningPercentage:
      extractNumberOrFormula(props, names.earningPercentage) ?? 0,
  };
}

export function pageToIncomeRecord(
  page: Record<string, unknown>,
): IncomeRecordDto {
  const props = page.properties as Record<string, unknown> ?? {};
  const names = NOTION_PROPERTY_NAMES.incomes;
  return {
    id: page.id as string,
    name: extractTitle(props, names.name),
    date: extractDate(props, names.date) ?? '',
    grossIncome: extractNumber(props, names.grossIncome) ?? 0,
    capitalExpenditure: extractNumber(props, names.capitalExpenditure) ?? 0,
    accountId: extractRelationFirst(props, names.accountId),
    categoryId: extractRelationFirst(props, names.categoryId) ?? '',
    transactedAccountId: extractRelationFirst(props, names.transactedAccountId),
    ccPaymentCoveredId: extractRelationFirst(props, names.ccPaymentCoveredId),
  };
}

export function pageToExpenseCategory(
  page: Record<string, unknown>,
): ExpenseCategoryDto {
  const props = page.properties as Record<string, unknown> ?? {};
  const names = NOTION_PROPERTY_NAMES.expenseCategories;
  return {
    id: page.id as string,
    name: extractTitle(props, names.name),
    monthlyBudget: extractNumber(props, names.monthlyBudget) ?? 0,
    upcomingBudget: extractNumber(props, names.upcomingBudget) ?? 0,
    auxiliary: (extractSelect(props, names.auxiliary) === 'Yes' ? 'Yes' : 'No') as ExpenseCategoryDto['auxiliary'],
    spending: extractNumberOrFormula(props, names.spending) ?? 0,
    remaining: extractNumberOrFormula(props, names.remaining) ?? 0,
    overview: String(extractFormulaValue(props, names.overview) ?? ''),
    totalOverview: extractNumberOrFormula(props, names.totalOverview) ?? 0,
  };
}

export function pageToExpenseRecord(
  page: Record<string, unknown>,
): ExpenseRecordDto {
  const props = page.properties as Record<string, unknown> ?? {};
  const names = NOTION_PROPERTY_NAMES.expenses;
  const paymentStatus = extractSelect(props, names.paymentStatus) as ExpenseRecordDto['paymentStatus'] | null;
  return {
    id: page.id as string,
    description: extractTitle(props, names.description),
    purchaseDate: extractDate(props, names.purchaseDate) ?? '',
    datePaid: extractDate(props, names.datePaid),
    amount: extractNumber(props, names.amount) ?? 0,
    interest: extractNumber(props, names.interest) ?? 0,
    accountId: extractRelationFirst(props, names.accountId) ?? '',
    categoryId: extractRelationFirst(props, names.categoryId) ?? '',
    paymentStatus: paymentStatus ?? 'Unpaid',
    paymentFrequency: extractSelect(props, names.paymentFrequency) as ExpenseRecordDto['paymentFrequency'] | null,
    periodCount: extractNumber(props, names.periodCount),
    paidPeriod: extractNumber(props, names.paidPeriod),
    ccLinkPaymentReceiptId: extractRelationFirst(props, names.ccLinkPaymentReceiptId),
    pasabuyer: extractSelect(props, names.pasabuyer),
    pasabuyStatus: extractSelect(props, names.pasabuyStatus) as ExpenseRecordDto['pasabuyStatus'] | null,
    pasabuyDateOfPayment: extractDate(props, names.pasabuyDateOfPayment),
    pasabuyPaidPeriod: extractNumber(props, names.pasabuyPaidPeriod),
    pasabuyAccountReceiverId: extractRelationFirst(props, names.pasabuyAccountReceiverId),
    pasabuyBalance: extractNumberOrFormula(props, names.pasabuyBalance) ?? 0,
  };
}

// ── DTO → Notion properties builders ────────────────────────────

function buildTitle(value: string) {
  return { title: [{ text: { content: value } }] };
}

function buildRichText(value: string) {
  return { rich_text: [{ text: { content: value } }] };
}

function buildNumber(value: number | null) {
  return { number: value };
}

function buildSelect(value: string | null) {
  if (value === null || value === undefined) return { select: null };
  return { select: { name: value } };
}

function buildDate(value: string | null) {
  if (value === null || value === undefined) return { date: null };
  return { date: { start: value } };
}

function buildCheckbox(value: boolean) {
  return { checkbox: value };
}

function buildRelation(value: string | null) {
  if (!value) return { relation: [] };
  return { relation: [{ id: value }] };
}

/**
 * Build Notion API properties for creating/updating an Income record.
 * Emits only fields present in `dto` so PATCH payloads don't clobber
 * untouched properties. `categoryOverride` lets callers force a fixed
 * category (used by transfers / receivables / etc.).
 */
export function incomeDtoToProperties(
  dto: Record<string, unknown>,
  options: { categoryOverride?: string } = {},
): Record<string, unknown> {
  const names = NOTION_PROPERTY_NAMES.incomes;
  const properties: Record<string, unknown> = {};

  if (dto.name !== undefined) {
    properties[names.name] = buildTitle(String(dto.name ?? ''));
  }
  if (dto.date !== undefined) {
    properties[names.date] = buildDate(dto.date === null ? null : String(dto.date));
  }
  if (dto.grossIncome !== undefined) {
    properties[names.grossIncome] = buildNumber(Number(dto.grossIncome ?? 0));
  }
  if (dto.capitalExpenditure !== undefined) {
    properties[names.capitalExpenditure] = buildNumber(
      Number(dto.capitalExpenditure ?? 0),
    );
  }
  if (dto.accountId !== undefined) {
    properties[names.accountId] = buildRelation(
      (dto.accountId as string | null) ?? null,
    );
  }
  if (options.categoryOverride !== undefined) {
    properties[names.categoryId] = buildRelation(options.categoryOverride);
  } else if (dto.categoryId !== undefined) {
    properties[names.categoryId] = buildRelation(
      (dto.categoryId as string | null) ?? null,
    );
  }
  if (dto.transactedAccountId !== undefined) {
    properties[names.transactedAccountId] = buildRelation(
      (dto.transactedAccountId as string) ?? null,
    );
  }
  if (dto.ccPaymentCoveredId !== undefined) {
    properties[names.ccPaymentCoveredId] = buildRelation(
      (dto.ccPaymentCoveredId as string) ?? null,
    );
  }
  return properties;
}

/**
 * Build Notion API properties for creating/updating an Expense record.
 * Emits only fields present in `dto` so PATCH payloads don't clobber
 * untouched properties.
 */
export function expenseDtoToProperties(
  dto: Record<string, unknown>,
): Record<string, unknown> {
  const names = NOTION_PROPERTY_NAMES.expenses;
  const properties: Record<string, unknown> = {};

  if (dto.description !== undefined) {
    properties[names.description] = buildTitle(String(dto.description ?? ''));
  }
  if (dto.purchaseDate !== undefined) {
    properties[names.purchaseDate] = buildDate(
      dto.purchaseDate === null ? null : String(dto.purchaseDate),
    );
  }
  if (dto.amount !== undefined) {
    properties[names.amount] = buildNumber(Number(dto.amount ?? 0));
  }
  if (dto.interest !== undefined) {
    properties[names.interest] = buildNumber(Number(dto.interest ?? 0));
  }
  if (dto.accountId !== undefined) {
    properties[names.accountId] = buildRelation(
      (dto.accountId as string | null) ?? null,
    );
  }
  if (dto.categoryId !== undefined) {
    properties[names.categoryId] = buildRelation(
      (dto.categoryId as string | null) ?? null,
    );
  }
  if (dto.paymentStatus !== undefined) {
    properties[names.paymentStatus] = buildSelect(
      (dto.paymentStatus as string) ?? null,
    );
  }
  if (dto.ccLinkPaymentReceiptId !== undefined) {
    properties[names.ccLinkPaymentReceiptId] = buildRelation(
      (dto.ccLinkPaymentReceiptId as string) ?? null,
    );
  }
  if (dto.pasabuyAccountReceiverId !== undefined) {
    properties[names.pasabuyAccountReceiverId] = buildRelation(
      (dto.pasabuyAccountReceiverId as string) ?? null,
    );
  }
  if (dto.datePaid !== undefined) {
    properties[names.datePaid] = buildDate(
      dto.datePaid === null ? null : String(dto.datePaid),
    );
  }
  if (dto.customEndRange !== undefined) {
    properties[names.customEndRange] = buildDate(
      dto.customEndRange === null ? null : String(dto.customEndRange),
    );
  }
  if (dto.paymentFrequency !== undefined) {
    properties[names.paymentFrequency] = buildSelect(
      (dto.paymentFrequency as string) ?? null,
    );
  }
  if (dto.periodCount !== undefined) {
    properties[names.periodCount] = buildNumber(
      dto.periodCount === null ? null : Number(dto.periodCount),
    );
  }
  if (dto.paidPeriod !== undefined) {
    properties[names.paidPeriod] = buildNumber(
      dto.paidPeriod === null ? null : Number(dto.paidPeriod),
    );
  }
  if (dto.pasabuyer !== undefined) {
    properties[names.pasabuyer] = buildSelect(
      (dto.pasabuyer as string) ?? null,
    );
  }
  if (dto.pasabuyStatus !== undefined) {
    properties[names.pasabuyStatus] = buildSelect(
      (dto.pasabuyStatus as string) ?? null,
    );
  }
  if (dto.pasabuyDateOfPayment !== undefined) {
    properties[names.pasabuyDateOfPayment] = buildDate(
      dto.pasabuyDateOfPayment === null
        ? null
        : String(dto.pasabuyDateOfPayment),
    );
  }
  if (dto.pasabuyPaidPeriod !== undefined) {
    properties[names.pasabuyPaidPeriod] = buildNumber(
      dto.pasabuyPaidPeriod === null ? null : Number(dto.pasabuyPaidPeriod),
    );
  }
  if (dto.pasabuyAccountReceiverId !== undefined) {
    properties[names.pasabuyAccountReceiverId] = buildRelation(
      (dto.pasabuyAccountReceiverId as string) ?? null,
    );
  }
  return properties;
}
