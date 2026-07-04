import { describe, expect, it } from 'vitest';
import { MappingService } from '../mapping/mapping.service';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
  const service = new ValidationService(new MappingService());

  it('rejects mutations for read-only reference resources', () => {
    expect(() =>
      service.validateMutation('accounts', 'update', { name: 'New name' }),
    ).toThrow(/read-only/);
  });

  it('rejects computed or out-of-scope fields before writes', () => {
    expect(() =>
      service.validateMutation('incomes', 'create', {
        name: 'Salary',
        date: '2026-07-04',
        grossIncome: 1000,
        accountId: 'acct',
        categoryId: 'cat',
        netIncome: 1000,
      }),
    ).toThrow(/read-only, computed/);
  });

  it('rejects client category overrides for fixed workflow resources', () => {
    expect(() =>
      service.validateMutation('transfers', 'create', {
        name: 'Move funds',
        date: '2026-07-04',
        grossIncome: 1000,
        accountId: 'source',
        transactedAccountId: 'target',
        categoryId: 'manual',
      }),
    ).toThrow(/fixed to Transfer/);
  });
});
