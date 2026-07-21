import type { ApiErrorCode } from '../api-exception';

export class NotionApiError extends Error {
  public readonly code: ApiErrorCode = 'NOTION_API_ERROR';
  public readonly statusCode: number;
  public readonly details: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 502,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'NotionApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotionRateLimitError extends Error {
  public readonly code: ApiErrorCode = 'NOTION_RATE_LIMITED';
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message);
    this.name = 'NotionRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class SchemaDriftError extends Error {
  public readonly code: ApiErrorCode = 'SCHEMA_DRIFT_DETECTED';
  public readonly driftDetails: Record<string, unknown>;

  constructor(message: string, driftDetails: Record<string, unknown> = {}) {
    super(message);
    this.name = 'SchemaDriftError';
    this.driftDetails = driftDetails;
  }
}

export class ConflictError extends Error {
  public readonly code: ApiErrorCode = 'CONFLICT_ERROR';
  public readonly resourceId: string;
  public readonly resourceName: string;

  constructor(message: string, resourceId: string, resourceName: string) {
    super(message);
    this.name = 'ConflictError';
    this.resourceId = resourceId;
    this.resourceName = resourceName;
  }
}

export class SyncPartialFailureError extends Error {
  public readonly code: ApiErrorCode = 'SYNC_PARTIAL_FAILURE';
  public readonly applied: number;
  public readonly failed: number;

  constructor(message: string, applied: number, failed: number) {
    super(message);
    this.name = 'SyncPartialFailureError';
    this.applied = applied;
    this.failed = failed;
  }
}
