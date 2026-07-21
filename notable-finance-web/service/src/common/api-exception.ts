import { HttpException } from '@nestjs/common';

export type ApiErrorCode =
  | 'NOTION_API_ERROR'
  | 'NOTION_RATE_LIMITED'
  | 'SCHEMA_DRIFT_DETECTED'
  | 'CONFLICT_ERROR'
  | 'SYNC_PARTIAL_FAILURE'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'EMAIL_EXISTS'
  | 'INVALID_CREDENTIALS'
  | 'USER_NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR';

export class ApiException extends HttpException {
  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown,
  ) {
    super({ code, message, details }, status);
  }
}
