import { describe, expect, it } from 'vitest';
import { AppConfigService } from '../config/config.service';
import { MappingService } from '../mapping/mapping.service';
import { ValidationService } from '../validation/validation.service';
import { NotionService } from './notion.service';

const mockConfig = {
  missingRequiredNotionConfig: ['notion.token'],
} as AppConfigService;

function makeService() {
  const mapping = new MappingService();
  return new NotionService(mockConfig, mapping, new ValidationService(mapping));
}

describe('NotionService', () => {
  it('returns active accounts by default', () => {
    const service = makeService();
    const accounts = service.list('accounts');
    expect(accounts).not.toContainEqual(
      expect.objectContaining({ id: 'acct-old-wallet' }),
    );
  });

  it('soft-deletes incomes by preserving deleted amount in the title', () => {
    const service = makeService();
    const deleted = service.delete('incomes', 'income-july-salary');
    expect(deleted).toMatchObject({
      name: 'July Salary [Deleted: 85000]',
      grossIncome: 0,
      deleted: true,
    });
  });

  it('can exclude auxiliary income categories for normal income forms', () => {
    const service = makeService();
    const categories = service.list('incomeCategories', { normalOnly: 'true' });
    expect(categories).not.toContainEqual(
      expect.objectContaining({ source: 'Transfer' }),
    );
    expect(categories).not.toContainEqual(
      expect.objectContaining({ source: 'Credit Card Payment' }),
    );
  });

  it('calculates monthly monitoring from scoped income and expense records', () => {
    const service = makeService();
    const monitoring = service.monthlyMonitoring('2026-07');
    expect(monitoring.monthlyGrossIncome).toBe(110000);
    expect(monitoring.monthlyExpense).toBe(24000);
    expect(monitoring.expenseCategories).toContainEqual(
      expect.objectContaining({ name: 'Housing', spending: 12500 }),
    );
  });
});
