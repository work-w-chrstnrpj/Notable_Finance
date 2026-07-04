import { HttpStatus, Injectable } from '@nestjs/common';
import { ApiException } from '../common/api-exception';
import { MutationAction, ResourceName } from '../common/finance.types';
import { MappingService } from '../mapping/mapping.service';

const createRequiredFields: Partial<Record<ResourceName, string[]>> = {
  incomes: ['name', 'date', 'grossIncome', 'accountId', 'categoryId'],
  transactions: ['name', 'date', 'grossIncome', 'categoryId'],
  transfers: ['name', 'date', 'grossIncome', 'accountId', 'transactedAccountId'],
  creditCardPayments: ['name', 'date', 'grossIncome', 'accountId', 'transactedAccountId'],
  alkansya: ['name', 'date', 'grossIncome', 'accountId'],
  receivables: ['name', 'date', 'grossIncome', 'categoryId'],
  expenses: ['description', 'purchaseDate', 'amount', 'accountId', 'categoryId'],
  expenseScheduler: ['description', 'purchaseDate', 'amount', 'accountId', 'categoryId'],
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

    if (mapping.fixedCategory && data.categoryId !== undefined) {
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
