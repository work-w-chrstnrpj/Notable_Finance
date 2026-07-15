import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/api-exception';
import { MutationAction, ResourceName } from '../common/finance.types';
import { MappingService } from '../mapping/mapping.service';

const createRequiredFields: Partial<Record<ResourceName, string[]>> = {
  // Account and category are intentionally optional on income/expense logs so
  // users can save partial items (e.g. "to buy" or receivable-style records)
  // and fill in the account/category later.
  incomes: ['name', 'date', 'grossIncome'],
  transactions: ['name', 'date', 'grossIncome', 'categoryId'],
  transfers: ['name', 'date', 'grossIncome', 'accountId', 'transactedAccountId'],
  creditCardPayments: ['name', 'date', 'accountId'],
  alkansya: ['name', 'date', 'grossIncome', 'accountId'],
  receivables: ['name', 'accountId'],
  expenses: ['description', 'purchaseDate', 'amount'],
  expenseScheduler: ['description', 'purchaseDate', 'amount'],
};

@Injectable()
export class ValidationService {
  constructor(private readonly mappingService: MappingService) {}

  validateMutation(
    resource: ResourceName,
    action: MutationAction,
    data: Record<string, unknown> = {},
  ) {
    const mapping = this.mappingService.get(resource);

    if (mapping.readOnly) {
      throw new ApiException(
        HttpStatus.FORBIDDEN,
        'FORBIDDEN',
        `${resource} is read-only in the app. Maintain this resource in Notion.`,
        { resource, action },
      );
    }

    if (action === 'delete') {
      return;
    }

    const allowed = new Set(mapping.writableFields);
    const forbidden = Object.keys(data).filter((field) => !allowed.has(field));

    if (forbidden.length > 0) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        'Payload contains read-only, computed, hidden, or out-of-scope fields.',
        { resource, forbiddenFields: forbidden },
      );
    }

    if (
      mapping.fixedCategory &&
      !mapping.categoryEditable &&
      data.categoryId !== undefined
    ) {
      throw new ApiException(
        HttpStatus.BAD_REQUEST,
        'VALIDATION_ERROR',
        `The ${resource} category is fixed to ${mapping.fixedCategory}.`,
        { resource, fixedCategory: mapping.fixedCategory },
      );
    }

    if (action === 'create') {
      const missing = (createRequiredFields[resource] ?? []).filter(
        (field) => data[field] === undefined || data[field] === null || data[field] === '',
      );
      if (missing.length > 0) {
        throw new ApiException(
          HttpStatus.BAD_REQUEST,
          'VALIDATION_ERROR',
          'Required fields are missing.',
          { resource, missingFields: missing },
        );
      }
    }
  }
}
