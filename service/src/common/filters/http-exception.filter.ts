import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Response } from 'express';
import {
  NotionApiError,
  NotionRateLimitError,
  SchemaDriftError,
  ConflictError,
  SyncPartialFailureError,
} from '../errors';
import { LoggingService } from '../../logging/logging.service';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly loggingService: LoggingService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: Record<string, unknown> = {};

    if (exception instanceof NotionRateLimitError) {
      status = HttpStatus.TOO_MANY_REQUESTS;
      code = exception.code;
      message = exception.message;
      details = { retryAfter: exception.retryAfter };
    } else if (exception instanceof NotionApiError) {
      status = exception.statusCode >= 400 && exception.statusCode < 600
        ? exception.statusCode
        : HttpStatus.BAD_GATEWAY;
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof SchemaDriftError) {
      status = HttpStatus.CONFLICT;
      code = exception.code;
      message = exception.message;
      details = { driftDetails: exception.driftDetails };
    } else if (exception instanceof ConflictError) {
      status = HttpStatus.CONFLICT;
      code = exception.code;
      message = exception.message;
      details = {
        resourceId: exception.resourceId,
        resourceName: exception.resourceName,
      };
    } else if (exception instanceof SyncPartialFailureError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = exception.code;
      message = exception.message;
      details = {
        applied: exception.applied,
        failed: exception.failed,
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'object' && exResponse !== null) {
        const r = exResponse as Record<string, unknown>;
        code = (r.code as string) || this.getCodeFromStatus(status);
        message = (r.message as string) || exception.message;
        details = (r.details as Record<string, unknown>) || {};
      } else {
        message = typeof exResponse === 'string' ? exResponse : exception.message;
        code = this.getCodeFromStatus(status);
      }
    } else {
      // Unknown / non-HTTP error — log safely and return generic response
      const errorName =
        exception instanceof Error ? exception.name : 'UnknownError';
      const errorMessage =
        exception instanceof Error ? exception.message : 'Non-error thrown';
      this.loggingService.error(
        `Unhandled exception: ${errorName} — ${errorMessage}`,
        'AllExceptionsFilter',
        {
          errorName,
          errorMessage,
          exceptionType: typeof exception,
        },
      );
    }

    response.status(status).json({
      success: false,
      error: { code, message, details },
    });
  }

  private getCodeFromStatus(status: number): string {
    switch (status) {
      case 400:
        return 'VALIDATION_ERROR';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT_ERROR';
      case 429:
        return 'NOTION_RATE_LIMITED';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
