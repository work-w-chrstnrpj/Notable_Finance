import { describe, expect, it } from 'vitest';
import { AppConfigService } from '../config/config.service';
import { MappingService } from '../mapping/mapping.service';
import { ValidationService } from '../validation/validation.service';
import { NotionClientFactory } from './notion-client-factory.service';
import { NotionService } from './notion.service';

const mockConfig = {
  missingRequiredNotionConfig: ['notion.token'],
} as AppConfigService;

const mockClientFactory = {
  getClient: async () => null,
  isGloballyConfigured: false,
} as unknown as NotionClientFactory;

function makeService() {
  const mapping = new MappingService();
  return new NotionService(mockConfig, mapping, new ValidationService(mapping), mockClientFactory);
}

describe('NotionService', () => {
  it('returns active accounts by default', async () => {
    const service = makeService();
    const accounts = await service.list('accounts');
    expect(accounts).not.toContainEqual(
      expect.objectContaining({ id: 'acct-old-wallet' }),
    );
  });

  it('soft-deletes incomes by preserving deleted amount in the title', async () => {
    const service = makeService();
    const deleted = await service.delete('incomes', 'income-july-salary');
    expect(deleted).toMatchObject({
      name: 'July Salary [Deleted: 85000]',
      grossIncome: 0,
      deleted: true,
    });
  });

  it('can exclude auxiliary income categories for normal income forms', async () => {
    const service = makeService();
    const categories = await service.list('incomeCategories', { normalOnly: 'true' });
    expect(categories).not.toContainEqual(
      expect.objectContaining({ source: 'Transfer' }),
    );
    expect(categories).not.toContainEqual(
      expect.objectContaining({ source: 'Credit Card Payment' }),
    );
  });

  it('calculates monthly monitoring from scoped income and expense records', async () => {
    const service = makeService();
    const monitoring = await service.monthlyMonitoring('2026-07');
    expect(monitoring.monthlyGrossIncome).toBe(110000);
    expect(monitoring.monthlyExpense).toBe(24000);
    expect(monitoring.expenseCategories).toContainEqual(
      expect.objectContaining({ name: 'Housing', spending: 12500 }),
    );
  });
});
