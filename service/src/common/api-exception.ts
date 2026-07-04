import { HttpException, HttpStatus } from '@nestjs/common';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'NOTION_API_ERROR'
  | 'NOTION_RATE_LIMITED'
  | 'SCHEMA_DRIFT_DETECTED'
  | 'CONFLICT_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'SYNC_PARTIAL_FAILURE'
  | 'INTERNAL_SERVER_ERROR';

export class ApiException extends HttpException {
  constructor(
    status: HttpStatus,
    code: ApiErrorCode,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super({ code, message, details }, status);
  }
}
